"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type Choice = { text: string; correct?: boolean };
type Mission = {
  title: string;
  icon: string;
  color: string;
  question: string;
  choices: Choice[];
};

const missions: Mission[] = [
  {
    title: "بوابة القراءة",
    icon: "📖",
    color: "#16a36a",
    question: "اختر الكلمة التي تبدأ بحرف «م»:",
    choices: [{ text: "مدرسة", correct: true }, { text: "كتاب" }, { text: "قلم" }],
  },
  {
    title: "جسر الإملاء",
    icon: "✍️",
    color: "#d09b18",
    question: "أي الكلمات كُتبت كتابة صحيحة؟",
    choices: [{ text: "هاذا" }, { text: "هذا", correct: true }, { text: "هذة" }],
  },
  {
    title: "برج المعنى",
    icon: "🏰",
    color: "#2563eb",
    question: "ما عكس كلمة «كبير»؟",
    choices: [{ text: "طويل" }, { text: "جميل" }, { text: "صغير", correct: true }],
  },
];

export default function LughatiCityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [member, setMember] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("تحرّك نحو البوابة الأولى وابدأ المهمة!");
  const [finished, setFinished] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setChecking(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/student-journey", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (active) setMember(response.ok && data.success && data.academyClubMembership?.active === true);
      } catch {
        if (active) setMember(false);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, [authReady, user]);

  const mission = missions[stage];
  const progress = useMemo(() => finished ? 100 : (stage / missions.length) * 100, [stage, finished]);

  function answer(choice: Choice) {
    if (answerLocked || finished) return;
    if (!choice.correct) {
      setMessage("حاول مرة أخرى يا بطل؛ فكّر بهدوء 🌟");
      return;
    }
    setAnswerLocked(true);
    setStars((value) => value + 10);
    setMessage("إجابة صحيحة! فُتحت البوابة التالية 🎉");
    window.setTimeout(() => {
      if (stage === missions.length - 1) {
        setFinished(true);
        setMessage("أكملت الجولة الأولى وحصلت على وسام مستكشف مدينة لغتي!");
      } else {
        setStage((value) => value + 1);
        setMessage("وصلت إلى مهمة جديدة؛ اختر الإجابة الصحيحة.");
      }
      setAnswerLocked(false);
    }, 700);
  }

  function restart() {
    setStage(0);
    setStars(0);
    setFinished(false);
    setAnswerLocked(false);
    setMessage("تحرّك نحو البوابة الأولى وابدأ المهمة!");
  }

  if (checking) return <main dir="rtl" className="gate"><div className="gateCard">⏳ جارٍ فتح مدينة لغتي…</div><style>{styles}</style></main>;

  if (!user) return <main dir="rtl" className="gate"><section className="gateCard"><div className="big">🎮</div><h1>مدينة لغتي</h1><p>سجّل دخولك أولًا للانطلاق.</p><Link className="primary" href="/login">تسجيل الدخول</Link></section><style>{styles}</style></main>;

  if (!member) return <main dir="rtl" className="gate"><section className="gateCard"><div className="big">🔐</div><h1>بوابة خاصة بأعضاء النادي</h1><p>هذه المغامرة حصرية لأعضاء نادي الأكاديمية ذوي العضوية النشطة.</p><Link className="primary" href="/journey">العودة إلى رحلتي</Link></section><style>{styles}</style></main>;

  return (
    <main dir="rtl" className="page">
      <style>{styles}</style>
      <header className="topbar">
        <Link href="/academy-club" className="back">→ نادي الأكاديمية</Link>
        <div>
          <strong>مدينة لغتي</strong>
          <small>مغامرة أعضاء النادي</small>
        </div>
        <div className="score">⭐ {stars}</div>
      </header>

      <section className="hero">
        <div>
          <span className="exclusive">🏅 حصرية لأعضاء النادي</span>
          <h1>مدينة لغتي — الجولة الأولى</h1>
          <p>اعبر بوابات القراءة والإملاء والمعنى، واجمع النجوم حتى تصل إلى قلعة التميّز.</p>
        </div>
        <div className="avatar" aria-label="شخصية فارس"><span>🎒</span><b>فارس</b></div>
      </section>

      <div className="progress"><span style={{ width: `${progress}%` }} /></div>

      <section className="world" aria-label="خريطة مدينة لغتي">
        <div className="sky">☀️ <i>☁️</i><i>☁️</i></div>
        <div className="road" />
        {missions.map((item, index) => (
          <div key={item.title} className={`building b${index + 1} ${index < stage || finished ? "done" : ""} ${index === stage && !finished ? "active" : ""}`}>
            <span>{index < stage || finished ? "✅" : item.icon}</span>
            <b>{item.title}</b>
          </div>
        ))}
        <div className={`player p${finished ? 4 : stage + 1}`}><span>🧒🏻</span><small>فارس</small></div>
        <div className="castle">🏆<b>قلعة التميّز</b></div>
      </section>

      <section className="missionCard">
        {!finished ? (
          <>
            <div className="missionHead" style={{ borderColor: mission.color }}>
              <span>{mission.icon}</span>
              <div><small>المهمة {stage + 1} من {missions.length}</small><h2>{mission.title}</h2></div>
            </div>
            <p className="question">{mission.question}</p>
            <div className="answers">
              {mission.choices.map((choice) => (
                <button key={choice.text} onClick={() => answer(choice)} disabled={answerLocked}>{choice.text}</button>
              ))}
            </div>
          </>
        ) : (
          <div className="victory">
            <div className="medal">🏅</div>
            <h2>أحسنت يا مستكشف مدينة لغتي!</h2>
            <p>أنهيت الجولة الأولى وجمعت {stars} نجمة تدريبية.</p>
            <span>وسام: مستكشف مدينة لغتي</span>
            <button onClick={restart}>إعادة الجولة</button>
          </div>
        )}
        <div className="message">{message}</div>
      </section>

      <p className="note">نسخة تجريبية أولى — النجوم تدريبية، وسيتم ربط الجوائز برصيد الأكاديمية بعد اعتماد نظام المراحل.</p>
    </main>
  );
}

const styles = `
*{box-sizing:border-box}.page,.gate{min-height:100vh;font-family:Arial,sans-serif;color:#163c2e;background:linear-gradient(180deg,#dff7ff 0,#f3fff8 52%,#fff9e8 100%);padding:18px}.topbar{max-width:1080px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border:1px solid #bfe4d2;border-radius:20px;background:#ffffffdd;box-shadow:0 10px 28px #175f3c18}.topbar>div:nth-child(2){display:flex;flex-direction:column;text-align:center}.topbar strong{font-size:22px;color:#0f6845}.topbar small{color:#6b7e76;font-weight:700}.back{color:#126744;text-decoration:none;font-weight:900}.score{background:#fff5be;border:1px solid #e9c75a;border-radius:999px;padding:9px 15px;font-weight:900}.hero{max-width:1080px;margin:18px auto;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:25px;border-radius:28px;color:white;background:linear-gradient(135deg,#0b6b45,#15915c 62%,#d0a424);box-shadow:0 18px 40px #145f3b26}.hero h1{font-size:clamp(28px,5vw,48px);margin:12px 0}.hero p{line-height:1.8;font-weight:700;margin:0;max-width:720px}.exclusive{display:inline-block;background:#ffffff24;border:1px solid #ffffff55;border-radius:999px;padding:7px 12px;font-weight:900}.avatar{width:130px;height:130px;flex:0 0 auto;display:grid;place-items:center;border:5px solid #ffe28a;border-radius:28px;background:#fff8df;color:#176c46;box-shadow:inset 0 -12px 0 #edd27a}.avatar span{font-size:56px}.avatar b{margin-top:-22px}.progress{max-width:1080px;height:13px;margin:0 auto 16px;background:#d7eadf;border-radius:999px;overflow:hidden}.progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#e2b82f,#18a568);transition:width .5s}.world{max-width:1080px;height:390px;margin:auto;position:relative;overflow:hidden;border:5px solid #fff;border-radius:32px;background:linear-gradient(#a9e5ff 0 45%,#91d67e 45%);box-shadow:0 16px 35px #19593d28}.sky{position:absolute;inset:18px 24px auto;font-size:42px}.sky i{position:absolute;font-style:normal;font-size:35px}.sky i:first-child{right:24%}.sky i:last-child{left:18%}.road{position:absolute;left:-10%;right:-10%;bottom:-50px;height:220px;background:#dbc799;transform:perspective(500px) rotateX(56deg);border:12px solid #f4e6bf}.building,.castle{position:absolute;width:155px;min-height:120px;padding:16px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:5px solid #fff;border-radius:20px;background:#edf9f2;box-shadow:0 15px 0 #176c46,0 20px 30px #123a2929;transition:.4s}.building span,.castle{font-size:39px}.building b,.castle b{font-size:15px;margin-top:6px}.b1{right:5%;bottom:118px}.b2{right:31%;bottom:75px}.b3{right:57%;bottom:105px}.castle{left:3%;bottom:72px;background:#fff1a8;box-shadow:0 15px 0 #b77d13,0 20px 30px #123a2929}.building.active{outline:7px solid #ffe04e;animation:pulse 1.4s infinite}.building.done{filter:saturate(.7);opacity:.82}.player{position:absolute;bottom:35px;z-index:8;display:flex;flex-direction:column;align-items:center;transition:right .7s,left .7s;filter:drop-shadow(0 8px 4px #0003)}.player span{font-size:58px}.player small{padding:3px 8px;border-radius:99px;background:#173f31;color:#fff;font-weight:900}.p1{right:11%}.p2{right:38%}.p3{right:64%}.p4{right:87%}.missionCard{max-width:1080px;margin:18px auto;padding:24px;border-radius:28px;background:#fff;border:1px solid #cbe5d8;box-shadow:0 14px 34px #174d3b14}.missionHead{display:flex;align-items:center;gap:14px;border-right:7px solid;padding-right:14px}.missionHead>span{font-size:40px}.missionHead small{font-weight:800;color:#6b7e76}.missionHead h2{margin:4px 0 0;color:#135f42}.question{text-align:center;font-size:22px;font-weight:900;margin:25px 0 16px}.answers{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.answers button,.victory button,.primary{padding:15px;border:2px solid #9fd7ba;border-radius:16px;background:#f4fff9;color:#155d41;font-size:18px;font-weight:900;cursor:pointer;text-decoration:none}.answers button:hover{transform:translateY(-2px);background:#e4faee}.message{margin-top:18px;padding:12px;text-align:center;border-radius:14px;background:#fff8d9;color:#845e08;font-weight:900}.victory{text-align:center}.medal{font-size:75px}.victory h2{font-size:30px;color:#146844}.victory span{display:block;margin:15px auto;padding:11px;border-radius:14px;background:#fff3b8;font-weight:900;max-width:400px}.gate{display:grid;place-items:center}.gateCard{width:min(600px,94vw);padding:40px;text-align:center;background:#fff;border:1px solid #cbe5d8;border-radius:28px;box-shadow:0 18px 45px #174d3b1d}.big{font-size:72px}.primary{display:inline-block;background:#146d49;color:#fff}.note{max-width:1080px;margin:0 auto;text-align:center;color:#667a72;font-size:13px;font-weight:700}@keyframes pulse{50%{transform:translateY(-7px)}}@media(max-width:720px){.hero{align-items:flex-start}.avatar{width:88px;height:88px}.avatar span{font-size:38px}.world{height:520px}.building{width:125px;min-height:105px}.b1{right:8%;bottom:340px}.b2{right:48%;bottom:280px}.b3{right:10%;bottom:135px}.castle{left:8%;bottom:75px;width:125px}.p1{right:15%;bottom:300px}.p2{right:57%;bottom:240px}.p3{right:18%;bottom:95px}.p4{right:62%;bottom:35px}.answers{grid-template-columns:1fr}.topbar strong{font-size:17px}.back{font-size:13px}}
`;
