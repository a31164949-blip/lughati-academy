import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getFirebaseAdminDb,
} from "../../../firebase-admin-db";

const allowedGames = new Set([
  "maze",
  "lost-word",
  "crosswords",
  "picture-story",
  "family-challenge",
  "detective",
  "30-seconds",
  "error-hunter",
  "genius",
]);

type ScoreResponse = {
  id: string;
  playerName: string;
  timeSeconds: number;
};

function cleanPlayerName(
  value: unknown
) {
  if (
    typeof value !== "string"
  ) {
    return "متحدٍ مجهول";
  }

  const clean =
    value
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 30);

  return (
    clean ||
    "متحدٍ مجهول"
  );
}

function validGameId(
  gameId: string
) {
  return allowedGames.has(
    gameId
  );
}

async function getTopScores(
  gameId: string
): Promise<ScoreResponse[]> {
  const db =
    getFirebaseAdminDb();

  const snapshot =
    await db
      .collection("gameScores")
      .doc(gameId)
      .collection("results")
      .orderBy(
        "timeSeconds",
        "asc"
      )
      .limit(3)
      .get();

  return snapshot.docs.map(
    (scoreDoc) => {
      const data =
        scoreDoc.data();

      return {
        id:
          scoreDoc.id,

        playerName:
          String(
            data.playerName ||
              "متحدٍ مجهول"
          ),

        timeSeconds:
          Number(
            data.timeSeconds ||
              0
          ),
      };
    }
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const gameId =
      request.nextUrl.searchParams
        .get("gameId")
        ?.trim() || "";

    if (
      !validGameId(gameId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "معرّف اللعبة غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    const scores =
      await getTopScores(
        gameId
      );

    return NextResponse.json({
      ok: true,
      gameId,
      scores,
    });
  } catch (error) {
    console.error(
      "Failed to load game scores:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "تعذر تحميل أسرع الأوقات.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const gameId =
      typeof body.gameId ===
      "string"
        ? body.gameId.trim()
        : "";

    if (
      !validGameId(gameId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "معرّف اللعبة غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    const timeSeconds =
      Number(
        body.timeSeconds
      );

    if (
      !Number.isInteger(
        timeSeconds
      ) ||
      timeSeconds < 1 ||
      timeSeconds > 3600
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "الوقت المسجل غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    const playerName =
      cleanPlayerName(
        body.playerName
      );

    const db =
      getFirebaseAdminDb();

    const resultRef =
      await db
        .collection(
          "gameScores"
        )
        .doc(gameId)
        .collection(
          "results"
        )
        .add({
          gameId,
          playerName,
          timeSeconds,
          createdAt:
            FieldValue.serverTimestamp(),
        });

    const scores =
      await getTopScores(
        gameId
      );

    return NextResponse.json({
      ok: true,
      resultId:
        resultRef.id,
      scores,
    });
  } catch (error) {
    console.error(
      "Failed to save game score:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "تعذر حفظ نتيجة التحدي.",
      },
      {
        status: 500,
      }
    );
  }
}