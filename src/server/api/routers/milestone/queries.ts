import { MilestoneStatus, PodStatus } from "@prisma/client";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";

export const milestoneQueries = {
    // 获取详情
    getDetail: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.id },
        include: {
          pod: {
            select: {
              currency: true,
            },
          },
        },
      });
      return milestone;
    }),
  // 获取Pod的里程碑详情（包含待交付状态判断）
  getPodMilestones: publicProcedure
    .input(z.object({ podId: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.db.milestone.findMany({
        where: { podId: input.podId },
        orderBy: { deadline: "asc" },
        include: {
          pod: {
            select: {
              status: true,
            },
          },
        },
      });

      // 找到第一个状态为ACTIVE的milestone的index，并且没有待支付的milestone
      const activeMilestone = milestones.find(v=>v.status === MilestoneStatus.ACTIVE);
      const pendingPaymentMilestone = milestones.some(v=>v.status === MilestoneStatus.PENDING_PAYMENT);
      if(activeMilestone && activeMilestone.pod.status === PodStatus.IN_PROGRESS && !pendingPaymentMilestone){
        activeMilestone.status = MilestoneStatus.PENDING_DELIVERY;
      }
      
      return milestones;
    }),
};