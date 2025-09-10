import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user/index";
import { authRouter } from "./routers/auth/index";
import { podRouter } from "./routers/pod/index";
import { grantsPoolRouter } from "./routers/grants-pool/index";
import { notificationRouter } from "./routers/notification/index";
import { milestoneRouter } from "./routers/milestone/index";
import { walletRouter } from "./routers/wallet/index";
import { uploadRouter } from "./routers/upload";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  pod: podRouter,
  grantsPool: grantsPoolRouter,
  notification: notificationRouter,
  milestone: milestoneRouter,
  wallet: walletRouter,
  upload: uploadRouter,
});

// 导入监控服务
// import "~/server/monitor";

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.user.getAll();
 *       ^? User[]
 */
export const createCaller = createCallerFactory(appRouter);
