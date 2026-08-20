"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WordItem = {
  word: string;
  found: boolean;
};

const targetWords = ["كتاب", "قلم", "مدرسة", "معلم", "باب", "نور"];

const grid = [
  ["ك", "ت", "ا", "ب", "س", "ن", "و", "ر"],
  ["م", "د", "ر", "س", "ة", "ق", "ل", "م"],
  ["ع", "ل", "م", "ب", "ا", "ب", "ت", "ي"],
  ["ن", "و", "ر", "ك", "ل", "م", "س", "ة"],
  ["ق", "ل", "م", "م", "ع", "ل", "م", "د"],
  ["ب", "ا", "ب", "س", "ر", "و", "ن", "ك"],
];

export default function LostWordPage() {
  const [words, setWords] = useState<WordItem[]>(
    targetWords.map((word) => ({ word, found: false }))
  );
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const foundCount = words.filter((item) => item.found).length;
  const currentWord = selectedLetters.join("");

  useEffect(() => {
    if (!started || completed) return;

    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, completed]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  }, [seconds]);

  function handleLetter(letter: string) {
    if (completed) return;

    if (!started) {
      setStarted(true);
    }

    const nextLetters = [...selectedLetters, letter];
    const candidate = nextLetters.join("");

    const exactMatch = words.find(
      (item) => !item.found && item.word === candidate
    );

    if (exactMatch) {
      const updatedWords = words.map((item) =>
        item.word === exactMatch.word
          ? {
              ...item,
              found: true,
            }
          : item
      );

      setWords(updatedWords);
      setSelectedLetters([]);

      if (updatedWords.every((item) => item.found)) {
        setCompleted(true);
      }

      return;
    }

    const possible = words.some(
      (item) => !item.found && item.word.startsWith(candidate)
    );

    if (possible) {
      setSelectedLetters(nextLetters);
      return;
    }

    setSelectedLetters([letter]);
  }

  function restartGame() {
    setWords(targetWords.map((word) => ({ word, found: false })));
    setSelectedLetters([]);
    setSeconds(0);
    setStarted(false);
    setCompleted(false);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#eefcff 0%,#f7fbff 48%,#effdf6 100%)",
        padding: "24px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#173f31",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg,#0f766e 0%,#0891b2 50%,#2563eb 100%)",
            color: "#ffffff",
            borderRadius: "32px",
            padding: "28px",
            boxShadow: "0 16px 38px rgba(8,145,178,.18)",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-flex",
                  padding: "8px 13px",
                  borderRadius: "999px",
                  background: "#fde68a",
                  color: "#713f12",
                  fontWeight: 900,
                  fontSize: "13px",
                }}
              >
                ⚡ خُض التحدي وسجّل وقتك
              </span>

              <h1
                style={{
                  margin: "12px 0 8px",
                  fontSize: "clamp(32px,5vw,48px)",
                }}
              >
                🔎 الكلمة الضائعة
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: "650px",
                  lineHeight: 1.9,
                  opacity: 0.94,
                  fontWeight: 700,
                }}
              >
                اكتشف الكلمات المختبئة بين الحروف بأسرع وقت ممكن.
              </p>
            </div>

            <Link
              href="/"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#0f766e",
                borderRadius: "15px",
                padding: "11px 17px",
                fontWeight: 900,
              }}
            >
              ← العودة
            </Link>
          </div>
        </header>

        <section
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "12px",
          }}
        >
          <StatCard icon="⏱️" title="وقتك" value={formattedTime} />
          <StatCard
            icon="✅"
            title="الكلمات المكتشفة"
            value={`${foundCount}/${targetWords.length}`}
          />
          <StatCard
            icon="🔤"
            title="الكلمة الحالية"
            value={currentWord || "ابدأ بالاختيار"}
          />
        </section>

        <section
          className="lost-word-layout"
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns: "minmax(0,1.4fr) minmax(250px,.6fr)",
            gap: "18px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dceee8",
              borderRadius: "28px",
              padding: "20px",
              boxShadow: "0 12px 30px rgba(30,90,60,.08)",
            }}
          >
            <h2 style={{ margin: "0 0 14px", color: "#176c49" }}>
              🔎 ابحث بين الحروف
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`,
                gap: "7px",
              }}
            >
              {grid.flatMap((row, rowIndex) =>
                row.map((letter, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => handleLetter(letter)}
                    style={{
                      aspectRatio: "1",
                      border: "1px solid #cde9df",
                      borderRadius: "14px",
                      background: "#effaf5",
                      color: "#176c49",
                      fontSize: "clamp(18px,3vw,28px)",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {letter}
                  </button>
                ))
              )}
            </div>
          </div>

          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #dceee8",
              borderRadius: "28px",
              padding: "20px",
              boxShadow: "0 12px 30px rgba(30,90,60,.08)",
            }}
          >
            <h2 style={{ margin: "0 0 13px", color: "#176c49" }}>
              🎯 الكلمات المطلوبة
            </h2>

            <div style={{ display: "grid", gap: "9px" }}>
              {words.map((item) => (
                <div
                  key={item.word}
                  style={{
                    padding: "11px 13px",
                    borderRadius: "14px",
                    background: item.found ? "#ecfdf5" : "#f8fafc",
                    border: item.found
                      ? "1px solid #86efac"
                      : "1px solid #e2e8f0",
                    color: item.found ? "#166534" : "#64748b",
                    fontWeight: 900,
                    textDecoration: item.found ? "line-through" : "none",
                  }}
                >
                  {item.found ? "✅ " : "🔍 "}
                  {item.word}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={restartGame}
              style={{
                width: "100%",
                marginTop: "16px",
                border: "none",
                borderRadius: "14px",
                padding: "12px",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔄 إعادة التحدي
            </button>
          </aside>
        </section>
      </div>

      {completed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            background: "rgba(15,23,42,.55)",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "min(100%,480px)",
              background: "#ffffff",
              borderRadius: "30px",
              padding: "28px",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(15,23,42,.25)",
            }}
          >
            <div style={{ fontSize: "64px" }}>🏆</div>

            <h2
              style={{
                margin: "10px 0 6px",
                color: "#0f766e",
                fontSize: "30px",
              }}
            >
              أنهيت التحدي!
            </h2>

            <p
              style={{
                margin: "0 0 18px",
                color: "#64748b",
                lineHeight: 1.8,
              }}
            >
              اكتشفت جميع الكلمات في
            </p>

            <strong
              style={{
                display: "block",
                fontSize: "38px",
                color: "#1d4ed8",
                marginBottom: "18px",
              }}
            >
              ⏱️ {formattedTime}
            </strong>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "15px",
                marginBottom: "14px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontWeight: 900,
                  color: "#334155",
                  marginBottom: "7px",
                }}
              >
                اسمك (اختياري)
              </label>

              <input
                placeholder="اكتب اسمك إن رغبت"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  textAlign: "right",
                }}
              />
            </div>

            <button
              type="button"
              onClick={restartGame}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "15px",
                padding: "13px",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔄 حاول كسر وقتك
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 760px) {
          .lost-word-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dceee8",
        borderRadius: "20px",
        padding: "16px",
        textAlign: "center",
        boxShadow: "0 8px 20px rgba(30,90,60,.06)",
      }}
    >
      <div style={{ fontSize: "28px" }}>{icon}</div>
      <p
        style={{
          margin: "6px 0 2px",
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        {title}
      </p>
      <strong style={{ color: "#176c49", fontSize: "22px" }}>{value}</strong>
    </div>
  );
}