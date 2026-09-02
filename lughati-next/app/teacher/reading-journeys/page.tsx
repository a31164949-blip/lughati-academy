"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase";

type Student = {
  id: string;
  name: string;
  classroom: string;
};

type ReadingRecord = {
  id: string;
  studentId: string;
  studentName: string;
  status: "approved" | "pending" | "rejected";
  durationSeconds: number;
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

export default function ReadingJourneysPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [records, setRecords] =
    useState<ReadingRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          studentsSnapshot,
          completionsSnapshot,
        ] = await Promise.all([
          getDocs(
            collection(
              db,
              "students"
            )
          ),

          getDocs(
            collection(
              db,
              "homeworkCompletions"
            )
          ),
        ]);

        const studentsData: Student[] =
          studentsSnapshot.docs.map(
            (studentDoc) => {
              const data =
                studentDoc.data();

              return {
                id:
                  studentDoc.id,

                name:
                  data.name ||
                  data.studentName ||
                  data.fullName ||
                  "طالب",

                classroom:
                  data.classroom ||
                  data.className ||
                  data.class ||
                  "",
              };
            }
          );

        const readingData: ReadingRecord[] =
          completionsSnapshot.docs
            .map(
              (completionDoc) => {
                const data =
                  completionDoc.data();

                const audioUrl =
                  typeof data.readingAudioUrl ===
                    "string"
                    ? data.readingAudioUrl.trim()
                    : "";

                // لا نعتبر السجل قراءة
                // إلا إذا كان فيه تسجيل صوتي فعلي
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
                  status =
                    "approved";
                } else if (
                  data.readingStatus ===
                  "rejected"
                ) {
                  status =
                    "rejected";
                }

                return {
                  id:
                    completionDoc.id,

                  studentId:
                    typeof data.studentId ===
                    "string"
                      ? data.studentId
                      : "",

                  studentName:
                    typeof data.studentName ===
                    "string"
                      ? data.studentName
                      : "",

                  status,

                  durationSeconds:
                    typeof data
                      .readingDurationSeconds ===
                    "number"
                      ? data
                          .readingDurationSeconds
                      : 0,

                  date:
                    convertToDate(
                      data.completedAt
                    ) ||
                    convertToDate(
                      data.updatedAt
                    ) ||
                    null,
                };
              }
            )
            .filter(
              (
                record
              ): record is ReadingRecord =>
                record !== null
            );

        studentsData.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "ar"
            )
        );

        setStudents(
          studentsData
        );

        setRecords(
          readingData
        );
      } catch (err) {
        console.error(
          "تعذر تحميل رحلات القراءة:",
          err
        );

        setError(
          "تعذر تحميل بيانات رحلات القراءة."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const studentRows =
    useMemo(() => {
      return students.map(
        (student) => {
          const studentRecords =
            records.filter(
              (record) =>
                record.studentId ===
                  student.id ||
                (
                  record.studentName &&
                  record.studentName.trim() ===
                    student.name.trim()
                )
            );

          const approvedRecords =
            studentRecords.filter(
              (record) =>
                record.status ===
                "approved"
            );

          const pendingRecords =
            studentRecords.filter(
              (record) =>
                record.status ===
                "pending"
            );

          const rejectedRecords =
            studentRecords.filter(
              (record) =>
                record.status ===
                "rejected"
            );

          const latestRecord =
            [...studentRecords]
              .filter(
                (record) =>
                  record.date
              )
              .sort(
                (a, b) =>
                  (b.date?.getTime() ||
                    0) -
                  (a.date?.getTime() ||
                    0)
              )[0] || null;

          return {
            ...student,

            totalReadings:
              studentRecords.length,

            approvedReadings:
              approvedRecords.length,

            pendingReadings:
              pendingRecords.length,

            rejectedReadings:
              rejectedRecords.length,

            // كل قراءة معتمدة = يوم قراءة
            readingDays:
              approvedRecords.length,

            latestReading:
              latestRecord?.date ||
              null,
          };
        }
      );
    }, [students, records]);

  const filteredStudents =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLowerCase();

      if (!normalized) {
        return studentRows;
      }

      return studentRows.filter(
        (student) =>
          student.name
            .toLowerCase()
            .includes(normalized) ||
          student.classroom
            .toLowerCase()
            .includes(normalized)
      );
    }, [
      studentRows,
      search,
    ]);

  const activeReaders =
    studentRows.filter(
      (student) =>
        student.totalReadings > 0
    ).length;

  const totalApproved =
    records.filter(
      (record) =>
        record.status ===
        "approved"
    ).length;

  const totalPending =
    records.filter(
      (record) =>
        record.status ===
        "pending"
    ).length;

  const totalRejected =
    records.filter(
      (record) =>
        record.status ===
        "rejected"
    ).length;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",

        background:
          "linear-gradient(180deg, #f5fbf8 0%, #ffffff 100%)",

        padding:
          "24px 16px 60px",

        color:
          "#17352b",
      }}
    >
      <div
        style={{
          maxWidth: 1150,
          margin: "0 auto",
        }}
      >
        {/* العنوان */}
        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: 12,

            flexWrap:
              "wrap",

            marginBottom:
              20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,

                fontSize:
                  "clamp(27px, 5vw, 40px)",

                fontWeight:
                  900,
              }}
            >
              📖 رحلات القراءة
            </h1>

            <p
              style={{
                margin:
                  "7px 0 0",

                color:
                  "#60766f",

                fontWeight:
                  700,
              }}
            >
              تابع رحلة كل طالب
              وتطوره القرائي منذ
              بداية العام.
            </p>
          </div>

          <Link
            href="/teacher"
            style={{
              textDecoration:
                "none",

              background:
                "#ffffff",

              color:
                "#17352b",

              border:
                "1px solid #dce9e4",

              borderRadius:
                14,

              padding:
                "10px 16px",

              fontWeight:
                900,

              boxShadow:
                "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            ← العودة للوحة المعلم
          </Link>
        </div>

        {/* الإحصائيات */}
        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap: 12,

            marginBottom:
              20,
          }}
        >
          <StatCard
            icon="👦🏻"
            title="إجمالي الطلاب"
            value={
              students.length
            }
          />

          <StatCard
            icon="📚"
            title="طلاب بدأوا القراءة"
            value={
              activeReaders
            }
          />

          <StatCard
            icon="✅"
            title="قراءات معتمدة"
            value={
              totalApproved
            }
          />

          <StatCard
            icon="⏳"
            title="بانتظار المراجعة"
            value={
              totalPending
            }
          />

          {totalRejected >
            0 && (
            <StatCard
              icon="🔁"
              title="تحتاج إعادة"
              value={
                totalRejected
              }
            />
          )}
        </section>

        {/* البحث */}
        <div
          style={{
            background:
              "#ffffff",

            border:
              "1px solid #e3ece8",

            borderRadius:
              20,

            padding:
              16,

            marginBottom:
              18,

            boxShadow:
              "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="🔎 ابحث باسم الطالب أو الفصل..."
            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              border:
                "1px solid #d9e6e1",

              borderRadius:
                14,

              padding:
                "13px 15px",

              fontSize:
                16,

              outline:
                "none",

              background:
                "#fbfdfc",

              color:
                "#17352b",

              fontWeight:
                700,
            }}
          />
        </div>

        {loading && (
          <MessageCard>
            ⏳ جارٍ تحميل رحلات
            القراءة...
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
          filteredStudents.length ===
            0 && (
            <MessageCard>
              لا توجد بيانات طلاب
              لعرضها حاليًا.
            </MessageCard>
          )}

        {!loading &&
          !error &&
          filteredStudents.length >
            0 && (
            <div
              style={{
                display:
                  "grid",

                gap: 12,
              }}
            >
              {filteredStudents.map(
                (student) => (
                  <Link
                    key={
                      student.id
                    }
                    href={`/teacher/reading-journeys/${student.id}`}
                    style={{
                      textDecoration:
                        "none",

                      color:
                        "inherit",

                      display:
                        "block",
                    }}
                  >
                    <article
                      style={{
                        background:
                          "#ffffff",

                        border:
                          "1px solid #e0ebe6",

                        borderRadius:
                          20,

                        padding:
                          17,

                        boxShadow:
                          "0 7px 22px rgba(0,0,0,0.045)",

                        cursor:
                          "pointer",
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

                          gap:
                            14,

                          flexWrap:
                            "wrap",
                        }}
                      >
                        {/* بيانات الطالب */}
                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              12,
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

                              background:
                                "#eef8f3",

                              display:
                                "grid",

                              placeItems:
                                "center",

                              fontSize:
                                27,
                            }}
                          >
                            📖
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight:
                                  900,

                                fontSize:
                                  18,
                              }}
                            >
                              {
                                student.name
                              }
                            </div>

                            <div
                              style={{
                                marginTop:
                                  4,

                                color:
                                  "#71827c",

                                fontSize:
                                  14,

                                fontWeight:
                                  700,
                              }}
                            >
                              {student.classroom ||
                                "الفصل غير محدد"}
                            </div>
                          </div>
                        </div>

                        {/* أرقام الرحلة */}
                        <div
                          style={{
                            display:
                              "flex",

                            gap:
                              8,

                            flexWrap:
                              "wrap",
                          }}
                        >
                          <MiniBadge>
                            📅{" "}
                            {
                              student.readingDays
                            }{" "}
                            أيام
                          </MiniBadge>

                          <MiniBadge>
                            ✅{" "}
                            {
                              student.approvedReadings
                            }{" "}
                            معتمدة
                          </MiniBadge>

                          {student.pendingReadings >
                            0 && (
                            <MiniBadge>
                              ⏳{" "}
                              {
                                student.pendingReadings
                              }{" "}
                              مراجعة
                            </MiniBadge>
                          )}

                          {student.rejectedReadings >
                            0 && (
                            <MiniBadge>
                              🔁{" "}
                              {
                                student.rejectedReadings
                              }{" "}
                              إعادة
                            </MiniBadge>
                          )}
                        </div>
                      </div>

                      {/* أسفل البطاقة */}
                      <div
                        style={{
                          marginTop:
                            14,

                          paddingTop:
                            13,

                          borderTop:
                            "1px solid #edf2f0",

                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          flexWrap:
                            "wrap",

                          gap:
                            10,
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#687b74",

                            fontSize:
                              14,

                            fontWeight:
                              700,
                          }}
                        >
                          آخر قراءة:{" "}
                          {student.latestReading
                            ? student.latestReading.toLocaleDateString(
                                "ar-SA",
                                {
                                  year:
                                    "numeric",
                                  month:
                                    "long",
                                  day:
                                    "numeric",
                                }
                              )
                            : "لم يسجل قراءة بعد"}
                        </span>

                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              14,

                            flexWrap:
                              "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                14,

                              fontWeight:
                                900,

                              color:
                                student.totalReadings >
                                0
                                  ? "#187653"
                                  : "#9a6a18",
                            }}
                          >
                            {student.totalReadings >
                            0
                              ? "🟢 بدأت الرحلة"
                              : "🟡 لم تبدأ الرحلة"}
                          </span>

                          <span
                            style={{
                              fontSize:
                                14,

                              fontWeight:
                                900,

                              color:
                                "#176b4d",
                            }}
                          >
                            عرض الرحلة ←
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              )}
            </div>
          )}
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
          "1px solid #e1ebe7",

        borderRadius:
          18,

        padding:
          16,

        boxShadow:
          "0 7px 20px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize:
            25,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop:
            8,

          color:
            "#6a7c76",

          fontWeight:
            800,

          fontSize:
            14,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:
            4,

          fontWeight:
            950,

          fontSize:
            27,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniBadge({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      style={{
        padding:
          "7px 10px",

        borderRadius:
          999,

        background:
          "#f2f8f5",

        border:
          "1px solid #e0ebe6",

        fontSize:
          13,

        fontWeight:
          900,

        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </span>
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
        background:
          "#ffffff",

        border:
          "1px solid #e2ebe7",

        borderRadius:
          18,

        padding:
          25,

        textAlign:
          "center",

        fontWeight:
          800,

        color:
          "#64756f",
      }}
    >
      {children}
    </div>
  );
}