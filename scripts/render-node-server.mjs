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
const serverEntry = path.join(root, "dist", "server", "index.js");
const port = Number(process.env.PORT ?? 10000);
const host = "0.0.0.0";

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

function safeClientPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const relative = normalized.startsWith("/") ? normalized.slice(1) : normalized;
  const filePath = path.join(clientRoot, relative);
  if (!filePath.startsWith(clientRoot)) return null;
  return filePath;
}

async function tryStatic(urlPath) {
  let filePath = safeClientPath(urlPath);
  if (!filePath) return null;

  if (urlPath.endsWith("/")) {
    const indexPath = path.join(filePath, "index.html");
    if (existsSync(indexPath)) filePath = indexPath;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;

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

function nodeRequestToFetch(req) {
  const url = `http://${req.headers.host ?? "localhost"}${req.url}`;
  const init = {
    method: req.method,
    headers: req.headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }
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

// Warm worker in background so first real page is faster
getWorker().catch((err) => console.error("[render-node] Worker preload failed:", err));

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
    const request = nodeRequestToFetch(req);
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
  console.log(`[render-node] Listening on http://${host}:${port}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
