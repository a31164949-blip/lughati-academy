import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type NotebookAnalysisPayload = {
  imageUrl?: string;
};

async function verifyTeacher(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const { adminAuth } = getFirebaseAdmin();
  const decodedToken = await adminAuth.verifyIdToken(
    authorization.slice(7)
  );

  const teacherEmail =
    process.env.TEACHER_EMAIL ||
    "a31164949@gmail.com";

  if (
    decodedToken.role !== "teacher" &&
    decodedToken.email !== teacherEmail
  ) {
    throw new Error("FORBIDDEN");
  }
}

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    extractedText: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        handwriting: { type: "integer", minimum: 0, maximum: 10 },
        organization: { type: "integer", minimum: 0, maximum: 10 },
        spacing: { type: "integer", minimum: 0, maximum: 10 },
        cleanliness: { type: "integer", minimum: 0, maximum: 10 },
      },
      required: [
        "handwriting",
        "organization",
        "spacing",
        "cleanliness",
      ],
    },
    corrections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          suggested: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: [
          "original",
          "suggested",
          "reason",
          "confidence",
        ],
      },
    },
    summary: { type: "string" },
    praise: { type: "string" },
    suggestedCategory: {
      type: "string",
      enum: ["handwriting", "design", "care", "progress"],
    },
    suggestedBadge: { type: "string" },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
    needsTeacherReview: { type: "boolean" },
  },
  required: [
    "extractedText",
    "scores",
    "corrections",
    "summary",
    "praise",
    "suggestedCategory",
    "suggestedBadge",
    "warnings",
    "needsTeacherReview",
  ],
};

export async function POST(request: Request) {
  try {
    await verifyTeacher(request);

    const payload =
      (await request.json()) as NotebookAnalysisPayload;
    const imageUrl =
      typeof payload.imageUrl === "string"
        ? payload.imageUrl.trim()
        : "";

    if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
      return NextResponse.json(
        { success: false, message: "رابط صورة الدفتر غير صالح." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يلزم إضافة OPENAI_API_KEY في إعدادات المشروع قبل تشغيل التحليل.",
        },
        { status: 503 }
      );
    }

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-6-astra",
          store: false,
          instructions:
            "أنت مساعد تربوي متخصص في دفاتر طلاب الصف الثاني الابتدائي باللغة العربية. اقرأ ما يظهر بوضوح فقط ولا تخمّن الكلمات غير الواضحة. قيّم الخط والتنظيم والمسافات والنظافة بلطف. اقترح تصحيحات إملائية موثوقة، واجعل أي تصحيح مشكوك فيه بحاجة إلى مراجعة المعلم. لا تعتمد النتيجة ولا تنشرها؛ القرار النهائي للمعلم.",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "حلل صورة الدفتر، واستخرج النص الواضح، ثم قدم تقييمًا تربويًا وتصحيحات مقترحة.",
                },
                {
                  type: "input_image",
                  image_url: imageUrl,
                  detail: "high",
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "notebook_analysis",
              strict: true,
              schema: analysisSchema,
            },
          },
        }),
      }
    );

    if (!openAIResponse.ok) {
      const details = await openAIResponse.text();
      console.error("OpenAI notebook analysis failed:", details);

      return NextResponse.json(
        {
          success: false,
          message: "تعذر تحليل الصورة الآن. حاول مرة أخرى.",
        },
        { status: 502 }
      );
    }

    const responseData = await openAIResponse.json();

    const directOutputText =
      typeof responseData.output_text === "string"
        ? responseData.output_text
        : "";

    const nestedOutputText = Array.isArray(
      responseData.output
    )
      ? responseData.output
          .flatMap((item: unknown) => {
            if (
              !item ||
              typeof item !== "object" ||
              !("content" in item) ||
              !Array.isArray(
                (item as { content?: unknown }).content
              )
            ) {
              return [];
            }

            return (
              item as {
                content: Array<{
                  type?: string;
                  text?: string;
                }>;
              }
            ).content
              .filter(
                (part) =>
                  part.type === "output_text" &&
                  typeof part.text === "string"
              )
              .map((part) => part.text ?? "");
          })
          .join("")
      : "";

    const outputText =
      directOutputText || nestedOutputText;

    if (!outputText) {
      console.error(
        "OpenAI response contained no output text:",
        JSON.stringify({
          status: responseData.status,
          error: responseData.error,
          incomplete_details:
            responseData.incomplete_details,
          outputTypes: Array.isArray(
            responseData.output
          )
            ? responseData.output.map(
                (item: { type?: string }) =>
                  item?.type
              )
            : [],
        })
      );

      return NextResponse.json(
        {
          success: false,
          message: "لم تصل نتيجة واضحة من التحليل.",
        },
        { status: 502 }
      );
    }

    const analysis = JSON.parse(outputText);

    return NextResponse.json({
      success: true,
      analysis,
      model: "gpt-6-astra",
    });
  } catch (error) {
    console.error("Notebook analysis error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "يلزم تسجيل الدخول." },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "هذه الميزة للمعلم فقط." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ غير متوقع أثناء تحليل الدفتر.",
      },
      { status: 500 }
    );
  }
}
