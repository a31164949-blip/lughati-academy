"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type Hero = { id: string; name: string; title: string; face: string; tool: string; color: string };
type Choice = { text: string; correct?: boolean };
type Mission = { title: string; mode: string; icon: string; rival: string; question: string; choices: Choice[] };

const heroes: Hero[] = [
  { id: "faris", name: "فارس", title: "قائد القراءة", face: "🧒🏻", tool: "📗", color: "#15915c" },
  { id: "saqr", name: "صقر", title: "بطل السرعة", face: "👦🏻", tool: "⚡", color: "#2563eb" },
  { id: "maher", name: "ماهر", title: "خبير الإملاء", face: "🧑🏻", tool: "✍️", color: "#d18d12" },
  { id: "barq", name: "برق", title: "صائد الكلمات", face: "🥷🏻", tool: "🔎", color: "#7c3aed" },
];

const missions: Mission[] = [
  { title: "سباق القراءة", mode: "سباق السرعة", icon: "🏁", rival: "الأرنب السريع 🐇", question: "اختر الكلمة التي تبدأ بحرف «م»:", choices: [{ text: "مدرسة", correct: true }, { text: "كتاب" }, { text: "قلم" }] },
  { title: "صيد الكلمات", mode: "تحدي الصياد", icon: "🎯", rival: "الثعلب الماكر 🦊", question: "أي كلمة تحتوي على مد بالألف؟", choices: [{ text: "باب", correct: true }, { text: "كتب" }, { text: "قلم" }] },
  { title: "جسر الإملاء", mode: "معركة الكتابة", icon: "🌉", rival: "حارس الجسر 🛡️", question: "أي الكلمات كُتبت كتابة صحيحة؟", choices: [{ text: "هاذا" }, { text: "هذا", correct: true }, { text: "هذة" }] },
  { title: "حارس القلعة", mode: "التحدي النهائي", icon: "🏰", rival: "تنين الحروف 🐲", question: "ما عكس كلمة «كبير»؟", choices: [{ text: "طويل" }, { text: "جميل" }, { text: "صغير", correct: true }] },
];

export default function LughatiCityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [member, setMember] = useState(false);
  const [checking, setChecking] = useState(true);
  const [teacherPreview, setTeacherPreview] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [heroId, setHeroId] = useState("");
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [message, setMessage] = useState("اختر بطلك ثم ابدأ أول مسابقة!");
  const [finished, setFinished] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false);

  useEffect(() => {
    setTeacherPreview(
      new URLSearchParams(window.location.search).get("teacherPreview") === "1"
    );
    setPreviewReady(true);
    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady || !previewReady) return;
    if (!user) { setChecking(false); return; }
    let active = true;
    (async () => {
      try {
        const token = await user.getIdToken();

        if (teacherPreview) {
          const response = await fetch("/api/teacher/academy-club/challenge", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const data = await response.json();
          if (active) setMember(response.ok && data.success === true);
          return;
        }

        const response = await fetch("/api/student-journey", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (active) {
          setMember(
            response.ok &&
            data.success &&
            data.academyClubMembership?.active === true
          );
        }
      } catch { if (active) setMember(false); }
      finally { if (active) setChecking(false); }
    })();
    return () => { active = false; };
  }, [authReady, previewReady, teacherPreview, user]);

  useEffect(() => {
    if (!started || finished || answerLocked) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setStars((score) => Math.max(0, score - 2));
          setCombo(0);
          setMessage("انتهى الوقت! خُذ نفسًا وابدأ محاولة جديدة ⏱️");
          return 20;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, answerLocked, stage]);

  const hero = heroes.find((item) => item.id === heroId) ?? heroes[0];
  const mission = missions[stage];
  const progress = useMemo(() => finished ? 100 : (stage / missions.length) * 100, [stage, finished]);

  function begin() {
    if (!heroId) { setMessage("اختر أحد أبطال مدينة لغتي أولًا."); return; }
    setStarted(true); setTimeLeft(20); setMessage("بدأ السباق! أجب قبل انتهاء الوقت.");
  }

  function answer(choice: Choice) {
    if (answerLocked || finished) return;
    if (!choice.correct) {
      setStars((value) => Math.max(0, value - 1));
      setCombo(0);
      setMessage("ليست الإجابة الصحيحة؛ لديك فرصة أخرى يا بطل 💪");
      return;
    }
    setAnswerLocked(true);
    const speedBonus = Math.max(1, Math.ceil(timeLeft / 5));
    const comboBonus = Math.min(combo, 3);
    setStars((value) => value + 10 + speedBonus + comboBonus);
    setCombo((value) => value + 1);
    setMessage(`رائع! +10 نقاط و+${speedBonus} مكافأة سرعة ⭐`);
    window.setTimeout(() => {
      if (stage === missions.length - 1) {
        setFinished(true);
        setMessage("هزمت حارس القلعة وفزت بكأس الجولة!");
      } else {
        setStage((value) => value + 1);
        setTimeLeft(20);
        setMessage("منافس جديد ينتظرك؛ استعد للتحدي!");
      }
      setAnswerLocked(false);
    }, 850);
  }

  function restart() {
    setStage(0); setStars(0); setCombo(0); setTimeLeft(20); setFinished(false); setAnswerLocked(false); setStarted(false);
    setMessage("اختر بطلك ثم ابدأ أول مسابقة!");
  }

  if (checking) return <main dir="rtl" className="gate"><div className="gateCard">⏳ جارٍ فتح مدينة لغتي…</div><style>{styles}</style></main>;
  if (!user) return <main dir="rtl" className="gate"><section className="gateCard"><div className="big">🎮</div><h1>مدينة لغتي</h1><p>سجّل دخولك أولًا للانطلاق.</p><Link className="primary" href="/login">تسجيل الدخول</Link></section><style>{styles}</style></main>;
  if (!member) return <main dir="rtl" className="gate"><section className="gateCard"><div className="big">🔐</div><h1>بوابة خاصة بأعضاء النادي</h1><p>هذه المغامرة حصرية لأعضاء نادي الأكاديمية ذوي العضوية النشطة.</p><Link className="primary" href="/journey">العودة إلى رحلتي</Link></section><style>{styles}</style></main>;

  return <main dir="rtl" className="page"><style>{styles}</style>
    <header className="topbar">
      <Link
        href={teacherPreview ? "/academy-club?teacherPreview=1" : "/academy-club"}
        className="back"
      >
        → نادي الأكاديمية
      </Link>
      <div><strong>مدينة لغتي</strong><small>ساحة المسابقات والتحديات</small></div>
      <div className="hud"><span>⭐ {stars}</span><span>🔥 {combo}</span></div>
    </header>

    {!started ? <section className="selectScreen">
      <span className="exclusive">
        {teacherPreview ? "👁️ وضع معاينة المعلم" : "🏅 حصرية لأعضاء النادي"}
      </span>
      <h1>اختر بطلك في مدينة لغتي</h1>
      <p>لكل بطل شخصية وأسلوب مميز، والجميع يملكون الفرصة نفسها للفوز.</p>
      <div className="heroes">
        {heroes.map((item) => <button key={item.id} onClick={() => setHeroId(item.id)} className={heroId === item.id ? "heroCard selected" : "heroCard"} style={{"--hero":item.color} as React.CSSProperties}>
          <div className="portrait"><span>{item.face}</span><i>{item.tool}</i></div>
          <strong>{item.name}</strong><small>{item.title}</small>
          {heroId === item.id && <b>تم الاختيار ✓</b>}
        </button>)}
      </div>
      <div className="modePreview">
        <div>🏁 سباق قراءة</div><div>🎯 صيد كلمات</div><div>🌉 تحدي إملاء</div><div>🐲 مواجهة نهائية</div>
      </div>
      <button className="startBtn" onClick={begin}>ابدأ المنافسة الآن 🚀</button>
      <div className="message">{message}</div>
    </section> : <>
      <section className="heroBanner">
        <div className="miniHero" style={{borderColor:hero.color}}><span>{hero.face}</span><i>{hero.tool}</i></div>
        <div><span className="exclusive">{mission.mode}</span><h1>{mission.title}</h1><p>المنافس: {mission.rival}</p></div>
        <div className={timeLeft <= 5 ? "timer danger" : "timer"}><small>الوقت</small><strong>{timeLeft}</strong><span>ثانية</span></div>
      </section>

      <div className="progress"><span style={{ width: `${progress}%` }} /></div>

      <section className="arena">
        <div className="crowd">🎉 ⭐ 🎉 ⭐ 🎉</div>
        <div className="lane" />
        <div className="contestant player"><div>{hero.face}</div><i>{hero.tool}</i><b>{hero.name}</b></div>
        <div className="versus">VS</div>
        <div className="contestant rival"><div>{stage === 0 ? "🐇" : stage === 1 ? "🦊" : stage === 2 ? "🛡️" : "🐲"}</div><b>{mission.rival.split(" ")[0]}</b></div>
        <div className="flags">🏁</div>
      </section>

      <section className="missionCard">
        {!finished ? <>
          <div className="round"><span>{mission.icon}</span><div><small>التحدي {stage + 1} من {missions.length}</small><h2>{mission.title}</h2></div></div>
          <p className="question">{mission.question}</p>
          <div className="answers">{mission.choices.map((choice, index) => <button key={choice.text} onClick={() => answer(choice)} disabled={answerLocked}><span>{index + 1}</span>{choice.text}</button>)}</div>
        </> : <div className="victory">
          <div className="trophy">🏆</div><h2>فاز {hero.name} بكأس مدينة لغتي!</h2>
          <p>أنهيت أربع مسابقات وجمعت {stars} نجمة تدريبية.</p>
          <span>🏅 وسام بطل تحديات مدينة لغتي</span>
          <button onClick={restart}>اختيار بطل وجولة جديدة</button>
        </div>}
        <div className="message">{message}</div>
      </section>
    </>}
    <p className="note">نسخة تجريبية — النجوم تدريبية، وسيتم ربطها برصيد الأكاديمية بعد اعتماد المراحل.</p>
  </main>;
}

const styles = `
*{box-sizing:border-box}.page,.gate{min-height:100vh;font-family:Arial,sans-serif;color:#173a2d;background:radial-gradient(circle at top,#dff7ff,#f4fff8 48%,#fff8dc);padding:18px}.topbar{max-width:1080px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border:1px solid #bfe4d2;border-radius:20px;background:#ffffffed;box-shadow:0 10px 28px #175f3c18}.topbar>div:nth-child(2){display:flex;flex-direction:column;text-align:center}.topbar strong{font-size:22px;color:#0f6845}.topbar small{color:#6b7e76;font-weight:700}.back{color:#126744;text-decoration:none;font-weight:900}.hud{display:flex;gap:7px}.hud span{background:#fff2aa;border:1px solid #e5be39;border-radius:999px;padding:8px 11px;font-weight:900}.selectScreen{max-width:1080px;margin:18px auto;padding:28px;text-align:center;border-radius:32px;background:linear-gradient(145deg,#075d3d,#168e5c 65%,#d4a82d);color:#fff;box-shadow:0 22px 48px #155f3b30}.selectScreen h1{font-size:clamp(29px,5vw,48px);margin:15px 0 8px}.selectScreen>p{font-weight:700}.exclusive{display:inline-block;padding:7px 13px;border-radius:999px;background:#ffffff25;border:1px solid #ffffff55;font-weight:900}.heroes{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}.heroCard{position:relative;padding:17px 10px;border:3px solid transparent;border-radius:24px;background:#fff;color:#174d3b;cursor:pointer;box-shadow:0 12px 0 #0a5137;transition:.2s}.heroCard:hover{transform:translateY(-5px)}.heroCard.selected{border-color:#ffe56f;box-shadow:0 0 0 5px #ffe56f55,0 12px 0 #9a7112}.portrait{width:112px;height:112px;margin:auto;position:relative;display:grid;place-items:center;border:7px solid var(--hero);border-radius:34px;background:linear-gradient(145deg,#eafff4,#fff3c6);box-shadow:inset 0 -12px #0000000d}.portrait span{font-size:65px}.portrait i{position:absolute;left:-8px;bottom:-5px;width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:var(--hero);font-style:normal;font-size:22px}.heroCard>strong,.heroCard>small{display:block}.heroCard>strong{font-size:23px;margin-top:12px;color:var(--hero)}.heroCard>small{margin-top:4px;font-weight:800}.heroCard>b{display:inline-block;margin-top:10px;color:#9b6c00}.modePreview{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:20px 0}.modePreview div{padding:11px;border:1px solid #ffffff50;border-radius:13px;background:#ffffff18;font-weight:900}.startBtn,.primary{padding:15px 28px;border:0;border-radius:18px;background:#ffe269;color:#14543c;font-size:20px;font-weight:900;cursor:pointer;box-shadow:0 8px 0 #bd8e15}.heroBanner{max-width:1080px;margin:18px auto;display:flex;align-items:center;gap:18px;padding:22px;border-radius:28px;background:linear-gradient(135deg,#0b6845,#14915c 65%,#d0a424);color:#fff;box-shadow:0 18px 40px #145f3b26}.heroBanner h1{margin:9px 0 4px;font-size:clamp(27px,5vw,43px)}.heroBanner p{margin:0;font-weight:900}.miniHero{width:105px;height:105px;position:relative;display:grid;place-items:center;border:6px solid;border-radius:30px;background:#fff5d2}.miniHero span{font-size:60px}.miniHero i{position:absolute;bottom:-7px;left:-7px;font-style:normal;font-size:26px}.timer{margin-right:auto;width:100px;height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:5px solid #fff;border-radius:50%;background:#174d3b}.timer strong{font-size:34px}.timer small,.timer span{font-size:11px;font-weight:900}.timer.danger{background:#c92535;animation:pulse .7s infinite}.progress{max-width:1080px;height:14px;margin:0 auto 16px;background:#d7eadf;border-radius:999px;overflow:hidden}.progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#e2b82f,#18a568);transition:width .5s}.arena{max-width:1080px;height:300px;margin:auto;position:relative;overflow:hidden;border:6px solid #fff;border-radius:32px;background:linear-gradient(#9dddff 0 47%,#74bd62 47%);box-shadow:0 16px 35px #19593d28}.crowd{position:absolute;inset:20px 0 auto;text-align:center;font-size:38px;letter-spacing:20px}.lane{position:absolute;left:-5%;right:-5%;bottom:-35px;height:185px;background:repeating-linear-gradient(90deg,#d9bf82 0 90px,#e8d29b 90px 180px);border-top:12px solid #fff;transform:perspective(500px) rotateX(50deg)}.contestant{position:absolute;bottom:55px;display:flex;flex-direction:column;align-items:center;z-index:3;filter:drop-shadow(0 9px 4px #0003)}.contestant div{font-size:82px}.contestant i{position:absolute;right:-5px;top:35px;font-style:normal;font-size:31px}.contestant b{padding:4px 11px;border-radius:999px;background:#173f31;color:#fff}.player{right:20%}.rival{left:20%}.versus{position:absolute;left:50%;bottom:105px;transform:translateX(-50%) rotate(-7deg);z-index:5;padding:13px;border-radius:50%;background:#e52b3c;color:#fff;font-size:28px;font-weight:900;border:5px solid #fff}.flags{position:absolute;left:48%;bottom:20px;font-size:50px}.missionCard{max-width:1080px;margin:18px auto;padding:24px;border-radius:28px;background:#fff;border:1px solid #cbe5d8;box-shadow:0 14px 34px #174d3b14}.round{display:flex;align-items:center;gap:13px;border-right:7px solid #e2b82f;padding-right:14px}.round>span{font-size:42px}.round small{font-weight:800;color:#6b7e76}.round h2{margin:4px 0 0;color:#135f42}.question{text-align:center;font-size:23px;font-weight:900;margin:24px 0 16px}.answers{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.answers button,.victory button{padding:15px;border:2px solid #9fd7ba;border-radius:16px;background:#f4fff9;color:#155d41;font-size:18px;font-weight:900;cursor:pointer}.answers button span{display:inline-grid;place-items:center;width:28px;height:28px;margin-left:8px;border-radius:8px;background:#daf5e7}.answers button:hover{transform:translateY(-2px);background:#e4faee}.message{margin-top:18px;padding:12px;text-align:center;border-radius:14px;background:#fff4bd;color:#795500;font-weight:900}.victory{text-align:center}.trophy{font-size:85px}.victory h2{font-size:30px;color:#146844}.victory>span{display:block;max-width:420px;margin:15px auto;padding:11px;border-radius:14px;background:#fff0a7;font-weight:900}.gate{display:grid;place-items:center}.gateCard{width:min(600px,94vw);padding:40px;text-align:center;background:#fff;border:1px solid #cbe5d8;border-radius:28px;box-shadow:0 18px 45px #174d3b1d}.big{font-size:72px}.primary{display:inline-block;text-decoration:none}.note{max-width:1080px;margin:0 auto;text-align:center;color:#667a72;font-size:13px;font-weight:700}@keyframes pulse{50%{transform:scale(1.07)}}@media(max-width:760px){.heroes{grid-template-columns:repeat(2,1fr)}.modePreview{grid-template-columns:repeat(2,1fr)}.portrait{width:88px;height:88px}.portrait span{font-size:50px}.heroBanner{padding:15px}.miniHero{width:80px;height:80px}.miniHero span{font-size:46px}.timer{width:78px;height:78px}.arena{height:260px}.contestant div{font-size:62px}.player{right:10%}.rival{left:10%}.answers{grid-template-columns:1fr}.topbar strong{font-size:17px}.back{font-size:12px}.hud{flex-direction:column}.crowd{font-size:27px}}
`;
