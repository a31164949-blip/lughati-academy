"use client";
import { useEffect, useRef, useState } from "react";
import LiveVoiceAnswer from "../components/LiveVoiceAnswer";
import { useLiveGamePolling } from "../hooks/useLiveGamePolling";

type Room = { code:string; status:"waiting"|"active"|"finished"; answered:boolean; question:{index:number;total:number;prompt:string}|null; participants:Array<{id:string;name:string;score:number;guest?:boolean}> };
export default function ChallengeGuestPage(){
 const [ticket,setTicket]=useState("");
 const [room,setRoom]=useState<Room|null>(null);
 const [message,setMessage]=useState("مرحبًا بضيف التحدي! افتح الرابط الذي أرسله لك المعلم.");
 const [busy,setBusy]=useState(false);
 const inFlight=useRef(false);
 useEffect(()=>{const fromLink=new URLSearchParams(window.location.search).get("ticket")??"";const value=fromLink||window.sessionStorage.getItem("lughati-challenge-guest-ticket")||"";if(/^\d{6}\.guest-[12]\.[a-f0-9]{64}$/.test(value)){setTicket(value);window.sessionStorage.setItem("lughati-challenge-guest-ticket",value);if(fromLink)window.history.replaceState(null,"",window.location.pathname);}},[]);
 const code=ticket.split(".")[0]??"";
 async function call(action?:string,audioUrl?:string,question?:number){
  if(!ticket || inFlight.current)return;
  if(action)inFlight.current=true;
  setBusy(true);
  try{
   const response=await fetch(action?"/api/academy-club/live-game":"/api/academy-club/live-game?code="+code,{
    method:action?"POST":"GET",
    headers:{"x-challenge-guest":ticket,...(action?{"Content-Type":"application/json"}:{})},
    ...(action?{body:JSON.stringify({action,code,audioUrl,question})}:{cache:"no-store" as RequestCache})
   });
   const data=await response.json();
   if(!response.ok||!data.success)throw new Error(data.message||"تعذر الدخول.");
   setRoom(data.room);
   if(action==="join")setMessage("تم تسجيلك ضيفًا في التحدي. انتظر بدء المسابقة!");
   if(action==="answer")setMessage("وصلت إجابتك الصوتية؛ ينتظر اعتماد المعلم.");
  }catch(e){setMessage(e instanceof Error?e.message:"تعذر الاتصال.");if(action==="answer")throw e;}
  finally{setBusy(false);inFlight.current=false;}
 }
 useLiveGamePolling(()=>call(),Boolean(room)&&room?.status!=="finished",code);
 return <main dir="rtl" style={{minHeight:"100vh",background:"#f1faf5",padding:24,fontFamily:"Arial",color:"#154e37"}}>
 <section style={{maxWidth:700,margin:"auto",padding:24,background:"white",borderRadius:24,textAlign:"center"}}>
 <h1>🏆 ضيف التحدي المباشر</h1><p>أكاديمية لغتي | الصف الثالث الابتدائي</p>
 {!ticket?<p>رابط الضيف غير صالح. اطلب الرابط الخاص بك من المعلم.</p>:!room?<button disabled={busy} onClick={()=>void call("join")}>انضم إلى غرفة التحدي</button>:<>
 <h2>{room.status==="waiting"?"بانتظار بدء التحدي":room.status==="finished"?"انتهت المسابقة":"التحدي مباشر الآن"}</h2>
 {room.question&&<article><h3>السؤال {room.question.index+1} من {room.question.total}</h3><p>{room.question.prompt}</p>{room.answered?<p>✅ تم استلام إجابتك</p>:<LiveVoiceAnswer key={room.question.index} disabled={busy} onSubmit={url=>call("answer",url,room.question!.index)}/>}</article>}
 <h3>الترتيب المشترك</h3>{room.participants.map((p,i)=><p key={p.id}>{i+1}. {p.name}{p.guest?" (ضيف التحدي)":""} — ⭐ {p.score}</p>)}
 {room.status==="finished"&&<button onClick={()=>void call()}>تحديث النتائج</button>}
 </>}
 <p role="status">{message}</p></section></main>;
}
