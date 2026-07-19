"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

type Homework = {
  id: string;
  title?: string;
  instructions?: string;
  classroom?: string;
  targetClass?: string;
  className?: string;
  dueDate?: unknown;
  published?: boolean;
  createdAt?: unknown;
};

function formatDate(value: unknown): string {
  if (!value) return "غير محدد";

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      const date = (value as { toDate: () => Date }).toDate();

      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    }

    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      }
    }
  } catch {
    return "غير محدد";
  }

  return "غير محدد";
}

function getDateTime(value: unknown): number {
  if (!value) return 0;

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

function getClassroom(homework: Homework): string {
  const classroom =
    homework.classroom || homework.targetClass || homework.className || "";

  if (
    classroom === "both" ||
    classroom === "all" ||
    classroom === "الفصلان معًا"
  ) {
    return "الثاني أ والثاني ب";
  }

  return classroom || "جميع الطلاب";
}

export default function HomeworksPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "homeworks"),
      (snapshot) => {
        const items = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Homework, "id">),
        }));

        setHomeworks(items);
        setLoading(false);
        setErrorMessage("");
      },
      (error) => {
        console.error(error);
        setLoading(false);
        setErrorMessage("تعذر تحميل الواجبات حاليًا.");
      }
    );

    return unsubscribe;
  }, []);

  const publishedHomeworks = useMemo(() => {
    return homeworks
      .filter((homework) => homework.published === true)
      .sort((first, second) => {
        return (
          getDateTime(first.dueDate) -
          getDateTime(second.dueDate)
        );
      });
  }, [homeworks]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effcf6 0%, #f7fbff 55%, #fffdf5 100%)",
        padding: "28px 20px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#10233f",
      }}
    >
      <div
        style={{
          maxWidth: "1050px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            background:
              "linear-gradient(135deg, #087f5b 0%, #0ca678 100%)",
            borderRadius: "32px",
            padding: "34px",
            color: "white",
            boxShadow: "0 16px 40px rgba(8, 127, 91, 0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "18px",
                  opacity: 0.9,
                }}
              >
                أكاديمية لغتي الرقمية
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px, 6vw, 54px)",
                }}
              >
                واجباتي اليومية 📝
              </h1>

              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: "19px",
                  lineHeight: 1.8,
                }}
              >
                اقرأ تعليمات الواجب بعناية، وأنجزه في الوقت المحدد.
              </p>
            </div>

            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "26px",
                background: "rgba(255,255,255,0.18)",
                display: "grid",
                placeItems: "center",
                fontSize: "48px",
              }}
            >
              📚
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
            margin: "28px 0 20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                color: "#087f5b",
                fontWeight: 700,
              }}
            >
              رحلة الإنجاز
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "30px",
              }}
            >
              الواجبات المنشورة
            </h2>
          </div>

          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#087f5b",
              background: "white",
              border: "1px solid #b7ead6",
              borderRadius: "16px",
              padding: "13px 20px",
              fontWeight: 700,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            العودة إلى البداية ←
          </Link>
        </div>

        {loading && (
          <section
            style={{
              background: "white",
              padding: "50px 24px",
              borderRadius: "26px",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.07)",
            }}
          >
            <div style={{ fontSize: "45px" }}>⏳</div>
            <h3>جارٍ تحميل الواجبات...</h3>
          </section>
        )}

        {!loading && errorMessage && (
          <section
            style={{
              background: "#fff5f5",
              border: "1px solid #ffc9c9",
              padding: "35px 24px",
              borderRadius: "24px",
              textAlign: "center",
              color: "#c92a2a",
            }}
          >
            <h3 style={{ margin: 0 }}>{errorMessage}</h3>
          </section>
        )}

        {!loading &&
          !errorMessage &&
          publishedHomeworks.length === 0 && (
            <section
              style={{
                background: "white",
                padding: "55px 24px",
                borderRadius: "26px",
                textAlign: "center",
                boxShadow: "0 12px 30px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ fontSize: "58px" }}>🌟</div>
              <h3
                style={{
                  fontSize: "28px",
                  margin: "14px 0 8px",
                }}
              >
                لا توجد واجبات منشورة حاليًا
              </h3>
              <p
                style={{
                  color: "#667085",
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                استمتع بوقتك، وسنخبرك عند نشر واجب جديد.
              </p>
            </section>
          )}

        {!loading &&
          !errorMessage &&
          publishedHomeworks.length > 0 && (
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "22px",
              }}
            >
              {publishedHomeworks.map((homework, index) => (
                <article
                  key={homework.id}
                  style={{
                    background: "white",
                    border: "1px solid #d8eee5",
                    borderRadius: "26px",
                    padding: "26px",
                    boxShadow: "0 12px 30px rgba(16, 35, 63, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "18px",
                    }}
                  >
                    <span
                      style={{
                        background: "#d3f9e8",
                        color: "#087f5b",
                        borderRadius: "999px",
                        padding: "8px 14px",
                        fontWeight: 700,
                      }}
                    >
                      واجب رقم {index + 1}
                    </span>

                    <span
                      style={{
                        background: "#fff4d6",
                        borderRadius: "14px",
                        padding: "8px 12px",
                        fontSize: "17px",
                      }}
                    >
                      ⭐
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 12px",
                      fontSize: "27px",
                      lineHeight: 1.5,
                    }}
                  >
                    {homework.title || "واجب لغتي"}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 22px",
                      color: "#53657d",
                      fontSize: "18px",
                      lineHeight: 1.9,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {homework.instructions ||
                      "يرجى تنفيذ الواجب وفق تعليمات المعلم."}
                  </p>

                  <div
                    style={{
                      background: "#f3faf7",
                      borderRadius: "18px",
                      padding: "16px",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#087f5b" }}>
                        👥 الفصل:
                      </strong>{" "}
                      {getClassroom(homework)}
                    </div>

                    <div>
                      <strong style={{ color: "#087f5b" }}>
                        📅 تاريخ الاستحقاق:
                      </strong>{" "}
                      {formatDate(homework.dueDate)}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      padding: "14px",
                      textAlign: "center",
                      background: "#e6fcf5",
                      color: "#087f5b",
                      borderRadius: "16px",
                      fontWeight: 700,
                    }}
                  >
                    أنت قادر على الإنجاز يا بطل 💪
                  </div>
                </article>
              ))}
            </section>
          )}
      </div>
    </main>
  );
}