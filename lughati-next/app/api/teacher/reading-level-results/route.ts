import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";

const TEACHER_EMAIL = "a31164949@gmail.com";

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const { adminAuth } = getFirebaseAdmin();
  const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof decodedToken.email === "string" ? decodedToken.email.trim().toLowerCase() : "";
  const role = typeof decodedToken.role === "string" ? decodedToken.role : "";

  if (role !== "teacher" && email !== TEACHER_EMAIL) throw new Error("FORBIDDEN");
}

function toIso(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb.collection("students").get();

    const results = snapshot.docs
      .map((studentDocument) => {
        const data = studentDocument.data() ?? {};
        const assessment = data.readingLevelAssessment;
        if (!assessment || typeof assessment !== "object") return null;

        return {
          studentDocId: studentDocument.id,
          studentName: typeof data.studentName === "string" ? data.studentName : "طالب",
          classroom: typeof data.classroom === "string" ? data.classroom : "",
          score: typeof assessment.score === "number" ? assessment.score : 0,
          total: typeof assessment.total === "number" ? assessment.total : 16,
          level: typeof assessment.level === "string" ? assessment.level : "غير محدد",
          skillSummaries: Array.isArray(assessment.skillSummaries) ? assessment.skillSummaries : [],
          completedAt: toIso(assessment.completedAt),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((first, second) => second.completedAt.localeCompare(first.completedAt));

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Teacher reading level results error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "يجب تسجيل الدخول بحساب المعلم." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "هذا المسار مخصص للمعلم." }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "تعذر تحميل نتائج تحديد المستوى." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireTeacher(request);
    const body = (await request.json()) as { studentDocId?: unknown };
    const studentDocId =
      typeof body.studentDocId === "string" ? body.studentDocId.trim() : "";

    if (!studentDocId) {
      return NextResponse.json(
        { success: false, message: "لم يتم تحديد الطالب." },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const studentReference = adminDb.collection("students").doc(studentDocId);
    const studentSnapshot = await studentReference.get();

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على الطالب." },
        { status: 404 }
      );
    }

    await studentReference.update({
      readingLevelAssessment: FieldValue.delete(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher reading level result delete error:", error);
    const message = error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول بحساب المعلم." },
        { status: 401 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "هذا المسار مخصص للمعلم." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: "تعذر حذف نتيجة تحديد المستوى." },
      { status: 500 }
    );
  }
}
