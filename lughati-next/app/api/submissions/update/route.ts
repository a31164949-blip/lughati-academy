import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "../../../../firebase-admin";
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
  studentId?: string;
  rewardType?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateRequest;

    const row = Number(body.row);
    const status = body.status;
    const note = typeof body.note === "string" ? body.note.trim() : "";
const studentId =
  typeof body.studentId === "string"
    ? body.studentId.trim()
    : "";
    const rewardType =
  typeof body.rewardType === "string"
    ? body.rewardType.trim()
    : "";
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
        studentId,
       rewardType,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();
console.log("UPDATE Apps Script check:", {
  status: response.status,
  contentType: response.headers.get("content-type"),
  length: responseText.length,
  startsWithJson: responseText.trim().startsWith("{"),
  preview: responseText.trim().slice(0, 80),
});
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