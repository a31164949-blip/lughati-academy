import { requireStudentExtras } from "../../../lib/studentAccess";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp, type Transaction, type DocumentReference, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";
const MAX_PARTICIPANTS = 30;
type Player = { id: string; name: string; score: number; answeredQuestion: number };
type VoiceAnswer = { studentId: string; name: string; question: number; audioUrl: string; points: number | null };
const QUESTIONS = [
  { prompt: "اِقْرَأِ الْجُمْلَةَ الْآتِيَةَ بِصَوْتِكَ: ذَهَبَ خَالِدٌ إِلَى الْمَدْرَسَةِ.", guide: "قِرَاءَةُ الْجُمْلَةِ كَامِلَةً بِوُضُوحٍ: ذَهَبَ خَالِدٌ إِلَى الْمَدْرَسَةِ." },
  { prompt: "اِقْرَأِ الْجُمْلَةَ الْآتِيَةَ بِصَوْتِكَ: تَسْقِي سَارَةُ الزُّهُورَ.", guide: "قِرَاءَةُ الْجُمْلَةِ كَامِلَةً بِوُضُوحٍ: تَسْقِي سَارَةُ الزُّهُورَ." },
  { prompt: "مَا جَمْعُ كَلِمَةِ «قَلَمٌ»؟ أَجِبْ بِصَوْتِكَ بِكَلِمَةٍ وَاحِدَةٍ فَقَطْ.", guide: "الْإِجَابَةُ: أَقْلَامٌ." },
  { prompt: "مَا ضِدُّ كَلِمَةِ «كَبِيرٌ»؟ أَجِبْ بِصَوْتِكَ بِكَلِمَةٍ وَاحِدَةٍ فَقَطْ.", guide: "الْإِجَابَةُ: صَغِيرٌ." },
  { prompt: "أَكْمِلْ بِكَلِمَةٍ وَاحِدَةٍ: نَكْتُبُ بِـ… أَجِبْ بِصَوْتِكَ.", guide: "الْإِجَابَةُ: الْقَلَمِ. تُقْبَلُ كَلِمَةٌ مُنَاسِبَةٌ صَحِيحَةٌ مِثْلُ: قَلَمٍ." },
  { prompt: "أَيُّ كَلِمَةٍ تَحْتَوِي عَلَى لَامٍ شَمْسِيَّةٍ: «الْقَمَرُ» أَمْ «الشَّمْسُ»؟ أَجِبْ بِصَوْتِكَ بِكَلِمَةٍ وَاحِدَةٍ فَقَطْ.", guide: "الْإِجَابَةُ: الشَّمْسُ." },
  { prompt: "مَا مُفْرَدُ كَلِمَةِ «كُتُبٌ»؟ أَجِبْ بِصَوْتِكَ بِكَلِمَةٍ وَاحِدَةٍ فَقَطْ.", guide: "الْإِجَابَةُ: كِتَابٌ." },
  { prompt: "مَا مَعْنَى كَلِمَةِ «مَسْرُورٌ»: «سَعِيدٌ» أَمْ «حَزِينٌ»؟ أَجِبْ بِصَوْتِكَ بِكَلِمَةٍ وَاحِدَةٍ فَقَطْ.", guide: "الْإِجَابَةُ: سَعِيدٌ." },
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
  await requireStudentExtras(studentId, data);
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

async function roomPayload(code: string, actorId?: string, teacher = false) {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection("academyClubLiveRooms").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("ROOM_NOT_FOUND");
  const data = snap.data() ?? {};
  // New rooms keep their small scoreboard in one document, avoiding a query per poll.
  const roster: Player[] = Array.isArray(data.leaderboard)
    ? data.leaderboard
    : (await ref.collection("participants").orderBy("score", "desc").limit(MAX_PARTICIPANTS).get())
        .docs.map((doc) => ({ id: doc.id, ...doc.data() } as Player));
  const participants = [...roster].sort((a, b) => b.score - a.score).map((row) => ({
    id: row.id, name: row.name, score: row.score,
    answered: row.answeredQuestion === data.currentQuestion,
  }));
  const index = typeof data.currentQuestion === "number" ? data.currentQuestion : -1;
  const question = data.status === "active" && QUESTIONS[index]
    ? { index, total: QUESTIONS.length, prompt: QUESTIONS[index].prompt, options: [], kind: "voice", ...(teacher ? { guide: QUESTIONS[index].guide } : {}) }
    : null;
  return { code, status: data.status ?? "waiting", question, participants,
    ...(teacher ? { voiceAnswers: (data.voiceAnswers ?? []) as VoiceAnswer[] } : {}),
    answered: data.status === "active" && roster.some((player) => player.id === actorId && player.answeredQuestion === index),
  };
}

// Migrate older rooms only on a write; never repeatedly read all players for new rooms.
async function transactionRoster(tx: Transaction, ref: DocumentReference, data: DocumentData): Promise<Player[]> {
  if (Array.isArray(data.leaderboard)) return data.leaderboard;
  const snap = await tx.get(ref.collection("participants"));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Player));
}

export async function GET(request: Request) {
  try {
    const actor = await identify(request);
    const code = cleanCode(new URL(request.url).searchParams.get("code"));
    if (!code) return NextResponse.json({ success: false, message: "أدخل رمز الغرفة." }, { status: 400 });
    return NextResponse.json({ success: true, room: await roomPayload(code, actor.id, actor.kind === "teacher") });
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
        status: "waiting", currentQuestion: -1, createdBy: actor.id, leaderboard: [],
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, room: await roomPayload(code, actor.id, actor.kind === "teacher") });
    }

    const code = cleanCode(body.code);
    if (!code) return NextResponse.json({ success: false, message: "رمز الغرفة غير صحيح." }, { status: 400 });
    const roomRef = adminDb.collection("academyClubLiveRooms").doc(code);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) throw new Error("ROOM_NOT_FOUND");

    if (action === "join") {
      if (actor.kind !== "student") throw new Error("FORBIDDEN");
      const participantRef = roomRef.collection("participants").doc(actor.id);
      await adminDb.runTransaction(async (tx) => {
        const [freshRoom, existing] = await Promise.all([tx.get(roomRef), tx.get(participantRef)]);
        if (!freshRoom.exists) throw new Error("ROOM_NOT_FOUND");
        const data = freshRoom.data() ?? {};
        const roster = await transactionRoster(tx, roomRef, data);
        // Rejoining must preserve both the score and the answered question.
        if (existing.exists) {
          if (!Array.isArray(data.leaderboard)) tx.update(roomRef, { leaderboard: roster });
          return;
        }
        if (data.status === "finished") throw new Error("ROOM_FINISHED");
        if (roster.length >= MAX_PARTICIPANTS) throw new Error("ROOM_FULL");
        const player = { id: actor.id, name: actor.name, score: 0, answeredQuestion: -1 };
        tx.create(participantRef, {
          name: player.name, score: 0, answeredQuestion: -1, joinedAt: FieldValue.serverTimestamp(),
        });
        tx.update(roomRef, { leaderboard: [...roster, player], updatedAt: FieldValue.serverTimestamp() });
      });
      return NextResponse.json({ success: true, room: await roomPayload(code, actor.id) });
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
      return NextResponse.json({ success: true, room: await roomPayload(code, actor.id, actor.kind === "teacher") });
    }

    if (action === "review") {
      if (actor.kind !== "teacher" || roomSnap.data()?.createdBy !== actor.id) throw new Error("FORBIDDEN");
      const studentId = typeof body.studentId === "string" ? body.studentId : "";
      const question = body.question;
      const points = body.points;
      if (!Number.isInteger(question) || ![0, 5, 10].includes(points as number)) throw new Error("INVALID_ANSWER");
      await adminDb.runTransaction(async (tx) => {
        const participantRef = roomRef.collection("participants").doc(studentId);
        const answerRef = roomRef.collection("answers").doc(`${studentId}_${question}`);
        const [freshRoom, participantSnap, answerSnap] = await Promise.all([tx.get(roomRef), tx.get(participantRef), tx.get(answerRef)]);
        if (!freshRoom.exists || !participantSnap.exists || !answerSnap.exists) throw new Error("JOIN_REQUIRED");
        if (answerSnap.data()?.points !== null) throw new Error("ALREADY_REVIEWED");
        const data = freshRoom.data() ?? {};
        const roster = await transactionRoster(tx, roomRef, data);
        const score = Number(participantSnap.data()?.score ?? 0) + (points as number);
        tx.update(answerRef, { points, reviewedAt: FieldValue.serverTimestamp() });
        tx.update(participantRef, { score });
        tx.update(roomRef, {
          leaderboard: roster.map(player => player.id === studentId ? { ...player, score } : player),
          voiceAnswers: ((data.voiceAnswers ?? []) as VoiceAnswer[]).map(answer =>
            answer.studentId === studentId && answer.question === question ? { ...answer, points: points as number } : answer),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      return NextResponse.json({ success: true, room: await roomPayload(code, actor.id, true) });
    }

    if (action === "answer") {
      if (actor.kind !== "student") throw new Error("FORBIDDEN");
      const audioUrl = typeof body.audioUrl === "string" ? body.audioUrl : "";
      let validAudio = false;
      try {
        const url = new URL(audioUrl);
        validAudio = audioUrl.length < 600 && url.protocol === "https:" && url.hostname === "res.cloudinary.com"
          && url.pathname.startsWith("/ffv5igmg/video/upload/") && !url.search && !url.hash;
      } catch { /* Invalid URL. */ }
      if (!validAudio || !Number.isInteger(body.question)) throw new Error("INVALID_AUDIO");
      const participantRef = roomRef.collection("participants").doc(actor.id);
      await adminDb.runTransaction(async (tx) => {
        const [freshRoom, participantSnap] = await Promise.all([tx.get(roomRef), tx.get(participantRef)]);
        const data = freshRoom.data() ?? {};
        const index = Number(data.currentQuestion ?? -1);
        if (!freshRoom.exists || data.status !== "active" || !QUESTIONS[index]) throw new Error("NOT_ACTIVE");
        if (body.question !== index) throw new Error("QUESTION_CHANGED");
        if (!participantSnap.exists) throw new Error("JOIN_REQUIRED");
        const answerRef = roomRef.collection("answers").doc(`${actor.id}_${index}`);
        const [answerSnap, roster] = await Promise.all([tx.get(answerRef), transactionRoster(tx, roomRef, data)]);
        if (answerSnap.exists) throw new Error("ALREADY_ANSWERED");
        const answer: VoiceAnswer = { studentId: actor.id, name: actor.name, question: index, audioUrl, points: null };
        tx.create(answerRef, { ...answer, answeredAt: FieldValue.serverTimestamp() });
        tx.update(participantRef, { answeredQuestion: index, updatedAt: FieldValue.serverTimestamp() });
        tx.update(roomRef, {
          leaderboard: roster.map(player => player.id === actor.id ? { ...player, answeredQuestion: index } : player),
          voiceAnswers: [...((data.voiceAnswers ?? []) as VoiceAnswer[]), answer],
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      return NextResponse.json({ success: true, room: await roomPayload(code, actor.id) });
    }

    return NextResponse.json({ success: false, message: "إجراء غير معروف." }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string,string> = {
      ROOM_NOT_FOUND: "الغرفة غير موجودة.",
      ROOM_FULL: "اكتملت الغرفة؛ الحد الأعلى 30 طالبًا.",
      ROOM_FINISHED: "انتهت هذه المسابقة؛ انتظر غرفة جديدة.",
      JOIN_REQUIRED: "انضم إلى الغرفة أولًا.",
      INVALID_ANSWER: "قيمة التقييم غير صحيحة.",
      INVALID_AUDIO: "أرسل تسجيلًا صوتيًا صالحًا للإجابة.",
      QUESTION_CHANGED: "انتقل المعلم إلى سؤال آخر؛ لم تُحتسب هذه الإجابة للسؤال الجديد.",
      ALREADY_REVIEWED: "سبق اعتماد نقاط هذه الإجابة.",
      MEMBERSHIP_REQUIRED: "المشاركة خاصة بأعضاء النادي.",
      ALREADY_ANSWERED: "تم تسجيل إجابتك لهذه الجولة.",
      NOT_ACTIVE: "السؤال غير متاح الآن.",
      FORBIDDEN: "غير مصرح بهذا الإجراء.",
    };
    return NextResponse.json({ success: false, message: messages[code] ?? "تعذر تنفيذ العملية." }, { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "MEMBERSHIP_REQUIRED" ? 403 : 400 });
  }
}
