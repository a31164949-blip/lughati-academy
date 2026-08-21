"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type CellType =
  | "wall"
  | "path"
  | "start"
  | "goal"
  | "question";

type MazeCell = {
  type: CellType;
  questionId?: number;
};

type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
};

type Position = {
  row: number;
  col: number;
};
type MazeSettings = {
  mazeWords: string;
};

const fallbackQuestions: Question[] = [
  {
    id: 1,
    text: "اختر الكلمة التي تبدأ بحرف «م»",
    options: [
      "مدرسة",
      "كتاب",
      "باب",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    text: "اختر الكلمة التي فيها حرف مد",
    options: [
      "قلم",
      "باب",
      "كتب",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    text: "اختر الكلمة المكتوبة كتابة صحيحة",
    options: [
      "مُعَلِّم",
      "مُعَلَم",
      "مَعْلِم",
    ],
    correctIndex: 0,
  },
];

const maze: MazeCell[][] = [
  [
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "start" },
    { type: "path" },
    {
      type: "question",
      questionId: 1,
    },
    { type: "path" },
    { type: "path" },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
    {
      type: "question",
      questionId: 2,
    },
    { type: "path" },
    { type: "path" },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "path" },
    { type: "path" },
    { type: "path" },
    { type: "wall" },
    {
      type: "question",
      questionId: 3,
    },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "path" },
    { type: "wall" },
    { type: "goal" },
    { type: "wall" },
  ],

  [
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
    { type: "wall" },
  ],
];

export default function PublicMazeGamePage() {
  const [
  mazeWords,
  setMazeWords,
] = useState<string[]>([]);

const [
  wordsLoading,
  setWordsLoading,
] = useState(true);
useEffect(() => {
  let active = true;

  async function loadMazeWords() {
    try {
      setWordsLoading(true);

      const snapshot =
        await getDoc(
          doc(
            db,
            "gameSettings",
            "weekly"
          )
        );

      if (
        !active ||
        !snapshot.exists()
      ) {
        return;
      }

      const data =
        snapshot.data();

      const rawWords =
        typeof data.mazeWords ===
        "string"
          ? data.mazeWords
          : "";

      const parsedWords =
        rawWords
          .split(/[\n،,]+/)
          .map((word) =>
            word.trim()
          )
          .filter(Boolean);

      setMazeWords(parsedWords);
    } catch (error) {
      console.error(
        "تعذر تحميل كلمات المتاهة:",
        error
      );

      setMazeWords([]);
    } finally {
      if (active) {
        setWordsLoading(false);
      }
    }
  }

  void loadMazeWords();

  return () => {
    active = false;
  };
}, []);
const questions = useMemo<Question[]>(() => {
  if (wordsLoading) {
    return fallbackQuestions;
  }

  const cleanedWords = Array.from(
    new Set(
      mazeWords
        .map((word) => word.trim())
        .filter(Boolean)
    )
  );

  /*
   * نختار كلمات ببدايات مختلفة حتى
   * لا يكون للسؤال أكثر من إجابة صحيحة.
   */
  const uniqueStartWords: string[] = [];

  const usedFirstLetters =
    new Set<string>();

  for (const word of cleanedWords) {
    const firstLetter =
      word.charAt(0);

    if (
      !firstLetter ||
      usedFirstLetters.has(
        firstLetter
      )
    ) {
      continue;
    }

    usedFirstLetters.add(
      firstLetter
    );

    uniqueStartWords.push(
      word
    );
  }

  /*
   * نحتاج ثلاث بدايات مختلفة على الأقل
   * لأن المتاهة الحالية فيها ثلاثة أبواب.
   */
  if (
    uniqueStartWords.length < 3
  ) {
    return fallbackQuestions;
  }

  return uniqueStartWords
    .slice(0, 3)
    .map(
      (
        correctWord,
        index
      ) => {
        const firstLetter =
          correctWord.charAt(0);

        const distractors =
          uniqueStartWords
            .filter(
              (word) =>
                word !==
                correctWord
            )
            .slice(0, 2);

        const options =
          index === 0
            ? [
                correctWord,
                ...distractors,
              ]
            : index === 1
            ? [
                distractors[0],
                correctWord,
                distractors[1],
              ]
            : [
                ...distractors,
                correctWord,
              ];

        return {
          id: index + 1,

          text:
            `اختر الكلمة التي تبدأ بحرف «${firstLetter}»`,

          options,

          correctIndex:
            index === 0
              ? 0
              : index === 1
              ? 1
              : 2,
        };
      }
    );
}, [
  mazeWords,
  wordsLoading,
]);
 const startPosition: Position = (() => {
  for (
    let row = 0;
    row < maze.length;
    row++
  ) {
    for (
      let col = 0;
      col < maze[row].length;
      col++
    ) {
     if (
  maze[row][col].type ===
  "start"
) {
        return {
          row,
          col,
        };
      }
    }
  }

  return {
    row: 0,
    col: 0,
  };
})();

  const [
    position,
    setPosition,
  ] =
    useState<Position>(
      startPosition
    );

  const [
    activeQuestion,
    setActiveQuestion,
  ] =
    useState<Question | null>(
      null
    );

  const [
    pendingPosition,
    setPendingPosition,
  ] =
    useState<Position | null>(
      null
    );

  const [
    solvedQuestions,
    setSolvedQuestions,
  ] = useState<number[]>([]);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState(
    "حرّك فارس داخل المتاهة حتى يصل إلى الكنز."
  );

  const totalDoors =
    questions.length;

  const openedDoors =
    solvedQuestions.length;

  const progress =
    Math.round(
      (openedDoors /
        totalDoors) *
        100
    );

  function canMove(
    row: number,
    col: number
  ) {
    if (
      row < 0 ||
      col < 0 ||
      row >= maze.length ||
      col >= maze[0].length
    ) {
      return false;
    }

    return (
      maze[row][col].type !==
      "wall"
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
      position.row +
      rowChange;

    const nextCol =
      position.col +
      colChange;

    if (
      !canMove(
        nextRow,
        nextCol
      )
    ) {
      setMessage(
        "🚧 هذا الطريق مغلق، جرّب اتجاهًا آخر."
      );

      return;
    }

    const nextCell =
      maze[nextRow][nextCol];

    if (
      nextCell.type ===
        "question" &&
      nextCell.questionId &&
      !solvedQuestions.includes(
        nextCell.questionId
      )
    ) {
      const question =
        questions.find(
          (item) =>
            item.id ===
            nextCell.questionId
        );

      if (question) {
        setPendingPosition({
          row: nextRow,
          col: nextCol,
        });

        setActiveQuestion(
          question
        );

        setMessage(
          "🧠 أمامك باب مغلق… أجب عن التحدي لفتحه."
        );

        return;
      }
    }

    movePlayerTo(
      nextRow,
      nextCol
    );
  }

  function movePlayerTo(
    row: number,
    col: number
  ) {
    setPosition({
      row,
      col,
    });

    const cell =
      maze[row][col];

    if (
      cell.type ===
      "goal"
    ) {
      setCompleted(true);

      setMessage(
        "🏆 أحسنت! وصلت إلى كنز لغتي."
      );

      return;
    }

    setMessage(
      "✨ رائع! واصل طريقك نحو الكنز."
    );
  }

  function answerQuestion(
    selectedIndex: number
  ) {
    if (
      !activeQuestion
    ) {
      return;
    }

    if (
      selectedIndex ===
      activeQuestion.correctIndex
    ) {
      const solvedId =
        activeQuestion.id;

      setSolvedQuestions(
        (current) => {
          if (
            current.includes(
              solvedId
            )
          ) {
            return current;
          }

          return [
            ...current,
            solvedId,
          ];
        }
      );

      setMessage(
        "✅ إجابة صحيحة! فُتح الباب وتقدّم فارس."
      );

      if (
        pendingPosition
      ) {
        setPosition({
          row:
            pendingPosition.row,
          col:
            pendingPosition.col,
        });
      }

      setActiveQuestion(
        null
      );

      setPendingPosition(
        null
      );

      return;
    }

    setMessage(
      "❌ ليست الإجابة الصحيحة، حاول مرة أخرى يا بطل."
    );
  }

  function restartGame() {
    setPosition(
      startPosition
    );

    setSolvedQuestions(
      []
    );

    setActiveQuestion(
      null
    );

    setPendingPosition(
      null
    );

    setCompleted(
      false
    );

    setMessage(
      "حرّك فارس داخل المتاهة حتى يصل إلى الكنز."
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-violet-50 via-sky-50 to-emerald-50 px-4 py-6"
    >
      <style>{`
        @keyframes mazeHeroFloat {
          0%,100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes mazeGoalGlow {
          0%,100% {
            transform: scale(1);
            filter: brightness(1);
          }

          50% {
            transform: scale(1.08);
            filter: brightness(1.12);
          }
        }

        @keyframes mazeDoorGlow {
          0%,100% {
            box-shadow:
              0 0 0 rgba(
                139,
                92,
                246,
                0
              );
          }

          50% {
            box-shadow:
              0 0 24px rgba(
                139,
                92,
                246,
                .48
              );
          }
        }

        @keyframes mazeCelebration {
          0%,100% {
            transform:
              translateY(0)
              rotate(0deg);
          }

          50% {
            transform:
              translateY(-8px)
              rotate(8deg);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .maze-motion {
            animation:
              none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">

        {/* الرأس */}

        <header className="mb-5 rounded-[30px] bg-gradient-to-l from-violet-700 via-purple-600 to-indigo-600 p-5 text-white shadow-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">

            <div>
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur">
                🎮 تحدي الأسبوع
              </span>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                🌀 متاهة لغتي
              </h1>

              <p className="mt-2 max-w-xl leading-8 text-violet-100">
                افتح الأبواب
                بالإجابات الصحيحة
                وساعد فارس على
                الوصول إلى كنز لغتي.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white px-5 py-3 font-black text-violet-700 shadow-lg no-underline"
              style={{
                color:
                  "#6d28d9",
              }}
            >
              <span>
                ←
              </span>

              العودة إلى الرئيسية
            </Link>
          </div>
        </header>

        {/* تقدم الأبواب */}

        <section className="mb-5 rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <p className="text-sm font-black text-violet-600">
                🚪 تقدمك في المتاهة
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-800">
                فتحت{" "}
                {openedDoors} من{" "}
                {totalDoors} أبواب
              </h2>
            </div>

            <strong className="rounded-full bg-violet-50 px-4 py-2 text-violet-700">
              {progress}%
            </strong>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-violet-600 via-purple-500 to-sky-400 transition-all duration-500"
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* رسالة فارس */}

        <section className="mb-5 rounded-[28px] border border-emerald-100 bg-white p-5 text-center shadow-sm">
          <div className="text-4xl">
            🦸
          </div>

          <p className="mt-2 text-lg font-black text-slate-800">
            {message}
          </p>

          <p className="mt-2 text-sm font-bold text-slate-500">
            🧠 أنجزت{" "}
            {openedDoors} من{" "}
            {totalDoors} تحديات
          </p>
        </section>

        {/* المتاهة */}

        <section className="overflow-x-auto rounded-[34px] border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
          <div
            className="mx-auto grid w-fit gap-1 rounded-[26px] bg-slate-200 p-2"
            style={{
              gridTemplateColumns:
                `repeat(${maze[0].length}, minmax(70px, 82px))`,
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
                      position.row ===
                        rowIndex &&
                      position.col ===
                        colIndex;

                    const questionSolved =
                      cell.questionId
                        ? solvedQuestions.includes(
                            cell.questionId
                          )
                        : false;

                    const isQuestion =
                      cell.type ===
                      "question";

                    let background =
                      "#bbf7d0";

                    if (
                      cell.type ===
                      "wall"
                    ) {
                      background =
                        "#334155";
                    }

                    if (
                      cell.type ===
                      "goal"
                    ) {
                      background =
                        "#fde68a";
                    }

                    if (
                      isQuestion &&
                      !questionSolved
                    ) {
                      background =
                        "#8b5cf6";
                    }

                    if (
                      isQuestion &&
                      questionSolved
                    ) {
                      background =
                        "#86efac";
                    }

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`relative grid h-[76px] w-[76px] place-items-center rounded-xl sm:h-[82px] sm:w-[82px] ${
                          isQuestion &&
                          !questionSolved
                            ? "maze-motion"
                            : ""
                        }`}
                        style={{
                          background,

                          animation:
                            isQuestion &&
                            !questionSolved
                              ? "mazeDoorGlow 2.5s ease-in-out infinite"
                              : undefined,
                        }}
                      >
                        {/* الباب المغلق */}

                        {isQuestion &&
                          !questionSolved && (
                            <div className="text-center">
                              <span className="block text-3xl">
                                🚪
                              </span>

                              <small className="mt-1 block text-[9px] font-black text-white">
                                تحدي
                              </small>
                            </div>
                          )}

                        {/* الباب المفتوح */}

                        {isQuestion &&
                          questionSolved &&
                          !isPlayer && (
                            <span className="text-2xl">
                              ✅
                            </span>
                          )}

                        {/* الكنز */}

                        {cell.type ===
                          "goal" && (
                            <span
                              className="maze-motion text-4xl"
                              style={{
                                animation:
                                  "mazeGoalGlow 2s ease-in-out infinite",
                              }}
                            >
                              🏆
                            </span>
                          )}

                        {/* البداية */}

                        {cell.type ===
                          "start" &&
                          !isPlayer && (
                            <span className="text-2xl">
                              🚩
                            </span>
                          )}

                        {/* فارس */}

                        {isPlayer && (
                          <div
                            className="maze-motion grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-white text-3xl shadow-lg"
                            style={{
                              animation:
                                "mazeHeroFloat 2.4s ease-in-out infinite",
                            }}
                          >
                            🦸
                          </div>
                        )}
                      </div>
                    );
                  }
                )
            )}
          </div>
        </section>

        {/* التحكم */}

        <section className="mt-5 rounded-[30px] bg-white p-5 shadow-sm">
          <h2 className="text-center text-xl font-black text-slate-800">
            🎮 حرّك فارس
          </h2>

          <p className="mt-1 text-center text-sm text-slate-500">
            استخدم الأسهم
            للوصول إلى الأبواب
            ثم إلى الكنز.
          </p>

          <div
          dir="ltr"
          className="mx-auto mt-5 grid w-[210px] grid-cols-3 gap-3">
            <span />

            <MoveButton
              label="أعلى"
              onClick={() =>
                move(
                  -1,
                  0
                )
              }
            >
              ⬆️
            </MoveButton>

            <span />

            <MoveButton
              label="يسار"
              onClick={() =>
                move(
                  0,
                  -1
                )
              }
            >
              ⬅️
            </MoveButton>

            <MoveButton
              label="أسفل"
              onClick={() =>
                move(
                  1,
                  0
                )
              }
            >
              ⬇️
            </MoveButton>

            <MoveButton
              label="يمين"
              onClick={() =>
                move(
                  0,
                  1
                )
              }
            >
              ➡️
            </MoveButton>
          </div>

          <button
            type="button"
            onClick={
              restartGame
            }
            className="mx-auto mt-5 block rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-black text-slate-600 transition hover:bg-slate-100"
          >
            🔄 إعادة المتاهة
          </button>
        </section>
      </div>

      {/* نافذة السؤال */}

      {activeQuestion && (
        <div className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-white bg-white p-6 text-center shadow-2xl">

            <div className="text-6xl">
              🚪
            </div>

            <p className="mt-3 text-sm font-black text-violet-600">
              تحدي فتح الباب
            </p>

            <h2 className="mt-2 text-2xl font-black leading-10 text-slate-800">
              {
                activeQuestion.text
              }
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              اختر الإجابة الصحيحة
              ليفتح الباب ويتقدم فارس.
            </p>

            <div className="mt-5 grid gap-3">
              {activeQuestion.options.map(
                (
                  option,
                  index
                ) => (
                  <button
                    key={`${activeQuestion.id}-${index}`}
                    type="button"
                    onClick={() =>
                      answerQuestion(
                        index
                      )
                    }
                    className="rounded-2xl border-2 border-violet-100 bg-violet-50 px-5 py-4 text-lg font-black text-violet-800 transition hover:border-violet-400 hover:bg-violet-100 active:scale-[.98]"
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* الفوز */}

      {completed && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">

          <div className="relative w-full max-w-lg overflow-hidden rounded-[36px] border-4 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-7 text-center shadow-2xl">

            <span
              className="maze-motion absolute left-8 top-8 text-4xl"
              style={{
                animation:
                  "mazeCelebration 2s ease-in-out infinite",
              }}
            >
              ✨
            </span>

            <span
              className="maze-motion absolute right-8 top-12 text-4xl"
              style={{
                animation:
                  "mazeCelebration 2.4s ease-in-out infinite",
              }}
            >
              🎉
            </span>

            <div className="text-7xl">
              🏆
            </div>

            <h2 className="mt-4 text-3xl font-black text-amber-700">
              أحسنت يا بطل!
            </h2>

            <p className="mt-3 text-lg font-bold leading-8 text-slate-700">
              وصلت إلى كنز لغتي
              وفتحت جميع أبواب
              المتاهة بنجاح.
            </p>

            <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4 font-black text-emerald-700">
              ✅ {totalDoors} من{" "}
              {totalDoors} تحديات
              مكتملة
            </div>

            <button
              type="button"
              onClick={
                restartGame
              }
              className="mt-5 w-full rounded-2xl bg-violet-700 px-5 py-4 font-black text-white transition hover:bg-violet-800"
            >
              🔄 العب مرة أخرى
            </button>

            <Link
              href="/"
              className="mt-3 block rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white no-underline transition hover:bg-emerald-800"
            >
              🏠 العودة إلى الرئيسية
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function MoveButton({
  children,
  onClick,
  label,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  label:
    string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-600 text-2xl shadow-lg transition hover:scale-105 hover:bg-violet-700 active:scale-95"
    >
      {children}
    </button>
  );
}