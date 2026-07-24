"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../../../firebase";
type Student = {
  studentName?: string;
  className?: string;
  points?: number;
  level?: number;
  goldenIndex?: number;
  attendanceDays?: number;
  absenceDays?: number;
  lateDays?: number;
  attendanceRate?: number;
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPointsBox, setShowPointsBox] = useState(false);
const [pointsToAdd, setPointsToAdd] = useState(5);
const [pointsReason, setPointsReason] = useState("");

  useEffect(() => {
    async function loadStudent() {
      try {
        const studentRef = doc(db, "students", studentId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          setStudent(studentSnap.data() as Student);
        }
      } catch (error) {
        console.error("حدث خطأ أثناء تحميل بيانات الطالب:", error);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return <main style={styles.message}>جاري تحميل ملف الطالب...</main>;
  }

  if (!student) {
    return <main style={styles.message}>لم يتم العثور على بيانات الطالب.</main>;
  }

  const points = student.points ?? 0;
  const level = student.level ?? 1;
  const attendanceRate = student.attendanceRate ?? 100;
const goldenIndex = student.goldenIndex ?? 0;
  return (
    <main style={styles.page} dir="rtl">
      <a href="/teacher/students" style={styles.backButton}>
        ← العودة إلى الطلاب
      </a>

      <section style={styles.profileCard}>
        <div style={styles.avatar}>🧒</div>

        <div style={styles.profileInfo}>
          <p style={styles.smallLabel}>ملف الطالب</p>
          <h1 style={styles.studentName}>
            {student.studentName || "طالب الأكاديمية"}
          </h1>
          <p style={styles.className}>
            {student.className || "الفصل غير محدد"}
          </p>
        </div>

        <div style={styles.goldenIndex}>
          <span style={styles.goldenTitle}>🟢 المؤشر الذهبي</span>
          <strong style={styles.goldenNumber}>{goldenIndex} / 100</strong>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>⭐</span>
          <p style={styles.summaryTitle}>النقاط</p>
          <strong style={styles.summaryValue}>{points}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>🚀</span>
          <p style={styles.summaryTitle}>المستوى</p>
          <strong style={styles.summaryValue}>{level}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>📅</span>
          <p style={styles.summaryTitle}>الانتظام</p>
          <strong style={styles.summaryValue}>{attendanceRate}%</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>🔥</span>
          <p style={styles.summaryTitle}>سلسلة الإنجاز</p>
          <strong style={styles.summaryValue}>7 أيام</strong>
        </div>
      </section>
<section style={styles.quickActionsSection}>
  <div style={styles.quickActionsHeader}>
    <div>
      <p style={styles.quickActionsLabel}>إدارة ملف الطالب</p>
      <h2 style={styles.quickActionsTitle}>⚡ إجراءات سريعة</h2>
    </div>

    <span style={styles.quickActionsHint}>
      اختر الإجراء الذي تريد تسجيله للطالب
    </span>
  </div>

  <div style={styles.quickActionsGrid}>
    <button
  style={styles.actionButton}
  onClick={() => setShowPointsBox(true)}
>
  <span style={styles.actionIcon}>⭐</span>
  <strong>منح نقاط</strong>
  <span style={styles.actionDescription}>إضافة نقاط تحفيزية</span>
</button>

    <button style={styles.actionButton}>
      <span style={styles.actionIcon}>📖</span>
      <strong>تسجيل قراءة</strong>
      <span style={styles.actionDescription}>تقييم قراءة الطالب</span>
    </button>

    <button style={styles.actionButton}>
      <span style={styles.actionIcon}>✍️</span>
      <strong>تسجيل إملاء</strong>
      <span style={styles.actionDescription}>إدخال عدد الأخطاء</span>
    </button>

    <button style={styles.actionButton}>
      <span style={styles.actionIcon}>📅</span>
      <strong>تسجيل حضور</strong>
      <span style={styles.actionDescription}>حضور أو غياب أو تأخر</span>
    </button>

    <button style={styles.actionButton}>
      <span style={styles.actionIcon}>🏅</span>
      <strong>منح وسام</strong>
      <span style={styles.actionDescription}>اختيار وسام جديد</span>
    </button>
  </div>
</section>
{showPointsBox && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalCard}>
      <button
        style={styles.closeButton}
        onClick={() => setShowPointsBox(false)}
      >
        ✕
      </button>

      <div style={styles.modalIcon}>⭐</div>
      <h2 style={styles.modalTitle}>منح نقاط للطالب</h2>

      <p style={styles.modalStudentName}>
        {student.studentName || "طالب الأكاديمية"}
      </p>

      <label style={styles.fieldLabel}>عدد النقاط</label>

      <div style={styles.pointsChoices}>
        {[1, 5, 10].map((value) => (
          <button
            key={value}
            onClick={() => setPointsToAdd(value)}
            style={{
              ...styles.pointsChoice,
              ...(pointsToAdd === value ? styles.pointsChoiceActive : {}),
            }}
          >
            +{value}
          </button>
        ))}
      </div>

      <label style={styles.fieldLabel}>سبب منح النقاط</label>

      <input
        value={pointsReason}
        onChange={(event) => setPointsReason(event.target.value)}
        placeholder="مثال: قراءة متميزة"
        style={styles.reasonInput}
      />

      <button style={styles.savePointsButton}>
        حفظ وإضافة {pointsToAdd} نقاط
      </button>
    </div>
  </div>
)}
      <section style={styles.cardsGrid}>
        <article style={styles.card}>
          <h2 style={styles.cardTitle}>📖 القراءة</h2>

          <div style={styles.badgeActive}>
            <span>👑</span>
            <div>
              <strong>ملك القراءة</strong>
              <p style={styles.badgeText}>للقراءة المتقنة والمتميزة</p>
            </div>
          </div>

          <div style={styles.badge}>
            <span>🦸</span>
            <div>
              <strong>بطل القراءة</strong>
              <p style={styles.badgeText}>للقراءة الجيدة مع أخطاء قليلة</p>
            </div>
          </div>

          <div style={styles.badge}>
            <span>🌟</span>
            <div>
              <strong>نجم القراءة</strong>
              <p style={styles.badgeText}>للطالب الأكثر تطورًا</p>
            </div>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>✍️ الإملاء</h2>

          <div style={styles.badgeActive}>
            <span>👑</span>
            <div>
              <strong>ملك الإملاء</strong>
              <p style={styles.badgeText}>للطالب الذي لا يرتكب أي خطأ</p>
            </div>
          </div>

          <div style={styles.badge}>
            <span>🦸</span>
            <div>
              <strong>بطل الإملاء</strong>
              <p style={styles.badgeText}>لصاحب الأخطاء القليلة</p>
            </div>
          </div>

          <div style={styles.badge}>
            <span>🌟</span>
            <div>
              <strong>نجم الإملاء</strong>
              <p style={styles.badgeText}>للطالب الأكثر تحسنًا</p>
            </div>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>📅 الحضور والانضباط</h2>

          <div style={styles.statsRow}>
            <div style={styles.miniStat}>
              <strong>{student.attendanceDays ?? 0}</strong>
              <span>حضور</span>
            </div>

            <div style={styles.miniStat}>
              <strong>{student.absenceDays ?? 0}</strong>
              <span>غياب</span>
            </div>

            <div style={styles.miniStat}>
              <strong>{student.lateDays ?? 0}</strong>
              <span>تأخر</span>
            </div>
          </div>

          <div style={styles.buttonsRow}>
            <button style={styles.greenButton}>تسجيل حضور</button>
            <button style={styles.redButton}>تسجيل غياب</button>
            <button style={styles.yellowButton}>تسجيل تأخر</button>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>📚 الواجبات</h2>

          <div style={styles.progressItem}>
            <span>الواجبات المنجزة</span>
            <strong>8</strong>
          </div>

          <div style={styles.progressItem}>
            <span>الواجبات المتبقية</span>
            <strong>2</strong>
          </div>

          <div style={styles.progressItem}>
            <span>نسبة الإنجاز</span>
            <strong>80%</strong>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>🎨 مشاركات المعرض</h2>

          <div style={styles.progressItem}>
            <span>الأعمال المنشورة</span>
            <strong>3</strong>
          </div>

          <div style={styles.progressItem}>
            <span>الإعجابات</span>
            <strong>18</strong>
          </div>

          <div style={styles.exhibitionWork}>
            <span style={styles.workIcon}>🖼️</span>
            <div>
              <strong>آخر عمل منشور</strong>
              <p style={styles.badgeText}>لوحة: لغتي الجميلة</p>
            </div>
          </div>

          <button style={styles.exhibitionButton}>
            عرض أعمال الطالب في المعرض
          </button>
        </article>

        <article style={styles.farisCard}>
          <div style={styles.farisAvatar}>🧒🏻</div>
          <div>
            <h2 style={styles.farisTitle}>رسالة من فارس</h2>
            <p style={styles.farisMessage}>
              رائع يا بطل! تقدّمك جميل، واصل القراءة والتدرب على الإملاء لتصل
              إلى التاج القادم.
            </p>
          </div>
        </article>
      </section>

      <section style={styles.timelineSection}>
        <h2 style={styles.sectionTitle}>📜 رحلة الإنجازات</h2>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>🎨</span>
          <div>
            <strong>نُشر عمل جديد في معرض الطلاب</strong>
            <p style={styles.timelineText}>اليوم</p>
          </div>
        </div>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>✍️</span>
          <div>
            <strong>حصل على لقب بطل الإملاء</strong>
            <p style={styles.timelineText}>منذ يومين</p>
          </div>
        </div>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>⭐</span>
          <div>
            <strong>حصل على 10 نقاط جديدة</strong>
            <p style={styles.timelineText}>منذ 3 أيام</p>
          </div>
        </div>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>📖</span>
          <div>
            <strong>أتم قراءة نص جديد</strong>
            <p style={styles.timelineText}>منذ أسبوع</p>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f8f6",
    padding: "24px 16px 50px",
    fontFamily: "Arial, sans-serif",
    color: "#163b32",
  },

  message: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    fontWeight: 700,
    background: "#f3f8f6",
  },

  backButton: {
    display: "inline-block",
    marginBottom: "18px",
    color: "#166534",
    fontWeight: 800,
    textDecoration: "none",
  },

  profileCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #ffffff, #e8f7ef)",
    boxShadow: "0 14px 40px rgba(22, 101, 52, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  avatar: {
    width: "86px",
    height: "86px",
    borderRadius: "50%",
    background: "#dff4e7",
    display: "grid",
    placeItems: "center",
    fontSize: "48px",
    border: "4px solid #ffffff",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
  },

  profileInfo: {
    flex: "1 1 260px",
  },

  smallLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  studentName: {
    margin: "0 0 6px",
    fontSize: "30px",
  },

  className: {
    margin: 0,
    color: "#527064",
    fontWeight: 700,
  },

  goldenIndex: {
    minWidth: "175px",
    padding: "16px",
    borderRadius: "18px",
    background: "#fff8dc",
    textAlign: "center",
    border: "1px solid #f4d35e",
  },

  goldenTitle: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 800,
  },

  goldenNumber: {
    fontSize: "26px",
    color: "#9a6700",
  },

  summaryGrid: {
    maxWidth: "1100px",
    margin: "18px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(15, 61, 50, 0.07)",
  },

  summaryIcon: {
    fontSize: "30px",
  },

  summaryTitle: {
    margin: "7px 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  summaryValue: {
    fontSize: "25px",
  },

  cardsGrid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 8px 26px rgba(15, 61, 50, 0.07)",
  },

  cardTitle: {
    margin: "0 0 16px",
    fontSize: "20px",
  },

  badgeActive: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "13px",
    marginBottom: "10px",
    borderRadius: "15px",
    background: "#fff8d8",
    border: "1px solid #f7d35c",
    fontSize: "23px",
  },

  badge: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "13px",
    marginBottom: "10px",
    borderRadius: "15px",
    background: "#f6faf8",
    border: "1px solid #dcebe4",
    fontSize: "23px",
  },

  badgeText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },

  miniStat: {
    padding: "14px 8px",
    borderRadius: "14px",
    background: "#f4f8f6",
    textAlign: "center",
    display: "grid",
    gap: "5px",
  },

  buttonsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "14px",
  },

  greenButton: {
    flex: 1,
    border: 0,
    borderRadius: "12px",
    padding: "11px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 800,
  },

  redButton: {
    flex: 1,
    border: 0,
    borderRadius: "12px",
    padding: "11px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  },

  yellowButton: {
    flex: 1,
    border: 0,
    borderRadius: "12px",
    padding: "11px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 800,
  },

  progressItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #edf2ef",
  },

  exhibitionWork: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    marginTop: "14px",
    borderRadius: "15px",
    background: "#f7f3ff",
  },

  workIcon: {
    fontSize: "34px",
  },

  exhibitionButton: {
    width: "100%",
    marginTop: "14px",
    border: 0,
    borderRadius: "13px",
    padding: "13px",
    background: "#7c3aed",
    color: "#ffffff",
    fontWeight: 800,
  },

  farisCard: {
    background: "linear-gradient(135deg, #e3f8ea, #ffffff)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 8px 26px rgba(15, 61, 50, 0.07)",
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },

  farisAvatar: {
    fontSize: "56px",
  },

  farisTitle: {
    margin: "0 0 7px",
    fontSize: "20px",
  },

  farisMessage: {
    margin: 0,
    color: "#527064",
    lineHeight: 1.8,
  },

  timelineSection: {
    maxWidth: "1100px",
    margin: "18px auto 0",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 8px 26px rgba(15, 61, 50, 0.07)",
  },

  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "21px",
  },

  timelineItem: {
    display: "flex",
    gap: "13px",
    alignItems: "center",
    padding: "13px 0",
    borderBottom: "1px solid #edf2ef",
  },

  timelineIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#eef8f2",
    display: "grid",
    placeItems: "center",
    fontSize: "21px",
  },

  timelineText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  quickActionsSection: {
  maxWidth: "1100px",
  margin: "18px auto",
  padding: "22px",
borderRadius: "24px",
background: "linear-gradient(135deg, #173f35, #24735e)",
boxShadow: "0 14px 35px rgba(15, 61, 50, 0.16)",
color: "#ffffff",
},
quickActionsHeader: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
},

quickActionsLabel: {
  margin: "0 0 5px",
  color: "#c9f3df",
  fontSize: "13px",
  fontWeight: 700,
},

quickActionsTitle: {
  margin: 0,
  fontSize: "23px",
},

quickActionsHint: {
  color: "#d9eee6",
  fontSize: "13px",
},
quickActionsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
  gap: "12px",
},

actionButton: {
  minHeight: "135px",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "18px",
  padding: "16px 12px",
  background: "rgba(255,255,255,0.1)",
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  fontSize: "16px",
  cursor: "pointer",
},

actionIcon: {
  fontSize: "34px",
},

actionDescription: {
  color: "#d9eee6",
  fontSize: "12px",
  fontWeight: 400,
},
modalOverlay: {
  position: "fixed",
  inset: 0,
  background: "rgba(6, 31, 25, 0.58)",
  display: "grid",
  placeItems: "center",
  padding: "18px",
  zIndex: 1000,
},

modalCard: {
  width: "100%",
  maxWidth: "420px",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  position: "relative",
  textAlign: "center",
  boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
},

closeButton: {
  position: "absolute",
  top: "14px",
  left: "14px",
  width: "36px",
  height: "36px",
  border: 0,
  borderRadius: "50%",
  background: "#eef5f2",
  color: "#163b32",
  fontWeight: 800,
},

modalIcon: {
  fontSize: "52px",
},

modalTitle: {
  margin: "8px 0 5px",
  color: "#163b32",
  fontSize: "23px",
},

modalStudentName: {
  margin: "0 0 20px",
  color: "#64748b",
  fontWeight: 700,
},

fieldLabel: {
  display: "block",
  margin: "14px 0 8px",
  textAlign: "right",
  color: "#244a40",
  fontWeight: 800,
},

pointsChoices: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
},

pointsChoice: {
  border: "1px solid #d9e8e1",
  borderRadius: "14px",
  padding: "13px",
  background: "#f6faf8",
  color: "#166534",
  fontSize: "18px",
  fontWeight: 900,
},

pointsChoiceActive: {
  background: "#166534",
  color: "#ffffff",
  borderColor: "#166534",
},

reasonInput: {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "13px",
  padding: "13px 14px",
  fontSize: "15px",
  textAlign: "right",
},

savePointsButton: {
  width: "100%",
  marginTop: "18px",
  border: 0,
  borderRadius: "14px",
  padding: "14px",
  background: "#f4b400",
  color: "#453200",
  fontSize: "16px",
  fontWeight: 900,
},
};