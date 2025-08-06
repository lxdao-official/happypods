import { createTRPCRouter } from "~/server/api/trpc";
import { milestoneMutations } from "./mutations";
import { milestoneQueries } from "./queries";

export const milestoneRouter = createTRPCRouter({
  ...milestoneQueries,
  ...milestoneMutations,
});