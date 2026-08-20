import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = {
  user: {
    id: 1,
    openId: "versa-test-user",
    name: "Test User",
    email: "test@versa.studio",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

describe("generation.create", () => {
  it("rejects an empty idea before invoking the model", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.generation.create({ kind: "text", idea: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires an authenticated user", async () => {
    const caller = appRouter.createCaller({ ...ctx, user: undefined });
    await expect(caller.generation.create({ kind: "text", idea: "A quiet launch note" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
