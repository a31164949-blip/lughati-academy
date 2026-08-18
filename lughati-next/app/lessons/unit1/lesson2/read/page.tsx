"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

const STORAGE_KEY =
  "lughati-unit1-lesson2-progress";

type LessonTwoStation =
  | "reading"
  | "comprehension"
  | "words"
  | "language"
  | "spelling"
  | "writing";

function getProgress(): LessonTwoStation[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function completeReading() {
  const current =
    getProgress();

  if (
    current.includes(
      "reading"
    )
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...current,
      "reading",
    ])
  );
}

export default function LessonTwoReadingPage() {
  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    showPlainText,
    setShowPlainText,
  ] = useState(false);

  const [
    focusMode,
    setFocusMode,
  ] = useState(false);

  useEffect(() => {
    setCompleted(
      getProgress().includes(
        "reading"
      )
    );
  }, []);

  function finishStation() {
    completeReading();
    setCompleted(true);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "28px 16px 70px",
        background:
          "linear-gradient(180deg,#effcf7 0%,#f6fbff 55%,#fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f32",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth:
            focusMode
              ? 850
              : 1050,
          margin:
            "0 auto",
          transition:
            "max-width .3s ease",
        }}
      >
        {/* شريط التنقل */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 12,
            flexWrap:
              "wrap",
            marginBottom: 18,
          }}
        >
          <Link
            href="/lessons/unit1/lesson2"
            style={{
              textDecoration:
                "none",
              padding:
                "11px 17px",
              borderRadius: 15,
              background:
                "#ffffff",
              color: "#176c46",
              border:
                "1px solid #d2e8de",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setFocusMode(
                  !focusMode
                )
              }
              style={{
                padding:
                  "10px 14px",
                borderRadius: 14,
                border:
                  "1px solid #dce9e3",
                background:
                  focusMode
                    ? "#eaf9f2"
                    : "#ffffff",
                color:
                  "#176c46",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {focusMode
                ? "🖼️ العرض العادي"
                : "👁️ وضع التركيز"}
            </button>

            <span
              style={{
                padding:
                  "9px 14px",
                borderRadius: 999,
                background:
                  completed
                    ? "#eaf9f2"
                    : "#eef8ff",
                color:
                  completed
                    ? "#14734e"
                    : "#0878b5",
                fontWeight: 900,
              }}
            >
              {completed
                ? "✅ مكتملة"
                : "📖 المحطة 1"}
            </span>
          </div>
        </div>

        {/* رأس المحطة */}

        <header
          style={{
            padding:
              "32px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#eaf9f2,#ffffff,#eef8ff)",
            border:
              "2px solid #cfe9dc",
            boxShadow:
              "0 12px 34px rgba(30,90,65,.07)",
          }}
        >
          <div
            style={{
              fontSize: 62,
            }}
          >
            📖
          </div>

          <div
            style={{
              display:
                "inline-block",
              marginTop: 7,
              padding:
                "6px 12px",
              borderRadius: 999,
              background:
                "#dff6eb",
              color: "#087a55",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            المحطة الأولى
          </div>

          <h1
            style={{
              margin:
                "10px 0 8px",
              color: "#126a4b",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            رحلة القراءة
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              color: "#657d74",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            اقرأ قصة «عذرًا يا جدي»
            بهدوء، وانتبه إلى سبب ندم
            فواز ونصيحة المعلم له.
          </p>
        </header>

        {/* إرشاد فارس */}

        <section
          style={{
            marginTop: 18,
            padding:
              "17px 19px",
            borderRadius: 22,
            background:
              "#ffffff",
            border:
              "1px solid #dceae4",
            display: "flex",
            alignItems:
              "center",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 38,
            }}
          >
            🦸
          </span>

          <div>
            <strong
              style={{
                color:
                  "#176c46",
              }}
            >
              فارس يقول:
            </strong>

            <p
              style={{
                margin:
                  "4px 0 0",
                color:
                  "#677b73",
                lineHeight: 1.8,
                fontWeight: 700,
              }}
            >
              اقرأ على مهل، وقف عند
              علامات الترقيم، وحاول أن
              تجعل صوتك معبرًا عن مشاعر
              فواز.
            </p>
          </div>
        </section>

        {/* بطاقة القراءة */}

        <section
          style={{
            marginTop: 20,
            padding:
              "28px 22px",
            borderRadius: 30,
            background:
              "#ffffff",
            border:
              "1px solid #dceae4",
            boxShadow:
              "0 14px 35px rgba(30,80,60,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 12,
              flexWrap:
                "wrap",
              marginBottom: 22,
            }}
          >
            <div>
              <span
                style={{
                  color:
                    "#087a55",
                  fontWeight:
                    900,
                }}
              >
                📚 النص القرائي
              </span>

              <h2
                style={{
                  margin:
                    "6px 0 0",
                  color:
                    "#173f32",
                  fontSize:
                    27,
                }}
              >
                عُذْرًا يَا جَدِّي
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowPlainText(
                  !showPlainText
                )
              }
              style={{
                padding:
                  "11px 15px",
                borderRadius: 15,
                border:
                  "1px solid #d6e8df",
                background:
                  showPlainText
                    ? "#fff7d8"
                    : "#edf9f3",
                color:
                  showPlainText
                    ? "#806000"
                    : "#176c46",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {showPlainText
                ? "🔤 إظهار الحركات"
                : "🎯 تحدي بدون حركات"}
            </button>
          </div>

          {showPlainText ? (
            <PlainReadingText />
          ) : (
            
            <VowelledReadingText />
          )}
        </section>

        {/* كلمات أركز عليها */}

        <section
          style={{
            marginTop: 20,
            padding:
              "24px 20px",
            borderRadius: 28,
            background:
              "linear-gradient(135deg,#fff9e7,#ffffff)",
            border:
              "1px solid #eedfae",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 8px",
              color: "#986400",
              fontSize: 24,
            }}
          >
            🔦 كلمات أركز عليها
          </h2>

          <p
            style={{
              margin:
                "0 0 18px",
              color: "#746b55",
              fontWeight: 700,
            }}
          >
            اقرأ هذه الكلمات أكثر من مرة
            قبل إنهاء المحطة.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(140px,1fr))",
              gap: 10,
            }}
          >
            {[
              "حَزِينًا",
              "نَادِمٌ",
              "أَخْفِضْ",
              "تَعْتَذِرَ",
              "السَّمَاحَ",
              "عَطُوفٌ",
              "طَاعَةِ",
            ].map(
              (word) => (
                <div
                  key={word}
                  style={{
                    padding:
                      "14px 10px",
                    borderRadius: 17,
                    background:
                      "#ffffff",
                    border:
                      "1px solid #f0dfaa",
                    textAlign:
                      "center",
                    color:
                      "#8a6100",
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {word}
                </div>
              )
            )}
          </div>
        </section>

        {/* فكرة النص */}

        <section
          style={{
            marginTop: 20,
            padding:
              "22px 20px",
            borderRadius: 26,
            background:
              "#eef8ff",
            border:
              "1px solid #cfe6f5",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 9px",
              color: "#0878b5",
              fontSize: 23,
            }}
          >
            💡 أثناء القراءة فكّر
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: 10,
            }}
          >
            <ReadingQuestion
              icon="😔"
              text="لماذا كان فواز حزينًا؟"
            />

            <ReadingQuestion
              icon="📺"
              text="ما الطلب الذي لم ينفذه فواز؟"
            />

            <ReadingQuestion
              icon="🤝"
              text="ماذا نصحه المعلم أن يفعل؟"
            />
          </div>
        </section>

        {/* إنهاء المحطة */}

        <section
          style={{
            marginTop: 20,
            padding:
              "27px 20px",
            borderRadius: 28,
            textAlign: "center",
            background:
              completed
                ? "linear-gradient(135deg,#eaf9f2,#ffffff)"
                : "#ffffff",
            border:
              completed
                ? "2px solid #6ac79c"
                : "1px solid #dceae4",
          }}
        >
          {completed ? (
            <>
              <div
                style={{
                  fontSize: 58,
                }}
              >
                ✅
              </div>

              <h2
                style={{
                  margin:
                    "7px 0",
                  color:
                    "#176c46",
                }}
              >
                أحسنت! أتممت رحلة القراءة
              </h2>

              <p
                style={{
                  color:
                    "#667d74",
                  lineHeight:
                    1.8,
                  fontWeight:
                    700,
                }}
              >
                أصبحت المحطة الأولى مكتملة،
                ويمكنك الانتقال الآن إلى
                «أفهم وأستنتج».
              </p>

              <Link
                href="/lessons/unit1/lesson2/comprehension"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 650,
                  margin:
                    "18px auto 0",
                  padding:
                    "15px 18px",
                  borderRadius: 18,
                  background:
                    "linear-gradient(135deg,#098fd4,#0878b5)",
                  color:
                    "#ffffff",
                  textDecoration:
                    "none",
                  fontWeight:
                    900,
                  fontSize:
                    18,
                }}
              >
                🧠 انتقل إلى أفهم وأستنتج
              </Link>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 50,
                }}
              >
                🌟
              </div>

              <h2
                style={{
                  color:
                    "#176c46",
                  margin:
                    "7px 0",
                }}
              >
                هل انتهيت من القراءة؟
              </h2>

              <p
                style={{
                  color:
                    "#667d74",
                  fontWeight:
                    700,
                }}
              >
                اضغط الزر بعد أن تقرأ النص
                كاملًا مرة واحدة على الأقل.
              </p>

              <button
                type="button"
                onClick={
                  finishStation
                }
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 650,
                  margin:
                    "18px auto 0",
                  padding:
                    "15px 18px",
                  border: "none",
                  borderRadius: 18,
                  background:
                    "linear-gradient(135deg,#159765,#08a16f)",
                  color:
                    "#ffffff",
                  fontWeight:
                    900,
                  fontSize:
                    18,
                  cursor: "pointer",
                }}
              >
                ✅ أتممت قراءة النص
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
function colorArabicMarks(text: string) {
  const markColors: Record<string, string> = {
    "َ": "#e53935",
    "ُ": "#1e88e5",
    "ِ": "#16a34a",
    "ْ": "#7e57c2",
    "ّ": "#f59e0b",
    "ً": "#e53935",
    "ٌ": "#1e88e5",
    "ٍ": "#16a34a",
  };

  return Array.from(text).map((char, index) => {
    const color = markColors[char];

    if (color) {
      return (
        <span
          key={index}
          style={{
            color,
            fontWeight: 900,
          }}
        >
          {char}
        </span>
      );
    }

    return (
      <span key={index}>
        {char}
      </span>
    );
  });
}
function VowelledReadingText() {
  const paragraphs = [
    "فِي حِصَّةِ الْقِرَاءَةِ، صَحِبَ الْمُعَلِّمُ التَّلَامِيذَ إِلَى مَكْتَبَةِ الْمَدْرَسَةِ؛ لِلْقِرَاءَةِ وَالِاطِّلَاعِ.",
    "رَأَى الْمُعَلِّمُ فَوَّازًا يَجْلِسُ حَزِينًا، فَسَأَلَهُ: هَلْ تَشْكُو مِنْ شَيْءٍ يَا بُنَيَّ؟",
    "فَوَّازٌ: لَا، وَلَكِنِّي نَادِمٌ عَلَى مَا فَعَلْتُهُ أَمْسِ.",
    "الْمُعَلِّمُ: وَمَاذَا فَعَلْتَ يَا بُنَيَّ؟",
    "فَوَّازٌ: لَقَدْ طَلَبَ مِنِّي جَدِّي أَنْ أَخْفِضَ صَوْتَ التِّلْفَازِ فَلَمْ أَفْعَلْ؛ لِانْشِغَالِي بِمُتَابَعَةِ بَرْنَامَجِي الْمُفَضَّلِ، فَغَضِبَ مِنِّي.",
    "الْمُعَلِّمُ: لَقَدْ أَخْطَأْتَ يَا فَوَّازُ، وَعَلَيْكَ أَنْ تَعْتَذِرَ إِلَى جَدِّكَ، وَتَطْلُبَ السَّمَاحَ مِنْهُ.",
    "فَوَّازٌ: لَيْتَ جَدِّي يُسَامِحُنِي!",
    "الْمُعَلِّمُ: إِنَّ الْجَدَّ عَطُوفٌ حَنُونٌ، وَسَيُسَامِحُكَ إِنْ شَاءَ اللَّهُ، وَلَكِنِ احْرِصْ يَا بُنَيَّ عَلَى طَاعَةِ جَدِّكَ.",
  ];

  return (
    <div
      style={{
        fontSize: "clamp(20px,3vw,25px)",
        lineHeight: 2.25,
        color: "#25483d",
        fontWeight: 700,
      }}
    >
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          style={{
            margin: "0 0 18px",
          }}
        >
          {colorArabicMarks(paragraph)}
        </p>
      ))}
    </div>
  );
}

function PlainReadingText() {
  return (
    <div
      style={{
        fontSize:
          "clamp(20px,3vw,25px)",
        lineHeight: 2.25,
        color: "#25483d",
        fontWeight: 700,
      }}
    >
      <p>
        في حصة القراءة، صحب المعلم
        التلاميذ إلى مكتبة المدرسة
        للقراءة والاطلاع.
      </p>

      <p>
        رأى المعلم فوازًا يجلس حزينًا،
        فسأله: هل تشكو من شيء يا بني؟
      </p>

      <p>
        فواز: لا، ولكني نادم على ما
        فعلته أمس.
      </p>

      <p>
        المعلم: وماذا فعلت يا بني؟
      </p>

      <p>
        فواز: لقد طلب مني جدي أن أخفض
        صوت التلفاز فلم أفعل، لانشغالي
        بمتابعة برنامجي المفضل، فغضب مني.
      </p>

      <p>
        المعلم: لقد أخطأت يا فواز،
        وعليك أن تعتذر إلى جدك، وتطلب
        السماح منه.
      </p>

      <p>
        فواز: ليت جدي يسامحني!
      </p>

      <p>
        المعلم: إن الجد عطوف حنون،
        وسيسامحك إن شاء الله، ولكن
        احرص يا بني على طاعة جدك.
      </p>
    </div>
  );
}

function ReadingQuestion({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div
      style={{
        minHeight: 105,
        padding: 16,
        borderRadius: 18,
        background: "#ffffff",
        border:
          "1px solid #d5e9f6",
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "#315e72",
        fontWeight: 900,
        lineHeight: 1.7,
      }}
    >
      <span
        style={{
          fontSize: 28,
        }}
      >
        {icon}
      </span>

      <span>
        {text}
      </span>
    </div>
  );
}