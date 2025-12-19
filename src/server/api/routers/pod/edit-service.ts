import { NotificationService } from "../notification/notification-service";
import { NotificationType, PodStatus, MilestoneStatus } from "@prisma/client";
import { getBalance } from "../wallet/queries";
import type { PrismaClient } from "@prisma/client";
import { formatDate } from "~/lib/utils";
import { handlePodTermited } from "./mutations";
import Decimal from "decimal.js";

interface EditPodInput {
  id: number;
  avatar?: string;
  title: string;
  description: string;
  links?: any;
  tags?: string;
  milestones: Array<{
    id?: number | null; // 数据库ID，新建时为null
    title: string;
    description: string;
    amount: number;
    deadline: string;
  }>;
}

interface EditPodContext {
  db: PrismaClient;
  user: { id: number };
}

type VersionMilestone = {
  id?: number | null;
  title: string;
  description: string;
  amount: number;
  deadline: string;
};

type PodVersion = {
  id: string;
  title: string;
  description: string;
  avatar?: string | null;
  tags?: string | null;
  links?: any;
  status: "REVIEWING";
  createdAt: string;
  updatedAt: string;
  milestones: VersionMilestone[];
};

export class PodEditService {
  static async editPod(ctx: EditPodContext, input: EditPodInput) {
    const { id, milestones, ...podData } = input;

    const originalPod = await this.requireEditablePod(ctx, id);
    await this.validateMilestones(ctx, originalPod, milestones);

    const updatedPod = await this.pushVersion(ctx, originalPod, {
      ...podData,
      milestones,
    });
    await this.notifyEdit(ctx, updatedPod);
    return updatedPod;
  }

  static async reviewLatestVersion(ctx: EditPodContext, podId: number, isApproved: boolean) {
    const pod = await ctx.db.pod.findUnique({
      where: { id: podId },
      select: { versions: true },
    });
    return this.reviewVersion(ctx, podId, pod?.versions?.[0] as PodVersion, isApproved);
  }

  static async reviewVersion(
    ctx: EditPodContext,
    podId: number,
    versionData: PodVersion | undefined,
    isApproved: boolean
  ) {
    const pod = await this.requireReviewablePod(ctx, podId);
    if (!versionData) throw new Error("no pending version to review");

    await ctx.db.pod.update({
      where: { id: podId, status: PodStatus.IN_PROGRESS },
      data: { versions: [] },
    });

    if (isApproved) {
      await this.applyApprovedVersion(ctx, pod, versionData);
    }

    await this.notifyReview(ctx, pod, versionData, isApproved);
    return { success: true };
  }

  private static async requireEditablePod(ctx: EditPodContext, podId: number) {
    const pod = await ctx.db.pod.findUnique({
      where: { id: podId },
      include: { grantsPool: true, milestones: true },
    });

    if (!pod) throw new Error("pod not found");
    if (pod.applicantId !== ctx.user.id) throw new Error("no permission to edit this pod");
    if (pod.status !== PodStatus.IN_PROGRESS) throw new Error("only in progress pod can be edited");

    const hasReviewingVersion = pod.versions.some((v: any) => v.status === "REVIEWING");
    if (hasReviewingVersion) throw new Error("this pod has a version being reviewed, please wait for the review to complete before editing");

    return pod;
  }

  private static async requireReviewablePod(ctx: EditPodContext, podId: number) {
    const pod = await ctx.db.pod.findUnique({
      where: { id: podId },
      include: { grantsPool: true, milestones: true },
    });

    if (!pod) throw new Error("pod not found");
    if (pod.grantsPool.ownerId !== ctx.user.id) throw new Error("no permission to review this pod version");

    return pod;
  }

  private static async validateMilestones(ctx: EditPodContext, originalPod: any, milestones: VersionMilestone[]) {
    if (milestones.length > 3) throw new Error("the number of milestones cannot exceed 3 (excluding completed)");

    const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
    const { rawBalance } = await getBalance({
      address: originalPod.grantsPool.treasuryWallet,
      chainType: originalPod.grantsPool.chainType,
      tokenType: originalPod.currency,
    });

    if (Decimal(totalAmount).div(10**6).gt(Decimal(rawBalance))) throw new Error("grants pool insufficient balance");
  }

  private static buildVersionPayload(originalPod: any, editData: { avatar?: string; title: string; description: string; links?: any; tags?: string; milestones: VersionMilestone[]; }): PodVersion {
    const now = new Date().toISOString();
    return {
      id: `version_${Date.now()}`,
      avatar: editData.avatar ?? originalPod.avatar,
      title: editData.title,
      description: editData.description,
      links: editData.links ?? originalPod.links,
      tags: editData.tags ?? originalPod.tags,
      status: "REVIEWING",
      createdAt: now,
      updatedAt: now,
      milestones: editData.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        amount: m.amount,
        deadline: m.deadline,
      })),
    };
  }

  private static async pushVersion(ctx: EditPodContext, originalPod: any, editData: { avatar?: string; title: string; description: string; links?: any; tags?: string; milestones: VersionMilestone[]; }) {
    const versionPayload = this.buildVersionPayload(originalPod, editData);

    // 更新 Pod 的 versions 字段
    const updatedPod = await ctx.db.pod.update({
      where: { id: originalPod.id },
      data: {
        versions: {
          push: versionPayload,
        },
      },
      include: {
        applicant: true,
        grantsPool: true,
        milestones: true,
      },
    });

    return updatedPod;
  }

  private static async notifyEdit(ctx: EditPodContext, updatedPod: any) {
    await NotificationService.createNotification({
      type: NotificationType.POD_REVIEW,
      senderId: updatedPod.applicantId,
      receiverId: updatedPod.grantsPool.ownerId,
      title: `Pod Edit Review`,
      content: `${updatedPod.applicant.name} edited Pod "${updatedPod.title}"`,
      params: {
        podId: updatedPod.id,
        action: "edit_review",
      },
    });
  }

  private static async applyApprovedVersion(ctx: EditPodContext, existingPod: any, versionData: PodVersion) {
    await ctx.db.pod.update({
      where: { id: existingPod.id },
      data: {
        title: versionData.title,
        description: versionData.description,
        avatar: versionData.avatar,
        tags: versionData.tags,
        links: versionData.links,
      },
    });

    const incomingIds = versionData.milestones.map((v) => v.id).filter(Boolean) as number[];
    const inactiveTargets = existingPod.milestones
      .filter((m: any) => m.status === MilestoneStatus.ACTIVE)
      .filter((m: any) => !incomingIds.includes(m.id));

    if (inactiveTargets.length) {
      await ctx.db.milestone.updateMany({
        where: { id: { in: inactiveTargets.map((m: any) => m.id) } },
        data: { status: MilestoneStatus.INACTIVE, inactiveAt: new Date() },
      });
    }

    const upsertMilestones = versionData.milestones.map((milestone) => {
      const baseData = {
        podId: existingPod.id,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        deadline: new Date(milestone.deadline),
        status: MilestoneStatus.ACTIVE,
      };

      return milestone.id
        ? ctx.db.milestone.update({
            where: { id: Number(milestone.id) },
            data: baseData,
          })
        : ctx.db.milestone.create({ data: baseData });
    });
    await Promise.all(upsertMilestones);

    const hasActiveOrReviewing = versionData.milestones.length > 0;
    if (!hasActiveOrReviewing) {
      await handlePodTermited(ctx.db, existingPod.id, ctx);
    }
  }

  private static async notifyReview(
    ctx: EditPodContext,
    existingPod: any,
    versionData: PodVersion,
    isApproved: boolean
  ) {
    const title = isApproved ? "Pod version approved" : "Pod version rejected";
    const content = isApproved 
      ? `Your Pod "${versionData.title}" version has been approved`
      : `Your ${formatDate(versionData.createdAt)} submitted Pod "${versionData.title}" version has been rejected`;
    const action = isApproved ? 'version_approved' : 'version_rejected';

    await NotificationService.createNotification({
      type: NotificationType.POD_REVIEW,
      senderId: ctx.user.id,
      receiverId: existingPod.applicantId,
      title,
      content,
      params: {
        podId: existingPod.id,
        action
      }
    });
  }
}
