"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../../../firebase";

type StudentCandidate = {
  studentId: string;
  studentName: string;
  studentClassroom: string;
  confidence: "high" | "medium" | "low";
  differenceSeconds: number;
  matchedBy: "lastActivityAt" | "lastLoginAt";
};

type RecoveryResource = {
  publicId: string;
  secureUrl: string;
  format: string;
  durationSeconds: number;
  bytes: number;
  createdAt: string;
  suggestedStudents?: StudentCandidate[];
};

type StudentItem = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
};

type RecoveryResponse = {
  success?: boolean;
  totalCloudinaryResources?: number;
  linkedSubmissions?: number;
  orphanedCount?: number;
  resources?: RecoveryResource[];
  message?: string;
};

type RecoverResponse = {
  success?: boolean;
  submissionId?: string;
  message?: string;
};

function confidenceLabel(
  confidence: StudentCandidate["confidence"]
) {
  if (confidence === "high") {
    return "مطابقة قوية";
  }

  if (confidence === "medium") {
    return "مطابقة متوسطة";
  }

  return "مطابقة ضعيفة";
}

function confidenceStyle(
  confidence: StudentCandidate["confidence"]
) {
  if (confidence === "high") {
    return {
      background: "#ecfdf5",
      border: "1px solid #86efac",
      color: "#166534",
    };
  }

  if (confidence === "medium") {
    return {
      background: "#fffbeb",
      border: "1px solid #fde68a",
      color: "#92400e",
    };
  }

  return {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#475569",
  };
}

function formatDifference(seconds: number) {
  if (seconds < 60) {
    return `${seconds} ثانية`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} دقيقة`;
  }

  return `${minutes} دقيقة و${remainingSeconds} ثانية`;
}

export default function ReadingRecoveryPage() {
  const [
    resources,
    setResources,
  ] = useState<
    RecoveryResource[]
  >([]);

  const [
    students,
    setStudents,
  ] = useState<
    StudentItem[]
  >([]);

  const [
    selectedStudents,
    setSelectedStudents,
  ] = useState<
    Record<string, string>
  >({});

  const [
    selectedDates,
    setSelectedDates,
  ] = useState<
    Record<string, string>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    recoveringId,
    setRecoveringId,
  ] = useState<
    string | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    stats,
    setStats,
  ] = useState({
    totalCloudinaryResources: 0,
    linkedSubmissions: 0,
    orphanedCount: 0,
  });

  const [
    teacherToken,
    setTeacherToken,
  ] = useState("");

  /*
   * ============================================
   * مصادقة المعلم
   * ============================================
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            setTeacherToken("");
            setLoading(false);
            return;
          }

          try {
            const token =
              await user.getIdToken();

            setTeacherToken(
              token
            );
          } catch (error) {
            console.error(
              "تعذر الحصول على رمز المعلم:",
              error
            );

            setLoading(false);
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  /*
   * ============================================
   * تحميل الطلاب
   * ============================================
   */
  useEffect(() => {
    async function loadStudents() {
      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );

        const rows =
          snapshot.docs
            .map(
              (document) => {
                const data =
                  document.data();

                const studentName =
                  typeof data.studentName ===
                  "string"
                    ? data.studentName
                    : typeof data.name ===
                        "string"
                      ? data.name
                      : "طالب";

                const classroom =
                  typeof data.classroom ===
                  "string"
                    ? data.classroom
                    : "";

                const studentId =
                  typeof data.studentId ===
                    "string" &&
                  data.studentId.trim()
                    ? data.studentId
                    : document.id;

                return {
                  id:
                    document.id,

                  studentId,

                  studentName,

                  classroom,
                };
              }
            )
            .sort(
              (
                first,
                second
              ) =>
                first.studentName.localeCompare(
                  second.studentName,
                  "ar"
                )
            );

        setStudents(
          rows
        );
      } catch (error) {
        console.error(
          "تعذر تحميل الطلاب:",
          error
        );
      }
    }

    void loadStudents();
  }, []);

  /*
   * ============================================
   * تحميل المقاطع غير المرتبطة
   * ============================================
   */
  async function loadRecoveryResources(
    token: string
  ) {
    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/reading-recovery",
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache:
              "no-store",
          }
        );

      const result =
        (await response.json()) as
          RecoveryResponse;

      if (!response.ok) {
        setResources([]);

        setMessage(
          result.message ||
            "تعذر تحميل المقاطع."
        );

        return;
      }

      setResources(
        Array.isArray(
          result.resources
        )
          ? result.resources
          : []
      );

      setStats({
        totalCloudinaryResources:
          result.totalCloudinaryResources ||
          0,

        linkedSubmissions:
          result.linkedSubmissions ||
          0,

        orphanedCount:
          result.orphanedCount ||
          0,
      });
    } catch (error) {
      console.error(
        "تعذر تحميل التسجيلات:",
        error
      );

      setMessage(
        "❌ تعذر الاتصال بخدمة الاستعادة."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!teacherToken) {
      return;
    }

    void loadRecoveryResources(
      teacherToken
    );
  }, [teacherToken]);

  /*
   * ============================================
   * استعادة تسجيل واحد
   * ============================================
   */
  async function recoverResource(
    resource: RecoveryResource
  ) {
    if (!teacherToken) {
      return;
    }

    const selectedStudentId =
      selectedStudents[
        resource.publicId
      ] || "";

    const readingDate =
      selectedDates[
        resource.publicId
      ] || "";

    if (
      !selectedStudentId
    ) {
      setMessage(
        "اختر الطالب أولًا."
      );
      return;
    }

    if (!readingDate) {
      setMessage(
        "حدد تاريخ القراءة أولًا."
      );
      return;
    }

    const student =
      students.find(
        (item) =>
          item.id ===
            selectedStudentId ||
          item.studentId ===
            selectedStudentId
      );

    if (!student) {
      setMessage(
        "تعذر العثور على بيانات الطالب."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `سيتم ربط هذا التسجيل بالطالب:\n\n${student.studentName}\n${student.classroom}\nتاريخ القراءة: ${readingDate}\n\nثم سيظهر في مراجعة القراءات بحالة انتظار المراجعة.\n\nهل تريد المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setRecoveringId(
        resource.publicId
      );

      setMessage(
        "⏳ جارٍ استعادة التسجيل..."
      );

      const response =
        await fetch(
          "/api/reading-recovery",
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${teacherToken}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                publicId:
                  resource.publicId,

                secureUrl:
                  resource.secureUrl,

                studentId:
                  student.studentId,

                studentName:
                  student.studentName,

                studentClassroom:
                  student.classroom,

                readingDate,

                durationSeconds:
                  resource.durationSeconds,
              }),
          }
        );

      const result =
        (await response.json()) as
          RecoverResponse;

      if (!response.ok) {
        setMessage(
          result.message ||
            "تعذر استعادة التسجيل."
        );

        return;
      }

      setMessage(
        result.message ||
          "✅ تمت استعادة التسجيل."
      );

      /*
       * نحذف العنصر من القائمة
       * مباشرة بعد نجاح الربط.
       */
      setResources(
        (current) =>
          current.filter(
            (item) =>
              item.publicId !==
              resource.publicId
          )
      );

      setStats(
        (current) => ({
          ...current,

          orphanedCount:
            Math.max(
              0,
              current.orphanedCount -
                1
            ),

          linkedSubmissions:
            current.linkedSubmissions +
            1,
        })
      );
    } catch (error) {
      console.error(
        "تعذر استعادة التسجيل:",
        error
      );

      setMessage(
        "❌ حدث خطأ أثناء استعادة التسجيل."
      );
    } finally {
      setRecoveringId(
        null
      );
    }
  }

  /*
   * التاريخ المستنتج من وقت
   * رفع الملف إلى Cloudinary.
   */
  function suggestedDate(
    createdAt: string
  ) {
    if (!createdAt) {
      return "";
    }

    try {
      const date =
        new Date(
          createdAt
        );

      const parts =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "Asia/Riyadh",

            year:
              "numeric",

            month:
              "2-digit",

            day:
              "2-digit",
          }
        ).formatToParts(
          date
        );

      const year =
        parts.find(
          (part) =>
            part.type ===
            "year"
        )?.value || "";

      const month =
        parts.find(
          (part) =>
            part.type ===
            "month"
        )?.value || "";

      const day =
        parts.find(
          (part) =>
            part.type ===
            "day"
        )?.value || "";

      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  }

  /*
   * وضع التاريخ المقترح
   * تلقائيًا للمقاطع الجديدة.
   */
  useEffect(() => {
    if (
      resources.length === 0
    ) {
      return;
    }

    setSelectedDates(
      (current) => {
        const next = {
          ...current,
        };

        resources.forEach(
          (resource) => {
            if (
              !next[
                resource.publicId
              ]
            ) {
              next[
                resource.publicId
              ] =
                suggestedDate(
                  resource.createdAt
                );
            }
          }
        );

        return next;
      }
    );
  }, [resources]);

  const sortedResources =
    useMemo(
      () =>
        [...resources].sort(
          (
            first,
            second
          ) =>
            new Date(
              second.createdAt
            ).getTime() -
            new Date(
              first.createdAt
            ).getTime()
        ),
      [resources]
    );

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",

        background:
          "#f7fbf9",

        padding:
          "24px",
      }}
    >
      <div
        style={{
          maxWidth:
            "1100px",

          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, #0f766e, #087f5b)",

            color:
              "white",

            borderRadius:
              "26px",

            padding:
              "26px",

            marginBottom:
              "22px",
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
                "16px",

              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin:
                    0,

                  fontSize:
                    "30px",
                }}
              >
                🎙️ استعادة القراءات
              </h1>

              <p
                style={{
                  margin:
                    "10px 0 0",

                  lineHeight:
                    1.8,
                }}
              >
                استمع إلى المقاطع غير المرتبطة ثم أعد القراءة الصحيحة إلى حساب المعلم.
              </p>
            </div>

            <Link
              href="/teacher"
              style={{
                background:
                  "white",

                color:
                  "#087f5b",

                padding:
                  "11px 16px",

                borderRadius:
                  "14px",

                fontWeight:
                  900,

                textDecoration:
                  "none",
              }}
            >
              ← العودة إلى لوحة المعلم
            </Link>
          </div>
        </div>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",

            gap:
              "14px",

            marginBottom:
              "20px",
          }}
        >
          <StatCard
            icon="☁️"
            title="ملفات Cloudinary"
            value={
              stats.totalCloudinaryResources
            }
          />

          <StatCard
            icon="✅"
            title="مرتبطة بالقراءات"
            value={
              stats.linkedSubmissions
            }
          />

          <StatCard
            icon="🔎"
            title="تحتاج فحصًا"
            value={
              stats.orphanedCount
            }
          />
        </div>

        {message && (
          <div
            style={{
              padding:
                "14px 18px",

              borderRadius:
                "14px",

              background:
                "#ffffff",

              border:
                "1px solid #d9eee7",

              marginBottom:
                "18px",

              textAlign:
                "center",

              fontWeight:
                900,

              color:
                "#163b32",
            }}
          >
            {message}
          </div>
        )}

        {loading && (
          <div
            style={{
              background:
                "white",

              padding:
                "28px",

              borderRadius:
                "18px",

              textAlign:
                "center",

              fontWeight:
                900,
            }}
          >
            ⏳ جارٍ فحص تسجيلات Cloudinary...
          </div>
        )}

        {!loading &&
          sortedResources.length ===
            0 && (
            <div
              style={{
                background:
                  "#ecfdf5",

                border:
                  "1px solid #a7f3d0",

                color:
                  "#047857",

                padding:
                  "26px",

                borderRadius:
                  "18px",

                textAlign:
                  "center",

                fontWeight:
                  900,

                fontSize:
                  "18px",
              }}
            >
              ✅ لا توجد تسجيلات غير مرتبطة ضمن الملفات التي تم فحصها.
            </div>
          )}

        <div
          style={{
            display:
              "grid",

            gap:
              "18px",
          }}
        >
          {sortedResources.map(
            (
              resource,
              index
            ) => {
              const isRecovering =
                recoveringId ===
                resource.publicId;

              return (
                <div
                  key={
                    resource.publicId
                  }
                  style={{
                    background:
                      "white",

                    borderRadius:
                      "22px",

                    border:
                      "1px solid #d9eee7",

                    padding:
                      "20px",

                    boxShadow:
                      "0 6px 18px rgba(0,0,0,0.05)",
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
                        "12px",

                      flexWrap:
                        "wrap",

                      marginBottom:
                        "14px",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#087f5b",

                        fontSize:
                          "18px",
                      }}
                    >
                      🎧 تسجيل رقم{" "}
                      {index + 1}
                    </strong>

                    <span
                      style={{
                        background:
                          "#fff7ed",

                        color:
                          "#9a3412",

                        padding:
                          "7px 11px",

                        borderRadius:
                          "999px",

                        fontWeight:
                          800,

                        fontSize:
                          "13px",
                      }}
                    >
                      غير مرتبط
                    </span>
                  </div>

                  <audio
                    controls
                    preload="metadata"
                    src={
                      resource.secureUrl
                    }
                    style={{
                      width:
                        "100%",

                      marginBottom:
                        "16px",
                    }}
                  />

                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",

                      gap:
                        "10px",

                      marginBottom:
                        "16px",

                      color:
                        "#475569",

                      fontSize:
                        "14px",
                    }}
                  >
                    <div>
                      ⏱️ المدة:{" "}
                      <strong>
                        {
                          resource.durationSeconds
                        }{" "}
                        ثانية
                      </strong>
                    </div>

                    <div>
                      📅 تاريخ الرفع:{" "}
                      <strong>
                        {resource.createdAt
                          ? new Date(
                              resource.createdAt
                            ).toLocaleString(
                              "ar-SA",
                              {
                                timeZone:
                                  "Asia/Riyadh",
                              }
                            )
                          : "غير متوفر"}
                      </strong>
                    </div>

                    <div>
                      📦 الحجم:{" "}
                      <strong>
                        {Math.max(
                          1,
                          Math.round(
                            resource.bytes /
                              1024
                          )
                        )}{" "}
                        KB
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "16px",
                      borderRadius: "16px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        color: "#163b32",
                        marginBottom: "10px",
                      }}
                    >
                      🔎 الطلاب المحتملون حسب وقت النشاط
                    </div>

                    {Array.isArray(
                      resource.suggestedStudents
                    ) &&
                    resource.suggestedStudents.length >
                      0 ? (
                      <div
                        style={{
                          display: "grid",
                          gap: "9px",
                        }}
                      >
                        {resource.suggestedStudents.map(
                          (candidate) => {
                            const badgeStyle =
                              confidenceStyle(
                                candidate.confidence
                              );

                            return (
                              <button
                                key={
                                  candidate.studentId
                                }
                                type="button"
                                onClick={() => {
                                  const matchingStudent =
                                    students.find(
                                      (student) =>
                                        student.studentId ===
                                          candidate.studentId ||
                                        student.id ===
                                          candidate.studentId
                                    );

                                  if (
                                    !matchingStudent
                                  ) {
                                    setMessage(
                                      "تعذر مطابقة الطالب المرشح مع قائمة الطلاب."
                                    );
                                    return;
                                  }

                                  setSelectedStudents(
                                    (current) => ({
                                      ...current,
                                      [resource.publicId]:
                                        matchingStudent.id,
                                    })
                                  );

                                  setMessage(
                                    `تم وضع ${candidate.studentName} في خانة الاختيار. استمع إلى التسجيل وتأكد قبل الاستعادة.`
                                  );
                                }}
                                style={{
                                  width: "100%",
                                  textAlign: "right",
                                  padding: "12px 14px",
                                  borderRadius: "13px",
                                  cursor: "pointer",
                                  ...badgeStyle,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent:
                                      "space-between",
                                    gap: "10px",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                  }}
                                >
                                  <strong>
                                    👤{" "}
                                    {
                                      candidate.studentName
                                    }
                                    {candidate.studentClassroom
                                      ? ` — ${candidate.studentClassroom}`
                                      : ""}
                                  </strong>

                                  <span
                                    style={{
                                      fontWeight: 900,
                                      fontSize: "13px",
                                    }}
                                  >
                                    {confidenceLabel(
                                      candidate.confidence
                                    )}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    marginTop: "6px",
                                    fontSize: "13px",
                                    lineHeight: 1.7,
                                  }}
                                >
                                  ⏱️ الفارق الزمني:{" "}
                                  <strong>
                                    {formatDifference(
                                      candidate.differenceSeconds
                                    )}
                                  </strong>
                                  {" — "}
                                  الدليل:{" "}
                                  <strong>
                                    {candidate.matchedBy ===
                                    "lastActivityAt"
                                      ? "آخر نشاط داخل الأكاديمية"
                                      : "آخر تسجيل دخول"}
                                  </strong>
                                </div>
                              </button>
                            );
                          }
                        )}

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            lineHeight: 1.7,
                          }}
                        >
                          ⚠️ الترشيح الزمني للمساعدة فقط،
                          وليس إثباتًا لهوية صاحب الصوت.
                          اضغط على المرشح لوضعه في خانة
                          الطالب، ثم تأكد قبل الاستعادة.
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "11px 12px",
                          borderRadius: "12px",
                          background: "white",
                          border:
                            "1px dashed #cbd5e1",
                          color: "#64748b",
                          fontWeight: 800,
                        }}
                      >
                        لم يتم تحديد طالب محتمل من بيانات
                        النشاط المتاحة. اترك التسجيل دون
                        استعادة إذا لم تتأكد من صاحبه.
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",

                      gap:
                        "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display:
                            "block",

                          marginBottom:
                            "7px",

                          fontWeight:
                            900,

                          color:
                            "#163b32",
                        }}
                      >
                        اسم الطالب
                      </label>

                      <select
                        value={
                          selectedStudents[
                            resource
                              .publicId
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedStudents(
                            (
                              current
                            ) => ({
                              ...current,

                              [resource.publicId]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        style={{
                          width:
                            "100%",

                          padding:
                            "12px",

                          border:
                            "1px solid #cbd5e1",

                          borderRadius:
                            "12px",

                          background:
                            "white",

                          fontSize:
                            "15px",
                        }}
                      >
                        <option value="">
                          اختر الطالب...
                        </option>

                        {students.map(
                          (
                            student
                          ) => (
                            <option
                              key={
                                student.id
                              }
                              value={
                                student.id
                              }
                            >
                              {
                                student.studentName
                              }
                              {student.classroom
                                ? ` — ${student.classroom}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            "block",

                          marginBottom:
                            "7px",

                          fontWeight:
                            900,

                          color:
                            "#163b32",
                        }}
                      >
                        تاريخ القراءة
                      </label>

                      <input
                        type="date"
                        value={
                          selectedDates[
                            resource
                              .publicId
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedDates(
                            (
                              current
                            ) => ({
                              ...current,

                              [resource.publicId]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        style={{
                          width:
                            "100%",

                          boxSizing:
                            "border-box",

                          padding:
                            "12px",

                          border:
                            "1px solid #cbd5e1",

                          borderRadius:
                            "12px",

                          background:
                            "white",

                          fontSize:
                            "15px",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",

                      gap:
                        "10px",

                      flexWrap:
                        "wrap",

                      marginTop:
                        "16px",
                    }}
                  >
                    <button
                      type="button"
                      disabled={
                        isRecovering
                      }
                      onClick={() =>
                        void recoverResource(
                          resource
                        )
                      }
                      style={{
                        flex:
                          "1 1 260px",

                        border:
                          "none",

                        borderRadius:
                          "14px",

                        padding:
                          "14px",

                        background:
                          isRecovering
                            ? "#94a3b8"
                            : "#087f5b",

                        color:
                          "white",

                        fontWeight:
                          900,

                        fontSize:
                          "16px",

                        cursor:
                          isRecovering
                            ? "wait"
                            : "pointer",
                      }}
                    >
                      {isRecovering
                        ? "⏳ جارٍ الاستعادة..."
                        : "♻️ إعادة إلى مراجعة القراءات"}
                    </button>

                    <a
                      href={
                        resource.secureUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex:
                          "0 1 auto",

                        border:
                          "1px solid #a7f3d0",

                        borderRadius:
                          "14px",

                        padding:
                          "13px 16px",

                        background:
                          "white",

                        color:
                          "#087f5b",

                        fontWeight:
                          900,

                        textDecoration:
                          "none",
                      }}
                    >
                      🔗 فتح التسجيل
                    </a>
                  </div>
                </div>
              );
            }
          )}
        </div>
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
          "white",

        border:
          "1px solid #d9eee7",

        borderRadius:
          "18px",

        padding:
          "18px",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            "28px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop:
            "7px",

          color:
            "#64748b",

          fontWeight:
            800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:
            "7px",

          fontSize:
            "28px",

          fontWeight:
            900,

          color:
            "#087f5b",
        }}
      >
        {value}
      </div>
    </div>
  );
}