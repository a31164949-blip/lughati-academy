"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const stages = [
  {
    text: "زرع خالد بذرة صغيرة، وسقاها كل صباح. وبعد أيام نمت البذرة وأصبحت نبتة جميلة.",
    question: "ما الفكرة الرئيسة للنص؟",
    choices: ["خالد يحب اللعب.", "اعتنى خالد بالبذرة حتى نمت.", "الصباح جميل."],
    answer: 1,
  },
  {
    text: "رتبت سارة كتبها وأقلامها في حقيبتها مساءً؛ لتكون مستعدة للمدرسة في الصباح.",
    question: "ما الفكرة الرئيسة للنص؟",
    choices: ["استعداد سارة للمدرسة.", "لون حقيبة سارة.", "ذهاب سارة إلى الحديقة."],
    answer: 0,
  },
  {
    text: "قرأ مازن القصة بهدوء، ثم أخبر والده بأهم ما حدث فيها.",
    question: "ما الفكرة الرئيسة للنص؟",
    choices: ["مازن يشتري قصة.", "مازن يقرأ القصة ويفهمها.", "والد مازن يكتب قصة."],
    answer: 1,
  },
];

export default function MasteryPage(){
  const [stage,setStage]=useState(0);
  const [selected,setSelected]=useState<number|null>(null);
  const [score,setScore]=useState(0);\n  const [attempts,setAttempts]=useState(0);\n  const [revealed,setRevealed]=useState(false);
  const [finished,setFinished]=useState(false);
  const item=stages[stage];
  const correct=selected===item.answer;
  const progress=useMemo(()=>finished?100:Math.round((stage/stages.length)*100),[stage,finished]);

  function choose(index:number){
    if(revealed||correct)return;
    setSelected(index);
    if(index===item.answer){
      setScore(v=>v+1);
      setRevealed(true);
      return;
    }
    const nextAttempts=attempts+1;
    setAttempts(nextAttempts);
    if(nextAttempts>=2)setRevealed(true);
  }

  function next(){
    if(selected===null)return;
    if(stage===stages.length-1){setFinished(true);return;}
    setStage(v=>v+1);setSelected(null);setAttempts(0);setRevealed(false);
  }

  function restart(){setStage(0);setSelected(null);setScore(0);setAttempts(0);setRevealed(false);setFinished(false);}

  return <main dir="rtl" style={{minHeight:"100vh",padding:"28px 16px 60px",fontFamily:"Arial,sans-serif",background:"linear-gradient(180deg,#0f6b49,#f2fbf6 310px)",color:"#17352a"}}>
    <div style={{maxWidth:820,margin:"0 auto"}}>
      <Link href="/academy-club/elite-library" style={{color:"#fff",fontWeight:900,textDecoration:"none"}}>← العودة إلى مكتبة النخبة</Link>
      <section style={{marginTop:24,padding:"clamp(24px,6vw,40px)",borderRadius:30,background:"#fff",border:"2px solid #9ed8b8",boxShadow:"0 18px 45px rgba(18,90,60,.16)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center",flexWrap:"wrap"}}>
          <div><div style={{fontSize:54}}>🌱</div><div style={{color:"#16845b",fontWeight:900}}>الباب الأول • مختبر المهارة</div><h1 style={{margin:"5px 0",fontSize:"clamp(30px,7vw,44px)"}}>أتقن</h1></div>
          <div style={{minWidth:180}}><div style={{fontWeight:900,color:"#65766d",marginBottom:6}}>تقدم التجربة {finished?"3/3":`${stage+1}/3`}</div><div style={{height:12,borderRadius:999,background:"#e8efeb",overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"#1b8a61",transition:"width .3s"}} /></div></div>
        </div>

        {!finished ? <>
          <div style={{marginTop:24,padding:22,borderRadius:24,background:"#eefaf4",border:"1px solid #b8e1cb"}}>
            <span style={{fontWeight:900,color:"#16845b"}}>🧪 التجربة الأولى • اكتشف الفكرة الرئيسة</span>
            <p style={{margin:"10px 0 0",color:"#65766d",fontWeight:700}}>اقرأ النص القصير، ثم اختر الجملة التي تخبرنا بأهم ما فيه.</p>
          </div>

          <article style={{marginTop:18,padding:"24px 20px",borderRadius:22,background:"#fffaf0",border:"2px solid #f0d891",fontSize:"clamp(20px,4vw,25px)",fontWeight:800,lineHeight:2,textAlign:"center"}}>{item.text}</article>
          <h2 style={{margin:"22px 0 12px",fontSize:22}}>{item.question}</h2>
          <div style={{display:"grid",gap:11}}>
            {item.choices.map((choice,index)=>{
              const picked=selected===index;
              const isAnswer=index===item.answer;
              let bg="#fff",border="#d8e4de",color="#17352a";
              if(revealed&&isAnswer){bg="#e6f8ee";border="#42a878";color="#126743";}
              else if(picked&&!correct){bg="#fff0ed";border="#e27b69";color="#9b3d31";}
              return <button key={choice} onClick={()=>choose(index)} disabled={revealed||correct} style={{padding:"15px 17px",borderRadius:17,border:`2px solid ${border}`,background:bg,color,textAlign:"right",fontSize:18,fontWeight:900,cursor:revealed||correct?"default":"pointer"}}>{choice}</button>;
            })}
          </div>

          {selected!==null&&<div style={{marginTop:17,padding:16,borderRadius:18,background:correct?"#e9f9f0":"#fff6e5",border:correct?"1px solid #9dd8b9":"1px solid #ecd18d",fontWeight:900,color:correct?"#126743":"#8a620b"}}>
            {correct?"👏 أحسنت! اخترت الفكرة التي تجمع أهم ما في النص.":attempts<2?"💡 اقتربت! فكر: أي جملة تجمع أهم ما حدث في النص؟ حاول مرة أخرى.":"💡 أحسنت المحاولة. الآن ظهرت لك الفكرة الرئيسة؛ اقرأها ثم انتقل للمهمة التالية."}
          </div>}
          {revealed&&<button onClick={next} style={{marginTop:15,width:"100%",padding:14,border:0,borderRadius:16,background:"#176c46",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer"}}>{stage===stages.length-1?"شاهد نتيجتي 🗝️":"المهمة التالية ←"}</button>}
        </> : <section style={{marginTop:25,padding:"32px 20px",borderRadius:26,textAlign:"center",background:"linear-gradient(135deg,#fff7d4,#eefaf4)",border:"2px solid #e0bd4d"}}>
          <div style={{fontSize:65}}>{score===3?<span style={{display:"inline-block",animation:"eliteKeyWin .75s ease-in-out 2"}}>🗝️</span>:"🌟"}</div>
          <h2 style={{margin:"8px 0",color:"#176c46",fontSize:30}}>{score===3?"أحسنت! أتقنت المهارة":"أكملت التجربة!"}</h2>
          <p style={{fontSize:20,fontWeight:900}}>نتيجتك: {score} من {stages.length}</p>
          <p style={{color:"#65766d",fontWeight:700,lineHeight:1.8}}>{score===3?"حصلت على قطعة من مفتاح النخبة 🗝️ — في النسخة التجريبية لن نضيفها إلى حسابك بعد.":score===2?"اقتربت جدًا! بقيت لك خطوة واحدة نحو قطعة المفتاح 🗝️":"أعد التجربة وحاول الوصول إلى الإتقان الكامل لتحصل على المفتاح."}</p>
          {score<3&&<button onClick={restart} style={{padding:"12px 20px",border:0,borderRadius:15,background:"#176c46",color:"#fff",fontWeight:900,fontSize:17,cursor:"pointer"}}>أحاول مرة أخرى 🔄</button>}
          {score===3&&<Link href="/academy-club/elite-library" style={{display:"inline-block",padding:"12px 20px",borderRadius:15,background:"#176c46",color:"#fff",fontWeight:900,textDecoration:"none"}}>العودة للمكتبة ←</Link>}
        </section>}
      </section>
    </div>
    <style jsx global>{`@keyframes eliteKeyWin{0%{transform:scale(1) rotate(0)}50%{transform:scale(1.28) rotate(-10deg)}100%{transform:scale(1) rotate(0)}}`}</style>\n  </main>
}
