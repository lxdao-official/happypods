import { createTRPCRouter } from "~/server/api/trpc";
import { grantsPoolQueries } from "./queries";
import { grantsPoolMutations } from "./mutations";

export const grantsPoolRouter = createTRPCRouter({
  // 查询操作
  ...grantsPoolQueries,
  
  // 变更操作
  ...grantsPoolMutations,
}); 