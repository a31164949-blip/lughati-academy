"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
 collection,arrayUnion,
increment,
runTransaction,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
};

type Homework = {
  id: string;
  title: string;
  instructions: string;
  targetClass: string;
  dueDate: unknown;
  published: boolean;
  createdAtMilliseconds: number;
};

type Completion = {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  completed: boolean;
  teacherApproved: boolean;
  pointsAwarded: boolean;
pointsAwardedValue: number;
  completedAtText: string;
};

function formatDate(value: unknown): string {
  if (!value) return "غير محدد";

  if (value instanceof Timestamp) {
    return value.toDate().toLocaleDateString("ar-SA");
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date })
      .toDate()
      .toLocaleDateString("ar-SA");
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("ar-SA");
    }

    return value;
  }

  return "غير محدد";
}

function getMilliseconds(value: unknown): number {
  if (!value) return 0;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (typeof value === "string") {
    const milliseconds = new Date(value).getTime();
    return Number.isNaN(milliseconds) ? 0 : milliseconds;
  }

  return 0;
}

function homeworkAppliesToStudent(
  homework: Homework,
  student: Student
): boolean {
  const targetClass = homework.targetClass.trim();
  const classroom = student.classroom.trim();

  if (!targetClass || targetClass === "الفصلان" || targetClass === "الكل") {
    return true;
  }

  return targetClass === classroom;
}

export default function HomeworkTrackingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);

  const [selectedHomeworkId, setSelectedHomeworkId] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingCompletionId, setApprovingCompletionId] =
  useState<string | null>(null);
  const [awardingPointsCompletionId, setAwardingPointsCompletionId] =
  useState<string | null>(null);
const fetchTrackingData = useCallback(async () => {
  const [
    studentsSnapshot,
    homeworksSnapshot,
    completionsSnapshot,
  ] = await Promise.all([
    getDocs(collection(db, "students")),
    getDocs(collection(db, "homeworks")),
    getDocs(collection(db, "homeworkCompletions")),
  ]);

  const loadedStudents: Student[] =
    studentsSnapshot.docs
      .map((studentDocument) => {
        const data =
          studentDocument.data();

        return {
          id: studentDocument.id,

          studentId:
            typeof data.studentId === "string"
              ? data.studentId
              : studentDocument.id,

          studentName:
            typeof data.studentName === "string"
              ? data.studentName
              : typeof data.name === "string"
                ? data.name
                : "طالب",

          classroom:
            typeof data.classroom === "string"
              ? data.classroom
              : "غير محدد",

          active:
            data.active !== false,
        };
      })
      .filter(
        (student) =>
          student.active
      )
      .sort(
        (first, second) =>
          first.studentName.localeCompare(
            second.studentName,
            "ar"
          )
      );

  const loadedHomeworks: Homework[] =
    homeworksSnapshot.docs
      .map((homeworkDocument) => {
        const data =
          homeworkDocument.data();

        return {
          id:
            homeworkDocument.id,

          title:
            typeof data.title === "string"
              ? data.title
              : "واجب دون عنوان",

          instructions:
            typeof data.instructions === "string"
              ? data.instructions
              : "",

          targetClass:
            typeof data.targetClass === "string"
              ? data.targetClass
              : typeof data.classroom === "string"
                ? data.classroom
                : "الفصلان",

          dueDate:
            data.dueDate ?? null,

          published:
            data.published === true,

          createdAtMilliseconds:
            getMilliseconds(
              data.createdAt
            ) ||
            getMilliseconds(
              data.updatedAt
            ),
        };
      })
      .filter(
        (homework) =>
          homework.published
      )
      .sort(
        (first, second) =>
          second.createdAtMilliseconds -
          first.createdAtMilliseconds
      );

  const loadedCompletions:
    Completion[] =
      completionsSnapshot.docs.map(
        (completionDocument) => {
          const data =
            completionDocument.data();

          const completedAtText =
            typeof data.completedAtText ===
            "string"
              ? data.completedAtText
              : data.completedAt &&
                  typeof data.completedAt
                    .toDate === "function"
                ? data.completedAt
                    .toDate()
                    .toLocaleString(
                      "ar-SA"
                    )
                : "";

          return {
            id:
              completionDocument.id,

            homeworkId:
              typeof data.homeworkId === "string"
                ? data.homeworkId
                : "",

            studentId:
              typeof data.studentId === "string"
                ? data.studentId
                : "",

            studentName:
              typeof data.studentName === "string"
                ? data.studentName
                : "طالب",

            classroom:
              typeof data.classroom === "string"
                ? data.classroom
                : "",

            completed:
              data.completed === true ||
              data.status === "completed",

            teacherApproved:
              data.teacherApproved === true,

            completedAtText,

            pointsAwarded:
              data.pointsAwarded === true,

            pointsAwardedValue:
              typeof data.pointsAwardedValue ===
              "number"
                ? data.pointsAwardedValue
                : 0,
          };
        }
      );

  return {
    loadedStudents,
    loadedHomeworks,
    loadedCompletions,
  };
}, []);

const loadData =
  useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        loadedStudents,
        loadedHomeworks,
        loadedCompletions,
      } =
        await fetchTrackingData();

      setStudents(
        loadedStudents
      );

      setHomeworks(
        loadedHomeworks
      );

      setCompletions(
        loadedCompletions
      );

      setSelectedHomeworkId(
        (current) => {
          if (
            current &&
            loadedHomeworks.some(
              (homework) =>
                homework.id ===
                current
            )
          ) {
            return current;
          }

          return (
            loadedHomeworks[0]?.id ??
            ""
          );
        }
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        "تعذر تحميل بيانات متابعة الواجبات. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchTrackingData]);
const approveHomeworkCompletion = async (
  completion: Completion
) => {
  if (!completion.completed || completion.teacherApproved) {
    return;
  }

  try {
    setApprovingCompletionId(completion.id);

    await updateDoc(
      doc(db, "homeworkCompletions", completion.id),
      {
        teacherApproved: true,
        teacherApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    setCompletions((currentCompletions) =>
      currentCompletions.map((item) =>
        item.id === completion.id
          ? {
              ...item,
              teacherApproved: true,
            }
          : item
      )
    );
  } catch (approvalError) {
    console.error(approvalError);
    alert("تعذر اعتماد إنجاز الطالب، حاول مرة أخرى.");
  } finally {
    setApprovingCompletionId(null);
  }
};

const awardHomeworkPoints = async (
  completion: Completion,
  pointsValue: number
) => {
  if (
    !completion.completed ||
    !completion.teacherApproved ||
    completion.pointsAwarded
  ) {
    return;
  }

  if (!completion.studentId) {
    alert("تعذر العثور على رقم الطالب.");
    return;
  }

  try {
    setAwardingPointsCompletionId(completion.id);

    await runTransaction(db, async (transaction) => {
      const completionRef = doc(
        db,
        "homeworkCompletions",
        completion.id
      );

      const studentRef = doc(
        db,
        "students",
        completion.studentId
      );

      const completionSnapshot =
        await transaction.get(completionRef);

      if (!completionSnapshot.exists()) {
        throw new Error("COMPLETION_NOT_FOUND");
      }

      const completionData = completionSnapshot.data();

      if (completionData.pointsAwarded === true) {
        throw new Error("POINTS_ALREADY_AWARDED");
      }

      const newHistoryEntry = {
        reason: "إنجاز واجب معتمد",
        points: pointsValue,
        badge: "",
        category: "واجب",
        createdAt: new Date(),
        homeworkId: completion.homeworkId,
        completionId: completion.id,
      };

      transaction.update(studentRef, {
        points: increment(pointsValue),
        "journey.xp": increment(pointsValue),
        pointsHistory: arrayUnion(newHistoryEntry),
      });

      transaction.update(completionRef, {
        pointsAwarded: true,
        pointsAwardedValue: pointsValue,
        pointsAwardedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    setCompletions((currentCompletions) =>
      currentCompletions.map((item) =>
        item.id === completion.id
          ? {
              ...item,
              pointsAwarded: true,
              pointsAwardedValue: pointsValue,
            }
          : item
      )
    );
  } catch (pointsError) {
    console.error(pointsError);

    if (
      pointsError instanceof Error &&
      pointsError.message === "POINTS_ALREADY_AWARDED"
    ) {
      alert("تم منح نقاط هذا الواجب سابقًا.");
    } else {
      alert("تعذر منح النقاط، حاول مرة أخرى.");
    }
  } finally {
    setAwardingPointsCompletionId(null);
  }
};

useEffect(() => {
  let active = true;

  async function loadInitialData() {
    try {
      const {
        loadedStudents,
        loadedHomeworks,
        loadedCompletions,
      } = await fetchTrackingData();

      if (!active) {
        return;
      }

      setStudents(loadedStudents);
      setHomeworks(loadedHomeworks);
      setCompletions(loadedCompletions);

      setSelectedHomeworkId((current) => {
        if (
          current &&
          loadedHomeworks.some(
            (homework) => homework.id === current
          )
        ) {
          return current;
        }

        return loadedHomeworks[0]?.id ?? "";
      });
    } catch (loadError) {
      console.error(loadError);

      if (active) {
        setError(
          "تعذر تحميل بيانات متابعة الواجبات. حاول مرة أخرى."
        );
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void loadInitialData();

  return () => {
    active = false;
  };
}, [fetchTrackingData]);
  const selectedHomework = useMemo(
    () =>
      homeworks.find(
        (homework) => homework.id === selectedHomeworkId
      ) ?? null,
    [homeworks, selectedHomeworkId]
  );

  const classrooms = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.classroom)
          .filter(Boolean)
      )
    );
  }, [students]);

  const applicableStudents = useMemo(() => {
    if (!selectedHomework) return [];

    return students.filter((student) => {
      const belongsToHomework = homeworkAppliesToStudent(
        selectedHomework,
        student
      );

      const belongsToSelectedClass =
        classroomFilter === "الكل" ||
        student.classroom === classroomFilter;

      return belongsToHomework && belongsToSelectedClass;
    });
  }, [students, selectedHomework, classroomFilter]);

  const completedStudentIds = useMemo(() => {
    return new Set(
      completions
        .filter(
          (completion) =>
            completion.homeworkId === selectedHomeworkId &&
            completion.completed
        )
        .map((completion) => completion.studentId)
    );
  }, [completions, selectedHomeworkId]);

  const completionByStudentId = useMemo(() => {
    const map = new Map<string, Completion>();

    completions
      .filter(
        (completion) =>
          completion.homeworkId === selectedHomeworkId &&
          completion.completed
      )
      .forEach((completion) => {
        map.set(completion.studentId, completion);
      });

    return map;
  }, [completions, selectedHomeworkId]);

  const completedCount = applicableStudents.filter((student) =>
    completedStudentIds.has(student.studentId)
  ).length;

  const notCompletedCount =
    applicableStudents.length - completedCount;

  const completionPercentage =
    applicableStudents.length > 0
      ? Math.round(
          (completedCount / applicableStudents.length) * 100
        )
      : 0;

  const displayedStudents = useMemo(() => {
    return applicableStudents.filter((student) => {
      const isCompleted = completedStudentIds.has(student.studentId);

      if (statusFilter === "المنجزون") return isCompleted;
      if (statusFilter === "لم ينجزوا") return !isCompleted;

      return true;
    });
  }, [applicableStudents, completedStudentIds, statusFilter]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          جارٍ تحميل متابعة الواجبات...
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page} dir="rtl">
      <section style={styles.hero}>
        <div style={styles.icon}>📚</div>

        <div>
          <p style={styles.eyebrow}>لوحة المعلم</p>
          <h1 style={styles.title}>متابعة الواجبات</h1>
          <p style={styles.subtitle}>
            متابعة الطلاب المنجزين وغير المنجزين لكل واجب
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          style={styles.refreshButton}
        >
          تحديث البيانات 🔄
        </button>
      </section>

      {error && <div style={styles.error}>{error}</div>}

      {homeworks.length === 0 ? (
        <section style={styles.emptyCard}>
          لا توجد واجبات منشورة حاليًا.
        </section>
      ) : (
        <>
          <section style={styles.filtersCard}>
            <label style={styles.field}>
              <span style={styles.label}>اختر الواجب</span>

              <select
                value={selectedHomeworkId}
                onChange={(event) =>
                  setSelectedHomeworkId(event.target.value)
                }
                style={styles.select}
              >
                <option value={`madrasati_${new Date().toLocaleDateString("en-CA")}`}>
  🏫 جسر مدرستي
</option>
                {homeworks.map((homework) => (
                  <option key={homework.id} value={homework.id}>
                    {homework.title}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>الفصل</span>

              <select
                value={classroomFilter}
                onChange={(event) =>
                  setClassroomFilter(event.target.value)
                }
                style={styles.select}
              >
                <option value="الكل">جميع الفصول</option>

                {classrooms.map((classroom) => (
                  <option key={classroom} value={classroom}>
                    {classroom}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {selectedHomework && (
            <section style={styles.homeworkCard}>
              <div>
                <p style={styles.homeworkLabel}>الواجب المحدد</p>

                <h2 style={styles.homeworkTitle}>
                  {selectedHomework.title}
                </h2>

                <p style={styles.homeworkMeta}>
                  الفصل: {selectedHomework.targetClass || "الفصلان"}
                  {" • "}
                  الموعد النهائي:{" "}
                  {formatDate(selectedHomework.dueDate)}
                </p>

                {selectedHomework.instructions && (
                  <p style={styles.instructions}>
                    {selectedHomework.instructions}
                  </p>
                )}
              </div>

              <div style={styles.percentageCircle}>
                <strong>{completionPercentage}%</strong>
                <span>نسبة الإنجاز</span>
              </div>
            </section>
          )}

          <section style={styles.statsGrid}>
            <button
              type="button"
              onClick={() => setStatusFilter("الكل")}
              style={{
                ...styles.statCard,
                ...(statusFilter === "الكل"
                  ? styles.activeStatCard
                  : {}),
              }}
            >
              <span style={styles.statIcon}>👨‍🎓</span>
              <strong style={styles.statNumber}>
                {applicableStudents.length}
              </strong>
              <span>جميع الطلاب</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("المنجزون")}
              style={{
                ...styles.statCard,
                ...(statusFilter === "المنجزون"
                  ? styles.activeStatCard
                  : {}),
              }}
            >
              <span style={styles.statIcon}>✅</span>
              <strong style={styles.statNumber}>
                {completedCount}
              </strong>
              <span>أنجزوا الواجب</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("لم ينجزوا")}
              style={{
                ...styles.statCard,
                ...(statusFilter === "لم ينجزوا"
                  ? styles.activeStatCard
                  : {}),
              }}
            >
              <span style={styles.statIcon}>⏳</span>
              <strong style={styles.statNumber}>
                {notCompletedCount}
              </strong>
              <span>لم ينجزوا بعد</span>
            </button>
          </section>

          <section style={styles.progressCard}>
            <div style={styles.progressHeader}>
              <strong>تقدم إنجاز الواجب</strong>
              <span>
                {completedCount} من {applicableStudents.length}
              </span>
            </div>

            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </section>

          <section style={styles.studentsCard}>
            <div style={styles.studentsHeader}>
              <div>
                <h2 style={styles.studentsTitle}>
                  {statusFilter === "الكل"
                    ? "جميع الطلاب"
                    : statusFilter}
                </h2>

                <p style={styles.studentsSubtitle}>
                  عدد الطلاب المعروضين: {displayedStudents.length}
                </p>
              </div>
            </div>

            {displayedStudents.length === 0 ? (
              <div style={styles.emptyStudents}>
                لا يوجد طلاب في هذه القائمة.
              </div>
            ) : (
              <div style={styles.studentsList}>
                {displayedStudents.map((student) => {
                  const completion = completionByStudentId.get(
                    student.studentId
                  );

                  const isCompleted = Boolean(completion);

                  return (
                    <article
                      key={student.id}
                      style={{
                        ...styles.studentRow,
                        borderColor: isCompleted
                          ? "#86efac"
                          : "#e2e8f0",
                        background: isCompleted
                          ? "#f0fdf4"
                          : "#f8fafc",
                      }}
                    >
                      <div>
                        <strong style={styles.studentName}>
                          {student.studentName}
                        </strong>

                        <p style={styles.studentClassroom}>
                          {student.classroom}
                        </p>
                      </div>

                      <div style={styles.studentStatusArea}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: isCompleted
                              ? "#dcfce7"
                              : "#e2e8f0",
                            color: isCompleted
                              ? "#166534"
                              : "#475569",
                          }}
                        >
                          {isCompleted
                            ? "أنجز الواجب ✅"
                            : "لم ينجز بعد ⏳"}
                        </span>

                        {isCompleted &&
                          completion?.completedAtText && (
                            <small style={styles.completedTime}>
                              وقت الإنجاز:{" "}
                              {completion.completedAtText}
                            </small>
                          )}
                          {isCompleted && completion && (
  <button
    type="button"
    onClick={() => approveHomeworkCompletion(completion)}
    disabled={
      completion.teacherApproved ||
      approvingCompletionId === completion.id
    }
    style={{
      marginTop: "10px",
      padding: "10px 14px",
      border: "none",
      borderRadius: "12px",
      background: completion.teacherApproved
        ? "#dcfce7"
        : "#047857",
      color: completion.teacherApproved
        ? "#166534"
        : "#ffffff",
      fontWeight: 800,
      fontSize: "14px",
      cursor: completion.teacherApproved
        ? "default"
        : "pointer",
      opacity:
        approvingCompletionId === completion.id
          ? 0.7
          : 1,
    }}
  >
    {approvingCompletionId === completion.id
      ? "جارٍ الاعتماد..."
      : completion.teacherApproved
        ? "تم اعتماد الإنجاز ✅"
        : "اعتماد الإنجاز ✅"}
  </button>
)}
{isCompleted &&
  completion &&
  completion.teacherApproved && (
    <div
      style={{
        marginTop: "10px",
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      {completion.pointsAwarded ? (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            background: "#fef3c7",
            color: "#92400e",
            fontWeight: 800,
            fontSize: "14px",
          }}
        >
          تم منح {completion.pointsAwardedValue} نقاط ⭐
        </div>
      ) : (
        <>
          {[1, 5, 10].map((pointsValue) => (
            <button
              key={pointsValue}
              type="button"
              onClick={() =>
                awardHomeworkPoints(
                  completion,
                  pointsValue
                )
              }
              disabled={
                awardingPointsCompletionId ===
                completion.id
              }
              style={{
                padding: "10px 14px",
                border: "none",
                borderRadius: "12px",
                background:
                  pointsValue === 10
                    ? "#7c3aed"
                    : pointsValue === 5
                      ? "#d97706"
                      : "#2563eb",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14px",
                cursor: "pointer",
                opacity:
                  awardingPointsCompletionId ===
                  completion.id
                    ? 0.7
                    : 1,
              }}
            >
              {awardingPointsCompletionId ===
              completion.id
                ? "جارٍ الحفظ..."
                : pointsValue === 1
                  ? "⭐ +1"
                  : pointsValue === 5
                    ? "🌟 +5"
                    : "👑 +10"}
            </button>
          ))}
        </>
      )}
    </div>
  )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f0fdf8 0%, #f8fafc 45%, #ffffff 100%)",
    padding: "32px 18px 70px",
    color: "#0f172a",
    fontFamily: "inherit",
  },

  hero: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    background: "white",
    border: "1px solid #d1fae5",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    boxShadow: "0 14px 35px rgba(15, 118, 110, 0.08)",
  },

  icon: {
    width: "80px",
    height: "80px",
    borderRadius: "24px",
    background: "#059669",
    display: "grid",
    placeItems: "center",
    fontSize: "38px",
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#047857",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 48px)",
    color: "#064e3b",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.8,
  },

  refreshButton: {
    marginInlineStart: "auto",
    border: "none",
    borderRadius: "16px",
    background: "#047857",
    color: "white",
    padding: "13px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  loadingCard: {
    maxWidth: "700px",
    margin: "80px auto",
    background: "white",
    borderRadius: "24px",
    padding: "30px",
    textAlign: "center",
    fontWeight: 800,
  },

  error: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "16px",
    borderRadius: "18px",
    fontWeight: 700,
  },

  emptyCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "white",
    borderRadius: "24px",
    padding: "35px",
    textAlign: "center",
    fontWeight: 800,
  },

  filtersCard: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    background: "white",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "16px",
  },

  field: {
    display: "grid",
    gap: "8px",
  },

  label: {
    fontWeight: 800,
    color: "#334155",
  },

  select: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "13px",
    fontSize: "16px",
    background: "white",
  },

  homeworkCard: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    background: "white",
    border: "1px solid #a7f3d0",
    borderRadius: "26px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  homeworkLabel: {
    margin: "0 0 5px",
    color: "#059669",
    fontWeight: 800,
  },

  homeworkTitle: {
    margin: 0,
    color: "#064e3b",
    fontSize: "28px",
  },

  homeworkMeta: {
    color: "#64748b",
    fontWeight: 700,
  },

  instructions: {
    color: "#334155",
    lineHeight: 1.8,
  },

  percentageCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "#ecfdf5",
    border: "10px solid #10b981",
    display: "grid",
    placeContent: "center",
    textAlign: "center",
    color: "#065f46",
  },

  statsGrid: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },

  statCard: {
    border: "1px solid #dbeafe",
    background: "white",
    borderRadius: "22px",
    padding: "20px",
    display: "grid",
    justifyItems: "center",
    gap: "7px",
    cursor: "pointer",
    fontSize: "16px",
    color: "#334155",
  },

  activeStatCard: {
    border: "2px solid #10b981",
    background: "#ecfdf5",
  },

  statIcon: {
    fontSize: "28px",
  },

  statNumber: {
    fontSize: "30px",
    color: "#065f46",
  },

  progressCard: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    background: "white",
    borderRadius: "22px",
    padding: "20px",
    border: "1px solid #dbeafe",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },

  progressTrack: {
    height: "16px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #10b981, #059669)",
    transition: "width 0.4s ease",
  },

  studentsCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "white",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid #dbeafe",
  },

  studentsHeader: {
    marginBottom: "18px",
  },

  studentsTitle: {
    margin: 0,
    color: "#064e3b",
  },

  studentsSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
  },

  studentsList: {
    display: "grid",
    gap: "12px",
  },

  studentRow: {
    border: "1px solid",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
  },

  studentName: {
    fontSize: "18px",
  },

  studentClassroom: {
    margin: "5px 0 0",
    color: "#64748b",
  },

  studentStatusArea: {
    display: "grid",
    justifyItems: "end",
    gap: "7px",
  },

  statusBadge: {
    borderRadius: "999px",
    padding: "8px 13px",
    fontWeight: 800,
  },

  completedTime: {
    color: "#64748b",
  },

  emptyStudents: {
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
    fontWeight: 700,
  },
};