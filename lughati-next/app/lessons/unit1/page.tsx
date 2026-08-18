"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getLessonOneProgress,
  type LessonOneStation,
} from "./lesson1/progress";

const INTRO_STORAGE_KEY =
  "lughati-unit1-intro-completed";

const LESSON_TWO_STORAGE_KEY =
  "lughati-unit1-lesson2-completed";

const REVIEW_STORAGE_KEY =
  "lughati-unit1-review-completed";

const TOTAL_LESSON_ONE_STATIONS = 6;

export default function UnitOnePage() {
  const [
    lessonOneStations,
    setLessonOneStations,
  ] = useState<LessonOneStation[]>([]);

  const [
    introCompleted,
    setIntroCompleted,
  ] = useState(false);

  const [
    lessonTwoCompleted,
    setLessonTwoCompleted,
  ] = useState(false);

  const [
    reviewSaved,
    setReviewSaved,
  ] = useState(false);

  useEffect(() => {
    function loadProgress() {
      /*
       * التهيئة
       */
      setIntroCompleted(
        localStorage.getItem(
          INTRO_STORAGE_KEY
        ) === "true"
      );

      /*
       * الدرس الأول
       */
      setLessonOneStations(
        getLessonOneProgress()
      );

      /*
       * الدرس الثاني
       */
      setLessonTwoCompleted(
        localStorage.getItem(
          LESSON_TWO_STORAGE_KEY
        ) === "true"
      );

      /*
       * مراجعة الوحدة
       */
      setReviewSaved(
        localStorage.getItem(
          REVIEW_STORAGE_KEY
        ) === "true"
      );
    }

    loadProgress();

    window.addEventListener(
      "focus",
      loadProgress
    );

    window.addEventListener(
      "pageshow",
      loadProgress
    );

    return () => {
      window.removeEventListener(
        "focus",
        loadProgress
      );

      window.removeEventListener(
        "pageshow",
        loadProgress
      );
    };
  }, []);

  const lessonOneCompletedCount =
    lessonOneStations.length;

  const lessonOneProgress =
    useMemo(() => {
      return Math.round(
        (lessonOneCompletedCount /
          TOTAL_LESSON_ONE_STATIONS) *
          100
      );
    }, [lessonOneCompletedCount]);

  const lessonOneCompleted =
    lessonOneCompletedCount ===
    TOTAL_LESSON_ONE_STATIONS;

  /*
   * لا نعتمد المراجعة القديمة
   * إلا بعد إكمال الدرس الثاني.
   */
  const reviewCompleted =
    lessonTwoCompleted &&
    reviewSaved;

  /*
   * مراحل الوحدة الأربع:
   * 1- التهيئة
   * 2- صلة الرحم
   * 3- عذرًا يا جدي
   * 4- مراجعة الوحدة
   */
  const unitCompletedSteps =
    Number(introCompleted) +
    Number(lessonOneCompleted) +
    Number(lessonTwoCompleted) +
    Number(reviewCompleted);

  const unitProgress =
    Math.round(
      (unitCompletedSteps / 4) *
        100
    );

  const unitCompleted =
    introCompleted &&
    lessonOneCompleted &&
    lessonTwoCompleted &&
    reviewCompleted;

  /*
   * فتح الدرس الثاني بعد
   * إنهاء صلة الرحم.
   */
  const lessonTwoUnlocked =
    lessonOneCompleted;

  /*
   * فتح مراجعة الوحدة بعد
   * إنهاء الدرسين.
   */
  const reviewUnlocked =
    lessonOneCompleted &&
    lessonTwoCompleted;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "28px 16px 70px",
        background:
          "linear-gradient(180deg,#effcf7 0%,#f5fbff 52%,#fffaf0 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#173f32",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1220,
          margin: "0 auto",
        }}
      >
        {/* رأس الوحدة */}

        <header
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "30px 24px",
            marginBottom: 26,
            borderRadius: 30,
            background:
              "linear-gradient(135deg,#ffffff 0%,#f1fff8 60%,#fff9df 100%)",
            border: unitCompleted
              ? "2px solid #edca59"
              : "1px solid #d9eee5",
            boxShadow:
              "0 14px 38px rgba(30,90,65,.08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              left: -25,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background:
                "rgba(255,214,86,.16)",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 520px",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "7px 13px",
                  marginBottom: 12,
                  borderRadius: 999,
                  background:
                    unitCompleted
                      ? "#fff1b7"
                      : "#e8f8f0",
                  color:
                    unitCompleted
                      ? "#876000"
                      : "#16835f",
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {unitCompleted
                  ? "🌟 الوحدة مكتملة"
                  : "📚 أكاديمية لغتي"}
              </div>

              <h1
                style={{
                  margin: 0,
                  color: "#124e3a",
                  fontSize:
                    "clamp(32px,5vw,48px)",
                  lineHeight: 1.4,
                }}
              >
                👨‍👩‍👦 الوحدة الأولى: أقاربي
              </h1>

              <p
                style={{
                  maxWidth: 760,
                  margin: "12px 0 0",
                  color: "#657d74",
                  fontSize: 17,
                  lineHeight: 2,
                  fontWeight: 700,
                }}
              >
                تبدأ رحلتك بتهيئة قصيرة،
                ثم تدرس «صلة الرحم»، وبعدها
                «عذرًا يا جدي»، ثم تنهي
                مراجعة الوحدة لتحصل على
                مكافأتك.
              </p>
            </div>

            <Link
              href="/lessons"
              style={{
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: 16,
                background: "#ffffff",
                color: "#176d4c",
                border:
                  "1px solid #cfe7dd",
                fontWeight: 900,
              }}
            >
              ← العودة إلى المقرر
            </Link>
          </div>

          {/* تقدم الوحدة */}

          <div
            style={{
              position: "relative",
              marginTop: 28,
              padding: 18,
              borderRadius: 20,
              background:
                "rgba(255,255,255,.86)",
              border:
                "1px solid #e0eee8",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <strong
                style={{
                  color: "#176d4c",
                }}
              >
                🗺️ تقدمك في الوحدة
              </strong>

              <strong
                style={{
                  color: "#176d4c",
                }}
              >
                {unitCompletedSteps} من 4
                {" — "}
                {unitProgress}%
              </strong>
            </div>

            <div
              style={{
                height: 15,
                overflow: "hidden",
                borderRadius: 999,
                background: "#e1ece7",
              }}
            >
              <div
                style={{
                  width:
                    `${unitProgress}%`,
                  height: "100%",
                  borderRadius: 999,
                  background:
                    unitCompleted
                      ? "linear-gradient(90deg,#d5a11d,#f2ca52)"
                      : "linear-gradient(90deg,#1ca76e,#63d49a)",
                  transition:
                    "width .5s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap: 10,
                marginTop: 14,
              }}
            >
              <StatusPill
                completed={
                  introCompleted
                }
                icon="🎯"
                text="التهيئة"
              />

              <StatusPill
                completed={
                  lessonOneCompleted
                }
                icon="🤝"
                text="صلة الرحم"
              />

              <StatusPill
                completed={
                  lessonTwoCompleted
                }
                icon="👴🏻"
                text="عذرًا يا جدي"
              />

              <StatusPill
                completed={
                  reviewCompleted
                }
                icon="📝"
                text="المراجعة"
              />
            </div>
          </div>
        </header>

        {/* عنوان الرحلة */}

        <section
          style={{
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#126a4b",
              fontSize:
                "clamp(25px,4vw,34px)",
            }}
          >
            🗺️ رحلتي في وحدة أقاربي
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#667d74",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            أكمل المحطات بالترتيب،
            وكل محطة تفتح لك المرحلة
            التالية.
          </p>
        </section>

        {/* بطاقات الوحدة */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 20,
          }}
        >
          {/* التهيئة */}

          <UnitCard
            icon="🎯"
            label="المحطة الأولى"
            title="مدخل الوحدة"
            description="تهيئة ممتعة تساعدك على التعرف إلى موضوع الوحدة والاستعداد لدروسها."
            color="#0878b5"
            light="#eef8ff"
            completed={
              introCompleted
            }
          >
            {introCompleted && (
              <SuccessBox text="✅ أكملت التهيئة وحصلت على نجمة التهيئة" />
            )}

            <Link
              href="/lessons/unit1/intro"
              style={getLinkStyle(
                introCompleted,
                "#0878b5"
              )}
            >
              {introCompleted
                ? "🔁 أعد التهيئة"
                : "🎯 ابدأ التهيئة"}
            </Link>
          </UnitCard>

          {/* الدرس الأول */}

          <UnitCard
            icon="🤝"
            label="الدرس الأول"
            title="صلة الرحم"
            description="رحلة من ست محطات تشمل القراءة والفهم والكلمات واللغة والإملاء والخط."
            color="#087a55"
            light="#eaf9f2"
            completed={
              lessonOneCompleted
            }
          >
            <div
              style={{
                marginBottom: 14,
                padding:
                  "10px 12px",
                borderRadius: 14,
                background:
                  lessonOneCompleted
                    ? "#fff7d8"
                    : "#f3faf7",
                border:
                  lessonOneCompleted
                    ? "1px solid #efd36c"
                    : "1px solid #d9ebe3",
                color:
                  lessonOneCompleted
                    ? "#806000"
                    : "#39715e",
                textAlign: "center",
                fontWeight: 900,
              }}
            >
              {lessonOneCompleted
                ? "🏆 أكملت المحطات الست"
                : `🚗 ${lessonOneCompletedCount} من 6 — ${lessonOneProgress}%`}
            </div>

            <Link
              href="/lessons/unit1/lesson1"
              style={getLinkStyle(
                lessonOneCompleted,
                "#087a55"
              )}
            >
              {lessonOneCompleted
                ? "🔁 أعد رحلة صلة الرحم"
                : lessonOneCompletedCount >
                    0
                  ? "🚀 تابع صلة الرحم"
                  : "🚀 ابدأ صلة الرحم"}
            </Link>
          </UnitCard>

          {/* الدرس الثاني */}

          <UnitCard
            icon="👴🏻"
            label="الدرس الثاني"
            title="عذرًا يا جدي"
            description="الدرس الثاني من وحدة أقاربي، وسنبني له رحلة تعليمية متكاملة مثل درس صلة الرحم."
            color="#7a4d9b"
            light="#f7f0fb"
            completed={
              lessonTwoCompleted
            }
          >
            {!lessonTwoUnlocked ? (
              <LockedBox text="أكمل درس صلة الرحم أولًا" />
            ) : lessonTwoCompleted ? (
              <>
                <SuccessBox text="✅ أكملت درس عذرًا يا جدي" />

                <div
                  style={{
                    padding:
                      "14px 16px",
                    borderRadius: 16,
                    textAlign:
                      "center",
                    background:
                      "#f5eff9",
                    color:
                      "#70428e",
                    fontWeight: 900,
                  }}
                >
                  🔁 الدرس الثاني مكتمل
                </div>
              </>
            ) : (
              <div
                style={{
                  padding:
                    "14px 16px",
                  borderRadius: 16,
                  textAlign:
                    "center",
                  background:
                    "#f4eef8",
                  color:
                    "#744c8d",
                  border:
                    "1px solid #e2d5ea",
                  fontWeight: 900,
                }}
              >
                🛠️ الدرس الثاني قيد التجهيز
              </div>
            )}
          </UnitCard>

          {/* المراجعة */}

          <UnitCard
            icon="📝"
            label="المحطة الأخيرة"
            title="مراجعة الوحدة"
            description="خمس محطات قصيرة لمراجعة أهم مهارات ومعارف درسي الوحدة."
            color="#a65c00"
            light="#fff9e9"
            completed={
              reviewCompleted
            }
          >
            {!reviewUnlocked ? (
              <LockedBox text="أكمل درسي الوحدة أولًا" />
            ) : (
              <>
                {reviewCompleted && (
                  <SuccessBox text="✅ أكملت مراجعة الوحدة بنجاح" />
                )}

                <Link
                  href="/lessons/unit1/review"
                  style={getLinkStyle(
                    reviewCompleted,
                    "#b67b08"
                  )}
                >
                  {reviewCompleted
                    ? "🔁 أعد مراجعة الوحدة"
                    : "📝 ابدأ مراجعة الوحدة"}
                </Link>
              </>
            )}
          </UnitCard>
        </div>

        {/* مكافأة الوحدة */}

        <section
          style={{
            marginTop: 25,
            padding:
              "34px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              unitCompleted
                ? "linear-gradient(135deg,#fff5bf,#ffffff,#fff0a6)"
                : "#ffffff",
            border:
              unitCompleted
                ? "3px solid #edc448"
                : "1px solid #dcebe5",
            boxShadow:
              "0 12px 30px rgba(30,90,65,.06)",
          }}
        >
          <div
            style={{
              fontSize: 66,
              opacity:
                unitCompleted
                  ? 1
                  : 0.45,
              filter:
                unitCompleted
                  ? "none"
                  : "grayscale(1)",
            }}
          >
            {unitCompleted
              ? "🏆"
              : "🌟"}
          </div>

          <h2
            style={{
              margin: "8px 0",
              color:
                unitCompleted
                  ? "#916300"
                  : "#315c4d",
              fontSize:
                "clamp(27px,4vw,34px)",
            }}
          >
            {unitCompleted
              ? "أحسنت! أكملت وحدة أقاربي"
              : "مكافأة الوحدة"}
          </h2>

          <p
            style={{
              maxWidth: 700,
              margin: "0 auto",
              color: "#697d75",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            {unitCompleted
              ? "أكملت التهيئة ودرسي الوحدة والمراجعة، وأصبحت تستحق نجمة الوحدة ووسام أقاربي."
              : "أكمل التهيئة ودرس صلة الرحم ودرس عذرًا يا جدي ومراجعة الوحدة لتحصل على المكافأة."}
          </p>

          {unitCompleted ? (
            <div
              style={{
                maxWidth: 600,
                margin:
                  "20px auto 0",
                padding:
                  "18px 20px",
                borderRadius: 21,
                background: "#ffffff",
                border:
                  "2px solid #e9ca66",
                color: "#865f00",
                fontWeight: 900,
                fontSize: 18,
                lineHeight: 1.9,
              }}
            >
              🌟 نجمة الوحدة
              <br />
              🏅 وسام «أقاربي»
            </div>
          ) : (
            <div
              style={{
                display:
                  "inline-block",
                marginTop: 16,
                padding:
                  "9px 16px",
                borderRadius: 999,
                background:
                  "#f0f5f2",
                color: "#718179",
                fontWeight: 900,
              }}
            >
              🔒 بقي{" "}
              {4 -
                unitCompletedSteps}{" "}
              {4 -
                unitCompletedSteps ===
              1
                ? "مرحلة"
                : "مراحل"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function UnitCard({
  icon,
  label,
  title,
  description,
  color,
  light,
  completed = false,
  children,
}: {
  icon: string;
  label: string;
  title: string;
  description: string;
  color: string;
  light: string;
  completed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      style={{
        position: "relative",
        padding: 24,
        borderRadius: 28,
        background: "#ffffff",
        border: completed
          ? "2px solid #39b87c"
          : "1px solid #dfeae5",
        boxShadow:
          completed
            ? "0 14px 35px rgba(20,150,95,.10)"
            : "0 10px 28px rgba(30,80,60,.06)",
      }}
    >
      {completed && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            padding: "6px 10px",
            borderRadius: 999,
            background: "#159765",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          ✅ مكتملة
        </div>
      )}

      <div
        style={{
          width: 72,
          height: 72,
          display: "grid",
          placeItems: "center",
          marginBottom: 20,
          borderRadius: 21,
          background: light,
          fontSize: 36,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginBottom: 7,
          color,
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        {label}
      </div>

      <h2
        style={{
          margin: "0 0 10px",
          color,
          fontSize: 26,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          minHeight: 105,
          margin: "0 0 18px",
          color: "#667d74",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        {description}
      </p>

      {children}
    </article>
  );
}

function SuccessBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: "10px 12px",
        borderRadius: 14,
        background: "#edf9f3",
        border:
          "1px solid #c9e8d8",
        color: "#176c46",
        textAlign: "center",
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}

function LockedBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        textAlign: "center",
        background: "#eef1ef",
        color: "#8b9691",
        fontWeight: 900,
      }}
    >
      🔒 {text}
    </div>
  );
}

function StatusPill({
  completed,
  text,
  icon,
}: {
  completed: boolean;
  text: string;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        textAlign: "center",
        background:
          completed
            ? "#edf9f3"
            : "#f4f6f5",
        border:
          completed
            ? "1px solid #c7e8d7"
            : "1px solid #e3e8e5",
        color:
          completed
            ? "#176c46"
            : "#87938e",
        fontWeight: 900,
      }}
    >
      {icon} {text}{" "}
      {completed
        ? "✅"
        : "⏳"}
    </div>
  );
}

function getLinkStyle(
  completed: boolean,
  color: string
): React.CSSProperties {
  return {
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    padding: "14px 16px",
    borderRadius: 16,
    background: completed
      ? "#eef8f3"
      : color,
    color: completed
      ? "#176c46"
      : "#ffffff",
    border: completed
      ? "1px solid #cfe7dc"
      : "none",
    fontWeight: 900,
    fontSize: 17,
  };
}