import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzwZWP3GlHZZ01jnMoLnnUbZUPhGUsR1i4dTodpcuH1CYhNqtoizdLQJckIrNXjZeg0lw/exec";

const SECRET_TOKEN = "lughati-2026-review-8K7mP2";

export async function GET() {
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set("token", SECRET_TOKEN);

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const responseText = await response.text();

    let result: {
      success?: boolean;
      message?: string;
      submissions?: unknown[];
    };

    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "وصل رد غير صالح من خدمة Google",
          submissions: [],
        },
        { status: 502 },
      );
    }

    if (!response.ok || !result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "تعذر جلب أعمال الطلاب",
          submissions: [],
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      submissions: result.submissions || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب أعمال الطلاب",
        submissions: [],
      },
      { status: 500 },
    );
  }
}