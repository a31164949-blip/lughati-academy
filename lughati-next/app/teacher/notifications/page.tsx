"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../../firebase";

type NotificationItem = {
  id: string;
  type: "reading" | "solution";
  studentName: string;
  classroom: string;
  homeworkTitle: string;
  date: Date | null;
  href: string;
};

function convertToDate(value: any): Date | null {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "الوقت غير متوفر";
  }

  return date.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      collection(
        db,
        "homeworkCompletions"
      ),

      (snapshot) => {
        const items: NotificationItem[] =
          [];

        snapshot.docs.forEach(
          (completionDoc) => {
            const data =
              completionDoc.data();

            const studentName =
              typeof data.studentName ===
              "string"
                ? data.studentName
                : "طالب";

            const classroom =
              typeof data.classroom ===
              "string"
                ? data.classroom
                : "الفصل غير محدد";

            const homeworkTitle =
              typeof data.homeworkTitle ===
              "string"
                ? data.homeworkTitle
                : "واجب لغتي";

            const notificationDate =
              convertToDate(
                data.updatedAt
              ) ||
              convertToDate(
                data.completedAt
              ) ||
              null;

            /*
              🎙️ إشعار قراءة جديدة
            */

            const hasReadingAudio =
              typeof data.readingAudioUrl ===
                "string" &&
              data.readingAudioUrl.trim() !==
                "";

            const readingNeedsReview =
              hasReadingAudio &&
              data.readingStatus !==
                "approved" &&
              data.readingStatus !==
                "rejected";

            if (readingNeedsReview) {
              items.push({
                id:
                  completionDoc.id +
                  "-reading",

                type: "reading",

                studentName,

                classroom,

                homeworkTitle,

                date:
                  notificationDate,

                href:
                  "/teacher/reading-submissions",
              });
            }

            /*
              📸 إشعار حل مرفوع
            */

            const hasSolution =
              typeof data.solutionUrl ===
                "string" &&
              data.solutionUrl.trim() !==
                "";

            const solutionNeedsReview =
              hasSolution &&
              data.solutionStatus !==
                "approved" &&
              data.solutionStatus !==
                "rejected";

            if (solutionNeedsReview) {
              items.push({
                id:
                  completionDoc.id +
                  "-solution",

                type: "solution",

                studentName,

                classroom,

                homeworkTitle,

                date:
                  notificationDate,

                href:
                  "/teacher/homework-tracking",
              });
            }
          }
        );

        items.sort(
          (a, b) =>
            (b.date?.getTime() || 0) -
            (a.date?.getTime() || 0)
        );

        setNotifications(items);
        setLoading(false);
      },

      (error) => {
        console.error(
          "تعذر تحميل إشعارات المعلم:",
          error
        );

        setError(
          "تعذر تحميل مركز الإشعارات."
        );

        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const readingCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            item.type === "reading"
        ).length,
      [notifications]
    );

  const solutionCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            item.type === "solution"
        ).length,
      [notifications]
    );

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",

        padding:
          "24px 16px 60px",

        background:
          "linear-gradient(180deg, #f2fbf7 0%, #ffffff 100%)",

        color:
          "#174d3b",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* رأس الصفحة */}

        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            gap: 14,

            flexWrap: "wrap",

            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,

                fontSize:
                  "clamp(30px, 5vw, 42px)",

                fontWeight: 950,
              }}
            >
              🔔 مركز الإشعارات
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",

                color:
                  "#668379",

                fontWeight: 700,

                lineHeight: 1.8,
              }}
            >
              كل ما يحتاج مراجعتك
              واعتمادك في مكان واحد.
            </p>
          </div>

          <Link
            href="/teacher"
            style={{
              textDecoration:
                "none",

              background:
                "#ffffff",

              border:
                "1px solid #cfe5dc",

              color:
                "#176b4d",

              padding:
                "11px 17px",

              borderRadius: 14,

              fontWeight: 900,
            }}
          >
            ← العودة إلى لوحة المعلم
          </Link>
        </div>

        {/* الإحصائيات */}

        <section
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",

            gap: 14,

            marginBottom: 22,
          }}
        >
          <StatCard
            icon="🔔"
            title="تحتاج انتباهك"
            value={
              notifications.length
            }
          />

          <StatCard
            icon="🎙️"
            title="قراءات للمراجعة"
            value={
              readingCount
            }
          />

          <StatCard
            icon="📸"
            title="حلول للمراجعة"
            value={
              solutionCount
            }
          />
        </section>

        {/* قائمة الإشعارات */}

        <section
          style={{
            background:
              "#ffffff",

            border:
              "1px solid #d6ebe2",

            borderRadius: 24,

            padding: 20,

            boxShadow:
              "0 10px 30px rgba(23, 77, 59, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems: "center",

              gap: 12,

              flexWrap: "wrap",

              marginBottom: 18,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 25,
              }}
            >
              📥 يحتاج إجراء
            </h2>

            {!loading &&
              notifications.length >
                0 && (
                <span
                  style={{
                    background:
                      "#e7f8f0",

                    color:
                      "#137354",

                    borderRadius:
                      999,

                    padding:
                      "7px 12px",

                    fontWeight:
                      900,
                  }}
                >
                  {
                    notifications.length
                  }{" "}
                  إشعار
                </span>
              )}
          </div>

          {loading && (
            <MessageCard>
              ⏳ جارٍ تحميل
              الإشعارات...
            </MessageCard>
          )}

          {!loading &&
            error && (
            <MessageCard>
              ⚠️ {error}
            </MessageCard>
          )}

          {!loading &&
            !error &&
            notifications.length ===
              0 && (
              <div
                style={{
                  textAlign:
                    "center",

                  padding:
                    "45px 20px",

                  color:
                    "#668379",
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    marginBottom: 12,
                  }}
                >
                  ✅
                </div>

                <div
                  style={{
                    fontSize: 21,
                    fontWeight: 900,
                    color:
                      "#176b4d",
                  }}
                >
                  لا توجد مهام
                  معلّقة حاليًا
                </div>

                <p
                  style={{
                    margin:
                      "8px 0 0",

                    fontWeight: 700,
                  }}
                >
                  ستظهر هنا
                  القراءات والحلول
                  الجديدة التي تحتاج
                  مراجعتك.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            notifications.length >
              0 && (
              <div
                style={{
                  display:
                    "grid",

                  gap: 12,
                }}
              >
                {notifications.map(
                  (notification) => {
                    const isReading =
                      notification.type ===
                      "reading";

                    return (
                      <Link
                        key={
                          notification.id
                        }
                        href={
                          notification.href
                        }
                        style={{
                          display:
                            "block",

                          textDecoration:
                            "none",

                          color:
                            "inherit",
                        }}
                      >
                        <article
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap: 16,

                            flexWrap:
                              "wrap",

                            padding:
                              18,

                            borderRadius:
                              18,

                            border:
                              isReading
                                ? "1px solid #cce8df"
                                : "1px solid #e5dfca",

                            background:
                              isReading
                                ? "#f7fdfa"
                                : "#fffdf7",

                            cursor:
                              "pointer",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "flex-start",

                              gap: 13,
                            }}
                          >
                            <div
                              style={{
                                width:
                                  52,

                                height:
                                  52,

                                borderRadius:
                                  16,

                                display:
                                  "grid",

                                placeItems:
                                  "center",

                                fontSize:
                                  27,

                                background:
                                  isReading
                                    ? "#e7f8f0"
                                    : "#fff5d9",
                              }}
                            >
                              {isReading
                                ? "🎙️"
                                : "📸"}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontSize:
                                    18,

                                  fontWeight:
                                    950,
                                }}
                              >
                                {isReading
                                  ? "قراءة جديدة تنتظر المراجعة"
                                  : "حل جديد ينتظر المراجعة"}
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    6,

                                  fontWeight:
                                    800,
                                }}
                              >
                                {
                                  notification.studentName
                                }
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    4,

                                  color:
                                    "#71847d",

                                  fontSize:
                                    14,

                                  fontWeight:
                                    700,
                                }}
                              >
                                {
                                  notification.classroom
                                }{" "}
                                •{" "}
                                {
                                  notification.homeworkTitle
                                }
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    5,

                                  color:
                                    "#8a9893",

                                  fontSize:
                                    13,

                                  fontWeight:
                                    700,
                                }}
                              >
                                🕐{" "}
                                {formatDate(
                                  notification.date
                                )}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              color:
                                "#168c65",

                              fontWeight:
                                900,

                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            مراجعة الآن ←
                          </span>
                        </article>
                      </Link>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",

        border:
          "1px solid #d6ebe2",

        borderRadius:
          20,

        padding:
          19,

        boxShadow:
          "0 8px 24px rgba(23, 77, 59, 0.05)",
      }}
    >
      <div
        style={{
          fontSize: 27,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 8,

          color:
            "#668379",

          fontWeight:
            800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 5,

          fontSize: 31,

          fontWeight:
            950,

          color:
            "#168c65",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MessageCard({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div
      style={{
        padding:
          "30px 20px",

        borderRadius:
          18,

        background:
          "#f8fcfa",

        border:
          "1px solid #e0eee8",

        textAlign:
          "center",

        color:
          "#668379",

        fontWeight:
          800,
      }}
    >
      {children}
    </div>
  );
}