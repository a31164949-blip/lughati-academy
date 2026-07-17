"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type HomeworkCompletion = {
  id: string;
  studentName: string;
  classroom: string;
  homeworkTitle: string;
  method: string;
  completed: boolean;
  completedAtText: string;
  teacherReviewed: boolean;
};

export default function HomeworkTrackingPage() {
  const [items, setItems] = useState<HomeworkCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  async function loadCompletions() {
    try {
      setLoading(true);
      setError("");

      const completionsQuery = query(
        collection(db, "homeworkCompletions"),
        orderBy("completedAt", "desc")
      );

      const snapshot = await getDocs(completionsQuery);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        studentName: item.data().studentName || "طالب",
        classroom: item.data().classroom || "غير محدد",
        homeworkTitle: item.data().homeworkTitle || "واجب",
        method: item.data().method || "غير محدد",
        completed: item.data().completed === true,
        completedAtText: item.data().completedAtText || "غير متوفر",
        teacherReviewed: item.data().teacherReviewed === true,
      }));

      setItems(data);
    } catch (loadError) {
      console.error(loadError);
      setError("تعذر جلب بيانات إنجاز الواجبات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompletions();
  }, []);

  async function markReviewed(item: HomeworkCompletion) {
    try {
      setUpdatingId(item.id);

      await updateDoc(doc(db, "homeworkCompletions", item.id), {
        teacherReviewed: !item.teacherReviewed,
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                teacherReviewed: !currentItem.teacherReviewed,
              }
            : currentItem
        )
      );
    } catch (updateError) {
      console.error(updateError);
      alert("تعذر تحديث حالة مراجعة الواجب.");
    } finally {
      setUpdatingId("");
    }
  }

  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items]
  );

  const reviewedCount = useMemo(
    () => items.filter((item) => item.teacherReviewed).length,
    [items]
  );

  const waitingReviewCount = completedCount - reviewedCount;

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div style={styles.headerIcon}>📋</div>

        <div>
          <p style={styles.smallTitle}>لوحة المعلم</p>
          <h1 style={styles.title}>متابعة إنجاز الواجبات</h1>
          <p style={styles.subtitle}>
            متابعة الطلاب الذين أكدوا إنجاز واجباتهم ومراجعة حالاتهم.
          </p>
        </div>
      </section>

      <section style={styles.statistics}>
        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{items.length}</strong>
          <span style={styles.statLabel}>إجمالي التأكيدات</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{reviewedCount}</strong>
          <span style={styles.statLabel}>تمت مراجعتها</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{waitingReviewCount}</strong>
          <span style={styles.statLabel}>بانتظار المراجعة</span>
        </article>
      </section>

      <section style={styles.listSection}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionLabel}>سجل الطلاب</p>
            <h2 style={styles.sectionTitle}>قائمة إنجاز الواجبات</h2>
          </div>

          <button
            type="button"
            onClick={loadCompletions}
            style={styles.refreshButton}
          >
            تحديث القائمة
          </button>
        </div>

        {loading && <div style={styles.message}>جاري تحميل البيانات...</div>}

        {error && <div style={styles.errorMessage}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={styles.message}>
            لا توجد تأكيدات لإنجاز الواجبات حتى الآن.
          </div>
        )}

        <div style={styles.cardsGrid}>
          {items.map((item) => (
            <article key={item.id} style={styles.studentCard}>
              <div style={styles.cardTop}>
                <div>
                  <p style={styles.classroom}>{item.classroom}</p>
                  <h3 style={styles.studentName}>{item.studentName}</h3>
                </div>

                <span
                  style={{
                    ...styles.reviewBadge,
                    background: item.teacherReviewed
                      ? "#dcfce7"
                      : "#fff3cd",
                    color: item.teacherReviewed ? "#166534" : "#8a6100",
                  }}
                >
                  {item.teacherReviewed
                    ? "تمت المراجعة ✅"
                    : "بانتظار المراجعة ⏳"}
                </span>
              </div>

              <div style={styles.details}>
                <p>
                  <strong>الواجب:</strong> {item.homeworkTitle}
                </p>

                <p>
                  <strong>طريقة الإنجاز:</strong> {item.method}
                </p>

                <p>
                  <strong>وقت التأكيد:</strong> {item.completedAtText}
                </p>

                <p>
                  <strong>حالة الطالب:</strong>{" "}
                  {item.completed ? "تم الإنجاز ✅" : "لم يكتمل"}
                </p>
              </div>

              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() => markReviewed(item)}
                style={{
                  ...styles.reviewButton,
                  background: item.teacherReviewed ? "#ffffff" : "#16845f",
                  color: item.teacherReviewed ? "#315f50" : "#ffffff",
                  border: item.teacherReviewed
                    ? "1px solid #c9dfd5"
                    : "none",
                  opacity: updatingId === item.id ? 0.65 : 1,
                }}
              >
                {updatingId === item.id
                  ? "جاري الحفظ..."
                  : item.teacherReviewed
                  ? "إلغاء المراجعة"
                  : "تمت المراجعة"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.noteCard}>
        <span style={styles.noteIcon}>🛡️</span>

        <div>
          <h3 style={styles.noteTitle}>تنبيه مهم</h3>
          <p style={styles.noteText}>
            تأكيد الطالب يعني أنه صرّح بإنجاز الواجب، ولا يعني صحة الحل إلا
            بعد مراجعة المعلم.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px 18px 50px",
    background:
      "linear-gradient(180deg, #f3faf6 0%, #eef7f3 50%, #ffffff 100%)",
    color: "#143f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    borderRadius: "26px",
    border: "1px solid #d9ebe2",
    boxShadow: "0 12px 35px rgba(25, 104, 76, 0.08)",
  },

  headerIcon: {
    width: "76px",
    height: "76px",
    borderRadius: "22px",
    display: "grid",
    placeItems: "center",
    background: "#16845f",
    fontSize: "38px",
    flexShrink: 0,
  },

  smallTitle: {
    margin: "0 0 5px",
    color: "#16845f",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(26px, 4vw, 40px)",
  },

  subtitle: {
    margin: 0,
    color: "#617a70",
    lineHeight: 1.8,
  },

  statistics: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
  },

  statCard: {
    padding: "24px",
    display: "grid",
    placeItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #d9ebe2",
    borderRadius: "22px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "38px",
    color: "#16845f",
  },

  statLabel: {
    color: "#526f64",
    fontWeight: 800,
  },

  listSection: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    padding: "26px",
    background: "#ffffff",
    border: "1px solid #d9ebe2",
    borderRadius: "28px",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.08)",
  },

  sectionHeader: {
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },

  sectionLabel: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  sectionTitle: {
    margin: 0,
    fontSize: "clamp(24px, 4vw, 34px)",
  },

  refreshButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: "15px",
    background: "#16845f",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  studentCard: {
    padding: "22px",
    borderRadius: "22px",
    border: "1px solid #d7e9e0",
    background: "#fbfefc",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  classroom: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  studentName: {
    margin: 0,
    fontSize: "27px",
  },

  reviewBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: 800,
  },

  details: {
    margin: "20px 0",
    padding: "16px",
    borderRadius: "17px",
    background: "#f1f8f5",
    lineHeight: 1.9,
    color: "#49685d",
  },

  reviewButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "15px",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
  },

  message: {
    padding: "22px",
    textAlign: "center",
    borderRadius: "18px",
    background: "#f1f8f5",
    color: "#557268",
    fontWeight: 800,
  },

  errorMessage: {
    padding: "20px",
    textAlign: "center",
    borderRadius: "18px",
    background: "#feecec",
    color: "#9a3232",
    fontWeight: 800,
  },

  noteCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef7f3",
    border: "1px solid #cfe5da",
  },

  noteIcon: {
    fontSize: "38px",
  },

  noteTitle: {
    margin: "0 0 6px",
  },

  noteText: {
    margin: 0,
    lineHeight: 1.8,
    color: "#5b776c",
  },
};