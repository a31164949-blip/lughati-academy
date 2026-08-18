"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type WorkStatus =
  | "pending"
  | "approved"
  | "rejected";

type Submission = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  title: string;
  workType:
    | "image"
    | "audio"
    | "video";
  fileUrl: string;
  note: string;
  status: WorkStatus;
  approved: boolean;
  publishedToGallery: boolean;
  createdAt?: {
    toDate?: () => Date;
  } | null;
};

const PENDING_STATUS = "pending";
const APPROVED_STATUS = "approved";
const REJECTED_STATUS = "rejected";

export default function SubmissionsPage() {
  const [
    submissions,
    setSubmissions,
  ] = useState<Submission[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(
    null
  );

  /*
   * تحميل الأعمال مباشرة
   * من Firestore.
   */
  const loadSubmissions =
    useCallback(async () => {
      try {
        setLoading(true);
        setLoadError("");

        const submissionsQuery =
          query(
            collection(
              db,
              "studentWorks"
            ),
            orderBy(
              "createdAt",
              "desc"
            )
          );

        const snapshot =
          await getDocs(
            submissionsQuery
          );

        const loaded: Submission[] =
          snapshot.docs.map(
            (document) => {
              const data =
                document.data();

              const rawStatus =
                typeof data.status ===
                  "string"
                  ? data.status
                  : PENDING_STATUS;

              let status: WorkStatus =
                PENDING_STATUS;

              if (
                rawStatus ===
                APPROVED_STATUS
              ) {
                status =
                  APPROVED_STATUS;
              } else if (
                rawStatus ===
                REJECTED_STATUS
              ) {
                status =
                  REJECTED_STATUS;
              }

              const rawWorkType =
                typeof data.workType ===
                  "string"
                  ? data.workType
                  : "image";

              let workType:
                | "image"
                | "audio"
                | "video" =
                "image";

              if (
                rawWorkType ===
                "audio"
              ) {
                workType =
                  "audio";
              } else if (
                rawWorkType ===
                "video"
              ) {
                workType =
                  "video";
              }

              return {
                id: document.id,

                studentId:
                  typeof data.studentId ===
                    "string"
                    ? data.studentId
                    : "",

                studentName:
                  typeof data.studentName ===
                    "string"
                    ? data.studentName
                    : "طالب",

                classroom:
                  typeof data.classroom ===
                    "string"
                    ? data.classroom
                    : "",

                title:
                  typeof data.title ===
                    "string"
                    ? data.title
                    : "عمل بلا عنوان",

                workType,

                fileUrl:
                  typeof data.fileUrl ===
                    "string"
                    ? data.fileUrl
                    : "",

                note:
                  typeof data.teacherNote ===
                    "string"
                    ? data.teacherNote
                    : typeof data.note ===
                        "string"
                      ? data.note
                      : "",

                status,

                approved:
                  data.approved ===
                  true,

                publishedToGallery:
                  data.publishedToGallery ===
                  true,

                createdAt:
                  data.createdAt ??
                  null,
              };
            }
          );

        setSubmissions(loaded);
      } catch (error) {
        console.error(
          "تعذر تحميل أعمال الطلاب:",
          error
        );

        setSubmissions([]);

        setLoadError(
          "تعذر تحميل أعمال الطلاب من الأكاديمية."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  /*
   * إحصائيات الحالات.
   */
  const counts =
    useMemo(() => {
      return submissions.reduce(
        (
          total,
          submission
        ) => {
          if (
            submission.status ===
            APPROVED_STATUS
          ) {
            total.approved += 1;
          } else if (
            submission.status ===
            REJECTED_STATUS
          ) {
            total.rejected += 1;
          } else {
            total.pending += 1;
          }

          return total;
        },
        {
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      );
    }, [submissions]);

  /*
   * تحديث الملاحظة محليًا
   * أثناء الكتابة.
   */
  function updateLocalNote(
    id: string,
    value: string
  ) {
    setSubmissions(
      (current) =>
        current.map(
          (submission) =>
            submission.id === id
              ? {
                  ...submission,
                  note: value,
                }
              : submission
        )
    );
  }

  /*
   * تحديث حالة العمل
   * داخل Firestore.
   */
  async function updateStatus(
    submissionId: string,
    newStatus: WorkStatus,
    note: string
  ) {
    if (updatingId !== null) {
      return;
    }

    try {
      setUpdatingId(
        submissionId
      );

      const workReference =
        doc(
          db,
          "studentWorks",
          submissionId
        );

      await updateDoc(
        workReference,
        {
          status: newStatus,

          approved:
            newStatus ===
            APPROVED_STATUS,

          teacherNote:
            note.trim(),

          reviewedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          /*
           * عند تغيير حالة العمل
           * يتم إزالته من المعرض.
           * وبعد الاعتماد يمكن
           * للمعلم نشره يدويًا.
           */
          publishedToGallery:
            false,
        }
      );

      setSubmissions(
        (current) =>
          current.map(
            (submission) =>
              submission.id ===
              submissionId
                ? {
                    ...submission,
                    status:
                      newStatus,

                    approved:
                      newStatus ===
                      APPROVED_STATUS,

                    publishedToGallery:
                      false,

                    note,
                  }
                : submission
          )
      );

      if (
        newStatus ===
        APPROVED_STATUS
      ) {
        alert(
          "✅ تم اعتماد عمل الطالب بنجاح."
        );
      } else if (
        newStatus ===
        REJECTED_STATUS
      ) {
        alert(
          "🚫 تم رفض العمل."
        );
      } else {
        alert(
          "⏳ تمت إعادة العمل إلى قائمة المراجعة."
        );
      }
    } catch (error) {
      console.error(
        "تعذر تحديث العمل:",
        error
      );

      alert(
        "تعذر تحديث حالة العمل. حاول مرة أخرى."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * حفظ ملاحظة المعلم
   * بدون تغيير الحالة.
   */
  async function saveTeacherNote(
    submissionId: string,
    note: string
  ) {
    if (updatingId !== null) {
      return;
    }

    try {
      setUpdatingId(
        submissionId
      );

      await updateDoc(
        doc(
          db,
          "studentWorks",
          submissionId
        ),
        {
          teacherNote:
            note.trim(),

          updatedAt:
            serverTimestamp(),
        }
      );

      alert(
        "💬 تم حفظ ملاحظة المعلم."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ الملاحظة:",
        error
      );

      alert(
        "تعذر حفظ الملاحظة."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * نشر العمل المعتمد
   * في معرض الطلاب.
   */
  async function publishToGallery(
    submissionId: string
  ) {
    if (updatingId !== null) {
      return;
    }

    const targetSubmission =
      submissions.find(
        (submission) =>
          submission.id ===
          submissionId
      );

    if (
      !targetSubmission ||
      targetSubmission.status !==
        APPROVED_STATUS
    ) {
      alert(
        "يجب اعتماد العمل أولًا قبل نشره في المعرض."
      );

      return;
    }

    try {
      setUpdatingId(
        submissionId
      );

      await updateDoc(
        doc(
          db,
          "studentWorks",
          submissionId
        ),
        {
          publishedToGallery:
            true,

          publishedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setSubmissions(
        (current) =>
          current.map(
            (submission) =>
              submission.id ===
              submissionId
                ? {
                    ...submission,
                    publishedToGallery:
                      true,
                  }
                : submission
          )
      );

      alert(
        "🌟 تم نشر العمل في معرض الطلاب بنجاح."
      );
    } catch (error) {
      console.error(
        "تعذر نشر العمل في المعرض:",
        error
      );

      alert(
        "تعذر نشر العمل في المعرض. حاول مرة أخرى."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusLabel(
    status: WorkStatus
  ) {
    if (
      status === APPROVED_STATUS
    ) {
      return "معتمد";
    }

    if (
      status === REJECTED_STATUS
    ) {
      return "مرفوض";
    }

    return "بانتظار المراجعة";
  }

  function getStatusStyle(
    status: WorkStatus
  ): React.CSSProperties {
    if (
      status === APPROVED_STATUS
    ) {
      return styles.approvedBadge;
    }

    if (
      status === REJECTED_STATUS
    ) {
      return styles.rejectedBadge;
    }

    return styles.pendingBadge;
  }

  function getWorkTypeLabel(
    workType:
      | "image"
      | "audio"
      | "video"
  ) {
    if (
      workType === "audio"
    ) {
      return "تسجيل صوتي";
    }

    if (
      workType === "video"
    ) {
      return "فيديو";
    }

    return "صورة";
  }

  function getWorkIcon(
    workType:
      | "image"
      | "audio"
      | "video"
  ) {
    if (
      workType === "audio"
    ) {
      return "🎙️";
    }

    if (
      workType ===
      "video"
    ) {
      return "🎬";
    }

    return "🖼️";
  }

  function formatDate(
    createdAt:
      | Submission["createdAt"]
      | undefined
  ) {
    try {
      if (
        !createdAt?.toDate
      ) {
        return "";
      }

      return new Intl.DateTimeFormat(
        "ar-SA",
        {
          dateStyle:
            "medium",

          timeStyle:
            "short",

          timeZone:
            "Asia/Riyadh",
        }
      ).format(
        createdAt.toDate()
      );
    } catch {
      return "";
    }
  }

  return (
    <main
      dir="rtl"
      style={styles.page}
    >
      {/* الرأس */}

      <section
        style={styles.header}
      >
        <div
          style={
            styles.headerTop
          }
        >
          <Link
            href="/teacher"
            style={
              styles.backLink
            }
          >
            العودة إلى لوحة المعلم ←
          </Link>

          <button
            type="button"
            onClick={() =>
              void loadSubmissions()
            }
            disabled={loading}
            style={{
              ...styles.refreshButton,

              opacity:
                loading
                  ? 0.65
                  : 1,
            }}
          >
            {loading
              ? "جاري التحديث..."
              : "تحديث القائمة"}
          </button>
        </div>

        <div
          style={
            styles.titleRow
          }
        >
          <div
            style={
              styles.headerIcon
            }
          >
            📥
          </div>

          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              لوحة المعلم
            </p>

            <h1
              style={
                styles.title
              }
            >
              مراجعة أعمال الطلاب
            </h1>

            <p
              style={
                styles.description
              }
            >
              راجع الصور
              والتسجيلات ومقاطع
              الفيديو المرسلة
              مباشرة من أكاديمية
              لغتي، ثم اعتمد العمل
              أو أعده للمراجعة.
            </p>
          </div>
        </div>
      </section>

      {/* الإحصائيات */}

      <section
        style={
          styles.statsGrid
        }
      >
        <article
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statIcon
            }
          >
            ⏳
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            {counts.pending}
          </strong>

          <span
            style={
              styles.statLabel
            }
          >
            بانتظار المراجعة
          </span>
        </article>

        <article
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statIcon
            }
          >
            ✅
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            {counts.approved}
          </strong>

          <span
            style={
              styles.statLabel
            }
          >
            أعمال معتمدة
          </span>
        </article>

        <article
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statIcon
            }
          >
            🚫
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            {counts.rejected}
          </strong>

          <span
            style={
              styles.statLabel
            }
          >
            أعمال مرفوضة
          </span>
        </article>
      </section>

      {/* عنوان القائمة */}

      <section
        style={
          styles.listHeader
        }
      >
        <div>
          <p
            style={
              styles.eyebrow
            }
          >
            الأعمال المستلمة
          </p>

          <h2
            style={
              styles.sectionTitle
            }
          >
            قائمة المراجعة
          </h2>
        </div>

        <div
          style={
            styles.sourceBadge
          }
        >
          🔥 مباشرة من الأكاديمية
        </div>
      </section>

      {/* التحميل */}

      {loading && (
        <section
          style={
            styles.messageCard
          }
        >
          <span
            style={
              styles.loadingIcon
            }
          >
            ⏳
          </span>

          <h3
            style={
              styles.messageTitle
            }
          >
            جاري تحميل الأعمال...
          </h3>

          <p
            style={
              styles.messageText
            }
          >
            يتم الآن قراءة أعمال
            الطلاب من أكاديمية
            لغتي.
          </p>
        </section>
      )}

      {/* الخطأ */}

      {!loading &&
        loadError && (
          <section
            style={
              styles.errorCard
            }
          >
            <h3
              style={
                styles.errorTitle
              }
            >
              تعذر تحميل الأعمال
            </h3>

            <p
              style={
                styles.errorText
              }
            >
              {loadError}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadSubmissions()
              }
              style={
                styles.retryButton
              }
            >
              إعادة المحاولة
            </button>
          </section>
        )}

      {/* لا توجد أعمال */}

      {!loading &&
        !loadError &&
        submissions.length ===
          0 && (
          <section
            style={
              styles.messageCard
            }
          >
            <span
              style={
                styles.loadingIcon
              }
            >
              📭
            </span>

            <h3
              style={
                styles.messageTitle
              }
            >
              لا توجد أعمال حاليًا
            </h3>

            <p
              style={
                styles.messageText
              }
            >
              ستظهر هنا أعمال
              الطلاب فور إرسالها
              من صفحة «ارفع عملي»
              داخل الأكاديمية.
            </p>
          </section>
        )}

      {/* قائمة الأعمال */}

      {!loading &&
        !loadError &&
        submissions.length >
          0 && (
          <section
            style={
              styles.submissionsList
            }
          >
            {submissions.map(
              (
                submission
              ) => {
                const isUpdating =
                  updatingId ===
                  submission.id;

                return (
                  <article
                    key={
                      submission.id
                    }
                    style={
                      styles.submissionCard
                    }
                  >
                    {/* المعاينة */}

                    <div
                      style={
                        styles.previewBox
                      }
                    >
                      {submission.workType ===
                        "image" &&
                      submission.fileUrl ? (
                        <img
                          src={
                            submission.fileUrl
                          }
                          alt={
                            submission.title
                          }
                          style={
                            styles.previewImage
                          }
                        />
                      ) : (
                        <span
                          style={
                            styles.previewIcon
                          }
                        >
                          {getWorkIcon(
                            submission.workType
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      style={
                        styles.submissionContent
                      }
                    >
                      <div
                        style={
                          styles.submissionTop
                        }
                      >
                        <div>
                          <p
                            style={
                              styles.classroom
                            }
                          >
                            {submission.classroom ||
                              "الفصل غير محدد"}
                          </p>

                          <h3
                            style={
                              styles.studentName
                            }
                          >
                            {submission.studentName ||
                              "طالب"}
                          </h3>

                          {formatDate(
                            submission.createdAt
                          ) && (
                            <p
                              style={
                                styles.timestamp
                              }
                            >
                              تاريخ الإرسال:{" "}
                              {formatDate(
                                submission.createdAt
                              )}
                            </p>
                          )}
                        </div>

                        <div
                          style={
                            styles.badgesArea
                          }
                        >
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...getStatusStyle(
                                submission.status
                              ),
                            }}
                          >
                            {getStatusLabel(
                              submission.status
                            )}
                          </span>

                          {submission.publishedToGallery && (
                            <span
                              style={
                                styles.publishedBadge
                              }
                            >
                              🌟 منشور في المعرض
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={
                          styles.infoGrid
                        }
                      >
                        <div
                          style={
                            styles.infoBox
                          }
                        >
                          <span
                            style={
                              styles.infoLabel
                            }
                          >
                            عنوان العمل
                          </span>

                          <strong
                            style={
                              styles.infoValue
                            }
                          >
                            {submission.title ||
                              "عمل بلا عنوان"}
                          </strong>
                        </div>

                        <div
                          style={
                            styles.infoBox
                          }
                        >
                          <span
                            style={
                              styles.infoLabel
                            }
                          >
                            نوع العمل
                          </span>

                          <strong
                            style={
                              styles.infoValue
                            }
                          >
                            {getWorkTypeLabel(
                              submission.workType
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* عمل الطالب */}

                      {submission.fileUrl && (
                        <div
                          style={
                            styles.mediaArea
                          }
                        >
                          {submission.workType ===
                            "audio" && (
                            <audio
                              src={
                                submission.fileUrl
                              }
                              controls
                              style={{
                                width:
                                  "100%",
                              }}
                            />
                          )}

                          {submission.workType ===
                            "video" && (
                            <video
                              src={
                                submission.fileUrl
                              }
                              controls
                              style={
                                styles.videoPreview
                              }
                            />
                          )}
                        </div>
                      )}

                      {/* الأزرار */}

                      <div
                        style={
                          styles.actions
                        }
                      >
                        {submission.fileUrl ? (
                          <a
                            href={
                              submission.fileUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={
                              styles.previewButton
                            }
                          >
                            مشاهدة العمل
                          </a>
                        ) : (
                          <span
                            style={
                              styles.disabledPreviewButton
                            }
                          >
                            لا يوجد رابط للعمل
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            void updateStatus(
                              submission.id,
                              APPROVED_STATUS,
                              submission.note
                            )
                          }
                          style={{
                            ...styles.approveButton,

                            opacity:
                              isUpdating
                                ? 0.6
                                : 1,
                          }}
                        >
                          {isUpdating
                            ? "جاري الحفظ..."
                            : "✅ اعتماد"}
                        </button>

                        {submission.status ===
                          APPROVED_STATUS &&
                          !submission.publishedToGallery && (
                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                void publishToGallery(
                                  submission.id
                                )
                              }
                              style={{
                                ...styles.publishButton,

                                opacity:
                                  isUpdating
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              {isUpdating
                                ? "جاري النشر..."
                                : "🌟 نشر في المعرض"}
                            </button>
                          )}

                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            void updateStatus(
                              submission.id,
                              REJECTED_STATUS,
                              submission.note
                            )
                          }
                          style={{
                            ...styles.rejectButton,

                            opacity:
                              isUpdating
                                ? 0.6
                                : 1,
                          }}
                        >
                          🚫 رفض
                        </button>

                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            void updateStatus(
                              submission.id,
                              PENDING_STATUS,
                              submission.note
                            )
                          }
                          style={{
                            ...styles.pendingButton,

                            opacity:
                              isUpdating
                                ? 0.6
                                : 1,
                          }}
                        >
                          ↩️ إعادة للمراجعة
                        </button>
                      </div>

                      {/* الملاحظة */}

                      <textarea
                        value={
                          submission.note
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalNote(
                            submission.id,
                            event.target.value
                          )
                        }
                        placeholder="اكتب ملاحظة للطالب عند الحاجة..."
                        style={
                          styles.notes
                        }
                      />

                      <button
                        type="button"
                        disabled={
                          isUpdating
                        }
                        onClick={() =>
                          void saveTeacherNote(
                            submission.id,
                            submission.note
                          )
                        }
                        style={
                          styles.saveNoteButton
                        }
                      >
                        💬 حفظ الملاحظة
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}

      {/* الخصوصية */}

      <section
        style={
          styles.privacyNote
        }
      >
        <span
          style={
            styles.privacyIcon
          }
        >
          🛡️
        </span>

        <div>
          <strong>
            خصوصية الطلاب محفوظة
          </strong>

          <p
            style={
              styles.privacyText
            }
          >
            لا يظهر أي عمل في
            معرض الطلاب تلقائيًا.
            تتم مراجعة العمل أولًا
            واعتماده من المعلم،
            ثم يختار المعلم بنفسه
            الأعمال المناسبة
            للنشر في المعرض.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: "30px",

    background:
      "linear-gradient(180deg, #eefaf5 0%, #f8fcfa 55%, #ffffff 100%)",

    color: "#173f32",

    fontFamily:
      "Arial, sans-serif",
  },

  header: {
    maxWidth: "1120px",
    margin: "0 auto 30px",
    padding: "34px",
    background: "#ffffff",
    border:
      "1px solid #d7ebe3",
    borderRadius: "30px",

    boxShadow:
      "0 15px 40px rgba(20, 103, 78, 0.08)",
  },

  headerTop: {
    display: "flex",
    alignItems: "center",

    justifyContent:
      "space-between",

    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "28px",
  },

  backLink: {
    display: "inline-block",

    padding:
      "14px 20px",

    borderRadius:
      "16px",

    background:
      "#edf8f3",

    color:
      "#177d5e",

    fontWeight:
      700,

    textDecoration:
      "none",
  },

  refreshButton: {
    padding:
      "13px 18px",

    border:
      "1px solid #bfe2d4",

    borderRadius:
      "14px",

    background:
      "#ffffff",

    color:
      "#177d5e",

    fontSize:
      "15px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  titleRow: {
    display: "flex",

    alignItems:
      "center",

    gap: "24px",

    flexWrap:
      "wrap",
  },

  headerIcon: {
    display: "grid",

    placeItems:
      "center",

    width:
      "108px",

    height:
      "108px",

    borderRadius:
      "30px",

    background:
      "#21ae7d",

    fontSize:
      "48px",
  },

  eyebrow: {
    margin:
      "0 0 8px",

    color:
      "#178667",

    fontSize:
      "16px",

    fontWeight:
      700,
  },

  title: {
    margin:
      "0 0 14px",

    fontSize:
      "clamp(34px, 6vw, 54px)",

    fontWeight:
      800,

    color:
      "#154c3b",
  },

  description: {
    margin:
      0,

    color:
      "#5b776d",

    fontSize:
      "18px",

    lineHeight:
      1.8,
  },

  statsGrid: {
    maxWidth:
      "1120px",

    margin:
      "0 auto 30px",

    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",

    gap:
      "20px",
  },

  statCard: {
    minHeight:
      "170px",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "24px",

    borderRadius:
      "26px",

    background:
      "#ffffff",

    border:
      "1px solid #d7ebe3",

    textAlign:
      "center",
  },

  statIcon: {
    fontSize:
      "36px",

    marginBottom:
      "10px",
  },

  statNumber: {
    fontSize:
      "42px",

    color:
      "#188564",
  },

  statLabel: {
    marginTop:
      "8px",

    color:
      "#657d74",

    fontSize:
      "17px",

    fontWeight:
      700,
  },

  listHeader: {
    maxWidth:
      "1120px",

    margin:
      "0 auto 24px",

    padding:
      "26px 30px",

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    flexWrap:
      "wrap",

    gap:
      "20px",

    background:
      "#ffffff",

    borderRadius:
      "24px",

    border:
      "1px solid #d7ebe3",
  },

  sectionTitle: {
    margin:
      0,

    color:
      "#174c3b",

    fontSize:
      "30px",
  },

  sourceBadge: {
    padding:
      "12px 16px",

    borderRadius:
      "999px",

    background:
      "#e7f8f0",

    color:
      "#16805e",

    fontWeight:
      800,
  },

  submissionsList: {
    maxWidth:
      "1120px",

    margin:
      "0 auto",

    display:
      "grid",

    gap:
      "24px",
  },

  submissionCard: {
    display:
      "grid",

    gridTemplateColumns:
      "minmax(130px, 180px) 1fr",

    gap:
      "24px",

    padding:
      "28px",

    background:
      "#ffffff",

    border:
      "1px solid #d7ebe3",

    borderRadius:
      "28px",

    boxShadow:
      "0 12px 30px rgba(19, 98, 73, 0.06)",
  },

  previewBox: {
    minHeight:
      "220px",

    display:
      "grid",

    placeItems:
      "center",

    borderRadius:
      "24px",

    background:
      "#edf9f4",

    overflow:
      "hidden",
  },

  previewIcon: {
    fontSize:
      "58px",
  },

  previewImage: {
    width:
      "100%",

    height:
      "100%",

    minHeight:
      "220px",

    objectFit:
      "cover",
  },

  submissionContent: {
    minWidth:
      0,
  },

  submissionTop: {
    display:
      "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    flexWrap:
      "wrap",

    gap:
      "16px",

    marginBottom:
      "22px",
  },

  badgesArea: {
    display:
      "flex",

    alignItems:
      "center",

    flexWrap:
      "wrap",

    gap:
      "10px",
  },

  classroom: {
    margin:
      "0 0 8px",

    color:
      "#168a68",

    fontWeight:
      700,
  },

  studentName: {
    margin:
      "0 0 7px",

    fontSize:
      "30px",

    color:
      "#174c3b",
  },

  timestamp: {
    margin:
      0,

    color:
      "#80928b",

    fontSize:
      "14px",
  },

  statusBadge: {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      "110px",

    padding:
      "12px 16px",

    borderRadius:
      "999px",

    fontWeight:
      700,
  },

  approvedBadge: {
    background:
      "#dff6eb",

    color:
      "#137a58",
  },

  rejectedBadge: {
    background:
      "#ffe8e8",

    color:
      "#bc4545",
  },

  pendingBadge: {
    background:
      "#fff1c9",

    color:
      "#986b00",
  },

  publishedBadge: {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "12px 16px",

    borderRadius:
      "999px",

    background:
      "#fff6ce",

    color:
      "#7b5c00",

    border:
      "1px solid #efd16e",

    fontWeight:
      800,
  },

  infoGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",

    gap:
      "14px",

    marginBottom:
      "16px",
  },

  infoBox: {
    padding:
      "18px",

    borderRadius:
      "18px",

    background:
      "#f4faf7",
  },

  infoLabel: {
    display:
      "block",

    marginBottom:
      "8px",

    color:
      "#84958f",

    fontSize:
      "14px",
  },

  infoValue: {
    color:
      "#174c3b",

    fontSize:
      "17px",
  },

  mediaArea: {
    marginBottom:
      "18px",
  },

  videoPreview: {
    display:
      "block",

    width:
      "100%",

    maxHeight:
      "420px",

    borderRadius:
      "18px",

    background:
      "#000000",
  },

  actions: {
    display:
      "flex",

    alignItems:
      "center",

    flexWrap:
      "wrap",

    gap:
      "12px",

    marginBottom:
      "20px",
  },

  previewButton: {
    padding:
      "14px 20px",

    borderRadius:
      "14px",

    background:
      "#e7f2ff",

    color:
      "#28659d",

    textDecoration:
      "none",

    fontWeight:
      700,
  },

  disabledPreviewButton: {
    padding:
      "14px 20px",

    borderRadius:
      "14px",

    background:
      "#eeeeee",

    color:
      "#8b8b8b",

    fontWeight:
      700,
  },

  approveButton: {
    padding:
      "14px 20px",

    border:
      "none",

    borderRadius:
      "14px",

    background:
      "#168e69",

    color:
      "#ffffff",

    fontSize:
      "15px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  publishButton: {
    padding:
      "14px 20px",

    border:
      "none",

    borderRadius:
      "14px",

    background:
      "#f5c84c",

    color:
      "#664b00",

    fontSize:
      "15px",

    fontWeight:
      800,

    cursor:
      "pointer",
  },

  rejectButton: {
    padding:
      "14px 20px",

    border:
      "none",

    borderRadius:
      "14px",

    background:
      "#fff0f0",

    color:
      "#c44747",

    fontSize:
      "15px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  pendingButton: {
    padding:
      "14px 20px",

    border:
      "none",

    borderRadius:
      "14px",

    background:
      "#fff3cf",

    color:
      "#936900",

    fontSize:
      "15px",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  notes: {
    width:
      "100%",

    minHeight:
      "110px",

    padding:
      "16px",

    border:
      "1px solid #cfe5dc",

    borderRadius:
      "18px",

    resize:
      "vertical",

    boxSizing:
      "border-box",

    fontFamily:
      "inherit",

    fontSize:
      "16px",

    color:
      "#254e40",

    background:
      "#ffffff",
  },

  saveNoteButton: {
    marginTop:
      "10px",

    padding:
      "11px 16px",

    border:
      "none",

    borderRadius:
      "13px",

    background:
      "#edf8f3",

    color:
      "#177d5e",

    fontWeight:
      800,

    cursor:
      "pointer",
  },

  messageCard: {
    maxWidth:
      "1120px",

    margin:
      "0 auto",

    padding:
      "50px 24px",

    borderRadius:
      "26px",

    background:
      "#ffffff",

    border:
      "1px solid #d7ebe3",

    textAlign:
      "center",
  },

  loadingIcon: {
    display:
      "block",

    marginBottom:
      "14px",

    fontSize:
      "44px",
  },

  messageTitle: {
    margin:
      "0 0 10px",

    color:
      "#174c3b",

    fontSize:
      "26px",
  },

  messageText: {
    margin:
      0,

    color:
      "#6d847b",

    lineHeight:
      1.7,
  },

  errorCard: {
    maxWidth:
      "1120px",

    margin:
      "0 auto",

    padding:
      "40px 24px",

    borderRadius:
      "26px",

    background:
      "#fff4f4",

    border:
      "1px solid #ffd7d7",

    textAlign:
      "center",
  },

  errorTitle: {
    margin:
      "0 0 10px",

    color:
      "#b43f3f",
  },

  errorText: {
    color:
      "#835656",
  },

  retryButton: {
    marginTop:
      "12px",

    padding:
      "13px 20px",

    border:
      "none",

    borderRadius:
      "14px",

    background:
      "#b94b4b",

    color:
      "#ffffff",

    fontWeight:
      700,

    cursor:
      "pointer",
  },

  privacyNote: {
    maxWidth:
      "1120px",

    margin:
      "30px auto 0",

    padding:
      "24px",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "18px",

    borderRadius:
      "22px",

    background:
      "#edf8f3",

    border:
      "1px solid #cfe7dd",
  },

  privacyIcon: {
    fontSize:
      "34px",
  },

  privacyText: {
    margin:
      "8px 0 0",

    color:
      "#5e786e",

    lineHeight:
      1.8,
  },
};