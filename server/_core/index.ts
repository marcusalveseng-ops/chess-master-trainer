import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createRequestBudget } from "./request-budget";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number, host: string): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  const allowApi = createRequestBudget(120, 60_000);
  const allowTotalApi = createRequestBudget(1500, 60_000);
  // There is no object-ownership record in this application.
  // Retire the legacy proxy instead of signing arbitrary client-supplied paths.
  app.use("/manus-storage", (_req, res) => res.sendStatus(404));
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    (req, res, next) => {
      res.set({ "Cache-Control": "no-store", "X-Request-Id": randomUUID() });
      const origin = req.get("origin");
      const localOrigin = `http://${req.hostname}:${req.socket.localPort}`;
      const expectedOrigin = process.env.APP_ORIGIN ??
        (["localhost", "127.0.0.1"].includes(req.hostname) ? localOrigin : "");
      if ((origin && origin !== expectedOrigin) || req.get("sec-fetch-site") === "cross-site") {
        res.status(403).json({ error: "Origin not allowed" });
        return;
      }
      if (!allowApi(req.ip ?? "unknown") || !allowTotalApi("global")) {
        res.status(429).json({ error: "Request limit exceeded" });
        return;
      }
      next();
    },
    express.json({ limit: "512kb", inflate: false }),
    createExpressMiddleware({
      allowMethodOverride: true,
      maxBatchSize: 10,
      router: appRouter,
      createContext,
      onError({ error, ctx }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error("[API] Internal error", ctx?.res.getHeader("x-request-id"));
        }
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = [400, 413, 415].includes(error.status) ? error.status : 500;
    const requestId = String(res.getHeader("x-request-id") ?? randomUUID());
    if (status === 500) console.error("[HTTP] Internal error", requestId);
    res.status(status).json({ error: "Não foi possível processar a solicitação.", requestId });
  };
  app.use(handleError);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const host = process.env.NODE_ENV === "development" ? "127.0.0.1" : (process.env.HOST || "127.0.0.1");
  const port = await findAvailablePort(preferredPort, host);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
  });
}

void startServer().catch(() => {
  console.error("Não foi possível iniciar o servidor.");
  process.exitCode = 1;
});
