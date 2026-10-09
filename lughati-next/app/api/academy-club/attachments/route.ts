import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../firebase-admin";
import { mediaActor } from "../../../lib/r2Media";
import { requireClubMember } from "../../../lib/clubMember";
import { videoPlaybackUrl } from "../../../lib/r2Video";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await mediaActor(request);
    if (!actor.teacher) await requireClubMember(request);
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("NOT_FOUND");
    const { adminDb } = getFirebaseAdmin();
    const challenge = (await adminDb.collection("academyClubChallenges").doc("current").get()).data();
    if (!challenge || challenge.active !== true || !Array.isArray(challenge.attachments) || !challenge.attachments.some(item => item.id === id)) throw new Error("NOT_FOUND");
    const data = (await adminDb.collection("clubAttachmentUploads").doc(id).get()).data();
    if (!data?.key || data.uid !== challenge.createdBy) throw new Error("NOT_FOUND");
    return NextResponse.json({ url: await videoPlaybackUrl(data.key) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: "المرفق متاح لأعضاء النادي فقط ضمن التحدي المنشور." }, { status: code === "UNAUTHORIZED" ? 401 : code === "NOT_FOUND" ? 404 : 403, headers: { "Cache-Control": "no-store" } });
  }
}
