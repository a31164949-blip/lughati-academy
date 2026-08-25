"use client";

import Link from "next/link";
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";

type Cell = {
  row: number;
  col: number;
};

type FoundWord = {
  word: string;
  cells: Cell[];
};

type GameScore = {
  id: string;
  playerName: string;
  timeSeconds: number;
};

const fallbackTargetWords = [
  "كتاب",
  "قلم",
  "مدرسة",
  "معلم",
  "باب",
  "نور",
];

const fallbackGrid = [
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
    lostWordWords,
    setLostWordWords,
  ] = useState<string[]>([]);

  const [
    wordsLoading,
    setWordsLoading,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLostWordWords() {
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
          typeof data.lostWordWords ===
          "string"
            ? data.lostWordWords
            : "";

        const parsedWords =
          rawWords
            .split(/[\n،,]+/)
            .map((word) =>
              word
                .replace(/\s+/g, "")
                .trim()
            )
            .filter(Boolean);
          console.log(
  "كلمات الكلمة الضائعة من Firestore:",
  parsedWords
);
        setLostWordWords(parsedWords);
      } catch (error) {
        console.error(
          "تعذر تحميل كلمات الكلمة الضائعة:",
          error
        );

        setLostWordWords([]);
      } finally {
        if (active) {
          setWordsLoading(false);
        }
      }
    }

    void loadLostWordWords();

    return () => {
      active = false;
    };
  }, []);

  const targetWords =
    useMemo<string[]>(() => {
      if (
        wordsLoading ||
        lostWordWords.length < 3
      ) {
        return fallbackTargetWords;
      }

      const cleanedWords =
        Array.from(
          new Set(
            lostWordWords
              .map((word) =>
                word
                  .replace(/\s+/g, "")
                  .trim()
              )
              .filter(
                (word) =>
                  word.length >= 2 &&
                  word.length <= 8
              )
          )
        );

      return cleanedWords.length >= 3
        ? cleanedWords.slice(0, 6)
        : fallbackTargetWords;
    }, [
      lostWordWords,
      wordsLoading,
    ]);

  const grid =
    useMemo<string[][]>(() => {
      const rows = 8;
      const cols = 8;

      const fillerLetters = [
        "ا",
        "ب",
        "ت",
        "ث",
        "ج",
        "ح",
        "د",
        "ر",
        "س",
        "ش",
        "ع",
        "ف",
        "ق",
        "ك",
        "ل",
        "م",
        "ن",
        "ه",
        "و",
        "ي",
      ];

      const board = Array.from(
        { length: rows },
        () =>
          Array.from(
            { length: cols },
            () => ""
          )
      );

      /*
       * نضمن وجود كل كلمة مطلوبة داخل الشبكة.
       * نضع كل كلمة في صف مستقل، مع تغيير موضع البداية
       * واتجاهها بطريقة حتمية حتى لا تتغير الشبكة
       * في كل إعادة رسم.
       */
      const seedText =
        targetWords.join("|");

      function deterministicNumber(
        key: string,
        max: number
      ) {
        let hash = 2166136261;

        for (
          let index = 0;
          index < key.length;
          index++
        ) {
          hash =
            Math.imul(
              hash ^
                key.charCodeAt(index),
              16777619
            );
        }

        const positiveHash =
          hash >>> 0;

        return max > 0
          ? positiveHash % max
          : 0;
      }

      targetWords.forEach(
        (word, index) => {
          const row =
            index % rows;

          const maxStart =
            Math.max(
              0,
              cols - word.length
            );

          const startCol =
            deterministicNumber(
              `${seedText}-${word}-${index}-start`,
              maxStart + 1
            );

          const reversed =
            deterministicNumber(
              `${seedText}-${word}-${index}-reverse`,
              2
            ) === 1;

          const letters =
            reversed
              ? Array.from(
                  word
                ).reverse()
              : Array.from(
                  word
                );

          letters.forEach(
            (letter, letterIndex) => {
              board[row][
                startCol + letterIndex
              ] = letter;
            }
          );
        }
      );

      for (
        let row = 0;
        row < rows;
        row++
      ) {
        for (
          let col = 0;
          col < cols;
          col++
        ) {
          if (!board[row][col]) {
            board[row][col] =
              fillerLetters[
                deterministicNumber(
                  `${seedText}-${row}-${col}-filler`,
                  fillerLetters.length
                )
              ];
          }
        }
      }

      return board;
    }, [targetWords]);

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
  showCompletedModal,
  setShowCompletedModal,
] = useState(true);

  const [
    bestTime,
    setBestTime,
  ] = useState<number | null>(null);

  const [
    isNewRecord,
    setIsNewRecord,
  ] = useState(false);

  const [
    playerName,
    setPlayerName,
  ] = useState("");

  const [
    savingScore,
    setSavingScore,
  ] = useState(false);

  const [
    scoreSaved,
    setScoreSaved,
  ] = useState(false);

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    topScores,
    setTopScores,
  ] = useState<GameScore[]>([]);

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
    const recordRef = doc(
      db,
      "gameRecords",
      "lughati-lost-word"
    );

    const unsubscribe = onSnapshot(
      recordRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setBestTime(null);
          return;
        }

        const value = snapshot.data().bestTime;

        setBestTime(
          typeof value === "number"
            ? value
            : null
        );
      },
      (error) => {
        console.error(
          "تعذر تحميل أسرع وقت للكلمة الضائعة:",
          error
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

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
      const finalTime = Math.max(
        1,
        seconds
      );

      setCompleted(true);
      setShowCompletedModal(true);
      setMessage(
        "🏆 أحسنت! اكتشفت جميع الكلمات."
      );

      void saveBestTime(finalTime);

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

  async function saveBestTime(
    finalTime: number
  ) {
    try {
      const safeTime = Math.max(
        1,
        Math.floor(finalTime)
      );

      const recordRef = doc(
        db,
        "gameRecords",
        "lughati-lost-word"
      );

      let newRecord = false;

      await runTransaction(
        db,
        async (transaction) => {
          const snapshot =
            await transaction.get(recordRef);

          const previousBest =
            snapshot.exists()
              ? snapshot.data().bestTime
              : null;

          if (
            typeof previousBest !== "number" ||
            safeTime < previousBest
          ) {
            transaction.set(
              recordRef,
              {
                gameId: "lughati-lost-word",
                bestTime: safeTime,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            newRecord = true;
          }
        }
      );

      if (newRecord) {
        setBestTime(safeTime);
        setIsNewRecord(true);
      }
    } catch (error) {
      console.error(
        "تعذر حفظ أسرع وقت للكلمة الضائعة:",
        error
      );
    }
  }

  async function saveScore() {
    if (
      savingScore ||
      scoreSaved ||
      !completed
    ) {
      return;
    }

    setSavingScore(true);
    setSaveMessage("");

    try {
      const response =
        await fetch(
          "/api/game-scores",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              gameId:
                "lost-word",
              playerName,
              timeSeconds:
                seconds,
            }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
          scores?: GameScore[];
        };

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.message ||
            "تعذر حفظ النتيجة."
        );
      }

      setTopScores(
        Array.isArray(
          data.scores
        )
          ? data.scores
          : []
      );

      setScoreSaved(true);

      setSaveMessage(
        "✅ تم تسجيل وقتك في لوحة الكلمة الضائعة."
      );
    } catch (error) {
      console.error(
        "Failed to save score:",
        error
      );

      setSaveMessage(
        "❌ تعذر تسجيل الوقت الآن. حاول مرة أخرى."
      );
    } finally {
      setSavingScore(false);
    }
  }

  function restartGame() {
    setFoundWords([]);
    setShowCompletedModal(false);
    setSelectedCells([]);
    setStartCell(null);
    setIsSelecting(false);
    setSeconds(0);
    setStarted(false);
    setCompleted(false);
    setPlayerName("");
    setSavingScore(false);
    setScoreSaved(false);
    setSaveMessage("");
    setTopScores([]);
    setIsNewRecord(false);
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
              href="/#weekly-games"
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

          <StatCard
            icon="🏆"
            title="أسرع وقت"
            value={
              bestTime !== null
                ? formatSeconds(bestTime)
                : "لا يوجد بعد"
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

      {completed &&
  showCompletedModal && (
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
              position: "relative",
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
            <button
              type="button"
              onClick={() =>
                setShowCompletedModal(false)
              }
              aria-label="إغلاق نافذة النتيجة"
              title="إغلاق"
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                width: "42px",
                height: "42px",
                display: "grid",
                placeItems: "center",
                border: "1px solid #d7e7df",
                borderRadius: "50%",
                background: "#ffffff",
                color: "#49675a",
                fontSize: "21px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow:
                  "0 6px 16px rgba(0,0,0,.09)",
                zIndex: 10,
              }}
            >
              ✕
            </button>

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

            {isNewRecord && (
              <div
                style={{
                  margin: "0 0 14px",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  background: "#fff7d6",
                  border: "1px solid #f2d56b",
                  color: "#8a5a00",
                  fontWeight: 900,
                }}
              >
                🥇 رقم قياسي جديد!
              </div>
            )}

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
                value={
                  playerName
                }
                onChange={(
                  event
                ) =>
                  setPlayerName(
                    event.target.value
                  )
                }
                maxLength={30}
                placeholder="اكتب اسمك إن رغبت"
                disabled={
                  scoreSaved
                }
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
                  background:
                    scoreSaved
                      ? "#f1f5f9"
                      : "#ffffff",
                }}
              />

              <p
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    "#64748b",
                  fontSize:
                    "12px",
                  lineHeight:
                    1.7,
                }}
              >
                إذا تركت الاسم فارغًا
                سيظهر في اللوحة باسم
                «متحدٍ مجهول».
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void saveScore()
              }
              disabled={
                savingScore ||
                scoreSaved
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
                  scoreSaved
                    ? "#16a34a"
                    : savingScore
                    ? "#94a3b8"
                    : "#1d4ed8",
                color:
                  "#ffffff",
                fontWeight:
                  900,
                cursor:
                  savingScore ||
                  scoreSaved
                    ? "default"
                    : "pointer",
                marginBottom:
                  "10px",
              }}
            >
              {scoreSaved
                ? "✅ تم تسجيل وقتك"
                : savingScore
                ? "⏳ جارٍ تسجيل الوقت..."
                : "🏆 سجّل وقتي"}
            </button>

            {saveMessage && (
              <div
                style={{
                  marginBottom:
                    "12px",
                  padding:
                    "10px 12px",
                  borderRadius:
                    "13px",
                  background:
                    scoreSaved
                      ? "#ecfdf5"
                      : "#fff7ed",
                  color:
                    scoreSaved
                      ? "#166534"
                      : "#9a3412",
                  fontSize:
                    "13px",
                  fontWeight:
                    900,
                }}
              >
                {saveMessage}
              </div>
            )}

            {topScores.length >
              0 && (
              <div
                style={{
                  marginBottom:
                    "12px",
                  padding:
                    "14px",
                  borderRadius:
                    "18px",
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  textAlign:
                    "right",
                }}
              >
                <strong
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "10px",
                    color:
                      "#312e81",
                    textAlign:
                      "center",
                  }}
                >
                  ⚡ أسرع 3 أوقات
                  في الكلمة الضائعة
                </strong>

                {topScores.map(
                  (
                    score,
                    index
                  ) => {
                    const minutes =
                      Math.floor(
                        score.timeSeconds /
                          60
                      );

                    const remaining =
                      score.timeSeconds %
                      60;

                    const scoreTime =
                      `${String(
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

                    const medal =
                      index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : "🥉";

                    return (
                      <div
                        key={
                          score.id
                        }
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap:
                            "10px",
                          padding:
                            "8px 4px",
                          borderBottom:
                            index <
                            topScores.length -
                              1
                              ? "1px solid #e2e8f0"
                              : "none",
                          fontWeight:
                            900,
                          color:
                            "#334155",
                        }}
                      >
                        <span>
                          {medal}{" "}
                          {
                            score.playerName
                          }
                        </span>

                        <span
                          style={{
                            color:
                              "#1d4ed8",
                          }}
                        >
                          ⏱️{" "}
                          {scoreTime}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}

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

function formatSeconds(
  totalSeconds: number
) {
  const safe = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const minutes =
    Math.floor(safe / 60);

  const seconds =
    safe % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
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