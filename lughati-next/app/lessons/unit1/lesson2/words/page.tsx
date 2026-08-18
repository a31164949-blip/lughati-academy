"use client";

import Link from "next/link";
import {
  useMemo,
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

type WordItem = {
  word: string;
  icon: string;
  meaning: string;
  example: string;
};

const words: WordItem[] = [
  {
    word: "عَطُوفٌ",
    icon: "💚",
    meaning:
      "رحيمٌ ومحبٌّ ويعامل الآخرين بلطف.",
    example:
      "جَدِّي عَطُوفٌ وَحَنُونٌ.",
  },
  {
    word: "تَعْتَذِرُ",
    icon: "🤝",
    meaning:
      "تطلب السماح عندما تخطئ.",
    example:
      "أَعْتَذِرُ عِنْدَمَا أُخْطِئُ.",
  },
  {
    word: "طَاعَةٌ",
    icon: "✅",
    meaning:
      "الاستجابة للأمر الصحيح وتنفيذه.",
    example:
      "أَحْرِصُ عَلَى طَاعَةِ وَالِدَيَّ.",
  },
  {
    word: "صَحِبَ",
    icon: "🚶‍♂️",
    meaning:
      "رافق وذهب معه.",
    example:
      "صَحِبَ الْمُعَلِّمُ التَّلَامِيذَ إِلَى الْمَكْتَبَةِ.",
  },
];

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

function completeWordsStation() {
  const current =
    getProgress();

  if (
    current.includes("words")
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...current,
      "words",
    ])
  );
}

export default function LessonTwoWordsPage() {
  const [stage, setStage] =
    useState(1);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    matchAnswers,
    setMatchAnswers,
  ] = useState<
    Record<string, string>
  >({});

  const [
    sentenceAnswer,
    setSentenceAnswer,
  ] = useState("");

  const [
    finished,
    setFinished,
  ] = useState(false);

  const progress =
    useMemo(() => {
      if (finished) {
        return 100;
      }

      return Math.round(
        ((stage - 1) / 4) *
          100
      );
    }, [stage, finished]);

  function checkMeaning() {
    if (
      selectedAnswer ===
      "رحيم ومحب"
    ) {
      setMessage(
        "🌟 أحسنت! «عطوف» تعني رحيمًا ومحبًّا ويعامل الآخرين بلطف."
      );

      window.setTimeout(() => {
        setMessage("");
        setSelectedAnswer("");
        setStage(3);
      }, 700);

      return;
    }

    setMessage(
      "💡 حاول مرة أخرى. تذكّر وصف الجد في القصة."
    );
  }

  function checkMatching() {
    const correct =
      matchAnswers["صَحِبَ"] ===
        "رافق" &&
      matchAnswers["طَاعَةٌ"] ===
        "الاستجابة للأمر الصحيح" &&
      matchAnswers[
        "تَعْتَذِرُ"
      ] ===
        "تطلب السماح" &&
      matchAnswers["عَطُوفٌ"] ===
        "رحيم ومحب";

    if (!correct) {
      setMessage(
        "💡 يوجد اختيار يحتاج إلى مراجعة. اقرأ الكلمات ومعانيها مرة أخرى."
      );

      return;
    }

    setMessage(
      "🎉 ممتاز! طابقت جميع الكلمات بمعانيها."
    );

    window.setTimeout(() => {
      setMessage("");
      setStage(4);
    }, 700);
  }

  function finishStation() {
    if (
      sentenceAnswer !==
      "أعتذر"
    ) {
      setMessage(
        "💡 اختر الكلمة التي تعبّر عن طلب السماح عند الخطأ."
      );

      return;
    }

    completeWordsStation();

    setFinished(true);

    setMessage(
      "🏆 أحسنت! أتممت كنز الكلمات."
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
          "linear-gradient(180deg,#fff9e8 0%,#f8fbff 52%,#effcf7 100%)",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f32",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        {/* التنقل */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 12,
            flexWrap: "wrap",
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
              color:
                "#a65c00",
              border:
                "1px solid #eddcb2",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <span
            style={{
              padding:
                "8px 14px",
              borderRadius: 999,
              background:
                "#fff4cd",
              color:
                "#9a6500",
              fontWeight: 900,
            }}
          >
            💎 المحطة الثالثة
          </span>
        </div>

        {/* الرأس */}

        <header
          style={{
            padding:
              "32px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#fff8d7,#ffffff,#eef9f4)",
            border:
              "2px solid #efd68a",
            boxShadow:
              "0 12px 34px rgba(150,100,20,.07)",
          }}
        >
          <div
            style={{
              fontSize: 65,
            }}
          >
            💎
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color:
                "#9b6100",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            كنز الكلمات
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              color:
                "#706957",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            اكتشف كلمات قصة «عذرًا يا
            جدي»، وافهم معانيها، ثم استخدمها
            في مواقف جديدة.
          </p>
        </header>

        {/* شريط التقدم */}

        <section
          style={{
            marginTop: 18,
            padding: 17,
            borderRadius: 21,
            background: "#ffffff",
            border:
              "1px solid #eadfbe",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              marginBottom: 10,
              fontWeight: 900,
              color:
                "#9a6500",
            }}
          >
            <span>
              💎 تقدمي في الكنز
            </span>

            <span>
              {finished
                ? "4 من 4"
                : `${stage} من 4`}
            </span>
          </div>

          <div
            style={{
              height: 14,
              background:
                "#eee9dc",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  `${progress}%`,
                background:
                  "linear-gradient(90deg,#d88a00,#f2b42f)",
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
              "28px 20px",
            borderRadius: 30,
            background: "#ffffff",
            border:
              "1px solid #e7dfc8",
            boxShadow:
              "0 12px 30px rgba(100,80,30,.06)",
          }}
        >
          {finished ? (
            <FinishCard />
          ) : (
            <>
              {stage === 1 && (
                <ExploreWords
                  onNext={() =>
                    setStage(2)
                  }
                />
              )}

              {stage === 2 && (
                <MeaningChallenge
                  selected={
                    selectedAnswer
                  }
                  setSelected={
                    setSelectedAnswer
                  }
                  onCheck={
                    checkMeaning
                  }
                />
              )}

              {stage === 3 && (
                <MatchingChallenge
                  answers={
                    matchAnswers
                  }
                  setAnswers={
                    setMatchAnswers
                  }
                  onCheck={
                    checkMatching
                  }
                />
              )}

              {stage === 4 && (
                <SentenceChallenge
                  answer={
                    sentenceAnswer
                  }
                  setAnswer={
                    setSentenceAnswer
                  }
                  onFinish={
                    finishStation
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
                background:
                  "#edf9f3",
                border:
                  "1px solid #cee8db",
                color:
                  "#176c46",
                textAlign: "center",
                fontWeight: 900,
                lineHeight: 1.8,
              }}
            >
              {message}
            </div>
          )}
        </section>

        {!finished && (
          <section
            style={{
              marginTop: 18,
              padding:
                "16px 18px",
              borderRadius: 21,
              background:
                "#fff9e8",
              border:
                "1px solid #eadcaf",
              display: "flex",
              alignItems:
                "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 34,
              }}
            >
              🦸
            </span>

            <p
              style={{
                margin: 0,
                color:
                  "#806000",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              فارس يقول: فهم الكلمة أهم من
              حفظها؛ حاول أن تتخيل موقفًا
              تستخدم فيه كل كلمة.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function ExploreWords({
  onNext,
}: {
  onNext: () => void;
}) {
  return (
    <>
      <StageTitle
        icon="🔦"
        title="اكتشف الكلمات"
        text="اقرأ الكلمة ومعناها والمثال، ثم حاول أن تقولها بصوت واضح."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(210px,1fr))",
          gap: 14,
          marginTop: 22,
        }}
      >
        {words.map((item) => (
          <article
            key={item.word}
            style={{
              padding: 18,
              borderRadius: 21,
              background:
                "#fffdf5",
              border:
                "1px solid #ead9a2",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 39,
              }}
            >
              {item.icon}
            </div>

            <h3
              style={{
                color:
                  "#9a6200",
                fontSize: 24,
                margin:
                  "10px 0",
              }}
            >
              {item.word}
            </h3>

            <p
              style={{
                color:
                  "#665f4d",
                lineHeight: 1.8,
                fontWeight: 700,
              }}
            >
              {item.meaning}
            </p>

            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 13,
                background:
                  "#ffffff",
                color:
                  "#176c46",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              {item.example}
            </div>
          </article>
        ))}
      </div>

      <ActionButton
        text="✅ قرأت الكلمات ومعانيها"
        onClick={onNext}
      />
    </>
  );
}

function MeaningChallenge({
  selected,
  setSelected,
  onCheck,
}: {
  selected: string;
  setSelected: (
    value: string
  ) => void;
  onCheck: () => void;
}) {
  const options = [
    "سريع",
    "رحيم ومحب",
    "غاضب",
  ];

  return (
    <>
      <StageTitle
        icon="🧠"
        title="اختر المعنى"
        text="ما معنى كلمة «عَطُوفٌ»؟"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
          marginTop: 22,
        }}
      >
        {options.map(
          (option) => (
            <Choice
              key={option}
              text={option}
              selected={
                selected ===
                option
              }
              onClick={() =>
                setSelected(
                  option
                )
              }
            />
          )
        )}
      </div>

      <ActionButton
        text="تحقق من إجابتي"
        disabled={!selected}
        onClick={onCheck}
      />
    </>
  );
}

function MatchingChallenge({
  answers,
  setAnswers,
  onCheck,
}: {
  answers: Record<
    string,
    string
  >;
  setAnswers: React.Dispatch<
    React.SetStateAction<
      Record<string, string>
    >
  >;
  onCheck: () => void;
}) {
  const items = [
    {
      word: "صَحِبَ",
      options: [
        "رحيم ومحب",
        "رافق",
        "تطلب السماح",
      ],
    },
    {
      word: "طَاعَةٌ",
      options: [
        "الاستجابة للأمر الصحيح",
        "رافق",
        "غضب",
      ],
    },
    {
      word: "تَعْتَذِرُ",
      options: [
        "تطلب السماح",
        "تبتعد",
        "تنام",
      ],
    },
    {
      word: "عَطُوفٌ",
      options: [
        "قاسٍ",
        "رحيم ومحب",
        "حزين",
      ],
    },
  ];

  return (
    <>
      <StageTitle
        icon="🧩"
        title="طابق الكلمة"
        text="اختر المعنى المناسب لكل كلمة."
      />

      <div
        style={{
          display: "grid",
          gap: 13,
          marginTop: 22,
        }}
      >
        {items.map((item) => (
          <div
            key={item.word}
            style={{
              padding: 17,
              borderRadius: 19,
              background:
                "#fffdf6",
              border:
                "1px solid #eadcaf",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: 10,
                color:
                  "#986300",
                fontSize: 20,
              }}
            >
              💎 {item.word}
            </strong>

            <select
              value={
                answers[
                  item.word
                ] || ""
              }
              onChange={(event) =>
                setAnswers(
                  (current) => ({
                    ...current,
                    [item.word]:
                      event.target.value,
                  })
                )
              }
              style={{
                width: "100%",
                padding:
                  "13px 15px",
                borderRadius: 14,
                border:
                  "1px solid #decfa1",
                background:
                  "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                color:
                  "#173f32",
              }}
            >
              <option value="">
                اختر المعنى
              </option>

              {item.options.map(
                (option) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>
        ))}
      </div>

      <ActionButton
        text="🧩 تحقق من المطابقة"
        disabled={
          Object.keys(
            answers
          ).length < 4
        }
        onClick={onCheck}
      />
    </>
  );
}

function SentenceChallenge({
  answer,
  setAnswer,
  onFinish,
}: {
  answer: string;
  setAnswer: (
    value: string
  ) => void;
  onFinish: () => void;
}) {
  return (
    <>
      <StageTitle
        icon="✍️"
        title="استخدم الكلمة"
        text="أكمل الجملة بالكلمة المناسبة: عندما أخطئ فإنني ______ وأطلب السماح."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
          marginTop: 22,
        }}
      >
        {[
          "أعتذر",
          "أغضب",
          "أتجاهل",
        ].map(
          (option) => (
            <Choice
              key={option}
              text={option}
              selected={
                answer ===
                option
              }
              onClick={() =>
                setAnswer(
                  option
                )
              }
            />
          )
        )}
      </div>

      <ActionButton
        text="🏆 إنهاء كنز الكلمات"
        disabled={!answer}
        onClick={onFinish}
      />
    </>
  );
}

function FinishCard() {
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
        💎
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color:
            "#9a6500",
          fontSize:
            "clamp(28px,5vw,38px)",
        }}
      >
        أحسنت! جمعت كنز الكلمات
      </h2>

      <p
        style={{
          color:
            "#667d74",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        أصبحت تعرف أهم كلمات الدرس
        ومعانيها، ويمكنك الآن الانتقال إلى
        مكتشف اللغة.
      </p>

      <div
        style={{
          maxWidth: 550,
          margin:
            "18px auto",
          padding: 16,
          borderRadius: 18,
          background:
            "#edf9f3",
          border:
            "1px solid #cce8da",
          color:
            "#176c46",
          fontWeight: 900,
        }}
      >
        ✅ المحطة الثالثة مكتملة
      </div>

      <Link
        href="/lessons/unit1/lesson2/language"
        style={{
          display: "block",
          maxWidth: 650,
          margin: "0 auto",
          padding:
            "15px 18px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg,#7021d4,#8a3ceb)",
          color:
            "#ffffff",
          textDecoration:
            "none",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🔎 انتقل إلى مكتشف اللغة
      </Link>
    </div>
  );
}

function StageTitle({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 52,
        }}
      >
        {icon}
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color:
            "#9a6500",
          fontSize: 28,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          maxWidth: 650,
          margin: "0 auto",
          color:
            "#6e695b",
          lineHeight: 1.8,
          fontWeight: 700,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function Choice({
  text,
  selected,
  onClick,
}: {
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 100,
        padding: 14,
        borderRadius: 19,
        border: selected
          ? "2px solid #d99a1b"
          : "1px solid #e5dcc3",
        background: selected
          ? "#fff4cd"
          : "#ffffff",
        color:
          "#173f32",
        fontWeight: 900,
        fontSize: 17,
        cursor: "pointer",
      }}
    >
      {selected
        ? "✅ "
        : ""}
      {text}
    </button>
  );
}

function ActionButton({
  text,
  onClick,
  disabled = false,
}: {
  text: string;
  onClick: () => void;
  disabled?: boolean;
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
          ? "#d2d6d3"
          : "linear-gradient(135deg,#d88900,#f0a91c)",
        color:
          "#ffffff",
        fontWeight: 900,
        fontSize: 17,
        cursor: disabled
          ? "not-allowed"
          : "pointer",
      }}
    >
      {text}
    </button>
  );
}