import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
export const maxDuration = 120;
const OWNER = "a31164949@gmail.com";
const AUDIT_LIMIT = 500;
const messages: Record<string, string> = {
  UNAUTHORIZED: "يلزم تسجيل الدخول بحساب المعلم.", FORBIDDEN: "هذا الخيار مخصص للمعلم.",
  CONFIG: "يلزم إضافة مفاتيح Cloudinary في إعدادات الخادم قبل الحذف. لم يُحذف العمل.",
  INVALID: "طلب الحذف غير صالح.", NOT_FOUND: "العمل غير موجود.",
  UNSUPPORTED: "تعذر تحديد الصورة الأصلية بأمان. لم يُحذف العمل.",
  SHARED: "الصورة مستخدمة في سجل آخر. احتفظ بالصورة واستخدم الإخفاء من المعرض.",
  AUDIT_LIMIT: "توقف الفحص عند حد 500 سجل لحماية الميزانية. لم يُحذف شيء؛ استخدم الإخفاء أو مراجعة يدوية.",
  EXPIRED: "انتهت صلاحية المعاينة؛ أعد الفحص قبل الحذف.", CHANGED: "تغير العمل منذ المعاينة. أعد الفحص.",
  CLOUDINARY: "تعذر تأكيد حذف الصورة من Cloudinary. بقي سجل العمل؛ يمكنك إعادة المحاولة.",
};
function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
async function teacher(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  let user;
  try { user = await adminAuth.verifyIdToken(header.slice(7)); } catch { throw Error("UNAUTHORIZED"); }
  if (user.role !== "teacher" && user.role !== "admin" && user.email?.trim().toLowerCase() !== OWNER) throw Error("FORBIDDEN");
  return user.uid;
}
function config() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloud !== "ffv5igmg" || !key || !secret) throw Error("CONFIG");
  return { cloud, secret, authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` };
}
// Only original, versioned URLs produced by this page's uploader are deletable.
function originalId(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.search || url.hash) return null;
    const match = url.pathname.match(/^\/ffv5igmg\/image\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}
function references(value: unknown, imageUrl: string, publicId: string, field = ""): boolean {
  if (typeof value === "string") {
    if (value === imageUrl || (/public.?id/i.test(field) && value === publicId)) return true;
    try {
      const u = new URL(value);
      if (u.hostname !== "res.cloudinary.com" || !u.pathname.startsWith("/ffv5igmg/image/upload/")) return false;
      const suffix = decodeURIComponent(u.pathname).split(/\/v\d+\//).pop()!;
      return suffix.replace(/\.[a-zA-Z0-9]+$/, "") === publicId || u.pathname.endsWith(`/${publicId}`) || u.pathname.includes(`/${publicId}.`);
    } catch { return false; }
  }
  if (Array.isArray(value)) return value.some(v => references(v, imageUrl, publicId, field));
  if (value && typeof value === "object" && Object.prototype.toString.call(value) === "[object Object]") {
    return Object.entries(value).some(([k, v]) => references(v, imageUrl, publicId, k));
  }
  return false;
}
// Inspect all root collections and their subcollections. Never pass a partial audit.
// Stop after at most 501 returned documents, rather than an unbounded database scan.
async function audit(id: string, imageUrl: string, publicId: string) {
  const { adminDb } = getFirebaseAdmin();
  let read = 0;
  const queue: Array<FirebaseFirestore.Query> = await adminDb.listCollections();
  // Game result parents can be absent; a group query still includes their records.
  queue.push(adminDb.collectionGroup("results"));
  for (let i = 0; i < queue.length; i++) {
    if (i >= 100) throw Error("AUDIT_LIMIT");
    const snapshot = await queue[i].limit(AUDIT_LIMIT - read + 1).get();
    read += snapshot.size;
    if (read > AUDIT_LIMIT) throw Error("AUDIT_LIMIT");
    for (const row of snapshot.docs) {
      if (row.ref.path !== `notebookGallery/${id}` && references(row.data(), imageUrl, publicId)) throw Error("SHARED");
    }
    const children = await Promise.all(snapshot.docs.map(row => row.ref.listCollections()));
    for (const collections of children) queue.push(...collections);
    if (queue.length > 100) throw Error("AUDIT_LIMIT");
  }
  return read;
}
type Ticket = { id: string; uid: string; imageUrl: string; publicId: string; assetId: string; expires: number; version: string };
function sign(payload: string, secret: string) { return createHmac("sha256", secret).update(payload).digest("base64url"); }
function pack(ticket: Ticket, secret: string) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}
function unpack(token: unknown, secret: string): Ticket {
  if (typeof token !== "string" || token.length > 8192) throw Error("INVALID");
  const [payload, signature, extra] = token.split(".");
  const expected = sign(payload || "", secret);
  if (extra || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw Error("INVALID");
  const ticket = JSON.parse(Buffer.from(payload, "base64url").toString()) as Ticket;
  if (ticket.expires < Date.now()) throw Error("EXPIRED");
  return ticket;
}
export async function POST(request: Request) {
  try {
    const uid = await teacher(request);
    const cfg = config(); // No Firestore audit reads if credentials are absent.
    const body = await request.json();
    const id = body.id;
    if (typeof id !== "string" || !id || id.length > 180 || id.includes("/")) throw Error("INVALID");
    const { adminDb } = getFirebaseAdmin();
    const ref = adminDb.collection("notebookGallery").doc(id);
    const row = await ref.get();
    if (!row.exists) throw Error("NOT_FOUND");
    const data = row.data()!;
    const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : "";
    const publicId = originalId(imageUrl);
    if (!publicId) throw Error("UNSUPPORTED");
    const version = row.updateTime!.toMillis().toString();
    if (body.action === "preview") {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/resources/image/upload/${encodeURIComponent(publicId)}`, {
        headers: { Authorization: cfg.authorization }, cache: "no-store", signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Error("CLOUDINARY");
      const asset = await response.json();
      if (asset.secure_url !== imageUrl || asset.public_id !== publicId || typeof asset.asset_id !== "string" || !Number.isFinite(asset.bytes)) throw Error("UNSUPPORTED");
      const read = await audit(id, imageUrl, publicId);
      return reply({ success: true, count: 1, bytes: asset.bytes, auditReads: read, token: pack({ id, uid, imageUrl, publicId, assetId: asset.asset_id, version, expires: Date.now() + 5 * 60000 }, cfg.secret) });
    }
    if (body.action !== "delete") throw Error("INVALID");
    const ticket = unpack(body.token, cfg.secret);
    if (ticket.uid !== uid || ticket.id !== id || ticket.imageUrl !== imageUrl || ticket.publicId !== publicId || ticket.version !== version) throw Error("CHANGED");
    await audit(id, imageUrl, publicId);
    // Delete by immutable asset ID, never by a replaceable public ID.
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signed = `asset_id=${ticket.assetId}&invalidate=true&timestamp=${timestamp}`;
    const signature = createHash("sha1").update(signed + cfg.secret).digest("hex");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/asset/destroy`, {
      method: "POST", headers: { Authorization: cfg.authorization },
      body: new URLSearchParams({ asset_id: ticket.assetId, invalidate: "true", timestamp, signature }),
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok || !["ok", "not found"].includes(result.result)) throw Error("CLOUDINARY");
    // Protect a concurrent teacher edit; failures leave the record available for recovery.
    await ref.delete({ lastUpdateTime: row.updateTime! });
    revalidateTag("public-gallery", { expire: 0 });
    return reply({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : messages[code] ? 409 : 500;
    return reply({ success: false, message: messages[code] || "تعذر إكمال الحذف. احتُفظ بالسجل؛ راجع الصورة قبل إعادة المحاولة." }, status);
  }
}
