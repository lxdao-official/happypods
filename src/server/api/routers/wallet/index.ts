import { createTRPCRouter } from "../../trpc";
import { walletQueries } from "./queries";

export const walletRouter = createTRPCRouter({
  ...walletQueries,
});
