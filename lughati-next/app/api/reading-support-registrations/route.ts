import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

const SKILLS = [
  "نطق الحروف",
  "الحركات القصيرة",
  "حروف المد",
  "المقاطع الساكنة",
  "قراءة الكلمات والجمل",
] as const;

type RegistrationRequest = {
  studentId?: string;
  studentName?: string;
  grade?: string;
  studentClass?: string;
  skill?: string;
};

const GRADES = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
] as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationRequest;
    const studentId = body.studentId?.trim();
    const studentName = body.studentName?.trim();
    const grade = body.grade?.trim();
    const studentClass = body.studentClass?.trim();
    const skill = body.skill?.trim();

    if (!studentId || !studentName || !grade || !studentClass || !skill) {
      return NextResponse.json(
        { success: false, message: "يرجى إكمال بيانات التسجيل." },
        { status: 400 }
      );
    }

    if (!GRADES.includes(grade as (typeof GRADES)[number])) {
      return NextResponse.json(
        { success: false, message: "الصف المختار غير متاح." },
        { status: 400 }
      );
    }

    if (!SKILLS.includes(skill as (typeof SKILLS)[number])) {
      return NextResponse.json(
        { success: false, message: "المهارة المختارة غير متاحة." },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const registrationReference = adminDb
      .collection("readingSupportRegistrations")
      .doc(studentId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(registrationReference);
      const current = snapshot.data() as { status?: string } | undefined;

      if (current?.status === "pending") {
        return "pending" as const;
      }

      transaction.set(registrationReference, {
        studentId,
        studentName,
        grade,
        studentClass,
        skill,
        status: "pending",
        priority: grade === "الثاني" ? 1 : 2,
        createdAt: FieldValue.serverTimestamp(),
      });

      return "created" as const;
    });

    if (result === "pending") {
      return NextResponse.json(
        {
          success: false,
          code: "PENDING_REGISTRATION",
          message: "لديك طلب قيد الانتظار بالفعل.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("تعذر حفظ تسجيل حصة التمكين القرائي:", error);
    return NextResponse.json(
      { success: false, message: "تعذر إرسال التسجيل حاليًا." },
      { status: 500 }
    );
  }
}
