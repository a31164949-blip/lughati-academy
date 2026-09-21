import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

const EVENT_START = Date.parse("2026-09-20T00:00:00+03:00");
const EVENT_END = Date.parse("2026-09-27T00:00:00+03:00");
const CONFIG: Record<number,{reward:number;target:number;questions:number}> = {
  1:{reward:5,target:30,questions:5}, 2:{reward:10,target:45,questions:6},
  3:{reward:15,target:60,questions:7}, 4:{reward:20,target:65,questions:7},
};

function clean(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):"";}
function normalize(value:string){return value.trim().replace(/\s+/g," ");}
function safeId(value:string){return value.replace(/[^a-zA-Z0-9_-]/g,"_");}

export async function GET(request:Request){
  try{
    const studentId=clean(new URL(request.url).searchParams.get("studentId"),100);
    if(!studentId) return NextResponse.json({completedStages:[]});
    const {adminDb}=getFirebaseAdmin(); const id=safeId(studentId);
    const snapshots=await Promise.all([1,2,3,4].map(stage=>adminDb.collection("nationalDayFamilyChallengeResults").doc(`family-word-2026_${stage}_${id}`).get()));
    return NextResponse.json({completedStages:snapshots.map((snapshot,i)=>snapshot.exists?i+1:null).filter(Boolean)});
  }catch(error){console.error("family challenge GET",error);return NextResponse.json({completedStages:[]});}
}

export async function POST(request:Request){
  try{
    if(Date.now()<EVENT_START||Date.now()>=EVENT_END) return NextResponse.json({error:"المسابقة الرسمية متاحة من 20 إلى 26 سبتمبر 2026."},{status:403});
    const body=await request.json(); const studentId=clean(body.studentId,100); const name=clean(body.name,40); const classroom=clean(body.classroom,40); const teamName=clean(body.teamName,35);
    const stage=Number(body.stage); const score=Number(body.score); const durationSeconds=Number(body.durationSeconds); const config=CONFIG[stage];
    if(!studentId||!name||!teamName||!config||!Number.isInteger(score)||score<config.target||score>config.questions*10+(stage===4?10:0)||!Number.isFinite(durationSeconds)||durationSeconds<1||durationSeconds>3600)
      return NextResponse.json({error:"بيانات إنجاز المرحلة غير صحيحة."},{status:400});
    const {adminDb}=getFirebaseAdmin(); const id=safeId(studentId); if(!id) return NextResponse.json({error:"تعذر التحقق من حساب الطالب."},{status:400});
    const studentRef=adminDb.collection("students").doc(studentId);
    const resultRef=adminDb.collection("nationalDayFamilyChallengeResults").doc(`family-word-2026_${stage}_${id}`);
    const previousRef=stage>1?adminDb.collection("nationalDayFamilyChallengeResults").doc(`family-word-2026_${stage-1}_${id}`):null;
    const summaryRef=adminDb.collection("nationalDayFamilyChallengeTeams").doc(id);
    const outcome=await adminDb.runTransaction(async tx=>{
      const reads=await Promise.all([tx.get(studentRef),tx.get(resultRef),previousRef?tx.get(previousRef):Promise.resolve(null)]);
      const studentSnap=reads[0]; const existing=reads[1]; const previous=reads[2];
      if(!studentSnap.exists) throw new Error("STUDENT_NOT_FOUND"); const data=studentSnap.data();
      if(!clean(data?.studentName,40)||normalize(clean(data?.studentName,40))!==normalize(name)||data?.archived===true||data?.active===false) throw new Error("STUDENT_MISMATCH");
      if(existing.exists) return {duplicate:true,totalPoints:typeof data?.points==="number"?data.points:0};
      if(previousRef&&(!previous||!previous.exists)) throw new Error("STAGE_LOCKED");
      tx.set(resultRef,{challengeId:"family-word-2026",studentId,name:data?.studentName, classroom,teamName,stage,score,durationSeconds:Math.round(durationSeconds),reward:config.reward,completedAt:FieldValue.serverTimestamp()});
      tx.update(studentRef,{points:FieldValue.increment(config.reward),pointsHistory:FieldValue.arrayUnion({reason:`تحدّي كلمة الوطن العائلي — المرحلة ${stage}`,points:config.reward,date:new Date().toISOString()})});
      tx.set(summaryRef,{studentId,name:data?.studentName,teamName,classroom,completedStages:FieldValue.arrayUnion(stage),completedStageCount:FieldValue.increment(1),gameScoreTotal:FieldValue.increment(score),rewardTotal:FieldValue.increment(config.reward),updatedAt:FieldValue.serverTimestamp()},{merge:true});
      return {duplicate:false,totalPoints:(typeof data?.points==="number"?data.points:0)+config.reward};
    });
    return NextResponse.json({ok:true,duplicate:outcome.duplicate,totalPoints:outcome.totalPoints,message:outcome.duplicate?"هذه المكافأة محفوظة مسبقًا، ولن تتكرر النقاط.":`أضيفت مكافأة المرحلة: ${config.reward} نقاط ⭐`});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(message==="STUDENT_NOT_FOUND"||message==="STUDENT_MISMATCH") return NextResponse.json({error:"بيانات حساب الطالب لا تطابق سجل الأكاديمية."},{status:403});
    if(message==="STAGE_LOCKED") return NextResponse.json({error:"يجب اجتياز المرحلة السابقة أولًا."},{status:409});
    console.error("family challenge POST",error); return NextResponse.json({error:"تعذر حفظ الإنجاز الآن. حاول مرة أخرى."},{status:500});
  }
}
