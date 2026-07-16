"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const submissions = [
  {
    id: 1,
    studentName: "طالب تجريبي",
    classroom: "الثاني أ",
    title: "عمل تجريبي",
    type: "صورة",
    fileUrl:
      "https://drive.google.com/open?id=1hiv9qTQP62ZgiV_bfRs3K309z7dt00SS",
  },
];

export default function SubmissionsPage() {
  const [status, setStatus] = useState("بانتظار المراجعة");
  const [note, setNote] = useState("");

  useEffect(() => {
    const savedStatus = localStorage.getItem("submission-status-1");
    const savedNote = localStorage.getItem("submission-note-1");

    if (savedStatus) {
      setStatus(savedStatus);
    }

    if (savedNote) {
      setNote(savedNote);
    }
  }, []);

  async function updateStatus(newStatus: string) {
  try {
    const response = await fetch("/api/submissions/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        row: 2,
        status: newStatus,
        note,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "تعذر تحديث حالة العمل");
      return;
    }

    setStatus(newStatus);
    localStorage.setItem("submission-status-1", newStatus);

    alert("تم تحديث حالة العمل في جدول Google Sheets بنجاح");
  } catch {
    alert("تعذر الاتصال بخدمة تحديث الأعمال");
  }
}

  function updateNote(value: string) {
    setNote(value);
    localStorage.setItem("submission-note-1", value);
  }

  function getStatusStyle(): React.CSSProperties {
    if (status === "معتمد") {
      return styles.approvedBadge;
    }

    if (status === "مرفوض") {
      return styles.rejectedBadge;
    }

    return styles.pendingBadge;
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <Link href="/teacher" style={styles.backLink}>
          العودة إلى لوحة المعلم ←
        </Link>

        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>📥</div>

          <div>
            <span style={styles.eyebrow}>لوحة المعلم</span>

            <h1 style={styles.title}>مراجعة أعمال الطلاب</h1>

            <p style={styles.description}>
              راجع الصور والتسجيلات ومقاطع الفيديو، ثم حدّد حالة كل عمل قبل
              نشره في معرض الطلاب.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.statistics}>
        <article style={styles.statCard}>
          <span style={styles.statIcon}>⏳</span>

          <strong style={styles.statNumber}>
            {status === "بانتظار المراجعة" ? 1 : 0}
          </strong>

          <span style={styles.statLabel}>بانتظار المراجعة</span>
        </article>

        <article style={styles.statCard}>
          <span style={styles.statIcon}>✅</span>

          <strong style={styles.statNumber}>
            {status === "معتمد" ? 1 : 0}
          </strong>

          <span style={styles.statLabel}>أعمال معتمدة</span>
        </article>

        <article style={styles.statCard}>
          <span style={styles.statIcon}>🚫</span>

          <strong style={styles.statNumber}>
            {status === "مرفوض" ? 1 : 0}
          </strong>

          <span style={styles.statLabel}>أعمال مرفوضة</span>
        </article>
      </section>

      <section style={styles.toolbar}>
        <div>
          <span style={styles.eyebrow}>الأعمال المستلمة</span>
          <h2 style={styles.sectionTitle}>قائمة المراجعة</h2>
        </div>

        <a
          href="https://docs.google.com/spreadsheets/u/0/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.sheetButton}
        >
          فتح جدول الردود
        </a>
      </section>

      <section style={styles.list}>
        {submissions.map((submission) => (
          <article key={submission.id} style={styles.submissionCard}>
            <div style={styles.filePreview}>
              {submission.type === "صورة" ? "🖼️" : "📄"}
            </div>

            <div style={styles.submissionDetails}>
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.studentClass}>
                    {submission.classroom}
                  </span>

                  <h3 style={styles.studentName}>
                    {submission.studentName}
                  </h3>
                </div>

                <span style={getStatusStyle()}>{status}</span>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}>عنوان العمل</span>
                  <strong>{submission.title}</strong>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}>نوع العمل</span>
                  <strong>{submission.type}</strong>
                </div>
              </div>

              <div style={styles.actions}>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.previewButton}
                >
                  مشاهدة العمل
                </a>

                <button
                  type="button"
                  style={styles.approveButton}
                  onClick={() => updateStatus("معتمد")}
                >
                  موافقة ونشر
                </button>

                <button
                  type="button"
                  style={styles.rejectButton}
                  onClick={() => updateStatus("مرفوض")}
                >
                  رفض
                </button>

                <button
                  type="button"
                  style={styles.pendingButton}
                  onClick={() => updateStatus("بانتظار المراجعة")}
                >
                  إعادة للمراجعة
                </button>
              </div>

              <textarea
                placeholder="اكتب ملاحظة للطالب عند الحاجة..."
                style={styles.notes}
                value={note}
                onChange={(event) => updateNote(event.target.value)}
              />
            </div>
          </article>
        ))}
      </section>

      <section style={styles.privacyNote}>
        <span style={styles.privacyIcon}>🛡️</span>

        <div>
          <strong>خصوصية الطلاب محفوظة</strong>

          <p style={styles.privacyText}>
            لا يظهر أي عمل في معرض الطلاب إلا بعد مراجعته واعتماده من المعلم،
            ولن تُعرض بيانات الطالب الخاصة للزوار.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #eefaf5 0%, #f8fcfa 45%, #ffffff 100%)",
    color: "#173f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1120px",
    margin: "0 auto 24px",
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #dcece5",
    borderRadius: "28px",
    boxShadow: "0 14px 36px rgba(25, 91, 67, 0.08)",
  },

  backLink: {
    display: "inline-block",
    marginBottom: "24px",
    padding: "10px 16px",
    background: "#edf8f3",
    color: "#187a59",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: 700,
  },

  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  headerIcon: {
    width: "86px",
    height: "86px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "24px",
    background: "linear-gradient(135deg, #159568, #31b77f)",
    fontSize: "42px",
    boxShadow: "0 12px 24px rgba(24, 149, 104, 0.22)",
  },

  eyebrow: {
    display: "block",
    marginBottom: "8px",
    color: "#19835f",
    fontWeight: 700,
  },

  title: {
    margin: "0 0 10px",
    fontSize: "38px",
  },

  description: {
    margin: 0,
    color: "#60756c",
    fontSize: "18px",
    lineHeight: 1.8,
  },

  statistics: {
    maxWidth: "1120px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  statCard: {
    padding: "22px",
    display: "grid",
    gap: "7px",
    textAlign: "center",
    background: "#ffffff",
    border: "1px solid #dfece7",
    borderRadius: "22px",
  },

  statIcon: {
    fontSize: "28px",
  },

  statNumber: {
    fontSize: "30px",
    color: "#177a59",
  },

  statLabel: {
    color: "#66776f",
    fontWeight: 700,
  },

  toolbar: {
    maxWidth: "1120px",
    margin: "0 auto 18px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    background: "#ffffff",
    border: "1px solid #dfece7",
    borderRadius: "22px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "27px",
  },

  sheetButton: {
    padding: "13px 20px",
    background: "#188a62",
    color: "#ffffff",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: 700,
  },

  list: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gap: "18px",
  },

  submissionCard: {
    padding: "22px",
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "22px",
    background: "#ffffff",
    border: "1px solid #dfece7",
    borderRadius: "26px",
    boxShadow: "0 12px 30px rgba(30, 91, 69, 0.07)",
  },

  filePreview: {
    minHeight: "170px",
    display: "grid",
    placeItems: "center",
    borderRadius: "20px",
    background: "#eef9f4",
    fontSize: "54px",
  },

  submissionDetails: {
    display: "grid",
    gap: "16px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  studentClass: {
    color: "#228561",
    fontWeight: 700,
  },

  studentName: {
    margin: "7px 0 0",
    fontSize: "25px",
  },

  pendingBadge: {
    padding: "9px 14px",
    background: "#fff5d9",
    color: "#986d00",
    borderRadius: "999px",
    fontWeight: 700,
  },

  approvedBadge: {
    padding: "9px 14px",
    background: "#e5f7ed",
    color: "#19784f",
    borderRadius: "999px",
    fontWeight: 700,
  },

  rejectedBadge: {
    padding: "9px 14px",
    background: "#fff0f0",
    color: "#b44343",
    borderRadius: "999px",
    fontWeight: 700,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  infoBox: {
    padding: "14px",
    display: "grid",
    gap: "5px",
    background: "#f6faf8",
    borderRadius: "15px",
  },

  infoLabel: {
    color: "#718179",
    fontSize: "14px",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  previewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: "13px",
    background: "#e9f3ff",
    color: "#21649b",
    fontWeight: 700,
    textDecoration: "none",
  },

  approveButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "13px",
    background: "#198a62",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  rejectButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "13px",
    background: "#fff0f0",
    color: "#b44343",
    fontWeight: 700,
    cursor: "pointer",
  },

  pendingButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "13px",
    background: "#fff5d9",
    color: "#986d00",
    fontWeight: 700,
    cursor: "pointer",
  },

  notes: {
    minHeight: "90px",
    padding: "14px",
    border: "1px solid #cfe2da",
    borderRadius: "15px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "16px",
  },

  privacyNote: {
    maxWidth: "1120px",
    margin: "22px auto 0",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "#edf8f3",
    border: "1px solid #cee7dc",
    borderRadius: "20px",
  },

  privacyIcon: {
    fontSize: "32px",
  },

  privacyText: {
    margin: "6px 0 0",
    color: "#5e746a",
    lineHeight: 1.7,
  },
};