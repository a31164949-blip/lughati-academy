import { NextResponse } from "next/server";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type NotebookAnalysis = {
  isNotebookPage: boolean;
  rejectionReason: string;
  suggestedCategory:
    | "handwriting"
    | "formatting"
    | "care"
    | "improvement";
  strengths: string[];
  improvementNote: string;
  confidence: number;
};

type NotebookAnalysisPayload = {
  imageUrl?: string;
  note?: string;
  autoCheck?: Record<string, unknown>;
};

type ResponsesApiData = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

class NotebookAnalysisError extends Error {
  constructor(
    readonly phase: string,
    readonly status: number,
    readonly safeMessage: string,
  ) {
    super(safeMessage);
  }
}

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isNotebookPage: { type: "boolean" },
    rejectionReason: { type: "string" },
    suggestedCategory: {
      type: "string",
      enum: ["handwriting", "formatting", "care", "improvement"],
    },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    improvementNote: { type: "string" },
    confidence: { type: "number" },
  },
  required: [
    "isNotebookPage",
    "rejectionReason",
    "suggestedCategory",
    "strengths",
    "improvementNote",
    "confidence",
  ],
} as const;

async function getStudentFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const { adminAuth, adminDb } = getFirebaseAdmin();
  const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7));

  if (decodedToken.role !== "student") {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId === "string"
      ? decodedToken.studentDocId.trim()
      : "";

  if (!studentDocId) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  const studentSnapshot = await adminDb.collection("students").doc(studentDocId).get();

  if (!studentSnapshot.exists) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  const data = studentSnapshot.data() || {};

  return {
    studentDocId,
    studentName:
      typeof data.studentName === "string"
        ? data.studentName
        : typeof data.name === "string"
          ? data.name
          : "طالب",
    classroom: typeof data.classroom === "string" ? data.classroom : "",
  };
}

async function analyzeNotebookImage(imageUrl: string): Promise<NotebookAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_NOTEBOOK_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    throw new NotebookAnalysisError(
      "configuration",
      500,
      "خدمة التحليل غير مهيأة على الخادم.",
    );
  }

  let parsedImageUrl: URL;

  try {
    parsedImageUrl = new URL(imageUrl);
  } catch {
    throw new NotebookAnalysisError(
      "image-validation",
      400,
      "رابط صورة الدفتر غير صالح.",
    );
  }

  if (parsedImageUrl.protocol !== "https:") {
    throw new NotebookAnalysisError(
      "image-validation",
      400,
      "يجب أن تكون صورة الدفتر قابلة للوصول عبر HTTPS.",
    );
  }

  console.info("Notebook analysis started", {
    phase: "openai-request",
    model,
    apiKeyConfigured: true,
    imageHost: parsedImageUrl.hostname,
  });

  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "أنت مقيّم تربوي لجماليات الدفاتر. افحص الصورة بصريًا قبل أي تقييم. اقبل فقط صفحة دفتر مدرسية حقيقية قابلة للتقييم، يظهر فيها دفتر مادي أو ورقة دفتر مع كتابة أو تنظيم دراسي واضح. ارفض لقطات الشاشة، لوحات Firebase أو المواقع والتطبيقات، الصور غير المرتبطة بالدفتر، الصور الفارغة أو التي لا يمكن التحقق منها. لا تعتبر وجود مستطيل أو نص مطبوع دليلًا على صفحة دفتر. عند الرفض اشرح للطالب سببًا تربويًا واضحًا بالعربية، واجعل strengths فارغة وconfidence منخفضة. عند القبول اقترح تصنيفًا واحدًا، واكتب نقاط قوة تربوية موجزة وملاحظة تطوير قصيرة. لا تمنح قرار الاعتماد النهائي؛ القرار للمعلم.",
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "حلّل هذه الصورة وفق القواعد السابقة." },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "notebook_evaluation",
          strict: true,
          schema: analysisSchema,
        },
        },
      }),
    });
  } catch {
    throw new NotebookAnalysisError(
      "openai-network",
      502,
      "تعذر الاتصال بخدمة التحليل.",
    );
  }

  const responseText = await response.text();
  let data: ResponsesApiData = {};

  try {
    data = responseText
      ? (JSON.parse(responseText) as ResponsesApiData)
      : {};
  } catch {
    console.error("Notebook analysis OpenAI response was not JSON", {
      phase: "openai-response",
      status: response.status,
    });
    throw new NotebookAnalysisError(
      "openai-response",
      response.status,
      "أعادت خدمة التحليل استجابة غير مفهومة.",
    );
  }

  if (!response.ok) {
    console.error("Notebook analysis OpenAI request failed", {
      phase: "openai-response",
      status: response.status,
      type: data.error?.type || "unknown",
      code: data.error?.code || "unknown",
      message: data.error?.message || "unknown",
    });
    throw new NotebookAnalysisError(
      "openai-response",
      response.status,
      "تعذر تحليل الصورة من خدمة الذكاء الاصطناعي. حاول مرة أخرى.",
    );
  }

  const outputText =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text" && content.text)
      ?.text;

  if (!outputText) {
    console.error("Notebook analysis response had no structured output", {
      phase: "structured-output-extraction",
      status: response.status,
    });
    throw new NotebookAnalysisError(
      "structured-output-extraction",
      response.status,
      "لم تُرجع خدمة التحليل نتيجة منظمة.",
    );
  }

  try {
    const result = JSON.parse(outputText) as NotebookAnalysis;
    return {
      ...result,
      strengths: Array.isArray(result.strengths)
        ? result.strengths.filter(
            (strength): strength is string => typeof strength === "string",
          ).slice(0, 4)
        : [],
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch {
    console.error("Notebook analysis structured output was invalid JSON", {
      phase: "structured-output-parsing",
      status: response.status,
    });
    throw new NotebookAnalysisError(
      "structured-output-parsing",
      response.status,
      "أعادت خدمة التحليل نتيجة غير صالحة.",
    );
  }
}

export async function GET(request: Request) {
  try {
    const { studentDocId } = await getStudentFromRequest(request);
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb
      .collection("notebookNominations")
      .where("studentId", "==", studentDocId)
      .get();

    const rejected = snapshot.docs
      .map((documentSnapshot) => documentSnapshot.data())
      .filter((data) => data.status === "rejected")
      .sort((left, right) => {
        const leftSeconds =
          typeof left.rejectedAt?.seconds === "number"
            ? left.rejectedAt.seconds
            : 0;
        const rightSeconds =
          typeof right.rejectedAt?.seconds === "number"
            ? right.rejectedAt.seconds
            : 0;
        return rightSeconds - leftSeconds;
      })[0];

    return NextResponse.json({
      success: true,
      rejectionReason:
        rejected && typeof rejected.rejectionReason === "string"
          ? rejected.rejectionReason
          : "",
    });
  } catch {
    return NextResponse.json(
      { success: false, rejectionReason: "" },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { studentDocId, studentName, classroom } = await getStudentFromRequest(request);
    const payload = (await request.json()) as NotebookAnalysisPayload;
    const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";
    const note = typeof payload.note === "string" ? payload.note.trim() : "";

    if (!imageUrl.startsWith("https://")) {
      return NextResponse.json(
        { success: false, message: "رابط صورة الدفتر غير صالح." },
        { status: 400 },
      );
    }

    if (note.length > 180) {
      return NextResponse.json(
        { success: false, message: "الملاحظة طويلة جدًا." },
        { status: 400 },
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const pendingSnapshot = await adminDb
      .collection("notebookNominations")
      .where("studentId", "==", studentDocId)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!pendingSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "لديك دفتر بانتظار المراجعة حاليًا. انتظر نتيجته قبل إرسال دفتر جديد.",
        },
        { status: 409 },
      );
    }

    const analysis = await analyzeNotebookImage(imageUrl);

    if (!analysis.isNotebookPage) {
      return NextResponse.json(
        {
          success: false,
          accepted: false,
          analysis,
          message:
            analysis.rejectionReason ||
            "هذه الصورة لا تُظهر صفحة دفتر مدرسية قابلة للتقييم. أرسل صورة واضحة لصفحة الدفتر نفسها.",
        },
        { status: 422 },
      );
    }

    const nominationRef = await adminDb.collection("notebookNominations").add({
      studentId: studentDocId,
      studentName,
      classroom,
      imageUrl,
      note,
      status: "pending",
      source: "student",
      rewardPoints: 5,
      rewardGranted: false,
      excellenceGranted: false,
      analysis,
      autoCheck: payload.autoCheck || {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      nominationId: nominationRef.id,
      analysis,
      message: "تم تحليل صورة الدفتر وإرسالها للمعلم. تُمنح النقاط فقط بعد الاعتماد.",
    });
  } catch (error) {
    if (error instanceof NotebookAnalysisError) {
      console.error("Notebook analysis failed", {
        phase: error.phase,
        status: error.status,
        message: error.safeMessage,
      });

      return NextResponse.json(
        {
          success: false,
          retryable: error.status >= 500,
          message: error.safeMessage,
        },
        { status: error.status >= 500 ? 503 : error.status },
      );
    }

    console.error("Notebook analysis API error", {
      phase: "request-processing",
      message: error instanceof Error ? error.message : "unknown",
    });

    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "انتهت جلسة الطالب. سجّل الدخول مرة أخرى." },
        { status: 401 },
      );
    }

    if (errorMessage === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "هذا المسار مخصص للطلاب." },
        { status: 403 },
      );
    }

    if (errorMessage === "STUDENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "تعذر العثور على حساب الطالب." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        retryable: true,
        message: "تعذر تحليل الصورة الآن. لم يُنشأ ترشيح، ويمكنك إعادة المحاولة.",
      },
      { status: 503 },
    );
  }
}