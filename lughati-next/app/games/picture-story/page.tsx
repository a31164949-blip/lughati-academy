"use client";

import Link from "next/link";
import {
  DragEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";

type LevelId = "easy" | "medium" | "hard";

type Level = {
  id: LevelId;
  title: string;
  icon: string;
  pieces: number;
  rows: number;
  cols: number;
  description: string;
};

type StoryScene = {
  id: number;
  title: string;
  caption: string;
  svg: string;
};

type Piece = {
  id: number;
  correctIndex: number;
};

const LEVELS: Level[] = [
  {
    id: "easy",
    title: "سهل",
    icon: "🟢",
    pieces: 4,
    rows: 2,
    cols: 2,
    description: "4 قطع لكل صورة",
  },
  {
    id: "medium",
    title: "متوسط",
    icon: "🟡",
    pieces: 8,
    rows: 2,
    cols: 4,
    description: "8 قطع لكل صورة",
  },
  {
    id: "hard",
    title: "صعب",
    icon: "🔴",
    pieces: 14,
    rows: 2,
    cols: 7,
    description: "14 قطعة لكل صورة",
  },
];

function svgData(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const STORY: StoryScene[] = [
  {
    id: 1,
    title: "زرع البذرة",
    caption: "وضع فارس البذرة في التربة.",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#dff6ff"/>
            <stop offset="1" stop-color="#fff7df"/>
          </linearGradient>
        </defs>
        <rect width="900" height="560" rx="38" fill="url(#sky)"/>
        <circle cx="760" cy="90" r="48" fill="#ffd45e"/>
        <rect y="360" width="900" height="200" fill="#9a603a"/>
        <path d="M0 360 C160 320 260 390 430 350 C600 312 710 375 900 335 L900 560 L0 560 Z" fill="#7f4b2c"/>
        <ellipse cx="450" cy="405" rx="85" ry="22" fill="#5f351f"/>
        <circle cx="450" cy="396" r="12" fill="#47301e"/>
        <g transform="translate(360 180)">
          <circle cx="70" cy="50" r="34" fill="#f3c69f"/>
          <path d="M35 42 Q70 3 105 42" fill="#263238"/>
          <rect x="42" y="82" width="58" height="100" rx="20" fill="#2f9b68"/>
          <rect x="22" y="105" width="28" height="92" rx="14" fill="#f3c69f" transform="rotate(28 36 151)"/>
          <rect x="92" y="105" width="28" height="92" rx="14" fill="#f3c69f" transform="rotate(-35 106 151)"/>
          <rect x="48" y="174" width="20" height="100" rx="10" fill="#304b78"/>
          <rect x="76" y="174" width="20" height="100" rx="10" fill="#304b78"/>
        </g>
        <g fill="#5aa85c">
          <circle cx="120" cy="120" r="18"/><circle cx="165" cy="95" r="13"/><circle cx="210" cy="130" r="15"/>
        </g>
        <text x="45" y="70" font-family="Arial" font-size="34" font-weight="700" fill="#325d4d">بداية القصة</text>
      </svg>
    `,
  },
  {
    id: 2,
    title: "سقى التربة",
    caption: "سقى فارس البذرة بالماء.",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#d9f5ff"/>
            <stop offset="1" stop-color="#ecfff0"/>
          </linearGradient>
        </defs>
        <rect width="900" height="560" rx="38" fill="url(#sky2)"/>
        <circle cx="770" cy="90" r="45" fill="#ffd45e"/>
        <rect y="355" width="900" height="205" fill="#895335"/>
        <ellipse cx="515" cy="410" rx="90" ry="24" fill="#61391f"/>
        <g transform="translate(250 175)">
          <circle cx="65" cy="48" r="34" fill="#f3c69f"/>
          <path d="M30 40 Q65 4 100 40" fill="#263238"/>
          <rect x="37" y="80" width="60" height="105" rx="20" fill="#2f9b68"/>
          <rect x="88" y="115" width="26" height="105" rx="13" fill="#f3c69f" transform="rotate(-50 101 168)"/>
          <rect x="44" y="178" width="20" height="100" rx="10" fill="#304b78"/>
          <rect x="73" y="178" width="20" height="100" rx="10" fill="#304b78"/>
        </g>
        <g transform="translate(455 285)">
          <path d="M0 30 L105 10 L132 58 L28 78 Z" fill="#68a9d3"/>
          <path d="M108 15 L162 -5 L170 10 L125 32 Z" fill="#5a91b2"/>
          <path d="M8 58 Q-10 80 -25 96" stroke="#4aa7e8" stroke-width="9" fill="none"/>
          <path d="M23 66 Q5 94 -8 112" stroke="#4aa7e8" stroke-width="8" fill="none"/>
          <path d="M38 70 Q28 99 18 118" stroke="#4aa7e8" stroke-width="7" fill="none"/>
        </g>
        <text x="45" y="70" font-family="Arial" font-size="34" font-weight="700" fill="#325d4d">المشهد الثاني</text>
      </svg>
    `,
  },
  {
    id: 3,
    title: "نمت النبتة",
    caption: "ظهرت أوراق خضراء صغيرة.",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
        <defs>
          <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e3f8ff"/>
            <stop offset="1" stop-color="#f4ffe9"/>
          </linearGradient>
        </defs>
        <rect width="900" height="560" rx="38" fill="url(#sky3)"/>
        <circle cx="760" cy="90" r="48" fill="#ffd45e"/>
        <rect y="360" width="900" height="200" fill="#98603b"/>
        <ellipse cx="480" cy="420" rx="95" ry="22" fill="#61391f"/>
        <path d="M480 420 C480 360 470 330 478 285" stroke="#3c9657" stroke-width="15" fill="none" stroke-linecap="round"/>
        <ellipse cx="430" cy="330" rx="55" ry="28" fill="#58b56d" transform="rotate(25 430 330)"/>
        <ellipse cx="525" cy="310" rx="55" ry="28" fill="#69c67b" transform="rotate(-25 525 310)"/>
        <g transform="translate(250 180)">
          <circle cx="65" cy="48" r="34" fill="#f3c69f"/>
          <path d="M30 40 Q65 4 100 40" fill="#263238"/>
          <rect x="37" y="80" width="60" height="105" rx="20" fill="#2f9b68"/>
          <rect x="44" y="178" width="20" height="100" rx="10" fill="#304b78"/>
          <rect x="73" y="178" width="20" height="100" rx="10" fill="#304b78"/>
        </g>
        <g fill="#76c977">
          <circle cx="110" cy="110" r="16"/><circle cx="145" cy="88" r="12"/><circle cx="190" cy="118" r="15"/>
        </g>
        <text x="45" y="70" font-family="Arial" font-size="34" font-weight="700" fill="#325d4d">المشهد الثالث</text>
      </svg>
    `,
  },
  {
    id: 4,
    title: "أزهرت النبتة",
    caption: "كبرت النبتة وأصبحت زهرة جميلة.",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
        <defs>
          <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#dff8ff"/>
            <stop offset="1" stop-color="#fff5ec"/>
          </linearGradient>
        </defs>
        <rect width="900" height="560" rx="38" fill="url(#sky4)"/>
        <circle cx="755" cy="90" r="50" fill="#ffd45e"/>
        <rect y="355" width="900" height="205" fill="#8d5737"/>
        <ellipse cx="500" cy="430" rx="100" ry="23" fill="#61391f"/>
        <path d="M500 430 C500 360 495 300 500 245" stroke="#3c9657" stroke-width="16" fill="none" stroke-linecap="round"/>
        <ellipse cx="455" cy="335" rx="55" ry="28" fill="#58b56d" transform="rotate(25 455 335)"/>
        <ellipse cx="550" cy="320" rx="55" ry="28" fill="#69c67b" transform="rotate(-25 550 320)"/>
        <g transform="translate(500 220)">
          <g fill="#f4c542">
            <ellipse rx="28" ry="65" transform="rotate(0) translate(0 -60)"/>
            <ellipse rx="28" ry="65" transform="rotate(60) translate(0 -60)"/>
            <ellipse rx="28" ry="65" transform="rotate(120) translate(0 -60)"/>
            <ellipse rx="28" ry="65" transform="rotate(180) translate(0 -60)"/>
            <ellipse rx="28" ry="65" transform="rotate(240) translate(0 -60)"/>
            <ellipse rx="28" ry="65" transform="rotate(300) translate(0 -60)"/>
          </g>
          <circle r="48" fill="#7d4d22"/>
        </g>
        <g transform="translate(245 180)">
          <circle cx="65" cy="48" r="34" fill="#f3c69f"/>
          <path d="M30 40 Q65 4 100 40" fill="#263238"/>
          <rect x="37" y="80" width="60" height="105" rx="20" fill="#2f9b68"/>
          <rect x="44" y="178" width="20" height="100" rx="10" fill="#304b78"/>
          <rect x="73" y="178" width="20" height="100" rx="10" fill="#304b78"/>
        </g>
        <text x="45" y="70" font-family="Arial" font-size="34" font-weight="700" fill="#325d4d">نهاية القصة</text>
      </svg>
    `,
  },
];

function createPieces(count: number) {
  return Array.from(
    { length: count },
    (_, index) => ({
      id: index + 1,
      correctIndex: index,
    })
  );
}

function shufflePieces(
  pieces: Piece[],
  seed = 1
) {
  const next = [...pieces];

  // خلط حتمي ومستقر حتى لا تتغير القطع أثناء إعادة الرسم.
  for (
    let index = next.length - 1;
    index > 0;
    index--
  ) {
    const swapIndex =
      (seed * 17 +
        index * 7 +
        3) %
      (index + 1);

    [
      next[index],
      next[swapIndex],
    ] = [
      next[swapIndex],
      next[index],
    ];
  }

  // ضمان ألا تبدأ محلولة.
  const solved = next.every(
    (piece, index) =>
      piece.correctIndex === index
  );

  if (
    solved &&
    next.length > 1
  ) {
    [
      next[0],
      next[1],
    ] = [
      next[1],
      next[0],
    ];
  }

  return next;
}

function formatTime(
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

export default function PictureStoryPage() {
  const [
    levelId,
    setLevelId,
  ] = useState<LevelId>("easy");

  const level =
    LEVELS.find(
      (item) =>
        item.id === levelId
    ) ?? LEVELS[0];

  const [
    sceneIndex,
    setSceneIndex,
  ] = useState(0);

  const currentScene =
    STORY[sceneIndex];

  const [
    pieces,
    setPieces,
  ] = useState<Piece[]>(() =>
    shufflePieces(
      createPieces(
        LEVELS[0].pieces
      ),
      1
    )
  );

  const [
    selectedPieceIndex,
    setSelectedPieceIndex,
  ] = useState<number | null>(
    null
  );

  const [
    draggingIndex,
    setDraggingIndex,
  ] = useState<number | null>(
    null
  );

  const [
    started,
    setStarted,
  ] = useState(false);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    seconds,
    setSeconds,
  ] = useState(0);

  const [
    message,
    setMessage,
  ] = useState(
    "ابدأ بتركيب الصورة الأولى."
  );

  const [
    bestTime,
    setBestTime,
  ] = useState<number | null>(
    null
  );

  const [
    isNewRecord,
    setIsNewRecord,
  ] = useState(false);

  const [
    showResult,
    setShowResult,
  ] = useState(false);

  const [
    completedScenes,
    setCompletedScenes,
  ] = useState<number[]>([]);

  const [
    storyOrder,
    setStoryOrder,
  ] = useState<number[]>([
    3, 1, 4, 2,
  ]);

  const [
    selectedStoryIndex,
    setSelectedStoryIndex,
  ] = useState<number | null>(
    null
  );

  const [
    phase,
    setPhase,
  ] = useState<
    "puzzle" | "sequence"
  >("puzzle");

  const recordId =
    `lughati-picture-story-${level.id}`;

  const sceneImage =
    useMemo(
      () =>
        svgData(
          currentScene.svg
        ),
      [currentScene]
    );

  const puzzleSolved =
    useMemo(
      () =>
        pieces.every(
          (piece, index) =>
            piece.correctIndex ===
            index
        ),
      [pieces]
    );

  useEffect(() => {
    const recordRef = doc(
      db,
      "gameRecords",
      recordId
    );

    const unsubscribe =
      onSnapshot(
        recordRef,
        (snapshot) => {
          if (
            !snapshot.exists()
          ) {
            setBestTime(null);
            return;
          }

          const value =
            snapshot.data()
              .bestTime;

          setBestTime(
            typeof value ===
              "number"
              ? value
              : null
          );
        },
        (error) => {
          console.error(
            "تعذر تحميل أسرع وقت لبازل القصة:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, [recordId]);

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

  function startTimer() {
    if (!started) {
      setStarted(true);
      setSeconds(0);
    }
  }

  function resetPuzzleForScene(
    nextSceneIndex: number,
    nextLevel = level
  ) {
    setSceneIndex(
      nextSceneIndex
    );

    setPieces(
      shufflePieces(
        createPieces(
          nextLevel.pieces
        ),
        nextSceneIndex +
          nextLevel.pieces
      )
    );

    setSelectedPieceIndex(
      null
    );

    setDraggingIndex(null);
  }

  function changeLevel(
    nextLevelId: LevelId
  ) {
    const nextLevel =
      LEVELS.find(
        (item) =>
          item.id ===
          nextLevelId
      ) ?? LEVELS[0];

    setLevelId(
      nextLevelId
    );

    setCompleted(false);
    setShowResult(false);
    setIsNewRecord(false);
    setStarted(false);
    setSeconds(0);
    setCompletedScenes([]);
    setStoryOrder([
      3, 1, 4, 2,
    ]);
    setSelectedStoryIndex(
      null
    );
    setPhase("puzzle");

    resetPuzzleForScene(
      0,
      nextLevel
    );

    setMessage(
      `ابدأ مستوى ${nextLevel.title} بتركيب الصورة الأولى.`
    );
  }

  function swapPieces(
    first: number,
    second: number
  ) {
    if (
      first === second ||
      completed
    ) {
      return;
    }

    startTimer();

    setPieces(
      (current) => {
        const next = [
          ...current,
        ];

        [
          next[first],
          next[second],
        ] = [
          next[second],
          next[first],
        ];

        return next;
      }
    );
  }

  function handlePieceClick(
    index: number
  ) {
    if (
      completed ||
      phase !== "puzzle"
    ) {
      return;
    }

    startTimer();

    if (
      selectedPieceIndex ===
      null
    ) {
      setSelectedPieceIndex(
        index
      );

      setMessage(
        "اختر القطعة الثانية لتبديل مكانها."
      );

      return;
    }

    if (
      selectedPieceIndex ===
      index
    ) {
      setSelectedPieceIndex(
        null
      );

      setMessage(
        "تم إلغاء التحديد."
      );

      return;
    }

    swapPieces(
      selectedPieceIndex,
      index
    );

    setSelectedPieceIndex(
      null
    );

    setMessage(
      "✨ واصل حتى تكتمل الصورة."
    );
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    index: number
  ) {
    if (
      completed ||
      phase !== "puzzle"
    ) {
      event.preventDefault();
      return;
    }

    startTimer();

    setDraggingIndex(index);

    event.dataTransfer
      .setData(
        "text/plain",
        String(index)
      );
  }

  function handleDrop(
    event: DragEvent<HTMLButtonElement>,
    targetIndex: number
  ) {
    event.preventDefault();

    const source =
      draggingIndex ??
      Number(
        event.dataTransfer
          .getData(
            "text/plain"
          )
      );

    if (
      Number.isInteger(
        source
      )
    ) {
      swapPieces(
        source,
        targetIndex
      );
    }

    setDraggingIndex(null);
  }

  function finishCurrentPuzzle() {
    if (!puzzleSolved) {
      setMessage(
        "🔎 ما زالت بعض القطع في غير مكانها."
      );
      return;
    }

    const completedSet =
      Array.from(
        new Set([
          ...completedScenes,
          currentScene.id,
        ])
      );

    setCompletedScenes(
      completedSet
    );

    if (
      sceneIndex <
      STORY.length - 1
    ) {
      const nextIndex =
        sceneIndex + 1;

      resetPuzzleForScene(
        nextIndex
      );

      setMessage(
        `✅ اكتملت الصورة! انتقلنا إلى المشهد ${nextIndex + 1}.`
      );

      return;
    }

    setPhase("sequence");
    setMessage(
      "📖 أحسنت! رتّب الآن الصور الأربع لتكوين القصة."
    );
  }

  function swapStory(
    first: number,
    second: number
  ) {
    setStoryOrder(
      (current) => {
        const next = [
          ...current,
        ];

        [
          next[first],
          next[second],
        ] = [
          next[second],
          next[first],
        ];

        return next;
      }
    );
  }

  function handleStoryClick(
    index: number
  ) {
    if (
      phase !== "sequence" ||
      completed
    ) {
      return;
    }

    startTimer();

    if (
      selectedStoryIndex ===
      null
    ) {
      setSelectedStoryIndex(
        index
      );

      setMessage(
        "اختر الصورة الثانية لتبديل الترتيب."
      );

      return;
    }

    if (
      selectedStoryIndex ===
      index
    ) {
      setSelectedStoryIndex(
        null
      );

      return;
    }

    swapStory(
      selectedStoryIndex,
      index
    );

    setSelectedStoryIndex(
      null
    );

    setMessage(
      "✨ راجع تسلسل القصة."
    );
  }

  async function saveBestTime(
    finalTime: number
  ) {
    try {
      const safeTime =
        Math.max(
          1,
          Math.floor(
            finalTime
          )
        );

      const recordRef = doc(
        db,
        "gameRecords",
        recordId
      );

      let newRecord = false;

      await runTransaction(
        db,
        async (
          transaction
        ) => {
          const snapshot =
            await transaction.get(
              recordRef
            );

          const previousBest =
            snapshot.exists()
              ? snapshot.data()
                  .bestTime
              : null;

          if (
            typeof previousBest !==
              "number" ||
            safeTime <
              previousBest
          ) {
            transaction.set(
              recordRef,
              {
                gameId:
                  recordId,
                level:
                  level.id,
                bestTime:
                  safeTime,
                updatedAt:
                  serverTimestamp(),
              },
              { merge: true }
            );

            newRecord = true;
          }
        }
      );

      if (newRecord) {
        setBestTime(
          safeTime
        );
        setIsNewRecord(
          true
        );
      }
    } catch (error) {
      console.error(
        "تعذر حفظ أسرع وقت لبازل القصة:",
        error
      );
    }
  }

  function checkStoryOrder() {
    const correct =
      storyOrder.every(
        (sceneId, index) =>
          sceneId ===
          index + 1
      );

    if (!correct) {
      setMessage(
        "🔎 ترتيب القصة غير صحيح بعد. فكّر في تسلسل الأحداث."
      );
      return;
    }

    const finalTime =
      Math.max(
        1,
        seconds
      );

    setCompleted(true);
    setShowResult(true);

    setMessage(
      "🏆 رائع! ركّبت الصور ورتبت القصة بنجاح."
    );

    void saveBestTime(
      finalTime
    );
  }

  function restartGame() {
    setCompleted(false);
    setShowResult(false);
    setIsNewRecord(false);
    setStarted(false);
    setSeconds(0);
    setCompletedScenes([]);
    setStoryOrder([
      3, 1, 4, 2,
    ]);
    setSelectedStoryIndex(
      null
    );
    setPhase("puzzle");

    resetPuzzleForScene(
      0
    );

    setMessage(
      `ابدأ مستوى ${level.title} بتركيب الصورة الأولى.`
    );
  }

  const overallProgress =
    phase === "sequence"
      ? 90
      : Math.round(
          ((sceneIndex +
            (puzzleSolved
              ? 1
              : 0)) /
            STORY.length) *
            80
        );

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f3fbf7 0%,#f8fbff 52%,#fff8ed 100%)",
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
            marginBottom:
              "15px",
          }}
        >
          <Link
            href="/#weekly-games"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: "7px",
              textDecoration:
                "none",
              color: "#176d4c",
              background:
                "#ffffff",
              border:
                "1px solid #d4e8dd",
              padding:
                "11px 17px",
              borderRadius:
                "15px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى الألعاب
          </Link>
        </div>

        <header
          style={{
            position:
              "relative",
            overflow: "hidden",
            borderRadius:
              "32px",
            padding: "28px",
            background:
              "linear-gradient(135deg,#7c3aed 0%,#2563eb 50%,#0ea5e9 100%)",
            color: "#ffffff",
            boxShadow:
              "0 18px 42px rgba(67,56,202,.20)",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width: "250px",
              height: "250px",
              borderRadius:
                "50%",
              background:
                "rgba(255,255,255,.09)",
              top: "-100px",
              left: "-70px",
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
                  "8px 13px",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,.17)",
                fontWeight: 900,
                fontSize:
                  "13px",
              }}
            >
              🧩 ساحة التحديات
            </span>

            <h1
              style={{
                margin:
                  "11px 0 7px",
                fontSize:
                  "clamp(34px,5vw,52px)",
              }}
            >
              بازل القصة
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth:
                  "760px",
                lineHeight: 1.9,
                fontWeight: 700,
                opacity: 0.95,
              }}
            >
              ركّب كل صورة من
              قطع البازل، ثم رتّب
              الصور المكتملة لتكوّن
              القصة الصحيحة.
            </p>
          </div>
        </header>

        <section
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: "12px",
          }}
          className="puzzleLevels"
        >
          {LEVELS.map(
            (item) => {
              const active =
                item.id ===
                levelId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    changeLevel(
                      item.id
                    )
                  }
                  style={{
                    border: active
                      ? "2px solid #4f46e5"
                      : "1px solid #dce5ef",
                    background:
                      active
                        ? "#eef2ff"
                        : "#ffffff",
                    borderRadius:
                      "21px",
                    padding:
                      "16px",
                    textAlign:
                      "right",
                    cursor:
                      "pointer",
                    boxShadow:
                      active
                        ? "0 12px 28px rgba(79,70,229,.13)"
                        : "0 7px 20px rgba(30,60,90,.05)",
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
                      marginTop:
                        "5px",
                      color:
                        "#3730a3",
                      fontSize:
                        "20px",
                    }}
                  >
                    {item.title}
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "3px",
                      color:
                        "#708078",
                      fontSize:
                        "13px",
                      fontWeight:
                        700,
                    }}
                  >
                    {item.description}
                  </span>
                </button>
              );
            }
          )}
        </section>

        <section
          style={{
            marginTop: "16px",
            padding:
              "13px 15px",
            borderRadius:
              "18px",
            background:
              completed
                ? "#ecfdf5"
                : "#ffffff",
            border:
              completed
                ? "1px solid #86efac"
                : "1px solid #dde8e3",
            textAlign:
              "center",
            color:
              completed
                ? "#166534"
                : "#52665d",
            fontWeight: 900,
          }}
        >
          {message}
        </section>

        <section
          style={{
            marginTop: "14px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",
            gap: "10px",
          }}
        >
          <StatCard
            icon="⏱️"
            title="وقتك"
            value={formatTime(
              seconds
            )}
          />

          <StatCard
            icon="🏆"
            title={`أفضل وقت — ${level.title}`}
            value={
              bestTime !== null
                ? formatTime(
                    bestTime
                  )
                : "لا يوجد بعد"
            }
          />

          <StatCard
            icon="🧩"
            title="القطع"
            value={`${level.pieces} قطعة`}
          />

          <StatCard
            icon="📖"
            title="المشهد"
            value={
              phase === "puzzle"
                ? `${sceneIndex + 1}/${STORY.length}`
                : "ترتيب القصة"
            }
          />
        </section>

        <div
          style={{
            marginTop: "14px",
            height: "11px",
            borderRadius:
              "999px",
            background:
              "#e6edf5",
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              width:
                `${completed ? 100 : overallProgress}%`,
              height: "100%",
              background:
                "linear-gradient(90deg,#7c3aed,#2563eb,#0ea5e9)",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        {phase === "puzzle" && (
          <section
            style={{
              marginTop:
                "18px",
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1.35fr) minmax(270px,.65fr)",
              gap: "18px",
            }}
            className="puzzleLayout"
          >
            <div
              style={{
                background:
                  "#ffffff",
                borderRadius:
                  "28px",
                padding:
                  "18px",
                border:
                  "1px solid #dfe7ef",
                boxShadow:
                  "0 12px 32px rgba(30,60,90,.07)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                  alignItems:
                    "center",
                  marginBottom:
                    "14px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#3730a3",
                    }}
                  >
                    🧩 ركّب الصورة
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#718078",
                      fontSize:
                        "13px",
                      fontWeight:
                        700,
                    }}
                  >
                    اسحب القطع أو
                    اختر قطعتين
                    لتبديلهما.
                  </p>
                </div>

                <span
                  style={{
                    padding:
                      "8px 12px",
                    borderRadius:
                      "999px",
                    background:
                      "#eef2ff",
                    color:
                      "#4338ca",
                    fontWeight:
                      900,
                  }}
                >
                  المشهد{" "}
                  {sceneIndex + 1}
                </span>
              </div>

              <div
                style={{
                  width:
                    "min(100%,820px)",
                  margin:
                    "0 auto",
                  aspectRatio:
                    "900 / 560",
                  display: "grid",
                  direction: "ltr",
                  gridTemplateColumns:
                    `repeat(${level.cols},1fr)`,
                  gridTemplateRows:
                    `repeat(${level.rows},1fr)`,
                  gap: "4px",
                  padding: "7px",
                  background:
                    "#e9eef5",
                  borderRadius:
                    "22px",
                  boxShadow:
                    "inset 0 0 0 1px #d8e0ea",
                }}
              >
                {pieces.map(
                  (
                    piece,
                    index
                  ) => {
                    const row =
                      Math.floor(
                        piece.correctIndex /
                          level.cols
                      );

                    const col =
                      piece.correctIndex %
                      level.cols;

                    const selected =
                      selectedPieceIndex ===
                      index;

                    const correct =
                      piece.correctIndex ===
                      index;

                    return (
                      <button
                        key={
                          piece.id
                        }
                        type="button"
                        draggable
                        onClick={() =>
                          handlePieceClick(
                            index
                          )
                        }
                        onDragStart={(
                          event
                        ) =>
                          handleDragStart(
                            event,
                            index
                          )
                        }
                        onDragOver={(
                          event
                        ) =>
                          event.preventDefault()
                        }
                        onDrop={(
                          event
                        ) =>
                          handleDrop(
                            event,
                            index
                          )
                        }
                        onDragEnd={() =>
                          setDraggingIndex(
                            null
                          )
                        }
                        style={{
                          position:
                            "relative",
                          border:
                            selected
                              ? "3px solid #f59e0b"
                              : correct
                              ? "2px solid #22c55e"
                              : "1px solid rgba(255,255,255,.7)",
                          borderRadius:
                            level.id ===
                            "hard"
                              ? "7px"
                              : "12px",
                          backgroundImage:
                            `url("${sceneImage}")`,
                          backgroundSize:
                            `${level.cols * 100}% ${level.rows * 100}%`,
                          backgroundPosition:
                            `${level.cols === 1 ? 0 : (col / (level.cols - 1)) * 100}% ${level.rows === 1 ? 0 : (row / (level.rows - 1)) * 100}%`,
                          backgroundRepeat:
                            "no-repeat",
                          cursor:
                            "grab",
                          overflow:
                            "hidden",
                          boxShadow:
                            selected
                              ? "0 8px 18px rgba(245,158,11,.25)"
                              : "0 2px 8px rgba(15,23,42,.10)",
                          transition:
                            "transform .16s ease, box-shadow .16s ease",
                        }}
                      >
                        {correct && (
                          <span
                            style={{
                              position:
                                "absolute",
                              top:
                                "4px",
                              right:
                                "4px",
                              width:
                                "21px",
                              height:
                                "21px",
                              display:
                                "grid",
                              placeItems:
                                "center",
                              borderRadius:
                                "50%",
                              background:
                                "rgba(34,197,94,.92)",
                              color:
                                "#fff",
                              fontSize:
                                "11px",
                              fontWeight:
                                900,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              <div
                style={{
                  marginTop:
                    "16px",
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={
                    finishCurrentPuzzle
                  }
                  style={{
                    border:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "13px 20px",
                    background:
                      "linear-gradient(135deg,#4f46e5,#2563eb)",
                    color:
                      "#ffffff",
                    fontWeight:
                      900,
                    cursor:
                      "pointer",
                  }}
                >
                  ✅ تحقق من الصورة
                </button>

                <button
                  type="button"
                  onClick={
                    restartGame
                  }
                  style={{
                    border:
                      "1px solid #d8e2ec",
                    borderRadius:
                      "15px",
                    padding:
                      "13px 18px",
                    background:
                      "#ffffff",
                    color:
                      "#475569",
                    fontWeight:
                      900,
                    cursor:
                      "pointer",
                  }}
                >
                  🔄 إعادة المستوى
                </button>
              </div>
            </div>

            <aside
              style={{
                display: "grid",
                gap: "14px",
                alignContent:
                  "start",
              }}
            >
              <div
                style={{
                  background:
                    "#ffffff",
                  borderRadius:
                    "22px",
                  padding:
                    "17px",
                  border:
                    "1px solid #dfe7ef",
                  boxShadow:
                    "0 9px 24px rgba(30,60,90,.05)",
                }}
              >
                <strong
                  style={{
                    display:
                      "block",
                    color:
                      "#3730a3",
                    fontSize:
                      "18px",
                  }}
                >
                  🖼️ الصورة الأصلية
                </strong>

                <img
                  src={
                    sceneImage
                  }
                  alt={
                    currentScene.title
                  }
                  style={{
                    width:
                      "100%",
                    marginTop:
                      "12px",
                    borderRadius:
                      "17px",
                    border:
                      "1px solid #dde6ef",
                    display:
                      "block",
                  }}
                />
              </div>

              <div
                style={{
                  background:
                    "#ffffff",
                  borderRadius:
                    "22px",
                  padding:
                    "17px",
                  border:
                    "1px solid #dfe7ef",
                }}
              >
                <strong
                  style={{
                    color:
                      "#176d4c",
                  }}
                >
                  📖 تلميح القصة
                </strong>

                <p
                  style={{
                    margin:
                      "8px 0 0",
                    color:
                      "#718078",
                    lineHeight:
                      1.8,
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                  }}
                >
                  ركّز في الصورة
                  الآن؛ ستحتاج
                  لاحقًا إلى ترتيب
                  المشاهد الأربعة.
                </p>
              </div>
            </aside>
          </section>
        )}

        {phase === "sequence" && (
          <section
            style={{
              marginTop:
                "18px",
              background:
                "#ffffff",
              borderRadius:
                "28px",
              padding:
                "22px",
              border:
                "1px solid #dfe7ef",
              boxShadow:
                "0 12px 32px rgba(30,60,90,.07)",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 5px",
                color:
                  "#3730a3",
                textAlign:
                  "center",
              }}
            >
              📖 رتّب القصة
            </h2>

            <p
              style={{
                margin:
                  "0 0 18px",
                textAlign:
                  "center",
                color:
                  "#718078",
                fontWeight:
                  700,
              }}
            >
              اختر صورتين
              لتبديلهما حتى
              يصبح تسلسل الأحداث
              صحيحًا.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4,minmax(0,1fr))",
                gap: "13px",
              }}
              className="storySequence"
            >
              {storyOrder.map(
                (
                  sceneId,
                  index
                ) => {
                  const scene =
                    STORY.find(
                      (item) =>
                        item.id ===
                        sceneId
                    )!;

                  const selected =
                    selectedStoryIndex ===
                    index;

                  return (
                    <button
                      key={
                        scene.id
                      }
                      type="button"
                      onClick={() =>
                        handleStoryClick(
                          index
                        )
                      }
                      style={{
                        position:
                          "relative",
                        border:
                          selected
                            ? "3px solid #f59e0b"
                            : "1px solid #dce5ef",
                        borderRadius:
                          "20px",
                        padding:
                          "10px",
                        background:
                          selected
                            ? "#fff7ed"
                            : "#ffffff",
                        cursor:
                          "pointer",
                        boxShadow:
                          selected
                            ? "0 12px 28px rgba(245,158,11,.17)"
                            : "0 7px 18px rgba(30,60,90,.06)",
                      }}
                    >
                      <span
                        style={{
                          position:
                            "absolute",
                          top:
                            "8px",
                          right:
                            "8px",
                          width:
                            "30px",
                          height:
                            "30px",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "50%",
                          background:
                            "#4f46e5",
                          color:
                            "#ffffff",
                          fontWeight:
                            900,
                          zIndex:
                            2,
                        }}
                      >
                        {index + 1}
                      </span>

                      <img
                        src={svgData(
                          scene.svg
                        )}
                        alt={
                          scene.title
                        }
                        style={{
                          width:
                            "100%",
                          aspectRatio:
                            "900 / 560",
                          objectFit:
                            "cover",
                          borderRadius:
                            "14px",
                          display:
                            "block",
                        }}
                      />

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            "8px",
                          color:
                            "#3730a3",
                        }}
                      >
                        {scene.title}
                      </strong>
                    </button>
                  );
                }
              )}
            </div>

            <div
              style={{
                marginTop:
                  "18px",
                display:
                  "flex",
                justifyContent:
                  "center",
                gap: "10px",
                flexWrap:
                  "wrap",
              }}
            >
              <button
                type="button"
                onClick={
                  checkStoryOrder
                }
                style={{
                  border:
                    "none",
                  borderRadius:
                    "15px",
                  padding:
                    "13px 22px",
                  background:
                    "linear-gradient(135deg,#16a34a,#059669)",
                  color:
                    "#ffffff",
                  fontWeight:
                    900,
                  cursor:
                    "pointer",
                }}
              >
                🏆 تحقق من القصة
              </button>

              <button
                type="button"
                onClick={
                  restartGame
                }
                style={{
                  border:
                    "1px solid #d8e2ec",
                  borderRadius:
                    "15px",
                  padding:
                    "13px 18px",
                  background:
                    "#ffffff",
                  color:
                    "#475569",
                  fontWeight:
                    900,
                  cursor:
                    "pointer",
                }}
              >
                🔄 إعادة المستوى
              </button>
            </div>
          </section>
        )}
      </div>

      {completed &&
        showResult && (
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
              padding:
                "18px",
              background:
                "rgba(15,23,42,.58)",
              backdropFilter:
                "blur(8px)",
            }}
          >
            <section
              dir="rtl"
              style={{
                position:
                  "relative",
                width:
                  "min(520px,100%)",
                borderRadius:
                  "30px",
                padding:
                  "34px 24px 26px",
                textAlign:
                  "center",
                background:
                  "linear-gradient(180deg,#ffffff,#f2fff7)",
                boxShadow:
                  "0 28px 75px rgba(15,23,42,.28)",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setShowResult(
                    false
                  )
                }
                aria-label="إغلاق نافذة النتيجة"
                style={{
                  position:
                    "absolute",
                  top: "14px",
                  left: "14px",
                  width:
                    "42px",
                  height:
                    "42px",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  border:
                    "1px solid #d8e7df",
                  borderRadius:
                    "50%",
                  background:
                    "#ffffff",
                  color:
                    "#49675a",
                  fontSize:
                    "21px",
                  fontWeight:
                    900,
                  cursor:
                    "pointer",
                }}
              >
                ✕
              </button>

              <div
                style={{
                  fontSize:
                    "72px",
                }}
              >
                🧩🏆
              </div>

              <h2
                style={{
                  margin:
                    "8px 0 6px",
                  color:
                    "#166534",
                  fontSize:
                    "31px",
                }}
              >
                بطل بازل القصة!
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "#64748b",
                  lineHeight:
                    1.8,
                  fontWeight:
                    700,
                }}
              >
                ركّبت الصور
                ورتبت أحداث القصة
                بنجاح في المستوى{" "}
                <strong>
                  {level.title}
                </strong>
                .
              </p>

              <div
                style={{
                  margin:
                    "18px auto",
                  maxWidth:
                    "280px",
                  padding:
                    "16px",
                  borderRadius:
                    "18px",
                  background:
                    "#ffffff",
                  border:
                    "1px solid #d7e8df",
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    color:
                      "#708078",
                    fontSize:
                      "12px",
                    fontWeight:
                      800,
                  }}
                >
                  زمنك
                </span>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "5px",
                    color:
                      "#166534",
                    fontSize:
                      "29px",
                  }}
                >
                  {formatTime(
                    seconds
                  )}
                </strong>
              </div>

              {isNewRecord && (
                <div
                  style={{
                    marginBottom:
                      "15px",
                    padding:
                      "11px 14px",
                    borderRadius:
                      "15px",
                    background:
                      "#fff7d6",
                    border:
                      "1px solid #f2d56b",
                    color:
                      "#8a5a00",
                    fontWeight:
                      900,
                  }}
                >
                  🥇 رقم قياسي جديد
                  في مستوى{" "}
                  {level.title}!
                </div>
              )}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={
                    restartGame
                  }
                  style={{
                    border:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "12px 17px",
                    background:
                      "#16a36a",
                    color:
                      "#ffffff",
                    fontWeight:
                      900,
                    cursor:
                      "pointer",
                  }}
                >
                  🔄 العب مرة أخرى
                </button>

                <Link
                  href="/#weekly-games"
                  style={{
                    textDecoration:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "12px 17px",
                    background:
                      "#ffffff",
                    color:
                      "#176d4c",
                    border:
                      "1px solid #d4e7dc",
                    fontWeight:
                      900,
                  }}
                >
                  🎮 ألعاب أخرى
                </Link>
              </div>
            </section>
          </div>
        )}

      <style>{`
        @media (max-width: 860px) {
          .puzzleLayout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 700px) {
          .puzzleLevels {
            grid-template-columns: 1fr !important;
          }

          .storySequence {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }
      `}</style>
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
          "1px solid #dfe7ef",
        borderRadius:
          "20px",
        padding: "16px",
        textAlign:
          "center",
        boxShadow:
          "0 8px 20px rgba(30,60,90,.05)",
      }}
    >
      <div
        style={{
          fontSize:
            "27px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin:
            "6px 0 2px",
          color:
            "#718078",
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
            "#3730a3",
          fontSize:
            "20px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
