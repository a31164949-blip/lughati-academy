import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";
const QUESTIONS = [
  { prompt: "اختر الكلمة التي تبدأ بحرف «م»:", options: ["مدرسة", "كتاب", "قلم"], correct: 0 },
  { prompt: "أي كلمة تحتوي على مد بالألف؟", options: ["كتب", "باب", "قلم"], correct: 1 },
  { prompt: "أي الكلمات كُتبت كتابة صحيحة؟", options: ["هاذا", "هذا", "هذة"], correct: 1 },
  { prompt: "ما عكس كلمة «كبير»؟", options: ["طويل", "جميل", "صغير"], correct: 2 },
];

async function identify(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof token.email === "string" ? token.email.toLowerCase() : "";
  const role = typeof token.role === "string" ? token.role : "";
  if (role === "teacher" || role === "admin" || email === TEACHER_EMAIL) {
    return { kind: "teacher" as const, id: token.uid, name: "المعلم" };
  }
  if (role !== "student") throw new Error("FORBIDDEN");
  const studentId = typeof token.studentDocId === "string" ? token.studentDocId : "";
  if (!studentId) throw new Error("FORBIDDEN");
  const snap = await adminDb.collection("students").doc(studentId).get();
  if (!snap.exists) throw new Error("FORBIDDEN");
  const data = snap.data() ?? {};
  const membership = data.academyClubMembership;
  const expiry = membership?.expiresAt instanceof Timestamp ? membership.expiresAt.toDate() : null;
  if (!membership || membership.active !== true || (expiry && expiry.getTime() < Date.now())) {
    throw new Error("MEMBERSHIP_REQUIRED");
  }
  return {
    kind: "student" as const,
    id: studentId,
    name: typeof data.studentName === "string" ? data.studentName : "طالب الأكاديمية",
  };
}

function cleanCode(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 6) : "";
}

async function roomPayload(code: string) {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection("academyClubLiveRooms").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("ROOM_NOT_FOUND");
  const data = snap.data() ?? {};
  const participantsSnap = await ref.collection("participants").orderBy("score", "desc").limit(30).get();
  const participants = participantsSnap.docs.map((doc) => {
    const row = doc.data();
    return { id: doc.id, name: row.name ?? "طالب", score: row.score ?? 0, answered: row.answeredQuestion === data.currentQuestion };
  });
  const index = typeof data.currentQuestion === "number" ? data.currentQuestion : -1;
  const question = data.status === "active" && QUESTIONS[index]
    ? { index, total: QUESTIONS.length, prompt: QUESTIONS[index].prompt, options: QUESTIONS[index].options }
    : null;
  return { code, status: data.status ?? "waiting", question, participants };
}

export async function GET(request: Request) {
  try {
    await identify(request);
    const code = cleanCode(new URL(request.url).searchParams.get("code"));
    if (!code) return NextResponse.json({ success: false, message: "أدخل رمز الغرفة." }, { status: 400 });
    return NextResponse.json({ success: true, room: await roomPayload(code) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { success: false, message: code === "ROOM_NOT_FOUND" ? "الغرفة غير موجودة." : code === "MEMBERSHIP_REQUIRED" ? "المشاركة خاصة بأعضاء النادي." : "تعذر تحميل الغرفة." },
      { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "MEMBERSHIP_REQUIRED" ? 403 : code === "ROOM_NOT_FOUND" ? 404 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await identify(request);
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const { adminDb } = getFirebaseAdmin();

    if (action === "create") {
      if (actor.kind !== "teacher") throw new Error("FORBIDDEN");
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await adminDb.collection("academyClubLiveRooms").doc(code).set({
        status: "waiting", currentQuestion: -1, createdBy: actor.id,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, room: await roomPayload(code) });
    }

    const code = cleanCode(body.code);
    if (!code) return NextResponse.json({ success: false, message: "رمز الغرفة غير صحيح." }, { status: 400 });
    const roomRef = adminDb.collection("academyClubLiveRooms").doc(code);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) throw new Error("ROOM_NOT_FOUND");

    if (action === "join") {
      if (actor.kind !== "student") throw new Error("FORBIDDEN");
      await roomRef.collection("participants").doc(actor.id).set({
        name: actor.name, score: 0, joinedAt: FieldValue.serverTimestamp(), answeredQuestion: -1,
      }, { merge: true });
      return NextResponse.json({ success: true, room: await roomPayload(code) });
    }

    if (action === "start" || action === "next") {
      if (actor.kind !== "teacher") throw new Error("FORBIDDEN");
      const current = Number(roomSnap.data()?.currentQuestion ?? -1);
      const next = action === "start" ? 0 : current + 1;
      await roomRef.update({
        status: next >= QUESTIONS.length ? "finished" : "active",
        currentQuestion: next,
        questionStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, room: await roomPayload(code) });
    }

    if (action === "answer") {
      if (actor.kind !== "student") throw new Error("FORBIDDEN");
      const data = roomSnap.data() ?? {};
      const index = Number(data.currentQuestion ?? -1);
      const option = Number(body.option);
      if (data.status !== "active" || !QUESTIONS[index]) throw new Error("NOT_ACTIVE");
      const answerRef = roomRef.collection("answers").doc(`${actor.id}_${index}`);
      const participantRef = roomRef.collection("participants").doc(actor.id);
      let result = { correct: false, points: 0 };
      await adminDb.runTransaction(async (tx) => {
        const [answerSnap, participantSnap] = await Promise.all([tx.get(answerRef), tx.get(participantRef)]);
        if (answerSnap.exists) throw new Error("ALREADY_ANSWERED");
        const correct = option === QUESTIONS[index].correct;
        const started = data.questionStartedAt instanceof Timestamp ? data.questionStartedAt.toMillis() : Date.now();
        const elapsed = Math.max(0, Date.now() - started);
        const speedBonus = correct ? Math.max(0, 5 - Math.floor(elapsed / 4000)) : 0;
        const points = correct ? 10 + speedBonus : 0;
        result = { correct, points };
        tx.set(answerRef, { studentId: actor.id, question: index, option, correct, points, answeredAt: FieldValue.serverTimestamp() });
        tx.set(participantRef, {
          name: actor.name,
          score: Number(participantSnap.data()?.score ?? 0) + points,
          answeredQuestion: index,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      });
      return NextResponse.json({ success: true, result, room: await roomPayload(code) });
    }

    return NextResponse.json({ success: false, message: "إجراء غير معروف." }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string,string> = {
      ROOM_NOT_FOUND: "الغرفة غير موجودة.",
      MEMBERSHIP_REQUIRED: "المشاركة خاصة بأعضاء النادي.",
      ALREADY_ANSWERED: "تم تسجيل إجابتك لهذه الجولة.",
      NOT_ACTIVE: "السؤال غير متاح الآن.",
      FORBIDDEN: "غير مصرح بهذا الإجراء.",
    };
    return NextResponse.json({ success: false, message: messages[code] ?? "تعذر تنفيذ العملية." }, { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "MEMBERSHIP_REQUIRED" ? 403 : 400 });
  }
}
