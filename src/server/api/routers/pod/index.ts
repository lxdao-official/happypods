import { createTRPCRouter } from "~/server/api/trpc";
import { podQueries } from "./queries";
import { podMutations } from "./mutations";

export const podRouter = createTRPCRouter({
  // 查询操作
  ...podQueries,
  
  // 变更操作
  ...podMutations,
}); 