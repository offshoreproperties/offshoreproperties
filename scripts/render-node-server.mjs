/**
 * Render production server — native Node HTTP (no wrangler dev).
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(root, "dist", "client");
const publicRoot = path.join(root, "public");
const serverEntry = path.join(root, "dist", "server", "index.js");
const port = Number(process.env.PORT ?? 10000);
const host = "0.0.0.0";

process.on("unhandledRejection", (err) => {
  console.error("[render-node] unhandledRejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("[render-node] uncaughtException:", err);
});

if (!existsSync(serverEntry)) {
  console.error(`[render-node] Missing ${serverEntry}. Run "npm run build" first.`);
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function resolveStaticFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const relative = normalized.startsWith("/") ? normalized.slice(1) : normalized;

  for (const base of [clientRoot, publicRoot]) {
    let filePath = path.join(base, relative);
    if (!filePath.startsWith(base)) continue;
    if (urlPath.endsWith("/")) {
      const indexPath = path.join(filePath, "index.html");
      if (existsSync(indexPath)) filePath = indexPath;
    }
    if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;
  }
  return null;
}

async function tryStatic(urlPath) {
  const filePath = resolveStaticFile(urlPath);
  if (!filePath) return null;

  const body = await readFile(filePath);
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType(filePath),
      "cache-control": filePath.includes(`${path.sep}assets${path.sep}`)
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
    },
  });
}

function getRequestUrl(req) {
  const host =
    req.headers["x-forwarded-host"]?.split(",")[0]?.trim() ??
    req.headers.host ??
    "localhost";
  const proto =
    req.headers["x-forwarded-proto"]?.split(",")[0]?.trim() ??
    (String(host).includes("localhost") ? "http" : "https");
  return `${proto}://${host}${req.url}`;
}

async function readRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  return body.length ? body : undefined;
}

function nodeRequestToFetch(req, body) {
  const url = getRequestUrl(req);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else {
      headers.set(key, value);
    }
  }
  const init = { method: req.method, headers };
  if (body) init.body = body;
  return new Request(url, init);
}

async function sendResponse(nodeRes, response) {
  nodeRes.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    nodeRes.setHeader(key, value);
  });
  if (response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    nodeRes.end(buffer);
  } else {
    nodeRes.end();
  }
}

let workerPromise;
function getWorker() {
  if (!workerPromise) {
    console.log("[render-node] Loading SSR worker…");
    workerPromise = import(pathToFileURL(serverEntry).href).then((mod) => {
      if (!mod.default?.fetch) throw new Error("Server entry missing default.fetch");
      console.log("[render-node] SSR worker ready");
      return mod.default;
    });
  }
  return workerPromise;
}

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };

const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;

    if (pathname === "/health" || pathname === "/healthz") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("ok");
      return;
    }

    const staticResponse = await tryStatic(pathname);
    if (staticResponse) {
      await sendResponse(res, staticResponse);
      return;
    }

    const worker = await getWorker();
    const body = await readRequestBody(req);
    const request = nodeRequestToFetch(req, body);
    const response = await worker.fetch(request, process.env, ctx);
    await sendResponse(res, response);
  } catch (error) {
    console.error("[render-node] Request failed:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Internal Server Error");
    }
  }
});

server.listen(port, host, () => {
  const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`[render-node] Listening on http://${host}:${port} (rss ${mem}MB)`);
  console.log(`[render-node] Static roots: ${clientRoot}, ${publicRoot}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
