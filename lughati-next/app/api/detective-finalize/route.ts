import { NextResponse } from "next/server";
import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

const CHALLENGE_ID =
  "detective-2026-09-04";

const EVENT_DATE =
  "2026-09-04";

const EVENT_END_AT =
  "2026-09-05T16:00:00+03:00";

const GRADES = [
  "2",
  "3",
  "4",
  "5",
  "6",
];

type ResultRow = {
  id: string;
  participantType: "student" | "visitor";
  visitorId: string;
  studentId: string;
  verifiedStudent: boolean;
  name: string;
  grade: string;
  durationSeconds: number;
  completedAtMs: number;
};

function riyadhDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

function pointsForRank(
  index: number
) {
  if (index === 0) {
    return 5;
  }

  if (index === 1) {
    return 3;
  }

  if (index === 2) {
    return 2;
  }

  return 1;
}

function toMillis(
  value: unknown
) {
  if (
    value instanceof Timestamp
  ) {
    return value.toMillis();
  }

  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (
      value as {
        toMillis?: unknown;
      }
    ).toMillis ===
      "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  return 0;
}

export async function POST() {
  try {
    /*
      لا نسمح بالاعتماد أثناء يوم التحدي.
      بذلك لا يمكن اعتماد ترتيب مبكر
      ثم وصول مشاركين جدد بعده.
    */
    if (
      Date.now() <
      Date.parse(
        EVENT_END_AT
      )
    ) {
      return NextResponse.json(
        {
          error:
            "يمكن اعتماد النتائج بعد السبت 5 سبتمبر الساعة 4:00 مساءً بتوقيت الرياض.",
        },
        { status: 403 }
      );
    }

    const {
      adminDb,
    } = getFirebaseAdmin();

    const controlRef =
      adminDb
        .collection(
          "communityChallenges"
        )
        .doc(
          CHALLENGE_ID
        );

    /*
      أول قراءة فقط: هل تم الاعتماد من قبل؟
      إذا كان نعم، لا نقرأ جميع النتائج مرة أخرى.
    */
    const controlSnapshot =
      await controlRef.get();

    if (
      controlSnapshot.exists &&
      controlSnapshot.data()
        ?.finalized === true
    ) {
      return NextResponse.json({
        ok: true,
        alreadyFinalized: true,
        message:
          "النتائج معتمدة مسبقًا، ولم تُمنح أي نقاط إضافية.",
        summary:
          controlSnapshot.data()
            ?.summary ?? null,
      });
    }

    /*
      قراءة واحدة لجميع نتائج هذا التحدي.
      لا يوجد onSnapshot ولا قراءة عند فتح صفحة المعلم.
    */
    const resultsSnapshot =
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

    const rows: ResultRow[] =
      resultsSnapshot.docs
        .map((document) => {
          const data =
            document.data();

          return {
            id:
              document.id,
            participantType:
              data.participantType ===
              "student"
                ? ("student" as const)
                : ("visitor" as const),
            visitorId:
              typeof data.visitorId ===
              "string"
                ? data.visitorId
                : "",
            studentId:
              typeof data.studentId ===
              "string"
                ? data.studentId
                : "",
            verifiedStudent:
              data.verifiedStudent ===
              true,
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
            completedAtMs:
              toMillis(
                data.completedAt
              ),
          };
        })
        .filter(
          (row) =>
            (
              (row.participantType ===
                "student" &&
                row.studentId &&
                row.verifiedStudent) ||
              (row.participantType ===
                "visitor" &&
                row.visitorId)
            ) &&
            GRADES.includes(
              row.grade
            ) &&
            row.durationSeconds >
              0
        );

    /*
      هذا النظام مصمم لتحدي المدرسة.
      نستخدم transaction واحدة حتى يكون
      منح النقاط + علامة الاعتماد عملية واحدة.
      الحد هنا يحمي من تجاوز حد 500 كتابة.
    */
    if (
      rows.length > 240
    ) {
      return NextResponse.json(
        {
          error:
            "عدد النتائج أكبر من حد الاعتماد الآمن لهذه النسخة. لم يتم تغيير أي نقاط.",
        },
        { status: 409 }
      );
    }

    const rankedByGrade =
      new Map<
        string,
        ResultRow[]
      >();

    for (
      const grade of GRADES
    ) {
      const ranked =
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
          });

      rankedByGrade.set(
        grade,
        ranked
      );
    }

    let totalPointsAwarded =
      0;

    await adminDb.runTransaction(
      async (transaction) => {
        /*
          نعيد قراءة وثيقة التحكم داخل
          transaction لمنع تنفيذ متزامن مزدوج.
        */
        const latestControl =
          await transaction.get(
            controlRef
          );

        if (
          latestControl.exists &&
          latestControl.data()
            ?.finalized === true
        ) {
          return;
        }

        for (
          const grade of GRADES
        ) {
          const ranked =
            rankedByGrade.get(
              grade
            ) ?? [];

          ranked.forEach(
            (row, index) => {
              const points =
                pointsForRank(
                  index
                );

              totalPointsAwarded +=
                points;

              const resultRef =
                adminDb
                  .collection(
                    "communityChallengeResults"
                  )
                  .doc(
                    row.id
                  );

              transaction.set(
                resultRef,
                {
                  finalRank:
                    index + 1,
                  pointsAwarded:
                    points,
                  pointsFinalized:
                    true,
                  finalizedAt:
                    FieldValue.serverTimestamp(),
                },
                {
                  merge: true,
                }
              );

              if (
                row.participantType ===
                "student"
              ) {
                const studentRef =
                  adminDb
                    .collection(
                      "students"
                    )
                    .doc(
                      row.studentId
                    );

                /*
                  لا توجد قراءة إضافية للطالب هنا.
                  هوية الطالب تكون قد تحققت عند
                  حفظ النتيجة الرسمية.
                */
                transaction.update(
                  studentRef,
                  {
                    points:
                      FieldValue.increment(
                        points
                      ),
                    pointsHistory:
                      FieldValue.arrayUnion(
                        {
                          reason:
                            "نقاط تحدّي المحقّق – قضية الكأس الذهبي المفقود",
                          points,
                          stars: 0,
                          category:
                            "التحديات",
                          rewardId:
                            `${CHALLENGE_ID}_${row.id}`,
                          date:
                            EVENT_DATE,
                          createdAt:
                            new Date(),
                        }
                      ),
                    updatedAt:
                      FieldValue.serverTimestamp(),
                  }
                );
              } else {
                const visitorRef =
                  adminDb
                    .collection(
                      "communityVisitors"
                    )
                    .doc(
                      row.visitorId
                    );

                transaction.set(
                  visitorRef,
                  {
                    visitorId:
                      row.visitorId,
                    name:
                      row.name,
                    grade:
                      row.grade,
                    totalPoints:
                      FieldValue.increment(
                        points
                      ),
                    updatedAt:
                      FieldValue.serverTimestamp(),
                  },
                  {
                    merge: true,
                  }
                );
              }
            }
          );
        }

        const byGrade =
          GRADES.map(
            (grade) => {
              const ranked =
                rankedByGrade.get(
                  grade
                ) ?? [];

              const winner = (
                index: number
              ) => {
                const row =
                  ranked[index];

                if (!row) {
                  return undefined;
                }

                return {
                  name:
                    row.name,
                  durationSeconds:
                    row.durationSeconds,
                  points:
                    pointsForRank(
                      index
                    ),
                };
              };

              return {
                grade,
                count:
                  ranked.length,
                first:
                  winner(0),
                second:
                  winner(1),
                third:
                  winner(2),
              };
            }
          );

        const summary = {
          totalParticipants:
            rows.length,
          totalPointsAwarded,
          byGrade,
        };

        transaction.set(
          controlRef,
          {
            challengeId:
              CHALLENGE_ID,
            eventDate:
              EVENT_DATE,
            finalized: true,
            finalizedAt:
              FieldValue.serverTimestamp(),
            summary,
          },
          {
            merge: true,
          }
        );
      }
    );

    /*
      نقرأ وثيقة التحكم مرة أخيرة فقط
      لضمان أن الملخص المعاد للواجهة هو
      الملخص النهائي حتى لو حدث طلب متزامن.
    */
    const finalizedSnapshot =
      await controlRef.get();

    return NextResponse.json({
      ok: true,
      message:
        "تم اعتماد النتائج وتوزيع النقاط بنجاح.",
      summary:
        finalizedSnapshot.data()
          ?.summary ?? {
          totalParticipants:
            rows.length,
          totalPointsAwarded,
          byGrade: [],
        },
    });
  } catch (error) {
    console.error(
      "detective-finalize POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر اعتماد النتائج الآن. لم نُعد توزيع النقاط.",
      },
      { status: 500 }
    );
  }
}
