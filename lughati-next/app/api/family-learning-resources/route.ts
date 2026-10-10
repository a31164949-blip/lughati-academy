import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { canViewFamilyResource, resourceNotificationId } from "../../lib/familyResourcesPolicy";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";

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
    let studentDocId = "";

    if (!isTeacher) {
      if (token.role !== "student") throw new Error("FORBIDDEN");
      studentDocId = typeof token.studentDocId === "string" ? token.studentDocId : "";
      if (!studentDocId) throw new Error("FORBIDDEN");
      const studentSnapshot = await adminDb.collection("students").doc(studentDocId).get();
      if (!studentSnapshot.exists) throw new Error("FORBIDDEN");
      studentClassroom = String(studentSnapshot.data()?.classroom ?? "");
    }

    const reads = [adminDb.collection("familyLearningResources").orderBy("createdAt", "desc").limit(100).get()];
    // Assigned materials remain available even after newer class uploads fill the general list.
    if (!isTeacher) reads.push(adminDb.collection("familyLearningResources").where("targetStudentId", "==", studentDocId).get());
    const snapshots = await Promise.all(reads);
    const documents = [...new Map(snapshots.flatMap(snapshot => snapshot.docs).map(document => [document.id, document])).values()];
    const items = documents
      .map((document) => ({ id: document.id, ...document.data() }))
      .filter((raw) => {
        const item = raw as Record<string, unknown>;
        if (isTeacher) return true;
        return canViewFamilyResource(item, studentDocId, studentClassroom);
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
          audience: item.audience === "student" || item.targetStudentId ? "student" : "classroom",
          targetStudentId: String(item.targetStudentId ?? ""),
          targetStudentName: String(item.targetStudentName ?? ""),
          fileUrl: String(item.fileUrl ?? ""),
          fileName: String(item.fileName ?? "الملف"),
          fileKind: item.fileKind === "pdf" ? "pdf" : "image",
          published: item.published === true,
          createdAt: millis(item.createdAt),
        };
      });

    let students: Array<{ id: string; studentName: string; classroom: string }> | undefined;
    if (isTeacher && new URL(request.url).searchParams.get("includeStudents") === "1") {
      const roster = await adminDb.collection("students").limit(500).get();
      students = roster.docs.filter(doc => selectableStudent(doc.data())).map(doc => ({ id: doc.id, studentName: String(doc.data().studentName || doc.data().name || "الطالب"), classroom: String(doc.data().classroom || "") })).sort((a, b) => a.studentName.localeCompare(b.studentName, "ar"));
    }
    return json({ success: true, items, ...(students ? { students } : {}) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID_STUDENT" ? 400 : 500;
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
    if (body.audience != null && !["student", "classroom"].includes(body.audience)) return json({ success: false, message: "اختر المستهدف الصحيح." }, 400);
    if (body.targetStudentId != null && typeof body.targetStudentId !== "string") return json({ success: false, message: "اختر الطالب الصحيح." }, 400);
    const audience = body.audience === "student" ? "student" : "classroom";
    const targetStudentId = typeof body.targetStudentId === "string" ? body.targetStudentId.trim() : "";
    if ((audience === "student" && (!targetStudentId || targetStudentId.includes("/") || targetStudentId.length > 150)) || (audience === "classroom" && targetStudentId)) return json({ success: false, message: "اختر الطالب المستهدف قبل النشر." }, 400);
    const reference = adminDb.collection("familyLearningResources").doc();
    await adminDb.runTransaction(async transaction => {
      let targetStudentName = "";
      let targetClassroom = classroom;
      if (audience === "student") {
        const student = await transaction.get(adminDb.collection("students").doc(targetStudentId));
        if (!student.exists || !selectableStudent(student.data() ?? {})) throw new Error("INVALID_STUDENT");
        targetStudentName = String(student.data()?.studentName || student.data()?.name || "الطالب");
        targetClassroom = String(student.data()?.classroom || "");
      }
      const data = { title, description, category, classroom: targetClassroom, audience, targetStudentId, targetStudentName, fileUrl, fileName, fileKind, published: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
      transaction.set(reference, data);
      if (audience === "student") transaction.set(notificationReference(reference.id, targetStudentId), notificationData(reference.id, data));
    });
    if (audience === "student") invalidateNotification(targetStudentId);
    return json({ success: true, id: reference.id, message: audience === "student" ? "تم الإرسال للطالب المختار وظهر إشعار في صفحته وصفحة ولي الأمر ✅" : "تم النشر لولي الأمر بنجاح ✅" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID_STUDENT" ? 400 : 500;
    return NextResponse.json({ success: false, message: code === "INVALID_STUDENT" ? "الطالب غير متاح للإرسال. حدّث القائمة واختر طالبًا نشطًا." : status === 500 ? "تعذر نشر المادة." : "غير مصرح بالدخول." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { isTeacher } = await getViewer(request);
    if (!isTeacher) throw new Error("FORBIDDEN");
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id || id.includes("/") || typeof body.published !== "boolean") return NextResponse.json({ success: false, message: "الطلب غير صحيح." }, { status: 400 });
    const { adminDb } = getFirebaseAdmin();
    const recipient = await adminDb.runTransaction(async transaction => {
      const reference = adminDb.collection("familyLearningResources").doc(id);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const data = snapshot.data() ?? {};
      transaction.update(reference, { published: body.published, updatedAt: FieldValue.serverTimestamp() });
      const target = typeof data.targetStudentId === "string" ? data.targetStudentId : "";
      if (target && data.published !== body.published) {
        if (body.published) transaction.set(notificationReference(id, target), notificationData(id, data));
        else transaction.delete(notificationReference(id, target));
      }
      return target;
    });
    if (recipient) invalidateNotification(recipient);
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID_STUDENT" ? 400 : 500;
    return NextResponse.json({ success: false, message: "تعذر تحديث المادة." }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { isTeacher } = await getViewer(request);
    if (!isTeacher) throw new Error("FORBIDDEN");
    const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
    if (!id || id.includes("/")) return NextResponse.json({ success: false, message: "الطلب غير صحيح." }, { status: 400 });
    const { adminDb } = getFirebaseAdmin();
    const recipient = await adminDb.runTransaction(async transaction => {
      const reference = adminDb.collection("familyLearningResources").doc(id);
      const snapshot = await transaction.get(reference);
      const target = typeof snapshot.data()?.targetStudentId === "string" ? snapshot.data()!.targetStudentId : "";
      transaction.delete(reference);
      if (target) transaction.delete(notificationReference(id, target));
      return target;
    });
    if (recipient) invalidateNotification(recipient);
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID_STUDENT" ? 400 : 500;
    return NextResponse.json({ success: false, message: "تعذر حذف المادة." }, { status });
  }
}

function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } }); }
function selectableStudent(data: FirebaseFirestore.DocumentData) { return data.active !== false && data.isActive !== false && data.archived !== true && data.deleted !== true; }
function notificationReference(id: string, studentId: string) { return getFirebaseAdmin().adminDb.collection("studentNotifications").doc(resourceNotificationId(id, studentId)); }
function notificationData(id: string, data: FirebaseFirestore.DocumentData) {
  const category = data.category === "test" ? "اختبار" : data.category === "review" ? "مراجعة" : "ورقة عمل";
  return { studentId: data.targetStudentId, resourceId: id, type: "familyLearningResource", title: `📚 ${category} مخصص لك: ${data.title}`, message: "أرسل معلمك مادة خاصة بك. افتحها مع ولي أمرك للاطلاع على التعليمات.", href: `/quizzes#learning-resource-${id}`, read: false, opened: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
}
function invalidateNotification(id: string) { revalidateTag("student-notifications:" + createHash("sha256").update(id).digest("hex"), { expire: 0 }); }
