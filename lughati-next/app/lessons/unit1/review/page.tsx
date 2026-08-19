"use client";
import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

const REVIEW_STORAGE_KEY =
  "lughati-unit1-review-completed";

type ReviewStep =
  | 1
  | 2
  | 3
  | 4
  | 5;

export default function UnitOneReviewPage() {
  const [step, setStep] =
    useState<ReviewStep>(1);

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

const [
  completed,
  setCompleted,
] = useState(() => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(
      REVIEW_STORAGE_KEY
    ) === "true"
  );
});

  const progress = useMemo(() => {
    if (completed) {
      return 100;
    }

    return Math.round(
      ((step - 1) / 5) * 100
    );
  }, [step, completed]);

  function success(
    nextStep?: ReviewStep
  ) {
    setMessage(
      "🌟 أحسنت يا بطل! إجابة صحيحة."
    );

    if (nextStep) {
      window.setTimeout(() => {
        setAnswer("");
        setMessage("");
        setStep(nextStep);
      }, 650);
    }
  }

  function checkStepOne() {
    if (
      answer ===
      "زيارة الأقارب"
    ) {
      success(2);
    } else {
      setMessage(
        "💡 فكر مرة أخرى: ما العمل الذي يدل على صلة الرحم؟"
      );
    }
  }

  function checkStepTwo() {
    if (
      answer ===
      "القريب"
    ) {
      success(3);
    } else {
      setMessage(
        "💡 حاول مرة أخرى يا بطل."
      );
    }
  }

  function checkStepThree() {
    if (
      answer ===
      "الشمسية"
    ) {
      success(4);
    } else {
      setMessage(
        "🔎 راجع مهارة اللام الشمسية والقمرية."
      );
    }
  }

  function checkStepFour() {
    if (
      answer.trim() ===
      "الرحم"
    ) {
      success(5);
    } else {
      setMessage(
        "✍️ اكتب الكلمة المطلوبة كما تعلمتها في الدرس."
      );
    }
  }

  function finishReview() {
    if (
      answer ===
      "صلة الرحم"
    ) {
      localStorage.setItem(
        REVIEW_STORAGE_KEY,
        "true"
      );

      setCompleted(true);

      setMessage(
        "🎉 رائع! أكملت مراجعة وحدة أقاربي بنجاح."
      );
    } else {
      setMessage(
        "🦸 فارس يقول: تذكّر اسم الدرس الذي تعلمنا فيه التواصل مع الأقارب."
      );
    }
  }

  function restartReview() {
    setStep(1);
    setAnswer("");
    setMessage("");
    setCompleted(false);

    localStorage.removeItem(
      REVIEW_STORAGE_KEY
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "28px 16px 70px",
        background:
          "linear-gradient(180deg,#effcf7 0%,#f5fbff 52%,#fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f32",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {/* التنقل */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <Link
            href="/lessons/unit1"
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
                "1px solid #d4e8df",
              fontWeight: 900,
            }}
          >
            ← العودة إلى وحدة أقاربي
          </Link>

          <span
            style={{
              padding:
                "8px 14px",
              borderRadius: 999,
              background:
                "#fff7d8",
              color: "#8a6500",
              border:
                "1px solid #efd36c",
              fontWeight: 900,
            }}
          >
            📝 مراجعة الوحدة
          </span>
        </div>

        {/* الرأس */}

        <section
          style={{
            padding:
              "34px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#fff8dc,#ffffff,#edf9f3)",
            border:
              "2px solid #ecd378",
            boxShadow:
              "0 14px 35px rgba(120,90,20,.08)",
          }}
        >
          <div
            style={{
              fontSize: 62,
            }}
          >
            📝
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color: "#8a6500",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            مراجعة وحدة أقاربي
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              color: "#6f705f",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            خمس محطات قصيرة تساعدك
            على تذكر أهم ما تعلمته
            والاستعداد لمكافأة الوحدة.
          </p>
        </section>

        {/* التقدم */}

        <section
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 22,
            background: "#ffffff",
            border:
              "1px solid #e2ebe6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <strong
              style={{
                color: "#176c46",
              }}
            >
              🚀 تقدمي في المراجعة
            </strong>

            <strong
              style={{
                color: "#176c46",
              }}
            >
              {completed
                ? "5 من 5"
                : `${step} من 5`}
            </strong>
          </div>

          <div
            style={{
              height: 15,
              borderRadius: 999,
              background: "#e4ede9",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width:
                  `${progress}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg,#23a76d,#67d899)",
                transition:
                  "width .4s ease",
              }}
            />
          </div>
        </section>

        {/* المراجعة */}

        <section
          style={{
            marginTop: 20,
            padding:
              "28px 20px",
            borderRadius: 28,
            background: "#ffffff",
            border:
              "1px solid #dfece6",
            boxShadow:
              "0 12px 30px rgba(30,80,60,.06)",
          }}
        >
          {completed ? (
            <CompletionCard
              restartReview={
                restartReview
              }
            />
          ) : (
            <>
              {step === 1 && (
                <ChoiceStage
                  icon="🧠"
                  number="1"
                  title="أفهم"
                  question="أي عمل من الآتي يدل على صلة الرحم؟"
                  options={[
  "تجاهل الأقارب",
  "زيارة الأقارب",
  "عدم السؤال عنهم",
]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStepOne
                  }
                />
              )}

              {step === 2 && (
                <ChoiceStage
                  icon="💎"
                  number="2"
                  title="كنز الكلمات"
                  question="ما الكلمة التي تدل على شخص من الأسرة أو العائلة؟"
                 options={[
  "الكتاب",
  "المدرسة",
  "القريب",
]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStepTwo
                  }
                />
              )}

              {step === 3 && (
                <ChoiceStage
                  icon="🔎"
                  number="3"
                  title="مكتشف اللغة"
                  question="كلمة «الرَّحم» تبدأ بلام..."
   options={[
  "القمرية",
  "الشمسية",
  "لا أعرف",
]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStepThree
                  }
                />
              )}

              {step === 4 && (
                <SpellingStage
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStepFour
                  }
                />
              )}

              {step === 5 && (
                <ChoiceStage
                  icon="🦸"
                  number="5"
                  title="تحدي فارس"
                  question="ما اسم الدرس الذي تعلمنا فيه التواصل مع الأقارب والإحسان إليهم؟"
                 options={[
  "أصدقائي",
  "صلة الرحم",
  "المدرسة",
]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    finishReview
                  }
                  buttonText="🏆 إنهاء مراجعة الوحدة"
                />
              )}
            </>
          )}

          {message && (
            <div
              style={{
                marginTop: 18,
                padding:
                  "14px 16px",
                borderRadius: 17,
                background:
                  "#edf9f3",
                color: "#176c46",
                textAlign: "center",
                fontWeight: 900,
                lineHeight: 1.8,
              }}
            >
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ChoiceStage({
  icon,
  number,
  title,
  question,
  options,
  answer,
  setAnswer,
  onCheck,
  buttonText = "تحقق من إجابتي",
}: {
  icon: string;
  number: string;
  title: string;
  question: string;
  options: string[];
  answer: string;
  setAnswer: (
    value: string
  ) => void;
  onCheck: () => void;
  buttonText?: string;
}) {
  return (
    <>
      <StageTitle
        icon={icon}
        number={number}
        title={title}
        question={question}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginTop: 22,
        }}
      >
        {options.map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setAnswer(
                  option
                )
              }
              style={{
                minHeight: 110,
                padding: 14,
                borderRadius: 20,
                border:
                  answer === option
                    ? "2px solid #22a66c"
                    : "1px solid #dfe9e4",
                background:
                  answer === option
                    ? "#eaf9f1"
                    : "#ffffff",
                color: "#173f32",
                fontWeight: 900,
                fontSize: 17,
                cursor: "pointer",
              }}
            >
              {answer ===
                option && (
                <div
                  style={{
                    marginBottom: 6,
                    color:
                      "#16835f",
                  }}
                >
                  ✅
                </div>
              )}

              {option}
            </button>
          )
        )}
      </div>

      <ActionButton
        disabled={!answer}
        onClick={onCheck}
        text={buttonText}
      />
    </>
  );
}

function SpellingStage({
  answer,
  setAnswer,
  onCheck,
}: {
  answer: string;
  setAnswer: (
    value: string
  ) => void;
  onCheck: () => void;
}) {
  return (
    <>
      <StageTitle
        icon="✍️"
        number="4"
        title="إملائي"
        question="أكمل الكلمة: صلة الـ..."
      />

      <div
        style={{
          maxWidth: 520,
          margin:
            "24px auto 0",
        }}
      >
        <input
          value={answer}
          onChange={(event) =>
            setAnswer(
              event.target.value
            )
          }
          placeholder="اكتب الكلمة هنا"
          style={{
            width: "100%",
            boxSizing:
              "border-box",
            padding:
              "16px 18px",
            borderRadius: 17,
            border:
              "2px solid #d8e7df",
            fontSize: 20,
            textAlign: "center",
            outline: "none",
            color: "#173f32",
            fontWeight: 900,
          }}
        />
      </div>

      <ActionButton
        disabled={
          !answer.trim()
        }
        onClick={onCheck}
        text="✍️ تحقق من كتابتي"
      />
    </>
  );
}

function StageTitle({
  icon,
  number,
  title,
  question,
}: {
  icon: string;
  number: string;
  title: string;
  question: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 54,
        }}
      >
        {icon}
      </div>

      <span
        style={{
          display:
            "inline-block",
          marginTop: 6,
          padding:
            "5px 11px",
          borderRadius: 999,
          background:
            "#eef8f3",
          color: "#176c46",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        المحطة {number}
      </span>

      <h2
        style={{
          margin:
            "10px 0 8px",
          color: "#176c46",
          fontSize: 28,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          maxWidth: 650,
          margin: "0 auto",
          color: "#667d74",
          lineHeight: 1.9,
          fontWeight: 700,
          fontSize: 17,
        }}
      >
        {question}
      </p>
    </div>
  );
}

function ActionButton({
  disabled,
  onClick,
  text,
}: {
  disabled: boolean;
  onClick: () => void;
  text: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        maxWidth: 650,
        margin:
          "22px auto 0",
        padding:
          "15px 18px",
        border: "none",
        borderRadius: 17,
        background: disabled
          ? "#cbd5d0"
          : "linear-gradient(135deg,#168a63,#0f7654)",
        color: "#ffffff",
        fontSize: 17,
        fontWeight: 900,
        cursor: disabled
          ? "not-allowed"
          : "pointer",
      }}
    >
      {text}
    </button>
  );
}

function CompletionCard({
  restartReview,
}: {
  restartReview: () => void;
}) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 74,
        }}
      >
        🏆
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color: "#8a6500",
          fontSize:
            "clamp(30px,5vw,40px)",
        }}
      >
        أحسنت! أكملت وحدة أقاربي
      </h2>

      <p
        style={{
          maxWidth: 670,
          margin: "0 auto",
          color: "#667d74",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        أنهيت المراجعة بنجاح،
        وأثبت أنك تتذكر أهم مهارات
        ومعارف الوحدة.
      </p>

      <div
        style={{
          margin:
            "22px auto 14px",
          maxWidth: 650,
          padding:
            "18px",
          borderRadius: 20,
          background:
            "linear-gradient(135deg,#fff7cf,#fffdf3)",
          border:
            "2px solid #edca59",
          color: "#8a6500",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🌟 حصلت على نجمة الوحدة
        <br />
        🏅 وسام «أقاربي»
      </div>

      <Link
        href="/lessons/unit1"
        style={{
          display: "block",
          maxWidth: 650,
          margin: "0 auto",
          padding:
            "16px 18px",
          borderRadius: 18,
          textDecoration:
            "none",
          background:
            "linear-gradient(135deg,#168a63,#0f7654)",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🏡 العودة إلى وحدة أقاربي
      </Link>

      <button
        type="button"
        onClick={
          restartReview
        }
        style={{
          marginTop: 14,
          padding:
            "10px 16px",
          borderRadius: 14,
          border:
            "1px solid #dbe7e1",
          background: "#ffffff",
          color: "#657d74",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        🔁 إعادة المراجعة
      </button>
    </div>
  );
}