import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

const ACTIVE_SURPRISE_CHALLENGE_ID = "active-surprise-challenge";

type DecodedStudent = {
  uid?: string;
  role?: unknown;
  studentDocId?: unknown;
  studentId?: unknown;
};

type ActiveChallengeData = {
  id: string;
  title: string;
  question: string;
  points: number;
  targetClassroom: string;
  targetStudentDocId: string;
  targetStudentName: string;
  active: boolean;
  expiresAt: string;
  challengeVersion: string;
};

async function getStudentFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const { adminAuth } = getFirebaseAdmin();
  const decodedToken = (await adminAuth.verifyIdToken(
    authorization.slice(7)
  )) as DecodedStudent;

  if (decodedToken.role !== "student") {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId === "string"
      ? decodedToken.studentDocId.trim()
      : "";

  if (!studentDocId) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  return { studentDocId };
}

/* كاش قصير يمنع زيادة قراءات Firestore عند إعادة فحص الطلاب. */
const getCachedActiveChallenge = unstable_cache(
  async (): Promise<ActiveChallengeData | null> => {
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb
      .collection("surpriseChallenges")
      .doc(ACTIVE_SURPRISE_CHALLENGE_ID)
      .get();

    if (!snapshot.exists) return null;

    const data = snapshot.data() ?? {};
    const question =
      typeof data.question === "string" ? data.question.trim() : "";

    if (data.active !== true || !question) return null;

    const expiresAt =
      typeof data.expiresAt === "string" ? data.expiresAt : "";

    if (expiresAt) {
      const expiresTime = new Date(expiresAt).getTime();
      if (Number.isFinite(expiresTime) && Date.now() >= expiresTime) {
        return null;
      }
    }

    return {
      id: snapshot.id,
      title:
        typeof data.title === "string" && data.title.trim()
          ? data.title.trim()
          : "لغز البرق",
      question,
      points: typeof data.points === "number" ? data.points : 0,
      targetClassroom:
        typeof data.targetClassroom === "string"
          ? data.targetClassroom.trim()
          : "الجميع",
      targetStudentDocId:
        typeof data.targetStudentDocId === "string"
          ? data.targetStudentDocId.trim()
          : "",
      targetStudentName:
        typeof data.targetStudentName === "string"
          ? data.targetStudentName.trim()
          : "",
      active: true,
      expiresAt,
      challengeVersion:
        typeof data.challengeVersion === "string" &&
        data.challengeVersion.trim()
          ? data.challengeVersion.trim()
          : snapshot.id,
    };
  },
  ["active-surprise-challenge-api-v3"],
  { revalidate: 15 }
);

async function getStudentClassroom(studentDocId: string) {
  const cachedLoader = unstable_cache(
    async () => {
      const { adminDb } = getFirebaseAdmin();
      const snapshot = await adminDb
        .collection("students")
        .doc(studentDocId)
        .get();

      if (!snapshot.exists) return "";

      const data = snapshot.data() ?? {};
      return typeof data.classroom === "string" ? data.classroom.trim() : "";
    },
    ["surprise-student-classroom", studentDocId],
    { revalidate: 600 }
  );

  return cachedLoader();
}

function normalizeClassroom(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  try {
    const { studentDocId } = await getStudentFromRequest(request);
    const challenge = await getCachedActiveChallenge();

    if (!challenge) {
      return NextResponse.json(
        { success: true, challenge: null },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    /* عند الاستهداف الفردي لا يصل اللغز لأي حساب آخر. */
    if (
      challenge.targetStudentDocId &&
      challenge.targetStudentDocId !== studentDocId
    ) {
      return NextResponse.json(
        { success: true, challenge: null },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    /* نطبق شرط الفصل فقط عندما لا يوجد طالب محدد. */
    const targetClassroom = normalizeClassroom(challenge.targetClassroom);

    if (
      !challenge.targetStudentDocId &&
      targetClassroom &&
      targetClassroom !== "الجميع"
    ) {
      const studentClassroom = normalizeClassroom(
        await getStudentClassroom(studentDocId)
      );

      if (!studentClassroom || studentClassroom !== targetClassroom) {
        return NextResponse.json(
          { success: true, challenge: null },
          { headers: { "Cache-Control": "private, no-store" } }
        );
      }
    }

    return NextResponse.json(
      { success: true, challenge },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Surprise challenge GET error:", error);
    const message = error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "غير مصرح بالدخول." },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "هذا المسار مخصص للطلاب." },
        { status: 403 }
      );
    }

    if (message === "STUDENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "تعذر تحديد الطالب." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "تعذر تحميل التحدي المفاجئ." },
      { status: 500 }
    );
  }
}
