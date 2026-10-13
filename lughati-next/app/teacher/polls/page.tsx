"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {onAuthStateChanged,type User} from "firebase/auth";
import {auth} from "../../../firebase";

type Poll={closesAt:string;question:string;options:string[];active:boolean;showResults:boolean;counts?:Record<string,number>;totalVotes?:number};

export default function TeacherCouncil(){
  const [user,setUser]=useState<User|null>(null),[q,setQ]=useState(""),[opts,setOpts]=useState(["",""]),[hours,setHours]=useState("24"),[show,setShow]=useState(false),[poll,setPoll]=useState<Poll|null>(null),[msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const pending=useRef(false);
  useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);if(u)void load(u).catch(()=>setMsg("تعذر تحميل التصويت. حاول تحديث الصفحة."))}),[]);
  async function load(u:User){const t=await u.getIdToken();const r=await fetch("/api/teacher/polls",{headers:{Authorization:`Bearer ${t}`},cache:"no-store"});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"تعذر تحميل التصويت.");setPoll(d.poll)}
  async function send(method:string, body:Record<string,unknown>){
    if(!user||pending.current)return;
    pending.current=true;setBusy(true);setMsg("");
    try{
      const t=await user.getIdToken();
      const r=await fetch("/api/teacher/polls",{method,headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify(body)});
      const d=await r.json();
      if(!r.ok||!d.success)throw new Error(d.message||"تعذر حفظ التصويت.");
      setMsg(method==="POST"?"تم نشر التصويت للطلاب 🗳️":"تم تحديث التصويت ✅");
      if(method==="POST"){setQ("");setOpts(["",""]);}
      await load(user);
    }catch(error){setMsg(error instanceof Error?error.message:"تعذر حفظ التصويت. حاول مرة أخرى.");}
    finally{pending.current=false;setBusy(false);}
  }
  async function publish(){await send("POST",{question:q,options:opts,durationHours:Number(hours),showResults:show});}
  async function patch(x:Record<string,boolean>){await send("PATCH",x);}
  const open=!!poll?.active&&Date.parse(poll.closesAt)>Date.now();
  const field={padding:"12px 14px",borderRadius:14,border:"1px solid #bfd8cb",font:"inherit",width:"100%",boxSizing:"border-box" as const,background:"#fbfefc"};
  const smallButton={padding:"10px 14px",borderRadius:12,border:"1px solid #c9ddd3",background:"white",font:"inherit",fontWeight:800,cursor:"pointer"};
  return <main dir="rtl" style={{minHeight:"100vh",background:"#f4faf7",fontFamily:"Arial",color:"#17352a"}}>
    <header style={{background:"linear-gradient(135deg,#176c46,#0f5237)",color:"white",padding:"18px max(16px,calc((100% - 900px)/2))",paddingTop:"92px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><b style={{color:"#f4d46a"}}>🏅 أكاديمية لغتي الرقمية</b><h1 style={{margin:"7px 0 0"}}>🗳️ إدارة تصويت الطلاب</h1></div>
      <Link href="/teacher" style={{color:"white",textDecoration:"none",border:"1px solid #ffffff55",padding:"9px 13px",borderRadius:12}}>العودة ←</Link>
    </header>
    <div style={{maxWidth:900,margin:"0 auto",padding:"16px 16px 40px",display:"grid",gap:18}}>
      <section style={{background:"white",borderRadius:24,padding:"clamp(16px,3vw,23px)",border:"1px solid #d7e8df",boxShadow:"0 12px 35px #17352a0d"}}>
        <div style={{marginBottom:13}}><div style={{fontSize:14,color:"#6b7e75",fontWeight:800}}>تصويت جديد</div><h2 style={{margin:"5px 0"}}>🗳️ اطرح موضوعًا على الطلاب</h2><p style={{margin:0,color:"#65766e"}}>اكتب السؤال والخيارات، ثم حدد مدة التصويت وطريقة عرض النتائج.</p></div>
        <label style={{display:"grid",gap:7,fontWeight:900}}>سؤال التصويت<textarea rows={2} value={q} onChange={e=>setQ(e.target.value)} placeholder="مثال: ما الموعد الأنسب للحصة الإضافية عن بُعد؟" style={{...field,resize:"vertical",minHeight:68}}/></label>
        <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><h3 style={{margin:0}}>الخيارات</h3><span style={{fontSize:13,color:"#718078"}}>{opts.length} من 4</span></div>
        <div style={{display:"grid",gap:10,marginTop:10}}>{opts.map((o,i)=><div key={i} style={{display:"grid",gridTemplateColumns:opts.length>2?"42px 1fr auto":"42px 1fr",gap:9,alignItems:"center"}}><span style={{width:38,height:38,borderRadius:12,display:"grid",placeItems:"center",background:"#eaf6ef",color:"#176c46",fontWeight:900}}>{i+1}</span><input value={o} onChange={e=>setOpts(a=>a.map((v,j)=>j===i?e.target.value:v))} placeholder={`اكتب الخيار ${i+1}`} style={field}/>{opts.length>2&&<button onClick={()=>setOpts(a=>a.filter((_,j)=>j!==i))} style={{...smallButton,color:"#9a3e35"}}>حذف</button>}</div>)}</div>
        {opts.length<4&&<button onClick={()=>setOpts(a=>[...a,""])} style={{...smallButton,marginTop:11,color:"#176c46"}}>＋ إضافة خيار</button>}
        <div style={{marginTop:16,padding:13,borderRadius:17,background:"#f5faf7",display:"flex",gap:18,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <label style={{fontWeight:800}}>⏱️ مدة التصويت <select value={hours} onChange={e=>setHours(e.target.value)} style={{marginRight:7,padding:"8px 10px",borderRadius:10,border:"1px solid #bfd8cb",font:"inherit"}}><option value="6">6 ساعات</option><option value="12">12 ساعة</option><option value="24">يوم</option><option value="48">يومان</option><option value="72">3 أيام</option></select></label>
          <label style={{fontWeight:800,display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> 👁️ إظهار النتائج للطلاب</label>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:13}}>{msg&&<span style={{fontWeight:900,color:msg.startsWith("تم")?"#176c46":"#a33b32"}}>{msg}</span>}<button disabled={busy||!user} onClick={()=>void publish()} style={{padding:"13px 22px",border:0,borderRadius:14,background:"#176c46",color:"white",fontWeight:900,fontSize:16,cursor:"pointer"}}>نشر التصويت للطلاب 🚀</button></div>
      </section>
      {poll&&<section style={{background:"white",borderRadius:24,padding:"clamp(18px,4vw,26px)",border:"1px solid #d7e8df"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div><div style={{fontSize:14,color:"#6b7e75",fontWeight:800}}>التصويت الحالي</div><h2 style={{margin:"5px 0",color:"#176c46"}}>{poll.question}</h2></div><span style={{background:open?"#e9f8ef":"#f1f3f2",padding:"7px 12px",borderRadius:999,fontWeight:900}}>{open?"🟢 مفتوح":"🔒 مغلق"}</span></div>
        <div style={{display:"grid",gap:8,marginTop:13}}>{poll.options.map((o,i)=><div key={i} style={{padding:"12px 14px",borderRadius:13,background:"#f7fbf9",display:"flex",justifyContent:"space-between",gap:12}}><span>{o}</span><b>{poll.counts?.[String(i)]??0} صوت</b></div>)}</div>
        <p style={{fontWeight:900}}>إجمالي المشاركين: {poll.totalVotes??0}</p>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><button disabled={busy} style={smallButton} onClick={()=>void patch({showResults:!poll.showResults})}>{poll.showResults?"🙈 إخفاء النتائج":"👁️ إظهار النتائج"}</button><button disabled={busy} style={smallButton} onClick={()=>void patch({active:!open})}>{open?"🔒 إغلاق التصويت":"🔓 إعادة فتح التصويت"}</button><Link href="/polls?teacherPreview=1" target="_blank" style={{...smallButton,textDecoration:"none",color:"#176c46"}}>معاينة الغرفة ↗</Link></div>
      </section>}
    </div>
  </main>
}
