import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../../firebase-admin";

export async function POST() {
  try {
    const {
      adminDb,
    } = getFirebaseAdmin();

    /*
      نقرأ جميع إنجازات الواجبات مرة واحدة.

      هذه عملية مزامنة صيانة مؤقتة،
      وليست قراءة مستمرة في الصفحة.
    */
    const completionsSnapshot =
      await adminDb
        .collection(
          "homeworkCompletions"
        )
        .get();

    let checked = 0;
    let creativeFound = 0;
    let published = 0;
    let updatedExisting = 0;
    let alreadyExists = 0;
    let skippedNotCreative = 0;
    let skippedNoImage = 0;
    let skippedNoStudent = 0;
    let failed = 0;

    for (
      const completionDocument
      of completionsSnapshot.docs
    ) {
      checked += 1;

      try {
        const data =
          completionDocument.data();

        const completionId =
          completionDocument.id;

        /*
          طريقة الإنجاز القديمة والجديدة.
        */
        const completionMethod =
          typeof data.completionMethod ===
          "string"
            ? data.completionMethod.trim()
            : "";

        /*
          نعتبر العمل إبداعيًا إذا:
          1) سبق أن مُنحت له نقاط الواجب الإبداعي.
          أو
          2) طريقة الإنجاز نفسها تحتوي على كلمة إبداعي.

          هذا يسمح باسترجاع الأعمال القديمة
          التي سبقت إضافة creativePointsGranted.
        */
        const isCreativeHomework =
          data.creativePointsGranted ===
            true ||
          completionMethod.includes(
            "إبداعي"
          );

        if (!isCreativeHomework) {
          skippedNotCreative += 1;
          continue;
        }

        creativeFound += 1;

        const solutionUrl =
          typeof data.solutionUrl ===
          "string"
            ? data.solutionUrl.trim()
            : "";

        /*
          لا يمكن نشر عمل
          ليس له صورة أو ملف.
        */
        if (!solutionUrl) {
          skippedNoImage += 1;
          continue;
        }

        const studentId =
          typeof data.studentId ===
          "string"
            ? data.studentId.trim()
            : "";

        if (!studentId) {
          skippedNoStudent += 1;
          continue;
        }

        const studentName =
          typeof data.studentName ===
            "string" &&
          data.studentName.trim()
            ? data.studentName.trim()
            : "طالب";

        const classroom =
          typeof data.classroom ===
          "string"
            ? data.classroom.trim()
            : "";

        /*
          أولًا:
          نبحث بالطريقة الجديدة
          عن sourceCompletionId.
        */
        const existingBySource =
          await adminDb
            .collection(
              "studentWorks"
            )
            .where(
              "sourceCompletionId",
              "==",
              completionId
            )
            .limit(1)
            .get();

        if (
          !existingBySource.empty
        ) {
          const existingDocument =
            existingBySource.docs[0];

          const existingData =
            existingDocument.data();

          const alreadyPublished =
            existingData.status ===
              "approved" &&
            existingData
              .publishedToGallery ===
              true &&
            typeof existingData.fileUrl ===
              "string" &&
            existingData.fileUrl.trim() !==
              "";

          /*
            إذا كان العمل موجودًا مسبقًا
            نصلح حالته وخصائص النشر،
            ولا ننشئ نسخة ثانية.
          */
          await existingDocument.ref.set(
            {
              studentName,
              studentId,

              classroom,

              type:
                typeof existingData.type ===
                  "string" &&
                existingData.type.trim()
                  ? existingData.type
                  : "واجب إبداعي",

              fileUrl:
                solutionUrl,

              status:
                "approved",

              publishedToGallery:
                true,

              published:
                true,

              teacherApproved:
                true,

              autoApproved:
                true,

              source:
                "teacher-approved-creative-homework",

              sourceCompletionId:
                completionId,

              approvedAt:
                existingData
                  .approvedAt ||
                FieldValue
                  .serverTimestamp(),

              publishedAt:
                existingData
                  .publishedAt ||
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          if (alreadyPublished) {
            alreadyExists += 1;
          } else {
            updatedExisting += 1;
          }

          continue;
        }

        /*
          ثانيًا:
          الأعمال القديمة ربما كانت موجودة
          في studentWorks قبل إضافة
          sourceCompletionId.

          لذلك نبحث باسم الطالب أولًا،
          ثم نطابق رابط الصورة أو الملف.
        */
        const existingByStudent =
          await adminDb
            .collection(
              "studentWorks"
            )
            .where(
              "studentId",
              "==",
              studentId
            )
            .get();

        const matchingOldWork =
          existingByStudent.docs.find(
            (
              workDocument
            ) => {
              const workData =
                workDocument.data();

              const existingFileUrl =
                typeof workData.fileUrl ===
                "string"
                  ? workData.fileUrl.trim()
                  : "";

              const existingImageUrl =
                typeof workData.imageUrl ===
                "string"
                  ? workData.imageUrl.trim()
                  : "";

              return (
                existingFileUrl ===
                  solutionUrl ||
                existingImageUrl ===
                  solutionUrl
              );
            }
          );

        if (matchingOldWork) {
          const oldWorkData =
            matchingOldWork.data();

          const alreadyPublished =
            oldWorkData.status ===
              "approved" &&
            oldWorkData
              .publishedToGallery ===
              true;

          /*
            العمل موجود أصلًا.

            لا ننشئ نسخة ثانية،
            وإنما نحوله إلى عمل
            معتمد ومنشور في المعرض.
          */
          await matchingOldWork.ref.set(
            {
              studentName,
              studentId,

              classroom,

              type:
                typeof oldWorkData.type ===
                  "string" &&
                oldWorkData.type.trim()
                  ? oldWorkData.type
                  : "واجب إبداعي",

              fileUrl:
                solutionUrl,

              status:
                "approved",

              publishedToGallery:
                true,

              published:
                true,

              teacherApproved:
                true,

              autoApproved:
                true,

              source:
                "teacher-approved-creative-homework",

              sourceCompletionId:
                completionId,

              approvedAt:
                oldWorkData
                  .approvedAt ||
                FieldValue
                  .serverTimestamp(),

              publishedAt:
                oldWorkData
                  .publishedAt ||
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          if (alreadyPublished) {
            alreadyExists += 1;
          } else {
            updatedExisting += 1;
          }

          continue;
        }

        /*
          نحاول الحصول على عنوان
          الواجب الأصلي.
        */
        let homeworkTitle =
          "واجب إبداعي";

        const homeworkId =
          typeof data.homeworkId ===
          "string"
            ? data.homeworkId.trim()
            : "";

        if (homeworkId) {
          try {
            const homeworkSnapshot =
              await adminDb
                .collection(
                  "homeworks"
                )
                .doc(
                  homeworkId
                )
                .get();

            if (
              homeworkSnapshot.exists
            ) {
              const homeworkData =
                homeworkSnapshot.data();

              if (
                typeof homeworkData
                  ?.title ===
                  "string" &&
                homeworkData.title
                  .trim()
              ) {
                homeworkTitle =
                  homeworkData.title
                    .trim();
              }
            }
          } catch (
            homeworkError
          ) {
            console.warn(
              "تعذر تحميل عنوان الواجب:",
              homeworkId,
              homeworkError
            );
          }
        }

        /*
          إنشاء عمل جديد فقط
          إذا لم نجد نسخة موجودة.

          مهم جدًا:
          لا يوجد هنا أي تعديل
          على نقاط الطالب.
        */
        await adminDb
          .collection(
            "studentWorks"
          )
          .add({
            studentName,

            studentId,

            classroom,

            title:
              homeworkTitle,

            type:
              "واجب إبداعي",

            fileUrl:
              solutionUrl,

            consent:
              "نعم",

            status:
              "approved",

            note:
              "تمت مزامنته تلقائيًا من واجب إبداعي سبق اعتماده",

            source:
              "teacher-approved-creative-homework",

            sourceCompletionId:
              completionId,

            autoApproved:
              true,

            teacherApproved:
              true,

            publishedToGallery:
              true,

            published:
              true,

            approvedAt:
              FieldValue
                .serverTimestamp(),

            publishedAt:
              FieldValue
                .serverTimestamp(),

            createdAt:
              FieldValue
                .serverTimestamp(),

            updatedAt:
              FieldValue
                .serverTimestamp(),
          });

        published += 1;
      } catch (
        itemError
      ) {
        console.error(
          "CREATIVE SYNC ITEM ERROR:",
          completionDocument.id,
          itemError
        );

        failed += 1;
      }
    }

    const changedCount =
      published +
      updatedExisting;

    return NextResponse.json(
      {
        success: true,

        checked,

        creativeFound,

        published,

        updatedExisting,

        alreadyExists,

        skippedNotCreative,

        skippedNoImage,

        skippedNoStudent,

        failed,

        message:
          changedCount > 0
            ? `تمت مزامنة الأعمال الإبداعية بنجاح ✅
أعمال جديدة أضيفت للمعرض: ${published}
أعمال موجودة تم إصلاح نشرها: ${updatedExisting}`
            : creativeFound === 0
              ? "لم يتم العثور على سجلات واجبات إبداعية داخل homeworkCompletions."
              : "جميع الأعمال الإبداعية التي تحتوي على مرفقات موجودة ومنشورة في المعرض بالفعل ✅",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "SYNC CREATIVE SUBMISSIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "تعذر مزامنة الواجبات الإبداعية مع المعرض.",
      },
      {
        status: 500,
      }
    );
  }
}