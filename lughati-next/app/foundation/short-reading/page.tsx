"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Story = {
  id: number;
  title: string;
  icon: string;
  sentences: string[];
};

const STORIES: Story[] = [
  {
    id: 1,
    title: "صَبَاحُ سَعْدٍ",
    icon: "🌤️",
    sentences: [
      "اِسْتَيْقَظَ سَعْدٌ مُبَكِّرًا.",
      "غَسَلَ سَعْدٌ وَجْهَهُ.",
      "ذَهَبَ سَعْدٌ إِلَى المَدْرَسَةِ.",
    ],
  },
  {
    id: 2,
    title: "الزَّهْرَةُ",
    icon: "🌷",
    sentences: [
      "خَرَجَتْ نُورَةُ إِلَى الحَدِيقَةِ.",
      "رَأَتْ زَهْرَةً جَمِيلَةً.",
      "سَقَتْ نُورَةُ الزَّهْرَةَ.",
    ],
  },
  {
    id: 3,
    title: "الكِتَابُ",
    icon: "📘",
    sentences: [
      "أَخَذَ خَالِدٌ كِتَابًا.",
      "جَلَسَ عَلَى الكُرْسِيِّ.",
      "فَتَحَ الكِتَابَ بِهُدُوءٍ.",
      "قَرَأَ قِصَّةً قَصِيرَةً.",
    ],
  },
  {
    id: 4,
    title: "العُصْفُورُ الصَّغِيرُ",
    icon: "🐦",
    sentences: [
      "رَأَى عُمَرُ عُصْفُورًا صَغِيرًا.",
      "وَضَعَ لَهُ قَلِيلًا مِنَ الحَبِّ.",
      "اِقْتَرَبَ العُصْفُورُ مِنَ الحَبِّ.",
      "أَكَلَ العُصْفُورُ الحَبَّ.",
    ],
  },
  {
    id: 5,
    title: "يَوْمٌ فِي الحَدِيقَةِ",
    icon: "🌳",
    sentences: [
      "ذَهَبَتِ الأُسْرَةُ إِلَى الحَدِيقَةِ.",
      "جَلَسُوا تَحْتَ شَجَرَةٍ كَبِيرَةٍ.",
      "لَعِبَ الأَطْفَالُ بِالكُرَةِ.",
      "تَنَاوَلَتِ الأُسْرَةُ الطَّعَامَ.",
      "عَادَ الجَمِيعُ إِلَى البَيْتِ سَعِيدِينَ.",
    ],
  },
];

function shuffle<T>(items: T[], seed: number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = (seed * 11 + i * 7 + 3) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (copy.length > 1 && copy.every((item, i) => item === items[i])) {
    [copy[0], copy[1]] = [copy[1], copy[0]];
  }
  return copy;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export default function ShortReadingPage() {
  const [storyIndex, setStoryIndex] = useState(0);
  const story = STORIES[storyIndex];

  const [phase, setPhase] = useState<"read" | "arrange" | "done">("read");
  const [bank, setBank] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "📖 اقرأ الجمل بنفسك أولًا، ثم اضغط «ابدأ الترتيب»."
  );
  const [speaking, setSpeaking] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [mastered, setMastered] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const cancelledRef = useRef(false);

  const progress = useMemo(() => {
    if (phase === "done") return 100;
    return Math.round(((storyIndex + (phase === "arrange" ? 0.5 : 0)) / STORIES.length) * 100);
  }, [storyIndex, phase]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function getArabicVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith("ar-sa")) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("ar")) ??
      null
    );
  }

  function speakText(text: string, rate = 0.72) {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      const voice = getArabicVoice();
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "ar-SA";
      u.rate = rate;
      u.pitch = 1;
      u.volume = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  async function readSentence(sentence: string, index: number) {
    if (speaking) return;
    cancelledRef.current = false;
    setSpeaking(true);
    setActiveSentence(index);
    window.speechSynthesis.cancel();
    await speakText(sentence, 0.72);
    setActiveSentence(null);
    setSpeaking(false);
  }

  async function readStory() {
    if (speaking) return;
    cancelledRef.current = false;
    setSpeaking(true);
    window.speechSynthesis.cancel();
    setMessage("🎧 استمع عند الحاجة، وتابع الجملة المضيئة.");

    for (let i = 0; i < story.sentences.length; i++) {
      if (cancelledRef.current) break;
      setActiveSentence(i);
      await speakText(story.sentences[i], 0.7);
      await wait(280);
    }

    setActiveSentence(null);
    setSpeaking(false);
    setMessage("📖 الآن اقرأ الجمل بنفسك، ثم ابدأ الترتيب.");
  }

  function startArrange() {
    window.speechSynthesis.cancel();
    setPhase("arrange");
    setAnswer([]);
    setBank(shuffle(story.sentences, story.id));
    setActiveSentence(null);
    setMessage("🧩 رتّب الجمل حسب تسلسل الأحداث.");
  }

  function addSentence(sentence: string, index: number) {
    if (speaking) return;
    setAnswer((prev) => [...prev, sentence]);
    setBank((prev) => prev.filter((_, i) => i !== index));
    setMessage("✨ واصل الترتيب حتى تكتمل القصة.");
  }

  function removeSentence(sentence: string, index: number) {
    if (speaking) return;
    setAnswer((prev) => prev.filter((_, i) => i !== index));
    setBank((prev) => [...prev, sentence]);
    setMessage("يمكنك تعديل الترتيب ثم التحقق من القصة.");
  }

  async function checkOrder() {
    if (answer.length !== story.sentences.length) {
      setMessage("🧩 ضع جميع الجمل في منطقة الترتيب أولًا.");
      return;
    }

    const correct = answer.every((sentence, i) => sentence === story.sentences[i]);

    if (!correct) {
      setMessage("🌱 الترتيب غير صحيح بعد. اقرأ الجمل وفكّر: ماذا حدث أولًا؟");
      return;
    }

    setMastered((n) => n + 1);
    setShowSuccess(true);
    setMessage("🏆 أحسنت! رتبت أحداث القصة ترتيبًا صحيحًا.");

    setSpeaking(true);
    window.speechSynthesis.cancel();

    for (let i = 0; i < story.sentences.length; i++) {
      setActiveSentence(i);
      await speakText(story.sentences[i], 0.7);
      await wait(250);
    }

    setActiveSentence(null);
    setSpeaking(false);
  }

  function resetStory() {
    window.speechSynthesis.cancel();
    setAnswer([]);
    setBank(shuffle(story.sentences, story.id));
    setMessage("🔄 أعد ترتيب الجمل من جديد.");
    setActiveSentence(null);
  }

  function nextStory() {
    window.speechSynthesis.cancel();
    setShowSuccess(false);

    if (storyIndex === STORIES.length - 1) {
      setPhase("done");
      setMessage("🎉 أنهيت مراجعة القراءة القصيرة بنجاح.");
      return;
    }

    setStoryIndex((n) => n + 1);
    setPhase("read");
    setAnswer([]);
    setBank([]);
    setActiveSentence(null);
    setMessage("📖 اقرأ القصة الجديدة بنفسك أولًا.");
  }

  function restartAll() {
    window.speechSynthesis.cancel();
    setStoryIndex(0);
    setPhase("read");
    setAnswer([]);
    setBank([]);
    setMastered(0);
    setShowSuccess(false);
    setActiveSentence(null);
    setMessage("📖 اقرأ الجمل بنفسك أولًا، ثم اضغط «ابدأ الترتيب».");
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f4fbf7 0%,#f8fbff 55%,#fffaf2 100%)",
        padding: "24px 14px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#174c3b",
      }}
    >
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <Link
          href="/foundation"
          style={{
            display: "inline-flex",
            textDecoration: "none",
            background: "#fff",
            color: "#176d4c",
            border: "1px solid #d4e8dd",
            borderRadius: 15,
            padding: "11px 17px",
            fontWeight: 900,
            marginBottom: 14,
          }}
        >
          ← العودة إلى أساس لغتي
        </Link>

        <header
          style={{
            borderRadius: 30,
            padding: 27,
            background: "linear-gradient(135deg,#b45309,#d97706,#f59e0b)",
            color: "#fff",
            boxShadow: "0 16px 38px rgba(180,83,9,.16)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,.18)",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            📖 المهارة 9
          </span>
          <h1 style={{ margin: "10px 0 5px", fontSize: "clamp(34px,5vw,50px)" }}>
            القراءة القصيرة
          </h1>
          <p style={{ margin: 0, fontWeight: 800, lineHeight: 1.9 }}>
            أقرأ ثم أرتّب — اقرأ الجمل، وافهم تسلسل الأحداث، ثم أعد ترتيبها.
          </p>
        </header>

        <div
          style={{
            height: 11,
            marginTop: 14,
            borderRadius: 999,
            overflow: "hidden",
            background: "#eee7dd",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg,#b45309,#f59e0b)",
              transition: "width .3s ease",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "13px 15px",
            borderRadius: 17,
            background: "#fff",
            border: "1px solid #e7e2da",
            textAlign: "center",
            color: "#64748b",
            fontWeight: 900,
          }}
        >
          {message}
        </div>

        {phase !== "done" && (
          <section
            style={{
              marginTop: 18,
              background: "#fff",
              border: "1px solid #e7e2da",
              borderRadius: 28,
              padding: 24,
              boxShadow: "0 12px 30px rgba(80,60,30,.06)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 66 }}>{story.icon}</div>
              <div style={{ color: "#718078", fontWeight: 800 }}>
                القصة {storyIndex + 1} من {STORIES.length} • {story.sentences.length} جمل
              </div>
              <h2 style={{ margin: "7px 0 0", color: "#92400e", fontSize: 30 }}>
                {story.title}
              </h2>
            </div>

            {phase === "read" && (
              <>
                <div style={{ display: "grid", gap: 11, marginTop: 20 }}>
                  {story.sentences.map((sentence, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "14px 16px",
                        borderRadius: 18,
                        border:
                          activeSentence === index
                            ? "2px solid #f59e0b"
                            : "1px solid #dce8e1",
                        background: activeSentence === index ? "#fff7d6" : "#f9fcfa",
                        transition: "all .18s ease",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: "clamp(21px,3vw,27px)",
                          lineHeight: 1.9,
                          fontWeight: 900,
                          color: "#174c3b",
                        }}
                      >
                        {sentence}
                      </span>

                      <button
                        type="button"
                        disabled={speaking}
                        onClick={() => void readSentence(sentence, index)}
                        aria-label="استمع إلى الجملة"
                        style={soundButton}
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 20,
                  }}
                >
                  <button
                    type="button"
                    disabled={speaking}
                    onClick={() => void readStory()}
                    style={secondaryButton}
                  >
                    🔊 استمع للمساعدة
                  </button>

                  <button type="button" onClick={startArrange} style={primaryButton}>
                    🧩 ابدأ الترتيب
                  </button>
                </div>
              </>
            )}

            {phase === "arrange" && (
              <>
                <h3 style={{ textAlign: "center", color: "#92400e", marginTop: 22 }}>
                  🧩 ترتيبك للقصة
                </h3>

                <div
                  style={{
                    minHeight: 120,
                    border: "2px dashed #e6c89e",
                    borderRadius: 20,
                    background: "#fffaf2",
                    padding: 12,
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {answer.length === 0 ? (
                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        minHeight: 90,
                        color: "#9a8d7d",
                        fontWeight: 800,
                      }}
                    >
                      اضغط على الجملة التي حدثت أولًا
                    </div>
                  ) : (
                    answer.map((sentence, index) => (
                      <button
                        key={`${sentence}-${index}`}
                        type="button"
                        onClick={() => removeSentence(sentence, index)}
                        style={{
                          border:
                            activeSentence === index
                              ? "2px solid #f59e0b"
                              : "1px solid #e5d5be",
                          borderRadius: 15,
                          background: activeSentence === index ? "#fff7d6" : "#fff",
                          padding: "12px 14px",
                          color: "#174c3b",
                          fontSize: 20,
                          lineHeight: 1.8,
                          fontWeight: 900,
                          textAlign: "right",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ color: "#b45309", marginLeft: 8 }}>
                          {index + 1}.
                        </span>
                        {sentence}
                      </button>
                    ))
                  )}
                </div>

                <h3 style={{ textAlign: "center", color: "#176d4c", marginTop: 20 }}>
                  🔀 الجمل المبعثرة
                </h3>

                <div style={{ display: "grid", gap: 10 }}>
                  {bank.map((sentence, index) => (
                    <div
                      key={`${sentence}-${index}`}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => addSentence(sentence, index)}
                        style={{
                          flex: 1,
                          border: "1px solid #dce8e1",
                          borderRadius: 16,
                          background: "#f4fbf7",
                          padding: "13px 15px",
                          color: "#174c3b",
                          fontSize: 20,
                          lineHeight: 1.8,
                          fontWeight: 900,
                          textAlign: "right",
                          cursor: "pointer",
                        }}
                      >
                        {sentence}
                      </button>

                      <button
                        type="button"
                        disabled={speaking}
                        onClick={() => void readSentence(sentence, -1)}
                        aria-label="استمع إلى الجملة"
                        style={soundButton}
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 20,
                  }}
                >
                  <button type="button" onClick={resetStory} style={secondaryButton}>
                    🔄 أعد الترتيب
                  </button>

                  <button
                    type="button"
                    disabled={speaking}
                    onClick={() => void checkOrder()}
                    style={primaryButton}
                  >
                    ✅ تحقق من الترتيب
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {phase === "done" && (
          <section
            style={{
              marginTop: 18,
              padding: "38px 24px",
              borderRadius: 30,
              background: "linear-gradient(180deg,#fff,#f1fff6)",
              border: "1px solid #d3e8dc",
              textAlign: "center",
              boxShadow: "0 16px 38px rgba(30,90,60,.10)",
            }}
          >
            <div style={{ fontSize: 76 }}>🏆📖</div>
            <h2 style={{ color: "#166534", fontSize: 32, margin: "8px 0" }}>
              بطل القراءة والترتيب!
            </h2>
            <p style={{ color: "#64748b", fontWeight: 800 }}>
              أنهيت جميع القصص القصيرة ورتبت أحداثها بنجاح.
            </p>
            <div
              style={{
                maxWidth: 300,
                margin: "18px auto",
                padding: 16,
                border: "1px solid #d8e8df",
                borderRadius: 18,
                background: "#fff",
                fontWeight: 900,
                color: "#166534",
                fontSize: 24,
              }}
            >
              ⭐ {mastered} / {STORIES.length}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={restartAll} style={secondaryButton}>
                🔄 أعد المراجعة
              </button>
              <Link href="/foundation" style={{ ...primaryButton, textDecoration: "none" }}>
                العودة إلى أساس لغتي ←
              </Link>
            </div>
          </section>
        )}
      </div>

      {showSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(15,23,42,.55)",
            backdropFilter: "blur(7px)",
          }}
        >
          <section
            style={{
              position: "relative",
              width: "min(540px,100%)",
              borderRadius: 30,
              background: "linear-gradient(180deg,#fff,#f2fff7)",
              padding: "36px 24px 27px",
              textAlign: "center",
              boxShadow: "0 28px 75px rgba(15,23,42,.27)",
            }}
          >
            <button
              type="button"
              aria-label="إغلاق"
              onClick={() => setShowSuccess(false)}
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1px solid #d8e7df",
                background: "#fff",
                color: "#49675a",
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: 76 }}>🏆📚</div>
            <h2 style={{ color: "#166534", fontSize: 31, margin: "8px 0 6px" }}>
              أحسنت يا بطل!
            </h2>
            <p style={{ color: "#64748b", fontWeight: 800, lineHeight: 1.8 }}>
              رتبت أحداث «{story.title}» ترتيبًا صحيحًا.
            </p>

            <div
              style={{
                margin: "18px 0",
                padding: 14,
                borderRadius: 17,
                background: "#fff7d6",
                color: "#8a5a00",
                fontWeight: 900,
              }}
            >
              ⭐ قصة جديدة أتقنتها!
            </div>

            <button type="button" onClick={nextStory} style={primaryButton}>
              {storyIndex === STORIES.length - 1
                ? "🏆 عرض النتيجة النهائية"
                : "القصة التالية ←"}
            </button>
          </section>
        </div>
      )}

      <style>{`
        button:disabled {
          opacity: .58;
          cursor: default !important;
        }
      `}</style>
    </main>
  );
}

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 15,
  padding: "13px 20px",
  background: "#b45309",
  color: "#fff",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid #d8e5de",
  borderRadius: 15,
  padding: "13px 20px",
  background: "#fff",
  color: "#176d4c",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const soundButton: React.CSSProperties = {
  width: 46,
  height: 46,
  flex: "0 0 46px",
  border: "1px solid #d8e5de",
  borderRadius: "50%",
  background: "#fff",
  cursor: "pointer",
  fontSize: 19,
};
