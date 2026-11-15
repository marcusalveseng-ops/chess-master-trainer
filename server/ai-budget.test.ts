import { expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createRequestBudget } from "./_core/request-budget";

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM }));

it("rejects an unauthenticated paid analysis before it reaches the provider", async () => {
  const caller = appRouter.createCaller({ user: null } as TrpcContext);
  await expect(caller.gameAnalysis.generateAICommentary({ pgn: "1. e4 *" }))
    .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(invokeLLM).not.toHaveBeenCalled();
});

it("enforces the window and resets the quota at expiration", () => {
  const allow = createRequestBudget(2, 1000);
  expect(allow("a", 0)).toBe(true);
  expect(allow("a", 1)).toBe(true);
  expect(allow("a", 2)).toBe(false);
  expect(allow("b", 2)).toBe(true);
  expect(allow("a", 1000)).toBe(true);
});
