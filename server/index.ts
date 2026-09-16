import "dotenv/config";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { serve } from "@hono/node-server";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../generated/prisma/client";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { embeddedAssets } from "./.generated/static";

const app = new Hono();
const siteId = "main";
const cookieName = "neurops_session";
const sessionSeconds = 60 * 60 * 12;
let prisma: PrismaClient | undefined;
let storage: S3Client | undefined;

function db() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not configured");
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return prisma;
}

function bucket() {
  const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error("Object storage is not configured");
  }
  storage ??= new S3Client({
    endpoint: S3_ENDPOINT,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  });
  return { client: storage, name: S3_BUCKET };
}

function signature(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must have at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function authenticated(cookie: string | undefined) {
  if (!cookie) return false;
  const [expiry, nonce, mac] = cookie.split(".");
  if (!expiry || !nonce || !mac || Number(expiry) < Date.now()) return false;
  const expected = Buffer.from(signature(`${expiry}.${nonce}`), "hex");
  const supplied = Buffer.from(mac, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function sameSecret(a: string, b: string) {
  const left = createHmac("sha256", "neurops-login").update(a).digest();
  const right = createHmac("sha256", "neurops-login").update(b).digest();
  return timingSafeEqual(left, right);
}

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Erro interno do servidor" }, 500);
});

app.use("/api/content", cors({
  origin: ["https://neurops.com.br", "https://www.neurops.com.br"],
  allowMethods: ["GET", "PUT", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.get("/api/content", async (c) => {
  c.header("Cache-Control", "no-store");
  const document = await db().siteDocument.findUnique({ where: { id: siteId } });
  return c.json({ content: document?.content ?? null });
});

app.post("/api/login", async (c) => {
  const body = await c.req.json().catch(() => null) as { username?: string; password?: string } | null;
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password) return c.json({ error: "Administrador não configurado" }, 503);
  if (!body || !sameSecret(body.username ?? "", user) || !sameSecret(body.password ?? "", password)) {
    return c.json({ error: "Credenciais inválidas" }, 401);
  }
  const expiry = String(Date.now() + sessionSeconds * 1000);
  const nonce = randomBytes(16).toString("hex");
  setCookie(c, cookieName, `${expiry}.${nonce}.${signature(`${expiry}.${nonce}`)}`, {
    httpOnly: true, sameSite: "Strict", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: sessionSeconds,
  });
  return c.json({ authenticated: true });
});

app.get("/api/session", (c) => c.json({ authenticated: authenticated(getCookie(c, cookieName)) }));
app.post("/api/logout", (c) => {
  deleteCookie(c, cookieName, { path: "/" });
  return c.json({ authenticated: false });
});

app.put("/api/content", async (c) => {
  if (!authenticated(getCookie(c, cookieName))) return c.json({ error: "Não autorizado" }, 401);
  const raw = await c.req.text();
  if (raw.length > 100_000) return c.json({ error: "Conteúdo muito grande" }, 413);
  let content: unknown;
  try { content = JSON.parse(raw); } catch { return c.json({ error: "JSON inválido" }, 400); }
  if (!content || typeof content !== "object" || Array.isArray(content)) return c.json({ error: "Conteúdo inválido" }, 400);
  await db().siteDocument.upsert({
    where: { id: siteId },
    create: { id: siteId, content: content as Prisma.InputJsonValue },
    update: { content: content as Prisma.InputJsonValue },
  });
  return c.json({ content });
});

app.post("/api/media", async (c) => {
  if (!authenticated(getCookie(c, cookieName))) return c.json({ error: "Não autorizado" }, 401);
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !["image/webp", "image/png", "image/jpeg"].includes(file.type)) {
    return c.json({ error: "Imagem inválida" }, 400);
  }
  if (file.size > 2_000_000) return c.json({ error: "Imagem maior que 2 MB" }, 413);
  const extension = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" }[file.type];
  const key = `${randomUUID()}.${extension}`;
  const { client, name } = bucket();
  await client.send(new PutObjectCommand({
    Bucket: name, Key: key, Body: new Uint8Array(await file.arrayBuffer()), ContentType: file.type,
  }));
  return c.json({ url: `/api/media/${key}` }, 201);
});

app.get("/api/media/:id", async (c) => {
  const key = c.req.param("id");
  if (!/^[a-f0-9-]{36}\.(webp|png|jpg)$/.test(key)) return c.notFound();
  const { client, name } = bucket();
  try {
    const media = await client.send(new GetObjectCommand({ Bucket: name, Key: key }));
    if (!media.Body) return c.notFound();
    const bytes = await media.Body.transformToByteArray();
    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new Response(body, {
      headers: {
        "Content-Type": media.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) return c.notFound();
    throw error;
  }
});

app.get("*", (c) => {
  const path = new URL(c.req.url).pathname;
  const asset = embeddedAssets[path] ?? (path.includes(".") ? null : embeddedAssets["/index.html"]);
  if (!asset) return c.notFound();
  return new Response(Buffer.from(asset.base64, "base64"), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": path === "/index.html" || !path.includes(".") ? "no-cache" : "public, max-age=31536000, immutable",
    },
  });
});

serve({ fetch: app.fetch, port: Number(process.env.PORT || 3000), hostname: "0.0.0.0" });
