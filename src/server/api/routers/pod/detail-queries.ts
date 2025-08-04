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

  // 获取Pod的里程碑详情
  getPodMilestones: publicProcedure
    .input(z.object({ podId: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.db.milestone.findMany({
        where: { podId: input.podId },
        orderBy: { createdAt: "asc" },
      });

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