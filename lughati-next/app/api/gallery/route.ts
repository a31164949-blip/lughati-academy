import { NextResponse } from "next/server";
import { GET as getSubmissions } from "../submissions/route";
import { getFirebaseAdmin } from "../../../firebase-admin";

type Submission = {
  id?: number;
  row?: number;
  timestamp?: string;
  studentName?: string;
  studentId?: string;
  classroom?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  consent?: string;
  status?: string;
  note?: string;
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
     * أولًا: تحميل أعمال الطلاب العادية
     */
    const response =
      await getSubmissions();

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر تحميل معرض الطلاب",
          works: [],
          notebooks: [],
        },
        {
          status: 502,
        }
      );
    }

    const submissions: Submission[] =
      Array.isArray(
        data.submissions
      )
        ? data.submissions
        : [];

    const approvedSubmissions =
      submissions.filter(
        (submission) =>
          submission.status ===
            "معتمد" &&
          typeof submission.fileUrl ===
            "string" &&
          submission.fileUrl.trim() !==
            ""
      );

    /*
     * ثانيًا: تحميل جماليات الدفاتر
     */
    const notebookSnapshot =
      await adminDb
        .collection(
          "notebookGallery"
        )
        .orderBy(
          "publishedAt",
          "desc"
        )
        .get();

    const notebookItems: NotebookGalleryItem[] =
      notebookSnapshot.docs
        .map(
          (docSnapshot) => {
            const notebookData =
              docSnapshot.data();

            return {
              id:
                docSnapshot.id,

              studentId:
                typeof notebookData.studentId ===
                "string"
                  ? notebookData.studentId
                  : "",

              studentName:
                typeof notebookData.studentName ===
                "string"
                  ? notebookData.studentName
                  : "طالب",

              category:
                typeof notebookData.category ===
                "string"
                  ? notebookData.category
                  : "",

              note:
                typeof notebookData.note ===
                "string"
                  ? notebookData.note
                  : "",

              imageUrl:
                typeof notebookData.imageUrl ===
                "string"
                  ? notebookData.imageUrl
                  : "",

              badge:
                typeof notebookData.badge ===
                "string"
                  ? notebookData.badge
                  : "دفتر أنيق ✨",

              isPublished:
                notebookData.isPublished !==
                false,
            };
          }
        )
        .filter(
          (item) =>
            item.isPublished &&
            item.imageUrl.trim() !==
              ""
        );

    /*
     * ثالثًا:
     * نجمع جميع معرفات الطلاب
     * من الأعمال + الدفاتر
     */
    const studentIds =
      Array.from(
        new Set(
          [
            ...approvedSubmissions.map(
              (submission) =>
                submission.studentId ||
                ""
            ),

            ...notebookItems.map(
              (item) =>
                item.studentId ||
                ""
            ),
          ].filter(Boolean)
        )
      );

    /*
     * رابعًا:
     * تحميل هوية كل طالب مرة واحدة فقط
     */
    const studentIdentityMap =
      new Map<
        string,
        StudentIdentity
      >();

    if (
      studentIds.length > 0
    ) {
      const studentRefs =
        studentIds.map(
          (studentId) =>
            adminDb
              .collection(
                "students"
              )
              .doc(
                studentId
              )
        );

      const studentSnapshots =
        await adminDb.getAll(
          ...studentRefs
        );

      studentSnapshots.forEach(
        (snapshot) => {
          if (
            !snapshot.exists
          ) {
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
        }
      );
    }

    /*
     * خامسًا:
     * تجهيز أعمال الطلاب
     * وإضافة الهوية
     */
    const works =
      approvedSubmissions.map(
        (submission) => {
          const studentId =
            submission.studentId ||
            "";

          const identity =
            studentIdentityMap.get(
              studentId
            );

          return {
            id:
              submission.id,

            row:
              submission.row,

            studentName:
              submission.studentName ||
              "طالب",

            studentId,

            classroom:
              submission.classroom ||
              "",

            title:
              submission.title ||
              "عمل مميز",

            type:
              submission.type ||
              "عمل طالب",

            fileUrl:
              submission.fileUrl ||
              "",

            note:
              submission.note ||
              "",

            status:
              submission.status ||
              "معتمد",

            personalPhotoUrl:
              identity?.personalPhotoUrl ||
              "",

            selectedAvatarIcon:
              identity?.selectedAvatarIcon ||
              "👦🏻",

            publishedAt:
              submission.timestamp ||
              "",

            timestamp:
              submission.timestamp ||
              "",
          };
        }
      );

    /*
     * سادسًا:
     * تجهيز جماليات الدفاتر
     * وإضافة الهوية
     */
    const notebooks =
      notebookItems.map(
        (item) => {
          const identity =
            studentIdentityMap.get(
              item.studentId
            );

          return {
            id:
              item.id,

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
              identity?.personalPhotoUrl ||
              "",

            selectedAvatarIcon:
              identity?.selectedAvatarIcon ||
              "👦🏻",
          };
        }
      );

    return NextResponse.json({
      success: true,

      count:
        works.length,

      notebookCount:
        notebooks.length,

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