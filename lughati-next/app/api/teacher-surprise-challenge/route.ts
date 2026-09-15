import {
  NextResponse,
} from "next/server";

// واجهة المعلم لإطلاق لغز عام أو فصلي أو لطالب محدد.

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

export const runtime =
  "nodejs";

const TEACHER_EMAIL =
  "a31164949@gmail.com";

const ACTIVE_CHALLENGE_ID =
  "active-surprise-challenge";

type LaunchPayload = {
  action?: "launch" | "close";
  title?: string;
  question?: string;
  correctAnswer?: string;
  points?: number;
  targetClassroom?: string;
  targetStudentDocId?: string;
  durationMinutes?: number;
};

type StudentOption = {
  id: string;
  studentName: string;
  classroom: string;
};

async function requireTeacher(
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

  const email =
    typeof decodedToken.email ===
    "string"
      ? decodedToken.email
          .trim()
          .toLowerCase()
      : "";

  const role =
    typeof decodedToken.role ===
    "string"
      ? decodedToken.role
      : "";

  const isTeacher =
    role === "teacher" ||
    email ===
      TEACHER_EMAIL.toLowerCase();

  if (!isTeacher) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return {
    uid: decodedToken.uid,
    email,
  };
}

function toIsoDate(
  value: unknown
) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  return null;
}

export async function GET(
  request: Request
) {
  try {
    await requireTeacher(
      request
    );

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
          ACTIVE_CHALLENGE_ID
        );

    const challengeSnapshot =
      await challengeRef.get();

    const studentsSnapshot =
      await adminDb
        .collection("students")
        .limit(300)
        .get();

    const students: StudentOption[] =
      studentsSnapshot.docs
        .map((studentDocument) => {
          const studentData =
            studentDocument.data() ?? {};

          return {
            id: studentDocument.id,
            studentName:
              typeof studentData.studentName === "string" &&
              studentData.studentName.trim()
                ? studentData.studentName.trim()
                : "طالب",
            classroom:
              typeof studentData.classroom === "string"
                ? studentData.classroom.trim()
                : "",
          };
        })
        .sort((first, second) =>
          `${first.classroom} ${first.studentName}`.localeCompare(
            `${second.classroom} ${second.studentName}`,
            "ar"
          )
        );

    if (
      !challengeSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: true,
          challenge: null,
          answers: [],
          students,
        },
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const data =
      challengeSnapshot.data() ??
      {};

    const challengeVersion =
      typeof data.challengeVersion ===
        "string"
        ? data.challengeVersion
        : "";

    const challenge = {
      id:
        challengeSnapshot.id,

      title:
        typeof data.title ===
        "string"
          ? data.title
          : "لغز البرق",

      question:
        typeof data.question ===
        "string"
          ? data.question
          : "",

      correctAnswer:
        typeof data.correctAnswer ===
        "string"
          ? data.correctAnswer
          : "",

      points:
        typeof data.points ===
        "number"
          ? data.points
          : 3,

      targetClassroom:
        typeof data.targetClassroom ===
        "string"
          ? data.targetClassroom
          : "الجميع",

      targetStudentDocId:
        typeof data.targetStudentDocId === "string"
          ? data.targetStudentDocId
          : "",

      targetStudentName:
        typeof data.targetStudentName === "string"
          ? data.targetStudentName
          : "",

      durationMinutes:
        typeof data.durationMinutes ===
        "number"
          ? data.durationMinutes
          : 15,

      active:
        data.active === true,

      createdAt:
        toIsoDate(
          data.createdAt
        ),

      expiresAt:
        typeof data.expiresAt ===
        "string"
          ? data.expiresAt
          : "",
    };

    let answers:
      Array<{
        id: string;
        challengeId: string;
        studentId: string;
        studentName: string;
        classroom: string;
        answer: string;
        isCorrect: boolean;
        submittedAt: string | null;
      }> = [];

    if (
      challenge.active
    ) {
      /*
       * نقرأ فقط إجابات هذا التحدي،
       * ثم نفلتر نسخة اللغز الحالية
       * حتى لا تظهر إجابات لغز قديم.
       */
      const answersSnapshot =
        await adminDb
          .collection(
            "surpriseChallengeAnswers"
          )
          .where(
            "challengeId",
            "==",
            ACTIVE_CHALLENGE_ID
          )
          .limit(200)
          .get();

      answers =
        answersSnapshot.docs
          .map(
            (
              answerDocument
            ) => {
              const answerData =
                answerDocument.data() ??
                {};

              return {
                id:
                  answerDocument.id,

                challengeId:
                  typeof answerData.challengeId ===
                  "string"
                    ? answerData.challengeId
                    : "",

                challengeVersion:
                  typeof answerData.challengeVersion ===
                  "string"
                    ? answerData.challengeVersion
                    : "",

                studentId:
                  typeof answerData.studentId ===
                  "string"
                    ? answerData.studentId
                    : "",

                studentName:
                  typeof answerData.studentName ===
                  "string"
                    ? answerData.studentName
                    : "طالب",

                classroom:
                  typeof answerData.classroom ===
                  "string"
                    ? answerData.classroom
                    : "",

                answer:
                  typeof answerData.answer ===
                  "string"
                    ? answerData.answer
                    : "",

                isCorrect:
                  answerData.isCorrect ===
                  true,

                submittedAt:
                  toIsoDate(
                    answerData.submittedAt
                  ),
              };
            }
          )
          .filter(
            (answer) =>
              !challengeVersion ||
              !answer.challengeVersion ||
              answer.challengeVersion ===
                challengeVersion
          )
          .sort(
            (
              first,
              second
            ) =>
              (
                first.submittedAt ??
                ""
              ).localeCompare(
                second.submittedAt ??
                ""
              )
          )
          .map(
            ({
              challengeVersion:
                _challengeVersion,
              ...answer
            }) => answer
          );
    }

    return NextResponse.json(
      {
        success: true,
        challenge,
        answers,
        students,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Teacher surprise challenge GET error:",
      error
    );

    return handleError(
      error
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const teacher =
      await requireTeacher(
        request
      );

    const payload =
      (await request.json()) as
        LaunchPayload;

    const action =
      payload.action;

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
          ACTIVE_CHALLENGE_ID
        );

    if (
      action === "close"
    ) {
      const snapshot =
        await challengeRef.get();

      if (
        !snapshot.exists
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "لا يوجد تحدٍّ نشط لإنهائه.",
          },
          {
            status: 404,
          }
        );
      }

      await challengeRef.update(
        {
          active: false,
          closedAt:
            FieldValue.serverTimestamp(),
          closedBy:
            teacher.uid,
        }
      );

      return NextResponse.json({
        success: true,
        message:
          "تم إنهاء التحدي.",
      });
    }

    if (
      action !== "launch"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الإجراء غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const title =
      typeof payload.title ===
        "string" &&
      payload.title.trim()
        ? payload.title.trim()
        : "لغز البرق";

    const question =
      typeof payload.question ===
        "string"
        ? payload.question.trim()
        : "";

    const correctAnswer =
      typeof payload.correctAnswer ===
        "string"
        ? payload.correctAnswer
            .trim()
            .toLowerCase()
        : "";

    const points =
      typeof payload.points ===
        "number"
        ? payload.points
        : Number.NaN;

    const targetClassroom =
      typeof payload.targetClassroom ===
        "string" &&
      payload.targetClassroom.trim()
        ? payload.targetClassroom.trim()
        : "الجميع";

    const targetStudentDocId =
      typeof payload.targetStudentDocId === "string"
        ? payload.targetStudentDocId.trim()
        : "";

    const durationMinutes =
      typeof payload.durationMinutes ===
        "number"
        ? payload.durationMinutes
        : Number.NaN;

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب سؤال التحدي أولًا.",
        },
        {
          status: 400,
        }
      );
    }

    if (!correctAnswer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب الإجابة الصحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        points
      ) ||
      points < 0 ||
      points > 20
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "النقاط يجب أن تكون من 0 إلى 20.",
        },
        {
          status: 400,
        }
      );
    }

    let targetStudentName = "";
    let resolvedTargetClassroom = targetClassroom;

    if (targetClassroom === "طالب محدد") {
      if (!targetStudentDocId) {
        return NextResponse.json(
          {
            success: false,
            message: "اختر الطالب المستهدف أولًا.",
          },
          { status: 400 }
        );
      }

      const targetStudentSnapshot =
        await adminDb
          .collection("students")
          .doc(targetStudentDocId)
          .get();

      if (!targetStudentSnapshot.exists) {
        return NextResponse.json(
          {
            success: false,
            message: "تعذر العثور على الطالب المستهدف.",
          },
          { status: 404 }
        );
      }

      const targetStudentData =
        targetStudentSnapshot.data() ?? {};

      targetStudentName =
        typeof targetStudentData.studentName === "string"
          ? targetStudentData.studentName.trim()
          : "طالب";

      resolvedTargetClassroom =
        typeof targetStudentData.classroom === "string"
          ? targetStudentData.classroom.trim()
          : "";
    }

    if (
      !Number.isInteger(
        durationMinutes
      ) ||
      durationMinutes < 1 ||
      durationMinutes > 120
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "مدة التحدي يجب أن تكون من دقيقة إلى 120 دقيقة.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const challengeVersion =
      `${now}-${teacher.uid.slice(
        0,
        8
      )}`;

    const expiresAt =
      new Date(
        now +
          durationMinutes *
            60 *
            1000
      ).toISOString();

    await challengeRef.set(
      {
        title,
        question,
        correctAnswer,
        points,
        targetClassroom: resolvedTargetClassroom,
        targetStudentDocId:
          targetClassroom === "طالب محدد"
            ? targetStudentDocId
            : "",
        targetStudentName,
        durationMinutes,
        active: true,
        challengeVersion,
        createdAt:
          FieldValue.serverTimestamp(),
        createdBy:
          teacher.uid,
        createdByEmail:
          teacher.email,
        expiresAt,
        closedAt: null,
      },
      {
        merge: false,
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "⚡ تم إطلاق التحدي المفاجئ بنجاح!",
      challengeVersion,
    });
  } catch (error) {
    console.error(
      "Teacher surprise challenge POST error:",
      error
    );

    return handleError(
      error
    );
  }
}

function handleError(
  error: unknown
) {
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
          "يجب تسجيل الدخول بحساب المعلم.",
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
          "هذا الحساب غير مخول بإدارة لغز البرق.",
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
        "تعذر تنفيذ العملية في الوقت الحالي.",
    },
    {
      status: 500,
    }
  );
}
