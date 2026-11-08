import { canViewPollVoters } from "./voter-access";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";
export const runtime="nodejs"; const EMAIL="a31164949@gmail.com";
async function teacher(req:Request){const h=req.headers.get("authorization");if(!h?.startsWith("Bearer "))throw new Error("UNAUTHORIZED");const {adminAuth,adminDb}=getFirebaseAdmin();const t=await adminAuth.verifyIdToken(h.slice(7));const email=typeof t.email==="string"?t.email.toLowerCase():"";if(t.role!=="teacher"&&t.role!=="admin"&&email!==EMAIL)throw new Error("FORBIDDEN");return {uid:t.uid,db:adminDb,claims:t};}
function iso(v:unknown){return v instanceof Timestamp?v.toDate().toISOString():"";}
export async function GET(req:Request){try{const {db,claims}=await teacher(req);const details=new URL(req.url).searchParams.get("voters")==="1";if(details&&!canViewPollVoters(claims,EMAIL))throw new Error("FORBIDDEN");const p=await db.collection("studentPolls").doc("current").get();const d=p.exists?p.data()??{}:null;
const pollId=details?String(d?.pollId??""):"";
const votes=pollId?await db.collection("studentPollVotes").where("pollId","==",pollId).get():null;
const voteRows=votes?.docs??[];
const studentDocs=await Promise.all(voteRows.map(v=>String(v.data().studentId??"")?db.collection("students").doc(String(v.data().studentId)).get():Promise.resolve(null)));
const voters=voteRows.map((v,i)=>{const data=v.data(),student=studentDocs[i]?.data()??{};return {
studentId:String(data.studentId??""),name:String(student.studentName??student.name??"طالب غير معروف"),
classroom:String(student.classroom??student.className??student.class??"غير محدد"),
optionIndex:Number(data.optionIndex),votedAt:iso(data.updatedAt??data.createdAt)
};}).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
return NextResponse.json({success:true,voters,poll:d?{pollId:d.pollId,question:d.question,options:d.options??[],active:d.active===true,showResults:d.showResults===true,counts:d.counts??{},totalVotes:d.totalVotes??0,closesAt:iso(d.closesAt)}:null});}catch(e){const c=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر تحميل التصويت."},{status:c==="UNAUTHORIZED"?401:c==="FORBIDDEN"?403:500});}}
export async function POST(req:Request){try{const {uid,db}=await teacher(req);const b=await req.json();const question=typeof b.question==="string"?b.question.trim().slice(0,220):"";const options=Array.isArray(b.options)?b.options.map((x:unknown)=>typeof x==="string"?x.trim().slice(0,100):"").filter(Boolean).slice(0,4):[];const durationHours=Math.max(1,Math.min(168,Number(b.durationHours)||24));if(!question||options.length<2)return NextResponse.json({success:false,message:"أضف سؤالًا وخيارين على الأقل."},{status:400});const now=Date.now(),pollId=randomUUID();await db.collection("studentPolls").doc("current").set({pollId,question,options,active:true,showResults:b.showResults===true,counts:Object.fromEntries(options.map((_:string,i:number)=>[String(i),0])),totalVotes:0,createdBy:uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),closesAt:Timestamp.fromMillis(now+durationHours*3600000)});return NextResponse.json({success:true,pollId});}catch(e){const c=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر نشر التصويت."},{status:c==="UNAUTHORIZED"?401:c==="FORBIDDEN"?403:500});}}
export async function PATCH(req:Request){try{const {db}=await teacher(req);const b=await req.json();const u:Record<string,unknown>={updatedAt:FieldValue.serverTimestamp()};if(typeof b.active==="boolean"){u.active=b.active;if(b.active)u.closesAt=Timestamp.fromMillis(Date.now()+24*3600000);}if(typeof b.showResults==="boolean")u.showResults=b.showResults;await db.collection("studentPolls").doc("current").update(u);return NextResponse.json({success:true});}catch(e){const c=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر تحديث التصويت."},{status:c==="UNAUTHORIZED"?401:c==="FORBIDDEN"?403:500});}}
