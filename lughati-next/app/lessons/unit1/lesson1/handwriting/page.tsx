"use client";

import Link from "next/link";
import { useState } from "react";
import { completeLessonOneStation } from "../progress";
const practiceSentence =
  "أُحِبُّ أُسْرَتِي، وَأَحْرِصُ عَلَى صِلَةِ رَحِمِي.";

export default function HandwritingPage() {
  const [stage, setStage] = useState<"watch" | "trace" | "write" | "done">(
    "watch"
  );

  const [writing, setWriting] = useState("");
function nextStage() {
  if (stage === "watch") {
    setStage("trace");
    return;
  }

  if (stage === "trace") {
    setStage("write");
    return;
  }

  if (stage === "write") {
    completeLessonOneStation("handwriting");
    setStage("done");
  }

  }

  function restart() {
    setStage("watch");
    setWriting("");
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f5fbff 0%,#fffdf7 50%,#eefaf6 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#24483c",
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <Link
            href="/lessons/unit1/lesson1"
            style={{
              textDecoration: "none",
              background: "#fff",
              color: "#176d4c",
              border: "1px solid #cfe7dd",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <div
            style={{
              background: "#fff",
              color: "#176d4c",
              border: "1px solid #cfe7dd",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ✍️ تدريب الخط
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#1d8ca5,#54b8c8)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 15px 38px rgba(29,140,165,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>🖊️</div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "clamp(32px,5vw,46px)",
            }}
          >
            خطي أجمل
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            شاهد الجملة، تتبع شكلها، ثم اكتبها بنفسك بخط جميل.
          </p>
        </section>

        {stage === "watch" && (
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "34px 22px",
              border: "1px solid #d7ebef",
              boxShadow:
                "0 14px 35px rgba(30,100,120,.08)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 50 }}>👀</div>

              <h2
                style={{
                  color: "#176d7e",
                  fontSize: 28,
                  marginBottom: 8,
                }}
              >
                المرحلة الأولى: أشاهد
              </h2>

              <p
                style={{
                  color: "#6f8480",
                  lineHeight: 1.8,
                }}
              >
                انظر إلى شكل الحروف والمسافات بين الكلمات.
              </p>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(180deg,#fffdf8,#ffffff)",
                border: "2px solid #d8e9e8",
                borderRadius: 24,
                padding: "34px 22px",
                textAlign: "center",
                fontSize: "clamp(30px,5vw,46px)",
                lineHeight: 2,
                fontWeight: 900,
                color: "#184d40",
              }}
            >
              {practiceSentence}
            </div>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",
                gap: 10,
              }}
            >
              <div style={tipCardStyle}>
                📏
                <strong>راقب السطر</strong>
                <span>الحروف تستقر على السطر.</span>
              </div>

              <div style={tipCardStyle}>
                ↔️
                <strong>راقب المسافات</strong>
                <span>اترك مسافة واضحة بين الكلمات.</span>
              </div>

              <div style={tipCardStyle}>
                ✨
                <strong>اكتب بهدوء</strong>
                <span>الجمال أهم من السرعة.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={nextStage}
              style={mainButtonStyle}
            >
              التالي: أتتبع الجملة ←
            </button>
          </section>
        )}

        {stage === "trace" && (
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "34px 22px",
              border: "1px solid #d7ebef",
              boxShadow:
                "0 14px 35px rgba(30,100,120,.08)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 50 }}>✍️</div>

              <h2
                style={{
                  color: "#176d7e",
                  fontSize: 28,
                  marginBottom: 8,
                }}
              >
                المرحلة الثانية: أتتبع
              </h2>

              <p
                style={{
                  color: "#6f8480",
                  lineHeight: 1.8,
                }}
              >
                مرر إصبعك أو قلمك بصريًا فوق الجملة من اليمين إلى اليسار.
              </p>
            </div>

            <div
              style={{
                background: "#fbfdfc",
                borderRadius: 24,
                padding: "28px 20px",
                border: "2px dashed #c8dddd",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(30px,5vw,44px)",
                  fontWeight: 900,
                  lineHeight: 2.2,
                  textAlign: "center",
                  color: "#b8c7c2",
                  textShadow:
                    "0 0 1px rgba(0,0,0,.08)",
                  letterSpacing: "1px",
                }}
              >
                {practiceSentence}
              </div>

              <div
                style={{
                  height: 2,
                  background: "#b9d4d0",
                  marginTop: 18,
                }}
              />

              <div
                style={{
                  height: 2,
                  background: "#dceae7",
                  marginTop: 55,
                }}
              />

              <div
                style={{
                  height: 2,
                  background: "#dceae7",
                  marginTop: 55,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 18,
                background: "#fff8e8",
                border: "1px solid #f0dfb5",
                borderRadius: 16,
                padding: 15,
                textAlign: "center",
                color: "#80611b",
                fontWeight: 800,
              }}
            >
              💡 تتبع الحروف بعينك ببطء، ثم انتقل للكتابة بنفسك.
            </div>

            <button
              type="button"
              onClick={nextStage}
              style={mainButtonStyle}
            >
              التالي: أكتب بنفسي ←
            </button>
          </section>
        )}

        {stage === "write" && (
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "34px 22px",
              border: "1px solid #d7ebef",
              boxShadow:
                "0 14px 35px rgba(30,100,120,.08)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 50 }}>🖊️</div>

              <h2
                style={{
                  color: "#176d7e",
                  fontSize: 28,
                  marginBottom: 8,
                }}
              >
                المرحلة الثالثة: أكتب بنفسي
              </h2>

              <p
                style={{
                  color: "#6f8480",
                  lineHeight: 1.8,
                }}
              >
                اكتب الجملة كما تتذكرها، واهتم بجمال الخط والمسافات.
              </p>
            </div>

            <div
              style={{
                background: "#f8fbfa",
                borderRadius: 24,
                padding: "22px",
                border: "1px solid #dceae6",
              }}
            >
              <textarea
                value={writing}
                onChange={(event) =>
                  setWriting(event.target.value)
                }
                placeholder="اكتب الجملة هنا..."
                rows={5}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  border: "none",
                  outline: "none",
                  background:
                    "repeating-linear-gradient(to bottom,#ffffff 0,#ffffff 48px,#d8e6e2 49px,#ffffff 50px)",
                  borderRadius: 18,
                  padding: "16px 18px",
                  fontSize: 28,
                  lineHeight: "50px",
                  fontWeight: 700,
                  color: "#294b40",
                  textAlign: "right",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                background: "#eef9f6",
                border: "1px solid #d2ebe3",
                borderRadius: 18,
                padding: 16,
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#176d4c",
                  marginBottom: 10,
                }}
              >
                ✅ قبل أن تنهي:
              </strong>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  color: "#5f756d",
                  fontWeight: 800,
                }}
              >
                <span>□ كتبت من اليمين إلى اليسار.</span>
                <span>□ تركت مسافات بين الكلمات.</span>
                <span>□ حافظت على الحروف قرب السطر.</span>
                <span>□ كتبت بهدوء وبخط واضح.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={nextStage}
              disabled={!writing.trim()}
              style={{
                ...mainButtonStyle,
                background: writing.trim()
                  ? "linear-gradient(135deg,#1d8ca5,#18748a)"
                  : "#dce8e8",
                color: writing.trim()
                  ? "#fff"
                  : "#8b9999",
                cursor: writing.trim()
                  ? "pointer"
                  : "default",
              }}
            >
              ⭐ أنهيت تدريب الخط
            </button>
          </section>
        )}

        {stage === "done" && (
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "40px 22px",
              border: "1px solid #d7ebef",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(30,100,120,.08)",
            }}
          >
            <div style={{ fontSize: 76 }}>✨</div>

            <h2
              style={{
                color: "#176d7e",
                fontSize: 32,
                marginBottom: 10,
              }}
            >
              صاحب القلم الجميل!
            </h2>

            <p
              style={{
                color: "#6f807b",
                fontSize: 18,
                lineHeight: 1.9,
                maxWidth: 620,
                margin: "0 auto",
              }}
            >
              أحسنت! شاهدت الجملة، وتتبعْت شكلها، ثم كتبتها بنفسك.
              استمر في التدريب ليصبح خطك أجمل كل يوم.
            </p>

            <div
              style={{
                marginTop: 22,
                background: "#f5fbf9",
                border: "1px solid #dcece7",
                borderRadius: 20,
                padding: 20,
              }}
            >
              <div
                style={{
                  color: "#7b8f87",
                  marginBottom: 8,
                  fontWeight: 800,
                }}
              >
                الجملة النموذجية
              </div>

              <div
                style={{
                  fontSize: "clamp(25px,4vw,38px)",
                  lineHeight: 1.9,
                  color: "#184d40",
                  fontWeight: 900,
                }}
              >
                {practiceSentence}
              </div>
            </div>

            <button
              type="button"
              onClick={restart}
              style={mainButtonStyle}
            >
              🔁 أعد تدريب الخط
            </button>

            <Link
              href="/lessons/unit1/lesson1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border: "1px solid #cfe7dd",
                borderRadius: 17,
                padding: 14,
                color: "#17674d",
                fontWeight: 900,
              }}
            >
              🚗 العودة إلى محطات الدرس
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

const tipCardStyle = {
  background: "#f5fbf9",
  border: "1px solid #dcece7",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
  textAlign: "center" as const,
  color: "#176d7e",
};

const mainButtonStyle = {
  width: "100%",
  marginTop: 20,
  border: "none",
  borderRadius: 17,
  background:
    "linear-gradient(135deg,#1d8ca5,#18748a)",
  color: "#fff",
  padding: 15,
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};