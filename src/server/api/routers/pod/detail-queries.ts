import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const podDetailQueries = {
  // 获取Pod详情（包含完整信息）
  getPodDetail: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              avatar: true,
              walletAddress: true,
              email: true,
              description: true,
              links: true,
            },
          },
          grantsPool: {
            select: {
              id: true,
              name: true,
              avatar: true,
              treasuryBalances: true,
              ownerId: true,
            },
          },
          rfp: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          milestones: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!pod) {
        throw new Error("Pod不存在");
      }

      return pod;
    }),

  // 获取Pod的里程碑详情（包含待交付状态判断）
  getPodMilestones: publicProcedure
    .input(z.object({ podId: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.db.milestone.findMany({
        where: { podId: input.podId },
        orderBy: { deadline: "asc" },
      });

      // 为milestones添加待交付状态判断
      const now = new Date();
      let foundPendingDelivery = false; // 标记是否已找到待交付的milestone
      
      const milestonesWithDeliveryStatus = milestones.map((milestone, index) => {
        // 判断是否为待交付状态：
        // 1. 状态为ACTIVE
        // 2. 当前时间已超过deadline  
        // 3. 是第一个符合条件的milestone（前面的milestone必须已完成）
        const isOverdue = milestone.status === "ACTIVE" && new Date(milestone.deadline) < now;
        
        // 检查前面的milestone是否都已完成
        const previousMilestonesCompleted = milestones
          .slice(0, index)
          .every(m => m.status === "COMPLETED");
        
        const isPendingDelivery = isOverdue && previousMilestonesCompleted && !foundPendingDelivery;
        
        // 如果找到第一个待交付的milestone，标记为已找到
        if (isPendingDelivery) {
          foundPendingDelivery = true;
        }

        // 返回milestone，如果是第一个待交付的，将状态改为PENDING_DELIVERY
        return {
          ...milestone,
          status: isPendingDelivery ? "PENDING_DELIVERY" : milestone.status,
          isPendingDelivery,
        };
      });

      milestones.forEach((v,index)=>{
        if(v.status === "ACTIVE" && new Date(v.deadline) < now && milestones.slice(0,index).every(m=>m.status === "COMPLETED")){
          // @ts-ignore
          v.status = "PENDING_DELIVERY";
        }
      })

      return milestones;
    }),

  // 获取Pod历史记录（查询相同podGroupId的所有版本）
  getPodHistory: publicProcedure
    .input(z.object({ podId: z.number() }))
    .query(async ({ ctx, input }) => {
      // 首先获取当前 Pod 的 podGroupId
      const currentPod = await ctx.db.pod.findUnique({
        where: { id: input.podId },
        select: { podGroupId: true }
      });

      if (!currentPod) {
        throw new Error("Pod不存在");
      }

      // 查询相同 podGroupId 的所有 Pod 版本
      const podVersions = await ctx.db.pod.findMany({
        where: { podGroupId: currentPod.podGroupId },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          grantsPool: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          milestones: {
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { milestones: true }
          }
        },
        orderBy: [
          { inactiveTime: 'asc' }, // 活跃版本（null）排在前面
          { createdAt: 'desc' }    // 然后按创建时间倒序
        ]
      });

      // 构建历史记录
      const history: Array<{
        id: number;
        podId: number;
        date: string;
        status: "deprecated" | "rejected" | "pending" | "current";
        description: string;
        title: string;
        author: {
          id: number;
          name: string | null;
          avatar: string | null;
        };
        isActive: boolean;
        inactiveTime: Date | null;
      }> = [];

      podVersions.forEach((pod, index) => {
        const isActive = pod.inactiveTime === null;
        
        history.push({
          id: index + 1,
          podId: pod.id,
          date: pod.createdAt.toISOString(),
          status: isActive ? "current" : "deprecated",
          description: `V${index + 1}: ${pod.title}`,
          title: pod.title,
          author: pod.applicant,
          isActive,
          inactiveTime: pod.inactiveTime,
        });
      });

      return {
        podGroupId: currentPod.podGroupId,
        versions: history,
        totalVersions: history.length,
        activeVersion: history.find(v => v.isActive) || null
      };
    }),
};