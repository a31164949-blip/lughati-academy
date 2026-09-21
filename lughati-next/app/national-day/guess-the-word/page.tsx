"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Student = { studentId: string; studentName: string; classroom: string };
type Question = { emoji: string; clues: string[]; choices: string[]; answer: string; fact: string };
type Stage = { id: number; title: string; subtitle: string; icon: string; reward: number; target: number; seconds: number; questions: Question[] };
type Screen = "map" | "play" | "result" | "complete";

const STAGES: Stage[] = [
  { id: 1, title: "راية البداية", subtitle: "كلمات ورموز وطنية", icon: "🇸🇦", reward: 5, target: 30, seconds: 30, questions: [
    { emoji:"🇸🇦", clues:["أرفرف عاليًا بلون أخضر","أحمل الشهادة والسيف","لا أُنكس أبدًا"], choices:["العَلَم","الوشاح","الخيمة"], answer:"العَلَم", fact:"العلم السعودي رمز العزة والوحدة." },
    { emoji:"🌴", clues:["شجرة مباركة","ثمري حلو ومفيد","أظهر في شعار المملكة"], choices:["النخلة","الزيتونة","التفاحة"], answer:"النخلة", fact:"تعلو النخلة السيفين في شعار المملكة." },
    { emoji:"🏙️", clues:["مدينة كبيرة في نجد","فيها قصر المصمك","أنا عاصمة المملكة"], choices:["الرياض","جدة","أبها"], answer:"الرياض", fact:"الرياض عاصمة المملكة العربية السعودية." },
    { emoji:"🕋", clues:["إليّ تتجه القلوب","فيّ المسجد الحرام","فيّ الكعبة المشرفة"], choices:["مكة المكرمة","المدينة المنورة","الطائف"], answer:"مكة المكرمة", fact:"مكة المكرمة قبلة المسلمين." },
    { emoji:"⚔️", clues:["رمز وطني","فيّ نخلة وسيفان","أمثل القوة والنماء"], choices:["شعار المملكة","الخريطة","النشيد"], answer:"شعار المملكة", fact:"السيفان يرمزان إلى القوة والنخلة إلى النماء." },
  ]},
  { id: 2, title: "دروب الوطن", subtitle: "مدن ومعالم ومناطق", icon: "🗺️", reward: 10, target: 45, seconds: 25, questions: [
    { emoji:"🌊", clues:["أطل على غرب المملكة","اسمي لون","لي ساحل طويل"], choices:["البحر الأحمر","الخليج العربي","بحر العرب"], answer:"البحر الأحمر", fact:"يمتد البحر الأحمر بمحاذاة غرب المملكة." },
    { emoji:"⛰️", clues:["جبل شامخ في نجد","يقع قرب الرياض","تشبه به همة السعوديين"], choices:["طويق","أُحد","السودة"], answer:"طويق", fact:"جبل طويق من أشهر معالم نجد." },
    { emoji:"🌫️", clues:["وجهة جبلية","تقع في عسير","تشتهر بالضباب"], choices:["السودة","العلا","الدرعية"], answer:"السودة", fact:"السودة من أبرز الوجهات الجبلية في عسير." },
    { emoji:"🏺", clues:["مدينة تاريخية","فيها الحِجر","تقع شمال غرب المملكة"], choices:["العلا","الخبر","نجران"], answer:"العلا", fact:"العلا موطن لإرث حضاري وطبيعة مميزة." },
    { emoji:"🏛️", clues:["موطن الدولة السعودية الأولى","حي الطريف جزء مني","أقع قرب الرياض"], choices:["الدرعية","جدة التاريخية","تبوك"], answer:"الدرعية", fact:"الدرعية مهد الدولة السعودية الأولى." },
    { emoji:"🌹", clues:["مدينة جبلية معتدلة","أشتهر بالورد","من مصايف المملكة"], choices:["الطائف","حائل","الدمام"], answer:"الطائف", fact:"تشتهر الطائف بالورد وأجوائها الجميلة." },
  ]},
  { id: 3, title: "همة وطن", subtitle: "قيم وإنجازات وطنية", icon: "💚", reward: 15, target: 60, seconds: 22, questions: [
    { emoji:"🤝", clues:["قيمة تجمعنا","بها نقوى معًا","يد واحدة لوطن واحد"], choices:["الوحدة","السرعة","الصمت"], answer:"الوحدة", fact:"وحدة أبناء الوطن أساس قوته." },
    { emoji:"🚀", clues:["رحلة سعودية إلى الفضاء","بطلتها ريانة برناوي","إنجاز علمي عالمي"], choices:["مهمة الفضاء","رحلة بحرية","سباق سيارات"], answer:"مهمة الفضاء", fact:"شاركت ريانة برناوي في مهمة علمية إلى محطة الفضاء الدولية." },
    { emoji:"🔭", clues:["وجهة وطنية للمستقبل","تدعم التحول والتطور","تنتهي في عام 2030"], choices:["رؤية السعودية 2030","الخطة الأسبوعية","التقويم الدراسي"], answer:"رؤية السعودية 2030", fact:"رؤية السعودية 2030 تبني وطنًا طموحًا واقتصادًا مزدهرًا." },
    { emoji:"🧠", clues:["أبدأ بفكرة","أصنع حلولًا جديدة","أقود المستقبل"], choices:["الابتكار","التردد","النسيان"], answer:"الابتكار", fact:"الابتكار من ركائز التقدم الوطني." },
    { emoji:"🏗️", clues:["مشروع طموح شمال غرب المملكة","مدينة مستقبلية","اسمي يبدأ بحرف النون"], choices:["نيوم","الدرعية","القدية"], answer:"نيوم", fact:"نيوم وجهة للمستقبل والابتكار." },
    { emoji:"📚", clues:["به أبني معرفتي","هو أساس التنمية","تقدمه المدارس والأكاديميات"], choices:["التعليم","السفر","التسوق"], answer:"التعليم", fact:"التعليم يصنع أجيال المستقبل." },
    { emoji:"🙋", clues:["أخدم مجتمعي بلا مقابل","أمنح وقتي وخبرتي","أعبر عن العطاء"], choices:["التطوع","المنافسة","الراحة"], answer:"التطوع", fact:"التطوع يعزز المسؤولية والانتماء." },
  ]},
  { id: 4, title: "قمة المجد", subtitle: "النهائي العائلي الكبير", icon: "🏆", reward: 20, target: 65, seconds: 18, questions: [
    { emoji:"🎶", clues:["نردده بفخر","يبدأ بسارعي","يرتبط براية الوطن"], choices:["النشيد الوطني","قصيدة","حكاية"], answer:"النشيد الوطني", fact:"النشيد الوطني تعبير عن الولاء والفخر." },
    { emoji:"🏜️", clues:["مساحة رملية شاسعة","تقع جنوب شرق المملكة","من أكبر صحارى العالم"], choices:["الربع الخالي","النفود الصغير","سهل تهامة"], answer:"الربع الخالي", fact:"الربع الخالي من أكبر الصحارى الرملية المتصلة في العالم." },
    { emoji:"🌇", clues:["مدينة على البحر الأحمر","بوابة الحرمين","فيّ منطقة تاريخية شهيرة"], choices:["جدة","الرياض","بريدة"], answer:"جدة", fact:"جدة بوابة الحرمين الشريفين ومدينة ساحلية عريقة." },
    { emoji:"💪", clues:["وصف لروح لا تستسلم","شُبهت بجبل طويق","تقودنا نحو الطموح"], choices:["الهمة","الحيرة","الانتظار"], answer:"الهمة", fact:"همة السعوديين راسخة كجبل طويق." },
    { emoji:"🕌", clues:["مدينة النبي ﷺ","فيها المسجد النبوي","ثاني الحرمين الشريفين"], choices:["المدينة المنورة","مكة المكرمة","الطائف"], answer:"المدينة المنورة", fact:"المدينة المنورة دار الهجرة ومقر المسجد النبوي." },
    { emoji:"🌱", clues:["أحافظ بها على موارد وطني","تعني الاستمرار دون هدر","جزء من مستقبل أخضر"], choices:["الاستدامة","الاستهلاك","المبالغة"], answer:"الاستدامة", fact:"الاستدامة تحفظ الموارد للأجيال القادمة." },
    { emoji:"👨‍👩‍👧‍👦", clues:["نلعب اليوم كفريق واحد","نساند بعضنا في التحدي","أنا أساس المجتمع"], choices:["الأسرة","الفريق الضيف","الفرد"], answer:"الأسرة", fact:"الأسرة شريك أساسي في التعلم وبناء القيم." },
  ]},
];

const TOTAL_REWARD = STAGES.reduce((sum, stage) => sum + stage.reward, 0);

function getStudent(): Student {
  try {
    const saved = JSON.parse(localStorage.getItem("lughatiStudent") || "{}");
    return {
      studentId: localStorage.getItem("student-id") || saved.studentId || saved.id || "",
      studentName: localStorage.getItem("student-name") || saved.studentName || saved.name || "",
      classroom: localStorage.getItem("student-class") || localStorage.getItem("student-classroom") || saved.classroom || saved.className || "",
    };
  } catch { return { studentId:"", studentName:"", classroom:"" }; }
}

export default function FamilyWordChallengePage() {
  const [student, setStudent] = useState<Student>({studentId:"",studentName:"",classroom:""});
  const [teamName, setTeamName] = useState("أسرة الوطن البطلة");
  const [completed, setCompleted] = useState<number[]>([]);
  const [screen, setScreen] = useState<Screen>("map");
  const [stageId, setStageId] = useState(1);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [clueCount, setClueCount] = useState(1);
  const [selected, setSelected] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [helps, setHelps] = useState({letter:true,remove:true,time:true});
  const [startedAt, setStartedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const stage = STAGES[stageId - 1];
  const question = stage.questions[index];
  const passed = score >= stage.target;
  const earned = STAGES.filter(s=>completed.includes(s.id)).reduce((n,s)=>n+s.reward,0);
  const pointsForQuestion = clueCount === 1 ? 10 : clueCount === 2 ? 7 : 5;
  const answerPoints = stage.id === 4 && index === stage.questions.length - 1 ? pointsForQuestion * 2 : pointsForQuestion;

  useEffect(() => {
    const value = getStudent(); setStudent(value);
    if (value.studentName) setTeamName(`أسرة ${value.studentName.split(" ")[0]}`);
    if (value.studentId) fetch(`/api/national-day/family-word-challenge?studentId=${encodeURIComponent(value.studentId)}`)
      .then(r=>r.json()).then(data=>{ if(Array.isArray(data.completedStages)) setCompleted(data.completedStages); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (screen !== "play" || selected) return;
    if (timeLeft <= 0) { setSelected("__timeout__"); return; }
    const timer = window.setTimeout(()=>setTimeLeft(v=>v-1),1000);
    return ()=>window.clearTimeout(timer);
  }, [screen, selected, timeLeft]);

  function start(id:number) {
    if (id > 1 && !completed.includes(id-1)) return;
    const next = STAGES[id-1]; setStageId(id); setIndex(0); setScore(0); setTimeLeft(next.seconds);
    setClueCount(1); setSelected(""); setHidden([]); setHelps({letter:true,remove:true,time:true});
    setStartedAt(Date.now()); setNotice(""); setScreen("play");
  }

  function choose(choice:string) {
    if(selected) return; setSelected(choice);
    if(choice===question.answer) setScore(v=>v+answerPoints);
  }

  async function next() {
    if(index < stage.questions.length-1) { setIndex(v=>v+1); setTimeLeft(stage.seconds); setClueCount(1); setSelected(""); setHidden([]); return; }
    const finalScore = score;
    const success = finalScore >= stage.target;
    if(!success) { setScreen("result"); return; }
    if(!student.studentId || !student.studentName) { setNotice("اكتمل التدريب، لكن إضافة النقاط تتطلب الدخول بحساب الطالب."); setScreen(stage.id===4?"complete":"result"); return; }
    try {
      setSaving(true);
      const response = await fetch("/api/national-day/family-word-challenge", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId:student.studentId,name:student.studentName,classroom:student.classroom,teamName,stage:stage.id,score:finalScore,durationSeconds:Math.max(1,Math.round((Date.now()-startedAt)/1000))})});
      const data = await response.json();
      if(!response.ok) throw new Error(data.error || "تعذر حفظ النتيجة");
      setCompleted(old=>old.includes(stage.id)?old:[...old,stage.id]); setNotice(data.message || "تم حفظ الإنجاز وإضافة المكافأة.");
      setScreen(stage.id===4?"complete":"result");
    } catch(error) { setNotice(error instanceof Error?error.message:"تعذر حفظ النتيجة"); setScreen("result"); }
    finally { setSaving(false); }
  }

  function useRemove() { const wrong=question.choices.filter(x=>x!==question.answer&&!hidden.includes(x)).slice(0,2); setHidden(wrong); setHelps(h=>({...h,remove:false})); }
  function share() { const text=`🏆 ${teamName} أتمت تحدّي كلمة الوطن العائلي في أكاديمية لغتي وحصلت على ${TOTAL_REWARD} نقطة! 🇸🇦`; if(navigator.share) navigator.share({title:"تحدّي كلمة الوطن العائلي",text}).catch(()=>{}); else navigator.clipboard?.writeText(text).then(()=>setNotice("تم نسخ النتيجة للمشاركة.")); }
  const progress = useMemo(()=>Math.round((completed.length/STAGES.length)*100),[completed]);

  return <main dir="rtl" className="page"><style>{`
    *{box-sizing:border-box}.page{min-height:100vh;padding:18px;color:#143f34;font-family:Tahoma,Arial,sans-serif;background:radial-gradient(circle at 12% 8%,#fff2ad 0,transparent 20%),linear-gradient(155deg,#eafff4,#fff)}.shell{max-width:960px;margin:auto}.top{display:flex;justify-content:space-between;gap:12px;align-items:center}.back{color:#087b52;text-decoration:none;font-weight:900}.hero{margin-top:14px;padding:28px;border-radius:30px;color:#fff;background:linear-gradient(135deg,#064e3b,#07915e);box-shadow:0 18px 45px #075f4630;text-align:center}.hero h1{margin:5px;font-size:clamp(30px,6vw,50px)}.gold{color:#ffe68a}.card{margin-top:18px;padding:clamp(18px,4vw,32px);border:2px solid #d5eee1;border-radius:26px;background:#fff;box-shadow:0 14px 36px #075f4615}.field{width:100%;padding:13px;border:2px solid #cde5d9;border-radius:14px;font:inherit}.bar{height:12px;border-radius:20px;background:#e7f3ed;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#0b8c5d,#e0b72c)}.stages{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}.stage{position:relative;padding:20px;border:2px solid #d5eee1;border-radius:22px;background:#fff;text-align:right;font:inherit;color:inherit;cursor:pointer}.stage.locked{opacity:.55;cursor:not-allowed}.stage.done{border-color:#dfb62b;background:#fffcef}.stage strong{display:block;font-size:22px;color:#076746}.badge{position:absolute;left:15px;top:15px;font-size:30px}.reward{display:inline-block;margin-top:10px;padding:6px 10px;border-radius:99px;background:#fff2b5;color:#7d5700;font-weight:900}.stats{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.pill{padding:8px 12px;border-radius:99px;background:#edf8f2;font-weight:900}.timer{background:#fff0bd;color:#9a5900}.clue{padding:22px;margin:18px 0;text-align:center;border-radius:20px;background:#f0faf5;font-size:clamp(20px,4vw,28px);font-weight:900;line-height:1.8}.clues{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.tiny,.choice,.btn{border:0;border-radius:15px;padding:13px;font:inherit;font-weight:900;cursor:pointer}.tiny{background:#eef7f2;color:#086c4a}.tiny:disabled{opacity:.45}.choices{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.choice{border:2px solid #bedfce;color:#086c4a;background:#fff}.choice.correct{color:#fff;background:#129661}.choice.wrong{color:#fff;background:#db4b4b}.choice:disabled:not(.correct):not(.wrong){opacity:.5}.btn{width:100%;margin-top:15px;color:#fff;background:linear-gradient(135deg,#087b52,#10a46c);font-size:18px}.secondary{background:#eef7f2;color:#086c4a}.message{margin-top:15px;padding:14px;border-radius:15px;background:#fff6cf;text-align:center;font-weight:900;line-height:1.7}.result{text-align:center}.trophy{font-size:75px}.certificate{padding:28px;border:5px double #d2ac2a;border-radius:24px;background:linear-gradient(145deg,#fffdf2,#effaf4)}@media(max-width:650px){.stages,.choices{grid-template-columns:1fr}.page{padding:11px}}
  `}</style><div className="shell">
    <div className="top"><Link className="back" href="/national-day">→ أسبوع الوطن</Link><b>أكاديمية لغتي الرقمية 🇸🇦</b></div>
    <section className="hero"><div style={{fontSize:48}}>👨‍👩‍👧‍👦🏆</div><h1>تحدّي كلمة الوطن العائلي</h1><p>أربع مراحل تجمع المعرفة والسرعة وروح الفريق</p><b className="gold">المكافأة الكاملة: {TOTAL_REWARD} نقطة + لقب «أسرة الوطن البطلة»</b></section>
    {screen==="map" && <section className="card"><label><b>اسم الفريق العائلي</b><input className="field" maxLength={35} value={teamName} onChange={e=>setTeamName(e.target.value)} /></label><p>التقدم: {completed.length} من 4 مراحل — {earned} نقطة مكتسبة</p><div className="bar"><i style={{width:`${progress}%`}} /></div><div className="stages">{STAGES.map(s=>{const locked=s.id>1&&!completed.includes(s.id-1);return <button key={s.id} className={`stage ${locked?"locked":""} ${completed.includes(s.id)?"done":""}`} disabled={locked} onClick={()=>start(s.id)}><span className="badge">{completed.includes(s.id)?"✅":locked?"🔒":s.icon}</span><small>المرحلة {s.id}</small><strong>{s.title}</strong><span>{s.subtitle}</span><br/><span className="reward">+{s.reward} نقاط</span></button>})}</div>{!student.studentId&&<div className="message">يمكنكم اللعب للتدريب، ولحفظ المكافآت ادخلوا أولًا بحساب الطالب.</div>}</section>}
    {screen==="play"&&question&&<section className="card"><div className="stats"><span className="pill">{stage.icon} {stage.title}</span><span className="pill">السؤال {index+1}/{stage.questions.length}</span><span className="pill">النقاط {score}/{stage.target}</span><span className="pill timer">⏱ {timeLeft}</span></div><div className="clue"><div style={{fontSize:45}}>{question.emoji}</div>{question.clues.slice(0,clueCount).map((c,i)=><div key={c}>{i+1}. {c}</div>)}</div><div className="clues"><button className="tiny" disabled={clueCount===3||Boolean(selected)} onClick={()=>setClueCount(v=>Math.min(3,v+1))}>💡 تلميح آخر</button><button className="tiny" disabled={!helps.letter||Boolean(selected)} onClick={()=>{setNotice(`الحرف الأول: ${question.answer[0]}`);setHelps(h=>({...h,letter:false}))}}>🔤 أول حرف</button><button className="tiny" disabled={!helps.remove||Boolean(selected)} onClick={useRemove}>✂️ احذف خيارين</button><button className="tiny" disabled={!helps.time||Boolean(selected)} onClick={()=>{setTimeLeft(v=>v+10);setHelps(h=>({...h,time:false}))}}>⏱ +10 ثوانٍ</button></div>{notice&&<div className="message">{notice}</div>}<div className="choices" style={{marginTop:15}}>{question.choices.map(c=><button key={c} hidden={hidden.includes(c)} disabled={Boolean(selected)} onClick={()=>choose(c)} className={`choice ${selected&&c===question.answer?"correct":selected===c?"wrong":""}`}>{c}</button>)}</div>{selected&&<><div className="message">{selected===question.answer?`أحسنتم! +${answerPoints} نقاط 🎯`:`الإجابة الصحيحة: ${question.answer}`}<br/><small>💡 {question.fact}</small></div><button className="btn" disabled={saving} onClick={next}>{index===stage.questions.length-1?(saving?"جارٍ حفظ الإنجاز…":"عرض نتيجة المرحلة 🏁"):"السؤال التالي ←"}</button></>}</section>}
    {screen==="result"&&<section className="card result"><div className="trophy">{passed?"🌟":"💪"}</div><h2>{passed?`اجتزتم «${stage.title}»!`:"اقتربتم من خط العبور"}</h2><h3>{score} من {stage.target} نقطة مطلوبة</h3>{notice&&<div className="message">{notice}</div>}{passed&&stage.id<4?<button className="btn" onClick={()=>{setScreen("map");setNotice("")}}>فتح المرحلة التالية ←</button>:<button className="btn" onClick={()=>start(stage.id)}>إعادة المحاولة 🔄</button>}<button className="btn secondary" onClick={()=>setScreen("map")}>خريطة المراحل</button></section>}
    {screen==="complete"&&<section className="card result"><div className="certificate"><div className="trophy">🏆🇸🇦</div><h2>أسرة الوطن البطلة</h2><h1>{teamName}</h1><p>أتمّت مراحل تحدّي كلمة الوطن العائلي بروح الفريق والمعرفة.</p><b>المكافأة: {TOTAL_REWARD} نقطة أكاديمية</b></div>{notice&&<div className="message">{notice}</div>}<button className="btn" onClick={share}>مشاركة بطاقة الإنجاز 📤</button><button className="btn secondary" onClick={()=>setScreen("map")}>العودة إلى المراحل</button></section>}
  </div></main>;
}
