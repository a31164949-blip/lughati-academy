import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";

const EVENT_START = Date.parse("2026-09-20T00:00:00+03:00");
const EVENT_END = Date.parse("2026-09-27T00:00:00+03:00");
const CONFIG: Record<number,{reward:number;target:number;questions:number}> = {
  1:{reward:5,target:30,questions:5}, 2:{reward:10,target:45,questions:6},
  3:{reward:15,target:60,questions:7}, 4:{reward:20,target:65,questions:7},
};

function clean(value:unknown,max:number){return typeof value==="string"?value.trim().slice(0,max):"";}
function normalize(value:string){return value.trim().replace(/\s+/g," ");}
function safeId(value:string){return value.replace(/[^a-zA-Z0-9_-]/g,"_");}

async function requireTeacher(request:Request){
  const authorization=request.headers.get("authorization");
  if(!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const {adminAuth}=getFirebaseAdmin();
  const token=await adminAuth.verifyIdToken(authorization.slice(7));
  const email=typeof token.email==="string"?token.email.trim().toLowerCase():"";
  const role=typeof token.role==="string"?token.role:"";
  if(role!=="teacher"&&role!=="admin"&&email!==TEACHER_EMAIL) throw new Error("FORBIDDEN");
  return token.uid;
}

export async function GET(request:Request){
  try{
    const url=new URL(request.url);
    if(url.searchParams.get("view")==="leaderboard"){
      await requireTeacher(request);
      const {adminDb}=getFirebaseAdmin();
      const snapshot=await adminDb.collection("nationalDayFamilyChallengeTeams").get();
      const teams=snapshot.docs.map(document=>{
        const data=document.data()??{};
        return {
          id:document.id,
          studentId:clean(data.studentId,100),
          name:clean(data.name,40),
          teamName:clean(data.teamName,35),
          classroom:clean(data.classroom,40),
          completedStageCount:typeof data.completedStageCount==="number"?data.completedStageCount:0,
          gameScoreTotal:typeof data.gameScoreTotal==="number"?data.gameScoreTotal:0,
          totalDuration:typeof data.totalDuration==="number"?data.totalDuration:0,
          rewardTotal:typeof data.rewardTotal==="number"?data.rewardTotal:0,
          speedBonusGranted:data.speedBonusGranted===true,
        };
      }).sort((a,b)=>{
        if(a.completedStageCount!==b.completedStageCount) return b.completedStageCount-a.completedStageCount;
        if(a.completedStageCount===4&&b.completedStageCount===4&&a.totalDuration!==b.totalDuration) return a.totalDuration-b.totalDuration;
        return b.gameScoreTotal-a.gameScoreTotal;
      });
      const award=await adminDb.collection("nationalDayFamilyChallengeAwards").doc("family-word-2026-fastest").get();
      return NextResponse.json({teams,awardGranted:award.exists,winnerStudentId:award.exists?clean(award.data()?.studentId,100):""});
    }
    const studentId=clean(url.searchParams.get("studentId"),100);
    if(!studentId) return NextResponse.json({completedStages:[]});
    const {adminDb}=getFirebaseAdmin(); const id=safeId(studentId);
    const snapshots=await Promise.all([1,2,3,4].map(stage=>adminDb.collection("nationalDayFamilyChallengeResults").doc(`family-word-2026_${stage}_${id}`).get()));
    return NextResponse.json({completedStages:snapshots.map((snapshot,i)=>snapshot.exists?i+1:null).filter(Boolean)});
  }catch(error){
    const code=error instanceof Error?error.message:"";
    if(code==="UNAUTHORIZED"||code==="FORBIDDEN") return NextResponse.json({error:"هذا المسار مخصص للمعلم."},{status:code==="UNAUTHORIZED"?401:403});
    console.error("family challenge GET",error);return NextResponse.json({completedStages:[]},{status:500});
  }
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
      tx.set(summaryRef,{studentId,name:data?.studentName,teamName,classroom,completedStages:FieldValue.arrayUnion(stage),completedStageCount:FieldValue.increment(1),gameScoreTotal:FieldValue.increment(score),totalDuration:FieldValue.increment(Math.round(durationSeconds)),rewardTotal:FieldValue.increment(config.reward),updatedAt:FieldValue.serverTimestamp()},{merge:true});
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


export async function PATCH(request:Request){
  try{
    const teacherUid=await requireTeacher(request);
    if(Date.now()<EVENT_END) return NextResponse.json({error:"تُعتمد أسرع أسرة بعد إغلاق الفعالية في نهاية 26 سبتمبر."},{status:409});
    const {adminDb}=getFirebaseAdmin();
    const snapshot=await adminDb.collection("nationalDayFamilyChallengeTeams").get();
    const finalists=snapshot.docs.map(document=>({ref:document.ref,data:document.data()??{}}))
      .filter(item=>item.data.completedStageCount===4&&typeof item.data.totalDuration==="number"&&item.data.totalDuration>0)
      .sort((a,b)=>a.data.totalDuration-b.data.totalDuration||b.data.gameScoreTotal-a.data.gameScoreTotal);
    if(finalists.length===0) return NextResponse.json({error:"لا توجد أسرة أتمت المراحل الأربع حتى الآن."},{status:404});
    const winner=finalists[0]; const studentId=clean(winner.data.studentId,100);
    const studentRef=adminDb.collection("students").doc(studentId);
    const awardRef=adminDb.collection("nationalDayFamilyChallengeAwards").doc("family-word-2026-fastest");
    const result=await adminDb.runTransaction(async tx=>{
      const [awardSnap,studentSnap,teamSnap]=await Promise.all([tx.get(awardRef),tx.get(studentRef),tx.get(winner.ref)]);
      if(awardSnap.exists) return {duplicate:true,winner:awardSnap.data()?.teamName??""};
      if(!studentSnap.exists||!teamSnap.exists) throw new Error("NOT_FOUND");
      const team=teamSnap.data()??{};
      tx.update(studentRef,{points:FieldValue.increment(10),pointsHistory:FieldValue.arrayUnion({reason:"جائزة أسرع أسرة — تحدّي كلمة الوطن العائلي",points:10,date:new Date().toISOString()})});
      tx.update(winner.ref,{speedBonusGranted:true,speedBonusPoints:10,speedBonusGrantedAt:FieldValue.serverTimestamp()});
      tx.set(awardRef,{studentId,teamName:team.teamName??"",studentName:team.name??"",totalDuration:team.totalDuration??0,gameScoreTotal:team.gameScoreTotal??0,points:10,grantedBy:teacherUid,grantedAt:FieldValue.serverTimestamp()});
      return {duplicate:false,winner:team.teamName??""};
    });
    return NextResponse.json({ok:true,duplicate:result.duplicate,winner:result.winner,message:result.duplicate?"سبق اعتماد جائزة أسرع أسرة.":`تم اعتماد ${result.winner} ومنح 10 نقاط إضافية.`});
  }catch(error){
    const code=error instanceof Error?error.message:"";
    if(code==="UNAUTHORIZED"||code==="FORBIDDEN") return NextResponse.json({error:"هذا الإجراء مخصص للمعلم."},{status:code==="UNAUTHORIZED"?401:403});
    console.error("family challenge PATCH",error);return NextResponse.json({error:"تعذر اعتماد الجائزة الآن."},{status:500});
  }
}
