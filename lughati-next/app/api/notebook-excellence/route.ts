import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "يجب إرسال صورة الدفتر عبر مسار التحليل الإلكتروني أولًا.",
    },
    { status: 410 },
  );
}
