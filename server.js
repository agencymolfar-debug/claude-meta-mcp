// Minimal static server for the Pilgrim Agency site. No dependencies.
// Company details are injected from environment variables so they live
// in Railway settings, not in the code:
//   LEGAL_NAME, NIP, REGON, ADDRESS, EMAIL, PHONE (defaults = CEIDG entry)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const vars = {
  LEGAL_NAME: process.env.LEGAL_NAME || "Andrii Stoliarchuk",
  NIP: process.env.NIP || "5223359396",
  ADDRESS: process.env.ADDRESS || "ul. Drzeworytników 69A, 01-341 Warszawa, Polska",
  EMAIL: process.env.EMAIL || "petatore1@gmail.com",
  PHONE: process.env.PHONE || "+48 501 192 663",
  REGON: process.env.REGON || "543709287",
  YEAR: String(new Date().getFullYear()),
};
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };
const routes = { "/": "index.html", "/privacy": "privacy.html", "/terms": "terms.html", "/data-deletion": "data-deletion.html" };

http.createServer(async (req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = routes[path.replace(/\/$/, "") || "/"] || normalize(path).replace(/^([/\\])+/, "");
  if (file.includes("..")) { res.writeHead(400).end(); return; }
  try {
    let body = await readFile(join(root, file));
    const type = types[extname(file)] || "application/octet-stream";
    if (type.startsWith("text/html")) body = body.toString().replace(/\{\{(\w+)\}\}/g, (_, k) => escape(vars[k] ?? ""));
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "public, max-age=300" }).end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}).listen(process.env.PORT || 8080, "0.0.0.0");

function escape(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
