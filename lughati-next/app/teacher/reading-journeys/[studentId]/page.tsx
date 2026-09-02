"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../../firebase";

type Student = {
  id: string;
  name: string;
  classroom: string;
};

type ReadingRecord = {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  audioUrl: string;
  durationSeconds: number;
  status: "approved" | "pending" | "rejected";
  date: Date | null;
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

function formatDuration(seconds: number) {
  if (!seconds) {
    return "غير محددة";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} ثانية`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} دقيقة`;
  }

  return `${minutes} د ${remainingSeconds} ث`;
}

function getStatusLabel(
  status: "approved" | "pending" | "rejected"
) {
  if (status === "approved") {
    return "✅ معتمدة";
  }

  if (status === "rejected") {
    return "🔁 تحتاج إعادة";
  }

  return "⏳ بانتظار المراجعة";
}

function getStatusStyle(
  status: "approved" | "pending" | "rejected"
) {
  if (status === "approved") {
    return {
      background: "#e9f8f0",
      color: "#177451",
    };
  }

  if (status === "rejected") {
    return {
      background: "#fff0f0",
      color: "#a23a3a",
    };
  }

  return {
    background: "#fff7df",
    color: "#946100",
  };
}

export default function StudentReadingJourneyPage() {
  const params = useParams();

  const studentId =
    typeof params.studentId === "string"
      ? params.studentId
      : "";

  const [student, setStudent] =
    useState<Student | null>(null);

  const [records, setRecords] =
    useState<ReadingRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!studentId) {
      return;
    }

    async function loadJourney() {
      try {
        setLoading(true);
        setError("");

        // بيانات الطالب
        const studentSnapshot =
          await getDoc(
            doc(
              db,
              "students",
              studentId
            )
          );

        if (!studentSnapshot.exists()) {
          setError(
            "لم يتم العثور على بيانات الطالب."
          );
          return;
        }

        const studentData =
          studentSnapshot.data();

        setStudent({
          id: studentSnapshot.id,

          name:
            studentData.name ||
            studentData.studentName ||
            studentData.fullName ||
            "طالب",

          classroom:
            studentData.classroom ||
            studentData.className ||
            studentData.class ||
            "",
        });

        // المصدر الحقيقي لتسجيلات القراءة
        const completionsQuery = query(
          collection(
            db,
            "homeworkCompletions"
          ),
          where(
            "studentId",
            "==",
            studentId
          )
        );

        const completionsSnapshot =
          await getDocs(
            completionsQuery
          );

        const readingRecords: ReadingRecord[] =
          completionsSnapshot.docs
            .map((completionDoc) => {
              const data =
                completionDoc.data();

              const audioUrl =
                typeof data.readingAudioUrl ===
                  "string"
                  ? data.readingAudioUrl.trim()
                  : "";

              if (!audioUrl) {
                return null;
              }

              let status:
                | "approved"
                | "pending"
                | "rejected" =
                "pending";

              if (
                data.readingStatus ===
                "approved"
              ) {
                status = "approved";
              } else if (
                data.readingStatus ===
                "rejected"
              ) {
                status = "rejected";
              }

              return {
                id: completionDoc.id,

                homeworkId:
                  typeof data.homeworkId ===
                  "string"
                    ? data.homeworkId
                    : "",

                homeworkTitle:
                  typeof data.homeworkTitle ===
                  "string"
                    ? data.homeworkTitle
                    : "قراءة لغتي",

                audioUrl,

                durationSeconds:
                  typeof data
                    .readingDurationSeconds ===
                  "number"
                    ? data
                        .readingDurationSeconds
                    : 0,

                status,

                date:
                  convertToDate(
                    data.completedAt
                  ) ||
                  convertToDate(
                    data.updatedAt
                  ) ||
                  null,
              };
            })
            .filter(
              (
                record
              ): record is ReadingRecord =>
                record !== null
            );

        readingRecords.sort(
          (a, b) =>
            (b.date?.getTime() || 0) -
            (a.date?.getTime() || 0)
        );

        setRecords(
          readingRecords
        );
      } catch (error) {
        console.error(
          "تعذر تحميل رحلة القراءة:",
          error
        );

        setError(
          "تعذر تحميل رحلة القراءة."
        );
      } finally {
        setLoading(false);
      }
    }

    loadJourney();
  }, [studentId]);

  const approvedRecords =
    useMemo(
      () =>
        records.filter(
          (record) =>
            record.status ===
            "approved"
        ),
      [records]
    );

  const pendingRecords =
    useMemo(
      () =>
        records.filter(
          (record) =>
            record.status ===
            "pending"
        ),
      [records]
    );

  const rejectedRecords =
    useMemo(
      () =>
        records.filter(
          (record) =>
            record.status ===
            "rejected"
        ),
      [records]
    );

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: 30,
          background: "#f6fbf8",
        }}
      >
        <div
          style={{
            maxWidth: 1050,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 20,
            padding: 35,
            textAlign: "center",
            fontWeight: 900,
          }}
        >
          ⏳ جارٍ تحميل رحلة القراءة...
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: 30,
          background: "#f6fbf8",
        }}
      >
        <div
          style={{
            maxWidth: 1050,
            margin: "0 auto",
          }}
        >
          <Link
            href="/teacher/reading-journeys"
            style={{
              textDecoration: "none",
              color: "#176b4d",
              fontWeight: 900,
            }}
          >
            ← العودة إلى رحلات القراءة
          </Link>

          <div
            style={{
              marginTop: 20,
              background: "#ffffff",
              borderRadius: 20,
              padding: 35,
              textAlign: "center",
              fontWeight: 900,
            }}
          >
            ⚠️ {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f4fbf7 0%,#ffffff 100%)",
        padding: "24px 16px 60px",
        color: "#17352b",
      }}
    >
      <div
        style={{
          maxWidth: 1050,
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
            gap: 15,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(27px, 5vw, 38px)",
                fontWeight: 950,
              }}
            >
              📖 رحلة {student.name}
            </h1>

            <div
              style={{
                marginTop: 7,
                color: "#71817c",
                fontWeight: 800,
              }}
            >
              {student.classroom ||
                "الفصل غير محدد"}
            </div>
          </div>

          <Link
            href="/teacher/reading-journeys"
            style={{
              textDecoration: "none",
              background: "#ffffff",
              color: "#176b4d",
              border:
                "1px solid #dbe9e3",
              padding: "11px 17px",
              borderRadius: 14,
              fontWeight: 900,
            }}
          >
            ← رحلات القراءة
          </Link>
        </div>

        {/* الإحصائيات */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Stat
            icon="📅"
            title="أيام القراءة"
            value={
              approvedRecords.length
            }
          />

          <Stat
            icon="✅"
            title="قراءات معتمدة"
            value={
              approvedRecords.length
            }
          />

          <Stat
            icon="⏳"
            title="بانتظار المراجعة"
            value={
              pendingRecords.length
            }
          />

          <Stat
            icon="🎙️"
            title="إجمالي التسجيلات"
            value={
              records.length
            }
          />
        </section>

        {rejectedRecords.length >
          0 && (
          <div
            style={{
              marginBottom: 20,
              background: "#fff6f6",
              border:
                "1px solid #f0dddd",
              borderRadius: 17,
              padding: 15,
              fontWeight: 800,
              color: "#984848",
            }}
          >
            🔁 توجد{" "}
            {rejectedRecords.length}{" "}
            قراءة تحتاج إلى إعادة.
          </div>
        )}

        {/* سجل القراءات */}
        <section
          style={{
            background: "#ffffff",
            border:
              "1px solid #e0ebe6",
            borderRadius: 22,
            padding: 20,
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 23,
            }}
          >
            🎙️ سجل القراءات
          </h2>

          {records.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#76857f",
                fontWeight: 800,
              }}
            >
              🌱 لم يبدأ الطالب رحلة
              القراءة بعد.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {records.map(
                (
                  record,
                  index
                ) => {
                  const statusStyle =
                    getStatusStyle(
                      record.status
                    );

                  return (
                    <article
                      key={record.id}
                      style={{
                        border:
                          "1px solid #e4ece8",
                        borderRadius: 18,
                        padding: 18,
                        background:
                          "#fcfefd",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: 12,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize:
                                18,
                              fontWeight:
                                950,
                            }}
                          >
                            📖 القراءة رقم{" "}
                            {records.length -
                              index}
                          </div>

                          <div
                            style={{
                              marginTop:
                                6,
                              color:
                                "#49675d",
                              fontWeight:
                                800,
                              fontSize:
                                15,
                            }}
                          >
                            {
                              record.homeworkTitle
                            }
                          </div>

                          <div
                            style={{
                              marginTop:
                                8,
                              color:
                                "#71817b",
                              fontSize:
                                14,
                              fontWeight:
                                700,
                            }}
                          >
                            ⏱️ مدة
                            القراءة:{" "}
                            {formatDuration(
                              record.durationSeconds
                            )}
                          </div>

                          <div
                            style={{
                              marginTop:
                                5,
                              color:
                                "#71817b",
                              fontSize:
                                14,
                              fontWeight:
                                700,
                            }}
                          >
                            📅{" "}
                            {record.date
                              ? record.date.toLocaleDateString(
                                  "ar-SA",
                                  {
                                    year: "numeric",
                                    month:
                                      "long",
                                    day: "numeric",
                                  }
                                )
                              : "التاريخ غير متوفر"}
                          </div>
                        </div>

                        <span
                          style={{
                            padding:
                              "8px 13px",
                            borderRadius:
                              999,
                            fontWeight:
                              900,
                            background:
                              statusStyle.background,
                            color:
                              statusStyle.color,
                          }}
                        >
                          {getStatusLabel(
                            record.status
                          )}
                        </span>
                      </div>

                      {/* مشغل التسجيل الحقيقي */}
                      <div
                        style={{
                          marginTop: 16,
                        }}
                      >
                        <audio
                          controls
                          preload="metadata"
                          src={
                            record.audioUrl
                          }
                          style={{
                            width: "100%",
                          }}
                        >
                          متصفحك لا يدعم تشغيل
                          التسجيل الصوتي.
                        </audio>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#809089",
                        }}
                      >
                        🎧 تسجيل القراءة الأصلي
                        المرفوع من الطالب
                      </div>
                    </article>
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

function Stat({
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
        background: "#ffffff",
        border:
          "1px solid #e0ebe6",
        borderRadius: 18,
        padding: 17,
        boxShadow:
          "0 7px 20px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 25,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#71817b",
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 28,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </div>
  );
}