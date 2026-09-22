"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type Room = {
  code: string;
  status: "waiting" | "active" | "finished";
  question: { index: number; total: number; prompt: string; options: string[] } | null;
  participants: Array<{ id: string; name: string; score: number; answered: boolean }>;
};

export default function TeacherLiveGamePage() {
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("أنشئ غرفة ثم اعرض رمزها للطلاب.");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function call(action?: string) {
    if (!user) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const response = action
        ? await fetch("/api/academy-club/live-game", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action, code: room?.code }),
          })
        : await fetch(`/api/academy-club/live-game?code=${room?.code}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر تنفيذ العملية.");
      setRoom(data.room);
      if (action === "create") setMessage("الغرفة جاهزة؛ اطلب من الطلاب إدخال الرمز.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تنفيذ العملية.");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!user || !room?.code) return;
    const timer = window.setInterval(() => void call(), 2000);
    return () => window.clearInterval(timer);
  }, [user, room?.code]);

  return <main dir="rtl" style={page}>
    <header style={header}>
      <div><small style={{color:"#f6d66d",fontWeight:900}}>🎮 مدينة لغتي</small><h1 style={{margin:"6px 0"}}>إدارة التحدي المباشر</h1></div>
      <Link href="/teacher/academy-club" style={link}>إدارة النادي ←</Link>
    </header>
    <div style={shell}>
      {!room ? <section style={card}>
        <div style={{fontSize:64}}>🏟️</div>
        <h2>أنشئ ساحة منافسة جديدة</h2>
        <p>تستوعب الغرفة حتى 30 طالبًا، ويبدأ الجميع في الوقت نفسه.</p>
        <button style={primary} disabled={!user || busy} onClick={() => void call("create")}>إنشاء غرفة مباشرة</button>
      </section> : <>
        <section style={{...card,background:"linear-gradient(135deg,#fff7d6,#fff,#eaf8f0)"}}>
          <span>رمز دخول الطلاب</span><strong style={{display:"block",fontSize:56,letterSpacing:10,color:"#176c46"}}>{room.code}</strong>
          <p>عدد المنضمين: <b>{room.participants.length}</b> طالبًا</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            {room.status === "waiting" && <button style={primary} onClick={() => void call("start")}>ابدأ المسابقة الآن 🚀</button>}
            {room.status === "active" && <button style={primary} onClick={() => void call("next")}>السؤال التالي ←</button>}
            {room.status === "finished" && <b style={{color:"#9a6b08"}}>🏆 انتهت المسابقة</b>}
          </div>
        </section>
        {room.question && <section style={card}>
          <small>السؤال {room.question.index + 1} من {room.question.total}</small>
          <h2>{room.question.prompt}</h2>
          <div style={grid}>{room.question.options.map((option) => <div key={option} style={optionStyle}>{option}</div>)}</div>
        </section>}
        <section style={card}><h2>لوحة المتصدرين المباشرة</h2>
          <div style={{display:"grid",gap:9}}>{room.participants.map((student,index) =>
            <div key={student.id} style={row}><b>{index + 1}. {student.name}</b><span>{student.answered ? "✅" : "⏳"} ⭐ {student.score}</span></div>
          )}</div>
        </section>
      </>}
      <p style={{textAlign:"center",fontWeight:800,color:"#64748b"}}>{message}</p>
    </div>
  </main>;
}

const page: React.CSSProperties={minHeight:"100vh",background:"#f3faf6",fontFamily:"Arial",color:"#17352a"};
const header: React.CSSProperties={padding:"22px clamp(16px,5vw,50px)",background:"#0f5c3d",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"};
const shell: React.CSSProperties={maxWidth:950,margin:"0 auto",padding:"25px 16px",display:"grid",gap:18};
const card: React.CSSProperties={padding:"clamp(22px,5vw,38px)",borderRadius:26,background:"#fff",border:"1px solid #d6e9df",boxShadow:"0 12px 32px rgba(20,80,50,.10)",textAlign:"center"};
const primary: React.CSSProperties={border:0,borderRadius:15,padding:"13px 20px",background:"#16865d",color:"#fff",fontWeight:900,fontSize:17,cursor:"pointer"};
const link: React.CSSProperties={color:"#fff",textDecoration:"none",fontWeight:900};
const grid: React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10};
const optionStyle: React.CSSProperties={padding:15,borderRadius:15,background:"#eef8f2",border:"1px solid #b9dec9",fontWeight:900};
const row: React.CSSProperties={display:"flex",justifyContent:"space-between",gap:10,padding:"12px 15px",borderRadius:13,background:"#f5faf7",border:"1px solid #dcebe3"};
