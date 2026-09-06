import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";

const ACTIVE_CHALLENGE_ID =
  "active-surprise-challenge";

function normalizeArabicAnswer(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[،,؛;.!؟?]/g, "")
    .replace(/\s+/g, "");
}

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    throw new Error("UNAUTHORIZED");
  }

  const token =
    authorization.slice(7);

  const { adminAuth } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (
    decodedToken.role !== "student"
  ) {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
    "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const body =
      await request.json();

    const submittedAnswer =
      typeof body?.answer === "string"
        ? body.answer.trim()
        : "";

    if (!submittedAnswer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب إجابتك أولًا.",
        },
        { status: 400 }
      );
    }

    if (
      submittedAnswer.length > 150
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الإجابة طويلة جدًا.",
        },
        { status: 400 }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const challengeRef =
      adminDb
        .collection(
          "surpriseChallenges"
        )
        .doc(
          ACTIVE_CHALLENGE_ID
        );

    const studentRef =
      adminDb
        .collection("students")
        .doc(studentDocId);

    /*
     * معرف ثابت للإجابة:
     * يمنع الطالب من إرسال إجابتين
     * لنفس نسخة التحدي.
     *
     * سنحدد challengeVersion
     * داخل المعاملة بعد قراءة التحدي.
     */

    const result =
      await adminDb.runTransaction(
        async (transaction) => {
          const [
            challengeSnapshot,
            studentSnapshot,
          ] = await Promise.all([
            transaction.get(
              challengeRef
            ),
            transaction.get(
              studentRef
            ),
          ]);

          if (
            !studentSnapshot.exists
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          if (
            !challengeSnapshot.exists
          ) {
            throw new Error(
              "NO_ACTIVE_CHALLENGE"
            );
          }

          const challengeData =
            challengeSnapshot.data() ??
            {};

          if (
            challengeData.active !==
            true
          ) {
            throw new Error(
              "NO_ACTIVE_CHALLENGE"
            );
          }

          const expiresAt =
            typeof challengeData
              .expiresAt === "string"
              ? challengeData
                  .expiresAt
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
              Date.now() >
                expiresTime
            ) {
              throw new Error(
                "CHALLENGE_EXPIRED"
              );
            }
          }

          const studentData =
            studentSnapshot.data() ??
            {};

          const studentClassroom =
            typeof studentData
              .classroom === "string"
              ? studentData
                  .classroom
              : "";

          const targetClassroom =
            typeof challengeData
              .targetClassroom ===
            "string"
              ? challengeData
                  .targetClassroom
              : "الجميع";

          if (
            targetClassroom !==
              "الجميع" &&
            targetClassroom !==
              studentClassroom
          ) {
            throw new Error(
              "NOT_TARGETED"
            );
          }

          const challengeVersion =
            typeof challengeData
              .challengeVersion ===
            "string"
              ? challengeData
                  .challengeVersion
              : "";

          if (!challengeVersion) {
            throw new Error(
              "INVALID_CHALLENGE"
            );
          }

          const answerId =
            `${studentDocId}_${challengeVersion}`;

          const answerRef =
            adminDb
              .collection(
                "surpriseChallengeAnswers"
              )
              .doc(answerId);

          const answerSnapshot =
            await transaction.get(
              answerRef
            );

          if (
            answerSnapshot.exists
          ) {
            const previousData =
              answerSnapshot.data() ??
              {};

            return {
              alreadyAnswered: true,
              isCorrect:
                previousData
                  .isCorrect === true,
              pointsAwarded:
                typeof previousData
                  .pointsAwarded ===
                "number"
                  ? previousData
                      .pointsAwarded
                  : 0,
            };
          }

          const correctAnswer =
            typeof challengeData
              .correctAnswer ===
            "string"
              ? challengeData
                  .correctAnswer
              : "";

          if (!correctAnswer) {
            throw new Error(
              "INVALID_CHALLENGE"
            );
          }

          const normalizedSubmitted =
            normalizeArabicAnswer(
              submittedAnswer
            );

          const acceptedAnswers =
            correctAnswer
              .split("|")
              .map((answer) =>
                normalizeArabicAnswer(
                  answer
                )
              )
              .filter(Boolean);

          const isCorrect =
            acceptedAnswers.includes(
              normalizedSubmitted
            );

          const challengePoints =
            typeof challengeData
              .points === "number"
              ? Math.max(
                  0,
                  Math.min(
                    20,
                    Math.round(
                      challengeData
                        .points
                    )
                  )
                )
              : 0;

          const pointsAwarded =
            isCorrect
              ? challengePoints
              : 0;

          transaction.create(
            answerRef,
            {
              challengeId:
                ACTIVE_CHALLENGE_ID,

              challengeVersion,

              challengeTitle:
                typeof challengeData
                  .title === "string"
                  ? challengeData
                      .title
                  : "لغز البرق",

              question:
                typeof challengeData
                  .question ===
                "string"
                  ? challengeData
                      .question
                  : "",

              studentId:
                studentDocId,

              studentName:
                typeof studentData
                  .name === "string"
                  ? studentData.name
                  : typeof studentData
                        .studentName ===
                      "string"
                    ? studentData
                        .studentName
                    : "طالب",

              classroom:
                studentClassroom,

              answer:
                submittedAnswer,

              isCorrect,

              pointsAwarded,

              submittedAt:
                FieldValue
                  .serverTimestamp(),
            }
          );

          if (
            isCorrect &&
            pointsAwarded > 0
          ) {
            transaction.update(
              studentRef,
              {
                points:
                  FieldValue.increment(
                    pointsAwarded
                  ),

                updatedAt:
                  FieldValue
                    .serverTimestamp(),

                pointsHistory:
                  FieldValue.arrayUnion(
                    {
                      reason:
                        `لغز البرق: ${
                          typeof challengeData
                            .title ===
                          "string"
                            ? challengeData
                                .title
                            : "التحدي المفاجئ"
                        }`,

                      points:
                        pointsAwarded,

                      stars: 0,

                      category:
                        "لغز البرق",

                      createdAt:
                        new Date(),
                    }
                  ),
              }
            );
          }

          return {
            alreadyAnswered:
              false,
            isCorrect,
            pointsAwarded,
          };
        }
      );

    if (
      result.alreadyAnswered
    ) {
      return NextResponse.json(
        {
          success: true,
          alreadyAnswered:
            true,
          isCorrect:
            result.isCorrect,
          pointsAwarded:
            result.pointsAwarded,
          message:
            "سبق أن أرسلت إجابتك لهذا التحدي.",
        }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyAnswered: false,
      isCorrect:
        result.isCorrect,
      pointsAwarded:
        result.pointsAwarded,

      message:
        result.isCorrect
          ? result.pointsAwarded >
            0
            ? `🎉 إجابة صحيحة! حصلت على +${result.pointsAwarded} نقاط.`
            : "🎉 إجابة صحيحة!"
          : "👏 وصلت إجابتك، شكرًا لمشاركتك.",
    });
  } catch (error) {
    console.error(
      "Surprise challenge answer error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (
      message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا المسار مخصص للطلاب.",
        },
        { status: 403 }
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
            "لم يتم العثور على الطالب.",
        },
        { status: 404 }
      );
    }

    if (
      message ===
      "NO_ACTIVE_CHALLENGE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يوجد تحدٍّ مفاجئ نشط الآن.",
        },
        { status: 409 }
      );
    }

    if (
      message ===
      "CHALLENGE_EXPIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "انتهى وقت التحدي.",
        },
        { status: 409 }
      );
    }

    if (
      message === "NOT_TARGETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا التحدي غير مخصص لفصلك.",
        },
        { status: 403 }
      );
    }

    if (
      message ===
      "INVALID_CHALLENGE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات التحدي غير مكتملة.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر إرسال الإجابة. حاول مرة أخرى.",
      },
      { status: 500 }
    );
  }
}