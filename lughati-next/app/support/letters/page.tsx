"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LetterItem = {
  letter: string;
  name: string;
  sound: string;
  example: string;
  emoji: string;
};

const letters: LetterItem[] = [
  { letter: "ا", name: "أَلِف", sound: "أَ", example: "أَسَد", emoji: "🦁" },
  { letter: "ب", name: "بَاء", sound: "بَ", example: "بَاب", emoji: "🚪" },
  { letter: "ت", name: "تَاء", sound: "تَ", example: "تُفَّاح", emoji: "🍎" },
  { letter: "ث", name: "ثَاء", sound: "ثَ", example: "ثَوْب", emoji: "👕" },
  { letter: "ج", name: "جِيم", sound: "جَ", example: "جَمَل", emoji: "🐪" },
  { letter: "ح", name: "حَاء", sound: "حَ", example: "حِصَان", emoji: "🐎" },
  { letter: "خ", name: "خَاء", sound: "خَ", example: "خُبْز", emoji: "🍞" },
  { letter: "د", name: "دَال", sound: "دَ", example: "دُبّ", emoji: "🐻" },
  { letter: "ذ", name: "ذَال", sound: "ذَ", example: "ذَهَب", emoji: "🪙" },
  { letter: "ر", name: "رَاء", sound: "رَ", example: "رُمَّان", emoji: "🍎" },
  { letter: "ز", name: "زَاي", sound: "زَ", example: "زَهْرَة", emoji: "🌸" },
  { letter: "س", name: "سِين", sound: "سَ", example: "سَمَك", emoji: "🐟" },
  { letter: "ش", name: "شِين", sound: "شَ", example: "شَمْس", emoji: "☀️" },
  { letter: "ص", name: "صَاد", sound: "صَ", example: "صَقْر", emoji: "🦅" },
  { letter: "ض", name: "ضَاد", sound: "ضَ", example: "ضِفْدَع", emoji: "🐸" },
  { letter: "ط", name: "طَاء", sound: "طَ", example: "طَائِر", emoji: "🐦" },
  { letter: "ظ", name: "ظَاء", sound: "ظَ", example: "ظَرْف", emoji: "✉️" },
  { letter: "ع", name: "عَيْن", sound: "عَ", example: "عَيْن", emoji: "👁️" },
  { letter: "غ", name: "غَيْن", sound: "غَ", example: "غَيْم", emoji: "☁️" },
  { letter: "ف", name: "فَاء", sound: "فَ", example: "فِيل", emoji: "🐘" },
  { letter: "ق", name: "قَاف", sound: "قَ", example: "قَلَم", emoji: "✏️" },
  { letter: "ك", name: "كَاف", sound: "كَ", example: "كِتَاب", emoji: "📘" },
  { letter: "ل", name: "لَام", sound: "لَ", example: "لَيْمُون", emoji: "🍋" },
  { letter: "م", name: "مِيم", sound: "مَ", example: "مَوْز", emoji: "🍌" },
  { letter: "ن", name: "نُون", sound: "نَ", example: "نَجْم", emoji: "⭐" },
  { letter: "هـ", name: "هَاء", sound: "هَ", example: "هِلَال", emoji: "🌙" },
  { letter: "و", name: "وَاو", sound: "وَ", example: "وَرْدَة", emoji: "🌹" },
  { letter: "ي", name: "يَاء", sound: "يَ", example: "يَد", emoji: "✋" },
];

const STORAGE_KEY = "lughati-support-mastered-letters";

function speakArabic(text: string, rate = 0.82) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((item) => item.lang.toLowerCase().startsWith("ar-sa")) ??
    voices.find((item) => item.lang.toLowerCase().startsWith("ar"));

  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export default function LettersSupportPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [masteredLetters, setMasteredLetters] = useState<string[]>([]);
  const [challengeMessage, setChallengeMessage] = useState(
    "اختر الكلمة التي تبدأ بالحرف المعروض."
  );
useEffect(() => {
  const timer =
    window.setTimeout(() => {
      try {
        const saved =
          window.localStorage.getItem(
            STORAGE_KEY
          );

        if (!saved) {
          return;
        }

        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(parsed)
        ) {
          setMasteredLetters(
            parsed.filter(
              (
                item
              ): item is string =>
                typeof item ===
                "string"
            )
          );
        }
      } catch {
        setMasteredLetters([]);
      }
    }, 0);

  return () => {
    window.clearTimeout(
      timer
    );
  };
}, []);

  const selectedLetter = letters[selectedIndex];
  const progress = Math.round((masteredLetters.length / letters.length) * 100);

  const challengeOptions = useMemo(() => {
    const correct = selectedLetter.example;
    const wrong: string[] = [];

    for (let offset = 1; offset < letters.length && wrong.length < 2; offset++) {
      const item = letters[(selectedIndex + offset) % letters.length];
      if (item.example !== correct) wrong.push(item.example);
    }

    const position = selectedIndex % 3;
    if (position === 0) return [correct, ...wrong];
    if (position === 1) return [wrong[0], correct, wrong[1]];
    return [...wrong, correct];
  }, [selectedIndex, selectedLetter.example]);

  function chooseLetter(index: number) {
    setSelectedIndex(index);
    setChallengeMessage("اختر الكلمة التي تبدأ بالحرف المعروض.");
    window.setTimeout(() => speakArabic(letters[index].name, 0.78), 60);
  }

  function toggleMastered() {
    const currentLetter = selectedLetter.letter;

    setMasteredLetters((current) => {
      const next = current.includes(currentLetter)
        ? current.filter((item) => item !== currentLetter)
        : [...current, currentLetter];

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function answerChallenge(option: string) {
    if (option === selectedLetter.example) {
      setChallengeMessage("✅ أحسنت يا بطل! إجابة صحيحة.");
      speakArabic(`أحسنت. ${selectedLetter.example}`, 0.82);
      return;
    }

    setChallengeMessage("🌱 حاول مرة أخرى، وانظر إلى أول حرف.");
  }

  function goPrevious() {
    chooseLetter(selectedIndex === 0 ? letters.length - 1 : selectedIndex - 1);
  }

  function goNext() {
    chooseLetter(selectedIndex === letters.length - 1 ? 0 : selectedIndex + 1);
  }

  const mastered = masteredLetters.includes(selectedLetter.letter);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "24px 16px 60px",
        background:
          "linear-gradient(180deg,#f1fbf6 0%,#ffffff 46%,#fffaf0 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#173f31",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "30px",
            borderRadius: "32px",
            background:
              "linear-gradient(135deg,#147a52 0%,#1f9d6d 58%,#58c78b 100%)",
            color: "#ffffff",
            boxShadow: "0 18px 42px rgba(20,120,80,.17)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "rgba(255,255,255,.08)",
              left: "-80px",
              top: "-100px",
              pointerEvents: "none",
            }}
          />

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
                  padding: "7px 12px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,.16)",
                  fontSize: "13px",
                  fontWeight: 900,
                }}
              >
                🌱 المرحلة الأولى
              </span>

              <h1
                style={{
                  margin: "10px 0 7px",
                  fontSize: "clamp(34px,5vw,52px)",
                  lineHeight: 1.25,
                }}
              >
                🔤 الحروف والأصوات
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: "720px",
                  lineHeight: 1.9,
                  fontWeight: 700,
                  opacity: 0.95,
                }}
              >
                أتعرّف الحرف، أستمع إلى اسمه وصوته، وأتدرّب عليه في كلمة واضحة
                حتى أتقنه.
              </p>
            </div>

            <Link
              href="/support"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#14744d",
                borderRadius: "15px",
                padding: "11px 17px",
                fontWeight: 900,
              }}
            >
              ← العودة إلى رحلة الدعم
            </Link>
          </div>
        </header>

        <section className="letters-stats" style={styles.stats}>
          <StatCard icon="🔤" title="الحروف" value={`${letters.length} حرفًا`} />
          <StatCard
            icon="✅"
            title="أتقنت"
            value={`${masteredLetters.length}/${letters.length}`}
          />
          <StatCard icon="🌟" title="تقدمي" value={`${progress}%`} />
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <span style={styles.eyebrow}>الحروف الهجائية</span>
              <h2 style={styles.sectionTitle}>اختر حرفًا وابدأ التدريب</h2>
            </div>

            <span style={styles.pill}>اضغط الحرف للاستماع 🔊</span>
          </div>

          <div style={styles.lettersGrid}>
            {letters.map((item, index) => {
              const active = index === selectedIndex;
              const isDone = masteredLetters.includes(item.letter);

              return (
                <button
                  key={item.letter}
                  type="button"
                  onClick={() => chooseLetter(index)}
                  aria-label={`حرف ${item.name}`}
                  style={{
                    minHeight: "76px",
                    border: active
                      ? "2px solid #168a63"
                      : isDone
                      ? "2px solid #86efac"
                      : "1px solid #dcece4",
                    borderRadius: "18px",
                    background: active
                      ? "#e9f8f0"
                      : isDone
                      ? "#f0fdf4"
                      : "#ffffff",
                    color: "#174c3b",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: active
                      ? "0 8px 18px rgba(22,138,99,.12)"
                      : "none",
                  }}
                >
                  {isDone && (
                    <span
                      style={{
                        position: "absolute",
                        top: "5px",
                        left: "7px",
                        fontSize: "12px",
                      }}
                    >
                      ✅
                    </span>
                  )}

                  <strong style={{ display: "block", fontSize: "35px" }}>
                    {item.letter}
                  </strong>

                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#718078",
                    }}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="letter-training-layout" style={styles.trainingLayout}>
          <article style={styles.card}>
            <div style={styles.sectionHeader}>
              <span style={styles.pill}>
                الحرف {selectedIndex + 1} من {letters.length}
              </span>

              <button
                type="button"
                onClick={toggleMastered}
                style={{
                  ...styles.outlineButton,
                  background: mastered ? "#ecfdf5" : "#ffffff",
                  borderColor: mastered ? "#86efac" : "#cde9dc",
                }}
              >
                {mastered ? "✅ تم الإتقان" : "☆ أتقنت هذا الحرف"}
              </button>
            </div>

            <div className="letter-main-card" style={styles.letterMain}>
              <div style={styles.letterPanel}>
                <div>
                  <div style={styles.bigLetter}>{selectedLetter.letter}</div>
                  <strong style={styles.letterName}>{selectedLetter.name}</strong>
                  <span style={styles.soundPill}>صوته: {selectedLetter.sound}</span>
                </div>
              </div>

              <div>
                <span style={styles.eyebrow}>👂 استمع ثم كرّر</span>

                <h2 style={{ margin: "5px 0 12px", fontSize: "30px" }}>
                  تعرّف حرف {selectedLetter.name}
                </h2>

                <div className="sound-buttons" style={styles.twoColumns}>
                  <button
                    type="button"
                    onClick={() => speakArabic(selectedLetter.name, 0.78)}
                    style={styles.primaryButton}
                  >
                    🔊 استمع إلى اسم الحرف
                  </button>

                  <button
                    type="button"
                    onClick={() => speakArabic(selectedLetter.sound, 0.72)}
                    style={styles.secondaryButton}
                  >
                    👄 استمع إلى صوت الحرف
                  </button>
                </div>

                <div style={styles.exampleCard}>
                  <div style={styles.emojiBox}>{selectedLetter.emoji}</div>

                  <div>
                    <span style={styles.mutedSmall}>مثال</span>
                    <strong style={styles.exampleWord}>
                      {selectedLetter.example}
                    </strong>
                    <span style={styles.mutedSmall}>
                      يبدأ بحرف {selectedLetter.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakArabic(selectedLetter.example, 0.76)}
                    aria-label="استمع إلى المثال"
                    style={styles.audioCircle}
                  >
                    🔊
                  </button>
                </div>

                <div style={styles.navigation}>
                  <button
                    type="button"
                    onClick={goPrevious}
                    style={styles.outlineButton}
                  >
                    → السابق
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    style={styles.outlineButton}
                  >
                    التالي ←
                  </button>
                </div>
              </div>
            </div>
          </article>

          <aside style={styles.challengeCard}>
            <span style={styles.challengeBadge}>🎯 تحدي فارس</span>

            <h2 style={{ margin: "10px 0 5px" }}>
              أين حرف {selectedLetter.letter}؟
            </h2>

            <p style={styles.challengeText}>{challengeMessage}</p>

            <div style={{ display: "grid", gap: "9px" }}>
              {challengeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => answerChallenge(option)}
                  style={styles.optionButton}
                >
                  {option}
                </button>
              ))}
            </div>

            <div style={styles.tip}>
              <strong style={{ display: "block", marginBottom: "6px" }}>
                💡 نصيحة فارس
              </strong>
              <p style={{ margin: 0, lineHeight: 1.8 }}>
                استمع إلى الحرف أكثر من مرة، ثم انطقه بوضوح، وبعدها اقرأ الكلمة
                المثال بصوت مرتفع.
              </p>
            </div>
          </aside>
        </section>
      </div>

      <style>{`
        @media (max-width: 850px) {
          .letter-training-layout {
            grid-template-columns: 1fr !important;
          }

          .letter-main-card {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .letters-stats {
            grid-template-columns: 1fr !important;
          }

          .sound-buttons {
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
    <article style={styles.statCard}>
      <div style={{ fontSize: "28px" }}>{icon}</div>
      <span style={styles.mutedSmall}>{title}</span>
      <strong style={{ display: "block", marginTop: "2px", fontSize: "20px" }}>
        {value}
      </strong>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stats: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: "12px",
  },
  statCard: {
    padding: "16px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #dcece4",
    textAlign: "center",
    boxShadow: "0 7px 20px rgba(30,90,60,.05)",
  },
  card: {
    marginTop: "18px",
    padding: "20px",
    borderRadius: "28px",
    background: "#ffffff",
    border: "1px solid #dcece4",
    boxShadow: "0 12px 30px rgba(30,90,60,.07)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  eyebrow: {
    color: "#168a63",
    fontSize: "13px",
    fontWeight: 900,
  },
  sectionTitle: {
    margin: "3px 0 0",
    fontSize: "25px",
    color: "#174c3b",
  },
  pill: {
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#f1fbf5",
    color: "#176c46",
    fontSize: "12px",
    fontWeight: 900,
  },
  lettersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(70px,1fr))",
    gap: "9px",
  },
  trainingLayout: {
    marginTop: "18px",
    display: "grid",
    gridTemplateColumns: "minmax(0,1.25fr) minmax(280px,.75fr)",
    gap: "18px",
  },
  letterMain: {
    display: "grid",
    gridTemplateColumns: "minmax(180px,.75fr) minmax(0,1.25fr)",
    gap: "18px",
    alignItems: "center",
  },
  letterPanel: {
    minHeight: "260px",
    display: "grid",
    placeItems: "center",
    borderRadius: "28px",
    background: "linear-gradient(135deg,#e8f8ef,#fff9df)",
    border: "1px solid #d8eadf",
    textAlign: "center",
  },
  bigLetter: {
    fontSize: "108px",
    lineHeight: 1,
    color: "#147a52",
    fontWeight: 900,
  },
  letterName: {
    display: "block",
    marginTop: "10px",
    fontSize: "25px",
    color: "#174c3b",
  },
  soundPill: {
    display: "inline-flex",
    marginTop: "8px",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#176c46",
    fontWeight: 900,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: "10px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "15px",
    padding: "13px",
    background: "#168a63",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cfe8dc",
    borderRadius: "15px",
    padding: "13px",
    background: "#eef9f4",
    color: "#176c46",
    fontWeight: 900,
    cursor: "pointer",
  },
  exampleCard: {
    marginTop: "14px",
    padding: "16px",
    borderRadius: "20px",
    background: "#f8fcfa",
    border: "1px solid #e0eee7",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  emojiBox: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "#ffffff",
    fontSize: "38px",
    flexShrink: 0,
  },
  mutedSmall: {
    display: "block",
    color: "#718078",
    fontSize: "12px",
    fontWeight: 800,
  },
  exampleWord: {
    display: "block",
    marginTop: "2px",
    fontSize: "27px",
    color: "#174c3b",
  },
  audioCircle: {
    marginRight: "auto",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border: "none",
    background: "#e8f8ef",
    color: "#176c46",
    fontSize: "20px",
    cursor: "pointer",
  },
  navigation: {
    marginTop: "15px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  outlineButton: {
    border: "1px solid #d8e9e0",
    borderRadius: "13px",
    padding: "10px 13px",
    background: "#ffffff",
    color: "#176c46",
    fontWeight: 900,
    cursor: "pointer",
  },
  challengeCard: {
    marginTop: "18px",
    padding: "22px",
    borderRadius: "28px",
    background: "linear-gradient(180deg,#fffaf0,#ffffff)",
    border: "1px solid #ece2c5",
    boxShadow: "0 12px 30px rgba(120,90,20,.06)",
  },
  challengeBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#fff1b8",
    color: "#815f00",
    fontSize: "12px",
    fontWeight: 900,
  },
  challengeText: {
    margin: "0 0 13px",
    color: "#718078",
    lineHeight: 1.8,
    fontSize: "13px",
    fontWeight: 700,
  },
  optionButton: {
    border: "1px solid #eadfbd",
    borderRadius: "15px",
    padding: "13px",
    background: "#ffffff",
    color: "#174c3b",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  tip: {
    marginTop: "18px",
    padding: "15px",
    borderRadius: "18px",
    background: "#f0fbf5",
    border: "1px solid #d7eee2",
    color: "#66786f",
    fontSize: "13px",
    fontWeight: 700,
  },
};