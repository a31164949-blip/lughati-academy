import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";
export const runtime="nodejs";
const TEACHER_EMAIL="a31164949@gmail.com";
async function teacher(request:Request){
 const h=request.headers.get("authorization"); if(!h?.startsWith("Bearer "))throw new Error("UNAUTHORIZED");
 const {adminAuth}=getFirebaseAdmin(); const d=await adminAuth.verifyIdToken(h.slice(7));
 const email=typeof d.email==="string"?d.email.toLowerCase():""; const role=typeof d.role==="string"?d.role:"";
 if(role!=="teacher"&&role!=="admin"&&email!==TEACHER_EMAIL)throw new Error("FORBIDDEN"); return d.uid;
}
export async function GET(request:Request){
 try{await teacher(request);const {adminDb}=getFirebaseAdmin();const s=await adminDb.collection("familySupportCases").orderBy("updatedAt","desc").limit(100).get();
 return NextResponse.json({success:true,cases:s.docs.map(d=>({id:d.id,...d.data()}))});}
 catch(e){const m=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر تحميل المتابعات."},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500});}
}
export async function POST(request:Request){
 try{const uid=await teacher(request);const body=await request.json() as Record<string,unknown>;const studentId=typeof body.studentId==="string"?body.studentId:"";
 const teacherMessage=typeof body.teacherMessage==="string"?body.teacherMessage.trim().slice(0,1200):"";
 const followUpPlan=typeof body.followUpPlan==="string"?body.followUpPlan.trim().slice(0,1200):"";
 const reviewDate=typeof body.reviewDate==="string"?body.reviewDate.trim().slice(0,20):"";
 if(!studentId)return NextResponse.json({success:false,message:"تعذر تحديد الطالب."},{status:400});
 const {adminDb}=getFirebaseAdmin();await adminDb.collection("familySupportCases").doc(studentId).set({studentId,teacherMessage,followUpPlan,reviewDate,status:followUpPlan?"plan-set":"teacher-message",teacherUpdatedBy:uid,teacherUpdatedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true});
 return NextResponse.json({success:true,message:"تم حفظ المتابعة."});}
 catch(e){const m=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر حفظ المتابعة."},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500});}
}