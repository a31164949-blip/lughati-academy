import { NextResponse } from "next/server";
import { GET as getSubmissions } from "../submissions/route";
type Submission = {
  id?: number;
  timestamp?: string;
  studentName?: string;
  studentId?: string;
  classroom?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  consent?: string;
  status?: string;
  note?: string;
};

export async function GET(request: Request) {
  try {
    const response = await getSubmissions();
const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: "تعذر تحميل معرض الطلاب",
          works: [],
        },
        { status: 502 }
      );
    }

    const submissions: Submission[] = Array.isArray(data.submissions)
      ? data.submissions
      : [];

    const works = submissions
      .filter(
        (submission) =>
          submission.status === "معتمد" &&
          typeof submission.fileUrl === "string" &&
          submission.fileUrl.trim() !== ""
      )
      .map((submission) => ({
        title: submission.title || "عمل مميز",
        type: submission.type || "عمل طالب",
        fileUrl: submission.fileUrl,
        publishedAt: submission.timestamp || "",
      }));

    return NextResponse.json({
      success: true,
      count: works.length,
      works,
    });
  } catch (error) {
    console.error("Gallery API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحميل معرض الطلاب",
        works: [],
      },
      { status: 500 }
    );
  }
}