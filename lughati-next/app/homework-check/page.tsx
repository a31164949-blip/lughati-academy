"use client";

import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
type HomeworkMethod = "الدفتر" | "الكتاب" | "إلكترونيًا" | "";

export default function HomeworkCheckPage() {
  const [method, setMethod] = useState<HomeworkMethod>("");
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedCompleted =
      localStorage.getItem("lughati-homework-completed") === "true";
    const savedMethod =
      (localStorage.getItem(
        "lughati-homework-method"
      ) as HomeworkMethod) || "";
    const savedTime =
      localStorage.getItem("lughati-homework-completed-at") || "";

    setCompleted(savedCompleted);
    setMethod(savedMethod);
    setCompletedAt(savedTime);

    if (!savedCompleted) {
      const reminderTimer = window.setTimeout(() => {
        setMessage(
          "مرحبًا يا بطل 🌟 ما زال واجب اليوم بانتظارك. أنجزه ثم أكّد لفارس حتى تحصل على نجمتك!"
        );
      }, 1500);

      return () => window.clearTimeout(reminderTimer);
    }
  }, []);

  async function confirmHomework() {
    if (!method) {
      setMessage("اختر أولًا أين أنجزت واجبك يا بطل 📚");
      return;
    }

    const time = new Date().toLocaleString("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
try {
  const studentName =
    localStorage.getItem("student-name") || "طالب تجريبي";

  const classroom =
    localStorage.getItem("student-classroom") || "الثاني أ";

  const todayKey = new Date().toISOString().slice(0, 10);

  await setDoc(
    doc(db, "homeworkCompletions", `${studentName}-${todayKey}`),
    {
      studentName,
      classroom,
      homeworkTitle: "قراءة الدرس وحل التدريبات",
      method,
      completed: true,
      completedAtText: time,
      completedAt: serverTimestamp(),
      teacherReviewed: false,
    }
  );
} catch (error) {
  console.error(error);
  setMessage("تعذر إرسال التأكيد إلى المعلم. حاول مرة أخرى.");
  return;
}
    localStorage.setItem("lughati-homework-completed", "true");
    localStorage.setItem("lughati-homework-method", method);
    localStorage.setItem("lughati-homework-completed-at", time);

    setCompleted(true);
    setCompletedAt(time);
    setMessage(
      "أحسنت يا بطل! أكّدت إنجاز واجبك، والتزامك يقودك إلى التميز ⭐"
    );
  }

  function resetHomework() {
    localStorage.removeItem("lughati-homework-completed");
    localStorage.removeItem("lughati-homework-method");
    localStorage.removeItem("lughati-homework-completed-at");

    setCompleted(false);
    setCompletedAt("");
    setMethod("");
    setMessage("عاد الواجب إلى حالة: بانتظار الإنجاز.");
  }

  return (
    <main style={styles.page} dir="rtl">
      <section style={styles.header}>
        <div style={styles.logo}>📚</div>

        <div>
          <p style={styles.smallTitle}>أكاديمية لغتي الرقمية</p>
          <h1 style={styles.title}>متابعة إنجاز الواجبات مع فارس</h1>
          <p style={styles.subtitle}>
            أنجز واجبك في الدفتر أو الكتاب أو المنصة، ثم أخبر فارس.
          </p>
        </div>
      </section>

      <section style={styles.farisCard}>
        <div style={styles.farisAvatar}>👦🏻</div>

        <div>
          <h2 style={styles.farisName}>فارس يقول لك:</h2>

          <p style={styles.farisText}>
            {completed
              ? "رائع يا بطل! لقد أكدت إنجاز واجبك اليوم."
              : "هل أنجزت واجب اليوم؟ اختر طريقة الإنجاز ثم اضغط زر التأكيد."}
          </p>
        </div>
      </section>

      <section style={styles.homeworkCard}>
        <div style={styles.statusRow}>
          <div>
            <p style={styles.cardLabel}>واجب اليوم</p>
            <h2 style={styles.homeworkTitle}>قراءة الدرس وحل التدريبات</h2>
          </div>

          <span
            style={{
              ...styles.statusBadge,
              background: completed ? "#dcfce7" : "#fff3cd",
              color: completed ? "#166534" : "#8a6100",
            }}
          >
            {completed ? "تم الإنجاز ✅" : "بانتظار الإنجاز ⏳"}
          </span>
        </div>

        <p style={styles.question}>أين أنجزت واجبك؟</p>

        <div style={styles.methodGrid}>
          {(["الدفتر", "الكتاب", "إلكترونيًا"] as HomeworkMethod[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                disabled={completed}
                onClick={() => setMethod(item)}
                style={{
                  ...styles.methodButton,
                  border:
                    method === item
                      ? "3px solid #16845f"
                      : "2px solid #d8ebe3",
                  background: method === item ? "#e6f7ef" : "#ffffff",
                  opacity: completed ? 0.75 : 1,
                }}
              >
                <span style={styles.methodIcon}>
                  {item === "الدفتر"
                    ? "📒"
                    : item === "الكتاب"
                    ? "📘"
                    : "💻"}
                </span>

                {item}
              </button>
            )
          )}
        </div>

        {!completed ? (
          <button
            type="button"
            onClick={confirmHomework}
            style={styles.confirmButton}
          >
            ✅ أتممت حل الواجب
          </button>
        ) : (
          <div style={styles.completedBox}>
            <strong>أحسنت! حصلت على نجمة ⭐</strong>

            <span>طريقة الإنجاز: {method}</span>

            {completedAt && <span>وقت التأكيد: {completedAt}</span>}
          </div>
        )}

        {message && <div style={styles.messageBox}>{message}</div>}

        {completed && (
          <button
            type="button"
            onClick={resetHomework}
            style={styles.resetButton}
          >
            إعادة التجربة
          </button>
        )}
      </section>

      <section style={styles.noteCard}>
        <span style={styles.noteIcon}>🛡️</span>

        <div>
          <h3 style={styles.noteTitle}>متابعة آمنة ومحفزة</h3>

          <p style={styles.noteText}>
            تأكيد الطالب يساعد المعلم على متابعة الالتزام، ولا يعني اعتماد
            صحة الحل إلا بعد مراجعة المعلم.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f4fbf7 0%, #eef8f3 50%, #ffffff 100%)",
    padding: "28px 18px 50px",
    fontFamily: "Arial, sans-serif",
    color: "#143f32",
  },

  header: {
    maxWidth: "950px",
    margin: "0 auto 24px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    border: "1px solid #dceee5",
    borderRadius: "26px",
    boxShadow: "0 12px 35px rgba(28, 114, 82, 0.08)",
  },

  logo: {
    width: "74px",
    height: "74px",
    borderRadius: "22px",
    display: "grid",
    placeItems: "center",
    background: "#16966b",
    fontSize: "36px",
    flexShrink: 0,
  },

  smallTitle: {
    margin: "0 0 5px",
    color: "#16845f",
    fontWeight: 700,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(25px, 4vw, 38px)",
    color: "#123f31",
  },

  subtitle: {
    margin: 0,
    color: "#5c786f",
    lineHeight: 1.8,
  },

  farisCard: {
    maxWidth: "950px",
    margin: "0 auto 24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    borderRadius: "26px",
    background: "linear-gradient(135deg, #16845f, #21a276)",
    color: "#ffffff",
    boxShadow: "0 15px 35px rgba(22, 132, 95, 0.18)",
  },

  farisAvatar: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#ffffff",
    fontSize: "54px",
    border: "6px solid rgba(255,255,255,0.35)",
    flexShrink: 0,
  },

  farisName: {
    margin: "0 0 8px",
    fontSize: "25px",
  },

  farisText: {
    margin: 0,
    lineHeight: 1.9,
    fontSize: "18px",
  },

  homeworkCard: {
    maxWidth: "950px",
    margin: "0 auto 24px",
    padding: "28px",
    background: "#ffffff",
    borderRadius: "28px",
    border: "1px solid #d9ece3",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.09)",
  },

  statusRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
  },

  cardLabel: {
    margin: "0 0 7px",
    color: "#16845f",
    fontWeight: 700,
  },

  homeworkTitle: {
    margin: 0,
    fontSize: "clamp(23px, 4vw, 34px)",
  },

  statusBadge: {
    padding: "11px 16px",
    borderRadius: "999px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  question: {
    margin: "30px 0 16px",
    fontSize: "20px",
    fontWeight: 800,
  },

  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
  },

  methodButton: {
    minHeight: "112px",
    borderRadius: "22px",
    padding: "18px 12px",
    color: "#143f32",
    fontSize: "19px",
    fontWeight: 800,
    cursor: "pointer",
  },

  methodIcon: {
    display: "block",
    marginBottom: "10px",
    fontSize: "36px",
  },

  confirmButton: {
    width: "100%",
    marginTop: "24px",
    padding: "18px",
    border: "none",
    borderRadius: "18px",
    background: "#16845f",
    color: "#ffffff",
    fontSize: "21px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(22, 132, 95, 0.22)",
  },

  completedBox: {
    marginTop: "24px",
    padding: "22px",
    display: "grid",
    gap: "9px",
    background: "#eaf9f1",
    color: "#16603f",
    borderRadius: "20px",
    border: "1px solid #bde8d1",
    fontSize: "17px",
  },

  messageBox: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "#fff7d8",
    color: "#745600",
    lineHeight: 1.8,
    fontWeight: 700,
  },

  resetButton: {
    marginTop: "16px",
    padding: "11px 18px",
    borderRadius: "14px",
    border: "1px solid #c6ded3",
    background: "#ffffff",
    color: "#356858",
    fontWeight: 700,
    cursor: "pointer",
  },

  noteCard: {
    maxWidth: "950px",
    margin: "0 auto",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#f0f8f4",
    border: "1px solid #d0e8dc",
  },

  noteIcon: {
    fontSize: "38px",
  },

  noteTitle: {
    margin: "0 0 6px",
    color: "#15553f",
  },

  noteText: {
    margin: 0,
    lineHeight: 1.8,
    color: "#5d786e",
  },
};