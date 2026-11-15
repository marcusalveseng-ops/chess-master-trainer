import type { CookieOptions, Request } from "express";
import { ENV } from "./env";

export function getSessionCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: ENV.isProduction || req.protocol === "https",
  };
}
