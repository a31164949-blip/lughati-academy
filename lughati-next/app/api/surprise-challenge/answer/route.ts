import {
  NextResponse,
} from "next/server";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../../firebase-admin";

export const runtime =
  "nodejs";

const ACTIVE_SURPRISE_CHALLENGE_ID =
  "active-surprise-challenge";

type AnswerPayload = {
  answer?: string;
};

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const token =
    authorization.slice(7);

  const {
    adminAuth,
  } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(
      token
    );

  if (
    decodedToken.role !==
    "student"
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
    "string"
      ? decodedToken.studentDocId.trim()
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return {
    studentDocId,
    studentId:
      typeof decodedToken.studentId ===
      "string"
        ? decodedToken.studentId.trim()
        : "",
  };
}

function normalizeAnswer(
  value: string
) {
  return value
    .trim()
    .toLowerCase()

    // إزالة التطويل
    .replace(/ـ/g, "")

    // إزالة التشكيل
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )

    /*
     * توحيد الهمزات:
     * أ / إ / آ / ٱ -> ا
     * ؤ -> و
     * ئ -> ي
     */
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")

    /*
     * تجاهل علامات الترقيم الشائعة:
     * الفاصلة العربية والإنجليزية،
     * النقطة، الفاصلة المنقوطة،
     * النقطتان، علامات الاستفهام والتعجب،
     * الأقواس والاقتباسات.
     */
    .replace(/[،,.;؛:؟?!¡!…"'«»()[\]{}]/g, " ")

    // توحيد المسافات
    .replace(/\s+/g, " ")
    .trim();
}

function safeDocumentPart(
  value: string
) {
  return value.replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );
}

export async function POST(
  request: Request
) {
  try {
    const {
      studentDocId,
      studentId:
        tokenStudentId,
    } =
      await getStudentFromRequest(
        request
      );

    const payload =
      (await request.json()) as
        AnswerPayload;

    const answer =
      typeof payload.answer ===
      "string"
        ? payload.answer.trim()
        : "";

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب إجابتك أولًا يا بطل 🌟",
        },
        {
          status: 400,
        }
      );
    }

    if (
      answer.length > 250
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الإجابة طويلة جدًا.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      adminDb,
    } =
      getFirebaseAdmin();

    const challengeRef =
      adminDb
        .collection(
          "surpriseChallenges"
        )
        .doc(
          ACTIVE_SURPRISE_CHALLENGE_ID
        );

    const studentRef =
      adminDb
        .collection(
          "students"
        )
        .doc(
          studentDocId
        );

    const challengeSnapshot =
      await challengeRef.get();

    if (
      !challengeSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يوجد تحدٍّ نشط حاليًا.",
        },
        {
          status: 404,
        }
      );
    }

    const challengeData =
      challengeSnapshot.data() ??
      {};

    if (
      challengeData.active !==
      true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "انتهى التحدي.",
        },
        {
          status: 410,
        }
      );
    }

    const expiresAt =
      typeof challengeData.expiresAt ===
      "string"
        ? challengeData.expiresAt
        : "";

    if (expiresAt) {
      const expiresTime =
        new Date(
          expiresAt
        ).getTime();

      if (
        Number.isFinite(
          expiresTime
        ) &&
        Date.now() >=
          expiresTime
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "انتهى وقت التحدي.",
          },
          {
            status: 410,
          }
        );
      }
    }

    const question =
      typeof challengeData.question ===
      "string"
        ? challengeData.question.trim()
        : "";

    const correctAnswer =
      typeof challengeData.correctAnswer ===
      "string"
        ? challengeData.correctAnswer.trim()
        : "";

    if (
      !question ||
      !correctAnswer
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات التحدي غير مكتملة.",
        },
        {
          status: 500,
        }
      );
    }

    const challengeVersion =
      typeof challengeData.challengeVersion ===
        "string" &&
      challengeData.challengeVersion.trim()
        ? challengeData.challengeVersion.trim()
        : ACTIVE_SURPRISE_CHALLENGE_ID;

    const points =
      typeof challengeData.points ===
      "number" &&
      Number.isFinite(
        challengeData.points
      )
        ? Math.max(
            0,
            Math.trunc(
              challengeData.points
            )
          )
        : 0;

    const targetClassroom =
      typeof challengeData.targetClassroom ===
      "string"
        ? challengeData.targetClassroom.trim()
        : "الجميع";

    const answerDocumentId =
      `${safeDocumentPart(
        challengeVersion
      )}__${safeDocumentPart(
        studentDocId
      )}`;

    const answerRef =
      adminDb
        .collection(
          "surpriseChallengeAnswers"
        )
        .doc(
          answerDocumentId
        );

    const result =
      await adminDb.runTransaction(
        async (
          transaction
        ) => {
          const [
            freshChallengeSnapshot,
            studentSnapshot,
            previousAnswerSnapshot,
          ] =
            await Promise.all([
              transaction.get(
                challengeRef
              ),

              transaction.get(
                studentRef
              ),

              transaction.get(
                answerRef
              ),
            ]);

          if (
            !freshChallengeSnapshot.exists
          ) {
            throw new Error(
              "CHALLENGE_NOT_FOUND"
            );
          }

          const freshChallengeData =
            freshChallengeSnapshot.data() ??
            {};

          if (
            freshChallengeData.active !==
            true
          ) {
            throw new Error(
              "CHALLENGE_CLOSED"
            );
          }

          const freshVersion =
            typeof freshChallengeData.challengeVersion ===
              "string" &&
            freshChallengeData.challengeVersion.trim()
              ? freshChallengeData.challengeVersion.trim()
              : ACTIVE_SURPRISE_CHALLENGE_ID;

          if (
            freshVersion !==
            challengeVersion
          ) {
            throw new Error(
              "CHALLENGE_CHANGED"
            );
          }

          if (
            previousAnswerSnapshot.exists
          ) {
            const previousData =
              previousAnswerSnapshot.data() ??
              {};

            return {
              alreadyAnswered:
                true,
              isCorrect:
                previousData.isCorrect ===
                true,
              pointsAwarded:
                typeof previousData.pointsAwarded ===
                "number"
                  ? previousData.pointsAwarded
                  : 0,
              message:
                "لقد أرسلت إجابتك على هذا التحدي مسبقًا 🌟",
            };
          }

          if (
            !studentSnapshot.exists
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const studentData =
            studentSnapshot.data() ??
            {};

          const studentName =
            typeof studentData.studentName ===
              "string" &&
            studentData.studentName.trim()
              ? studentData.studentName.trim()
              : "طالب";

          const classroom =
            typeof studentData.classroom ===
              "string"
                ? studentData.classroom.trim()
                : "";

          if (
            targetClassroom &&
            targetClassroom !==
              "الجميع" &&
            classroom !==
              targetClassroom
          ) {
            throw new Error(
              "CLASSROOM_MISMATCH"
            );
          }

          const academyStudentId =
            typeof studentData.studentId ===
              "string" &&
            studentData.studentId.trim()
              ? studentData.studentId.trim()
              : tokenStudentId ||
                studentDocId;

          const normalizedStudentAnswer =
            normalizeAnswer(
              answer
            );

          const normalizedCorrectAnswer =
            normalizeAnswer(
              correctAnswer
            );

          const isCorrect =
            normalizedStudentAnswer ===
            normalizedCorrectAnswer;

          const pointsAwarded =
            isCorrect
              ? points
              : 0;

          transaction.set(
            answerRef,
            {
              challengeId:
                ACTIVE_SURPRISE_CHALLENGE_ID,
              challengeVersion,
              question,
              studentId:
                studentDocId,
              academyStudentId,
              studentName,
              classroom,
              answer,
              normalizedAnswer:
                normalizedStudentAnswer,
              isCorrect,
              pointsAwarded,
              submittedAt:
                FieldValue.serverTimestamp(),
            }
          );

          if (
            isCorrect &&
            pointsAwarded > 0
          ) {
            const pointsHistoryEntry = {
              reason:
                `⚡ لغز البرق: ${question}`,
              points:
                pointsAwarded,
              stars:
                0,
              category:
                "لغز البرق",
              type:
                "surpriseChallenge",
              challengeVersion,
              createdAt:
                new Date(),
            };

            transaction.update(
              studentRef,
              {
                points:
                  FieldValue.increment(
                    pointsAwarded
                  ),
                "journey.xp":
                  FieldValue.increment(
                    pointsAwarded
                  ),
                pointsHistory:
                  FieldValue.arrayUnion(
                    pointsHistoryEntry
                  ),
                updatedAt:
                  FieldValue.serverTimestamp(),
              }
            );

            const pointTransactionRef =
              adminDb
                .collection(
                  "pointTransactions"
                )
                .doc();

            transaction.set(
              pointTransactionRef,
              {
                studentId:
                  studentDocId,
                academyStudentId,
                studentName,
                classroom,
                points:
                  pointsAwarded,
                amount:
                  pointsAwarded,
                type:
                  "surpriseChallenge",
                source:
                  "surpriseChallenge",
                reason:
                  `إجابة صحيحة في لغز البرق: ${question}`,
                challengeId:
                  ACTIVE_SURPRISE_CHALLENGE_ID,
                challengeVersion,
                createdAt:
                  FieldValue.serverTimestamp(),
              }
            );
          }

          return {
            alreadyAnswered:
              false,
            isCorrect,
            pointsAwarded,
            message:
              isCorrect
                ? pointsAwarded > 0
                  ? `أحسنت! إجابة صحيحة ⚡ حصلت على ${pointsAwarded} نقطة ⭐`
                  : "أحسنت! إجابة صحيحة ⚡🌟"
                : "وصلت إجابتك للمعلم بنجاح 🌟",
          };
        }
      );

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Surprise challenge answer POST error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا المسار مخصص للطلاب.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      message ===
      "STUDENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر العثور على بيانات الطالب.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      message ===
        "CHALLENGE_NOT_FOUND" ||
      message ===
        "CHALLENGE_CLOSED" ||
      message ===
        "CHALLENGE_CHANGED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "انتهى التحدي أو تم إطلاق تحدٍ جديد.",
        },
        {
          status: 410,
        }
      );
    }

    if (
      message ===
      "CLASSROOM_MISMATCH"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا التحدي غير مخصص لفصلك.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر إرسال الإجابة الآن، حاول مرة أخرى.",
      },
      {
        status: 500,
      }
    );
  }
}
