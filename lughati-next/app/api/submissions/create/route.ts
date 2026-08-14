import { NextResponse } from "next/server";

type CreateSubmissionRequest = {
  studentName?: string;
  studentId?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  consent?: string;
  classroom?: string;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL?.trim();
    const secretToken = process.env.SUBMISSIONS_SECRET_TOKEN?.trim();

    if (!appsScriptUrl || !secretToken) {
      return NextResponse.json(
        {
          success: false,
          message: "إعدادات ربط المعرض غير مكتملة",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreateSubmissionRequest;

    const studentName =
      typeof body.studentName === "string" ? body.studentName.trim() : "";

    const studentId =
      typeof body.studentId === "string" ? body.studentId.trim() : "";

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "إبداع طالب";

    const type =
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim()
        : "واجب إبداعي";

    const fileUrl =
      typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";

    const consent =
      typeof body.consent === "string" && body.consent.trim()
        ? body.consent.trim()
        : "نعم";

    const classroom =
      typeof body.classroom === "string" ? body.classroom.trim() : "";

    const note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim()
        : "نُشر تلقائيًا بعد اعتماد المعلم";

    if (!studentId || !fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات العمل غير مكتملة",
        },
        { status: 400 }
      );
    }

    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        token: secretToken,
        action: "create",
        studentName,
        studentId,
        title,
        type,
        fileUrl,
        consent,
        classroom,
        note,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();
    console.log("CREATE raw response:", {
  status: response.status,
  contentType: response.headers.get("content-type"),
  startsWithJson: responseText.trim().startsWith("{"),
  preview: responseText.trim().slice(0, 120),
});

    let result: {
      success?: boolean;
      message?: string;
      [key: string]: unknown;
    };
try {
    result = JSON.parse(responseText);

console.log("CREATE Apps Script check:", {
  status: response.status,
  success: result.success,
  message: result.message,
});
  
} catch {
  return NextResponse.json(
    {
      success: false,
      message: "وصل رد غير صالح من خدمة المعرض",
    },
    { status: 502 }
  );
}


    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "تعذر نشر العمل في المعرض",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "تم نشر العمل في معرض الطلاب",
    });
  } catch (error) {
    console.error("CREATE SUBMISSION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء نشر العمل",
      },
      { status: 500 }
    );
  }
}