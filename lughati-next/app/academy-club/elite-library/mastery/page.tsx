"use client";

import Link from "next/link";

export default function MasteryPage(){
  return <main dir="rtl" style={{minHeight:"100vh",padding:"28px 16px 60px",fontFamily:"Arial,sans-serif",background:"linear-gradient(180deg,#0f6b49,#f2fbf6 310px)",color:"#17352a"}}>
    <div style={{maxWidth:820,margin:"0 auto"}}>
      <Link href="/academy-club/elite-library" style={{color:"#fff",fontWeight:900,textDecoration:"none"}}>← العودة إلى مكتبة النخبة</Link>
      <section style={{marginTop:24,padding:"clamp(24px,6vw,40px)",borderRadius:30,background:"#fff",border:"2px solid #9ed8b8",boxShadow:"0 18px 45px rgba(18,90,60,.16)"}}>
        <div style={{fontSize:58}}>🌱</div>
        <div style={{color:"#16845b",fontWeight:900}}>الباب الأول • مختبر المهارة</div>
        <h1 style={{margin:"6px 0",fontSize:"clamp(30px,7vw,45px)"}}>أتقن</h1>
        <p style={{fontSize:18,lineHeight:1.9,color:"#607169",fontWeight:700}}>هنا تبدأ رحلة النخبة. لن نكثر المهام؛ كل نشاط قصير وله هدف واضح، وعند إتقانه تتقدم نحو قطعة جديدة من مفتاح النخبة.</p>
        <div style={{marginTop:22,padding:20,borderRadius:22,background:"#eefaf4",border:"1px solid #b8e1cb"}}>
          <span style={{fontWeight:900,color:"#16845b"}}>🧪 التجربة الأولى</span>
          <h2 style={{margin:"8px 0"}}>مهمة الفكرة الرئيسة</h2>
          <p style={{margin:"0 0 12px",lineHeight:1.8,color:"#61736a",fontWeight:700}}>نشاط قصير في الفهم القرائي سيقيس قدرتك على اكتشاف الفكرة الرئيسة من نص مناسب للصف الثاني.</p>
          <div style={{display:"inline-block",padding:"9px 14px",borderRadius:14,background:"#fff3c4",color:"#8b6509",fontWeight:900}}>🚧 يتم تجهيز النشاط التفاعلي الأول</div>
        </div>
      </section>
    </div>
  </main>
}
