import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEACHER_EMAIL =
  "a31164949@gmail.com";

type CloudinaryResource = {
  public_id?: string;
  secure_url?: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  duration?: number;
  created_at?: string;
  original_filename?: string;
};

type CloudinaryResponse = {
  resources?: CloudinaryResource[];
  next_cursor?: string;
};

type RecoverReadingPayload = {
  publicId?: string;
  secureUrl?: string;
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  readingDate?: string;
  durationSeconds?: number;
};

type StudentCandidate = {
  studentId: string;
  studentName: string;
  studentClassroom: string;
  confidence: "high" | "medium" | "low";
  differenceSeconds: number;
  matchedBy: "lastActivityAt" | "lastLoginAt";
};

type StudentActivityRow = {
  studentId: string;
  studentName: string;
  studentClassroom: string;
  lastActivityAtMs: number | null;
  lastLoginAtMs: number | null;
};

function timestampToMs(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return null;
    }
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().getTime();
    } catch {
      return null;
    }
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildCandidates(
  createdAt: string,
  students: StudentActivityRow[]
): StudentCandidate[] {
  const createdAtMs = new Date(createdAt).getTime();

  if (!Number.isFinite(createdAtMs)) {
    return [];
  }

  const scored = students
    .flatMap((student) => {
      const options: StudentCandidate[] = [];

      if (student.lastActivityAtMs !== null) {
        const differenceSeconds = Math.round(
          Math.abs(student.lastActivityAtMs - createdAtMs) / 1000
        );

        if (differenceSeconds <= 15 * 60) {
          options.push({
            studentId: student.studentId,
            studentName: student.studentName,
            studentClassroom: student.studentClassroom,
            confidence:
              differenceSeconds <= 2 * 60
                ? "high"
                : differenceSeconds <= 5 * 60
                  ? "medium"
                  : "low",
            differenceSeconds,
            matchedBy: "lastActivityAt",
          });
        }
      }

      if (student.lastLoginAtMs !== null) {
        const differenceSeconds = Math.round(
          Math.abs(student.lastLoginAtMs - createdAtMs) / 1000
        );

        if (differenceSeconds <= 10 * 60) {
          options.push({
            studentId: student.studentId,
            studentName: student.studentName,
            studentClassroom: student.studentClassroom,
            confidence:
              differenceSeconds <= 2 * 60
                ? "medium"
                : "low",
            differenceSeconds,
            matchedBy: "lastLoginAt",
          });
        }
      }

      return options;
    })
    .sort((a, b) => {
      const weight = {
        high: 0,
        medium: 1,
        low: 2,
      } as const;

      if (weight[a.confidence] !== weight[b.confidence]) {
        return weight[a.confidence] - weight[b.confidence];
      }

      if (a.matchedBy !== b.matchedBy) {
        return a.matchedBy === "lastActivityAt" ? -1 : 1;
      }

      return a.differenceSeconds - b.differenceSeconds;
    });

  const unique = new Map<string, StudentCandidate>();

  for (const candidate of scored) {
    const existing = unique.get(candidate.studentId);

    if (
      !existing ||
      candidate.differenceSeconds < existing.differenceSeconds
    ) {
      unique.set(candidate.studentId, candidate);
    }
  }

  return Array.from(unique.values()).slice(0, 5);
}

/*
 * =====================================================
 * التحقق من المعلم
 * =====================================================
 */
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

  const decoded =
    await adminAuth.verifyIdToken(
      token
    );

  const email =
    typeof decoded.email ===
    "string"
      ? decoded.email
          .trim()
          .toLowerCase()
      : "";

  if (
    email !==
    TEACHER_EMAIL.toLowerCase()
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return {
    uid: decoded.uid,
    email,
  };
}

/*
 * =====================================================
 * إعداد Cloudinary
 * =====================================================
 */
function getCloudinaryConfig() {
  const cloudName =
    process.env
      .CLOUDINARY_CLOUD_NAME
      ?.trim() || "";

  const apiKey =
    process.env
      .CLOUDINARY_API_KEY
      ?.trim() || "";

  const apiSecret =
    process.env
      .CLOUDINARY_API_SECRET
      ?.trim() || "";

  if (
    !cloudName ||
    !apiKey ||
    !apiSecret
  ) {
    throw new Error(
      "CLOUDINARY_NOT_CONFIGURED"
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

/*
 * =====================================================
 * قراءة ملفات Cloudinary
 * =====================================================
 *
 * نستخدم Admin API من جهة الخادم فقط.
 * API Secret لا يخرج إلى المتصفح.
 */
async function loadCloudinaryResources() {
  const {
    cloudName,
    apiKey,
    apiSecret,
  } =
    getCloudinaryConfig();

  const basicToken =
    Buffer.from(
      `${apiKey}:${apiSecret}`
    ).toString("base64");

  const url =
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      cloudName
    )}/resources/video/upload` +
    "?max_results=200&direction=desc";

  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Basic ${basicToken}`,
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Cloudinary Admin API error:",
      response.status,
      errorText
    );

    throw new Error(
      "CLOUDINARY_FETCH_FAILED"
    );
  }

  const data =
    (await response.json()) as
      CloudinaryResponse;

  return Array.isArray(
    data.resources
  )
    ? data.resources
    : [];
}

/*
 * =====================================================
 * معرف القراءة اليومية
 * =====================================================
 */
function getDailySubmissionId(
  studentId: string,
  readingDate: string
) {
  const safeStudentId =
    encodeURIComponent(
      studentId
    );

  return `${safeStudentId}_${readingDate}`;
}

/*
 * =====================================================
 * GET
 * =====================================================
 *
 * يعرض المقاطع الموجودة في Cloudinary
 * وغير المرتبطة حاليًا بسجل قراءة.
 *
 * لا يحذف ولا يعدل أي شيء.
 */
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

    const [
      cloudinaryResources,
      submissionsSnapshot,
      studentsSnapshot,
    ] =
      await Promise.all([
        loadCloudinaryResources(),

        adminDb
          .collection(
            "reading-submissions"
          )
          .get(),

        adminDb
          .collection(
            "students"
          )
          .get(),
      ]);

    /*
     * نجمع كل public_id المسجلة
     * وكل روابط الملفات المسجلة.
     *
     * دعمًا للسجلات القديمة التي
     * لا تحتوي audioPublicId.
     */
    const linkedPublicIds =
      new Set<string>();

    const linkedUrls =
      new Set<string>();

    submissionsSnapshot
      .docs
      .forEach(
        (document) => {
          const data =
            document.data();

          if (
            typeof data
              .audioPublicId ===
              "string" &&
            data.audioPublicId.trim()
          ) {
            linkedPublicIds.add(
              data.audioPublicId.trim()
            );
          }

          if (
            typeof data.audioUrl ===
              "string" &&
            data.audioUrl.trim()
          ) {
            linkedUrls.add(
              data.audioUrl.trim()
            );
          }
        }
      );

    const studentActivityRows: StudentActivityRow[] =
      studentsSnapshot.docs.map((document) => {
        const data = document.data();

        const studentName =
          typeof data.studentName === "string"
            ? data.studentName
            : typeof data.name === "string"
              ? data.name
              : "طالب";

        const studentClassroom =
          typeof data.classroom === "string"
            ? data.classroom
            : "";

        const studentId =
          typeof data.studentId === "string" &&
          data.studentId.trim()
            ? data.studentId.trim()
            : document.id;

        return {
          studentId,
          studentName,
          studentClassroom,
        lastActivityAtMs: timestampToMs(
  data.journey?.lastActivityAt
),
          lastLoginAtMs: timestampToMs(
            data.lastLoginAt
          ),
        };
      });

    /*
     * نعرض الملفات غير المرتبطة فقط.
     *
     * لا نفترض أن كل ملف WebM
     * قراءة مفقودة؛ المعلم سيعاين
     * التسجيل قبل استعادته.
     */
    const orphaned =
      cloudinaryResources
        .map((resource) => {
          const publicId =
            typeof resource.public_id ===
            "string"
              ? resource.public_id
              : "";

          const secureUrl =
            typeof resource.secure_url ===
            "string"
              ? resource.secure_url
              : "";

          const originalFilename =
            typeof resource.original_filename ===
            "string"
              ? resource.original_filename
              : "";

          return {
            publicId,

            secureUrl,

            originalFilename,

            format:
              typeof resource.format ===
              "string"
                ? resource.format.toLowerCase()
                : "",

            durationSeconds:
              typeof resource.duration ===
              "number"
                ? Math.round(
                    resource.duration
                  )
                : 0,

            bytes:
              typeof resource.bytes ===
              "number"
                ? resource.bytes
                : 0,

            createdAt:
              typeof resource.created_at ===
              "string"
                ? resource.created_at
                : "",

            suggestedStudents:
              buildCandidates(
                typeof resource.created_at ===
                  "string"
                  ? resource.created_at
                  : "",
                studentActivityRows
              ),
          };
        })
       .filter(
  (resource) =>
    resource.publicId &&
    resource.secureUrl &&
    resource.format === "webm" &&
    !linkedPublicIds.has(
      resource.publicId
    ) &&
    !linkedUrls.has(
      resource.secureUrl
    )
);

    return NextResponse.json({
      success: true,

      totalCloudinaryResources:
        cloudinaryResources.length,

      linkedSubmissions:
        submissionsSnapshot.size,

      orphanedCount:
        orphaned.length,

      resources:
        orphaned,
    });
  } catch (error) {
    console.error(
      "Reading recovery GET error:",
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
            "غير مصرح بالدخول.",
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
            "هذا المسار مخصص للمعلم.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      message ===
      "CLOUDINARY_NOT_CONFIGURED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "إعدادات Cloudinary غير مكتملة في الخادم.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "تعذر تحميل تسجيلات Cloudinary.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =====================================================
 * POST
 * =====================================================
 *
 * يعيد تسجيلًا يختاره المعلم إلى
 * reading-submissions.
 *
 * مهم:
 * - pending فقط.
 * - لا نقاط.
 * - لا اعتماد تلقائي.
 * - لا تحديث reading-progress.
 */
export async function POST(
  request: Request
) {
  try {
    const teacher =
      await requireTeacher(
        request
      );

    const body =
      (await request.json()) as
        RecoverReadingPayload;

    const publicId =
      typeof body.publicId ===
      "string"
        ? body.publicId.trim()
        : "";

    const secureUrl =
      typeof body.secureUrl ===
      "string"
        ? body.secureUrl.trim()
        : "";

    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId.trim()
        : "";

    const studentName =
      typeof body.studentName ===
      "string"
        ? body.studentName.trim()
        : "";

    const studentClassroom =
      typeof body.studentClassroom ===
      "string"
        ? body.studentClassroom.trim()
        : "";

    const readingDate =
      typeof body.readingDate ===
      "string"
        ? body.readingDate.trim()
        : "";

    const durationSeconds =
      typeof body.durationSeconds ===
        "number" &&
      Number.isFinite(
        body.durationSeconds
      )
        ? Math.max(
            0,
            Math.min(
              60,
              Math.round(
                body.durationSeconds
              )
            )
          )
        : 0;

    if (
      !publicId ||
      !secureUrl ||
      !studentId ||
      !readingDate
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "بيانات الاستعادة غير مكتملة.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * شكل التاريخ المطلوب:
     * YYYY-MM-DD
     */
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        readingDate
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "تاريخ القراءة غير صحيح.",
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

    /*
     * أولًا نتأكد أن نفس ملف
     * Cloudinary لم يُربط سابقًا.
     */
    const existingAssetSnapshot =
      await adminDb
        .collection(
          "reading-submissions"
        )
        .where(
          "audioPublicId",
          "==",
          publicId
        )
        .limit(1)
        .get();

    if (
      !existingAssetSnapshot.empty
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ASSET_ALREADY_LINKED",

          message:
            "هذا التسجيل مرتبط بقراءة بالفعل.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * دعم السجلات القديمة:
     * قد يكون الرابط محفوظًا
     * دون public_id.
     */
    const existingUrlSnapshot =
      await adminDb
        .collection(
          "reading-submissions"
        )
        .where(
          "audioUrl",
          "==",
          secureUrl
        )
        .limit(1)
        .get();

    if (
      !existingUrlSnapshot.empty
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ASSET_ALREADY_LINKED",

          message:
            "هذا التسجيل مرتبط بقراءة بالفعل.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * لا نسمح بإنشاء قراءة ثانية
     * لنفس الطالب في نفس اليوم.
     */
    const existingDaySnapshot =
      await adminDb
        .collection(
          "reading-submissions"
        )
        .where(
          "studentId",
          "==",
          studentId
        )
        .where(
          "readingDate",
          "==",
          readingDate
        )
        .limit(1)
        .get();

    if (
      !existingDaySnapshot.empty
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "يوجد بالفعل تسجيل قراءة لهذا الطالب في هذا التاريخ.",
        },
        {
          status: 409,
        }
      );
    }

    const submissionId =
      getDailySubmissionId(
        studentId,
        readingDate
      );

    const submissionRef =
      adminDb
        .collection(
          "reading-submissions"
        )
        .doc(
          submissionId
        );

    const submissionSnapshot =
      await submissionRef.get();

    if (
      submissionSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "يوجد بالفعل تسجيل قراءة لهذا الطالب في هذا التاريخ.",
        },
        {
          status: 409,
        }
      );
    }

    await submissionRef.create({
      studentId,

      studentName,

      studentClassroom,

      audioUrl:
        secureUrl,

      audioPublicId:
        publicId,

      durationSeconds,

      readingDate,

      status:
        "pending",

      source:
        "cloudinary-recovery",

      recovered:
        true,

      recoveredAt:
        FieldValue
          .serverTimestamp(),

      recoveredBy:
        teacher.uid,

      recoveredByEmail:
        teacher.email,

      createdAt:
        FieldValue
          .serverTimestamp(),

      updatedAt:
        FieldValue
          .serverTimestamp(),
    });

    return NextResponse.json({
      success: true,

      submissionId,

      message:
        "✅ تمت إعادة التسجيل إلى مراجعة القراءات بنجاح.",
    });
  } catch (error) {
    console.error(
      "Reading recovery POST error:",
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
            "غير مصرح بالدخول.",
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
            "هذا المسار مخصص للمعلم.",
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
          "تعذر استعادة التسجيل حاليًا.",
      },
      {
        status: 500,
      }
    );
  }
}