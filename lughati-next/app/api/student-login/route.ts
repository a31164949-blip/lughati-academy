import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type LoginRequest = {
  studentId?: string;
  studentCode?: string;
};

export async function POST(request: Request) {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    const body = (await request.json()) as LoginRequest;

    const studentId = body.studentId?.trim();
    const studentCode = body.studentCode?.trim();

    if (!studentId || !studentCode) {
      return NextResponse.json(
        {
          success: false,
          message: "يرجى اختيار اسم الطالب وإدخال رمز الدخول.",
        },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(studentCode)) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز الدخول يجب أن يتكون من أربعة أرقام.",
        },
        { status: 400 },
      );
    }

    const studentReference = adminDb.collection("students").doc(studentId);
    const studentSnapshot = await studentReference.get();

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "لم يتم العثور على بيانات الطالب.",
        },
        { status: 404 },
      );
    }

    const studentData = studentSnapshot.data();

    if (!studentData || studentData.active !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "حساب الطالب غير متاح حاليًا.",
        },
        { status: 403 },
      );
    }

    const savedLoginCode = String(studentData.loginCode ?? "").trim();

    if (savedLoginCode !== studentCode) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز الدخول غير صحيح.",
        },
        { status: 401 },
      );
    }

    const resolvedStudentId = String(
      studentData.studentId ?? studentSnapshot.id,
    );

    const studentName = String(studentData.studentName ?? "طالب");
    const classroom = String(studentData.classroom ?? "");

    const uid = `student_${resolvedStudentId}`;

    
const customToken = "temporary-student-login";
    return NextResponse.json({
      success: true,
      token: customToken,
      student: {
        id: studentSnapshot.id,
        studentId: resolvedStudentId,
        studentName,
        classroom,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تسجيل الدخول الآن. حاول مرة أخرى.",
      },
      { status: 500 },
    );
  }
}