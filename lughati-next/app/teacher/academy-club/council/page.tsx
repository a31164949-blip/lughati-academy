"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {onAuthStateChanged,type User} from "firebase/auth";
import {auth} from "../../../../firebase";

type Poll={question:string;options:string[];active:boolean;showResults:boolean;counts?:Record<string,number>;totalVotes?:number};

export default function TeacherCouncil(){
  const [user,setUser]=useState<User|null>(null),[q,setQ]=useState(""),[opts,setOpts]=useState(["",""]),[hours,setHours]=useState("24"),[show,setShow]=useState(false),[poll,setPoll]=useState<Poll|null>(null),[msg,setMsg]=useState("");
  useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);if(u)void load(u)}),[]);
  async function load(u:User){const t=await u.getIdToken();const r=await fetch("/api/teacher/academy-club/council",{headers:{Authorization:`Bearer ${t}`},cache:"no-store"});const d=await r.json();if(r.ok)setPoll(d.poll)}
  async function publish(){if(!user)return;setMsg("");const t=await user.getIdToken();const r=await fetch("/api/teacher/academy-club/council",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({question:q,options:opts,durationHours:Number(hours),showResults:show})});const d=await r.json();setMsg(r.ok?"تم نشر التصويت لأعضاء النادي 🗳️":d.message);if(r.ok){setQ("");setOpts(["",""]);await load(user)}}
  async function patch(x:Record<string,boolean>){if(!user)return;const t=await user.getIdToken();await fetch("/api/teacher/academy-club/council",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify(x)});await load(user)}
  const field={padding:"12px 14px",borderRadius:14,border:"1px solid #bfd8cb",font:"inherit",width:"100%",boxSizing:"border-box" as const,background:"#fbfefc"};
  const smallButton={padding:"10px 14px",borderRadius:12,border:"1px solid #c9ddd3",background:"white",font:"inherit",fontWeight:800,cursor:"pointer"};
  return <main dir="rtl" style={{minHeight:"100vh",background:"#f4faf7",fontFamily:"Arial",color:"#17352a"}}>
    <header style={{background:"linear-gradient(135deg,#176c46,#0f5237)",color:"white",padding:"18px max(16px,calc((100% - 900px)/2))",paddingTop:"92px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <div><b style={{color:"#f4d46a"}}>🏅 نادي الأكاديمية</b><h1 style={{margin:"7px 0 0"}}>🗳️ إدارة مجلس النادي</h1></div>
      <Link href="/teacher/academy-club" style={{color:"white",textDecoration:"none",border:"1px solid #ffffff55",padding:"9px 13px",borderRadius:12}}>العودة ←</Link>
    </header>
    <div style={{maxWidth:900,margin:"0 auto",padding:"16px 16px 40px",display:"grid",gap:18}}>
      <section style={{background:"white",borderRadius:24,padding:"clamp(16px,3vw,23px)",border:"1px solid #d7e8df",boxShadow:"0 12px 35px #17352a0d"}}>
        <div style={{marginBottom:13}}><div style={{fontSize:14,color:"#6b7e75",fontWeight:800}}>تصويت جديد</div><h2 style={{margin:"5px 0"}}>🗳️ اطرح موضوعًا على أعضاء النادي</h2><p style={{margin:0,color:"#65766e"}}>اكتب السؤال والخيارات، ثم حدد مدة التصويت وطريقة عرض النتائج.</p></div>
        <label style={{display:"grid",gap:7,fontWeight:900}}>سؤال التصويت<textarea rows={2} value={q} onChange={e=>setQ(e.target.value)} placeholder="مثال: ما الموعد الأنسب للحصة الإضافية عن بُعد؟" style={{...field,resize:"vertical",minHeight:68}}/></label>
        <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><h3 style={{margin:0}}>الخيارات</h3><span style={{fontSize:13,color:"#718078"}}>{opts.length} من 4</span></div>
        <div style={{display:"grid",gap:10,marginTop:10}}>{opts.map((o,i)=><div key={i} style={{display:"grid",gridTemplateColumns:opts.length>2?"42px 1fr auto":"42px 1fr",gap:9,alignItems:"center"}}><span style={{width:38,height:38,borderRadius:12,display:"grid",placeItems:"center",background:"#eaf6ef",color:"#176c46",fontWeight:900}}>{i+1}</span><input value={o} onChange={e=>setOpts(a=>a.map((v,j)=>j===i?e.target.value:v))} placeholder={`اكتب الخيار ${i+1}`} style={field}/>{opts.length>2&&<button onClick={()=>setOpts(a=>a.filter((_,j)=>j!==i))} style={{...smallButton,color:"#9a3e35"}}>حذف</button>}</div>)}</div>
        {opts.length<4&&<button onClick={()=>setOpts(a=>[...a,""])} style={{...smallButton,marginTop:11,color:"#176c46"}}>＋ إضافة خيار</button>}
        <div style={{marginTop:16,padding:13,borderRadius:17,background:"#f5faf7",display:"flex",gap:18,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <label style={{fontWeight:800}}>⏱️ مدة التصويت <select value={hours} onChange={e=>setHours(e.target.value)} style={{marginRight:7,padding:"8px 10px",borderRadius:10,border:"1px solid #bfd8cb",font:"inherit"}}><option value="6">6 ساعات</option><option value="12">12 ساعة</option><option value="24">يوم</option><option value="48">يومان</option><option value="72">3 أيام</option></select></label>
          <label style={{fontWeight:800,display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> 👁️ إظهار النتائج للطلاب</label>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:13}}>{msg&&<span style={{fontWeight:900,color:msg.startsWith("تم")?"#176c46":"#a33b32"}}>{msg}</span>}<button onClick={()=>void publish()} style={{padding:"13px 22px",border:0,borderRadius:14,background:"#176c46",color:"white",fontWeight:900,fontSize:16,cursor:"pointer"}}>نشر التصويت للأعضاء 🚀</button></div>
      </section>
      {poll&&<section style={{background:"white",borderRadius:24,padding:"clamp(18px,4vw,26px)",border:"1px solid #d7e8df"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div><div style={{fontSize:14,color:"#6b7e75",fontWeight:800}}>التصويت الحالي</div><h2 style={{margin:"5px 0",color:"#176c46"}}>{poll.question}</h2></div><span style={{background:poll.active?"#e9f8ef":"#f1f3f2",padding:"7px 12px",borderRadius:999,fontWeight:900}}>{poll.active?"🟢 مفتوح":"🔒 مغلق"}</span></div>
        <div style={{display:"grid",gap:8,marginTop:13}}>{poll.options.map((o,i)=><div key={i} style={{padding:"12px 14px",borderRadius:13,background:"#f7fbf9",display:"flex",justifyContent:"space-between",gap:12}}><span>{o}</span><b>{poll.counts?.[String(i)]??0} صوت</b></div>)}</div>
        <p style={{fontWeight:900}}>إجمالي المشاركين: {poll.totalVotes??0}</p>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><button style={smallButton} onClick={()=>void patch({showResults:!poll.showResults})}>{poll.showResults?"🙈 إخفاء النتائج":"👁️ إظهار النتائج"}</button><button style={smallButton} onClick={()=>void patch({active:!poll.active})}>{poll.active?"🔒 إغلاق التصويت":"🔓 إعادة فتح التصويت"}</button><Link href="/academy-club/council?teacherPreview=1" target="_blank" style={{...smallButton,textDecoration:"none",color:"#176c46"}}>معاينة الغرفة ↗</Link></div>
      </section>}
    </div>
  </main>
}
