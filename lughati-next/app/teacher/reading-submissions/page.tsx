"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
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

  async function fetchSubmissions() {
    const q = query(
      collection(db, "reading-submissions"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as ReadingSubmission[];
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

            /*
             * 🎉 مكافأة إكمال
             * خمسة أيام قراءة معتمدة
             */
            if (newDates.length >= 5) {
              const studentRef = doc(
                db,
                "students",
                submission.studentId
              );

              await runTransaction(
                db,
                async (transaction) => {
                  const latestProgressSnap =
                    await transaction.get(
                      progressRef
                    );

                  const rewardAlreadyGranted =
                    latestProgressSnap.exists() &&
                    latestProgressSnap.data()
                      .fiveDayRewardGranted ===
                      true;

                  if (rewardAlreadyGranted) {
                    return;
                  }

                  transaction.set(
                    studentRef,
                    {
                      points:
                        increment(50),

                      updatedAt:
                        serverTimestamp(),
                    },
                    {
                      merge: true,
                    }
                  );

                  transaction.set(
                    progressRef,
                    {
                      fiveDayRewardGranted:
                        true,

                      fiveDayRewardPoints:
                        50,

                      fiveDayRewardGrantedAt:
                        serverTimestamp(),
                    },
                    {
                      merge: true,
                    }
                  );
                }
              );
            }
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
        </div>

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
