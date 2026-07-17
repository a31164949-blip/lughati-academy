"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type ClassroomFilter = "الكل" | "الثاني أ" | "الثاني ب";
type StatusFilter = "الكل" | "لم يؤكد" | "بانتظار المراجعة" | "تمت المراجعة";

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
  dueDate: string;
  published: boolean;
  createdAtMilliseconds: number;
};

type Completion = {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  method: string;
  completed: boolean;
  completedAtText: string;
  teacherReviewed: boolean;
};

type StudentHomeworkRow = {
  studentId: string;
  studentName: string;
  classroom: string;
  completionId: string;
  completed: boolean;
  method: string;
  completedAtText: string;
  teacherReviewed: boolean;
  status: "لم يؤكد" | "بانتظار المراجعة" | "تمت المراجعة";
};

export default function HomeworkTrackingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);

  const [selectedHomeworkId, setSelectedHomeworkId] = useState("");
  const [classroomFilter, setClassroomFilter] =
    useState<ClassroomFilter>("الكل");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("الكل");
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [studentsSnapshot, homeworksSnapshot, completionsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "homeworks")),
          getDocs(collection(db, "homeworkCompletions")),
        ]);

      const loadedStudents: Student[] = studentsSnapshot.docs
        .map((studentDocument) => {
          const data = studentDocument.data();

          return {
            id: studentDocument.id,
            studentId: data.studentId || studentDocument.id,
            studentName: data.studentName || "طالب",
            classroom: data.classroom || "",
            active: data.active !== false,
          };
        })
        .filter((student) => student.active)
        .sort((first, second) =>
          first.studentId.localeCompare(second.studentId)
        );

      const loadedHomeworks: Homework[] = homeworksSnapshot.docs
        .map((homeworkDocument) => {
          const data = homeworkDocument.data();

          return {
            id: homeworkDocument.id,
            title: data.title || "واجب دون عنوان",
            instructions: data.instructions || "",
            targetClass: data.targetClass || "الفصلان",
            dueDate: data.dueDate || "",
            published: data.published === true,
            createdAtMilliseconds:
              data.createdAt?.toMillis?.() ||
              data.updatedAt?.toMillis?.() ||
              0,
          };
        })
        .sort(
          (first, second) =>
            second.createdAtMilliseconds -
            first.createdAtMilliseconds
        );

      const loadedCompletions: Completion[] =
        completionsSnapshot.docs.map((completionDocument) => {
          const data = completionDocument.data();

          return {
            id: completionDocument.id,
            homeworkId: data.homeworkId || "",
            studentId: data.studentId || "",
            studentName: data.studentName || "طالب",
            classroom: data.classroom || "",
            method: data.method || "",
            completed: data.completed === true,
            completedAtText: data.completedAtText || "",
            teacherReviewed: data.teacherReviewed === true,
          };
        });

      setStudents(loadedStudents);
      setHomeworks(loadedHomeworks);
      setCompletions(loadedCompletions);

      setSelectedHomeworkId((currentId) => {
        const currentStillExists = loadedHomeworks.some(
          (homework) => homework.id === currentId
        );

        if (currentStillExists) return currentId;

        return loadedHomeworks[0]?.id || "";
      });
    } catch (loadError) {
      console.error(loadError);
      setError("تعذر تحميل بيانات الطلاب والواجبات من Firebase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedHomework = useMemo(
    () =>
      homeworks.find(
        (homework) => homework.id === selectedHomeworkId
      ) || null,
    [homeworks, selectedHomeworkId]
  );

  const eligibleStudents = useMemo(() => {
    if (!selectedHomework) return [];

    return students.filter((student) => {
      if (selectedHomework.targetClass === "الفصلان") {
        return (
          student.classroom === "الثاني أ" ||
          student.classroom === "الثاني ب"
        );
      }

      return student.classroom === selectedHomework.targetClass;
    });
  }, [students, selectedHomework]);

  const studentRows = useMemo<StudentHomeworkRow[]>(() => {
    return eligibleStudents.map((student) => {
      const completion = completions.find(
        (item) =>
          item.homeworkId === selectedHomeworkId &&
          item.studentId === student.studentId
      );

      if (!completion) {
        return {
          studentId: student.studentId,
          studentName: student.studentName,
          classroom: student.classroom,
          completionId: "",
          completed: false,
          method: "",
          completedAtText: "",
          teacherReviewed: false,
          status: "لم يؤكد",
        };
      }

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        classroom: student.classroom,
        completionId: completion.id,
        completed: completion.completed,
        method: completion.method,
        completedAtText: completion.completedAtText,
        teacherReviewed: completion.teacherReviewed,
        status: completion.teacherReviewed
          ? "تمت المراجعة"
          : "بانتظار المراجعة",
      };
    });
  }, [eligibleStudents, completions, selectedHomeworkId]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return studentRows.filter((row) => {
      const matchesClassroom =
        classroomFilter === "الكل" ||
        row.classroom === classroomFilter;

      const matchesStatus =
        statusFilter === "الكل" || row.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        row.studentName.toLowerCase().includes(normalizedSearch) ||
        row.studentId.toLowerCase().includes(normalizedSearch);

      return matchesClassroom && matchesStatus && matchesSearch;
    });
  }, [studentRows, classroomFilter, statusFilter, searchText]);

  const totalCount = studentRows.length;
  const completedCount = studentRows.filter(
    (row) => row.completed
  ).length;
  const pendingReviewCount = studentRows.filter(
    (row) => row.status === "بانتظار المراجعة"
  ).length;
  const reviewedCount = studentRows.filter(
    (row) => row.status === "تمت المراجعة"
  ).length;
  const notConfirmedCount = studentRows.filter(
    (row) => row.status === "لم يؤكد"
  ).length;

  const completionPercentage =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  const classAStudents = studentRows.filter(
    (row) => row.classroom === "الثاني أ"
  );
  const classBStudents = studentRows.filter(
    (row) => row.classroom === "الثاني ب"
  );

  const classACompleted = classAStudents.filter(
    (row) => row.completed
  ).length;
  const classBCompleted = classBStudents.filter(
    (row) => row.completed
  ).length;

  const classAPercentage =
    classAStudents.length > 0
      ? Math.round(
          (classACompleted / classAStudents.length) * 100
        )
      : 0;

  const classBPercentage =
    classBStudents.length > 0
      ? Math.round(
          (classBCompleted / classBStudents.length) * 100
        )
      : 0;

  async function toggleReviewed(row: StudentHomeworkRow) {
    if (!row.completionId) return;

    try {
      setUpdatingId(row.completionId);
      setError("");
      setMessage("جاري تحديث حالة المراجعة...");

      const newReviewedStatus = !row.teacherReviewed;

      await updateDoc(
        doc(db, "homeworkCompletions", row.completionId),
        {
          teacherReviewed: newReviewedStatus,
          teacherReviewedAt: newReviewedStatus
            ? serverTimestamp()
            : null,
          updatedAt: serverTimestamp(),
        }
      );

      setCompletions((currentCompletions) =>
        currentCompletions.map((completion) =>
          completion.id === row.completionId
            ? {
                ...completion,
                teacherReviewed: newReviewedStatus,
              }
            : completion
        )
      );

      setMessage(
        newReviewedStatus
          ? `تمت مراجعة إنجاز ${row.studentName} ✅`
          : `تم إلغاء مراجعة إنجاز ${row.studentName}.`
      );
    } catch (updateError) {
      console.error(updateError);
      setError("تعذر تحديث حالة المراجعة.");
    } finally {
      setUpdatingId("");
    }
  }

  function formatDueDate(dateValue: string) {
    if (!dateValue) return "غير محدد";

    const date = new Date(`${dateValue}T12:00:00`);

    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div style={styles.headerIcon}>📋</div>

        <div>
          <p style={styles.smallTitle}>لوحة المعلم</p>

          <h1 style={styles.title}>متابعة إنجاز الواجبات</h1>

          <p style={styles.subtitle}>
            متابعة جميع الطلاب، بمن فيهم من لم يؤكد إنجاز الواجب.
          </p>
        </div>
      </section>

      <section style={styles.controlsCard}>
        <div style={styles.controlsGrid}>
          <label style={styles.label}>
            اختر الواجب
            <select
              value={selectedHomeworkId}
              onChange={(event) => {
                setSelectedHomeworkId(event.target.value);
                setClassroomFilter("الكل");
                setStatusFilter("الكل");
                setSearchText("");
                setMessage("");
              }}
              style={styles.input}
            >
              {homeworks.length === 0 && (
                <option value="">لا توجد واجبات</option>
              )}

              {homeworks.map((homework) => (
                <option key={homework.id} value={homework.id}>
                  {homework.title}
                  {homework.published ? " — منشور" : " — غير منشور"}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            الفصل
            <select
              value={classroomFilter}
              onChange={(event) =>
                setClassroomFilter(
                  event.target.value as ClassroomFilter
                )
              }
              style={styles.input}
            >
              <option value="الكل">جميع الفصول</option>
              <option value="الثاني أ">الثاني أ</option>
              <option value="الثاني ب">الثاني ب</option>
            </select>
          </label>

          <label style={styles.label}>
            حالة الطالب
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              style={styles.input}
            >
              <option value="الكل">جميع الحالات</option>
              <option value="لم يؤكد">لم يؤكد الإنجاز</option>
              <option value="بانتظار المراجعة">
                بانتظار المراجعة
              </option>
              <option value="تمت المراجعة">
                تمت المراجعة
              </option>
            </select>
          </label>

          <label style={styles.label}>
            البحث عن طالب
            <input
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="اكتب اسم الطالب"
              style={styles.input}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={loadData}
          style={styles.refreshButton}
        >
          تحديث البيانات
        </button>
      </section>

      {selectedHomework && (
        <section style={styles.homeworkSummary}>
          <div>
            <p style={styles.sectionLabel}>الواجب المحدد</p>

            <h2 style={styles.homeworkTitle}>
              {selectedHomework.title}
            </h2>

            <p style={styles.homeworkInstructions}>
              {selectedHomework.instructions}
            </p>
          </div>

          <div style={styles.homeworkMeta}>
            <span>
              الفصل:{" "}
              {selectedHomework.targetClass === "الفصلان"
                ? "الثاني أ والثاني ب"
                : selectedHomework.targetClass}
            </span>

            <span>
              تاريخ الاستحقاق:{" "}
              {formatDueDate(selectedHomework.dueDate)}
            </span>

            <span>
              {selectedHomework.published
                ? "منشور للطلاب ✅"
                : "غير منشور"}
            </span>
          </div>
        </section>
      )}

      <section style={styles.statistics}>
        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{totalCount}</strong>
          <span style={styles.statLabel}>الطلاب المستهدفون</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{completedCount}</strong>
          <span style={styles.statLabel}>أكدوا الإنجاز</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {notConfirmedCount}
          </strong>
          <span style={styles.statLabel}>لم يؤكدوا</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {pendingReviewCount}
          </strong>
          <span style={styles.statLabel}>بانتظار المراجعة</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{reviewedCount}</strong>
          <span style={styles.statLabel}>تمت مراجعتهم</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {completionPercentage}%
          </strong>
          <span style={styles.statLabel}>نسبة الإنجاز</span>
        </article>
      </section>

      <section style={styles.classProgressCard}>
        <div style={styles.progressItem}>
          <div style={styles.progressHeading}>
            <strong>الثاني أ</strong>
            <span>
              {classACompleted} من {classAStudents.length} —{" "}
              {classAPercentage}%
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${classAPercentage}%`,
              }}
            />
          </div>
        </div>

        <div style={styles.progressItem}>
          <div style={styles.progressHeading}>
            <strong>الثاني ب</strong>
            <span>
              {classBCompleted} من {classBStudents.length} —{" "}
              {classBPercentage}%
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${classBPercentage}%`,
              }}
            />
          </div>
        </div>
      </section>

      {message && <div style={styles.successMessage}>{message}</div>}
      {error && <div style={styles.errorMessage}>{error}</div>}

      <section style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <p style={styles.sectionLabel}>سجل الطلاب</p>
            <h2 style={styles.listTitle}>
              حالات إنجاز الواجب
            </h2>
          </div>

          <span style={styles.resultsCount}>
            النتائج الظاهرة: {filteredRows.length}
          </span>
        </div>

        {loading && (
          <div style={styles.emptyState}>
            جاري تحميل بيانات الطلاب...
          </div>
        )}

        {!loading && !selectedHomework && (
          <div style={styles.emptyState}>
            أنشئ واجبًا أولًا من صفحة إدارة الواجبات.
          </div>
        )}

        {!loading &&
          selectedHomework &&
          filteredRows.length === 0 && (
            <div style={styles.emptyState}>
              لا توجد نتائج مطابقة للفلاتر الحالية.
            </div>
          )}

        <div style={styles.studentsGrid}>
          {filteredRows.map((row) => (
            <article key={row.studentId} style={styles.studentRowCard}>
              <div style={styles.studentTop}>
                <div>
                  <p style={styles.classroom}>
                    {row.classroom}
                  </p>

                  <h3 style={styles.studentName}>
                    {row.studentName}
                  </h3>

                  <span style={styles.studentId}>
                    {row.studentId}
                  </span>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    background:
                      row.status === "تمت المراجعة"
                        ? "#dcfce7"
                        : row.status === "بانتظار المراجعة"
                        ? "#fff3cd"
                        : "#feecec",
                    color:
                      row.status === "تمت المراجعة"
                        ? "#166534"
                        : row.status === "بانتظار المراجعة"
                        ? "#806000"
                        : "#993232",
                  }}
                >
                  {row.status === "تمت المراجعة"
                    ? "تمت المراجعة ✅"
                    : row.status === "بانتظار المراجعة"
                    ? "بانتظار المراجعة ⏳"
                    : "لم يؤكد الإنجاز"}
                </span>
              </div>

              {row.completed ? (
                <div style={styles.completionDetails}>
                  <p>
                    <strong>طريقة الإنجاز:</strong>{" "}
                    {row.method || "غير محددة"}
                  </p>

                  <p>
                    <strong>وقت التأكيد:</strong>{" "}
                    {row.completedAtText || "غير محدد"}
                  </p>

                  <p>
                    <strong>حالة الطالب:</strong> تم تأكيد الإنجاز
                    ✅
                  </p>
                </div>
              ) : (
                <div style={styles.notCompletedBox}>
                  لم يضغط الطالب زر «أتممت حل الواجب» حتى الآن.
                </div>
              )}

              {row.completed && (
                <button
                  type="button"
                  disabled={updatingId === row.completionId}
                  onClick={() => toggleReviewed(row)}
                  style={{
                    ...styles.reviewButton,
                    background: row.teacherReviewed
                      ? "#ffffff"
                      : "#16845f",
                    color: row.teacherReviewed
                      ? "#356858"
                      : "#ffffff",
                    border: row.teacherReviewed
                      ? "1px solid #c5ded2"
                      : "none",
                    opacity:
                      updatingId === row.completionId ? 0.6 : 1,
                  }}
                >
                  {updatingId === row.completionId
                    ? "جاري التحديث..."
                    : row.teacherReviewed
                    ? "إلغاء المراجعة"
                    : "تمت المراجعة"}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section style={styles.noteCard}>
        <span style={styles.noteIcon}>🛡️</span>

        <div>
          <h3 style={styles.noteTitle}>تنبيه مهم</h3>

          <p style={styles.noteText}>
            تأكيد الطالب يعني أنه صرّح بإنجاز الواجب، ولا يعني صحة
            الإجابات إلا بعد مراجعة المعلم.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px 18px 50px",
    background:
      "linear-gradient(180deg, #f3faf6 0%, #edf7f2 55%, #ffffff 100%)",
    color: "#143f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "27px",
    boxShadow: "0 12px 35px rgba(25, 104, 76, 0.08)",
  },

  headerIcon: {
    width: "78px",
    height: "78px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "23px",
    background: "#16845f",
    fontSize: "39px",
  },

  smallTitle: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(27px, 4vw, 40px)",
  },

  subtitle: {
    margin: 0,
    color: "#607a70",
    lineHeight: 1.8,
  },

  controlsCard: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "24px",
  },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "15px",
  },

  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 900,
    color: "#234f40",
  },

  input: {
    width: "100%",
    padding: "14px",
    border: "2px solid #d5e8df",
    borderRadius: "15px",
    background: "#fbfefc",
    color: "#143f32",
    fontSize: "16px",
    outline: "none",
  },

  refreshButton: {
    width: "100%",
    marginTop: "17px",
    padding: "14px",
    border: "none",
    borderRadius: "15px",
    background: "#16845f",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "17px",
    cursor: "pointer",
  },

  homeworkSummary: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "24px",
  },

  sectionLabel: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  homeworkTitle: {
    margin: "0 0 8px",
    fontSize: "clamp(24px, 4vw, 33px)",
  },

  homeworkInstructions: {
    margin: 0,
    color: "#5b756b",
    lineHeight: 1.8,
  },

  homeworkMeta: {
    display: "grid",
    alignContent: "center",
    gap: "8px",
    color: "#45685b",
    fontWeight: 700,
  },

  statistics: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "13px",
  },

  statCard: {
    padding: "21px 12px",
    display: "grid",
    placeItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "21px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "34px",
    color: "#16845f",
  },

  statLabel: {
    color: "#587368",
    fontWeight: 800,
  },

  classProgressCard: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "24px",
    display: "grid",
    gap: "21px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "24px",
  },

  progressItem: {
    display: "grid",
    gap: "9px",
  },

  progressHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    color: "#285b49",
  },

  progressTrack: {
    width: "100%",
    height: "14px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#e2eee8",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "#16845f",
    transition: "width 0.3s ease",
  },

  successMessage: {
    maxWidth: "1160px",
    margin: "0 auto 18px",
    padding: "16px",
    borderRadius: "16px",
    background: "#e8f8ef",
    color: "#17603f",
    fontWeight: 800,
  },

  errorMessage: {
    maxWidth: "1160px",
    margin: "0 auto 18px",
    padding: "16px",
    borderRadius: "16px",
    background: "#feecec",
    color: "#983434",
    fontWeight: 800,
  },

  listCard: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "25px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "27px",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.08)",
  },

  listHeader: {
    marginBottom: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
  },

  listTitle: {
    margin: 0,
    fontSize: "clamp(25px, 4vw, 34px)",
  },

  resultsCount: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eef8f3",
    color: "#376a57",
    fontWeight: 800,
  },

  emptyState: {
    padding: "27px",
    borderRadius: "18px",
    background: "#f1f8f5",
    textAlign: "center",
    color: "#597469",
    fontWeight: 800,
  },

  studentsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },

  studentRowCard: {
    padding: "20px",
    borderRadius: "21px",
    border: "1px solid #d6e9e0",
    background: "#fbfefc",
  },

  studentTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  classroom: {
    margin: "0 0 5px",
    color: "#16845f",
    fontWeight: 800,
  },

  studentName: {
    margin: "0 0 5px",
    fontSize: "23px",
  },

  studentId: {
    color: "#7a8e86",
    fontSize: "14px",
  },

  statusBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: 800,
  },

  completionDetails: {
    marginTop: "17px",
    padding: "15px",
    borderRadius: "16px",
    background: "#f0f8f4",
    color: "#4a695e",
    lineHeight: 1.8,
  },

  notCompletedBox: {
    marginTop: "17px",
    padding: "17px",
    borderRadius: "16px",
    background: "#fff1f1",
    color: "#8c3c3c",
    lineHeight: 1.8,
    fontWeight: 700,
  },

  reviewButton: {
    width: "100%",
    marginTop: "16px",
    padding: "13px",
    borderRadius: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  noteCard: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef7f3",
    border: "1px solid #cfe5da",
  },

  noteIcon: {
    fontSize: "38px",
  },

  noteTitle: {
    margin: "0 0 6px",
  },

  noteText: {
    margin: 0,
    color: "#5c776c",
    lineHeight: 1.8,
  },
};