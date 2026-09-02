"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Timestamp,
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
  resourceUrl?: string;
  attachmentName?: string;
};

type HomeworkReminderResult = {
  studentName: string;
  homework: Homework | null;
  visible: boolean;
};

export default function HomeworkReminder() {
  const [studentName, setStudentName] =
    useState("");

  const [homework, setHomework] =
    useState<Homework | null>(null);

  const [visible, setVisible] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  async function fetchHomeworkReminderData():
    Promise<HomeworkReminderResult> {
    const studentId =
      localStorage.getItem("student-id") ||
      "";

    const savedStudentName =
      localStorage.getItem(
        "student-name"
      ) || "";

    const classroom =
      localStorage.getItem(
        "student-classroom"
      ) || "";

    if (
      !studentId ||
      !savedStudentName ||
      !classroom
    ) {
      return {
        studentName:
          savedStudentName,

        homework: null,

        visible: false,
      };
    }

    /*
     * جلب أحدث واجب منشور ومناسب
     * لفصل الطالب فقط.
     *
     * بدل قراءة جميع الواجبات
     * ثم تصفيتها داخل المتصفح.
     */

    const targetClasses =
      classroom === "الفصلان"
        ? ["الفصلان"]
        : [
            "الفصلان",
            classroom,
          ];

    const homeworksQuery =
      query(
        collection(
          db,
          "homeworks"
        ),

        where(
          "published",
          "==",
          true
        ),

        where(
          "targetClass",
          "in",
          targetClasses
        ),

        orderBy(
          "createdAt",
          "desc"
        ),

        limit(1)
      );

    const homeworksSnapshot =
      await getDocs(
        homeworksQuery
      );

    /*
     * لا يوجد واجب مناسب.
     */

    if (
      homeworksSnapshot.empty
    ) {
      return {
        studentName:
          savedStudentName,

        homework: null,

        visible: false,
      };
    }

    /*
     * بسبب limit(1)
     * لدينا أحدث واجب فقط.
     */

    const homeworkDocument =
      homeworksSnapshot.docs[0];

    const data =
      homeworkDocument.data();

    const latestHomework: Homework =
      {
        id:
          homeworkDocument.id,

        title:
          typeof data.title ===
          "string"
            ? data.title
            : "واجب جديد",

        instructions:
          typeof data.instructions ===
          "string"
            ? data.instructions
            : "",

        targetClass:
          typeof data.targetClass ===
          "string"
            ? data.targetClass
            : "الفصلان",

        dueDate:
          typeof data.dueDate ===
          "string"
            ? data.dueDate
            : "",

        published:
          data.published === true,

        createdAt:
          data.createdAt ?? null,

        resourceUrl:
          typeof data.resourceUrl ===
          "string"
            ? data.resourceUrl
            : "",

        attachmentName:
          typeof data.attachmentName ===
          "string"
            ? data.attachmentName
            : "",
      };

    /*
     * فحص هل الطالب
     * أنجز هذا الواجب بالفعل.
     *
     * هنا نقرأ وثيقة واحدة فقط.
     */

    const completionId =
      `${studentId}-${latestHomework.id}`;

    const completionSnapshot =
      await getDoc(
        doc(
          db,
          "homeworkCompletions",
          completionId
        )
      );

    const alreadyCompleted =
      completionSnapshot.exists() &&
      completionSnapshot.data()
        .completed === true;

    /*
     * إذا أنجز الطالب الواجب
     * لا نظهر التذكير.
     */

    return {
      studentName:
        savedStudentName,

      homework:
        alreadyCompleted
          ? null
          : latestHomework,

      visible:
        !alreadyCompleted,
    };
  }

  useEffect(() => {
    let active = true;

    async function loadReminder() {
      try {
        const result =
          await fetchHomeworkReminderData();

        if (!active) {
          return;
        }

        setStudentName(
          result.studentName
        );

        setHomework(
          result.homework
        );

        setVisible(
          result.visible
        );
      } catch (error) {
        console.error(
          "تعذر فحص تنبيه الواجب:",
          error
        );

        if (active) {
          setHomework(null);
          setVisible(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReminder();

    return () => {
      active = false;
    };
  }, []);

  function openHomework() {
    window.location.href =
      "/homework-check";
  }

  if (
    loading ||
    !visible ||
    !homework
  ) {
    return null;
  }

  return (
    <section
      dir="rtl"
      style={styles.card}
    >
      <div
        style={
          styles.farisAvatar
        }
      >
        👦🏻
      </div>

      <div
        style={styles.content}
      >
        <p
          style={styles.label}
        >
          تنبيه من فارس
        </p>

        <h2
          style={styles.title}
        >
          يا {studentName}، لديك
          واجب بانتظارك ⭐
        </h2>

        <p
          style={styles.text}
        >
          واجبك الحالي:{" "}
          <strong>
            {homework.title}
          </strong>
        </p>

        {homework.instructions && (
          <p
            style={
              styles.instructions
            }
          >
            {
              homework.instructions
            }
          </p>
        )}

        {homework.resourceUrl && (
          <a
            href={
              homework.resourceUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            style={
              styles.attachment
            }
          >
            📎 فتح المرفق
            {homework.attachmentName
              ? ` — ${homework.attachmentName}`
              : ""}
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={
          openHomework
        }
        style={styles.button}
      >
        اذهب إلى الواجب
      </button>
    </section>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
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

    border:
      "2px solid #f2d97b",

    boxShadow:
      "0 12px 32px rgba(151, 111, 0, 0.12)",

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

    border:
      "4px solid #f4df8f",

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

    fontSize:
      "clamp(21px, 4vw, 29px)",
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

  attachment: {
    display: "block",

    marginTop: "14px",

    padding: "12px 16px",

    borderRadius: "14px",

    background: "#eff6ff",

    border:
      "1px solid #bfdbfe",

    color: "#1d4ed8",

    fontWeight: 800,

    textAlign: "center",

    textDecoration: "none",
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