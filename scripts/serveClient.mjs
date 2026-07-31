// Static server for dist/client with GitHub Pages directory-index semantics.
// vite preview (SPA appType) rewrites bare /posts/{slug} to /index.html, so
// client routing can mask a missing prerender — this server does not.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/client");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".data": "application/octet-stream",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

if (!fs.existsSync(root)) {
  console.error(`serveClient: missing ${root} — run pnpm build first`);
  process.exit(1);
}

function resolveFile(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0] || "/");
  const relative = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = path.join(root, relative);
  if (!candidate.startsWith(root)) return null;

  try {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  } catch {
    return null;
  }

  // GH Pages: /posts/{slug} and /posts/{slug}/ both resolve to .../index.html
  const index = path.join(candidate, "index.html");
  if (fs.existsSync(index) && fs.statSync(index).isFile()) {
    return index;
  }
  return null;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }

  const file = resolveFile(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not Found");
    return;
  }

  const type = MIME[path.extname(file)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
});
