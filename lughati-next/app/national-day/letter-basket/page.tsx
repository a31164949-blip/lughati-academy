"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Drop = { id: number; letter: string; x: number; y: number; speed: number };
type GameState = "intro" | "playing" | "won" | "lost" | "finished";

const WORDS = ["وطن", "علم", "نخلة", "رياض", "طويق"];
const LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
const BOARD_HEIGHT = 500;

export default function LetterBasketPage() {
  const [state, setState] = useState<GameState>("intro");
  const [level, setLevel] = useState(0);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [basketX, setBasketX] = useState(50);
  const [collected, setCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [message, setMessage] = useState("اجمع الحروف الصحيحة بالترتيب");
  const nextId = useRef(1);
  const boardRef = useRef<HTMLDivElement>(null);
  const lastSpawn = useRef(0);
  const word = WORDS[level] || WORDS[0];
  const expected = word[collected] || "";

  const startLevel = useCallback((levelIndex: number) => {
    setLevel(levelIndex); setDrops([]); setBasketX(50); setCollected(0); setLives(3);
    setMessage("استعد... الحروف بدأت تمطر! ☔"); setState("playing"); lastSpawn.current = 0;
  }, []);

  function moveBasket(clientX: number) {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    setBasketX(Math.max(7, Math.min(93, ((clientX - rect.left) / rect.width) * 100)));
  }

  useEffect(() => {
    if (state !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setBasketX((x) => Math.min(93, x + 7));
      if (event.key === "ArrowLeft") setBasketX((x) => Math.max(7, x - 7));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  useEffect(() => {
    if (state !== "playing") return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now - lastSpawn.current > Math.max(520, 900 - level * 70)) {
        lastSpawn.current = now;
        const correctChance = Math.random() < 0.42;
        const letter = correctChance && expected ? expected : LETTERS[Math.floor(Math.random() * LETTERS.length)];
        setDrops((items) => [...items, { id: nextId.current++, letter, x: 8 + Math.random() * 84, y: -45, speed: 5 + level * 0.55 + Math.random() * 2 }]);
      }

      setDrops((items) => {
        const remaining: Drop[] = [];
        let caughtCorrect = false;
        let caughtWrong = false;
        for (const drop of items) {
          const moved = { ...drop, y: drop.y + drop.speed };
          const caught = moved.y >= BOARD_HEIGHT - 78 && moved.y <= BOARD_HEIGHT - 28 && Math.abs(moved.x - basketX) < 10;
          if (caught) {
            if (drop.letter === expected && !caughtCorrect) caughtCorrect = true;
            else caughtWrong = true;
          } else if (moved.y < BOARD_HEIGHT + 20) remaining.push(moved);
        }
        if (caughtCorrect) {
          setCollected((value) => value + 1);
          setScore((value) => value + 10 + Math.max(0, level * 2));
          setMessage("أمسكت الحرف! السلة تقول: هات الذي بعده 😄");
        }
        if (caughtWrong) {
          setLives((value) => Math.max(0, value - 1));
          setMessage("هذا الحرف دخل السلة بلا دعوة! 😅");
        }
        return remaining;
      });
    }, 50);
    return () => window.clearInterval(timer);
  }, [state, expected, basketX, level]);

  useEffect(() => {
    if (state !== "playing") return;
    if (collected >= word.length) { setDrops([]); setMessage(`رائع! كوّنت كلمة «${word}» 🇸🇦`); setState("won"); }
  }, [collected, word, state]);

  useEffect(() => {
    if (state === "playing" && lives <= 0) { setDrops([]); setMessage("السلة امتلأت بالحروف المشاغبة 😄"); setState("lost"); }
  }, [lives, state]);

  function continueGame() {
    if (level >= WORDS.length - 1) setState("finished");
    else startLevel(level + 1);
  }

  return <main dir="rtl" className="basket-page">
    <style>{`
      *{box-sizing:border-box}.basket-page{min-height:100vh;padding:16px;font-family:Tahoma,Arial,sans-serif;color:#123d31;background:radial-gradient(circle at 12% 8%,#fff0a1,transparent 20%),linear-gradient(160deg,#eafff4,#fff)}.shell{max-width:900px;margin:auto}.top{display:flex;justify-content:space-between;gap:10px;margin-bottom:12px}.back{color:#087b52;text-decoration:none;font-weight:900}.hero{text-align:center;padding:18px;border-radius:25px;color:white;background:linear-gradient(135deg,#075b40,#10a36b);box-shadow:0 14px 35px #075f4630}.panel{margin-top:15px;padding:20px;border-radius:25px;background:white;border:2px solid #d0eadc;box-shadow:0 12px 30px #075f4618}.btn{width:100%;border:0;border-radius:17px;padding:15px;margin-top:12px;color:white;background:linear-gradient(135deg,#078153,#13a970);font:inherit;font-size:18px;font-weight:900;cursor:pointer}.board{position:relative;height:${BOARD_HEIGHT}px;overflow:hidden;margin-top:14px;border-radius:24px;touch-action:none;user-select:none;background:linear-gradient(#bdeeff 0%,#eafff4 70%,#bfe4b4 70%,#83c97c 100%);border:3px solid #fff;box-shadow:inset 0 0 0 2px #9bd9bd}.board:before{content:"☁️        ☁️             ☁️";position:absolute;top:18px;left:0;width:100%;font-size:32px;word-spacing:70px;opacity:.75}.drop{position:absolute;display:grid;place-items:center;width:52px;height:52px;transform:translateX(-50%);border-radius:50%;color:#075f46;background:#fff8cf;border:3px solid #efc537;box-shadow:0 5px 12px #0002;font-size:26px;font-weight:900}.basket{position:absolute;bottom:13px;width:115px;height:58px;transform:translateX(-50%);display:grid;place-items:center;border-radius:12px 12px 28px 28px;color:white;background:linear-gradient(#a66a27,#774315);border:4px solid #e5b15d;font-size:35px;transition:left .06s linear}.stats{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.pill{padding:8px 12px;border-radius:999px;background:#eaf7f0;font-weight:900}.word{text-align:center;font-size:30px;letter-spacing:10px;font-weight:900;margin:13px 0}.slot{color:#0b8559}.next{color:#c18900;border-bottom:4px solid #e9bd2c}.message{text-align:center;padding:11px;border-radius:15px;background:#fff4c5;font-weight:900}.controls{display:flex;gap:10px}.control{flex:1;border:0;padding:13px;border-radius:15px;background:#e6f5ed;color:#075f46;font-size:25px;font-weight:900;touch-action:manipulation}.finish{text-align:center;padding:30px}.finish strong{display:block;font-size:38px;color:#078153}@media(max-width:600px){.basket-page{padding:9px}.board{height:${BOARD_HEIGHT}px}.panel{padding:11px}}
    `}</style>
    <div className="shell">
      <div className="top"><Link className="back" href="/national-day/guess-the-word">→ الجولة الأولى</Link><span>🇸🇦 أكاديمية لغتي</span></div>
      <section className="hero"><div style={{fontSize:43}}>🧺🔤</div><h1 style={{margin:3}}>سلة الحروف الوطنية</h1><p style={{margin:0,color:"#dcfce7"}}>التقط الحروف الصحيحة بالترتيب... واترك الحروف المشاغبة تواصل سقوطها!</p></section>

      {state === "intro" && <section className="panel finish"><div style={{fontSize:70}}>🧺</div><h2>الجولة الثانية</h2><p>حرّك السلة باللمس أو الفأرة أو أزرار الأسهم، واجمع حروف خمس كلمات وطنية.</p><div className="message">لديك 3 أرواح في كل كلمة • كل حرف صحيح = نقاط ⭐</div><button className="btn" onClick={()=>{setScore(0);startLevel(0)}}>ابدأ سقوط الحروف 🚀</button></section>}

      {(state === "playing" || state === "won" || state === "lost") && <section className="panel">
        <div className="stats"><span className="pill">الكلمة {level+1} من {WORDS.length}</span><span className="pill">النقاط: {score}</span><span className="pill">{"❤️".repeat(lives)}{"🤍".repeat(3-lives)}</span></div>
        <div className="word">{word.split("").map((letter,i)=><span key={i} className={i < collected ? "slot" : i === collected ? "next" : ""}>{i < collected ? letter : "_"}</span>)}</div>
        <div className="message">{message}{state === "playing" && expected ? ` — الحرف المطلوب: «${expected}»` : ""}</div>
        <div ref={boardRef} className="board" onPointerMove={(e)=>{if(e.buttons || e.pointerType === "touch") moveBasket(e.clientX)}} onPointerDown={(e)=>moveBasket(e.clientX)}>
          {drops.map((drop)=><div className="drop" key={drop.id} style={{left:`${drop.x}%`,top:drop.y}}>{drop.letter}</div>)}
          <div className="basket" style={{left:`${basketX}%`}}>🧺</div>
        </div>
        {state === "playing" && <div className="controls"><button className="control" onPointerDown={()=>setBasketX(x=>Math.max(7,x-9))}>← حرّك</button><button className="control" onPointerDown={()=>setBasketX(x=>Math.min(93,x+9))}>حرّك →</button></div>}
        {state === "won" && <button className="btn" onClick={continueGame}>{level === WORDS.length-1 ? "عرض النتيجة 🏆" : "الكلمة التالية ←"}</button>}
        {state === "lost" && <button className="btn" onClick={()=>startLevel(level)}>إعادة محاولة الكلمة 🔄</button>}
      </section>}

      {state === "finished" && <section className="panel finish"><div style={{fontSize:75}}>🏆🇸🇦</div><h2>بطل سلة الحروف!</h2><strong>{score} نقطة</strong><p className="message">أنقذت الحروف الوطنية من السقوط... والسلة تطلب ترقية وظيفية 😄</p><button className="btn" onClick={()=>{setScore(0);startLevel(0)}}>العب من جديد 🔄</button><Link className="btn" style={{display:"block",textDecoration:"none"}} href="/national-day">العودة إلى فعاليات الوطن</Link></section>}
    </div>
  </main>;
}
