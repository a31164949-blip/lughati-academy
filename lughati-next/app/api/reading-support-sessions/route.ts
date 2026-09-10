import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

const TEACHER_EMAIL = "a31164949@gmail.com";
const MAX_PENDING_REQUESTS = 100;
const MAX_UPCOMING_SESSIONS = 20;
const SESSION_CAPACITY = 6;

type RegistrationItem = {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  studentGrade: string;
  studentClass: string;
  skill: string;
  priority: number;
  status: "pending";
  createdAt: string | null;
};

type SessionRequest = {
  requestIds?: string[];
  sessionDate?: string;
  sessionTime?: string;
  locationNote?: string;
};

type UpcomingSessionItem = {
  id: string;
  sessionDate: string;
  sessionTime: string;
  locationNote: string;
  studentCount: number;
  students: Array<{
    studentName: string;
    grade: string;
    skill: string;
  }>;
};

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const { adminAuth } = getFirebaseAdmin();
  const decodedToken = await adminAuth.verifyIdToken(
    authorization.slice("Bearer ".length)
  );
  const email = typeof decodedToken.email === "string"
    ? decodedToken.email.trim().toLowerCase()
    : "";
  const role = typeof decodedToken.role === "string"
    ? decodedToken.role
    : "";

  if (role !== "teacher" && email !== TEACHER_EMAIL) {
    throw new Error("FORBIDDEN");
  }

  return decodedToken.uid;
}

function toRegistrationItem(id: string, data: FirebaseFirestore.DocumentData) {
  const studentGrade = typeof data.studentGrade === "string"
    ? data.studentGrade
    : typeof data.grade === "string"
      ? data.grade
      : "";

  return {
    id,
    studentId: typeof data.studentId === "string" ? data.studentId : id,
    studentName: typeof data.studentName === "string" ? data.studentName : "طالب",
    grade: studentGrade,
    studentGrade,
    studentClass: typeof data.studentClass === "string" ? data.studentClass : "",
    skill: typeof data.skill === "string" ? data.skill : "",
    priority: isSecondGradePriority(data) ? 1 : 2,
    status: "pending" as const,
    createdAt: toIsoDate(data.createdAt),
  } satisfies RegistrationItem;
}

function isSecondGradePriority(data: FirebaseFirestore.DocumentData) {
  return data.priority === 1 ||
    (typeof data.studentGrade === "string" && data.studentGrade.includes("الثاني")) ||
    (typeof data.studentClass === "string" && data.studentClass.includes("الثاني"));
}

function toIsoDate(value: unknown) {
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    date = Number.isNaN(parsed.getTime()) ? null : parsed;
  } else if (value && typeof value === "object") {
    const timestamp = value as {
      toDate?: () => Date;
      toMillis?: () => number;
    };

    if (typeof timestamp.toDate === "function") {
      const parsed = timestamp.toDate();
      date = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else if (typeof timestamp.toMillis === "function") {
      const parsed = new Date(timestamp.toMillis());
      date = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return date?.toISOString() ?? null;
}

function getErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول بحساب المعلم." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { success: false, message: "هذا المسار مخصص للمعلم." },
      { status: 403 }
    );
  }

  console.error("تعذر إدارة حصص التمكين القرائي:", error);
  return NextResponse.json(
    { success: false, message: "تعذر تنفيذ العملية حاليًا." },
    { status: 500 }
  );
}

function getStudentIdentityKey(data: FirebaseFirestore.DocumentData) {
  const studentId = typeof data.studentId === "string"
    ? data.studentId.trim()
    : "";

  if (studentId && !studentId.startsWith("guest-")) {
    return `student:${studentId}`;
  }

  const normalize = (value: unknown) =>
    typeof value === "string"
      ? value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar")
      : "";

  return [
    normalize(data.studentName),
    normalize(data.grade),
    normalize(data.studentClass),
  ].join("|");
}

function getSessionStudentText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function getSessionStudentGrade(data: FirebaseFirestore.DocumentData) {
  if (typeof data.grade === "string" && data.grade.trim()) {
    return data.grade.trim();
  }

  const studentClass = typeof data.studentClass === "string"
    ? data.studentClass
    : "";
  const gradeMatch = studentClass.match(/(الأول|الثاني|الثالث|الرابع|الخامس|السادس)/);

  return gradeMatch?.[1] ?? "غير محدد";
}

function getRiyadhDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isUpcomingSession(sessionDate: string, sessionTime: string) {
  const sessionTimestamp = Date.parse(`${sessionDate}T${sessionTime}:00+03:00`);
  return !Number.isNaN(sessionTimestamp) && sessionTimestamp >= Date.now();
}

function toUpcomingSessionItem(
  id: string,
  data: FirebaseFirestore.DocumentData
): UpcomingSessionItem | null {
  const sessionDate = getSessionStudentText(data.sessionDate, "");
  const sessionTime = getSessionStudentText(data.sessionTime, "");

  if (!isUpcomingSession(sessionDate, sessionTime)) {
    return null;
  }

  const students = Array.isArray(data.students)
    ? data.students.map((student: FirebaseFirestore.DocumentData) => ({
      studentName: getSessionStudentText(student?.studentName, "طالب"),
      grade: getSessionStudentText(student?.grade, "غير محدد"),
      skill: getSessionStudentText(student?.skill, "غير محدد"),
    }))
    : [];

  return {
    id,
    sessionDate,
    sessionTime,
    locationNote: getSessionStudentText(data.locationNote, "غير محدد"),
    studentCount: typeof data.studentCount === "number"
      ? data.studentCount
      : students.length,
    students,
  };
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb
      .collection("readingSupportRegistrations")
      .where("status", "==", "pending")
      .limit(MAX_PENDING_REQUESTS)
      .get();
    const upcomingSessionsSnapshot = await adminDb
      .collection("readingSupportSessions")
      .where("sessionDate", ">=", getRiyadhDateKey())
      .orderBy("sessionDate", "asc")
      .limit(MAX_UPCOMING_SESSIONS)
      .get();

    const requests = snapshot.docs
      .map((item) => toRegistrationItem(item.id, item.data()))
      .sort((first, second) => {
        if (first.priority !== second.priority) {
          return first.priority - second.priority;
        }

        const firstTime = first.createdAt
          ? Date.parse(first.createdAt)
          : 0;
        const secondTime = second.createdAt
          ? Date.parse(second.createdAt)
          : 0;
        return firstTime - secondTime;
      });
    const upcomingSessions = upcomingSessionsSnapshot.docs
      .map((item) => toUpcomingSessionItem(item.id, item.data()))
      .filter((item): item is UpcomingSessionItem => item !== null);

    return NextResponse.json({ success: true, requests, upcomingSessions });
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await requireTeacher(request);
    const body = (await request.json()) as SessionRequest;
    const requestIds = Array.from(new Set(body.requestIds ?? []));
    const sessionDate = body.sessionDate?.trim();
    const sessionTime = body.sessionTime?.trim();
    const locationNote = body.locationNote?.trim() ?? "";

    if (
      requestIds.length === 0 ||
      requestIds.length > SESSION_CAPACITY ||
      !sessionDate ||
      !sessionTime
    ) {
      return NextResponse.json(
        { success: false, message: "اختر من 1 إلى 6 طلاب وأكمل بيانات الحصة." },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const sessionReference = adminDb.collection("readingSupportSessions").doc();
    const requestReferences = requestIds.map((id) =>
      adminDb.collection("readingSupportRegistrations").doc(id)
    );

    await adminDb.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionReference);
      if (sessionSnapshot.exists) {
        throw new Error("SESSION_ALREADY_EXISTS");
      }

      const requestSnapshots = await Promise.all(
        requestReferences.map((reference) => transaction.get(reference))
      );
      const registrations = requestSnapshots.map((snapshot, index) => {
        if (!snapshot.exists) {
          throw new Error("REQUEST_NOT_FOUND");
        }

        const data = snapshot.data() as { status?: string };
        if (data.status !== "pending") {
          throw new Error("REQUEST_NOT_PENDING");
        }

        return {
          id: requestIds[index],
          reference: requestReferences[index],
          data: snapshot.data() as FirebaseFirestore.DocumentData,
        };
      });

      const studentIdentityKeys = new Set<string>();
      registrations.forEach((registration) => {
        const identityKey = getStudentIdentityKey(registration.data);
        if (studentIdentityKeys.has(identityKey)) {
          throw new Error("DUPLICATE_STUDENT");
        }
        studentIdentityKeys.add(identityKey);
      });

      const selectedStudents = registrations.map((item) => ({
        registrationId: item.id,
        studentId: typeof item.data.studentId === "string"
          ? item.data.studentId.trim() || null
          : null,
        studentName: getSessionStudentText(item.data.studentName, "طالب"),
        grade: getSessionStudentGrade(item.data),
        studentClass: getSessionStudentText(item.data.studentClass, "غير محدد"),
        skill: getSessionStudentText(item.data.skill, "غير محدد"),
      }));

      transaction.create(sessionReference, {
        capacity: SESSION_CAPACITY,
        sessionDate,
        sessionTime,
        locationNote,
        studentCount: selectedStudents.length,
        students: selectedStudents,
        createdBy: teacherId,
        createdAt: FieldValue.serverTimestamp(),
      });

      registrations.forEach((item) => {
        transaction.update(item.reference, {
          status: "accepted",
          sessionId: sessionReference.id,
          acceptedAt: FieldValue.serverTimestamp(),
        });
      });
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionReference.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "أحد الطلبات لم يعد متاحًا." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "REQUEST_NOT_PENDING") {
      return NextResponse.json(
        { success: false, message: "تغيرت حالة أحد الطلبات، حدّث القائمة وحاول مرة أخرى." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "DUPLICATE_STUDENT") {
      return NextResponse.json(
        { success: false, message: "لا يمكن إضافة الطالب نفسه أكثر من مرة في الحصة." },
        { status: 409 }
      );
    }

    return getErrorResponse(error);
  }
}
