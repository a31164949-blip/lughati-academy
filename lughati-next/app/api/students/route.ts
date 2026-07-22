import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

export const dynamic = "force-dynamic";

type StudentData = {
  studentId?: string;
  studentName?: string;
  classroom?: string;
  active?: boolean;
};

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, "students"));

    const students = snapshot.docs
      .map((studentDocument) => {
        const data = studentDocument.data() as StudentData;

        return {
          id: studentDocument.id,
          studentId: data.studentId ?? studentDocument.id,
          studentName: data.studentName ?? "طالب",
          classroom: data.classroom ?? "",
          active: data.active !== false,
        };
      })
      .filter((student) => student.active)
      .sort((firstStudent, secondStudent) =>
        firstStudent.studentName.localeCompare(
          secondStudent.studentName,
          "ar"
        )
      );

    return NextResponse.json(
      {
        success: true,
        students,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Students API error:", error);

    return NextResponse.json(
      {
        success: false,
        students: [],
        message: "تعذر تحميل قائمة الطلاب في الوقت الحالي.",
      },
      { status: 500 }
    );
  }
}