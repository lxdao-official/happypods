import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const milestoneSchema = z.object({
  title: z.string().min(1, "里程碑标题不能为空"),
  description: z.string().min(1, "里程碑描述不能为空"),
  amount: z.number().min(0, "金额必须大于等于0"),
  deadline: z.string().min(1, "截止日期不能为空"),
});

const createPodSchema = z.object({
  grantsPoolId: z.number(),
  rfpIndex: z.number(),
  walletAddress: z.string().min(1, "钱包地址不能为空"),
  avatar: z.string().url().optional(),
  title: z.string().min(1, "项目标题不能为空"),
  description: z.string().min(1, "项目描述不能为空"),
  links: z.any().optional(),
  currency: z.string().min(1, "币种不能为空"),
  tags: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, "至少需要一个里程碑"),
});

const updatePodSchema = z.object({
  id: z.number(),
  avatar: z.string().url().optional(),
  title: z.string().min(1, "项目标题不能为空").optional(),
  description: z.string().min(1, "项目描述不能为空").optional(),
  links: z.any().optional(),
  currency: z.string().min(1, "币种不能为空").optional(),
  tags: z.string().optional(),
  status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
});

export const podRouter = createTRPCRouter({
  // 检查用户信息是否完善
  checkUserProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          name: true,
          email: true,
          description: true,
        },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      const isComplete = !!(user.name && user.email && user.description);
      return { isComplete, user };
    }),

  // 获取Grants Pool详细信息（包含RFP和token信息）
  getGrantsPoolDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.id },
        include: {
          rfps: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }

      // 解析treasury balances获取可用token
      const treasuryBalances = grantsPool.treasuryBalances as Record<string, any> || {};
      const availableTokens = Object.entries(treasuryBalances)
        .filter(([_, balance]) => parseFloat(balance.available || "0") > 0)
        .map(([token, balance]) => ({
          symbol: token,
          available: balance.available,
        }));

      return {
        ...grantsPool,
        availableTokens,
      };
    }),

  // 验证milestone总额
  validateMilestones: publicProcedure
    .input(z.object({
      grantsPoolId: z.number(),
      currency: z.string(),
      milestones: z.array(milestoneSchema),
    }))
    .query(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }

      const treasuryBalances = grantsPool.treasuryBalances as Record<string, any> || {};
      const tokenBalance = treasuryBalances[input.currency];
      
      if (!tokenBalance) {
        throw new Error(`未找到币种 ${input.currency} 的余额信息`);
      }

      const available = parseFloat(tokenBalance.available || "0");
      const totalAmount = input.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

      const isValid = totalAmount <= available;
      
      return {
        isValid,
        totalAmount,
        available,
        currency: input.currency,
      };
    }),

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

  // 获取Pod列表（支持分页、搜索、状态、gpId、我的）
  getList: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().nullish(),
        search: z.string().optional(),
        status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
        grantsPoolId: z.number().optional(),
        myOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, status, grantsPoolId, myOnly } = input;
      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.status = status;
      if (grantsPoolId) where.grantsPoolId = grantsPoolId;
      if (myOnly) where.applicantId = ctx.user.id;

      const pods = await ctx.db.pod.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { select: { id: true, name: true, avatar: true } },
          grantsPool: { select: { id: true, name: true, avatar: true } },
          milestones: { orderBy: { createdAt: "asc" } },
          _count: { select: { milestones: true } },
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (pods.length > limit) {
        const nextItem = pods.pop();
        nextCursor = nextItem!.id;
      }
      return { pods, nextCursor };
    }),

  // 根据ID获取Pod详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: {
          applicant: true,
          grantsPool: true,
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

  // 获取当前用户的Pod列表
  getMyPods: protectedProcedure
    .query(async ({ ctx }) => {
      const pods = await ctx.db.pod.findMany({
        where: { applicantId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          grantsPool: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              milestones: true,
            },
          },
        },
      });

      return pods;
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
}); 