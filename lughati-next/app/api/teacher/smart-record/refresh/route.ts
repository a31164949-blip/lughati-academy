import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../../firebase-admin";
import { smartRecordCacheTag, smartRecordClassroom } from "../../../../lib/studentSmartFollowUp";

export async function POST(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const token = await getFirebaseAdmin({ allowSuspended: true }).adminAuth.verifyIdToken(header.slice(7));
    if (token.role !== "teacher" && token.role !== "admin" && token.email?.toLowerCase() !== "a31164949@gmail.com") return NextResponse.json({ success: false }, { status: 403 });
    const body = await request.json();
    const classroom = smartRecordClassroom(body?.classroom);
    if (!classroom) return NextResponse.json({ success: false }, { status: 400 });
    revalidateTag(smartRecordCacheTag(classroom), { expire: 0 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
