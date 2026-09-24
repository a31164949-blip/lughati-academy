import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";

function normalizeClassroom(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.includes("جميع") || normalized === "all") return "all";
  if (normalized.endsWith("أ")) return "أ";
  if (normalized.endsWith("ب")) return "ب";
  return normalized;
}

function validFileUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function millis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

async function getViewer(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
  const isTeacher = token.role === "teacher" || token.role === "admin" || email === TEACHER_EMAIL;
  return { token, isTeacher };
}

export async function GET(request: Request) {
  try {
    const { token, isTeacher } = await getViewer(request);
    const { adminDb } = getFirebaseAdmin();
    let studentClassroom = "";

    if (!isTeacher) {
      const studentDocId = typeof token.studentDocId === "string" ? token.studentDocId : "";
      if (!studentDocId) throw new Error("FORBIDDEN");
      const studentSnapshot = await adminDb.collection("students").doc(studentDocId).get();
      if (!studentSnapshot.exists) throw new Error("FORBIDDEN");
      studentClassroom = normalizeClassroom(String(studentSnapshot.data()?.classroom ?? ""));
    }

    const snapshot = await adminDb.collection("familyLearningResources").limit(100).get();
    const items = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }))
      .filter((raw) => {
        const item = raw as Record<string, unknown>;
        if (isTeacher) return true;
        const target = normalizeClassroom(String(item.classroom ?? ""));
        return item.published === true && (target === "all" || target === studentClassroom);
      })
      .sort((first, second) => millis((second as Record<string, unknown>).createdAt) - millis((first as Record<string, unknown>).createdAt))
      .map((raw) => {
        const item = raw as Record<string, unknown>;
        return {
          id: String(item.id),
          title: String(item.title ?? "مادة تعليمية"),
          description: String(item.description ?? ""),
          category: item.category === "test" || item.category === "review" ? item.category : "worksheet",
          classroom: String(item.classroom ?? "جميع طلاب الصف الثاني"),
          fileUrl: String(item.fileUrl ?? ""),
          fileName: String(item.fileName ?? "الملف"),
          fileKind: item.fileKind === "pdf" ? "pdf" : "image",
          published: item.published === true,
          createdAt: millis(item.createdAt),
        };
      });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر تحميل المواد." : "غير مصرح بالدخول." }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { isTeacher } = await getViewer(request);
    if (!isTeacher) throw new Error("FORBIDDEN");
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
    const category = body.category === "test" || body.category === "review" ? body.category : "worksheet";
    const classroom = ["الصف الثاني أ", "الصف الثاني ب", "جميع طلاب الصف الثاني"].includes(body.classroom) ? body.classroom : "جميع طلاب الصف الثاني";
    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    const fileName = typeof body.fileName === "string" ? body.fileName.trim().slice(0, 160) : "الملف";
    const fileKind = body.fileKind === "pdf" ? "pdf" : "image";
    if (!title || !validFileUrl(fileUrl)) return NextResponse.json({ success: false, message: "بيانات المادة غير مكتملة." }, { status: 400 });

    const { adminDb } = getFirebaseAdmin();
    const reference = await adminDb.collection("familyLearningResources").add({ title, description, category, classroom, fileUrl, fileName, fileKind, published: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true, id: reference.id, message: "تم النشر لولي الأمر بنجاح ✅" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر نشر المادة." : "غير مصرح بالدخول." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { isTeacher } = await getViewer(request);
    if (!isTeacher) throw new Error("FORBIDDEN");
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id || typeof body.published !== "boolean") return NextResponse.json({ success: false, message: "الطلب غير صحيح." }, { status: 400 });
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection("familyLearningResources").doc(id).update({ published: body.published, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, message: "تعذر تحديث المادة." }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { isTeacher } = await getViewer(request);
    if (!isTeacher) throw new Error("FORBIDDEN");
    const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
    if (!id) return NextResponse.json({ success: false, message: "الطلب غير صحيح." }, { status: 400 });
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection("familyLearningResources").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, message: "تعذر حذف المادة." }, { status });
  }
}
