import { NextResponse } from "next/server";
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { requireStudentExtras } from "../../lib/studentAccess";
import { thinkingWorksheets } from "../../lib/thinkingWorksheets";
import { thinkingWorksheetAnswers } from "../../lib/thinkingWorksheetAnswers";
export const runtime = "nodejs";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
async function identity(req: Request) {
 const h = req.headers.get("authorization");
 if (!h?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
 const { adminAuth, adminDb: db } = getFirebaseAdmin();
 const token = await adminAuth.verifyIdToken(h.slice(7)).catch(() => { throw new Error("UNAUTHORIZED"); });
 const teacher = token.role === "teacher" || token.role === "admin" || token.email?.toLowerCase() === "a31164949@gmail.com";
 if (teacher) return { db, teacher, id: token.uid, name: "المعلم" };
 if (token.role !== "student" || typeof token.studentDocId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(token.studentDocId)) throw new Error("FORBIDDEN");
 const student = (await db.collection("students").doc(token.studentDocId).get()).data();
 if (!student) throw new Error("FORBIDDEN");
 await requireStudentExtras(token.studentDocId, student);
 return { db, teacher: false, id: token.studentDocId, name: String(student.studentName ?? student.name ?? "طالب") };
}
function fail(e: unknown) { const code = e instanceof Error ? e.message : ""; return json({ success: false, message: code === "INVALID" ? "أجب عن جميع الأسئلة وراجع النص ثم حاول مجددًا." : code === "UNAUTHORIZED" ? "سجّل الدخول أولًا." : code === "FORBIDDEN" ? "هذه الخدمة غير متاحة لهذا الحساب حاليًا." : "تعذر حفظ النتيجة. حاول مجددًا." }, code === "INVALID" ? 400 : code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500); }
export async function POST(req: Request) {
 try {
  const { db, teacher, id, name } = await identity(req);
  if (teacher) throw new Error("FORBIDDEN");
  const body = await req.json();
  const sheet = thinkingWorksheets.find(s => s.id === body.worksheetId);
  if (!sheet || !Array.isArray(body.answers) || body.answers.length !== sheet.questions.length || !body.answers.every((a: unknown, i: number) => Number.isInteger(a) && Number(a) >= 0 && Number(a) < sheet.questions[i].options.length) || typeof body.reflection !== "string" || body.reflection.length > 300) throw new Error("INVALID");
  const key = thinkingWorksheetAnswers[sheet.id];
  const feedback = key.map((k, i) => ({ correct: k.answer === body.answers[i], correctAnswer: k.answer, explanation: k.explanation }));
  const score = feedback.filter(f => f.correct).length;
  const ref = db.collection("thinkingWorksheetResults").doc(`${id}__${sheet.id}`);
  await db.runTransaction(async tx => {
   const old = (await tx.get(ref)).data();
   tx.set(ref, { studentId: id, studentName: name, worksheetId: sheet.id, worksheetTitle: sheet.title, score, bestScore: Math.max(Number(old?.bestScore ?? 0), score), firstScore: old?.firstScore ?? score, total: key.length, attempts: Number(old?.attempts ?? 0) + 1, answers: body.answers, reflection: body.reflection.trim(), updatedAt: FieldValue.serverTimestamp() });
  });
  return json({ success: true, score, total: key.length, feedback });
 } catch(e) { return fail(e); }
}
export async function GET(req: Request) {
 try {
  const { db, teacher } = await identity(req);
  if (!teacher) throw new Error("FORBIDDEN");
  const cursor = new URL(req.url).searchParams.get("cursor");
  if (cursor && !/^[A-Za-z0-9_-]{1,260}$/.test(cursor)) throw new Error("INVALID");
  let query = db.collection("thinkingWorksheetResults").orderBy(FieldPath.documentId()).limit(20);
  if (cursor) query = query.startAfter(cursor);
  const rows = await query.get();
  return json({ success: true, results: rows.docs.map(row => ({ id: row.id, ...row.data(), updatedAt: row.data().updatedAt?.toDate?.().toISOString() ?? null })), cursor: rows.size === 20 ? rows.docs[19].id : null });
 } catch(e) { return fail(e); }
}
