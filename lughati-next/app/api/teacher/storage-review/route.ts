import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getFirebaseAdmin } from "../../../../firebase-admin";
import { listVideoStorage } from "../../../lib/r2Video";

export const runtime = "nodejs";
const OWNER = "a31164949@gmail.com";
function reply(body: object, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }
async function requireTeacher(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw Error("UNAUTHORIZED");
  let user;
  try { user = await getFirebaseAdmin().adminAuth.verifyIdToken(header.slice(7)); } catch { throw Error("UNAUTHORIZED"); }
  if (user.role !== "teacher" && user.role !== "admin" && user.email?.trim().toLowerCase() !== OWNER) throw Error("FORBIDDEN");
}
function cloudConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloud !== "ffv5igmg" || !key || !secret) throw Error("CLOUDINARY_NOT_CONFIGURED");
  return { cloud, authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` };
}
async function cloudInventory(cursor: string) {
  const cfg = cloudConfig();
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/resources/search`, {
    method: "POST", headers: { Authorization: cfg.authorization, "Content-Type": "application/json" },
    body: JSON.stringify({ expression: "type:upload AND status:active", sort_by: [{ bytes: "desc" }], max_results: 50, ...(cursor ? { next_cursor: cursor } : {}) }),
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error("PROVIDER_FAILED");
  const data = await response.json();
  if (!Array.isArray(data.resources)) throw Error("PROVIDER_FAILED");
  const counts = new Map<string, number>();
  for (const resource of data.resources) if (resource.etag) {
    const key = `${resource.resource_type}:${resource.bytes}:${resource.etag}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return { nextCursor: typeof data.next_cursor === "string" ? data.next_cursor : "", items: data.resources.map((r: Record<string, unknown>) => ({
    id: String(r.asset_id || r.public_id || ""), name: String(r.public_id || ""),
    bytes: typeof r.bytes === "number" ? r.bytes : 0, kind: String(r.resource_type || ""), createdAt: String(r.created_at || ""),
    duplicate: !!r.etag && (counts.get(`${r.resource_type}:${r.bytes}:${r.etag}`) || 0) > 1,
  })) };
}
function millis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis();
  return 0;
}
async function retentionReview() {
  const { adminDb } = getFirebaseAdmin();
  // No composite indexes or full collection scans. This is a bounded sample, not a complete audit.
  const specs = [{ collection: "studentWorks", status: "مرفوض", href: "/teacher/submissions" }, { collection: "academyStories", status: "rejected", href: "/teacher/academy-stories" }, { collection: "notebookNominations", status: "rejected", href: "/teacher/notebook-gallery" }];
  const batches = await Promise.all(specs.map(async spec => ({ spec, snapshot: await adminDb.collection(spec.collection).where("status", "==", spec.status).limit(25).get() })));
  const cutoff = Date.now() - 30 * 86400000;
  return { checkedRecords: batches.reduce((total, b) => total + b.snapshot.size, 0), partial: batches.some(b => b.snapshot.size === 25), items: batches.flatMap(({ spec, snapshot }) => snapshot.docs.flatMap(doc => {
    const data = doc.data();
    // Review age starts at rejection, if that timestamp is available.
    const date = millis(data.rejectedAt) || millis(data.reviewedAt) || millis(data.createdAt);
    if (!date || date > cutoff || data.publishedToGallery === true || data.isPublished === true) return [];
    return [{ id: `${spec.collection}/${doc.id}`, name: String(data.studentName || data.title || "مشاركة طالب"), kind: spec.collection, createdAt: new Date(date).toISOString(), href: spec.href }];
  })) };
}
export async function POST(request: Request) {
  try {
    await requireTeacher(request); // Auth on every request, including cache hits.
    const body = await request.json();
    const source = body.source;
    const cursor = typeof body.cursor === "string" ? body.cursor : "";
    if (cursor.length > 2048 || !["cloudinary", "r2", "retention"].includes(source)) return reply({ success: false, message: "طلب غير صالح." }, 400);
    if (source === "cloudinary") cloudConfig();
    const result = await unstable_cache(
      () => source === "cloudinary" ? cloudInventory(cursor) : source === "r2" ? listVideoStorage(cursor || undefined) : retentionReview(),
      ["storage-review-v1", source, source === "retention" ? "" : cursor], { revalidate: 300 },
    )();
    return reply({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code.endsWith("NOT_CONFIGURED") ? 409 : 500;
    const message = code === "CLOUDINARY_NOT_CONFIGURED" ? "أضف مفتاح API والمفتاح السري لـCloudinary إلى إعدادات Vercel ثم أعد النشر. لم يبدأ الجرد ولم يُحذف شيء." : code === "R2_NOT_CONFIGURED" ? "إعدادات R2 غير مكتملة." : status < 409 ? "يلزم حساب المعلم." : "تعذر إجراء المراجعة. لم يُحذف شيء.";
    return reply({ success: false, message }, status);
  }
}
