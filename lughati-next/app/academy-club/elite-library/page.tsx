"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type Door = {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  status: "open" | "soon" | "locked";
  accent: string;
  bg: string;
};

const doors: Door[] = [
  { icon: "🌱", title: "أتقن", subtitle: "مختبر المهارة", description: "مهام قصيرة تثبت إتقانك للقراءة والكتابة والفهم.", status: "open", accent: "#16845b", bg: "#eefaf4" },
  { icon: "⚡", title: "أتحدى نفسي", subtitle: "غرفة الألغاز", description: "ألغاز لغوية ومهام تفكير واكتشاف للخطأ.", status: "soon", accent: "#d27b16", bg: "#fff7e9" },
  { icon: "🎨", title: "أبدع", subtitle: "مرسم الكلمات", description: "اكتب، صف، سجّل صوتك، واصنع إجابة تحمل بصمتك.", status: "soon", accent: "#3377c5", bg: "#eef6ff" },
  { icon: "👑", title: "أتميز", subtitle: "الخزنة الذهبية", description: "مهمة النخبة لا تُفتح إلا بعد جمع قطع المفتاح.", status: "locked", accent: "#8660b5", bg: "#f7f1ff" },
];

export default function EliteLibraryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [teacherPreview, setTeacherPreview] = useState(false);
  const [masteryKey, setMasteryKey] = useState(false);

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("teacherPreview") === "1";
    setTeacherPreview(preview);
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setLoading(false); return; }
      try {
        const token = await currentUser.getIdToken();
        const endpoint = preview ? "/api/teacher/academy-club/challenge" : "/api/student-journey";
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json();
        setAllowed(preview ? response.ok && data.success : response.ok && data.success && Boolean(data.academyClubMembership?.active));
        if (!preview && response.ok && data.success) setMasteryKey(data.eliteLibrary?.masteryKey === true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <main dir="rtl" style={shell}><section style={notice}>⏳ جارٍ فتح أبواب مكتبة النخبة...</section></main>;
  if (!user) return <main dir="rtl" style={shell}><section style={notice}>🔐 <h2>سجّل دخولك أولًا</h2><Link href="/login" style={button}>تسجيل الدخول</Link></section></main>;
  if (!allowed) return <main dir="rtl" style={shell}><section style={notice}>🌱 <h2>هذه المكتبة خاصة بأعضاء النادي</h2><p>استمر في نشاطك وإنجازك لتصبح من أبطال النخبة.</p><Link href="/academy-club" style={button}>العودة للنادي</Link></section></main>;

  const suffix = teacherPreview ? "?teacherPreview=1" : "";

  return (
    <main dir="rtl" style={shell}>
      <header style={{maxWidth:1050,margin:"0 auto",padding:"28px 16px 18px",color:"#fff"}}>
        <Link href={`/academy-club${suffix}`} style={{color:"#fff",textDecoration:"none",fontWeight:900}}>← العودة إلى نادي الأكاديمية</Link>
        <div style={{marginTop:22,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div style={{width:78,height:78,borderRadius:25,display:"grid",placeItems:"center",fontSize:44,background:"rgba(255,255,255,.14)",border:"2px solid #f1d270"}}>📚</div>
          <div>
            <div style={{fontWeight:900,color:"#f6db82"}}>نادي الأكاديمية • بوابة الأعضاء</div>
            <h1 style={{margin:"4px 0",fontSize:"clamp(31px,7vw,48px)"}}>مكتبة النخبة</h1>
            <p style={{margin:0,fontWeight:800,opacity:.92}}>ليست مكتبة للقراءة فقط… بل أبواب لمغامرات لغوية.</p>
          </div>
        </div>
      </header>

      <div style={{maxWidth:1050,margin:"0 auto",padding:"0 16px 55px"}}>
        <section style={{padding:"24px",borderRadius:28,background:"linear-gradient(135deg,#fff8d9,#fff,#effaf4)",border:"2px solid #e7c65d",boxShadow:"0 18px 40px rgba(16,82,55,.13)"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"center",flexWrap:"wrap"}}>
            <div>
              <span style={{fontWeight:900,color:"#9a6b08"}}>🗝️ مفتاح النخبة</span>
              <h2 style={{margin:"8px 0 5px",color:"#176c46"}}>اجمع قطع المفتاح وافتح الخزنة</h2>
              <p style={{margin:0,color:"#65756d",fontWeight:700,lineHeight:1.8}}>كل باب يختبر مهارة مختلفة. أكمل المهام، واجمع القطع، ثم افتح مهمة «أتميز».</p>
            </div>
            <div style={{display:"flex",gap:8}}>{[0,1,2,3].map(i=><div key={i} style={{width:48,height:48,borderRadius:16,display:"grid",placeItems:"center",background:i===0&&(masteryKey||teacherPreview)?"#fff0b5":"#f2f4f3",border:i===0&&(masteryKey||teacherPreview)?"2px solid #d8ad2f":"2px dashed #bdc9c3",fontSize:25}}>{i===0&&(masteryKey||teacherPreview)?"🗝️":"?"}</div>)}</div>
          </div>
          <div style={{marginTop:15,fontSize:13,fontWeight:900,color:"#7b887f"}}>{teacherPreview?"معاينة المعلم: تظهر قطعة «أتقن» للتعريف بالمسار.":masteryKey?"أحسنت! حصلت على أول قطعة من مفتاح النخبة 🗝️ بقيت 3 قطع لفتح الخزنة الذهبية.":"أتقن المهارة الأولى لتحصل على أول قطعة من المفتاح."}</div>
        </section>

        <section style={{marginTop:25}}>
          <h2 style={{margin:"0 0 6px",color:"#176c46"}}>🚪 اختر بابك</h2>
          <p style={{margin:"0 0 16px",color:"#687970",fontWeight:700}}>نبدأ بباب «أتقن»، ثم تُفتح بقية الأبواب تباعًا.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {doors.map((door,index)=>{
              const active=door.status==="open";
              const card=<div style={{minHeight:235,padding:22,borderRadius:26,background:door.bg,border:`2px solid ${door.accent}55`,boxShadow:"0 10px 25px rgba(25,70,52,.07)",position:"relative",overflow:"hidden"}}>
                <span style={{position:"absolute",top:14,left:14,padding:"6px 10px",borderRadius:999,background:active?"#e2f6eb":"#fff",fontSize:12,fontWeight:900,color:door.accent}}>{active?"مفتوح الآن":door.status==="locked"?"🔒 مغلق":"قريبًا"}</span>
                <div style={{fontSize:47,marginTop:16}}>{door.icon}</div>
                <h3 style={{margin:"10px 0 2px",fontSize:25,color:door.accent}}>{door.title}</h3>
                <div style={{fontWeight:900,color:"#42564c"}}>{door.subtitle}</div>
                <p style={{lineHeight:1.75,color:"#66776e",fontWeight:700}}>{door.description}</p>
                {active&&<span style={{fontWeight:900,color:door.accent}}>ادخل المختبر ←</span>}
              </div>;
              return active?<Link key={door.title} href={`/academy-club/elite-library/mastery${suffix}`} style={{textDecoration:"none",color:"inherit"}}>{card}</Link>:<div key={door.title} aria-disabled="true">{card}</div>;
            })}
          </div>
        </section>

        <section style={{marginTop:25,padding:24,borderRadius:28,background:"linear-gradient(135deg,#46306c,#7252a0)",color:"#fff",boxShadow:"0 15px 35px rgba(70,48,108,.18)"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{fontSize:55}}>📖✨</div>
            <div style={{flex:1,minWidth:220}}>
              <span style={{fontWeight:900,color:"#f5dd86"}}>سر المكتبة</span>
              <h2 style={{margin:"5px 0"}}>كتاب فارس الغامض</h2>
              <p style={{margin:0,lineHeight:1.8,fontWeight:700,opacity:.93}}>صفحة جديدة ومفاجأة لغوية لا يعرفها الأبطال مسبقًا. سيُفتح أول سر بعد تجربة «أتقن».</p>
            </div>
            <div style={{padding:"10px 15px",borderRadius:15,background:"rgba(255,255,255,.13)",fontWeight:900}}>🔒 الصفحة مغلقة</div>
          </div>
        </section>
      </div>
    </main>
  );
}

const shell: React.CSSProperties={minHeight:"100vh",fontFamily:"Arial,sans-serif",color:"#17352a",background:"linear-gradient(180deg,#0f5c3d 0,#18754f 245px,#f5fbf7 245px,#fffaf0 100%)"};
const notice: React.CSSProperties={width:"min(680px,calc(100% - 32px))",margin:"70px auto",padding:"42px 22px",borderRadius:28,textAlign:"center",background:"#fff",border:"1px solid #dcebe3",boxShadow:"0 18px 45px rgba(22,80,55,.12)",fontWeight:800};
const button: React.CSSProperties={display:"inline-block",marginTop:15,padding:"12px 18px",borderRadius:14,color:"#fff",background:"#176c46",textDecoration:"none",fontWeight:900};
