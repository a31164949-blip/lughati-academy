"use client";

import Link from "next/link";
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Cell = {
  row: number;
  col: number;
};

type FoundWord = {
  word: string;
  cells: Cell[];
};

const targetWords = [
  "كتاب",
  "قلم",
  "مدرسة",
  "معلم",
  "باب",
  "نور",
];

const grid = [
  ["ك", "ت", "ا", "ب", "س", "ن", "و", "ر"],
  ["م", "د", "ر", "س", "ة", "ق", "ل", "م"],
  ["ع", "ل", "م", "ب", "ا", "ب", "ت", "ي"],
  ["ن", "و", "ر", "ك", "ل", "م", "س", "ة"],
  ["ق", "ل", "م", "م", "ع", "ل", "م", "د"],
  ["ب", "ا", "ب", "س", "ر", "و", "ن", "ك"],
];

function sameCell(a: Cell, b: Cell) {
  return a.row === b.row && a.col === b.col;
}

function cellKey(cell: Cell) {
  return `${cell.row}-${cell.col}`;
}

function buildLine(
  start: Cell,
  end: Cell
): Cell[] | null {
  const rowDiff =
    end.row - start.row;
  const colDiff =
    end.col - start.col;

  const absRow =
    Math.abs(rowDiff);
  const absCol =
    Math.abs(colDiff);

  const isHorizontal =
    rowDiff === 0;
  const isVertical =
    colDiff === 0;
  const isDiagonal =
    absRow === absCol;

  if (
    !isHorizontal &&
    !isVertical &&
    !isDiagonal
  ) {
    return null;
  }

  const rowStep =
    rowDiff === 0
      ? 0
      : rowDiff > 0
      ? 1
      : -1;

  const colStep =
    colDiff === 0
      ? 0
      : colDiff > 0
      ? 1
      : -1;

  const length =
    Math.max(
      absRow,
      absCol
    );

  const cells: Cell[] = [];

  for (
    let index = 0;
    index <= length;
    index++
  ) {
    cells.push({
      row:
        start.row +
        rowStep * index,
      col:
        start.col +
        colStep * index,
    });
  }

  return cells;
}

export default function LostWordPage() {
  const [
    foundWords,
    setFoundWords,
  ] = useState<FoundWord[]>([]);

  const [
    selectedCells,
    setSelectedCells,
  ] = useState<Cell[]>([]);

  const [
    startCell,
    setStartCell,
  ] = useState<Cell | null>(
    null
  );

  const [
    isSelecting,
    setIsSelecting,
  ] = useState(false);

  const [seconds, setSeconds] =
    useState(0);

  const [started, setStarted] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [
    message,
    setMessage,
  ] = useState(
    "اسحب من أول حرف إلى آخر حرف في خط مستقيم."
  );

  const boardRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const foundWordNames =
    useMemo(
      () =>
        foundWords.map(
          (item) => item.word
        ),
      [foundWords]
    );

  const foundCellKeys =
    useMemo(() => {
      const keys =
        new Set<string>();

      foundWords.forEach(
        (item) => {
          item.cells.forEach(
            (cell) => {
              keys.add(
                cellKey(cell)
              );
            }
          );
        }
      );

      return keys;
    }, [foundWords]);

  const selectedCellKeys =
    useMemo(
      () =>
        new Set(
          selectedCells.map(
            cellKey
          )
        ),
      [selectedCells]
    );

  const currentWord =
    useMemo(
      () =>
        selectedCells
          .map(
            (cell) =>
              grid[cell.row][
                cell.col
              ]
          )
          .join(""),
      [selectedCells]
    );

  useEffect(() => {
    if (
      !started ||
      completed
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setSeconds(
            (current) =>
              current + 1
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    started,
    completed,
  ]);

  const formattedTime =
    useMemo(() => {
      const minutes =
        Math.floor(
          seconds / 60
        );

      const remaining =
        seconds % 60;

      return `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        remaining
      ).padStart(
        2,
        "0"
      )}`;
    }, [seconds]);

  function beginSelection(
    cell: Cell,
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    if (completed) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    if (!started) {
      setStarted(true);
    }

    setStartCell(cell);
    setSelectedCells([
      cell,
    ]);
    setIsSelecting(true);
    setMessage(
      "استمر بالسحب إلى آخر حرف."
    );
  }

  function updateSelection(
    cell: Cell
  ) {
    if (
      !isSelecting ||
      !startCell
    ) {
      return;
    }

    const line =
      buildLine(
        startCell,
        cell
      );

    if (!line) {
      return;
    }

    setSelectedCells(
      line
    );
  }

  function finishSelection() {
    if (!isSelecting) {
      return;
    }

    setIsSelecting(false);

    if (
      selectedCells.length <
      2
    ) {
      setSelectedCells([]);
      setStartCell(null);
      setMessage(
        "اختر كلمة كاملة، وليس حرفًا واحدًا."
      );
      return;
    }

    const normalWord =
      selectedCells
        .map(
          (cell) =>
            grid[cell.row][
              cell.col
            ]
        )
        .join("");

    const reversedWord =
      [...selectedCells]
        .reverse()
        .map(
          (cell) =>
            grid[cell.row][
              cell.col
            ]
        )
        .join("");

    const matchedWord =
      targetWords.find(
        (word) =>
          !foundWordNames.includes(
            word
          ) &&
          (word ===
            normalWord ||
            word ===
              reversedWord)
      );

    if (!matchedWord) {
      setSelectedCells([]);
      setStartCell(null);
      setMessage(
        "❌ ليست من الكلمات المطلوبة. جرّب مرة أخرى."
      );
      return;
    }

    const matchedCells =
      matchedWord ===
      normalWord
        ? selectedCells
        : [
            ...selectedCells,
          ].reverse();

    const nextFoundWords = [
      ...foundWords,
      {
        word:
          matchedWord,
        cells:
          matchedCells,
      },
    ];

    setFoundWords(
      nextFoundWords
    );

    setSelectedCells([]);
    setStartCell(null);

    const allFound =
      nextFoundWords.length ===
      targetWords.length;

    if (allFound) {
      setCompleted(true);
      setMessage(
        "🏆 أحسنت! اكتشفت جميع الكلمات."
      );
      return;
    }

    setMessage(
      `✅ رائع! اكتشفت كلمة «${matchedWord}».`
    );
  }

  function handlePointerCancel() {
    setIsSelecting(false);
    setSelectedCells([]);
    setStartCell(null);
  }

  function restartGame() {
    setFoundWords([]);
    setSelectedCells([]);
    setStartCell(null);
    setIsSelecting(false);
    setSeconds(0);
    setStarted(false);
    setCompleted(false);
    setMessage(
      "اسحب من أول حرف إلى آخر حرف في خط مستقيم."
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#eefcff 0%,#f7fbff 48%,#effdf6 100%)",
        padding:
          "24px 16px 60px",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f31",
      }}
    >
      <style>{`
        .lost-word-cell {
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .lost-word-cell:hover {
          transform: translateY(-2px);
        }

        @media (max-width:760px) {
          .lost-word-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lost-word-cell {
            transition: none !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            background:
              "linear-gradient(135deg,#0f766e 0%,#0891b2 50%,#2563eb 100%)",
            color:
              "#ffffff",
            borderRadius:
              "32px",
            padding:
              "28px",
            boxShadow:
              "0 16px 38px rgba(8,145,178,.18)",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width:
                "220px",
              height:
                "220px",
              borderRadius:
                "50%",
              background:
                "rgba(255,255,255,.08)",
              top:
                "-90px",
              left:
                "-50px",
            }}
          />

          <div
            style={{
              position:
                "relative",
              zIndex: 2,
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap:
                "18px",
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
                    "8px 13px",
                  borderRadius:
                    "999px",
                  background:
                    "#fde68a",
                  color:
                    "#713f12",
                  fontWeight:
                    900,
                  fontSize:
                    "13px",
                }}
              >
                ⚡ خُض التحدي
                وسجّل وقتك
              </span>

              <h1
                style={{
                  margin:
                    "12px 0 8px",
                  fontSize:
                    "clamp(32px,5vw,48px)",
                }}
              >
                🔎 الكلمة
                الضائعة
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth:
                    "650px",
                  lineHeight:
                    1.9,
                  opacity:
                    0.94,
                  fontWeight:
                    700,
                }}
              >
                اسحب على الحروف
                المتجاورة في خط
                مستقيم أفقي أو
                رأسي أو قطري،
                واكتشف الكلمات
                بأسرع وقت.
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
                  "#0f766e",
                borderRadius:
                  "15px",
                padding:
                  "11px 17px",
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
            borderRadius:
              "18px",
            padding:
              "12px 15px",
            background:
              "#ffffff",
            border:
              "1px solid #dceee8",
            color:
              "#49675c",
            fontWeight:
              900,
            textAlign:
              "center",
          }}
        >
          {message}
        </section>

        <section
          style={{
            marginTop:
              "18px",
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap:
              "12px",
          }}
        >
          <StatCard
            icon="⏱️"
            title="وقتك"
            value={
              formattedTime
            }
          />

          <StatCard
            icon="✅"
            title="الكلمات المكتشفة"
            value={`${foundWords.length}/${targetWords.length}`}
          />

          <StatCard
            icon="🔤"
            title="الكلمة الحالية"
            value={
              currentWord ||
              "اسحب على الحروف"
            }
          />
        </section>

        <section
          className="lost-word-layout"
          style={{
            marginTop:
              "18px",
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0,1.4fr) minmax(250px,.6fr)",
            gap:
              "18px",
          }}
        >
          <div
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #dceee8",
              borderRadius:
                "28px",
              padding:
                "20px",
              boxShadow:
                "0 12px 30px rgba(30,90,60,.08)",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 6px",
                color:
                  "#176c49",
              }}
            >
              🔎 ابحث بين
              الحروف
            </h2>

            <p
              style={{
                margin:
                  "0 0 15px",
                color:
                  "#718078",
                fontSize:
                  "13px",
                fontWeight:
                  700,
              }}
            >
              ابدأ من أول حرف
              واسحب إلى آخر حرف.
            </p>

            <div
              ref={boardRef}
              onPointerLeave={() => {
                if (
                  isSelecting
                ) {
                  finishSelection();
                }
              }}
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  `repeat(${grid[0].length}, 1fr)`,
                gap:
                  "7px",
              }}
            >
              {grid.flatMap(
                (
                  row,
                  rowIndex
                ) =>
                  row.map(
                    (
                      letter,
                      colIndex
                    ) => {
                      const cell = {
                        row:
                          rowIndex,
                        col:
                          colIndex,
                      };

                      const key =
                        cellKey(
                          cell
                        );

                      const isFound =
                        foundCellKeys.has(
                          key
                        );

                      const isSelected =
                        selectedCellKeys.has(
                          key
                        );

                      return (
                        <button
                          key={
                            key
                          }
                          type="button"
                          className="lost-word-cell"
                          onPointerDown={(
                            event
                          ) =>
                            beginSelection(
                              cell,
                              event
                            )
                          }
                          onPointerEnter={() =>
                            updateSelection(
                              cell
                            )
                          }
                          onPointerMove={(
                            event
                          ) => {
                            if (
                              !isSelecting
                            ) {
                              return;
                            }

                            const element =
                              document.elementFromPoint(
                                event.clientX,
                                event.clientY
                              );

                            const rowValue =
                              element?.getAttribute(
                                "data-row"
                              );

                            const colValue =
                              element?.getAttribute(
                                "data-col"
                              );

                            if (
                              rowValue ===
                                null ||
                              colValue ===
                                null
                            ) {
                              return;
                            }

                            updateSelection(
                              {
                                row:
                                  Number(
                                    rowValue
                                  ),
                                col:
                                  Number(
                                    colValue
                                  ),
                              }
                            );
                          }}
                          onPointerUp={() =>
                            finishSelection()
                          }
                          onPointerCancel={
                            handlePointerCancel
                          }
                          data-row={
                            rowIndex
                          }
                          data-col={
                            colIndex
                          }
                          style={{
                            aspectRatio:
                              "1",
                            border:
                              isSelected
                                ? "2px solid #f59e0b"
                                : isFound
                                ? "2px solid #22c55e"
                                : "1px solid #cde9df",
                            borderRadius:
                              "14px",
                            background:
                              isSelected
                                ? "#fef3c7"
                                : isFound
                                ? "#dcfce7"
                                : "#effaf5",
                            color:
                              isSelected
                                ? "#92400e"
                                : isFound
                                ? "#166534"
                                : "#176c49",
                            fontSize:
                              "clamp(18px,3vw,28px)",
                            fontWeight:
                              900,
                            cursor:
                              "pointer",
                            transition:
                              "transform .15s ease, background .15s ease, border .15s ease",
                          }}
                        >
                          {letter}
                        </button>
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
                "1px solid #dceee8",
              borderRadius:
                "28px",
              padding:
                "20px",
              boxShadow:
                "0 12px 30px rgba(30,90,60,.08)",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 13px",
                color:
                  "#176c49",
              }}
            >
              🎯 الكلمات المطلوبة
            </h2>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "9px",
              }}
            >
              {targetWords.map(
                (word) => {
                  const found =
                    foundWordNames.includes(
                      word
                    );

                  return (
                    <div
                      key={
                        word
                      }
                      style={{
                        padding:
                          "11px 13px",
                        borderRadius:
                          "14px",
                        background:
                          found
                            ? "#ecfdf5"
                            : "#f8fafc",
                        border:
                          found
                            ? "1px solid #86efac"
                            : "1px solid #e2e8f0",
                        color:
                          found
                            ? "#166534"
                            : "#64748b",
                        fontWeight:
                          900,
                        textDecoration:
                          found
                            ? "line-through"
                            : "none",
                      }}
                    >
                      {found
                        ? "✅ "
                        : "🔍 "}
                      {word}
                    </div>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={
                restartGame
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
                  "12px",
                background:
                  "#0f766e",
                color:
                  "#ffffff",
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
      </div>

      {completed && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 999,
            display:
              "grid",
            placeItems:
              "center",
            background:
              "rgba(15,23,42,.55)",
            padding:
              "16px",
          }}
        >
          <div
            style={{
              width:
                "min(100%,480px)",
              background:
                "#ffffff",
              borderRadius:
                "30px",
              padding:
                "28px",
              textAlign:
                "center",
              boxShadow:
                "0 24px 60px rgba(15,23,42,.25)",
            }}
          >
            <div
              style={{
                fontSize:
                  "64px",
              }}
            >
              🏆
            </div>

            <h2
              style={{
                margin:
                  "10px 0 6px",
                color:
                  "#0f766e",
                fontSize:
                  "30px",
              }}
            >
              أنهيت التحدي!
            </h2>

            <p
              style={{
                margin:
                  "0 0 18px",
                color:
                  "#64748b",
              }}
            >
              اكتشفت جميع
              الكلمات في
            </p>

            <strong
              style={{
                display:
                  "block",
                fontSize:
                  "38px",
                color:
                  "#1d4ed8",
                marginBottom:
                  "18px",
              }}
            >
              ⏱️ {formattedTime}
            </strong>

            <div
              style={{
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "18px",
                padding:
                  "15px",
                marginBottom:
                  "14px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    900,
                  color:
                    "#334155",
                  marginBottom:
                    "7px",
                }}
              >
                اسمك (اختياري)
              </label>

              <input
                placeholder="اكتب اسمك إن رغبت"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "12px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid #cbd5e1",
                  textAlign:
                    "right",
                }}
              />
            </div>

            <button
              type="button"
              onClick={
                restartGame
              }
              style={{
                width:
                  "100%",
                border:
                  "none",
                borderRadius:
                  "15px",
                padding:
                  "13px",
                background:
                  "#0f766e",
                color:
                  "#ffffff",
                fontWeight:
                  900,
                cursor:
                  "pointer",
              }}
            >
              🔄 حاول كسر وقتك
            </button>
          </div>
        </div>
      )}
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
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #dceee8",
        borderRadius:
          "20px",
        padding:
          "16px",
        textAlign:
          "center",
        boxShadow:
          "0 8px 20px rgba(30,90,60,.06)",
      }}
    >
      <div
        style={{
          fontSize:
            "28px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin:
            "6px 0 2px",
          color:
            "#64748b",
          fontSize:
            "12px",
          fontWeight:
            800,
        }}
      >
        {title}
      </p>

      <strong
        style={{
          color:
            "#176c49",
          fontSize:
            "22px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}