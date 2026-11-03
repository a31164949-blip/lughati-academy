import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";
import { requireClubMember } from "../../../lib/clubMember";
export const runtime = "nodejs";
export async function POST(request: Request) {
 try {
  const student = await requireClubMember(request);
  const b = await request.json();
  if (!Number.isInteger(b.stars) || b.stars < 0 || b.stars > 62 || !["faris","saqr","maher","barq"].includes(b.hero) || typeof b.roundId !== "string" || !/^[a-zA-Z0-9-]{10,80}$/.test(b.roundId)) return NextResponse.json({success:false},{status:400});
  const {adminDb} = getFirebaseAdmin();
  const ref = adminDb.collection("lughatiCityResults").doc(student.studentId);
  await adminDb.runTransaction(async tx => {
   const previous = (await tx.get(ref)).data();
   if(previous?.roundId === b.roundId) return;
   tx.set(ref,{...student, stars:b.stars, hero:b.hero, roundId:b.roundId, completedStages:4, version:"2026-11-v2", completedAt:FieldValue.serverTimestamp(), attempts:Number(previous?.attempts || 0)+1, bestStars:Math.max(Number(previous?.bestStars || 0),b.stars)});
  });
  return NextResponse.json({success:true});
 } catch(e) {
  const code=e instanceof Error?e.message:"";
  return NextResponse.json({success:false},{status:code==="UNAUTHORIZED"?401:["FORBIDDEN","MEMBERSHIP_REQUIRED","STUDENT_NOT_FOUND"].includes(code)?403:500});
 }
}
export async function GET(request: Request) {
 try {
  const {adminAuth,adminDb}=getFirebaseAdmin();
  const header=request.headers.get("authorization");
  if(!header?.startsWith("Bearer ")) return NextResponse.json({success:false},{status:401});
  const token=await adminAuth.verifyIdToken(header.slice(7));
  if(token.role!=="teacher" && token.role!=="admin" && token.email?.toLowerCase()!=="a31164949@gmail.com") return NextResponse.json({success:false},{status:403});
  const cursor=new URL(request.url).searchParams.get("cursor");
  if(cursor && !/^[a-zA-Z0-9_-]{1,128}$/.test(cursor)) return NextResponse.json({success:false},{status:400});
  let query=adminDb.collection("lughatiCityResults").orderBy("__name__").limit(30);
  if(cursor) query=query.startAfter(cursor);
  const snap=await query.get();
  return NextResponse.json({success:true,rows:snap.docs.map(d=>{const v=d.data();return {...v,id:d.id,completedAt:v.completedAt?.toDate().toISOString() || ""}}),cursor:snap.size===30?snap.docs[29].id:null},{headers:{"Cache-Control":"no-store"}});
 } catch {return NextResponse.json({success:false},{status:500});}
}
