"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY =
  "lughati-unit1-intro-completed";

const relatives = [
  {
    id: "grandfather",
    icon: "👴🏻",
    label: "جدي",
    correct: true,
  },
  {
    id: "uncle",
    icon: "👨🏻",
    label: "عمي",
    correct: true,
  },
  {
    id: "aunt",
    icon: "👩🏻",
    label: "خالتي",
    correct: true,
  },
  {
    id: "teacher",
    icon: "👨‍🏫",
    label: "معلمي",
    correct: false,
  },
];

const goodActions = [
  {
    id: "visit",
    icon: "🏠",
    label: "أزور أقاربي",
    correct: true,
  },
  {
    id: "ask",
    icon: "📞",
    label: "أسأل عنهم",
    correct: true,
  },
  {
    id: "help",
    icon: "🤝",
    label: "أساعدهم",
    correct: true,
  },
  {
    id: "ignore",
    icon: "🙈",
    label: "أتجاهلهم",
    correct: false,
  },
];

export default function UnitOneIntroPage() {
  const [step, setStep] =
    useState(1);

  const [
    firstAnswer,
    setFirstAnswer,
  ] = useState("");

  const [
    selectedRelatives,
    setSelectedRelatives,
  ] = useState<string[]>([]);

  const [
    selectedActions,
    setSelectedActions,
  ] = useState<string[]>([]);

  const [
    finalAnswer,
    setFinalAnswer,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    completed,
    setCompleted,
  ] = useState(false);

  useEffect(() => {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (saved === "true") {
      setCompleted(true);
    }
  }, []);

  const progress =
    useMemo(() => {
      if (completed) {
        return 100;
      }

      return Math.round(
        ((step - 1) / 4) *
          100
      );
    }, [
      step,
      completed,
    ]);

  function nextFromFirst() {
    if (
      firstAnswer ===
      "contact"
    ) {
      setMessage(
        "🌟 رائع! السؤال عن الأقارب والتواصل معهم من أجمل صور صلة الرحم."
      );

      window.setTimeout(
        () => {
          setMessage("");
          setStep(2);
        },
        650
      );

      return;
    }

    setMessage(
      "💡 فكّر مرة أخرى يا بطل. ماذا نستطيع أن نفعل عندما نشتاق إلى أحد أقاربنا؟"
    );
  }

  function toggleRelative(
    id: string
  ) {
    setSelectedRelatives(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );

    setMessage("");
  }

  function checkRelatives() {
    const correctIds =
      relatives
        .filter(
          (item) =>
            item.correct
        )
        .map(
          (item) => item.id
        );

    const correct =
      selectedRelatives.length ===
        correctIds.length &&
      correctIds.every(
        (id) =>
          selectedRelatives.includes(
            id
          )
      );

    if (!correct) {
      setMessage(
        "💡 أحسنت المحاولة. اختر أفراد الأسرة والأقارب فقط."
      );

      return;
    }

    setMessage(
      "👏 ممتاز! عرفت أقاربك جيدًا."
    );

    window.setTimeout(
      () => {
        setMessage("");
        setStep(3);
      },
      650
    );
  }

  function toggleAction(
    id: string
  ) {
    setSelectedActions(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );

    setMessage("");
  }

  function checkActions() {
    const correctIds =
      goodActions
        .filter(
          (item) =>
            item.correct
        )
        .map(
          (item) => item.id
        );

    const correct =
      selectedActions.length ===
        correctIds.length &&
      correctIds.every(
        (id) =>
          selectedActions.includes(
            id
          )
      );

    if (!correct) {
      setMessage(
        "🦸 فارس يقول: اختر الأعمال التي تدل على المحبة والاهتمام بالأقارب."
      );

      return;
    }

    setMessage(
      "💚 رائع! هذه أفعال جميلة تقوي المحبة بين الأقارب."
    );

    window.setTimeout(
      () => {
        setMessage("");
        setStep(4);
      },
      650
    );
  }

  function finishIntro() {
    if (
      finalAnswer !==
      "صلة الرحم"
    ) {
      setMessage(
        "💡 حاول مرة أخرى. ما اسم المحافظة على التواصل والإحسان إلى الأقارب؟"
      );

      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      "true"
    );

    setCompleted(true);

    setMessage(
      "🎉 أحسنت يا بطل! أصبحت جاهزًا لدرس صلة الرحم."
    );
  }

  function restartIntro() {
    setStep(1);
    setFirstAnswer("");
    setSelectedRelatives([]);
    setSelectedActions([]);
    setFinalAnswer("");
    setMessage("");
    setCompleted(false);

    localStorage.removeItem(
      STORAGE_KEY
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
          "linear-gradient(180deg,#effcf7 0%,#f4f9ff 52%,#fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f32",
      }}
    >
      <div
        style={{
          width: "100%",
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
            alignItems: "center",
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
                "1px solid #d1e7dc",
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
                "#ffffff",
              color: "#176c46",
              border:
                "1px solid #dbece4",
              fontWeight: 900,
            }}
          >
            🎯 مدخل الوحدة
          </span>
        </div>

        {/* رأس الصفحة */}

        <section
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            padding:
              "34px 22px",
            borderRadius: 31,
            background:
              "linear-gradient(135deg,#e9fff4,#ffffff,#fff6d7)",
            border:
              "2px solid #cfe9dc",
            boxShadow:
              "0 14px 35px rgba(25,90,65,.08)",
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              fontSize: 62,
            }}
          >
            👨‍👩‍👧‍👦
          </div>

          <div
            style={{
              display:
                "inline-block",
              marginTop: 8,
              padding:
                "6px 12px",
              borderRadius: 999,
              background:
                "#e6f8ee",
              color: "#16835f",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            الوحدة الأولى
          </div>

          <h1
            style={{
              margin:
                "10px 0 7px",
              color: "#155e45",
              fontSize:
                "clamp(31px,5vw,45px)",
            }}
          >
            أقاربي
          </h1>

          <p
            style={{
              maxWidth: 650,
              margin:
                "0 auto",
              color: "#657d74",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            رحلة قصيرة مع فارس
            نتعرف فيها على أقاربنا
            وكيف نحافظ على محبتهم
            والتواصل معهم.
          </p>
        </section>

        {/* التقدم */}

        <section
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 22,
            background:
              "#ffffff",
            border:
              "1px solid #deebe5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 10,
              marginBottom: 11,
              flexWrap: "wrap",
            }}
          >
            <strong
              style={{
                color:
                  "#176c46",
              }}
            >
              🚀 تقدمي في التهيئة
            </strong>

            <strong
              style={{
                color:
                  "#176c46",
              }}
            >
              {completed
                ? "4 من 4"
                : `${step} من 4`}
            </strong>
          </div>

          <div
            style={{
              height: 15,
              borderRadius: 999,
              overflow: "hidden",
              background:
                "#e4ede9",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  `${progress}%`,
                borderRadius:
                  999,
                background:
                  "linear-gradient(90deg,#24a66c,#69d79a)",
                transition:
                  "width .4s ease",
              }}
            />
          </div>
        </section>

        {/* المحتوى */}

        <section
          style={{
            marginTop: 20,
            padding:
              "26px 20px",
            borderRadius: 29,
            background:
              "#ffffff",
            border:
              "1px solid #dfece6",
            boxShadow:
              "0 12px 30px rgba(30,80,60,.06)",
          }}
        >
          {completed ? (
            <CompletionCard
              restartIntro={
                restartIntro
              }
            />
          ) : (
            <>
              {step === 1 && (
                <StepOne
                  value={
                    firstAnswer
                  }
                  setValue={
                    setFirstAnswer
                  }
                  onNext={
                    nextFromFirst
                  }
                />
              )}

              {step === 2 && (
                <StepTwo
                  selected={
                    selectedRelatives
                  }
                  toggle={
                    toggleRelative
                  }
                  onNext={
                    checkRelatives
                  }
                />
              )}

              {step === 3 && (
                <StepThree
                  selected={
                    selectedActions
                  }
                  toggle={
                    toggleAction
                  }
                  onNext={
                    checkActions
                  }
                />
              )}

              {step === 4 && (
                <StepFour
                  value={
                    finalAnswer
                  }
                  setValue={
                    setFinalAnswer
                  }
                  onFinish={
                    finishIntro
                  }
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
                textAlign:
                  "center",
                background:
                  "#edf9f3",
                color:
                  "#176c46",
                fontWeight: 900,
                lineHeight: 1.8,
              }}
            >
              {message}
            </div>
          )}
        </section>

        {/* فارس */}

        {!completed && (
          <section
            style={{
              marginTop: 18,
              padding:
                "17px 19px",
              borderRadius: 22,
              background:
                "linear-gradient(135deg,#eaf9f1,#ffffff)",
              border:
                "1px solid #cfe8da",
              display: "flex",
              gap: 13,
              alignItems:
                "center",
            }}
          >
            <span
              style={{
                fontSize: 35,
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
                    "#657d74",
                  lineHeight: 1.7,
                  fontWeight: 700,
                }}
              >
                فكر جيدًا، ولا تقلق
                من الخطأ… كل محاولة
                تجعلك أقوى 🌟
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StepOne({
  value,
  setValue,
  onNext,
}: {
  value: string;
  setValue: (
    value: string
  ) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StageTitle
        icon="👀"
        number="1"
        title="انظر وفكّر"
        description="اشتقت إلى أحد أقاربك ولم تره منذ فترة، ماذا يمكنك أن تفعل؟"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        <ChoiceButton
          selected={
            value ===
            "contact"
          }
          icon="📞"
          text="أتصل به وأسأل عنه"
          onClick={() =>
            setValue(
              "contact"
            )
          }
        />

        <ChoiceButton
          selected={
            value ===
            "ignore"
          }
          icon="🙈"
          text="لا أهتم"
          onClick={() =>
            setValue(
              "ignore"
            )
          }
        />

        <ChoiceButton
          selected={
            value ===
            "forget"
          }
          icon="🎮"
          text="أنشغل وأنساه"
          onClick={() =>
            setValue(
              "forget"
            )
          }
        />
      </div>

      <NextButton
        disabled={!value}
        onClick={onNext}
        text="تحقق من إجابتي"
      />
    </>
  );
}

function StepTwo({
  selected,
  toggle,
  onNext,
}: {
  selected: string[];
  toggle: (
    id: string
  ) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StageTitle
        icon="👨‍👩‍👧"
        number="2"
        title="من أقاربي؟"
        description="اختر الأشخاص الذين يعدّون من أقاربك."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        {relatives.map(
          (person) => (
            <ChoiceButton
              key={
                person.id
              }
              selected={
                selected.includes(
                  person.id
                )
              }
              icon={
                person.icon
              }
              text={
                person.label
              }
              onClick={() =>
                toggle(
                  person.id
                )
              }
            />
          )
        )}
      </div>

      <NextButton
        disabled={
          selected.length ===
          0
        }
        onClick={onNext}
        text="تحقق من اختياراتي"
      />
    </>
  );
}

function StepThree({
  selected,
  toggle,
  onNext,
}: {
  selected: string[];
  toggle: (
    id: string
  ) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StageTitle
        icon="💚"
        number="3"
        title="ماذا أفعل مع أقاربي؟"
        description="اختر الأعمال الجميلة التي تقوي المحبة والتواصل بين الأقارب."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        {goodActions.map(
          (action) => (
            <ChoiceButton
              key={
                action.id
              }
              selected={
                selected.includes(
                  action.id
                )
              }
              icon={
                action.icon
              }
              text={
                action.label
              }
              onClick={() =>
                toggle(
                  action.id
                )
              }
            />
          )
        )}
      </div>

      <NextButton
        disabled={
          selected.length ===
          0
        }
        onClick={onNext}
        text="تحقق من اختياراتي"
      />
    </>
  );
}

function StepFour({
  value,
  setValue,
  onFinish,
}: {
  value: string;
  setValue: (
    value: string
  ) => void;
  onFinish: () => void;
}) {
  const answers = [
    "صلة الرحم",
    "القراءة",
    "اللعب",
  ];

  return (
    <>
      <StageTitle
        icon="🦸"
        number="4"
        title="تحدي فارس"
        description="ما اسم التواصل مع الأقارب والسؤال عنهم وزيارتهم والإحسان إليهم؟"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        {answers.map(
          (answer) => (
            <ChoiceButton
              key={answer}
              selected={
                value === answer
              }
              icon={
                answer ===
                "صلة الرحم"
                  ? "🤝"
                  : answer ===
                      "القراءة"
                    ? "📖"
                    : "🎮"
              }
              text={answer}
              onClick={() =>
                setValue(
                  answer
                )
              }
            />
          )
        )}
      </div>

      <NextButton
        disabled={!value}
        onClick={
          onFinish
        }
        text="🏆 إنهاء التهيئة"
      />
    </>
  );
}

function StageTitle({
  icon,
  number,
  title,
  description,
}: {
  icon: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize: 52,
        }}
      >
        {icon}
      </div>

      <span
        style={{
          display:
            "inline-block",
          marginTop: 7,
          padding:
            "5px 10px",
          borderRadius: 999,
          background:
            "#eaf8f1",
          color: "#16835f",
          fontWeight: 900,
          fontSize: 12,
        }}
      >
        المحطة {number}
      </span>

      <h2
        style={{
          margin:
            "10px 0 7px",
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
        }}
      >
        {description}
      </p>
    </div>
  );
}

function ChoiceButton({
  selected,
  icon,
  text,
  onClick,
}: {
  selected: boolean;
  icon: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 125,
        padding: 14,
        borderRadius: 20,
        border: selected
          ? "2px solid #22a66c"
          : "1px solid #dfe9e4",
        background: selected
          ? "#eaf9f1"
          : "#ffffff",
        cursor: "pointer",
        color: "#173f32",
      }}
    >
      <div
        style={{
          fontSize: 38,
        }}
      >
        {icon}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: 8,
          fontSize: 16,
        }}
      >
        {text}
      </strong>

      {selected && (
        <div
          style={{
            marginTop: 6,
            color:
              "#16835f",
            fontWeight: 900,
          }}
        >
          ✅ اخترت هذا
        </div>
      )}
    </button>
  );
}

function NextButton({
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
  restartIntro,
}: {
  restartIntro: () => void;
}) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 72,
        }}
      >
        🎉
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color: "#176c46",
          fontSize:
            "clamp(28px,5vw,38px)",
        }}
      >
        أحسنت يا بطل!
      </h2>

      <p
        style={{
          maxWidth: 650,
          margin: "0 auto",
          color: "#657d74",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        أكملت تهيئة وحدة
        «أقاربي»، وأصبحت جاهزًا
        للانطلاق إلى درس صلة
        الرحم.
      </p>

      <div
        style={{
          margin:
            "22px auto",
          maxWidth: 650,
          padding: 17,
          borderRadius: 20,
          background:
            "linear-gradient(135deg,#fff7d5,#fffdf3)",
          border:
            "2px solid #efd269",
          color: "#866100",
          fontWeight: 900,
        }}
      >
        ⭐ حصلت على نجمة التهيئة
      </div>

      <Link
        href="/lessons/unit1/lesson1"
        style={{
          display: "block",
          maxWidth: 650,
          margin:
            "0 auto",
          padding:
            "16px 18px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg,#168a63,#0f7654)",
          color: "#ffffff",
          textDecoration:
            "none",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🚀 ابدأ درس صلة الرحم
      </Link>

      <button
        type="button"
        onClick={
          restartIntro
        }
        style={{
          marginTop: 14,
          padding:
            "10px 16px",
          borderRadius: 14,
          background:
            "#ffffff",
          border:
            "1px solid #dbe7e1",
          color: "#657d74",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        🔁 إعادة التهيئة
      </button>
    </div>
  );
}