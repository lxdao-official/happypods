import { createTRPCRouter } from "~/server/api/trpc";
import { notificationQueries } from "./queries";
import { notificationMutations } from "./mutations";

export const notificationRouter = createTRPCRouter({
  // 查询操作
  ...notificationQueries,
  
  // 变更操作
  ...notificationMutations,
}); 