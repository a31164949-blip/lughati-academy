import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

type StudentWork = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  title: string;
  type: string;
  fileUrl: string;
  note: string;
  status: string;
  publishedToGallery: boolean;
  published: boolean;
  createdAt?: {
    toDate?: () => Date;
  } | null;
};

type NotebookGalleryItem = {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  note: string;
  imageUrl: string;
  badge: string;
  isPublished: boolean;
};

type StudentIdentity = {
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

const PAGE_SIZE = 30;
type Cursor = { seconds: number; nanoseconds: number; id: string } | null;
function parseCursor(value: string): Cursor {
  if (!value || value === "done") return null;
  const cursor = JSON.parse(value);
  if (!Number.isInteger(cursor.seconds) || !Number.isInteger(cursor.nanoseconds) || cursor.nanoseconds < 0 || cursor.nanoseconds >= 1000000000 || typeof cursor.id !== "string" || !cursor.id || cursor.id.includes("/") || cursor.id.length > 1500) throw new Error("INVALID_CURSOR");
  return { seconds: cursor.seconds, nanoseconds: cursor.nanoseconds, id: cursor.id };
}
function nextCursor(snapshot: FirebaseFirestore.QuerySnapshot | null, field: string) {
  if (!snapshot || snapshot.size < PAGE_SIZE) return "done";
  const last = snapshot.docs.at(-1)!;
  return JSON.stringify({ seconds: last.get(field).seconds, nanoseconds: last.get(field).nanoseconds, id: last.id });
}
async function page(collection: string, field: string, value: string) {
  if (value === "done") return null;
  const { adminDb } = getFirebaseAdmin();
  let query = adminDb.collection(collection).orderBy(field, "desc").orderBy(FieldPath.documentId(), "desc");
  const cursor = parseCursor(value);
  if (cursor) query = query.startAfter(new Timestamp(cursor.seconds, cursor.nanoseconds), cursor.id);
  return query.limit(PAGE_SIZE).get();
}
async function loadGallery(worksCursor: string, notebooksCursor: string) {
    const { adminDb } = getFirebaseAdmin();

    /*
     * أولًا:
     * تحميل أعمال الطلاب
     * مباشرة من studentWorks
     */
    const [worksSnapshot, notebookSnapshot] = await Promise.all([
      page("studentWorks", "createdAt", worksCursor),
      page("notebookGallery", "publishedAt", notebooksCursor),
    ]);

    const approvedSubmissions: StudentWork[] =
      (worksSnapshot?.docs ?? [])
        .map((docSnapshot) => {
          const data = docSnapshot.data();

          return {
            id: docSnapshot.id,

            studentId:
              typeof data.studentId === "string"
                ? data.studentId
                : "",

            studentName:
              typeof data.studentName === "string"
                ? data.studentName
                : "طالب",

            classroom:
              typeof data.classroom === "string"
                ? data.classroom
                : "",

            title:
              typeof data.title === "string"
                ? data.title
                : "عمل مميز",

            type:
              typeof data.workType === "string"
                ? data.workType
                : typeof data.type === "string"
                  ? data.type
                  : "image",

            fileUrl:
              typeof data.fileUrl === "string"
                ? data.fileUrl
                : "",

            note:
              typeof data.teacherNote === "string"
                ? data.teacherNote
                : typeof data.note === "string"
                  ? data.note
                  : "",

            status:
              typeof data.status === "string"
                ? data.status
                : "pending",

               publishedToGallery:
  data.publishedToGallery === true,

published:
  data.published === true,

            createdAt:
              data.createdAt ?? null,
          };
        })
         .filter(
  (submission) => {
    const isApproved =
      submission.status === "approved" ||
      submission.status === "معتمد";

    const isPublished =
      submission.publishedToGallery === true ||
      submission.published === true;

    return (
      isApproved &&
      isPublished &&
      submission.fileUrl.trim() !== ""
    );
  }
);

    /*
     * ثانيًا:
     * تحميل جماليات الدفاتر
     */

    const notebookItems: NotebookGalleryItem[] =
      (notebookSnapshot?.docs ?? [])
        .map((docSnapshot) => {
          const notebookData = docSnapshot.data();

          return {
            id: docSnapshot.id,

            studentId:
              typeof notebookData.studentId === "string"
                ? notebookData.studentId
                : "",

            studentName:
              typeof notebookData.studentName === "string"
                ? notebookData.studentName
                : "طالب",

            category:
              typeof notebookData.category === "string"
                ? notebookData.category
                : "",

            note:
              typeof notebookData.note === "string"
                ? notebookData.note
                : "",

            imageUrl:
              typeof notebookData.imageUrl === "string"
                ? notebookData.imageUrl
                : "",

            badge:
              typeof notebookData.badge === "string"
                ? notebookData.badge
                : "دفتر أنيق ✨",

            isPublished:
              notebookData.isPublished !== false,
          };
        })
        .filter(
          (item) =>
            item.isPublished &&
            item.imageUrl.trim() !== ""
        );

    /*
     * ثالثًا:
     * جمع معرفات الطلاب
     */
    const studentIds = Array.from(
      new Set(
        [
          ...approvedSubmissions.map(
            (submission) => submission.studentId
          ),
          ...notebookItems.map(
            (item) => item.studentId
          ),
        ].filter(Boolean)
      )
    );

    /*
     * رابعًا:
     * تحميل هوية الطلاب
     */
    const studentIdentityMap =
      new Map<string, StudentIdentity>();

    if (studentIds.length > 0) {
      const studentRefs = studentIds.map(
        (studentId) =>
          adminDb
            .collection("students")
            .doc(studentId)
      );

      const studentSnapshots =
        await adminDb.getAll(...studentRefs);

      studentSnapshots.forEach((snapshot) => {
        if (!snapshot.exists) {
          return;
        }

        const studentData =
          snapshot.data() ?? {};

        const personalPhotoUrl =
          studentData.personalPhotoStatus ===
            "approved" &&
          typeof studentData.personalPhotoUrl ===
            "string"
            ? studentData.personalPhotoUrl
            : "";

        const selectedAvatarIcon =
          typeof studentData.selectedAvatarIcon ===
          "string"
            ? studentData.selectedAvatarIcon
            : "👦🏻";

        studentIdentityMap.set(
          snapshot.id,
          {
            personalPhotoUrl,
            selectedAvatarIcon,
          }
        );
      });
    }

    /*
     * خامسًا:
     * تجهيز أعمال الطلاب
     */
    const works = approvedSubmissions.map(
      (submission) => {
        const identity =
          studentIdentityMap.get(
            submission.studentId
          );

        let timestamp = "";

        if (
          submission.createdAt &&
          typeof submission.createdAt.toDate ===
            "function"
        ) {
          timestamp =
            submission.createdAt
              .toDate()
              .toISOString();
        }

        return {
          id: submission.id,

          studentName:
            submission.studentName,

          studentId:
            submission.studentId,

          classroom:
            submission.classroom,

          title:
            submission.title,

          type:
            submission.type,

          fileUrl:
            submission.fileUrl,

          note:
            submission.note,

          status:
            submission.status,

          personalPhotoUrl:
            identity?.personalPhotoUrl ?? "",

          selectedAvatarIcon:
            identity?.selectedAvatarIcon ??
            "👦🏻",

          publishedAt:
            timestamp,

          timestamp,
        };
      }
    );

    /*
     * سادسًا:
     * تجهيز جماليات الدفاتر
     */
    const notebooks = notebookItems.map(
      (item) => {
        const identity =
          studentIdentityMap.get(
            item.studentId
          );

        return {
          id: item.id,

          studentId:
            item.studentId,

          studentName:
            item.studentName,

          category:
            item.category,

          note:
            item.note,

          imageUrl:
            item.imageUrl,

          badge:
            item.badge,

          personalPhotoUrl:
            identity?.personalPhotoUrl ?? "",

          selectedAvatarIcon:
            identity?.selectedAvatarIcon ??
            "👦🏻",
        };
      }
    );

    return {
      success: true,
      cursors: { works: nextCursor(worksSnapshot, "createdAt"), notebooks: nextCursor(notebookSnapshot, "publishedAt") },
      count: works.length,
      notebookCount: notebooks.length,
      works,
      notebooks,
    };
}

const getCachedGallery = unstable_cache(loadGallery, ["public-gallery-pages-v2"], { revalidate: 300, tags: ["public-gallery"] });

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const worksCursor = params.get("worksCursor") || "";
    const notebooksCursor = params.get("notebooksCursor") || "";
    if (worksCursor.length > 2000 || notebooksCursor.length > 2000) throw new Error("INVALID_CURSOR");
    parseCursor(worksCursor); parseCursor(notebooksCursor);
    return NextResponse.json(await getCachedGallery(worksCursor, notebooksCursor), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      "Gallery API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء تحميل معرض الطلاب",
        works: [],
        notebooks: [],
      },
      {
        status: error instanceof Error && (error.message === "INVALID_CURSOR" || error instanceof SyntaxError) ? 400 : 503,
      }
    );
  }
}
