"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

const CLUB_LAUNCH_AT = Date.parse("2026-09-26T19:00:00+03:00");
const CLOUD_NAME = "ffv5igmg";
const UPLOAD_PRESET = "lughati_homework_upload";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type WorkType = "image" | "audio" | "video";
type Challenge = {
  challengeId: string;
  title: string;
  instructions: string;
  points: number;
  allowedTypes: WorkType[];
  closesAt: string;
  isClosed: boolean;
};
type Submission = {
  status: "pending" | "approved" | "returned";
  note: string;
  teacherNote: string;
  submittedAt: string;
};

function typeLabel(type:WorkType){return type==="image"?"صورة":type==="audio"?"تسجيل صوتي":"فيديو";}
function acceptTypes(types:WorkType[]){return types.map(t=>t==="image"?"image/*":t==="audio"?"audio/*":"video/*").join(",");}

export default function AcademyClubChallengePage(){
  const [user,setUser]=useState<User|null>(null);
  const [teacherPreview,setTeacherPreview]=useState(false);
  const [now,setNow]=useState(()=>Date.now());
  const [loading,setLoading]=useState(true);
  const [challenge,setChallenge]=useState<Challenge|null>(null);
  const [submission,setSubmission]=useState<Submission|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [workType,setWorkType]=useState<WorkType>("image");
  const [note,setNote]=useState("");
  const [sending,setSending]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{setTeacherPreview(new URLSearchParams(window.location.search).get("teacherPreview")==="1");return onAuthStateChanged(auth,current=>{setUser(current);if(!current)setLoading(false);});},[]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  useEffect(()=>{if(!user||now<CLUB_LAUNCH_AT)return;void loadChallenge(user);},[user,now>=CLUB_LAUNCH_AT]);

  async function loadChallenge(current:User){
    try{
      setLoading(true);setError("");
      const token=await current.getIdToken();
      const response=await fetch("/api/academy-club/challenge",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
      const data=await response.json();
      if(!response.ok||!data.success)throw new Error(data.message||"تعذر تحميل التحدي.");
      setChallenge(data.challenge||null);setSubmission(data.submission||null);
      if(data.challenge?.allowedTypes?.length)setWorkType(data.challenge.allowedTypes[0]);
    }catch(e){setError(e instanceof Error?e.message:"تعذر تحميل التحدي.");}
    finally{setLoading(false);}
  }

  function chooseFile(event:React.ChangeEvent<HTMLInputElement>){
    const selected=event.target.files?.[0]||null;setError("");setMessage("");
    if(!selected){setFile(null);return;}
    if(selected.size>MAX_FILE_SIZE){event.target.value="";setFile(null);setError("حجم الملف كبير؛ الحد الأعلى 100 ميجابايت.");return;}
    const detected:WorkType=selected.type.startsWith("audio/")?"audio":selected.type.startsWith("video/")?"video":"image";
    if(!challenge?.allowedTypes.includes(detected)){event.target.value="";setFile(null);setError("نوع الملف غير متاح في هذا التحدي.");return;}
    setWorkType(detected);setFile(selected);
  }

  async function submit(){
    if(!user||!challenge||!file||challenge.isClosed||submission)return;
    try{
      setSending(true);setError("");setMessage("جارٍ رفع مشاركتك…");
      const form=new FormData();form.append("file",file);form.append("upload_preset",UPLOAD_PRESET);
      const upload=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,{method:"POST",body:form});
      const uploaded=await upload.json();
      if(!upload.ok||!uploaded.secure_url)throw new Error("تعذر رفع الملف. حاول مرة أخرى.");
      const token=await user.getIdToken();
      const response=await fetch("/api/academy-club/challenge",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({challengeId:challenge.challengeId,workType,fileUrl:uploaded.secure_url,cloudinaryPublicId:uploaded.public_id||"",note})});
      const data=await response.json();
      if(!response.ok||!data.success)throw new Error(data.message||"تعذر إرسال المشاركة.");
      setMessage("وصلت مشاركتك بنجاح، وهي الآن بانتظار مراجعة المعلم ⭐");setFile(null);await loadChallenge(user);
    }catch(e){setError(e instanceof Error?e.message:"تعذر إرسال المشاركة.");setMessage("");}
    finally{setSending(false);}
  }

  if(now<CLUB_LAUNCH_AT&&!teacherPreview)return <main dir="rtl" className="page"><style>{styles}</style><section className="soon"><div className="logo">🏅</div><span className="tag">قريبًا… ✨</span><h1>تحديات نادي الأكاديمية</h1><p>موعدنا السبت 26 سبتمبر الساعة 7:00 مساءً؛ استعد لمهام ممتعة ونقاط وأوسمة لا تظهر إلا للأعضاء.</p><Link className="btn" href="/journey">العودة إلى رحلتي ←</Link></section></main>;

  return <main dir="rtl" className="page"><style>{styles}</style><div className="shell"><header><Link href={teacherPreview?"/academy-club?teacherPreview=1":"/academy-club"}>→ نادي الأكاديمية</Link><b>تحديات الأعضاء 🎯</b></header>
    {loading?<section className="card center">⏳ جارٍ تحميل التحدي…</section>:!user?<section className="card center"><h2>سجّل دخولك أولًا</h2><Link className="btn" href="/login">تسجيل الدخول</Link></section>:error&&!challenge?<section className="card center"><h2>تعذر فتح التحدي</h2><p>{error}</p></section>:!challenge?<section className="card center"><div className="big">🌱</div><h2>لا يوجد تحدٍ منشور الآن</h2><p>ترقّب التحدي القادم؛ ففرص التميز تتجدد دائمًا.</p></section>:<><section className="hero"><span className="tag">تحدي أعضاء النادي</span><h1>{challenge.title}</h1><p>{challenge.instructions}</p><div className="meta"><b>⭐ {challenge.points} نقطة</b><b>📎 {challenge.allowedTypes.map(typeLabel).join(" • ")}</b><b>⏳ {challenge.isClosed?"انتهى التحدي":new Date(challenge.closesAt).toLocaleDateString("ar-SA")}</b></div></section>
    {submission?<section className="card center"><div className="big">{submission.status==="approved"?"🏆":submission.status==="returned"?"🔄":"⏳"}</div><h2>{submission.status==="approved"?"تم اعتماد مشاركتك":submission.status==="returned"?"تحتاج مشاركتك إلى مراجعة":"مشاركتك بانتظار المعلم"}</h2>{submission.teacherNote&&<p className="notice">ملاحظة المعلم: {submission.teacherNote}</p>}<p>لا يمكن إرسال أكثر من مشاركة في التحدي نفسه.</p></section>:<section className="card"><h2>ارفع مشاركتك</h2><p>الأنواع المتاحة: {challenge.allowedTypes.map(typeLabel).join("، ")}</p><input className="file" type="file" accept={acceptTypes(challenge.allowedTypes)} disabled={challenge.isClosed||sending} onChange={chooseFile}/>{file&&<div className="selected">✅ {file.name} — {typeLabel(workType)}</div>}<label>رسالة قصيرة مع المشاركة<textarea value={note} maxLength={500} onChange={e=>setNote(e.target.value)} placeholder="اكتب وصفًا بسيطًا لعملك…"/></label>{message&&<p className="notice ok">{message}</p>}{error&&<p className="notice bad">{error}</p>}<button className="btn full" disabled={!file||sending||challenge.isClosed} onClick={submit}>{sending?"جارٍ الإرسال…":"إرسال المشاركة 🚀"}</button></section>}</>}
  </div></main>;
}

const styles=`
*{box-sizing:border-box}.page{min-height:100vh;padding:20px;color:#17352a;font-family:Arial,sans-serif;background:radial-gradient(circle at 10% 10%,#fff0ad,transparent 22%),linear-gradient(145deg,#eaf8f0,#fffaf0)}.shell{max-width:850px;margin:auto}header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}header a{color:#176c46;text-decoration:none;font-weight:900}.hero,.card,.soon{padding:clamp(20px,5vw,36px);border-radius:28px;background:#fff;border:2px solid #dcebe3;box-shadow:0 18px 45px #16503720}.hero{color:#fff;background:linear-gradient(135deg,#0f5c3d,#18835b);border-color:#e7c35d}.hero h1{font-size:clamp(27px,6vw,43px);margin:12px 0}.hero p{line-height:1.9;font-size:18px}.tag{display:inline-flex;padding:7px 14px;border-radius:99px;background:#fff0ad;color:#79560a;font-weight:900}.meta{display:flex;gap:9px;flex-wrap:wrap}.meta b{padding:8px 12px;border-radius:99px;background:#ffffff20}.card{margin-top:18px}.center{text-align:center;font-weight:800}.big{font-size:60px}.file,textarea{width:100%;margin:8px 0 15px;padding:13px;border:2px solid #d5e8de;border-radius:14px;font:inherit}textarea{min-height:110px;resize:vertical}.selected,.notice{padding:12px;border-radius:14px;background:#eef8f2;margin:10px 0;font-weight:800}.ok{color:#087b52}.bad{color:#b42318;background:#fff0ee}.btn{display:inline-flex;justify-content:center;padding:13px 20px;border:0;border-radius:15px;color:#fff;background:#176c46;text-decoration:none;font:inherit;font-weight:900;cursor:pointer}.btn:disabled{opacity:.5;cursor:not-allowed}.full{width:100%}.soon{max-width:700px;margin:10vh auto;text-align:center;border-color:#e7c35d}.soon h1{color:#176c46;font-size:clamp(30px,7vw,47px)}.soon p{line-height:1.9;color:#52685e;font-weight:700;font-size:18px}.logo{width:90px;height:90px;margin:0 auto 18px;display:grid;place-items:center;border-radius:28px;font-size:48px;background:#176c46;border:3px solid #f0cf6b}
`;
