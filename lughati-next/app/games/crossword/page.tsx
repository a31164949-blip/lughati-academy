"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Direction = "across" | "down";
type LevelId = "easy" | "medium" | "hard";

type CrosswordWord = {
  id: number;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
};

type Level = {
  id: LevelId;
  title: string;
  icon: string;
  description: string;
  rows: number;
  cols: number;
  baseScore: number;
  words: CrosswordWord[];
};

type CellInfo = {
  row: number;
  col: number;
  letter: string;
  wordIds: number[];
  number?: number;
};

const LEVELS: Level[] = [
  {
    id: "easy",
    title: "سهل",
    icon: "🟢",
    description:
      "أربع كلمات قصيرة وتلميحات واضحة لبداية ممتعة.",
    rows: 10,
    cols: 12,
    baseScore: 120,
    words: [
      {
        id: 1,
        answer: "كتاب",
        clue: "نقرأ فيه القصص والدروس.",
        row: 5,
        col: 10,
        direction: "across",
      },
      {
        id: 2,
        answer: "باب",
        clue: "ندخل ونخرج من خلاله.",
        row: 5,
        col: 7,
        direction: "down",
      },
      {
        id: 3,
        answer: "دار",
        clue: "مكان نسكن فيه.",
        row: 4,
        col: 8,
        direction: "down",
      },
      {
        id: 4,
        answer: "ولد",
        clue: "طفلٌ ذكر.",
        row: 4,
        col: 10,
        direction: "across",
      },
    ],
  },

  {
    id: "medium",
    title: "متوسط",
    icon: "🟡",
    description:
      "ست كلمات مترابطة وتلميحات تحتاج إلى بعض التفكير.",
    rows: 15,
    cols: 12,
    baseScore: 220,
    words: [
      {
        id: 1,
        answer: "مدرسة",
        clue: "مكان نتعلم فيه كل يوم.",
        row: 5,
        col: 10,
        direction: "across",
      },
      {
        id: 2,
        answer: "ربيع",
        clue: "فصل تزهر فيه النباتات.",
        row: 5,
        col: 8,
        direction: "down",
      },
      {
        id: 3,
        answer: "بيت",
        clue: "نعيش فيه مع أسرتنا.",
        row: 7,
        col: 9,
        direction: "across",
      },
      {
        id: 4,
        answer: "تفاح",
        clue: "فاكهة قد تكون حمراء أو خضراء.",
        row: 7,
        col: 7,
        direction: "down",
      },
      {
        id: 5,
        answer: "حديقة",
        clue: "مكان جميل فيه أشجار وأزهار.",
        row: 10,
        col: 7,
        direction: "across",
      },
      {
        id: 6,
        answer: "قمر",
        clue: "نراه مضيئًا في السماء ليلًا.",
        row: 10,
        col: 4,
        direction: "down",
      },
    ],
  },

  {
    id: "hard",
    title: "صعب",
    icon: "🔴",
    description:
      "ثماني كلمات متقاطعة تحتاج إلى تركيز قوي.",
    rows: 15,
    cols: 14,
    baseScore: 360,
    words: [
      {
        id: 1,
        answer: "مكتبة",
        clue: "مكان يجتمع فيه عدد كبير من الكتب.",
        row: 5,
        col: 10,
        direction: "across",
      },
      {
        id: 2,
        answer: "تلميذ",
        clue: "طالب يأتي إلى المدرسة ليتعلم.",
        row: 5,
        col: 8,
        direction: "down",
      },
      {
        id: 3,
        answer: "معلم",
        clue: "يساعد الطلاب على التعلم.",
        row: 7,
        col: 11,
        direction: "across",
      },
      {
        id: 4,
        answer: "لعب",
        clue: "نشاط نستمتع به في وقت الفراغ.",
        row: 7,
        col: 9,
        direction: "down",
      },
      {
        id: 5,
        answer: "باب",
        clue: "جزء من المنزل يُفتح ويُغلق.",
        row: 9,
        col: 11,
        direction: "across",
      },
      {
        id: 6,
        answer: "بحر",
        clue: "مسطح مائي واسع ومالح.",
        row: 9,
        col: 11,
        direction: "down",
      },
      {
        id: 7,
        answer: "حديقة",
        clue: "مكان أخضر تنمو فيه الأشجار والأزهار.",
        row: 10,
        col: 11,
        direction: "across",
      },
      {
        id: 8,
        answer: "قراءة",
        clue: "مهارة نستخدمها لفهم الكلمات والنصوص.",
        row: 11,
        col: 12,
        direction: "across",
      },
    ],
  },
];

function cellKey(
  row: number,
  col: number
) {
  return `${row}-${col}`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(
    seconds / 60
  );
  const remaining = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remaining).padStart(
    2,
    "0"
  )}`;
}

export default function CrosswordPage() {
  const [levelId, setLevelId] =
    useState<LevelId>("easy");

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const [
    selectedWordId,
    setSelectedWordId,
  ] = useState<number>(1);

  const [checked, setChecked] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [seconds, setSeconds] =
    useState(0);

  const [hintsUsed, setHintsUsed] =
    useState(0);

  const [wrongChecks, setWrongChecks] =
    useState(0);

  const [finalScore, setFinalScore] =
    useState(0);

  const inputRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  const level =
    LEVELS.find(
      (item) => item.id === levelId
    ) ?? LEVELS[0];

  const grid = useMemo(() => {
    const cells = new Map<
      string,
      CellInfo
    >();

    level.words.forEach((word) => {
      const letters = Array.from(
        word.answer
      );

      letters.forEach(
        (letter, index) => {
          const row =
            word.direction === "down"
              ? word.row + index
              : word.row;

          // الكلمات الأفقية تسير من اليمين إلى اليسار
          const col =
            word.direction === "across"
              ? word.col - index
              : word.col;

          const key = cellKey(
            row,
            col
          );

          const existing =
            cells.get(key);

          if (existing) {
            if (
              existing.letter !== letter
            ) {
              console.warn(
                "Crossword conflict:",
                key,
                existing.letter,
                letter
              );
            }

            if (
              !existing.wordIds.includes(
                word.id
              )
            ) {
              existing.wordIds.push(
                word.id
              );
            }
          } else {
            cells.set(key, {
              row,
              col,
              letter,
              wordIds: [word.id],
            });
          }
        }
      );
    });

    level.words.forEach(
      (word, index) => {
        const key = cellKey(
          word.row,
          word.col
        );

        const cell =
          cells.get(key);

        if (cell) {
          cell.number = index + 1;
        }
      }
    );

    return cells;
  }, [level]);

  // نحسب أصغر مساحة فعلية تحتوي الكلمات فقط،
  // حتى لا تظهر مساحات داكنة كبيرة غير مستخدمة حول الشبكة.
  const gridBounds = useMemo(() => {
    const cells = Array.from(grid.values());

    if (cells.length === 0) {
      return {
        minRow: 0,
        maxRow: level.rows - 1,
        minCol: 0,
        maxCol: level.cols - 1,
      };
    }

    const rows = cells.map((cell) => cell.row);
    const cols = cells.map((cell) => cell.col);

    return {
      minRow: Math.min(...rows),
      maxRow: Math.max(...rows),
      minCol: Math.min(...cols),
      maxCol: Math.max(...cols),
    };
  }, [grid, level.rows, level.cols]);

  const displayRows =
    gridBounds.maxRow - gridBounds.minRow + 1;

  const displayCols =
    gridBounds.maxCol - gridBounds.minCol + 1;

  const cellSize =
    level.id === "easy"
      ? 58
      : level.id === "medium"
        ? 54
        : 50;

  const selectedWord =
    level.words.find(
      (word) =>
        word.id === selectedWordId
    ) ?? level.words[0];

  const totalLetters =
    grid.size;

  const correctLetters =
    Array.from(
      grid.entries()
    ).filter(
      ([key, cell]) =>
        answers[key] === cell.letter
    ).length;

  const filledLetters =
    Array.from(
      grid.keys()
    ).filter(
      (key) =>
        Boolean(answers[key])
    ).length;

  const progress =
    totalLetters > 0
      ? Math.round(
          (correctLetters /
            totalLetters) *
            100
        )
      : 0;

  useEffect(() => {
    if (completed) {
      return;
    }

    const timer = window.setInterval(
      () => {
        setSeconds(
          (current) => current + 1
        );
      },
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, [levelId, completed]);

  function resetLevel(
    nextLevelId?: LevelId
  ) {
    if (nextLevelId) {
      setLevelId(nextLevelId);
    }

    setAnswers({});
    setSelectedWordId(1);
    setChecked(false);
    setCompleted(false);
    setSeconds(0);
    setHintsUsed(0);
    setWrongChecks(0);
    setFinalScore(0);
  }

  function getWordCells(
    word: CrosswordWord
  ) {
    return Array.from(
      word.answer
    ).map((_, index) => {
      const row =
        word.direction === "down"
          ? word.row + index
          : word.row;

      const col =
        word.direction === "across"
          ? word.col - index
          : word.col;

      return {
        key: cellKey(row, col),
        row,
        col,
      };
    });
  }

  function focusNextCell(
    currentKey: string,
    wordId: number
  ) {
    const word =
      level.words.find(
        (item) =>
          item.id === wordId
      );

    if (!word) {
      return;
    }

    const cells =
      getWordCells(word);

    const index =
      cells.findIndex(
        (cell) =>
          cell.key === currentKey
      );

    if (
      index >= 0 &&
      index <
        cells.length - 1
    ) {
      const next =
        cells[index + 1];

      inputRefs.current[
        next.key
      ]?.focus();
    }
  }

  function handleInput(
    key: string,
    rawValue: string,
    cell: CellInfo
  ) {
    const value =
      Array.from(
        rawValue.replace(
          /[^\u0600-\u06FF]/g,
          ""
        )
      ).slice(-1)[0] ?? "";

    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));

    setChecked(false);

    const activeWordId =
      cell.wordIds.includes(
        selectedWordId
      )
        ? selectedWordId
        : cell.wordIds[0];

    setSelectedWordId(
      activeWordId
    );

    if (value) {
      window.setTimeout(
        () =>
          focusNextCell(
            key,
            activeWordId
          ),
        10
      );
    }
  }

  function calculateScore() {
    const timePenalty =
      Math.floor(seconds / 15);

    return Math.max(
      10,
      level.baseScore -
        hintsUsed * 10 -
        wrongChecks * 5 -
        timePenalty
    );
  }

  function checkAnswers() {
    setChecked(true);

    const isComplete =
      Array.from(
        grid.entries()
      ).every(
        ([key, cell]) =>
          answers[key] === cell.letter
      );

    if (isComplete) {
      setCompleted(true);
      setFinalScore(
        calculateScore()
      );
      return;
    }

    setWrongChecks(
      (current) => current + 1
    );
  }

  function revealHint() {
    if (completed) {
      return;
    }

    const word =
      selectedWord ??
      level.words[0];

    const cells =
      getWordCells(word);

    const hiddenCells =
      cells.filter(
        (item) => {
          const cell =
            grid.get(item.key);

          if (!cell) {
            return false;
          }

          return (
            answers[item.key] !==
            cell.letter
          );
        }
      );

    if (
      hiddenCells.length === 0
    ) {
      return;
    }

    const randomCell =
      hiddenCells[
        Math.floor(
          Math.random() *
            hiddenCells.length
        )
      ];

    const cell =
      grid.get(
        randomCell.key
      );

    if (!cell) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [randomCell.key]:
        cell.letter,
    }));

    setHintsUsed(
      (current) => current + 1
    );

    setChecked(false);
  }

  function getCellState(
    key: string,
    cell: CellInfo
  ) {
    if (!checked) {
      return "normal";
    }

    const value =
      answers[key];

    if (!value) {
      return "empty";
    }

    if (value === cell.letter) {
      return "correct";
    }

    return "wrong";
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#effbf4 0%,#f8fbff 52%,#fff9ed 100%)",
        padding:
          "24px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f31",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <Link
            href="/games"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              textDecoration: "none",
              color: "#176d4c",
              background: "#ffffff",
              border:
                "1px solid #cfe8dd",
              padding:
                "11px 17px",
              borderRadius: "15px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى الألعاب
          </Link>
        </div>

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg,#137c53 0%,#1f9d6c 55%,#35b978 100%)",
            color: "#ffffff",
            borderRadius: "30px",
            padding:
              "30px 24px",
            boxShadow:
              "0 16px 38px rgba(20,120,80,.18)",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,.08)",
              left: "-70px",
              top: "-80px",
            }}
          />

          <div
            style={{
              position:
                "relative",
              zIndex: 2,
            }}
          >
            <span
              style={{
                display:
                  "inline-flex",
                padding:
                  "7px 13px",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,.16)",
                fontWeight: 900,
              }}
            >
              🎮 ساحة التحديات
            </span>

            <h1
              style={{
                margin:
                  "12px 0 8px",
                fontSize:
                  "clamp(30px,5vw,48px)",
              }}
            >
              🧩 شبكة فارس
              للكلمات
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: "720px",
                lineHeight: 1.8,
                opacity: 0.94,
              }}
            >
              اقرأ التلميحات،
              واكتشف الكلمات،
              وأكمل الشبكة بأعلى
              نتيجة ممكنة.
            </p>
          </div>
        </section>

        <section
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: "12px",
          }}
          className="levelsGrid"
        >
          {LEVELS.map(
            (item) => {
              const active =
                item.id === levelId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    resetLevel(
                      item.id
                    )
                  }
                  style={{
                    border: active
                      ? "2px solid #178b5e"
                      : "1px solid #d8e8e0",
                    background: active
                      ? "#eafaf2"
                      : "#ffffff",
                    borderRadius:
                      "20px",
                    padding:
                      "16px",
                    cursor:
                      "pointer",
                    textAlign:
                      "right",
                    boxShadow: active
                      ? "0 10px 25px rgba(20,120,80,.12)"
                      : "0 7px 18px rgba(30,70,60,.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "25px",
                    }}
                  >
                    {item.icon}
                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      color:
                        "#176d4c",
                      fontSize:
                        "20px",
                      marginTop:
                        "5px",
                    }}
                  >
                    {item.title}
                  </strong>

                  <span
                    style={{
                      color:
                        "#70847c",
                      fontSize:
                        "13px",
                      lineHeight:
                        1.6,
                    }}
                  >
                    {
                      item.description
                    }
                  </span>
                </button>
              );
            }
          )}
        </section>

        <section
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.5fr) minmax(290px,.8fr)",
            gap: "18px",
          }}
          className="gameLayout"
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "26px",
              padding: "18px",
              boxShadow:
                "0 10px 28px rgba(15,23,42,.07)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom:
                  "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <StatChip
                  text={`⏱️ ${formatTime(
                    seconds
                  )}`}
                />

                <StatChip
                  text={`✏️ ${filledLetters}/${totalLetters}`}
                />

                <StatChip
                  text={`💡 ${hintsUsed}`}
                />
              </div>

              <strong
                style={{
                  color: "#176d4c",
                  background:
                    "#ecfdf5",
                  padding:
                    "8px 13px",
                  borderRadius:
                    "999px",
                }}
              >
                {progress}%
              </strong>
            </div>

            <div
              style={{
                height: "11px",
                background:
                  "#e8f0ec",
                borderRadius:
                  "999px",
                overflow: "hidden",
                marginBottom:
                  "18px",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg,#1d9d69,#70dc9c)",
                  transition:
                    "width .3s ease",
                }}
              />
            </div>

            <div
              style={{
                background:
                  "#effaf4",
                border:
                  "1px solid #d4ecdf",
                padding:
                  "14px",
                borderRadius:
                  "17px",
                marginBottom:
                  "17px",
                lineHeight: 1.7,
              }}
            >
              <strong
                style={{
                  color: "#13754f",
                }}
              >
                💡 التلميح رقم{" "}
                {selectedWord.id}:
              </strong>{" "}
              {selectedWord.clue}
            </div>

            <div
              className="gridScroller"
              style={{
                overflowX: "auto",
                padding:
                  "8px 4px 14px",
              }}
            >
              <div
                style={{
                  width: "max-content",
                  margin: "0 auto",
                  direction: "ltr",
                  display: "grid",
                  padding: "10px",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(145deg,#f7fbf9,#eef7f2)",
                  border:
                    "1px solid #d9ebe2",
                  boxShadow:
                    "0 10px 24px rgba(20,70,50,.07)",
                  gridTemplateColumns:
                    `repeat(${displayCols}, ${cellSize}px)`,
                  gridTemplateRows:
                    `repeat(${displayRows}, ${cellSize}px)`,
                  gap: "5px",
                }}
              >
                {Array.from({
                  length:
                    displayRows *
                    displayCols,
                }).map(
                  (_, index) => {
                    const row =
                      gridBounds.minRow +
                      Math.floor(
                        index /
                          displayCols
                      );

                    const col =
                      gridBounds.minCol +
                      (index %
                        displayCols);

                    const key =
                      cellKey(
                        row,
                        col
                      );

                    const cell =
                      grid.get(key);

                    if (!cell) {
                      return (
                        <div
                          key={key}
                          style={{
                            width:
                              `${cellSize}px`,
                            height:
                              `${cellSize}px`,
                            borderRadius:
                              "10px",
                            background:
                              "linear-gradient(145deg,#214f40,#183f34)",
                            opacity:
                              0.93,
                            boxShadow:
                              "inset 0 0 0 1px rgba(255,255,255,.035)",
                          }}
                        />
                      );
                    }

                    const state =
                      getCellState(
                        key,
                        cell
                      );

                    const active =
                      cell.wordIds.includes(
                        selectedWordId
                      );

                    let background =
                      active
                        ? "#fff7d6"
                        : "#ffffff";

                    let border =
                      active
                        ? "#efc94d"
                        : "#cbd8d1";

                    if (
                      state ===
                      "correct"
                    ) {
                      background =
                        "#dcfce7";
                      border =
                        "#22c55e";
                    }

                    if (
                      state ===
                      "wrong"
                    ) {
                      background =
                        "#fee2e2";
                      border =
                        "#ef4444";
                    }

                    return (
                      <div
                        key={key}
                        style={{
                          position:
                            "relative",
                          width:
                            `${cellSize}px`,
                          height:
                            `${cellSize}px`,
                        }}
                      >
                        {cell.number && (
                          <span
                            style={{
                              position:
                                "absolute",
                              top: "2px",
                              right:
                                "4px",
                              zIndex:
                                3,
                              fontSize:
                                "9px",
                              fontWeight:
                                900,
                              color:
                                "#64748b",
                            }}
                          >
                            {
                              cell.number
                            }
                          </span>
                        )}

                        <input
                          ref={(
                            element
                          ) => {
                            inputRefs.current[
                              key
                            ] =
                              element;
                          }}
                          aria-label={`خانة ${key}`}
                          value={
                            answers[
                              key
                            ] ?? ""
                          }
                          maxLength={1}
                          disabled={
                            completed
                          }
                          onFocus={() => {
                            if (
                              !cell.wordIds.includes(
                                selectedWordId
                              )
                            ) {
                              setSelectedWordId(
                                cell
                                  .wordIds[0]
                              );
                            }
                          }}
                          onChange={(
                            event
                          ) =>
                            handleInput(
                              key,
                              event
                                .target
                                .value,
                              cell
                            )
                          }
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            boxSizing:
                              "border-box",
                            border:
                              `2px solid ${border}`,
                            borderRadius:
                              "9px",
                            background,
                            outline:
                              "none",
                            textAlign:
                              "center",
                            fontSize:
                              "25px",
                            fontWeight:
                              900,
                            color:
                              "#173f31",
                            direction:
                              "rtl",
                            transition:
                              "all .2s ease",
                          }}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent:
                  "center",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={
                  checkAnswers
                }
                disabled={
                  completed
                }
                style={{
                  ...primaryButton,
                  opacity:
                    completed
                      ? 0.5
                      : 1,
                }}
              >
                ✅ تحقق من الحل
              </button>

              <button
                type="button"
                onClick={
                  revealHint
                }
                disabled={
                  completed
                }
                style={
                  secondaryButton
                }
              >
                💡 اكشف حرفًا
              </button>

              <button
                type="button"
                onClick={() =>
                  resetLevel()
                }
                style={
                  secondaryButton
                }
              >
                🔄 إعادة اللعب
              </button>
            </div>

            {checked &&
              !completed && (
                <div
                  style={{
                    marginTop:
                      "15px",
                    background:
                      "#fff7ed",
                    border:
                      "1px solid #fed7aa",
                    color:
                      "#9a3412",
                    borderRadius:
                      "16px",
                    padding:
                      "13px",
                    textAlign:
                      "center",
                    fontWeight:
                      900,
                  }}
                >
                  🔎 راجع المربعات
                  الحمراء، ما زالت
                  هناك إجابات تحتاج
                  إلى تعديل.
                </div>
              )}
          </div>

          <aside
            style={{
              display: "grid",
              gap: "14px",
              alignContent:
                "start",
            }}
          >
            <CluePanel
              title="➡️ أفقي"
              words={level.words.filter(
                (word) =>
                  word.direction ===
                  "across"
              )}
              allWords={
                level.words
              }
              selectedWordId={
                selectedWordId
              }
              onSelect={
                setSelectedWordId
              }
            />

            <CluePanel
              title="⬇️ رأسي"
              words={level.words.filter(
                (word) =>
                  word.direction ===
                  "down"
              )}
              allWords={
                level.words
              }
              selectedWordId={
                selectedWordId
              }
              onSelect={
                setSelectedWordId
              }
            />

            <div
              style={{
                background:
                  "#ffffff",
                borderRadius:
                  "20px",
                padding:
                  "17px",
                border:
                  "1px solid #e0ebe5",
                boxShadow:
                  "0 8px 22px rgba(20,70,50,.05)",
              }}
            >
              <strong
                style={{
                  display:
                    "block",
                  color: "#176d4c",
                  marginBottom:
                    "7px",
                }}
              >
                🏆 كيف تحصل على
                نتيجة أعلى؟
              </strong>

              <p
                style={{
                  margin: 0,
                  color: "#70847c",
                  fontSize:
                    "13px",
                  lineHeight: 1.8,
                }}
              >
                أكمل الشبكة بسرعة،
                واستخدم تلميحات أقل،
                وحاول الوصول إلى الحل
                من أول مراجعة.
              </p>
            </div>
          </aside>
        </section>

        {completed && (
          <div
            className="successOverlay"
          >
            <div
              className="successCard"
            >
              <div
                style={{
                  fontSize: "60px",
                }}
              >
                🏆🎉
              </div>

              <h2
                style={{
                  margin:
                    "8px 0",
                  color: "#166534",
                  fontSize:
                    "32px",
                }}
              >
                أحسنت يا بطل!
              </h2>

              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.8,
                }}
              >
                أكملت مستوى{" "}
                <strong>
                  {level.title}
                </strong>{" "}
                بنجاح.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3,1fr)",
                  gap: "8px",
                  margin:
                    "18px 0",
                }}
              >
                <ResultBox
                  title="النتيجة"
                  value={`${finalScore} ⭐`}
                />

                <ResultBox
                  title="الوقت"
                  value={formatTime(
                    seconds
                  )}
                />

                <ResultBox
                  title="التلميحات"
                  value={String(
                    hintsUsed
                  )}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent:
                    "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    resetLevel()
                  }
                  style={
                    primaryButton
                  }
                >
                  🔄 العب مرة أخرى
                </button>

                <Link
                  href="/games"
                  style={{
                    ...secondaryButton,
                    textDecoration:
                      "none",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                  }}
                >
                  🎮 ألعاب أخرى
                </Link>
              </div>
            </div>

            {[
              "✨",
              "🎉",
              "⭐",
              "🏆",
              "🎊",
              "✨",
              "⭐",
              "🎉",
            ].map(
              (
                item,
                index
              ) => (
                <span
                  key={index}
                  className={`celebration celebration${index}`}
                >
                  {item}
                </span>
              )
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 860px) {
          .gameLayout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 650px) {
          .levelsGrid {
            grid-template-columns: 1fr !important;
          }

          .gridScroller {
            margin-left: -8px;
            margin-right: -8px;
            padding-bottom: 18px !important;
          }

          .gridScroller > div {
            transform-origin: top center;
          }
        }

        input:focus {
          box-shadow: 0 0 0 3px
            rgba(31, 157, 108, 0.17);
          transform: scale(1.04);
        }

        .successOverlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(
            15,
            47,
            36,
            0.55
          );
          backdrop-filter: blur(8px);
          overflow: hidden;
        }

        .successCard {
          position: relative;
          z-index: 3;
          width: min(520px, 100%);
          background: linear-gradient(
            145deg,
            #ffffff,
            #f0fff7
          );
          border-radius: 30px;
          padding: 30px 22px;
          text-align: center;
          box-shadow: 0 25px 70px
            rgba(0, 0, 0, 0.25);
          animation: successPop
            0.4s ease;
        }

        .celebration {
          position: absolute;
          font-size: 38px;
          animation: floatParty
            2.4s ease-in-out
            infinite alternate;
        }

        .celebration0 {
          top: 10%;
          left: 12%;
        }

        .celebration1 {
          top: 15%;
          right: 11%;
          animation-delay: 0.2s;
        }

        .celebration2 {
          bottom: 14%;
          left: 18%;
          animation-delay: 0.4s;
        }

        .celebration3 {
          bottom: 10%;
          right: 15%;
          animation-delay: 0.6s;
        }

        .celebration4 {
          top: 48%;
          left: 5%;
          animation-delay: 0.8s;
        }

        .celebration5 {
          top: 42%;
          right: 5%;
          animation-delay: 1s;
        }

        .celebration6 {
          top: 5%;
          left: 48%;
          animation-delay: 1.2s;
        }

        .celebration7 {
          bottom: 4%;
          left: 48%;
          animation-delay: 1.4s;
        }

        @keyframes successPop {
          from {
            opacity: 0;
            transform: scale(0.75)
              translateY(20px);
          }

          to {
            opacity: 1;
            transform: scale(1)
              translateY(0);
          }
        }

        @keyframes floatParty {
          from {
            transform: translateY(
                -8px
              )
              rotate(-8deg)
              scale(0.9);
          }

          to {
            transform: translateY(
                12px
              )
              rotate(8deg)
              scale(1.15);
          }
        }
      `}</style>
    </main>
  );
}

function StatChip({
  text,
}: {
  text: string;
}) {
  return (
    <span
      style={{
        background: "#f4f8f6",
        border:
          "1px solid #dce9e2",
        padding: "8px 11px",
        borderRadius: "999px",
        color: "#476559",
        fontSize: "13px",
        fontWeight: 900,
      }}
    >
      {text}
    </span>
  );
}

function CluePanel({
  title,
  words,
  allWords,
  selectedWordId,
  onSelect,
}: {
  title: string;
  words: CrosswordWord[];
  allWords: CrosswordWord[];
  selectedWordId: number;
  onSelect: (
    id: number
  ) => void;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "21px",
        padding: "17px",
        border:
          "1px solid #e0ebe5",
        boxShadow:
          "0 8px 22px rgba(20,70,50,.05)",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          color: "#176d4c",
          fontSize: "19px",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        {words.map((word) => {
          const number =
            allWords.findIndex(
              (item) =>
                item.id === word.id
            ) + 1;

          const active =
            selectedWordId ===
            word.id;

          return (
            <button
              key={word.id}
              type="button"
              onClick={() =>
                onSelect(word.id)
              }
              style={{
                width: "100%",
                border: active
                  ? "2px solid #27a76f"
                  : "1px solid #dce7e1",
                borderRadius:
                  "14px",
                padding:
                  "11px 12px",
                textAlign: "right",
                background: active
                  ? "#ecfdf5"
                  : "#f8faf9",
                color: "#405c51",
                lineHeight: 1.6,
                cursor: "pointer",
              }}
            >
              <strong
                style={{
                  color: "#176d4c",
                }}
              >
                {number}.
              </strong>{" "}
              {word.clue}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ResultBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f4fbf7",
        border:
          "1px solid #d7ece1",
        borderRadius: "16px",
        padding: "12px 8px",
      }}
    >
      <span
        style={{
          display: "block",
          color: "#819188",
          fontSize: "12px",
          marginBottom: "5px",
        }}
      >
        {title}
      </span>

      <strong
        style={{
          color: "#176d4c",
          fontSize: "18px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const primaryButton:
  React.CSSProperties = {
    border: "none",
    borderRadius: "15px",
    padding: "13px 18px",
    background:
      "linear-gradient(135deg,#15885d,#21a870)",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "15px",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(20,140,90,.18)",
  };

const secondaryButton:
  React.CSSProperties = {
    border:
      "1px solid #cedfd6",
    borderRadius: "15px",
    padding: "13px 17px",
    background: "#ffffff",
    color: "#49675a",
    fontWeight: 900,
    fontSize: "14px",
    cursor: "pointer",
  };