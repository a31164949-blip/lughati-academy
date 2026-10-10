import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const { adminAuth } = getFirebaseAdmin();
    const token = await adminAuth.verifyIdToken(authorization.slice(7));
    if (token.role !== "teacher" && token.role !== "admin" && token.email?.toLowerCase() !== "a31164949@gmail.com") return NextResponse.json({ success: false }, { status: 403 });
    for (const tag of ["shared-public-content", "public-announcements", "public-academy-board", "public-gallery"]) revalidateTag(tag, { expire: 0 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
