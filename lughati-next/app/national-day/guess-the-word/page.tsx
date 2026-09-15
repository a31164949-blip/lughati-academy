"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Mode = "solo" | "teams";
type Question = { clue: string; emoji: string; choices: string[]; answer: string; fact: string };

const QUESTIONS: Question[] = [
  { clue: "أرفرف عاليًا بلون أخضر، ولا أحب يوم الغسيل أبدًا! من أنا؟", emoji: "🇸🇦", choices: ["العَلَم", "المظلة", "السبورة"], answer: "العَلَم", fact: "العَلَم السعودي رمز العزة، ولا يُنكّس أبدًا." },
  { clue: "مدينة فيها الكعبة المشرفة، وحتى البوصلة تعرف طريقها جيدًا.", emoji: "🕋", choices: ["مكة المكرمة", "أبها", "الدمام"], answer: "مكة المكرمة", fact: "مكة المكرمة قبلة المسلمين ومهوى أفئدتهم." },
  { clue: "عاصمة وطننا، سريعة النمو... ويبدو أن المباني تتسابق فيها!", emoji: "🏙️", choices: ["الرياض", "جازان", "تبوك"], answer: "الرياض", fact: "الرياض هي عاصمة المملكة العربية السعودية." },
  { clue: "شجرتي تتحمل الحر، وثماري لذيذة لدرجة أن الحبة تنادي أختها.", emoji: "🌴", choices: ["النخلة", "الصبّار", "شجرة التفاح"], answer: "النخلة", fact: "النخلة رمز أصيل من رموز المملكة وتراثها." },
  { clue: "ألبسه في المناسبات الوطنية، ولوني يجعلني أبدو كأنني قطعة من الراية.", emoji: "🟢", choices: ["الوشاح الأخضر", "معطف الشتاء", "قبعة الطاهي"], answer: "الوشاح الأخضر", fact: "الأخضر هو اللون البارز في راية وطننا." },
  { clue: "جبل في عسير، ضبابه جميل... لكنه أحيانًا يخفي المنظر وكأنه يلعب الغميضة.", emoji: "⛰️", choices: ["السودة", "أُحد", "طويق"], answer: "السودة", fact: "السودة من أشهر الوجهات الجبلية في منطقة عسير." },
  { clue: "بحر يطل على غرب المملكة، اسمه لون لكنه ليس علبة ألوان.", emoji: "🌊", choices: ["البحر الأحمر", "البحر الأبيض", "بحر العرب"], answer: "البحر الأحمر", fact: "يمتد ساحل البحر الأحمر بمحاذاة غرب المملكة." },
  { clue: "سيفان ونخلة يجتمعون في رمز واحد، والسيفان لا يتشاجران أبدًا.", emoji: "⚔️", choices: ["شعار المملكة", "إشارة المرور", "خريطة المدرسة"], answer: "شعار المملكة", fact: "يتكوّن شعار المملكة من سيفين عربيين تعلوهما نخلة." },
  { clue: "سلسلة جبال شامخة قرب الرياض؛ والعزيمة تُشبَّه بها.", emoji: "🏔️", choices: ["طويق", "الحجاز", "السروات"], answer: "طويق", fact: "جبل طويق من أبرز المعالم الجغرافية في نجد." },
  { clue: "أرض واسعة ذهبية، والرمل فيها ينتقل بلا حافلة مدرسية.", emoji: "🏜️", choices: ["الصحراء", "المزرعة", "الجزيرة"], answer: "الصحراء", fact: "تضم المملكة صحارى واسعة، ومنها الربع الخالي." },
];

const HAPPY = ["يا سلام! إجابة ترفع الراية 🇸🇦", "أحسنت! حتى السؤال صفق لك 👏", "إصابة وطنية مباشرة 🎯"];
const FUNNY = ["قريبة... لكن الإجابة الصحيحة هربت منك قليلًا 😄", "السؤال يقول: حاول مرة أخرى في الجولة القادمة!", "لا بأس، حتى الأبطال يحتاجون إعادة تشغيل بسيطة 😅"];

function shuffledQuestions() {
  const shuffle = <T,>(items: T[]) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  };

  return shuffle(QUESTIONS)
    .slice(0, 6)
    .map((question) => ({
      ...question,
      choices: shuffle(question.choices),
    }));
}

export default function GuessTheWordPage() {
  const [screen, setScreen] = useState<"start" | "play" | "finish">("start");
  const [mode, setMode] = useState<Mode>("solo");
  const [teamOne, setTeamOne] = useState("فريق الصقور");
  const [teamTwo, setTeamTwo] = useState("فريق النخلة");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");

  const activeTeam = mode === "teams" ? index % 2 : 0;
  const current = questions[index];
  const names = mode === "teams" ? [teamOne || "الفريق الأول", teamTwo || "الفريق الثاني"] : ["البطل", ""];

  function begin() {
    setQuestions(shuffledQuestions());
    setIndex(0); setScores([0, 0]); setTimeLeft(15); setSelected(""); setMessage(""); setScreen("play");
  }

  function answer(choice: string) {
    if (selected || !current) return;
    setSelected(choice);
    const correct = choice === current.answer;
    if (correct) {
      const bonus = Math.max(0, Math.ceil(timeLeft / 5));
      setScores((old) => old.map((score, i) => i === activeTeam ? score + 10 + bonus : score));
      setMessage(HAPPY[Math.floor(Math.random() * HAPPY.length)]);
    } else {
      setMessage(`${FUNNY[Math.floor(Math.random() * FUNNY.length)]} الصحيح: ${current.answer}`);
    }
  }

  function next() {
    if (index >= questions.length - 1) { setScreen("finish"); return; }
    setIndex((value) => value + 1); setTimeLeft(15); setSelected(""); setMessage("");
  }

  useEffect(() => {
    if (screen !== "play" || selected) return;
    if (timeLeft <= 0) {
      setSelected("__timeout__");
      setMessage(`انتهى الوقت! يبدو أن الساعة كانت مستعجلة 😄 الصحيح: ${current?.answer || ""}`);
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [screen, selected, timeLeft, current]);

  const winner = useMemo(() => {
    if (mode === "solo") return `حققت ${scores[0]} نقطة`;
    if (scores[0] === scores[1]) return "تعادل بطولي... حتى الحكم طلب جولة إضافية!";
    return `الفائز: ${scores[0] > scores[1] ? names[0] : names[1]} 🏆`;
  }, [mode, scores, names]);

  return (
    <main dir="rtl" className="game-page">
      <style>{`
        *{box-sizing:border-box}.game-page{min-height:100vh;padding:18px;color:#123d31;font-family:Tahoma,Arial,sans-serif;background:radial-gradient(circle at 15% 10%,#fff1a8 0,transparent 22%),linear-gradient(160deg,#e9fff4,#fff)}
        .shell{max-width:850px;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:15px}.back{color:#087b52;text-decoration:none;font-weight:900}.hero{padding:24px;border-radius:28px;text-align:center;color:white;background:linear-gradient(135deg,#064e3b,#0b9463);box-shadow:0 16px 40px #075f4630}.card{margin-top:18px;padding:clamp(18px,4vw,32px);border:2px solid #d7eee3;border-radius:28px;background:#fff;box-shadow:0 14px 35px #075f4618}.modes,.choices{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.mode,.choice,.main-btn{border:0;border-radius:18px;padding:15px;font:inherit;font-weight:900;cursor:pointer}.mode{color:#075f46;background:#edf8f2;border:2px solid transparent}.mode.on{border-color:#e6b91e;background:#fff8d2}.field{width:100%;margin-top:8px;padding:13px;border:1px solid #c6ddd2;border-radius:14px;font:inherit}.main-btn{width:100%;margin-top:18px;color:white;background:linear-gradient(135deg,#078153,#11a56e);font-size:19px}.stats{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.pill{padding:8px 13px;border-radius:999px;background:#eff8f3;font-weight:900}.timer{color:#b45309;background:#fff4c5}.clue{text-align:center;padding:22px;margin:18px 0;border-radius:22px;background:#f3fbf7;font-size:clamp(20px,4vw,29px);line-height:1.8;font-weight:900}.choice{min-height:62px;color:#075f46;background:white;border:2px solid #bddfce;font-size:17px}.choice:hover{transform:translateY(-2px);border-color:#0a8b5c}.choice.correct{color:#fff;background:#16a36c}.choice.wrong{color:#fff;background:#e34b4b}.message{text-align:center;margin-top:16px;padding:13px;border-radius:16px;background:#fff5c8;font-weight:900;line-height:1.7}.fact{font-size:14px;color:#4b6b60}.scoreboard{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:15px}.score{padding:16px;text-align:center;border-radius:18px;background:#edf8f2}.score.active{outline:3px solid #f0c12c}.score strong{display:block;font-size:25px;color:#087b52}@media(max-width:600px){.choices,.modes{grid-template-columns:1fr}.game-page{padding:12px}.scoreboard{gap:7px}}
      `}</style>
      <div className="shell">
        <div className="top"><Link className="back" href="/national-day">→ فعاليات أسبوع الوطن</Link><span>🇸🇦 أكاديمية لغتي</span></div>
        <section className="hero"><div style={{fontSize:50}}>🎮🇸🇦</div><h1 style={{margin:"4px 0",fontSize:"clamp(29px,6vw,46px)"}}>خَمِّن كلمة الوطن</h1><p style={{margin:0,color:"#dcfce7"}}>فكّر بسرعة... فالكلمات الوطنية لا تحب الانتظار!</p></section>

        {screen === "start" && <section className="card">
          <h2 style={{textAlign:"center"}}>اختر طريقة اللعب</h2>
          <div className="modes">
            <button className={`mode ${mode === "solo" ? "on" : ""}`} onClick={() => setMode("solo")}>🧑 لعب فردي<br/><small>أنا بطل المهمة</small></button>
            <button className={`mode ${mode === "teams" ? "on" : ""}`} onClick={() => setMode("teams")}>👥 تحدي جماعي<br/><small>فريقان وجهاز واحد</small></button>
          </div>
          {mode === "teams" && <div className="modes" style={{marginTop:14}}><input className="field" value={teamOne} onChange={(e)=>setTeamOne(e.target.value)} aria-label="اسم الفريق الأول"/><input className="field" value={teamTwo} onChange={(e)=>setTeamTwo(e.target.value)} aria-label="اسم الفريق الثاني"/></div>}
          <div className="message">ستة ألغاز • 15 ثانية لكل لغز • نقاط إضافية للسرعة ⚡</div>
          <button className="main-btn" onClick={begin}>ابدأ التحدي 🚀</button>
        </section>}

        {screen === "play" && current && <section className="card">
          <div className="stats"><span className="pill">السؤال {index + 1} من {questions.length}</span><span className="pill timer">⏱️ {timeLeft} ثانية</span></div>
          <div className="scoreboard">{names.slice(0,mode === "teams" ? 2 : 1).map((name,i)=><div className={`score ${i === activeTeam ? "active" : ""}`} key={name}><span>{name}</span><strong>{scores[i]}</strong></div>)}</div>
          {mode === "teams" && <p style={{textAlign:"center",fontWeight:900}}>الدور الآن: {names[activeTeam]}</p>}
          <div className="clue"><div style={{fontSize:45}}>{current.emoji}</div>{current.clue}</div>
          <div className="choices">{current.choices.map((choice)=><button key={choice} disabled={Boolean(selected)} onClick={()=>answer(choice)} className={`choice ${selected && choice === current.answer ? "correct" : selected === choice ? "wrong" : ""}`}>{choice}</button>)}</div>
          {selected && <><div className="message">{message}<div className="fact">💡 {current.fact}</div></div><button className="main-btn" onClick={next}>{index === questions.length - 1 ? "عرض النتيجة 🏆" : "السؤال التالي ←"}</button></>}
        </section>}

        {screen === "finish" && <section className="card" style={{textAlign:"center"}}><div style={{fontSize:70}}>🏆</div><h2>انتهى التحدي الوطني!</h2><h3 style={{color:"#087b52",fontSize:27}}>{winner}</h3><div className="scoreboard">{names.slice(0,mode === "teams" ? 2 : 1).map((name,i)=><div className="score" key={name}><span>{name}</span><strong>{scores[i]} نقطة</strong></div>)}</div><p className="message">أداء رائع... الوطن فخور بكم، والأسئلة تطلب إجازة قصيرة 😄</p><Link className="main-btn" style={{display:"block",textDecoration:"none"}} href="/national-day/letter-basket">الجولة الثانية: سلة الحروف 🧺</Link><button className="main-btn" onClick={begin}>إعادة اللعب 🔄</button><button className="mode" style={{width:"100%",marginTop:10}} onClick={()=>setScreen("start")}>تغيير طريقة اللعب</button></section>}
      </div>
    </main>
  );
}
