"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import { auth } from "../../firebase";

type Homework = {
  id: string;
  title: string;
  instructions: string;
  targetClass: string;
  dueDate: string;
  published: boolean;
  resourceUrl?: string;
  attachmentName?: string;
};

type HomeworkReminderResult = {
  success: boolean;
  studentName: string;
  homework: Homework | null;
  visible: boolean;
  message?: string;
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

  useEffect(() => {
    let active = true;

    async function loadReminder() {
      try {
        /*
         * لا نقرأ Firestore من المتصفح هنا.
         * نستخدم Firebase Auth فقط للحصول
         * على ID token ثم يقرأ الخادم
         * البيانات بواسطة Firebase Admin.
         */
        const currentUser =
          auth.currentUser;

        if (!currentUser) {
          if (active) {
            setHomework(null);
            setVisible(false);
          }
          return;
        }

        const token =
          await currentUser.getIdToken();

        const response =
          await fetch(
            "/api/homework-reminder",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const text =
          await response.text();

        const data =
          text
            ? (JSON.parse(
                text
              ) as HomeworkReminderResult)
            : null;

        const studentOnlyMessage =
          data?.message ===
          "هذا المسار مخصص للطلاب";

        if (
          response.status === 401 ||
          response.status === 403 ||
          studentOnlyMessage
        ) {
          if (active) {
            setStudentName("");
            setHomework(null);
            setVisible(false);
          }
          return;
        }

        if (
          !response.ok ||
          !data ||
          data.success !== true
        ) {
          throw new Error(
            data?.message ||
              "تعذر تحميل تنبيه الواجب."
          );
        }

        if (!active) {
          return;
        }

        setStudentName(
          data.studentName || ""
        );

        setHomework(
          data.homework
        );

        setVisible(
          data.visible === true
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
