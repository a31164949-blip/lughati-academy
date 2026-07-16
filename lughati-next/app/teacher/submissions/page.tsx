"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Submission = {
  id: number;
  row: number;
  timestamp: string;
  studentName: string;
  classroom: string;
  title: string;
  type: string;
  fileUrl: string;
  consent: string;
  status: string;
  note: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  submissions?: Submission[];
};

const PENDING_STATUS = "بانتظار المراجعة";
const APPROVED_STATUS = "معتمد";
const REJECTED_STATUS = "مرفوض";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch("/api/submissions", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        setSubmissions([]);
        setLoadError(result.message || "تعذر جلب أعمال الطلاب");
        return;
      }

      setSubmissions(result.submissions || []);
    } catch {
      setSubmissions([]);
      setLoadError("تعذر الاتصال بخدمة جلب أعمال الطلاب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const counts = useMemo(() => {
    return submissions.reduce(
      (total, submission) => {
        if (submission.status === APPROVED_STATUS) {
          total.approved += 1;
        } else if (submission.status === REJECTED_STATUS) {
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
      },
    );
  }, [submissions]);

  function updateLocalNote(row: number, value: string) {
    setSubmissions((current) =>
      current.map((submission) =>
        submission.row === row
          ? {
              ...submission,
              note: value,
            }
          : submission,
      ),
    );
  }

  async function updateStatus(
    row: number,
    newStatus: string,
    note: string,
  ) {
    if (updatingRow !== null) {
      return;
    }

    try {
      setUpdatingRow(row);

      const response = await fetch("/api/submissions/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row,
          status: newStatus,
          note,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        alert(result.message || "تعذر تحديث حالة العمل");
        return;
      }

      setSubmissions((current) =>
        current.map((submission) =>
          submission.row === row
            ? {
                ...submission,
                status: newStatus,
                note,
              }
            : submission,
        ),
      );

      alert("تم تحديث حالة العمل في جدول Google Sheets بنجاح");
    } catch {
      alert("تعذر الاتصال بخدمة تحديث الأعمال");
    } finally {
      setUpdatingRow(null);
    }
  }

  function getStatusStyle(status: string): React.CSSProperties {
    if (status === APPROVED_STATUS) {
      return styles.approvedBadge;
    }

    if (status === REJECTED_STATUS) {
      return styles.rejectedBadge;
    }

    return styles.pendingBadge;
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div style={styles.headerTop}>
          <Link href="/teacher" style={styles.backLink}>
            العودة إلى لوحة المعلم ←
          </Link>

          <button
            type="button"
            onClick={() => void loadSubmissions()}
            disabled={loading}
            style={{
              ...styles.refreshButton,
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "جاري التحديث..." : "تحديث القائمة"}
          </button>
        </div>

        <div style={styles.titleRow}>
          <div style={styles.headerIcon}>📥</div>

          <div>
            <p style={styles.eyebrow}>لوحة المعلم</p>
            <h1 style={styles.title}>مراجعة أعمال الطلاب</h1>
            <p style={styles.description}>
              راجع الصور والتسجيلات ومقاطع الفيديو، ثم حدّد حالة كل
              عمل قبل نشره في معرض الطلاب.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.statsGrid}>
        <article style={styles.statCard}>
          <span style={styles.statIcon}>⏳</span>
          <strong style={styles.statNumber}>{counts.pending}</strong>
          <span style={styles.statLabel}>بانتظار المراجعة</span>
        </article>

        <article style={styles.statCard}>
          <span style={styles.statIcon}>✅</span>
          <strong style={styles.statNumber}>{counts.approved}</strong>
          <span style={styles.statLabel}>أعمال معتمدة</span>
        </article>

        <article style={styles.statCard}>
          <span style={styles.statIcon}>🚫</span>
          <strong style={styles.statNumber}>{counts.rejected}</strong>
          <span style={styles.statLabel}>أعمال مرفوضة</span>
        </article>
      </section>

      <section style={styles.listHeader}>
        <div>
          <p style={styles.eyebrow}>الأعمال المستلمة</p>
          <h2 style={styles.sectionTitle}>قائمة المراجعة</h2>
        </div>

        <a
          href="https://docs.google.com/spreadsheets/d/1C7ay_YKIyVkNjeg-TNHY0dzbhKA6lsXzhOya6Tpkdwo/edit"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.sheetButton}
        >
          فتح جدول الردود
        </a>
      </section>

      {loading && (
        <section style={styles.messageCard}>
          <span style={styles.loadingIcon}>⏳</span>
          <h3 style={styles.messageTitle}>جاري تحميل الأعمال...</h3>
          <p style={styles.messageText}>
            يتم الآن قراءة الأعمال من جدول Google Sheets.
          </p>
        </section>
      )}

      {!loading && loadError && (
        <section style={styles.errorCard}>
          <h3 style={styles.errorTitle}>تعذر تحميل الأعمال</h3>
          <p style={styles.errorText}>{loadError}</p>

          <button
            type="button"
            onClick={() => void loadSubmissions()}
            style={styles.retryButton}
          >
            إعادة المحاولة
          </button>
        </section>
      )}

      {!loading && !loadError && submissions.length === 0 && (
        <section style={styles.messageCard}>
          <span style={styles.loadingIcon}>📭</span>
          <h3 style={styles.messageTitle}>لا توجد أعمال حاليًا</h3>
          <p style={styles.messageText}>
            ستظهر هنا أعمال الطلاب الجديدة بعد إرسال النموذج.
          </p>
        </section>
      )}

      {!loading && !loadError && submissions.length > 0 && (
        <section style={styles.submissionsList}>
          {submissions.map((submission) => {
            const isUpdating = updatingRow === submission.row;

            return (
              <article key={submission.row} style={styles.submissionCard}>
                <div style={styles.previewBox}>
                  <span style={styles.previewIcon}>
                    {submission.type.includes("فيديو")
                      ? "🎬"
                      : submission.type.includes("صوت")
                        ? "🎙️"
                        : "🖼️"}
                  </span>
                </div>

                <div style={styles.submissionContent}>
                  <div style={styles.submissionTop}>
                    <div>
                      <p style={styles.classroom}>
                        {submission.classroom || "الفصل غير محدد"}
                      </p>

                      <h3 style={styles.studentName}>
                        {submission.studentName || "طالب"}
                      </h3>

                      {submission.timestamp && (
                        <p style={styles.timestamp}>
                          تاريخ الإرسال: {submission.timestamp}
                        </p>
                      )}
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(submission.status),
                      }}
                    >
                      {submission.status || PENDING_STATUS}
                    </span>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>عنوان العمل</span>
                      <strong style={styles.infoValue}>
                        {submission.title || "عمل بلا عنوان"}
                      </strong>
                    </div>

                    <div style={styles.infoBox}>
                      <span style={styles.infoLabel}>نوع العمل</span>
                      <strong style={styles.infoValue}>
                        {submission.type || "ملف"}
                      </strong>
                    </div>
                  </div>

                  {submission.consent && (
                    <div style={styles.consentBox}>
                      <span>🛡️</span>
                      <span>{submission.consent}</span>
                    </div>
                  )}

                  <div style={styles.actions}>
                    {submission.fileUrl ? (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.previewButton}
                      >
                        مشاهدة العمل
                      </a>
                    ) : (
                      <span style={styles.disabledPreviewButton}>
                        لا يوجد رابط للعمل
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        void updateStatus(
                          submission.row,
                          APPROVED_STATUS,
                          submission.note,
                        )
                      }
                      style={{
                        ...styles.approveButton,
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      {isUpdating
                        ? "جاري الحفظ..."
                        : "موافقة ونشر"}
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        void updateStatus(
                          submission.row,
                          REJECTED_STATUS,
                          submission.note,
                        )
                      }
                      style={{
                        ...styles.rejectButton,
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      رفض
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        void updateStatus(
                          submission.row,
                          PENDING_STATUS,
                          submission.note,
                        )
                      }
                      style={{
                        ...styles.pendingButton,
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      إعادة للمراجعة
                    </button>
                  </div>

                  <textarea
                    value={submission.note}
                    onChange={(event) =>
                      updateLocalNote(
                        submission.row,
                        event.target.value,
                      )
                    }
                    placeholder="اكتب ملاحظة للطالب عند الحاجة..."
                    style={styles.notes}
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section style={styles.privacyNote}>
        <span style={styles.privacyIcon}>🛡️</span>

        <div>
          <strong>خصوصية الطلاب محفوظة</strong>
          <p style={styles.privacyText}>
            لا يظهر أي عمل في معرض الطلاب إلا بعد مراجعته واعتماده
            من المعلم، ولن تُعرض بيانات الطالب الخاصة للزوار.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background:
      "linear-gradient(180deg, #eefaf5 0%, #f8fcfa 55%, #ffffff 100%)",
    color: "#173f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1120px",
    margin: "0 auto 30px",
    padding: "34px",
    background: "#ffffff",
    border: "1px solid #d7ebe3",
    borderRadius: "30px",
    boxShadow: "0 15px 40px rgba(20, 103, 78, 0.08)",
  },

  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "28px",
  },

  backLink: {
    display: "inline-block",
    padding: "14px 20px",
    borderRadius: "16px",
    background: "#edf8f3",
    color: "#177d5e",
    fontWeight: 700,
    textDecoration: "none",
  },

  refreshButton: {
    padding: "13px 18px",
    border: "1px solid #bfe2d4",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#177d5e",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
  },

  headerIcon: {
    display: "grid",
    placeItems: "center",
    width: "108px",
    height: "108px",
    borderRadius: "30px",
    background: "#21ae7d",
    fontSize: "48px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#178667",
    fontSize: "16px",
    fontWeight: 700,
  },

  title: {
    margin: "0 0 14px",
    fontSize: "clamp(34px, 6vw, 54px)",
    fontWeight: 800,
    color: "#154c3b",
  },

  description: {
    margin: 0,
    color: "#5b776d",
    fontSize: "18px",
    lineHeight: 1.8,
  },

  statsGrid: {
    maxWidth: "1120px",
    margin: "0 auto 30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "20px",
  },

  statCard: {
    minHeight: "170px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    borderRadius: "26px",
    background: "#ffffff",
    border: "1px solid #d7ebe3",
    textAlign: "center",
  },

  statIcon: {
    fontSize: "36px",
    marginBottom: "10px",
  },

  statNumber: {
    fontSize: "42px",
    color: "#188564",
  },

  statLabel: {
    marginTop: "8px",
    color: "#657d74",
    fontSize: "17px",
    fontWeight: 700,
  },

  listHeader: {
    maxWidth: "1120px",
    margin: "0 auto 24px",
    padding: "26px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #d7ebe3",
  },

  sectionTitle: {
    margin: 0,
    color: "#174c3b",
    fontSize: "30px",
  },

  sheetButton: {
    display: "inline-block",
    padding: "16px 22px",
    borderRadius: "15px",
    background: "#168e69",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
  },

  submissionsList: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },

  submissionCard: {
    display: "grid",
    gridTemplateColumns: "minmax(130px, 180px) 1fr",
    gap: "24px",
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #d7ebe3",
    borderRadius: "28px",
    boxShadow: "0 12px 30px rgba(19, 98, 73, 0.06)",
  },

  previewBox: {
    minHeight: "220px",
    display: "grid",
    placeItems: "center",
    borderRadius: "24px",
    background: "#edf9f4",
  },

  previewIcon: {
    fontSize: "58px",
  },

  submissionContent: {
    minWidth: 0,
  },

  submissionTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "22px",
  },

  classroom: {
    margin: "0 0 8px",
    color: "#168a68",
    fontWeight: 700,
  },

  studentName: {
    margin: "0 0 7px",
    fontSize: "30px",
    color: "#174c3b",
  },

  timestamp: {
    margin: 0,
    color: "#80928b",
    fontSize: "14px",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "110px",
    padding: "12px 16px",
    borderRadius: "999px",
    fontWeight: 700,
  },

  approvedBadge: {
    background: "#dff6eb",
    color: "#137a58",
  },

  rejectedBadge: {
    background: "#ffe8e8",
    color: "#bc4545",
  },

  pendingBadge: {
    background: "#fff1c9",
    color: "#986b00",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "16px",
  },

  infoBox: {
    padding: "18px",
    borderRadius: "18px",
    background: "#f4faf7",
  },

  infoLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#84958f",
    fontSize: "14px",
  },

  infoValue: {
    color: "#174c3b",
    fontSize: "17px",
  },

  consentBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "15px",
    background: "#f7fbf9",
    color: "#5b776d",
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
  },

  previewButton: {
    padding: "14px 20px",
    borderRadius: "14px",
    background: "#e7f2ff",
    color: "#28659d",
    textDecoration: "none",
    fontWeight: 700,
  },

  disabledPreviewButton: {
    padding: "14px 20px",
    borderRadius: "14px",
    background: "#eeeeee",
    color: "#8b8b8b",
    fontWeight: 700,
  },

  approveButton: {
    padding: "14px 20px",
    border: "none",
    borderRadius: "14px",
    background: "#168e69",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  rejectButton: {
    padding: "14px 20px",
    border: "none",
    borderRadius: "14px",
    background: "#fff0f0",
    color: "#c44747",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  pendingButton: {
    padding: "14px 20px",
    border: "none",
    borderRadius: "14px",
    background: "#fff3cf",
    color: "#936900",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  notes: {
    width: "100%",
    minHeight: "110px",
    padding: "16px",
    border: "1px solid #cfe5dc",
    borderRadius: "18px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "16px",
    color: "#254e40",
    background: "#ffffff",
  },

  messageCard: {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "50px 24px",
    borderRadius: "26px",
    background: "#ffffff",
    border: "1px solid #d7ebe3",
    textAlign: "center",
  },

  loadingIcon: {
    display: "block",
    marginBottom: "14px",
    fontSize: "44px",
  },

  messageTitle: {
    margin: "0 0 10px",
    color: "#174c3b",
    fontSize: "26px",
  },

  messageText: {
    margin: 0,
    color: "#6d847b",
    lineHeight: 1.7,
  },

  errorCard: {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "40px 24px",
    borderRadius: "26px",
    background: "#fff4f4",
    border: "1px solid #ffd7d7",
    textAlign: "center",
  },

  errorTitle: {
    margin: "0 0 10px",
    color: "#b43f3f",
  },

  errorText: {
    color: "#835656",
  },

  retryButton: {
    marginTop: "12px",
    padding: "13px 20px",
    border: "none",
    borderRadius: "14px",
    background: "#b94b4b",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  privacyNote: {
    maxWidth: "1120px",
    margin: "30px auto 0",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    borderRadius: "22px",
    background: "#edf8f3",
    border: "1px solid #cfe7dd",
  },

  privacyIcon: {
    fontSize: "34px",
  },

  privacyText: {
    margin: "8px 0 0",
    color: "#5e786e",
    lineHeight: 1.8,
  },
};