"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "../../../firebase";
type C={id:string;studentName?:string;classroom?:string;barriers?:string[];note?:string;requestedHelp?:string;teacherMessage?:string;followUpPlan?:string;reviewDate?:string;status?:string};
export default function TeacherFamilySupport(){
 const [items,setItems]=useState<C[]>([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState("");
 async function load(){const u=auth.currentUser;if(!u)return;const t=await u.getIdToken();const r=await fetch("/api/teacher/family-support",{headers:{Authorization:`Bearer ${t}`},cache:"no-store"});const d=await r.json();if(r.ok)setItems(d.cases||[]);else setMsg(d.message||"تعذر التحميل");setLoading(false);}
 useEffect(()=>onAuthStateChanged(auth,u=>{if(!u){window.location.replace("/teacher-login");return;}void load();}),[]);
 function edit(id:string,key:keyof C,value:string){setItems(x=>x.map(i=>i.id===id?{...i,[key]:value}:i));}
 async function save(i:C){const u=auth.currentUser;if(!u)return;setMsg("");const t=await u.getIdToken();const r=await fetch("/api/teacher/family-support",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({studentId:i.id,teacherMessage:i.teacherMessage||"",followUpPlan:i.followUpPlan||"",reviewDate:i.reviewDate||""})});const d=await r.json();setMsg(d.message||"تم الحفظ");if(r.ok)void load();}
 return <main dir="rtl" style={s.page}><div style={s.shell}><div style={s.top}><Link href="/teacher" style={s.back}>← لوحة المعلم</Link><b>أكاديمية لغتي الرقمية</b></div><section style={s.hero}><h1>🤝 نتعاون من أجل تقدّمه</h1><p>العائق ← خطوة هذا الأسبوع ← المراجعة</p></section>{msg&&<p style={s.notice}>{msg}</p>}
 {loading?<section style={s.card}>جارٍ تحميل المتابعات…</section>:items.length===0?<section style={s.card}>لا توجد ردود أو متابعات حتى الآن.</section>:items.map(i=><section key={i.id} style={s.card}><div style={s.name}><b>{i.studentName||"الطالب"}</b><span>{i.classroom||""}</span></div>
  <h3>رد الأسرة</h3>{i.barriers?.length?<div style={s.tags}>{i.barriers.map(x=><span key={x} style={s.tag}>{x}</span>)}</div>:<p style={s.muted}>لم يصل رد الأسرة بعد.</p>}
  {i.note&&<p><b>توضيح:</b> {i.note}</p>}{i.requestedHelp&&<p><b>المساعدة المقترحة من الأسرة:</b> {i.requestedHelp}</p>}
  <label style={s.label}>رسالة المعلم للأسرة</label><textarea style={s.input} value={i.teacherMessage||""} onChange={e=>edit(i.id,"teacherMessage",e.target.value)} placeholder="رسالة قصيرة وهادئة للأسرة…"/>
  <label style={s.label}>خطوتنا هذا الأسبوع</label><textarea style={s.input} value={i.followUpPlan||""} onChange={e=>edit(i.id,"followUpPlan",e.target.value)} placeholder="مثال: سأشرح له بداية المهمة ثم أتابع إنجازها…"/>
  <label style={s.label}>موعد المراجعة</label><input type="date" style={s.date} value={i.reviewDate||""} onChange={e=>edit(i.id,"reviewDate",e.target.value)}/>
  <button style={s.btn} onClick={()=>void save(i)}>حفظ وإرسال الخطة للأسرة</button>
 </section>)}</div></main>;
}
const s:Record<string,React.CSSProperties>={page:{minHeight:"100vh",padding:"18px 12px 50px",background:"linear-gradient(180deg,#effaf5,#fffaf0)",color:"#173b31",fontFamily:"Tahoma,Arial,sans-serif"},shell:{maxWidth:850,margin:"auto"},top:{display:"flex",justifyContent:"space-between",gap:10,marginBottom:12},back:{color:"#147a5b",fontWeight:900,textDecoration:"none"},hero:{padding:24,borderRadius:28,color:"white",background:"linear-gradient(135deg,#116a4d,#1b936d)",textAlign:"center",marginBottom:16},card:{padding:20,borderRadius:22,background:"white",border:"1px solid #dcebe4",marginBottom:14,boxShadow:"0 8px 24px #0c5c3d10"},name:{display:"flex",justifyContent:"space-between",gap:10,fontSize:19,color:"#126b4d"},tags:{display:"flex",gap:7,flexWrap:"wrap"},tag:{padding:"7px 10px",borderRadius:99,background:"#e9f7f0",fontWeight:800,fontSize:13},muted:{color:"#718078"},label:{display:"block",fontWeight:900,margin:"16px 0 6px"},input:{width:"100%",minHeight:80,boxSizing:"border-box",padding:11,border:"1px solid #cfe1d9",borderRadius:13,font:"inherit"},date:{padding:11,border:"1px solid #cfe1d9",borderRadius:13,font:"inherit"},btn:{width:"100%",marginTop:16,padding:14,border:0,borderRadius:14,background:"#147a5b",color:"white",font:"inherit",fontWeight:900,cursor:"pointer"},notice:{padding:12,borderRadius:12,background:"#fff5cf",fontWeight:800,textAlign:"center"}};
