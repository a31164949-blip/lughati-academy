import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

async function requireStudent(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.role !== "student" || typeof decoded.studentDocId !== "string") throw new Error("FORBIDDEN");
  return { uid: decoded.uid, studentDocId: decoded.studentDocId };
}

export async function GET(request: Request) {
  try {
    const { studentDocId } = await requireStudent(request);
    const { adminDb } = getFirebaseAdmin();
    const student = await adminDb.collection("students").doc(studentDocId).get();
    if (!student.exists) return NextResponse.json({ success:false, message:"لم يتم العثور على الطالب." }, {status:404});
    const data = student.data() ?? {};
    const support = await adminDb.collection("familySupportCases").doc(studentDocId).get();
    return NextResponse.json({
      success:true,
      student:{ id:student.id, name:String(data.studentName ?? "الطالب"), classroom:String(data.classroom ?? "") },
      support: support.exists ? support.data() : null,
    });
  } catch (error) {
    const message=error instanceof Error?error.message:"";
    return NextResponse.json({success:false,message:"تعذر فتح المتابعة."},{status:message==="UNAUTHORIZED"?401:message==="FORBIDDEN"?403:500});
  }
}

export async function POST(request: Request) {
  try {
    const { uid, studentDocId } = await requireStudent(request);
    const body = await request.json() as Record<string,unknown>;
    const barriers = Array.isArray(body.barriers) ? body.barriers.filter((x):x is string=>typeof x==="string").slice(0,6) : [];
    const note = typeof body.note==="string" ? body.note.trim().slice(0,1000) : "";
    const requestedHelp = typeof body.requestedHelp==="string" ? body.requestedHelp.trim().slice(0,1000) : "";
    if (!barriers.length) return NextResponse.json({success:false,message:"اختر سببًا واحدًا على الأقل."},{status:400});
    const { adminDb } = getFirebaseAdmin();
    const student = await adminDb.collection("students").doc(studentDocId).get();
    if (!student.exists) return NextResponse.json({success:false,message:"لم يتم العثور على الطالب."},{status:404});
    const data=student.data()??{};
    await adminDb.collection("familySupportCases").doc(studentDocId).set({
      studentId:studentDocId,
      studentName:String(data.studentName??"الطالب"),
      classroom:String(data.classroom??""),
      barriers,note,requestedHelp,
      familyReplyAt:FieldValue.serverTimestamp(),
      familyReplyBy:uid,
      status:"family-replied",
      updatedAt:FieldValue.serverTimestamp(),
    },{merge:true});
    return NextResponse.json({success:true,message:"وصل ردكم للمعلم، شكرًا لتعاونكم."});
  } catch (error) {
    const message=error instanceof Error?error.message:"";
    return NextResponse.json({success:false,message:"تعذر إرسال الرد."},{status:message==="UNAUTHORIZED"?401:message==="FORBIDDEN"?403:500});
  }
}
