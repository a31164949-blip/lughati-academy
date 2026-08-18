"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Position = {
  row: number;
  col: number;
};

type Question = {
  id: number;
  row: number;
  col: number;
  question: string;
  options: string[];
  correct: string;
  icon: string;
};

const MAZE_COMPLETED_KEY =
  "lughati-city-maze-completed";

const maze = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const startPosition: Position = {
  row: 1,
  col: 1,
};

const finishPosition: Position = {
  row: 7,
  col: 7,
};

const questions: Question[] = [
  {
    id: 1,
    row: 1,
    col: 3,
    icon: "📖",
    question:
      "أي كلمة تدل على شخص رحيم ومحب؟",
    options: [
      "عَطُوفٌ",
      "غاضب",
      "سريع",
    ],
    correct: "عَطُوفٌ",
  },
  {
    id: 2,
    row: 3,
    col: 5,
    icon: "🔎",
    question:
      "أي كلمة تبدأ بلام شمسية؟",
    options: [
      "القمر",
      "الشَّمس",
      "الكتاب",
    ],
    correct: "الشَّمس",
  },
  {
    id: 3,
    row: 5,
    col: 7,
    icon: "✍️",
    question:
      "اختر الكلمة المكتوبة كتابة صحيحة:",
    options: [
      "السماح",
      "السماحح",
      "السماااح",
    ],
    correct: "السماح",
  },
];

export default function MazePage() {
  const [
    player,
    setPlayer,
  ] = useState<Position>(
    startPosition
  );

  const [
    unlockedQuestions,
    setUnlockedQuestions,
  ] = useState<number[]>([]);

  const [
    activeQuestion,
    setActiveQuestion,
  ] =
    useState<Question | null>(
      null
    );

  const [
    selectedAnswer,
    setSelectedAnswer,
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
        MAZE_COMPLETED_KEY
      );

    setCompleted(
      saved === "true"
    );
  }, []);

  const solvedCount =
    unlockedQuestions.length;

  const progress =
    useMemo(() => {
      return Math.round(
        (solvedCount /
          questions.length) *
          100
      );
    }, [solvedCount]);

  function isWalkable(
    row: number,
    col: number
  ) {
    return (
      maze[row]?.[col] === 1
    );
  }

  function getQuestionAt(
    row: number,
    col: number
  ) {
    return questions.find(
      (question) =>
        question.row === row &&
        question.col === col
    );
  }

  function move(
    rowChange: number,
    colChange: number
  ) {
    if (
      activeQuestion ||
      completed
    ) {
      return;
    }

    const nextRow =
      player.row + rowChange;

    const nextCol =
      player.col + colChange;

    if (
      !isWalkable(
        nextRow,
        nextCol
      )
    ) {
      setMessage(
        "🧱 الطريق مغلق، جرّب اتجاهًا آخر."
      );

      window.setTimeout(() => {
        setMessage("");
      }, 800);

      return;
    }

    const question =
      getQuestionAt(
        nextRow,
        nextCol
      );

    if (
      question &&
      !unlockedQuestions.includes(
        question.id
      )
    ) {
      setPlayer({
        row: nextRow,
        col: nextCol,
      });

      setSelectedAnswer("");
      setMessage("");
      setActiveQuestion(
        question
      );

      return;
    }

    setPlayer({
      row: nextRow,
      col: nextCol,
    });

    if (
      nextRow ===
        finishPosition.row &&
      nextCol ===
        finishPosition.col
    ) {
      if (
        unlockedQuestions.length ===
        questions.length
      ) {
        localStorage.setItem(
          MAZE_COMPLETED_KEY,
          "true"
        );

        setCompleted(true);
        setMessage(
          "🏆 أحسنت! وصلت إلى كنز المتاهة."
        );
      } else {
        setMessage(
          "🔒 وصلت إلى النهاية، لكن بقيت بوابات لغوية لم تحلها."
        );
      }
    }
  }

  function checkAnswer() {
    if (
      !activeQuestion ||
      !selectedAnswer
    ) {
      return;
    }

    if (
      selectedAnswer !==
      activeQuestion.correct
    ) {
      setMessage(
        "💡 ليست الإجابة الصحيحة. حاول مرة أخرى."
      );

      return;
    }

    setUnlockedQuestions(
      (current) => [
        ...current,
        activeQuestion.id,
      ]
    );

    setMessage(
      "🌟 ممتاز! فتحت البوابة."
    );

    window.setTimeout(() => {
      setActiveQuestion(null);
      setSelectedAnswer("");
      setMessage("");
    }, 700);
  }

  function restartMaze() {
    setPlayer(
      startPosition
    );

    setUnlockedQuestions(
      []
    );

    setActiveQuestion(
      null
    );

    setSelectedAnswer(
      ""
    );

    setMessage("");

    setCompleted(false);

    localStorage.removeItem(
      MAZE_COMPLETED_KEY
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-violet-100 via-sky-50 to-emerald-50 px-3 py-5 sm:px-5"
    >
      <div className="mx-auto max-w-6xl">

        {/* الرأس */}

        <header className="mb-5 rounded-[32px] bg-gradient-to-l from-violet-800 via-violet-700 to-indigo-600 p-5 text-white shadow-xl sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black">
                🌀 لعبة مدينة الإنجاز
              </span>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                متاهة فارس
              </h1>

              <p className="mt-2 max-w-2xl leading-8 text-violet-50">
                ابحث عن الطريق الصحيح،
                وافتح البوابات اللغوية،
                ثم أصل إلى كنز المتاهة.
              </p>
            </div>

            <Link
              href="/journey/city"
              className="rounded-2xl bg-white px-5 py-3 font-black text-violet-700 no-underline shadow-lg"
            >
              ← العودة إلى المدينة
            </Link>
          </div>
        </header>

        {/* التقدم */}

        <section className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-violet-700">
                🚪 البوابات المفتوحة
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-800">
                {solvedCount} من{" "}
                {questions.length}
              </h2>
            </div>

            <strong className="rounded-full bg-violet-50 px-4 py-2 text-violet-700">
              {progress}%
            </strong>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-400 transition-all duration-500"
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* المتاهة */}

        <section className="rounded-[32px] border border-violet-200 bg-white p-3 shadow-xl sm:p-6">

          <div
  dir="ltr"
  className="mx-auto grid w-full max-w-[720px] gap-1 rounded-[26px] bg-slate-200 p-2 shadow-inner"
  style={{
    gridTemplateColumns:
      `repeat(${maze[0].length}, minmax(0, 1fr))`,
  }}
>
          
            {maze.map(
              (
                row,
                rowIndex
              ) =>
                row.map(
                  (
                    cell,
                    colIndex
                  ) => {
                    const isPlayer =
                      player.row ===
                        rowIndex &&
                      player.col ===
                        colIndex;

                    const isFinish =
                      finishPosition.row ===
                        rowIndex &&
                      finishPosition.col ===
                        colIndex;

                    const question =
                      getQuestionAt(
                        rowIndex,
                        colIndex
                      );

                    const isSolved =
                      question &&
                      unlockedQuestions.includes(
                        question.id
                      );

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`relative aspect-square overflow-hidden rounded-md ${
                          cell === 0
                            ? "bg-slate-700"
                            : "bg-emerald-100"
                        }`}
                      >
                        {cell === 1 && (
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200" />
                        )}

                        {question &&
                          !isSolved && (
                            <div className="absolute inset-1 grid place-items-center rounded-lg bg-violet-500 text-2xl shadow">
                              🚪
                            </div>
                          )}

                        {question &&
                          isSolved && (
                            <div className="absolute inset-1 grid place-items-center text-2xl">
                              ✅
                            </div>
                          )}

                        {isFinish && (
                          <div className="absolute inset-1 grid place-items-center rounded-lg bg-amber-200 text-2xl shadow">
                            🏆
                          </div>
                        )}

                        {isPlayer && (
                          <div className="absolute inset-1 z-20 grid place-items-center rounded-full bg-white text-2xl shadow-lg">
                            🦸
                          </div>
                        )}
                      </div>
                    );
                  }
                )
            )}
          </div>

          {/* أزرار الحركة */}

          {!completed && (
            <div className="mx-auto mt-6 grid w-[210px] grid-cols-3 gap-2">
              <div />

              <MoveButton
                label="↑"
                onClick={() =>
                  move(-1, 0)
                }
              />

              <div />

              <MoveButton
                label="→"
                onClick={() =>
                  move(0, 1)
                }
              />

              <div className="grid place-items-center rounded-2xl bg-violet-100 text-2xl">
                🦸
              </div>

              <MoveButton
                label="←"
                onClick={() =>
                  move(0, -1)
                }
              />

              <div />

              <MoveButton
                label="↓"
                onClick={() =>
                  move(1, 0)
                }
              />

              <div />
            </div>
          )}

          {message && (
            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center font-black text-emerald-800">
              {message}
            </div>
          )}
        </section>

        {/* النهاية */}

        {completed && (
          <section className="mt-5 rounded-[30px] border-2 border-amber-300 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-6 text-center shadow-lg">
            <div className="text-7xl">
              🏆
            </div>

            <h2 className="mt-3 text-3xl font-black text-amber-700">
              أحسنت! وجدت كنز المتاهة
            </h2>

            <p className="mt-2 text-slate-600">
              فتحت جميع البوابات اللغوية
              ووصلت إلى نهاية المتاهة.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/journey/city"
                className="rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white no-underline"
              >
                🏙️ العودة إلى مدينتي
              </Link>

              <button
                type="button"
                onClick={
                  restartMaze
                }
                className="rounded-2xl border border-violet-200 bg-white px-6 py-3 font-black text-violet-700"
              >
                🔁 أعد المتاهة
              </button>
            </div>
          </section>
        )}

        {/* فارس */}

        {!completed && (
          <section className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 p-5">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                🦸
              </div>

              <div>
                <p className="font-black text-violet-700">
                  فارس يقول:
                </p>

                <p className="mt-1 text-slate-600">
                  لا تتعجل الوصول إلى الكنز؛
                  ابحث عن كل بوابة وافتحها أولًا.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* نافذة السؤال */}

      {activeQuestion && (
        <div className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/40 p-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[30px] bg-white p-6 text-center shadow-2xl">
            <div className="text-6xl">
              {
                activeQuestion.icon
              }
            </div>

            <span className="mt-3 inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">
              🚪 بوابة لغوية
            </span>

            <h2 className="mt-4 text-2xl font-black text-slate-800">
              {
                activeQuestion.question
              }
            </h2>

            <div className="mt-5 grid gap-3">
              {activeQuestion.options.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setSelectedAnswer(
                        option
                      )
                    }
                    className={`rounded-2xl border-2 px-4 py-4 font-black ${
                      selectedAnswer ===
                      option
                        ? "border-violet-500 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {option}
                  </button>
                )
              )}
            </div>

            {message && (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 font-black text-amber-700">
                {message}
              </div>
            )}

            <button
              type="button"
              disabled={
                !selectedAnswer
              }
              onClick={
                checkAnswer
              }
              className={`mt-5 w-full rounded-2xl px-5 py-4 font-black text-white ${
                selectedAnswer
                  ? "bg-violet-700"
                  : "bg-slate-300"
              }`}
            >
              🔓 افتح البوابة
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function MoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-700 text-3xl font-black text-white shadow-lg transition active:scale-90"
    >
      {label}
    </button>
  );
}