"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../../firebase";

const options=[
  "لم يفهم المطلوب","الواجب صعب عليه","نسي","لم يتوفر وقت للمساعدة",
  "واجه مشكلة في الدخول أو رفع الحل","سبب آخر"
];

export default function FamilySupportPage(){
 const [studentName,setStudentName]=useState("الطالب");
 const [barriers,setBarriers]=useState<string[]>([]);
 const [note,setNote]=useState("");
 const [help,setHelp]=useState("");
 const [teacherMessage,setTeacherMessage]=useState("");
 const [plan,setPlan]=useState("");
 const [reviewDate,setReviewDate]=useState("");
 const [loading,setLoading]=useState(true);
 const [sending,setSending]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>onAuthStateChanged(auth,async user=>{
   if(!user){window.location.replace("/login?returnTo=%2Fparent%2Fsupport");return;}
   try{
    const token=await user.getIdToken(true);
    const response=await fetch("/api/family-support",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    const data=await response.json();
    if(response.status===401||response.status===403){
      await signOut(auth);
      window.location.replace("/login?returnTo=%2Fparent%2Fsupport");
      return;
    }
    if(!response.ok) throw new Error(data.message||"تعذر التحميل");
    setStudentName(data.student?.name||"الطالب");
    const s=data.support||{};
    setTeacherMessage(typeof s.teacherMessage==="string"?s.teacherMessage:"لاحظنا أن ابننا واجه صعوبة في إتمام بعض الواجبات. نود معرفة ما الذي صعّب عليه إتمام الواجب لنختار معكم خطوة تساعده هذا الأسبوع.");
    setPlan(typeof s.followUpPlan==="string"?s.followUpPlan:"");
    setReviewDate(typeof s.reviewDate==="string"?s.reviewDate:"");
    if(Array.isArray(s.barriers)) setBarriers(s.barriers);
    if(typeof s.note==="string") setNote(s.note);
    if(typeof s.requestedHelp==="string") setHelp(s.requestedHelp);
   }catch(e){setMessage(e instanceof Error?e.message:"تعذر فتح المتابعة.");}
   finally{setLoading(false);}
 }),[]);

 function toggle(value:string){setBarriers(x=>x.includes(value)?x.filter(v=>v!==value):[...x,value]);}
 async function submit(){
  if(!barriers.length){setMessage("اختر سببًا واحدًا على الأقل.");return;}
  const user=auth.currentUser;if(!user)return;
  try{
   setSending(true);setMessage("");
   const token=await user.getIdToken();
   const response=await fetch("/api/family-support",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({barriers,note,requestedHelp:help})});
   const data=await response.json();
   setMessage(data.message|| (response.ok?"تم الإرسال.":"تعذر الإرسال."));
  }finally{setSending(false);}
 }
 if(loading)return <main dir="rtl" style={styles.page}><section style={styles.card}>جارٍ فتح المتابعة…</section></main>;
 return <main dir="rtl" style={styles.page}><div style={styles.shell}>
  <div style={styles.top}><Link href="/parent" style={styles.back}>← صفحة ولي الأمر</Link><b>أكاديمية لغتي الرقمية</b></div>
  <section style={styles.hero}><div style={{fontSize:45}}>🤝</div><h1 style={{margin:"5px 0"}}>نتعاون من أجل تقدّمه</h1><p style={{margin:0,lineHeight:1.9}}>ضمن مبادرة «خطوتي تصنع الفرق»</p><div style={styles.student}>👦 {studentName}</div></section>
  <div style={styles.steps}><b>1 العائق</b><span>←</span><b>2 خطوتنا هذا الأسبوع</b><span>←</span><b>3 المراجعة</b></div>
  <section style={styles.card}><h2 style={styles.title}>👨‍🏫 رسالة المعلم</h2><p style={styles.bubble}>{teacherMessage}</p></section>
  <section style={styles.card}><h2 style={styles.title}>👨‍👩‍👦 ما الذي صعّب عليه إتمام الواجب؟</h2><p>يمكن اختيار أكثر من سبب:</p><div style={styles.grid}>{options.map(o=><button key={o} onClick={()=>toggle(o)} style={{...styles.choice,...(barriers.includes(o)?styles.selected:{})}}>{barriers.includes(o)?"✓ ":""}{o}</button>)}</div>
   <label style={styles.label}>توضيح إضافي (اختياري)</label><textarea value={note} onChange={e=>setNote(e.target.value)} style={styles.input} placeholder="اكتبوا ما ترونه مهمًا للمعلم…" />
   <label style={styles.label}>ما نوع المساعدة التي ترون أنها ستفيده؟</label><textarea value={help} onChange={e=>setHelp(e.target.value)} style={styles.input} placeholder="مثال: شرح بداية المهمة، وقت إضافي، مساعدة في الدخول…" />
   <button onClick={submit} disabled={sending} style={styles.send}>{sending?"جارٍ الإرسال…":"إرسال الرد للمعلم"}</button>{message&&<p style={styles.notice}>{message}</p>}
  </section>
  {(plan||reviewDate)&&<section style={styles.card}><h2 style={styles.title}>🌱 خطوتنا هذا الأسبوع</h2>{plan&&<p style={styles.plan}>{plan}</p>}{reviewDate&&<p><b>موعد المراجعة:</b> {reviewDate}</p>}</section>}
  <p style={styles.privacy}>🔒 هذه المتابعة خاصة بالأسرة والمعلم ولا تظهر في لوحة الشرف أو الصفحات العامة.</p>
 </div></main>;
}
const styles:Record<string,React.CSSProperties>={
 page:{minHeight:"100vh",padding:"18px 12px 50px",background:"linear-gradient(180deg,#effaf5,#fffaf0)",color:"#173b31",fontFamily:"Tahoma,Arial,sans-serif"},
 shell:{maxWidth:720,margin:"auto"},top:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:12},back:{textDecoration:"none",color:"#147a5b",fontWeight:900},
 hero:{padding:"24px 18px",borderRadius:28,textAlign:"center",color:"white",background:"linear-gradient(135deg,#116a4d,#1b936d)",boxShadow:"0 14px 35px #0b694525"},
 student:{margin:"15px auto 0",padding:"9px 14px",borderRadius:99,background:"#ffffff24",width:"fit-content",fontWeight:900},
 steps:{display:"flex",justifyContent:"center",alignItems:"center",gap:8,flexWrap:"wrap",padding:14,fontSize:13,color:"#5c6f67"},
 card:{background:"white",border:"1px solid #dcebe4",borderRadius:23,padding:18,marginBottom:14,boxShadow:"0 8px 24px #0c5c3d10"},
 title:{margin:"0 0 10px",fontSize:20,color:"#147a5b"},bubble:{background:"#edf8f2",borderRadius:"18px 18px 4px 18px",padding:15,lineHeight:1.9,margin:0},
 grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:9},choice:{padding:13,borderRadius:14,border:"1px solid #cfe4da",background:"#fff",font:"inherit",fontWeight:800,color:"#31584a",cursor:"pointer"},selected:{background:"#e7f7ef",border:"2px solid #18845f",color:"#116a4d"},
 label:{display:"block",fontWeight:900,margin:"18px 0 7px"},input:{width:"100%",minHeight:90,boxSizing:"border-box",border:"1px solid #cfe1d9",borderRadius:14,padding:12,font:"inherit",resize:"vertical"},
 send:{width:"100%",marginTop:16,padding:14,border:0,borderRadius:15,background:"#147a5b",color:"white",font:"inherit",fontWeight:900,cursor:"pointer"},notice:{padding:12,borderRadius:12,background:"#fff5cf",textAlign:"center",fontWeight:800},
 plan:{padding:15,borderRadius:15,background:"#fff8dc",lineHeight:1.9},privacy:{textAlign:"center",color:"#63776f",fontSize:13,lineHeight:1.8}
};