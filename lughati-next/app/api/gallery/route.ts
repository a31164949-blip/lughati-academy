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

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();

    /*
     * أولًا:
     * تحميل أعمال الطلاب
     * مباشرة من studentWorks
     */
    const worksSnapshot = await adminDb
      .collection("studentWorks")
      .orderBy("createdAt", "desc")
      .get();

    const approvedSubmissions: StudentWork[] =
      worksSnapshot.docs
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

            createdAt:
              data.createdAt ?? null,
          };
        })
        .filter(
          (submission) =>
            submission.status === "approved" &&
            submission.publishedToGallery === true &&
            submission.fileUrl.trim() !== ""
        );

    /*
     * ثانيًا:
     * تحميل جماليات الدفاتر
     */
    const notebookSnapshot = await adminDb
      .collection("notebookGallery")
      .orderBy("publishedAt", "desc")
      .get();

    const notebookItems: NotebookGalleryItem[] =
      notebookSnapshot.docs
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

    return NextResponse.json({
      success: true,
      count: works.length,
      notebookCount: notebooks.length,
      works,
      notebooks,
    });
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
        status: 500,
      }
    );
  }
}