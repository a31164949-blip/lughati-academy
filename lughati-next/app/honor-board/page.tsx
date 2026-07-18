"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../firebase";

type StudentReward = {
  id: string;
  studentName: string;
  classroom: string;
  points: number;
  stars: number;
};

export default function HonorBoardPage() {
  const [students, setStudents] = useState<StudentReward[]>([]);
  const [selectedClass, setSelectedClass] = useState("الجميع");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        setErrorMessage("");

        const studentsQuery = query(
          collection(db, "students"),
          orderBy("points", "desc")
        );

        const snapshot = await getDocs(studentsQuery);

        const loadedStudents: StudentReward[] =
          snapshot.docs.map((studentDocument) => {
            const data = studentDocument.data();

            return {
              id: studentDocument.id,
              studentName:
                typeof data.studentName === "string"
                  ? data.studentName
                  : "طالب",
              classroom:
                typeof data.classroom === "string"
                  ? data.classroom
                  : "غير محدد",
              points:
                typeof data.points === "number"
                  ? data.points
                  : 0,
              stars:
                typeof data.stars === "number"
                  ? data.stars
                  : 0,
            };
          });

        loadedStudents.sort((firstStudent, secondStudent) => {
          if (secondStudent.points !== firstStudent.points) {
            return secondStudent.points - firstStudent.points;
          }

          return secondStudent.stars - firstStudent.stars;
        });

        setStudents(loadedStudents);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "تعذر تحميل لوحة الشرف. تحقق من الاتصال ثم حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (selectedClass === "الجميع") {
      return students;
    }

    return students.filter(
      (student) => student.classroom === selectedClass
    );
  }, [students, selectedClass]);

  const topThree = filteredStudents.slice(0, 3);
  const remainingStudents = filteredStudents.slice(3);

  function getMedal(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "⭐";
  }

  return (
    <main style={styles.page} dir="rtl">
      <section style={styles.hero}>
        <div style={styles.heroIcon}>🏆</div>

        <div>
          <p style={styles.eyebrow}>أكاديمية لغتي الرقمية</p>
          <h1 style={styles.title}>لوحة الشرف</h1>
          <p style={styles.subtitle}>
            نحتفي باجتهاد الطلاب وإنجازاتهم ونجومهم.
          </p>
        </div>
      </section>

      <section style={styles.filterCard}>
        <label style={styles.label}>اختر الفصل</label>

        <select
          value={selectedClass}
          onChange={(event) =>
            setSelectedClass(event.target.value)
          }
          style={styles.select}
        >
          <option value="الجميع">جميع الفصول</option>
          <option value="الثاني أ">الثاني أ</option>
          <option value="الثاني ب">الثاني ب</option>
        </select>
      </section>

      {loading && (
        <section style={styles.messageCard}>
          جارٍ تحميل نجوم الطلاب...
        </section>
      )}

      {errorMessage && (
        <section style={styles.errorCard}>
          {errorMessage}
        </section>
      )}

      {!loading &&
        !errorMessage &&
        filteredStudents.length === 0 && (
          <section style={styles.messageCard}>
            لا توجد بيانات مكافآت لهذا الفصل حتى الآن.
          </section>
        )}

      {!loading &&
        !errorMessage &&
        filteredStudents.length > 0 && (
          <>
            <section style={styles.podiumSection}>
              <div style={styles.sectionHeading}>
                <p style={styles.eyebrow}>نجوم الأكاديمية</p>
                <h2 style={styles.sectionTitle}>
                  المراكز الثلاثة الأولى
                </h2>
              </div>

              <div style={styles.podiumGrid}>
                {topThree.map((student, index) => (
                  <article
                    key={student.id}
                    style={styles.podiumCard}
                  >
                    <div style={styles.medal}>
                      {getMedal(index)}
                    </div>

                    <p style={styles.rankText}>
                      المركز {index + 1}
                    </p>

                    <h3 style={styles.studentName}>
                      {student.studentName}
                    </h3>

                    <p style={styles.classroom}>
                      {student.classroom}
                    </p>

                    <div style={styles.rewardRow}>
                      <span>{student.stars} ⭐</span>
                      <span>{student.points} نقطة</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {remainingStudents.length > 0 && (
              <section style={styles.listSection}>
                <div style={styles.sectionHeading}>
                  <p style={styles.eyebrow}>بقية المتميزين</p>
                  <h2 style={styles.sectionTitle}>
                    ترتيب الطلاب
                  </h2>
                </div>

                <div style={styles.studentList}>
                  {remainingStudents.map(
                    (student, index) => (
                      <article
                        key={student.id}
                        style={styles.studentRow}
                      >
                        <div style={styles.rankCircle}>
                          {index + 4}
                        </div>

                        <div style={styles.studentDetails}>
                          <h3 style={styles.rowStudentName}>
                            {student.studentName}
                          </h3>
                          <p style={styles.classroom}>
                            {student.classroom}
                          </p>
                        </div>

                        <div style={styles.rowRewards}>
                          <span>{student.stars} ⭐</span>
                          <strong>
                            {student.points} نقطة
                          </strong>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>
            )}
          </>
        )}

      <section style={styles.noteCard}>
        <div style={styles.noteIcon}>🌟</div>

        <div>
          <h3 style={styles.noteTitle}>
            كل طالب يستطيع الوصول
          </h3>
          <p style={styles.noteText}>
            لوحة الشرف تتغير مع كل واجب وإنجاز جديد،
            والاجتهاد هو طريق التقدم.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f2fbf7 0%, #ffffff 100%)",
    color: "#154f3d",
    fontFamily: "Arial, sans-serif",
  },

  hero: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "30px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    borderRadius: "28px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
    boxShadow: "0 12px 30px rgba(21, 79, 61, 0.08)",
  },

  heroIcon: {
    width: "96px",
    height: "96px",
    display: "grid",
    placeItems: "center",
    borderRadius: "26px",
    background: "#15936d",
    fontSize: "48px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#168c68",
    fontSize: "18px",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    fontSize: "44px",
    color: "#123f32",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#648579",
    fontSize: "18px",
    lineHeight: 1.8,
  },

  filterCard: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "22px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    fontSize: "18px",
    fontWeight: 800,
  },

  select: {
    width: "100%",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #badbcc",
    background: "#fbfefd",
    color: "#154f3d",
    fontSize: "18px",
    fontWeight: 700,
  },

  messageCard: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "28px",
    textAlign: "center",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
    fontSize: "20px",
    fontWeight: 700,
  },

  errorCard: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "24px",
    textAlign: "center",
    borderRadius: "24px",
    background: "#fff0f0",
    border: "1px solid #f1c2c2",
    color: "#9c3434",
    fontSize: "18px",
    fontWeight: 700,
  },

  podiumSection: {
    maxWidth: "1100px",
    margin: "0 auto 32px",
  },

  sectionHeading: {
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#123f32",
  },

  podiumGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  podiumCard: {
    padding: "26px",
    textAlign: "center",
    borderRadius: "26px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
    boxShadow: "0 10px 24px rgba(21, 79, 61, 0.07)",
  },

  medal: {
    fontSize: "54px",
  },

  rankText: {
    margin: "8px 0",
    color: "#8a6b16",
    fontWeight: 800,
  },

  studentName: {
    margin: "8px 0",
    fontSize: "28px",
    color: "#123f32",
  },

  classroom: {
    margin: 0,
    color: "#789289",
    fontWeight: 700,
  },

  rewardRow: {
    marginTop: "18px",
    padding: "13px",
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    borderRadius: "16px",
    background: "#effaf5",
    color: "#147d5e",
    fontWeight: 900,
  },

  listSection: {
    maxWidth: "1100px",
    margin: "0 auto 32px",
  },

  studentList: {
    display: "grid",
    gap: "12px",
  },

  studentRow: {
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "60px 1fr auto",
    alignItems: "center",
    gap: "16px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
  },

  rankCircle: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#e4f6ee",
    color: "#148660",
    fontWeight: 900,
    fontSize: "20px",
  },

  studentDetails: {
    minWidth: 0,
  },

  rowStudentName: {
    margin: "0 0 5px",
    fontSize: "21px",
    color: "#123f32",
  },

  rowRewards: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "5px",
    color: "#168c68",
  },

  noteCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef9f4",
    border: "1px solid #cfe5da",
  },

  noteIcon: {
    fontSize: "40px",
  },

  noteTitle: {
    margin: "0 0 6px",
    color: "#154f3d",
  },

  noteText: {
    margin: 0,
    color: "#5d7e73",
    lineHeight: 1.8,
  },
};