import { randomBytes, timingSafeEqual } from "node:crypto";
import { parse } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { createRequestBudget } from "./request-budget";
import { sdk, SESSION_MAX_AGE_MS } from "./sdk";

const stateLifetime = 5 * 60_000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function config(req: Request) {
  const origin = process.env.APP_ORIGIN ??
    (!ENV.isProduction && ["localhost", "127.0.0.1"].includes(req.hostname)
      ? `http://${req.hostname}:${req.socket.localPort}` : "");
  const portal = process.env.OAUTH_PORTAL_URL ?? process.env.VITE_OAUTH_PORTAL_URL;
  if (!origin || !portal || !ENV.appId || !ENV.oAuthServerUrl) return;
  try {
    const app = new URL(origin);
    const provider = new URL(portal);
    if (provider.protocol !== "https:" || (ENV.isProduction && app.protocol !== "https:")) return;
    return { redirectUri: new URL("/api/oauth/callback", app).href, provider };
  } catch {
    return;
  }
}

export function registerOAuthRoutes(app: Express) {
  const allow = createRequestBudget(20, 60_000);
  const allowGlobal = createRequestBudget(120, 60_000);
  const pending = new Map<string, number>();
  const stateCookie = ENV.isProduction ? "__Host-chess_oauth" : "chess_oauth";

  app.use("/api/oauth", (req, res, next) => {
    res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    if (!allow(req.ip ?? "unknown") || !allowGlobal("global")) {
      res.status(429).json({ error: "Too many login requests" });
      return;
    }
    next();
  });

  app.get("/api/oauth/start", (req, res) => {
    const cfg = config(req);
    if (!cfg || !sdk.sessionConfigured()) {
      res.redirect(302, "/?auth=unavailable");
      return;
    }
    const now = Date.now();
    pending.forEach((expires, state) => {
      if (expires <= now) pending.delete(state);
    });
    const state = randomBytes(32).toString("base64url");
    pending.set(state, now + stateLifetime);
    res.cookie(stateCookie, state, { ...getSessionCookieOptions(req), maxAge: stateLifetime });
    cfg.provider.pathname = cfg.provider.pathname.replace(/\/$/, "") + "/app-auth";
    cfg.provider.search = new URLSearchParams({
      appId: ENV.appId,
      redirectUri: cfg.redirectUri,
      state,
      type: "signIn",
    }).toString();
    res.redirect(302, cfg.provider.href);
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const cfg = config(req);
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookie = parse(req.headers.cookie ?? "")[stateCookie];
    if (
      !cfg || !code || code.length > 2048 || !state || !/^[\w-]{43}$/.test(state) ||
      !cookie || !/^[\w-]{43}$/.test(cookie) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(cookie)) ||
      (pending.get(state) ?? 0) <= Date.now()
    ) {
      res.status(400).json({ error: "Invalid or expired login request" });
      return;
    }

    pending.delete(state);
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(stateCookie, cookieOptions);

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, cfg.redirectUri);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId || userInfo.projectId !== ENV.appId) {
        res.status(403).json({ error: "Invalid provider identity" });
        return;
      }
      if (!(await db.getDb())) {
        res.status(503).json({ error: "Login unavailable" });
        return;
      }
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const token = await sdk.createSessionToken(userInfo.openId, { name: userInfo.name });
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
      res.redirect(302, "/");
    } catch {
      console.error("[OAuth] Callback failed");
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
