import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = "dist";
const assets = {};
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
};

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".htaccess") continue;
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) { await visit(filename); continue; }
    const route = "/" + relative(root, filename).split(sep).join("/");
    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    assets[route] = {
      mimeType: mimeTypes[extension] || "application/octet-stream",
      base64: (await readFile(filename)).toString("base64"),
    };
  }
}

await visit(root);
await mkdir("server/.generated", { recursive: true });
await writeFile("server/.generated/static.ts", `export const embeddedAssets: Record<string, { mimeType: string; base64: string }> = ${JSON.stringify(assets)};\n`);
console.log(`Embedded ${Object.keys(assets).length} static assets`);
