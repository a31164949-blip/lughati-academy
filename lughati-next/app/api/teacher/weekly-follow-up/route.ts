import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime="nodejs";
const TEACHER_EMAIL="a31164949@gmail.com";

async function teacher(request:Request){
 const h=request.headers.get("authorization"); if(!h?.startsWith("Bearer "))throw new Error("UNAUTHORIZED");
 const {adminAuth}=getFirebaseAdmin(); const d=await adminAuth.verifyIdToken(h.slice(7));
 const email=typeof d.email==="string"?d.email.toLowerCase():""; const role=typeof d.role==="string"?d.role:"";
 if(role!=="teacher"&&role!=="admin"&&email!==TEACHER_EMAIL)throw new Error("FORBIDDEN");
}

function dateKey(value:unknown){
 if(!value)return "";
 if(typeof value==="string"){const m=value.match(/^\d{4}-\d{2}-\d{2}/);if(m)return m[0];const d=new Date(value);if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);}
 if(typeof value==="object"&&value!==null){const t=value as {toDate?:()=>Date;seconds?:number;_seconds?:number};if(typeof t.toDate==="function")return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"}).format(t.toDate());const s=t.seconds??t._seconds;if(typeof s==="number")return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(s*1000));}
 return "";
}
function firstDate(data:Record<string,unknown>,fields:string[]){for(const f of fields){const k=dateKey(data[f]);if(k)return k;}return "";}
function week(){
 const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"});
 const today=fmt.format(new Date());const [y,m,d]=today.split("-").map(Number);const noon=new Date(Date.UTC(y,m-1,d,12));const dow=noon.getUTCDay();
 const add=(n:number)=>fmt.format(new Date(Date.UTC(y,m-1,d+n,12)));
 return {start:add(-dow),end:add(6-dow)};
}

export async function GET(request:Request){
 try{
  await teacher(request);const {adminDb}=getFirebaseAdmin();const {start,end}=week();
  const [students,homeworks,readings,cases]=await Promise.all([
   adminDb.collection("students").get(),
   adminDb.collection("homeworkCompletions").get(),
   adminDb.collection("reading-submissions").get(),
   adminDb.collection("familySupportCases").get()
  ]);
  type Row={id:string;studentName:string;classroom:string;readings:number;homeworks:number;invited:boolean};
  const rows=new Map<string,Row>(),aliases=new Map<string,string>();
  students.docs.forEach(doc=>{const d=doc.data() as Record<string,unknown>;if(d.deleted===true||d.active===false||d.isActive===false||d.archived===true||d.temporary===true)return;const logical=typeof d.studentId==="string"&&d.studentId.trim()?d.studentId.trim():doc.id;const name=String(d.studentName??d.name??d.fullName??"الطالب").trim();if(!name||/تجريبي|اختبار|test/i.test(name))return;rows.set(doc.id,{id:doc.id,studentName:name,classroom:String(d.classroom??""),readings:0,homeworks:0,invited:false});aliases.set(doc.id,doc.id);aliases.set(logical,doc.id);});
  const resolve=(v:unknown)=>typeof v==="string"?rows.get(aliases.get(v.trim())??v.trim()):undefined;
  const hwSeen=new Set<string>();
  homeworks.docs.forEach(doc=>{const d=doc.data() as Record<string,unknown>,r=resolve(d.studentId??d.studentDocId);if(!r)return;const ok=d.solutionStatus==="approved"||d.status==="approved"||d.teacherReviewed===true||d.approved===true;if(!ok)return;const k=firstDate(d,["solutionReviewedAt","reviewedAt","approvedAt","updatedAt","completedAt","createdAt"]);if(k<start||k>end)return;const hid=typeof d.homeworkId==="string"&&d.homeworkId.trim()?d.homeworkId.trim():doc.id;const u=r.id+":"+hid;if(hwSeen.has(u))return;hwSeen.add(u);r.homeworks++;});
  const rdSeen=new Set<string>();
  readings.docs.forEach(doc=>{const d=doc.data() as Record<string,unknown>,r=resolve(d.studentId??d.studentDocId);if(!r||d.status!=="approved")return;const k=typeof d.readingDate==="string"?d.readingDate.slice(0,10):firstDate(d,["reviewedAt","approvedAt","createdAt"]);if(k<start||k>end)return;const u=r.id+":"+k;if(rdSeen.has(u))return;rdSeen.add(u);r.readings++;});
  cases.docs.forEach(doc=>{const r=rows.get(doc.id);if(r&&(doc.data() as Record<string,unknown>).supportInvitedAt)r.invited=true;});
  const maxR=Math.max(1,...[...rows.values()].map(r=>r.readings)),maxH=Math.max(1,...[...rows.values()].map(r=>r.homeworks));
  const result=[...rows.values()].map(r=>{const score=Math.round(((r.readings/maxR)*50+(r.homeworks/maxH)*50)*100)/100;return {...r,score,level:score<=25?"needs-support":score<=50?"follow-up":"stable"};}).sort((a,b)=>a.score-b.score||a.studentName.localeCompare(b.studentName,"ar"));
  return NextResponse.json({success:true,weekStart:start,weekEnd:end,students:result});
 }catch(e){const m=e instanceof Error?e.message:"";return NextResponse.json({success:false,message:"تعذر تحميل مؤشر المتابعة."},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:500});}
}
