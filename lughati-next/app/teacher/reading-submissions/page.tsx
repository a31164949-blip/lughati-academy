"use client";

import { useEffect, useState } from "react";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type ReadingSubmission = {
  id: string;
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  audioUrl?: string;
  durationSeconds?: number;
  readingDate?: string;
  status?: string;
};

export default function ReadingSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ReadingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState("");

  async function fetchSubmissions() {
    const q = query(
      collection(db, "reading-submissions"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const rows = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as ReadingSubmission[];

    /*
     * القراءات الجديدة تحفظ studentClassroom مباشرة.
     * للقراءات القديمة فقط التي لا تحتوي على الفصل،
     * نجلب فصل الطالب من students.
     *
     * نستخدم معرفات فريدة حتى لا تتكرر قراءة
     * مستند الطالب إذا كان لديه أكثر من تسجيل قديم.
     */
    const missingClassroomStudentIds =
      Array.from(
        new Set(
          rows
            .filter(
              (item) =>
                !item.studentClassroom?.trim() &&
                Boolean(item.studentId?.trim())
            )
            .map(
              (item) =>
                item.studentId!.trim()
            )
        )
      );

    if (
      missingClassroomStudentIds.length === 0
    ) {
      return rows;
    }

    const classroomEntries =
      await Promise.all(
        missingClassroomStudentIds.map(
          async (studentId) => {
            try {
              const studentSnapshot =
                await getDoc(
                  doc(
                    db,
                    "students",
                    studentId
                  )
                );

              if (
                !studentSnapshot.exists()
              ) {
                return [
                  studentId,
                  "",
                ] as const;
              }

              const studentData =
                studentSnapshot.data();

              const classroom =
                typeof studentData.classroom ===
                "string"
                  ? studentData.classroom.trim()
                  : "";

              return [
                studentId,
                classroom,
              ] as const;
            } catch (error) {
              console.error(
                `تعذر تحميل فصل الطالب ${studentId}:`,
                error
              );

              return [
                studentId,
                "",
              ] as const;
            }
          }
        )
      );

    const classroomByStudentId =
      new Map<string, string>(
        classroomEntries
      );

    return rows.map(
      (item) => ({
        ...item,

        studentClassroom:
          item.studentClassroom?.trim() ||
          (
            item.studentId
              ? classroomByStudentId.get(
                  item.studentId.trim()
                )
              : ""
          ) ||
          "",
      })
    );
  }

  async function loadSubmissions() {
    try {
      setLoading(true);

      const rows = await fetchSubmissions();

      setSubmissions(rows);
    } catch (error) {
      console.error("فشل تحميل القراءات:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialSubmissions() {
      try {
        const rows = await fetchSubmissions();

        if (active) {
          setSubmissions(rows);
        }
      } catch (error) {
        console.error("فشل تحميل القراءات:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialSubmissions();

    return () => {
      active = false;
    };
  }, []);

  async function grantCompletedReadingCycles(
    studentId: string,
    approvedDates: string[]
  ) {
    const completedCycles =
      Math.floor(
        approvedDates.length / 5
      );

    if (completedCycles < 1) {
      return;
    }

    for (
      let cycleNumber = 1;
      cycleNumber <= completedCycles;
      cycleNumber += 1
    ) {
      const rewardId =
        `${studentId}_reading-journey-cycle-${cycleNumber}`;

      const rewardRef = doc(
        db,
        "readingCycleRewards",
        rewardId
      );

      const studentRef = doc(
        db,
        "students",
        studentId
      );

      let rewardGranted = false;

      await runTransaction(
        db,
        async (transaction) => {
          const [
            rewardSnapshot,
            studentSnapshot,
          ] = await Promise.all([
            transaction.get(rewardRef),
            transaction.get(studentRef),
          ]);

          if (
            rewardSnapshot.exists()
          ) {
            return;
          }

          if (
            !studentSnapshot.exists()
          ) {
            throw new Error(
              "تعذر العثور على سجل الطالب."
            );
          }

          const rewardDate =
            new Intl.DateTimeFormat(
              "en-CA",
              {
                timeZone:
                  "Asia/Riyadh",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }
            ).format(
              new Date()
            );

          transaction.set(
            rewardRef,
            {
              studentId,
              cycleNumber,
              requiredApprovedReadings:
                5,
              points: 50,
              source:
                "reading-journey",
              approvedReadingCount:
                approvedDates.length,
              createdAt:
                serverTimestamp(),
            }
          );

          transaction.update(
            studentRef,
            {
              points:
                increment(50),

              pointsHistory:
                arrayUnion({
                  reason:
                    "مكافأة إكمال 5 قراءات معتمدة في رحلة القراءة",
                  points: 50,
                  stars: 0,
                  category:
                    "القراءة",
                  cycleNumber,
                  date:
                    rewardDate,
                  createdAt:
                    new Date(),
                }),

              updatedAt:
                serverTimestamp(),
            }
          );

          rewardGranted = true;
        }
      );

      if (rewardGranted) {
        await setDoc(
          doc(
            db,
            "studentNotifications",
            `reading-cycle-reward-${studentId}-${cycleNumber}`
          ),
          {
            studentId,

            title:
              "🏆 مكافأة رحلة القراءة",

            message:
              "رائع جدًا! أكملت 5 قراءات معتمدة وحصلت على 50 نقطة 🎙️📚✨",

            type:
              "reading-cycle-reward",

            href:
              "/reading-journey",

            read: false,

            points: 50,

            cycleNumber,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }
    }
  }

  async function deleteDuplicateReadings() {
    if (cleaningDuplicates) {
      return;
    }

    const groups = new Map<string, ReadingSubmission[]>();

    for (const submission of submissions) {
      const studentId =
        submission.studentId?.trim() || "";

      const readingDate =
        submission.readingDate?.trim() || "";

      if (!studentId || !readingDate) {
        continue;
      }

      const key =
        `${studentId}__${readingDate}`;

      const currentGroup =
        groups.get(key) || [];

      currentGroup.push(submission);

      groups.set(
        key,
        currentGroup
      );
    }

    const duplicateIds: string[] = [];

    for (const group of groups.values()) {
      if (group.length <= 1) {
        continue;
      }

      const approvedSubmission =
        group.find(
          (item) =>
            item.status === "approved"
        );

      const keeper =
        approvedSubmission || group[0];

      for (const item of group) {
        if (item.id !== keeper.id) {
          duplicateIds.push(item.id);
        }
      }
    }

    if (duplicateIds.length === 0) {
      setCleanupMessage(
        "✅ لا توجد قراءات متكررة حاليًا."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `تم العثور على ${duplicateIds.length} قراءة متكررة.\n\nسيتم الاحتفاظ بقراءة واحدة فقط لكل طالب في كل يوم، مع إعطاء الأولوية للقراءة المعتمدة إن وُجدت.\n\nهل تريد حذف التكرارات الآن؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCleaningDuplicates(true);
      setCleanupMessage(
        "⏳ جارٍ حذف القراءات المتكررة..."
      );

      const batchSize = 10;

      for (
        let index = 0;
        index < duplicateIds.length;
        index += batchSize
      ) {
        const batch =
          duplicateIds.slice(
            index,
            index + batchSize
          );

        await Promise.all(
          batch.map((submissionId) =>
            deleteDoc(
              doc(
                db,
                "reading-submissions",
                submissionId
              )
            )
          )
        );
      }

      setCleanupMessage(
        `✅ تم حذف ${duplicateIds.length} قراءة متكررة بنجاح.`
      );

      await loadSubmissions();
    } catch (error) {
      console.error(
        "فشل حذف القراءات المتكررة:",
        error
      );

      setCleanupMessage(
        "❌ تعذر حذف بعض القراءات المتكررة. حدّث الصفحة وحاول مرة أخرى."
      );
    } finally {
      setCleaningDuplicates(false);
    }
  }

  async function updateStatus(
    submissionId: string,
    status: "approved" | "redo"
  ) {
    try {
      setUpdatingId(submissionId);

      const submission = submissions.find(
        (item) => item.id === submissionId
      );

      await updateDoc(
        doc(db, "reading-submissions", submissionId),
        {
          status,
          reviewedAt: serverTimestamp(),
        }
      );

      if (
        status === "approved" &&
        submission?.studentId
      ) {
        /*
         * تحديث تقدم القراءة
         */
        if (submission.readingDate) {
          const progressRef = doc(
            db,
            "reading-progress",
            submission.studentId
          );

          const progressSnap =
            await getDoc(progressRef);

          const previousDates: string[] =
            progressSnap.exists()
              ? progressSnap.data().approvedDates || []
              : [];

          const alreadyCounted =
            previousDates.includes(
              submission.readingDate
            );

          if (!alreadyCounted) {
            const newDates = [
              ...previousDates,
              submission.readingDate,
            ];

            await setDoc(
              progressRef,
              {
                studentId:
                  submission.studentId,

                studentName:
                  submission.studentName || "",

                studentClassroom:
                  submission.studentClassroom || "",

                approvedDates:
                  newDates,

                totalApprovedDays:
                  newDates.length,

                weeklyProgress:
                  Math.min(
                    newDates.length,
                    5
                  ),

                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            await grantCompletedReadingCycles(
              submission.studentId,
              newDates
            );
          }
        }

        /*
         * 🔔 إشعار اعتماد القراءة
         *
         * معرف ثابت حتى لا يتكرر
         * لنفس تسجيل القراءة.
         */
        await setDoc(
          doc(
            db,
            "studentNotifications",
            `reading-approved-${submissionId}`
          ),
          {
            studentId:
              submission.studentId,

            title:
              "🎙️ تم اعتماد قراءتك",

            message:
              `أحسنت يا ${
                submission.studentName ||
                "بطل لغتي"
              } 🌟 تم اعتماد قراءتك اليومية. استمر في القراءة والتقدم! 📖✨`,

            type:
              "reading-approved",

            homeworkId: "",

            href:
              "/reading-journey",

            read: false,

            readingSubmissionId:
              submissionId,

            readingDate:
              submission.readingDate || "",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }

      if (
        status === "redo" &&
        submission?.studentId
      ) {
        await setDoc(
          doc(
            db,
            "studentNotifications",
            `reading-redo-${submissionId}`
          ),
          {
            studentId:
              submission.studentId,

            title:
              "🔄 أعد تسجيل قراءتك",

            message:
              `يا ${
                submission.studentName ||
                "بطل لغتي"
              }، يحتاج تسجيل قراءتك إلى إعادة. استمع جيدًا ثم سجّل القراءة مرة أخرى بثقة 🌟🎙️`,

            type:
              "reading-redo",

            homeworkId: "",

            href:
              "/reading-journey",

            read: false,

            readingSubmissionId:
              submissionId,

            readingDate:
              submission.readingDate || "",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }

      await loadSubmissions();
    } catch (error) {
      console.error(
        "فشل تحديث حالة القراءة:",
        error
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f7fbf9",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#087f5b",
            color: "white",
            padding: "24px",
            borderRadius: "22px",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
            }}
          >
            🎙️ مراجعة قراءات الطلاب
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
            }}
          >
            استمع إلى قراءة الطالب ثم اعتمدها أو اطلب منه إعادة التسجيل.
          </p>

          <button
            type="button"
            onClick={() =>
              void deleteDuplicateReadings()
            }
            disabled={cleaningDuplicates}
            style={{
              marginTop: "16px",
              border: "1px solid rgba(255,255,255,0.55)",
              borderRadius: "14px",
              padding: "11px 16px",
              background: cleaningDuplicates
                ? "rgba(255,255,255,0.18)"
                : "white",
              color: cleaningDuplicates
                ? "white"
                : "#087f5b",
              fontWeight: 900,
              fontSize: "15px",
              cursor: cleaningDuplicates
                ? "not-allowed"
                : "pointer",
            }}
          >
            {cleaningDuplicates
              ? "⏳ جارٍ تنظيف التكرارات..."
              : "🧹 حذف القراءات المتكررة"}
          </button>
        </div>

        {cleanupMessage && (
          <div
            style={{
              background: "#ffffff",
              padding: "14px 18px",
              borderRadius: "14px",
              textAlign: "center",
              marginBottom: "16px",
              border: "1px solid #d9eee7",
              color: "#163b32",
              fontWeight: 800,
            }}
          >
            {cleanupMessage}
          </div>
        )}

        {loading && (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            جارٍ تحميل القراءات...
          </div>
        )}

        {!loading &&
          submissions.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              لا توجد قراءات مرسلة حتى الآن.
            </div>
          )}

        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {submissions.map(
            (submission) => (
              <div
                key={submission.id}
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "20px",
                  border:
                    "1px solid #d9eee7",
                  boxShadow:
                    "0 6px 18px rgba(0,0,0,0.05)",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    color: "#087f5b",
                  }}
                >
                  👤{" "}
                  {submission.studentName ||
                    "طالب"}
                </h2>

                <div
                  style={{
                    lineHeight: 2,
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <strong>
                      الفصل:
                    </strong>{" "}
                    {submission.studentClassroom ||
                      "غير محدد"}
                  </div>

                  <div>
                    <strong>
                      تاريخ القراءة:
                    </strong>{" "}
                    {submission.readingDate ||
                      "غير محدد"}
                  </div>

                  <div>
                    <strong>
                      مدة التسجيل:
                    </strong>{" "}
                    {submission.durationSeconds ||
                      0}{" "}
                    ثانية
                  </div>

                  <div>
                    <strong>
                      الحالة:
                    </strong>{" "}
                    {submission.status ===
                    "approved"
                      ? "✅ معتمدة"
                      : submission.status ===
                          "redo"
                        ? "🔄 إعادة التسجيل"
                        : "⏳ بانتظار المراجعة"}
                  </div>
                </div>

                {submission.audioUrl && (
                  <audio
                    controls
                    src={
                      submission.audioUrl
                    }
                    style={{
                      width: "100%",
                      marginBottom:
                        "16px",
                    }}
                  />
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      updatingId ===
                      submission.id
                    }
                    onClick={() =>
                      updateStatus(
                        submission.id,
                        "approved"
                      )
                    }
                    style={{
                      border: "none",
                      borderRadius:
                        "14px",
                      padding: "14px",
                      background:
                        "#087f5b",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    ✅ اعتماد القراءة
                  </button>

                  <button
                    type="button"
                    disabled={
                      updatingId ===
                      submission.id
                    }
                    onClick={() =>
                      updateStatus(
                        submission.id,
                        "redo"
                      )
                    }
                    style={{
                      border: "none",
                      borderRadius:
                        "14px",
                      padding: "14px",
                      background:
                        "#fff1f2",
                      color: "#b42318",
                      fontSize: "16px",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    🔄 طلب إعادة التسجيل
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
