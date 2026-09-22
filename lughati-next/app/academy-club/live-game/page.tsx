"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type Room = {
  code: string; status: "waiting" | "active" | "finished";
  question: { index: number; total: number; prompt: string; options: string[] } | null;
  participants: Array<{ id: string; name: string; score: number; answered: boolean }>;
};

export default function LiveGamePage() {
  const [user,setUser]=useState<User|null>(null);
  const [code,setCode]=useState("");
  const [room,setRoom]=useState<Room|null>(null);
  const [answered,setAnswered]=useState(-1);
  const [message,setMessage]=useState("أدخل رمز الغرفة الذي يعرضه المعلم.");
  const [busy,setBusy]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);

  async function request(action?:string,option?:number) {
    if(!user)return;
    setBusy(true);
    try{
      const token=await user.getIdToken();
      const response=action
        ? await fetch("/api/academy-club/live-game",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action,code,option})})
        : await fetch(`/api/academy-club/live-game?code=${code}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
      const data=await response.json();
      if(!response.ok||!data.success)throw new Error(data.message||"تعذر الاتصال بالغرفة.");
      setRoom(data.room);
      if(action==="join")setMessage("انضممت بنجاح؛ انتظر بدء المعلم 🚀");
      if(action==="answer"){setAnswered(data.room.question?.index??-1);setMessage(data.result.correct?`إجابة صحيحة! +${data.result.points} نقطة ⭐`:"محاولة جميلة؛ استعد للسؤال التالي 💪");}
    }catch(error){setMessage(error instanceof Error?error.message:"تعذر الاتصال بالغرفة.");}
    finally{setBusy(false);}
  }

  useEffect(()=>{
    if(!user||!room?.code)return;
    const timer=window.setInterval(()=>void request(),2000);
    return()=>window.clearInterval(timer);
  },[user,room?.code,code]);

  useEffect(()=>{ if(room?.question && room.question.index!==answered) setMessage("اختر الإجابة الصحيحة قبل منافسيك!"); },[room?.question?.index]);

  return <main dir="rtl" style={page}><header style={header}>
    <div><small style={{color:"#f5d66d",fontWeight:900}}>🏅 نادي الأكاديمية</small><h1 style={{margin:"5px 0"}}>تحدي مدينة لغتي المباشر</h1></div>
    <Link href="/academy-club" style={back}>العودة للنادي ←</Link>
  </header><div style={shell}>
    {!room?<section style={card}><div style={{fontSize:65}}>🎮</div><h2>ادخل ساحة المنافسة</h2>
      <input value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" placeholder="رمز الغرفة" style={input}/>
      <button disabled={code.length!==6||!user||busy} onClick={()=>void request("join")} style={primary}>انضم إلى التحدي</button>
    </section>:<>
      <section style={{...card,background:"linear-gradient(135deg,#fff8d8,#fff,#eaf8f0)"}}>
        <b>الغرفة {room.code}</b><h2>{room.status==="waiting"?"بانتظار بدء المعلم… ⏳":room.status==="finished"?"انتهت المنافسة 🏆":"المنافسة مباشرة الآن 🔴"}</h2>
        <p>{room.participants.length} متنافسًا في الساحة</p>
      </section>
      {room.question&&<section style={card}><small>السؤال {room.question.index+1} من {room.question.total}</small><h2>{room.question.prompt}</h2>
        <div style={grid}>{room.question.options.map((option,index)=><button key={option} disabled={busy||answered===room.question?.index} onClick={()=>void request("answer",index)} style={choice}>{option}</button>)}</div>
      </section>}
      <section style={card}><h2>الترتيب المباشر</h2><div style={{display:"grid",gap:8}}>{room.participants.slice(0,10).map((student,index)=><div key={student.id} style={row}><b>{index+1}. {student.name}</b><span>⭐ {student.score}</span></div>)}</div></section>
    </>}
    <div style={notice}>{message}</div>
  </div></main>;
}
const page:React.CSSProperties={minHeight:"100vh",background:"linear-gradient(180deg,#91d8f7 0,#dff5e7 38%,#fff9e5)",fontFamily:"Arial",color:"#17352a"};
const header:React.CSSProperties={padding:"20px clamp(16px,5vw,48px)",background:"#0f5c3d",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"};
const shell:React.CSSProperties={maxWidth:850,margin:"0 auto",padding:"25px 16px",display:"grid",gap:17};
const card:React.CSSProperties={padding:"clamp(22px,5vw,38px)",borderRadius:27,background:"#fff",border:"2px solid #d5e9de",boxShadow:"0 14px 34px rgba(20,80,50,.12)",textAlign:"center"};
const input:React.CSSProperties={display:"block",width:"min(100%,340px)",margin:"18px auto 12px",padding:16,borderRadius:14,border:"2px solid #9ed8b8",fontSize:27,textAlign:"center",letterSpacing:8};
const primary:React.CSSProperties={border:0,borderRadius:15,padding:"14px 22px",background:"#16865d",color:"#fff",fontWeight:900,fontSize:18,cursor:"pointer"};
const back:React.CSSProperties={color:"#fff",textDecoration:"none",fontWeight:900};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginTop:18};
const choice:React.CSSProperties={padding:17,borderRadius:16,border:"2px solid #a8d8bb",background:"#eef9f2",color:"#174c36",fontWeight:900,fontSize:18,cursor:"pointer"};
const row:React.CSSProperties={display:"flex",justifyContent:"space-between",padding:"11px 14px",borderRadius:12,background:"#f4faf7"};
const notice:React.CSSProperties={padding:14,borderRadius:14,background:"#fff4c4",color:"#79570b",textAlign:"center",fontWeight:900};
