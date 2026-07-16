import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzwZWP3GlHZZ01jnMoLnnUbZUPhGUsR1i4dTodpcuH1CYhNqtoizdLQJckIrNXjZeg0lw/exec";

const SECRET_TOKEN = "lughati-2026-review-8K7mP2";

const allowedStatuses = [
  "بانتظار المراجعة",
  "معتمد",
  "مرفوض",
] as const;

type AllowedStatus = (typeof allowedStatuses)[number];

type UpdateRequest = {
  row?: number;
  status?: AllowedStatus;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateRequest;

    const row = Number(body.row);
    const status = body.status;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!Number.isInteger(row) || row < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "رقم الصف غير صحيح",
        },
        { status: 400 },
      );
    }

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "حالة العمل غير صحيحة",
        },
        { status: 400 },
      );
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        token: SECRET_TOKEN,
        row,
        status,
        note,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();

    let result: {
      success?: boolean;
      message?: string;
      [key: string]: unknown;
    };

    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "وصل رد غير صالح من خدمة Google",
        },
        { status: 502 },
      );
    }

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "تعذر تحديث جدول الأعمال",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "تم تحديث العمل بنجاح",
      status,
      row,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء تحديث العمل",
      },
      { status: 500 },
    );
  }
}