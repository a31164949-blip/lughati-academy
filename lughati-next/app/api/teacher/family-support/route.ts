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
 const studentName=typeof body.studentName==="string"?body.studentName.trim().slice(0,120):"";
 const classroom=typeof body.classroom==="string"?body.classroom.trim().slice(0,80):"";
 const supportInvite=body.supportInvite===true;
 if(!studentId)return NextResponse.json({success:false,message:"تعذر تحديد الطالب."},{status:400});
 const {adminDb}=getFirebaseAdmin();
 const payload:Record<string,unknown>={studentId,teacherMessage,followUpPlan,reviewDate,status:followUpPlan?"plan-set":"teacher-message",teacherUpdatedBy:uid,teacherUpdatedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()};
 if(studentName)payload.studentName=studentName;
 if(classroom)payload.classroom=classroom;
 if(supportInvite){
  payload.supportInvitedAt=FieldValue.serverTimestamp();
  payload.status="support-invited";
 }
 await adminDb.collection("familySupportCases").doc(studentId).set(payload,{merge:true});
 if(supportInvite){
  const notificationRef=adminDb.collection("studentNotifications").doc(`support-step-${studentId}`);
  await notificationRef.set({
   studentId,
   studentDocId:studentId,
   title:"🚨 تنبيه مهم جدًا",
   message:teacherMessage || "لديك خطوة دعم مهمة من معلمك. افتح «خطوتي تصنع الفرق» وابدأ خطوتك القادمة.",
   type:"important-support",
   href:"/support",
   read:false,
   opened:false,
   createdAt:FieldValue.serverTimestamp(),
   updatedAt:FieldValue.serverTimestamp(),
  },{merge:true});
 }
 return NextResponse.json({success:true,message:supportInvite?"تم إرسال خطوة الدعم للطالب والأسرة.":"تم حفظ المتابعة."});}
 catch(e){const m=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر حفظ المتابعة."},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500});}
}