"use client";

import Link from "next/link";
import LiveVoiceAnswer from "../../components/LiveVoiceAnswer";
import { useLiveGamePolling } from "../../hooks/useLiveGamePolling";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type Room = {
  answered: boolean;
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
  const [authReady,setAuthReady]=useState(false);

  useEffect(()=>onAuthStateChanged(auth,current=>{setUser(current);setAuthReady(true);}),[]);

  const requestVersion = useRef(0);
  const shownQuestion = useRef(-1);
  const mutationInFlight = useRef(false);

  async function request(action?:string,audioUrl?:string,question?:number) {
    if(!user || mutationInFlight.current)return;
    if(action) mutationInFlight.current = true;
    const version = ++requestVersion.current;
    setBusy(true);
    try{
      const token=await user.getIdToken();
      const response=action
        ? await fetch("/api/academy-club/live-game",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action,code,audioUrl,question})})
        : await fetch(`/api/academy-club/live-game?code=${code}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
      const data=await response.json();
      if (version !== requestVersion.current) return;
      if(!response.ok||!data.success)throw new Error(data.message||"تعذر الاتصال بالغرفة.");
      if(data.room.question && data.room.question.index!==shownQuestion.current) {
        shownQuestion.current=data.room.question.index;
        setMessage("اقرأ السؤال ثم سجّل إجابتك بصوتك 🎙️");
      }
      setRoom(data.room);
      if (data.room.answered && data.room.question) setAnswered(data.room.question.index);
      if(action==="join")setMessage("انضممت بنجاح؛ انتظر بدء المعلم 🚀");
      if(action==="answer"){setAnswered(question??-1);setMessage("وصلت إجابتك الصوتية 🎙️ سيستمع المعلم إليها ويعتمد نقاطها.");}
    }catch(error){if (version === requestVersion.current) setMessage(error instanceof Error?error.message:"تعذر الاتصال بالغرفة."); if(action==="answer") throw error;}
    finally{if(action) mutationInFlight.current = false; if (version === requestVersion.current) setBusy(false);}
  }

  useLiveGamePolling(() => request(), !!user && !!room && room.status !== "finished", room?.code);


  return <main dir="rtl" style={page}><header style={header}>
    <div><small style={{color:"#f5d66d",fontWeight:900}}>🏅 نادي الأكاديمية</small><h1 style={{margin:"5px 0"}}>تحدي مدينة لغتي المباشر</h1></div>
    <Link href="/academy-club" style={back}>العودة للنادي ←</Link>
  </header><div style={shell}>
    {!room?<section style={card}><div style={{fontSize:65}}>🎮</div><h2>ادخل ساحة المنافسة</h2>
      {!authReady?<p>⏳ جارٍ التحقق من حسابك…</p>:!user?<><p>سجّل دخولك بحساب الطالب العضو أولًا.</p><Link href="/login?returnTo=%2Facademy-club%2Flive-game" style={{...primary,display:"inline-block",textDecoration:"none"}}>تسجيل الدخول</Link></>:<><input value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" placeholder="رمز الغرفة" style={input}/>
      <button disabled={code.length!==6||busy} onClick={()=>void request("join")} style={primary}>انضم إلى التحدي</button></>}
    </section>:<>
      <section style={{...card,background:"linear-gradient(135deg,#fff8d8,#fff,#eaf8f0)"}}>
        <b>الغرفة {room.code}</b><h2>{room.status==="waiting"?"بانتظار بدء المعلم… ⏳":room.status==="finished"?"انتهت الأسئلة؛ يعتمد المعلم نقاط التسجيلات 🏆":"المنافسة مباشرة الآن 🔴"}</h2>
        <p>{room.participants.length} متنافسًا في الساحة</p>
      </section>
      {room.question&&<section style={card}><small>السؤال {room.question.index+1} من {room.question.total}</small><h2>{room.question.prompt}</h2>
        {answered===room.question.index ? <p role="status">✅ أرسلت إجابتك الصوتية لهذا السؤال. انتظر السؤال التالي.</p> : <LiveVoiceAnswer key={`${room.code}-${room.question.index}`} disabled={busy} onSubmit={(audioUrl) => request("answer", audioUrl, room.question!.index)} />}
      </section>}
      <section style={card}><h2>الترتيب المباشر</h2>{room.status==="finished" && <button style={primary} disabled={busy} onClick={()=>void request()}>تحديث نقاطي بعد اعتماد المعلم</button>}<div style={{display:"grid",gap:8}}>{room.participants.slice(0,10).map((student,index)=><div key={student.id} style={row}><b>{index+1}. {student.name}</b><span>⭐ {student.score}</span></div>)}</div></section>
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
const row:React.CSSProperties={display:"flex",justifyContent:"space-between",padding:"11px 14px",borderRadius:12,background:"#f4faf7"};
const notice:React.CSSProperties={padding:14,borderRadius:14,background:"#fff4c4",color:"#79570b",textAlign:"center",fontWeight:900};
