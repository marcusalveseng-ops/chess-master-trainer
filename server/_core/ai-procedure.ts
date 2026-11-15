import { TRPCError } from "@trpc/server";
import { createRequestBudget } from "./request-budget";
import { protectedProcedure } from "./trpc";

const ipBudget = createRequestBudget(30, 60_000);
const userBudget = createRequestBudget(10, 60_000);
const dailyBudget = createRequestBudget(50, 86_400_000);
const totalBudget = createRequestBudget(500, 86_400_000);
const active = new Set<string>();

export const aiProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = String(ctx.user.id);
  if (
    active.has(user) || active.size >= 4 ||
    !ipBudget(ctx.req.ip ?? ctx.req.socket?.remoteAddress ?? "unknown") ||
    !userBudget(user) || !dailyBudget(user) || !totalBudget("global")
  ) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Limite de análises online atingido. Tente novamente mais tarde ou use a análise local.",
    });
  }
  active.add(user);
  try {
    return await next();
  } finally {
    active.delete(user);
  }
});
