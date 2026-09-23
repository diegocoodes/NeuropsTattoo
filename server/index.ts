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

type DemonstrationVideoInput = {
  position: number;
  title: string;
  videoUrl: string;
};

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

function demonstrationVideosFrom(content: unknown): DemonstrationVideoInput[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];
  const demonstration = (content as Record<string, unknown>).demonstration;
  if (!demonstration || typeof demonstration !== "object" || Array.isArray(demonstration)) return [];
  const items = (demonstration as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];

  return items.slice(0, 3).flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const videoUrl = typeof record.video === "string" ? record.video.trim() : "";
    if (!videoUrl) return [];
    return [{
      position: index + 1,
      title: typeof record.title === "string" ? record.title.trim() : "",
      videoUrl,
    }];
  });
}

function contentWithVideos(content: Prisma.JsonValue | null, videos: DemonstrationVideoInput[]) {
  if (!content || typeof content !== "object" || Array.isArray(content) || !videos.length) return content;
  const document = content as Prisma.JsonObject;
  const currentDemonstration = document.demonstration;
  const demonstration = currentDemonstration && typeof currentDemonstration === "object" && !Array.isArray(currentDemonstration)
    ? currentDemonstration as Prisma.JsonObject
    : {};
  const items = Array.from({ length: 3 }, () => ({ title: "", video: "" }));
  for (const video of videos) {
    if (video.position >= 1 && video.position <= 3) {
      items[video.position - 1] = { title: video.title, video: video.videoUrl };
    }
  }
  return { ...document, demonstration: { ...demonstration, items } };
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
  const [document, videos] = await Promise.all([
    db().siteDocument.findUnique({ where: { id: siteId } }),
    db().demonstrationVideo.findMany({ where: { siteId }, orderBy: { position: "asc" } }),
  ]);
  const storedVideos = videos.map((video) => ({
    position: video.position,
    title: video.title,
    videoUrl: video.videoUrl,
  }));
  return c.json({ content: contentWithVideos(document?.content ?? null, storedVideos) });
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
  const videos = demonstrationVideosFrom(content);
  await db().$transaction(async (transaction) => {
    await transaction.siteDocument.upsert({
      where: { id: siteId },
      create: { id: siteId, content: content as Prisma.InputJsonValue },
      update: { content: content as Prisma.InputJsonValue },
    });
    await transaction.demonstrationVideo.deleteMany({ where: { siteId } });
    if (videos.length) {
      await transaction.demonstrationVideo.createMany({
        data: videos.map((video) => ({ ...video, siteId })),
      });
    }
  });
  return c.json({ content });
});

app.post("/api/media", async (c) => {
  if (!authenticated(getCookie(c, cookieName))) return c.json({ error: "Não autorizado" }, 401);
  const form = await c.req.formData();
  const file = form.get("file");
  const mediaTypes: Record<string, { extension: string; maxSize: number; label: string }> = {
    "image/webp": { extension: "webp", maxSize: 20_000_000, label: "Imagem" },
    "image/png": { extension: "png", maxSize: 20_000_000, label: "Imagem" },
    "image/jpeg": { extension: "jpg", maxSize: 20_000_000, label: "Imagem" },
    "video/mp4": { extension: "mp4", maxSize: 50_000_000, label: "Vídeo" },
    "video/webm": { extension: "webm", maxSize: 50_000_000, label: "Vídeo" },
  };
  const media = file instanceof File ? mediaTypes[file.type] : undefined;
  if (!(file instanceof File) || !media) return c.json({ error: "Arquivo de mídia inválido" }, 400);
  if (file.size > media.maxSize) return c.json({ error: `${media.label} maior que ${media.maxSize / 1_000_000} MB` }, 413);
  const key = `${randomUUID()}.${media.extension}`;
  const { client, name } = bucket();
  await client.send(new PutObjectCommand({
    Bucket: name, Key: key, Body: new Uint8Array(await file.arrayBuffer()), ContentType: file.type,
  }));
  return c.json({ url: `/api/media/${key}` }, 201);
});

app.get("/api/media/:id", async (c) => {
  const key = c.req.param("id");
  if (!/^[a-f0-9-]{36}\.(webp|png|jpg|mp4|webm)$/.test(key)) return c.notFound();
  const { client, name } = bucket();
  try {
    const range = c.req.header("Range");
    const media = await client.send(new GetObjectCommand({ Bucket: name, Key: key, Range: range }));
    if (!media.Body) return c.notFound();
    const bytes = await media.Body.transformToByteArray();
    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new Response(body, {
      status: range ? 206 : 200,
      headers: {
        "Content-Type": media.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
        ...(media.ContentLength !== undefined ? { "Content-Length": String(media.ContentLength) } : {}),
        ...(media.ContentRange ? { "Content-Range": media.ContentRange } : {}),
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
