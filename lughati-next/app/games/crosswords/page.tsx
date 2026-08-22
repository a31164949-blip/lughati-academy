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

type Direction =
  | "horizontal"
  | "vertical";

type PlacedWord = {
  word: string;
  row: number;
  col: number;
  direction: Direction;
  number: number;
};

type CrosswordCell = {
  letter: string;
  number?: number;
};

type CrosswordData = {
  grid: Array<
    Array<CrosswordCell | null>
  >;
  words: PlacedWord[];
};

const fallbackWords = [
  "كتاب",
  "مدرسة",
  "معلم",
  "قلم",
  "قراءة",
  "درس",
];

const GRID_SIZE = 13;

function cleanWord(
  word: string
) {
  return word
    .replace(/\s+/g, "")
    .trim();
}

function buildCrossword(
  sourceWords: string[]
): CrosswordData {
  const words =
    Array.from(
      new Set(
        sourceWords
          .map(cleanWord)
          .filter(
            (word) =>
              word.length >= 2 &&
              word.length <= 10
          )
      )
    ).slice(0, 6);

  const board: string[][] =
    Array.from(
      {
        length:
          GRID_SIZE,
      },
      () =>
        Array.from(
          {
            length:
              GRID_SIZE,
          },
          () => ""
        )
    );

  const placed: PlacedWord[] =
    [];

  function canPlace(
    word: string,
    row: number,
    col: number,
    direction: Direction
  ) {
    for (
      let index = 0;
      index < word.length;
      index++
    ) {
      const targetRow =
        direction ===
        "horizontal"
          ? row
          : row + index;

      const targetCol =
        direction ===
        "horizontal"
          ? col + index
          : col;

      if (
        targetRow < 0 ||
        targetRow >=
          GRID_SIZE ||
        targetCol < 0 ||
        targetCol >=
          GRID_SIZE
      ) {
        return false;
      }

      const current =
        board[targetRow][
          targetCol
        ];

      if (
        current &&
        current !==
          word[index]
      ) {
        return false;
      }
    }

    return true;
  }

  function writeWord(
    word: string,
    row: number,
    col: number,
    direction: Direction
  ) {
    for (
      let index = 0;
      index < word.length;
      index++
    ) {
      const targetRow =
        direction ===
        "horizontal"
          ? row
          : row + index;

      const targetCol =
        direction ===
        "horizontal"
          ? col + index
          : col;

      board[targetRow][
        targetCol
      ] = word[index];
    }
  }

  if (words.length === 0) {
    return {
      grid: [],
      words: [],
    };
  }

  /*
   * الكلمة الأولى في منتصف الشبكة.
   */
  const firstWord =
    words[0];

  const firstRow =
    Math.floor(
      GRID_SIZE / 2
    );

  const firstCol =
    Math.max(
      1,
      Math.floor(
        (
          GRID_SIZE -
          firstWord.length
        ) / 2
      )
    );

  writeWord(
    firstWord,
    firstRow,
    firstCol,
    "horizontal"
  );

  placed.push({
    word:
      firstWord,
    row:
      firstRow,
    col:
      firstCol,
    direction:
      "horizontal",
    number: 1,
  });

  /*
   * نحاول تقاطع كل كلمة جديدة
   * مع كلمة موجودة.
   */
  for (
    let wordIndex = 1;
    wordIndex <
    words.length;
    wordIndex++
  ) {
    const word =
      words[wordIndex];

    let wasPlaced =
      false;

    for (
      const existing of placed
    ) {
      if (wasPlaced) {
        break;
      }

      for (
        let newIndex = 0;
        newIndex <
        word.length;
        newIndex++
      ) {
        if (wasPlaced) {
          break;
        }

        for (
          let existingIndex = 0;
          existingIndex <
          existing.word.length;
          existingIndex++
        ) {
          if (
            word[newIndex] !==
            existing.word[
              existingIndex
            ]
          ) {
            continue;
          }

          const newDirection:
            Direction =
            existing.direction ===
            "horizontal"
              ? "vertical"
              : "horizontal";

          const intersectionRow =
            existing.direction ===
            "horizontal"
              ? existing.row
              : existing.row +
                existingIndex;

          const intersectionCol =
            existing.direction ===
            "horizontal"
              ? existing.col +
                existingIndex
              : existing.col;

          const newRow =
            newDirection ===
            "vertical"
              ? intersectionRow -
                newIndex
              : intersectionRow;

          const newCol =
            newDirection ===
            "horizontal"
              ? intersectionCol -
                newIndex
              : intersectionCol;

          if (
            !canPlace(
              word,
              newRow,
              newCol,
              newDirection
            )
          ) {
            continue;
          }

          writeWord(
            word,
            newRow,
            newCol,
            newDirection
          );

          placed.push({
            word,
            row:
              newRow,
            col:
              newCol,
            direction:
              newDirection,
            number:
              placed.length +
              1,
          });

          wasPlaced =
            true;

          break;
        }
      }
    }

    /*
     * إذا لم نجد تقاطعًا،
     * نضع الكلمة في سطر خالٍ.
     */
    if (!wasPlaced) {
      for (
        let row = 1;
        row <
        GRID_SIZE - 1;
        row++
      ) {
        if (wasPlaced) {
          break;
        }

        const col = 1;

        if (
          canPlace(
            word,
            row,
            col,
            "horizontal"
          )
        ) {
          writeWord(
            word,
            row,
            col,
            "horizontal"
          );

          placed.push({
            word,
            row,
            col,
            direction:
              "horizontal",
            number:
              placed.length +
              1,
          });

          wasPlaced =
            true;
        }
      }
    }
  }

  const numbers =
    new Map<
      string,
      number
    >();

  placed.forEach(
    (item) => {
      const key =
        `${item.row}-${item.col}`;

      if (
        !numbers.has(
          key
        )
      ) {
        numbers.set(
          key,
          item.number
        );
      }
    }
  );

  const convertedGrid =
    board.map(
      (row, rowIndex) =>
        row.map(
          (
            letter,
            colIndex
          ) => {
            if (!letter) {
              return null;
            }

            const key =
              `${rowIndex}-${colIndex}`;

            return {
              letter,
              number:
                numbers.get(
                  key
                ),
            };
          }
        )
    );

  return {
    grid:
      convertedGrid,
    words:
      placed,
  };
}

export default function CrosswordsPage() {
  const [
    adminWords,
    setAdminWords,
  ] = useState<string[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, string>
  >({});

  const [
    message,
    setMessage,
  ] = useState(
    "اكتب الحروف داخل المربعات لإكمال الكلمات."
  );

  const [
    completed,
    setCompleted,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWords() {
      try {
        setLoading(true);

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

        const raw =
          typeof data.crosswordsWords ===
          "string"
            ? data.crosswordsWords
            : "";

        const parsed =
          raw
            .split(
              /[\n،,]+/
            )
            .map(
              cleanWord
            )
            .filter(
              Boolean
            );

        setAdminWords(
          parsed
        );
      } catch (error) {
        console.error(
          "تعذر تحميل كلمات الكلمات المتقاطعة:",
          error
        );

        setAdminWords([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWords();

    return () => {
      active = false;
    };
  }, []);

  const activeWords =
    useMemo(
      () =>
        adminWords.length >=
        3
          ? adminWords
          : fallbackWords,
      [adminWords]
    );

  const crossword =
    useMemo(
      () =>
        buildCrossword(
          activeWords
        ),
      [activeWords]
    );

  const solutionMap =
    useMemo(() => {
      const result:
        Record<
          string,
          string
        > = {};

      crossword.grid.forEach(
        (
          row,
          rowIndex
        ) => {
          row.forEach(
            (
              cell,
              colIndex
            ) => {
              if (cell) {
                result[
                  `${rowIndex}-${colIndex}`
                ] =
                  cell.letter;
              }
            }
          );
        }
      );

      return result;
    }, [crossword]);

  const clueWords =
    crossword.words;

  function updateAnswer(
    key: string,
    value: string
  ) {
    if (completed) {
      return;
    }

    const lastCharacter =
      value
        .replace(
          /\s+/g,
          ""
        )
        .slice(-1);

    setAnswers(
      (current) => ({
        ...current,
        [key]:
          lastCharacter,
      })
    );

    setMessage(
      "واصل الحل… أنت تقترب! ✨"
    );
  }

  function checkAnswers() {
    const keys =
      Object.keys(
        solutionMap
      );

    const allFilled =
      keys.every(
        (key) =>
          Boolean(
            answers[key]
          )
      );

    if (!allFilled) {
      setMessage(
        "📝 ما زالت هناك مربعات فارغة."
      );

      return;
    }

    const correct =
      keys.every(
        (key) =>
          answers[key] ===
          solutionMap[key]
      );

    if (!correct) {
      setMessage(
        "🔎 توجد بعض الحروف غير الصحيحة، حاول مرة أخرى."
      );

      return;
    }

    setCompleted(true);

    setMessage(
      "🏆 أحسنت! أكملت الكلمات المتقاطعة بنجاح."
    );
  }

  function restartGame() {
    setAnswers({});
    setCompleted(false);

    setMessage(
      "اكتب الحروف داخل المربعات لإكمال الكلمات."
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",
        padding:
          "24px 16px 60px",
        background:
          "linear-gradient(180deg,#fffaf0 0%,#ffffff 48%,#f2fbf7 100%)",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f31",
      }}
    >
      <div
        style={{
          maxWidth:
            "1150px",
          margin:
            "0 auto",
        }}
      >
        <header
          style={{
            padding:
              "28px",
            borderRadius:
              "30px",
            background:
              "linear-gradient(135deg,#d97706,#f59e0b)",
            color:
              "#ffffff",
            boxShadow:
              "0 16px 38px rgba(217,119,6,.18)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap:
                "16px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display:
                    "inline-flex",
                  padding:
                    "7px 12px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(255,255,255,.18)",
                  fontWeight:
                    900,
                  fontSize:
                    "13px",
                }}
              >
                ✏️ تحدي الكلمات
              </span>

              <h1
                style={{
                  margin:
                    "10px 0 6px",
                  fontSize:
                    "clamp(32px,5vw,48px)",
                }}
              >
                الكلمات المتقاطعة
              </h1>

              <p
                style={{
                  margin: 0,
                  lineHeight:
                    1.8,
                  fontWeight:
                    700,
                  opacity:
                    0.95,
                }}
              >
                فكّر في الكلمات،
                وأكمل الحروف
                المتقاطعة حتى تحل
                الشبكة كاملة.
              </p>
            </div>

            <Link
              href="/"
              style={{
                textDecoration:
                  "none",
                background:
                  "#ffffff",
                color:
                  "#a85c00",
                borderRadius:
                  "14px",
                padding:
                  "11px 16px",
                fontWeight:
                  900,
              }}
            >
              ← العودة
            </Link>
          </div>
        </header>

        <section
          style={{
            marginTop:
              "16px",
            padding:
              "13px",
            borderRadius:
              "18px",
            background:
              completed
                ? "#ecfdf5"
                : "#ffffff",
            border:
              completed
                ? "1px solid #86efac"
                : "1px solid #f1dfbb",
            textAlign:
              "center",
            color:
              completed
                ? "#166534"
                : "#6b5b3e",
            fontWeight:
              900,
          }}
        >
          {loading
            ? "⏳ جارٍ تجهيز التحدي..."
            : message}
        </section>

        {!loading && (
          <section
            style={{
              marginTop:
                "18px",
              display:
                "grid",
              gridTemplateColumns:
                "minmax(0,1.45fr) minmax(250px,.55fr)",
              gap:
                "18px",
            }}
            className="crossword-layout"
          >
            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #eadfc8",
                borderRadius:
                  "26px",
                padding:
                  "18px",
                boxShadow:
                  "0 12px 30px rgba(80,60,20,.07)",
                overflowX:
                  "auto",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 14px",
                  color:
                    "#a85c00",
                }}
              >
                🧩 شبكة الكلمات
              </h2>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    `repeat(${GRID_SIZE}, minmax(32px,1fr))`,
                  gap:
                    "4px",
                  minWidth:
                    "620px",
                }}
              >
                {crossword.grid.flatMap(
                  (
                    row,
                    rowIndex
                  ) =>
                    row.map(
                      (
                        cell,
                        colIndex
                      ) => {
                        const key =
                          `${rowIndex}-${colIndex}`;

                        if (!cell) {
                          return (
                            <div
                              key={
                                key
                              }
                              style={{
                                aspectRatio:
                                  "1",
                                background:
                                  "#334155",
                                borderRadius:
                                  "5px",
                              }}
                            />
                          );
                        }

                        return (
                          <div
                            key={
                              key
                            }
                            style={{
                              position:
                                "relative",
                              aspectRatio:
                                "1",
                            }}
                          >
                            {cell.number && (
                              <span
                                style={{
                                  position:
                                    "absolute",
                                  top:
                                    "2px",
                                  right:
                                    "4px",
                                  fontSize:
                                    "9px",
                                  color:
                                    "#a85c00",
                                  fontWeight:
                                    900,
                                  zIndex: 2,
                                }}
                              >
                                {
                                  cell.number
                                }
                              </span>
                            )}

                            <input
                              value={
                                answers[
                                  key
                                ] || ""
                              }
                              onChange={(
                                event
                              ) =>
                                updateAnswer(
                                  key,
                                  event
                                    .target
                                    .value
                                )
                              }
                              maxLength={
                                1
                              }
                              disabled={
                                completed
                              }
                              aria-label={`حرف الصف ${
                                rowIndex +
                                1
                              } العمود ${
                                colIndex +
                                1
                              }`}
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                boxSizing:
                                  "border-box",
                                border:
                                  answers[
                                    key
                                  ] &&
                                  answers[
                                    key
                                  ] !==
                                    solutionMap[
                                      key
                                    ]
                                    ? "2px solid #fca5a5"
                                    : "1px solid #e5c98f",
                                borderRadius:
                                  "7px",
                                background:
                                  completed
                                    ? "#dcfce7"
                                    : "#fffaf0",
                                textAlign:
                                  "center",
                                fontSize:
                                  "clamp(18px,2vw,25px)",
                                fontWeight:
                                  900,
                                color:
                                  "#7c4a03",
                                outline:
                                  "none",
                              }}
                            />
                          </div>
                        );
                      }
                    )
                )}
              </div>
            </div>

            <aside
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #eadfc8",
                borderRadius:
                  "26px",
                padding:
                  "18px",
                boxShadow:
                  "0 12px 30px rgba(80,60,20,.07)",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 12px",
                  color:
                    "#a85c00",
                }}
              >
                💡 التلميحات
              </h2>

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "9px",
                }}
              >
                {clueWords.map(
                  (item) => (
                    <div
                      key={`${item.number}-${item.word}`}
                      style={{
                        padding:
                          "11px",
                        borderRadius:
                          "13px",
                        background:
                          "#fffaf0",
                        border:
                          "1px solid #f1dfbb",
                      }}
                    >
                      <strong
                        style={{
                          color:
                            "#a85c00",
                        }}
                      >
                        {item.number}.
                      </strong>{" "}
                      تبدأ بحرف «
                      {
                        item.word[
                          0
                        ]
                      }
                      » وتتكون من{" "}
                      {
                        item.word
                          .length
                      }{" "}
                      أحرف.
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={
                  checkAnswers
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    "16px",
                  border:
                    "none",
                  borderRadius:
                    "14px",
                  padding:
                    "13px",
                  background:
                    "#d97706",
                  color:
                    "#ffffff",
                  fontWeight:
                    900,
                  cursor:
                    "pointer",
                }}
              >
                ✅ تحقق من الحل
              </button>

              <button
                type="button"
                onClick={
                  restartGame
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    "9px",
                  border:
                    "1px solid #eadfc8",
                  borderRadius:
                    "14px",
                  padding:
                    "12px",
                  background:
                    "#ffffff",
                  color:
                    "#a85c00",
                  fontWeight:
                    900,
                  cursor:
                    "pointer",
                }}
              >
                🔄 إعادة التحدي
              </button>
            </aside>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 820px) {
          .crossword-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}