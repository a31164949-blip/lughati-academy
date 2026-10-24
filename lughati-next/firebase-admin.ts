import { STUDENT_ACADEMY_PAUSED, isStudentPreviewAccount } from "./app/lib/academyAvailability";
import "server-only";
import { unstable_cache } from "next/cache";
import { ADMISSION_ACCESS_TAG, CONTINUATION_ROUND, acceptedStudentIds, validContinuationId } from "./app/lib/academyContinuation";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

let cachedAdminApp: App | null = null;

type ServiceAccountData = {
  project_id?: unknown;
  client_email?: unknown;
  private_key?: unknown;
};

function readServiceAccountData(): ServiceAccountData {
  const rawServiceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT?.trim();

  if (!rawServiceAccount) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawServiceAccount) as ServiceAccountData;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function cleanString(value: unknown) {
  return typeof value === "string"
    ? value.trim().replace(/^['"]|['"]$/g, "")
    : "";
}

function getAdminApp(): App {
  if (cachedAdminApp) {
    return cachedAdminApp;
  }

  const existingApp = getApps()[0];

  if (existingApp) {
    cachedAdminApp = existingApp;
    return existingApp;
  }

  const serviceAccount = readServiceAccountData();
  const projectId =
    cleanString(process.env.FIREBASE_PROJECT_ID) ||
    cleanString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
    cleanString(serviceAccount.project_id) ||
    cleanString(process.env.FIREBASE_ADMIN_PROJECT_ID);

  const clientEmail =
    cleanString(process.env.FIREBASE_ADMIN_CLIENT_EMAIL) ||
    cleanString(serviceAccount.client_email);

  const privateKey =
    (
      cleanString(process.env.FIREBASE_ADMIN_PRIVATE_KEY) ||
      cleanString(serviceAccount.private_key)
    ).replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    const missingVariables = [
      !projectId && "FIREBASE_PROJECT_ID",
      !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      !projectId && "service account project_id",
      !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
      !privateKey && "FIREBASE_ADMIN_PRIVATE_KEY",
    ].filter(Boolean);

    console.error(
      "Firebase Admin configuration is missing:",
      missingVariables.join(", ")
    );
    throw new Error("Firebase Admin configuration is incomplete.");
  }

  cachedAdminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return cachedAdminApp;
}

// Status checks must remain accessible so a suspended student can see the family notice.
export function getFirebaseAdmin(options: { allowSuspended?: boolean } = {}) {
  const adminApp = getAdminApp();

  const adminDb = getFirestore(adminApp);
  const rawAuth = getAuth(adminApp);
  const adminAuth = options.allowSuspended ? rawAuth : new Proxy(rawAuth, {
    get(target, property) {
      if (property === "verifyIdToken") return async (...args: Parameters<typeof rawAuth.verifyIdToken>) => {
        const token = await rawAuth.verifyIdToken(...args);
        if (STUDENT_ACADEMY_PAUSED && token.role === "student" && !isStudentPreviewAccount(token.studentDocId) && !await hasAcademyAdmission(token.studentDocId)) throw new Error("FORBIDDEN");
        if (token.role === "student" && typeof token.studentDocId === "string") {
          const student = await adminDb.collection("students").doc(token.studentDocId).get();
          const control = student.data()?.accessControl;
          const until = control?.until?.toMillis?.();
          if (control?.mode === "account" && (until == null || until > Date.now())) throw new Error("FORBIDDEN");
        }
        return token;
      };
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return { adminAuth, adminDb };
}

const approvedAcademyStudents = unstable_cache(async () => {
  const round = await getFirestore(getAdminApp()).collection("academyContinuationRounds").doc(CONTINUATION_ROUND).get();
  return acceptedStudentIds(round.data());
}, ["academy-approved-access-v1", CONTINUATION_ROUND], { revalidate: 30, tags: [ADMISSION_ACCESS_TAG] });

export async function hasAcademyAdmission(id: unknown) {
  return validContinuationId(id) && (await approvedAcademyStudents()).includes(id);
}

// Activate decisions made before admission was linked to access. The metadata is
// rechecked transactionally; an old client response cannot reopen a revoked seat.
export async function ensureAcademyAdmissionAccess(id: string) {
  const db = getFirestore(getAdminApp()), ref = db.collection("students").doc(id);
  const initial = (await ref.get()).data();
  if (!initial || initial.deleted === true) return false;
  if (initial.academyAdmission?.round === CONTINUATION_ROUND && initial.academyAdmission?.status === "accepted") return true;
  return db.runTransaction(async tx => {
    const [round, student] = await Promise.all([tx.get(db.collection("academyContinuationRounds").doc(CONTINUATION_ROUND)), tx.get(ref)]);
    const data = student.data();
    if (!data || data.deleted === true || !acceptedStudentIds(round.data()).includes(id)) return false;
    if (data.academyAdmission?.round === CONTINUATION_ROUND && data.academyAdmission?.status === "accepted") return true;
    tx.update(ref, { academyAdmission: { round: CONTINUATION_ROUND, status: "accepted" }, ...(["account", "extras"].includes(data.accessControl?.mode) ? { accessControl: { mode: "resume", until: null, resumedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), updatedBy: "academy-admission" } } : {}) });
    return true;
  });
}
