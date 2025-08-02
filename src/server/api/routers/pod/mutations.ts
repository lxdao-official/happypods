import { z } from "zod";
import { protectedProcedure } from "~/server/api/trpc";
import { createPodSchema, updatePodSchema } from "./schemas";

export const podMutations = {
  // 创建Pod
  create: protectedProcedure
    .input(createPodSchema)
    .mutation(async ({ ctx, input }) => {
      // 验证用户信息是否完善
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, email: true, description: true },
      });

      if (!user?.name || !user?.email || !user?.description) {
        throw new Error("请先完善个人信息");
      }

      // 验证Grants Pool和RFP
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
        include: { rfps: true },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }

      // 验证milestone总额
      const treasuryBalances = grantsPool.treasuryBalances as Record<string, any> || {};
      const tokenBalance = treasuryBalances[input.currency];
      
      if (!tokenBalance) {
        throw new Error(`未找到币种 ${input.currency} 的余额信息`);
      }

      const available = parseFloat(tokenBalance.available || "0");
      const totalAmount = input.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

      if (totalAmount > available) {
        throw new Error(`里程碑总额 ${totalAmount} 超过了可用资金 ${available} ${input.currency}`);
      }

      const { milestones, ...podData } = input;

      // 创建Pod
      const pod = await ctx.db.pod.create({
        data: {
          grantsPoolId: podData.grantsPoolId,
          rfpIndex: podData.rfpIndex,
          walletAddress: podData.walletAddress,
          avatar: podData.avatar,
          title: podData.title,
          description: podData.description,
          links: podData.links as any,
          currency: podData.currency,
          tags: podData.tags,
          applicantId: ctx.user.id,
        },
        include: {
          applicant: true,
          grantsPool: true,
        },
      });

      // 创建milestones
      if (milestones && milestones.length > 0) {
        const milestonePromises = milestones.map(milestone => 
          ctx.db.milestone.create({
            data: {
              podId: pod.id,
              title: milestone.title,
              description: milestone.description,
              amount: milestone.amount,
              deadline: new Date(milestone.deadline),
            },
          })
        );
        await Promise.all(milestonePromises);
      }

      return pod;
    }),

  // 更新Pod
  update: protectedProcedure
    .input(updatePodSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 检查Pod是否存在且属于当前用户
      const existingPod = await ctx.db.pod.findUnique({
        where: { id },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      if (existingPod.applicantId !== ctx.user.id && ctx.user.role !== "ADMIN") {
        throw new Error("没有权限修改此Pod");
      }

      const updatedPod = await ctx.db.pod.update({
        where: { id },
        data: updateData,
        include: {
          applicant: true,
          grantsPool: true,
        },
      });

      return updatedPod;
    }),

  // 删除Pod
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingPod = await ctx.db.pod.findUnique({
        where: { id: input.id },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      if (existingPod.applicantId !== ctx.user.id && ctx.user.role !== "ADMIN") {
        throw new Error("没有权限删除此Pod");
      }

      await ctx.db.pod.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
}; 