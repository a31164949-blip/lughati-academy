import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../../firebase-admin";
import { clubAttachmentTeacher } from "../../../../lib/clubAttachmentsServer";
import { CLUB_ATTACHMENT_TYPES, MAX_CLUB_ATTACHMENT_BYTES } from "../../../../lib/clubAttachments";
import { videoUploadUrl } from "../../../../lib/r2Video";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const actor = await clubAttachmentTeacher(request);
    const body = await request.json();
    const size = body.size, contentType = body.contentType;
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_CLUB_ATTACHMENT_BYTES || !Object.hasOwn(CLUB_ATTACHMENT_TYPES, contentType) || typeof body.name !== "string" || !body.name.trim()) throw new Error("INVALID_ATTACHMENT");
    const id = randomUUID(), key = `club-attachments/${id}.${CLUB_ATTACHMENT_TYPES[contentType]}`;
    const uploadUrl = await videoUploadUrl(key, size, contentType);
    const { adminDb } = getFirebaseAdmin();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
    await adminDb.runTransaction(async tx => {
      const total = adminDb.collection("r2VideoUsage").doc("storage");
      const day = adminDb.collection("r2VideoUsage").doc(`upload-${today}`);
      const person = adminDb.collection("r2VideoUsage").doc(`club-attachments-${actor.uid}-${today}`);
      const [all, daily, user] = await Promise.all([tx.get(total), tx.get(day), tx.get(person)]);
      const bytes = Number(all.data()?.bytes || 0), dailyBytes = Number(daily.data()?.bytes || 0), count = Number(user.data()?.count || 0);
      if (count >= 20 || bytes + size > 8 * 1024 ** 3 || dailyBytes + size > 200 * 1024 ** 2) throw new Error("STORAGE_LIMIT");
      tx.set(total, { bytes: bytes + size }); tx.set(day, { bytes: dailyBytes + size }); tx.set(person, { count: count + 1 });
      tx.create(adminDb.collection("clubAttachmentUploads").doc(id), { uid: actor.uid, key, size, contentType, name: body.name.trim().slice(0, 160), createdAt: Timestamp.now() });
    });
    return NextResponse.json({ id, uploadUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: code === "STORAGE_LIMIT" ? "بلغت حد رفع المرفقات اليومي." : code === "R2_NOT_CONFIGURED" ? "رفع المرفقات غير جاهز. تحقق من إعدادات التخزين." : "تعذر تجهيز المرفق. الحد 20 ميجابايت." }, { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 400 });
  }
}
