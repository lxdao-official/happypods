import { createTRPCRouter } from "~/server/api/trpc";
import { userQueries } from "./queries";
import { userMutations } from "./mutations";

export const userRouter = createTRPCRouter({
  // 查询操作
  ...userQueries,
  
  // 变更操作
  ...userMutations,
}); 