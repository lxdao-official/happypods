import { createTRPCRouter } from "~/server/api/trpc";
import { podQueries } from "./queries";
import { podMutations } from "./mutations";
import { podDetailQueries } from "./detail-queries";

export const podRouter = createTRPCRouter({
  // 查询操作
  ...podQueries,
  
  // 详情页面查询操作
  ...podDetailQueries,
  
  // 变更操作
  ...podMutations,
}); 