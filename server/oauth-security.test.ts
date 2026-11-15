import express from "express";
import { once } from "node:events";
import { SignJWT } from "jose";
import { expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { registerOAuthRoutes } from "./_core/oauth";
import { sdk } from "./_core/sdk";

it("requires the app audience and expiration on a signed session", async () => {
  const key = "integration-test-only-key-for-jwt-signing";
  const previous = { ...ENV };
  Object.assign(ENV, { appId: "chess-test", cookieSecret: key });
  try {
    const valid = await sdk.createSessionToken("user-a", { name: "A" });
    expect(await sdk.verifySession(valid)).toMatchObject({ openId: "user-a" });
    const unsignedClaims = new SignJWT({ openId: "user-a", appId: "chess-test", name: "A" })
      .setProtectedHeader({ alg: "HS256" }).setIssuer("chess-master-trainer")
      .setAudience("chess-test").setIssuedAt().setJti("test");
    expect(await sdk.verifySession(await unsignedClaims.sign(new TextEncoder().encode(key))))
      .toBeNull();
    ENV.appId = "another-app";
    expect(await sdk.verifySession(valid)).toBeNull();
  } finally {
    Object.assign(ENV, previous);
  }
});

it("requires a matching browser state and consumes it before exchanging the code", async () => {
  const previous = { ...ENV };
  Object.assign(ENV, {
    appId: "chess-test", cookieSecret: "integration-test-only-key-for-jwt-signing",
    isProduction: false, oAuthServerUrl: "https://provider.invalid",
  });
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  vi.stubEnv("OAUTH_PORTAL_URL", "https://provider.invalid");
  const exchange = vi.spyOn(sdk, "exchangeCodeForToken").mockRejectedValue(new Error("simulated"));
  const app = express();
  registerOAuthRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing HTTP listener");
    const base = `http://127.0.0.1:${address.port}/api/oauth`;
    const start = await fetch(base + "/start", { redirect: "manual" });
    const state = new URL(start.headers.get("location")!).searchParams.get("state");
    const cookie = start.headers.get("set-cookie")!.split(";")[0];
    const callback = base + "/callback?code=test&state=" + state;
    expect((await fetch(callback)).status).toBe(400);
    expect(exchange).not.toHaveBeenCalled();
    expect((await fetch(callback, { headers: { cookie } })).status).toBe(500);
    expect(exchange).toHaveBeenCalledWith("test", "http://localhost:3000/api/oauth/callback");
    expect((await fetch(callback, { headers: { cookie } })).status).toBe(400);
    expect(exchange).toHaveBeenCalledTimes(1);
  } finally {
    server.closeAllConnections();
    server.close();
    exchange.mockRestore();
    vi.unstubAllEnvs();
    Object.assign(ENV, previous);
  }
});
