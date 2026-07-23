"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
  points: number;
  streakDays: number;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("الكل");

  async function loadStudents() {
    try {
      setLoading(true);
      setMessage("");

      const snapshot = await getDocs(collection(db, "students"));

      const loadedStudents = snapshot.docs.map((studentDoc) => {
        const data = studentDoc.data();

        return {
          id: studentDoc.id,
          studentId: String(data.studentId ?? studentDoc.id),
          studentName: String(
            data.studentName ?? data.name ?? "طالب دون اسم"
          ),
          classroom: String(data.classroom ?? "غير محدد"),
          active: data.active !== false && data.archived !== true,
          points: Number(data.points ?? 0),
          streakDays: Number(data.streakDays ?? 0),
        };
      });

      loadedStudents.sort((a, b) =>
        a.studentName.localeCompare(b.studentName, "ar")
      );

      setStudents(loadedStudents);
    } catch (error) {
      console.error(error);
      setMessage("❌ تعذر تحميل بيانات الطلاب.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  const activeStudents = students.filter((student) => student.active);

  const visibleStudents = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return activeStudents.filter((student) => {
      const matchesSearch =
        search === "" ||
        student.studentName.toLowerCase().includes(search) ||
        student.studentId.toLowerCase().includes(search);

      const matchesClass =
        classFilter === "الكل" || student.classroom === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [activeStudents, searchText, classFilter]);

  const totalPoints = activeStudents.reduce(
    (total, student) => total + student.points,
    0
  );

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>أكاديمية لغتي الرقمية</p>
          <h1 style={styles.title}>👨‍🎓 إدارة الطلاب</h1>
          <p style={styles.subtitle}>
            متابعة الطلاب والفصول والمواظبة والنقاط.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStudents()}
          style={styles.refreshButton}
        >
          🔄 تحديث
        </button>
      </section>

      <section style={styles.statsGrid}>
        <StatCard
          icon="👨‍🎓"
          title="عدد الطلاب"
          value={activeStudents.length}
        />

        <StatCard
          icon="🏫"
          title="عدد الفصول"
          value={
            new Set(activeStudents.map((student) => student.classroom)).size
          }
        />

        <StatCard
          icon="⭐"
          title="إجمالي النقاط"
          value={totalPoints}
        />
      </section>

      <section style={styles.tools}>
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="ابحث باسم الطالب أو رقمه"
          style={styles.input}
        />

        <select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          style={styles.select}
        >
          <option value="الكل">جميع الفصول</option>
          <option value="الفصل الأول">الفصل الأول</option>
          <option value="الفصل الثاني">الفصل الثاني</option>
        </select>
      </section>

      {message && <div style={styles.message}>{message}</div>}

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>قائمة الطلاب</h2>

        {loading ? (
          <div style={styles.empty}>⏳ جارٍ تحميل الطلاب...</div>
        ) : visibleStudents.length === 0 ? (
          <div style={styles.empty}>لا توجد نتائج.</div>
        ) : (
          <div style={styles.list}>
            {visibleStudents.map((student) => (
              <article key={student.id} style={styles.studentCard}>
  <div style={styles.studentMain}>
    <div style={styles.avatar}>
      {student.studentName.charAt(0)}
    </div>

    <div>
      <a
        href={`/teacher/students/${student.id}`}
        style={styles.studentLink}
      >
        {student.studentName}
      </a>

      <p style={styles.studentMeta}>
        {student.classroom} • {student.studentId}
      </p>
    </div>
  </div>

  <div style={styles.details}>
    <span>🔥 {student.streakDays} أيام</span>
    <span>⭐ {student.points} نقطة</span>
  </div>
</article>
            ))}
          </div>
        )}
      </section>
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
    <article style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>

      <div>
        <p style={styles.statTitle}>{title}</p>
        <strong style={styles.statValue}>{value}</strong>
      </div>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    padding: "24px",
    borderRadius: "22px",
    background: "linear-gradient(135deg, #166534, #15803d)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#dcfce7",
    fontWeight: 700,
  },

  title: {
    margin: 0,
    fontSize: "34px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#ecfdf5",
  },

  refreshButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#166534",
    fontWeight: 800,
    cursor: "pointer",
  },

  statsGrid: {
    maxWidth: "1100px",
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },

  statCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#ecfdf5",
    display: "grid",
    placeItems: "center",
    fontSize: "24px",
  },

  statTitle: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  statValue: {
    color: "#166534",
    fontSize: "26px",
  },

  tools: {
    maxWidth: "1100px",
    margin: "0 auto 16px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  input: {
    flex: "1 1 300px",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "13px",
    fontSize: "15px",
  },

  select: {
    minWidth: "170px",
    padding: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: "13px",
    background: "#ffffff",
    fontSize: "15px",
  },

  message: {
    maxWidth: "1100px",
    margin: "0 auto 16px",
    padding: "13px",
    borderRadius: "12px",
    background: "#fef2f2",
    color: "#b91c1c",
  },

  card: {
    maxWidth: "1100px",
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  },

  cardTitle: {
    margin: 0,
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
    color: "#163b32",
  },

  list: {
    display: "grid",
  },

  studentCard: {
    padding: "16px 20px",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  studentMain: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#166534",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    fontWeight: 900,
  },

  studentName: {
    margin: 0,
    color: "#163b32",
    fontSize: "17px",
  },
studentLink: {
  color: "#163b32",
  fontSize: "17px",
  fontWeight: 800,
  textDecoration: "none",
},
  studentMeta: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  details: {
    display: "flex",
    gap: "16px",
    color: "#334155",
    fontWeight: 700,
    flexWrap: "wrap",
  },

  empty: {
    padding: "50px 20px",
    color: "#64748b",
    textAlign: "center",
  },
};