"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

type Homework = {
  id: string;
  title: string;
  instructions: string;
  targetClass: string;
  dueDate: string;
   published: boolean;
  createdAt?: Timestamp | null;
};

export default function HomeworkReminder() {
  const [studentName, setStudentName] = useState("");
  const [homework, setHomework] = useState<Homework | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHomeworkReminder();
  }, []);

  async function checkHomeworkReminder() {
    try {
      setLoading(true);

      const studentId = localStorage.getItem("student-id") || "";
      const savedStudentName =
        localStorage.getItem("student-name") || "";
      const classroom =
        localStorage.getItem("student-classroom") || "";

      setStudentName(savedStudentName);

      if (!studentId || !savedStudentName || !classroom) {
        setVisible(false);
        return;
      }

      const homeworksSnapshot = await getDocs(
        collection(db, "homeworks")
      );

      const suitableHomeworks: Homework[] =
        homeworksSnapshot.docs
          .map((homeworkDocument) => {
            const data = homeworkDocument.data();

            return {
              id: homeworkDocument.id,
              title: data.title || "واجب جديد",
              instructions: data.instructions || "",
              targetClass: data.targetClass || "الفصلان",
              dueDate: data.dueDate || "",
              createdAt: data.createdAt || null,
              published: data.published === true,
            };
          })
          .filter((item) => {
            const suitableClass =
              item.targetClass === "الفصلان" ||
              item.targetClass === classroom;

            return item.published && suitableClass;
          })
          .sort((first, second) => {
            const firstTime =
              first.createdAt?.toMillis?.() || 0;
            const secondTime =
              second.createdAt?.toMillis?.() || 0;

            return secondTime - firstTime;
          });

      const latestHomework = suitableHomeworks[0] || null;

      if (!latestHomework) {
        setVisible(false);
        return;
      }

      const completionId = `${studentId}-${latestHomework.id}`;

      const completionSnapshot = await getDoc(
        doc(db, "homeworkCompletions", completionId)
      );

      const alreadyCompleted =
        completionSnapshot.exists() &&
        completionSnapshot.data().completed === true;

      if (alreadyCompleted) {
        setVisible(false);
        return;
      }

      setHomework(latestHomework);
      setVisible(true);
    } catch (error) {
      console.error("تعذر فحص تنبيه الواجب:", error);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }

  function openHomework() {
    window.location.href = "/homework-check";
  }

  if (loading || !visible || !homework) {
    return null;
  }

  return (
    <section dir="rtl" style={styles.card}>
      <div style={styles.farisAvatar}>👦🏻</div>

      <div style={styles.content}>
        <p style={styles.label}>تنبيه من فارس</p>

        <h2 style={styles.title}>
          يا {studentName}، لديك واجب بانتظارك ⭐
        </h2>

        <p style={styles.text}>
          واجبك الحالي: <strong>{homework.title}</strong>
        </p>

        {homework.instructions && (
          <p style={styles.instructions}>
            {homework.instructions}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={openHomework}
        style={styles.button}
      >
        اذهب إلى الواجب
      </button>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: "1100px",
    margin: "22px auto",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    borderRadius: "25px",
    background:
      "linear-gradient(135deg, #fff8d8 0%, #fffdf3 100%)",
    border: "2px solid #f2d97b",
    boxShadow: "0 12px 32px rgba(151, 111, 0, 0.12)",
    color: "#604900",
  },

  farisAvatar: {
    width: "82px",
    height: "82px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#ffffff",
    border: "4px solid #f4df8f",
    fontSize: "48px",
  },

  content: {
    flex: "1 1 320px",
  },

  label: {
    margin: "0 0 5px",
    color: "#9a7100",
    fontWeight: 900,
  },

  title: {
    margin: "0 0 8px",
    color: "#6b5000",
    fontSize: "clamp(21px, 4vw, 29px)",
  },

  text: {
    margin: "0 0 7px",
    lineHeight: 1.8,
  },

  instructions: {
    margin: 0,
    color: "#806817",
    lineHeight: 1.8,
  },

  button: {
    padding: "15px 21px",
    border: "none",
    borderRadius: "16px",
    background: "#16845f",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};