import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "../../../firebase-admin";

const CHALLENGE_ID =
  "detective-2026-09-04";

const GRADES =
  ["2", "3", "4", "5", "6"] as const;

type CurrentResult = {
  id: string;
  participantType: "student" | "visitor";
  name: string;
  grade: string;
  durationSeconds: number;
  completedAtMs: number;
};

export async function GET() {
  try {
    const { adminDb } =
      getFirebaseAdmin();

    /*
      قراءة عند الطلب فقط:
      لا onSnapshot ولا polling.
      نقرأ نتائج هذا التحدي وحده.
    */
    const snapshot =
      await adminDb
        .collection(
          "communityChallengeResults"
        )
        .where(
          "challengeId",
          "==",
          CHALLENGE_ID
        )
        .get();

    const rows: CurrentResult[] =
      snapshot.docs
        .map((document) => {
          const data =
            document.data();

          const participantType:
            "student" | "visitor" =
            data.participantType ===
            "student"
              ? "student"
              : "visitor";

          const completedAtMs =
            data.completedAt &&
            typeof data.completedAt
              .toMillis === "function"
              ? data.completedAt.toMillis()
              : 0;

          return {
            id: document.id,
            participantType,
            name:
              typeof data.name ===
              "string"
                ? data.name
                : "مشارك",
            grade:
              typeof data.grade ===
              "string"
                ? data.grade
                : "",
            durationSeconds:
              typeof data.durationSeconds ===
              "number"
                ? data.durationSeconds
                : 0,
            completedAtMs,
          };
        })
        .filter(
          (row) =>
            GRADES.includes(
              row.grade as
                (typeof GRADES)[number]
            ) &&
            row.durationSeconds > 0
        );

    const byGrade =
      GRADES.map((grade) => {
        const results =
          rows
            .filter(
              (row) =>
                row.grade === grade
            )
            .sort((a, b) => {
              if (
                a.durationSeconds !==
                b.durationSeconds
              ) {
                return (
                  a.durationSeconds -
                  b.durationSeconds
                );
              }

              if (
                a.completedAtMs !==
                b.completedAtMs
              ) {
                return (
                  a.completedAtMs -
                  b.completedAtMs
                );
              }

              return a.id.localeCompare(
                b.id
              );
            })
            .map(
              (row, index) => ({
                id: row.id,
                participantType:
                  row.participantType,
                name: row.name,
                grade: row.grade,
                durationSeconds:
                  row.durationSeconds,
                rank: index + 1,
              })
            );

        return {
          grade,
          count: results.length,
          results,
        };
      });

    return NextResponse.json({
      ok: true,
     totalParticipants: 53,
      byGrade,
    });
  } catch (error) {
    console.error(
      "detective-results-current GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر تحميل النتائج الحالية.",
      },
      { status: 500 }
    );
  }
}
