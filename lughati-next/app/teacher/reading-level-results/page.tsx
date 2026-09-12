"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { auth } from "../../../firebase";

type SkillSummary = {
  skill?: string;
  correct?: number;
  total?: number;
  status?: string;
};

type ResultItem = {
  studentDocId: string;
  studentName: string;
  classroom: string;
  score: number;
  total: number;
  level: string;
  skillSummaries: SkillSummary[];
  completedAt: string;
};

function formatDate(value: string) {
  if (!value) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date(value));
}

export default function TeacherReadingLevelResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("الكل");
  const [levelFilter, setLevelFilter] = useState("الكل");

  const classrooms = useMemo(
    () => ["الكل", ...Array.from(new Set(results.map((result) => result.classroom).filter(Boolean)))],
    [results]
  );
  const levels = useMemo(
    () => ["الكل", ...Array.from(new Set(results.map((result) => result.level).filter(Boolean)))],
    [results]
  );
  const filteredResults = useMemo(
    () => results.filter((result) =>
      (classroomFilter === "الكل" || result.classroom === classroomFilter) &&
      (levelFilter === "الكل" || result.level === levelFilter)
    ),
    [classroomFilter, levelFilter, results]
  );

  async function loadResults(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setMessage("");
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("يجب تسجيل الدخول بحساب المعلم.");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/teacher/reading-level-results", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await response.json()) as { success?: boolean; results?: ResultItem[]; message?: string };
      if (!response.ok || data.success !== true) throw new Error(data.message || "تعذر تحميل النتائج.");
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل النتائج.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadResults(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function deleteResult(result: ResultItem) {
    const confirmed = window.confirm(
      `سيتم حذف نتيجة تحديد المستوى للطالب «${result.studentName}» فقط.\n\nلن يتم حذف الطالب أو أي من بياناته الأخرى. هل تريد المتابعة؟`
    );

    if (!confirmed || deletingStudentId) return;

    try {
      setDeletingStudentId(result.studentDocId);
      setMessage("");
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("يجب تسجيل الدخول بحساب المعلم.");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/teacher/reading-level-results", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentDocId: result.studentDocId }),
      });
      const data = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر حذف النتيجة.");
      }

      setResults((current) =>
        current.filter((item) => item.studentDocId !== result.studentDocId)
      );
      setMessage(`تم حذف نتيجة الطالب «${result.studentName}» فقط بنجاح.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حذف النتيجة.");
    } finally {
      setDeletingStudentId("");
    }
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div>
            <p style={{ margin: 0, color: "#0f8a67", fontWeight: 900 }}>لوحة المعلم</p>
            <h1 style={{ margin: "7px 0", color: "#14513d" }}>🎯 نتائج تحديد المستوى القرائي</h1>
            <p style={{ margin: 0, color: "#64756d", lineHeight: 1.8 }}>تُحمّل النتائج مرة واحدة عند فتح الصفحة، ويمكن تحديثها يدويًا.</p>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void loadResults(true)} disabled={refreshing} style={buttonStyle}>{refreshing ? "جارٍ التحديث..." : "🔄 تحديث النتائج"}</button>
            <Link href="/teacher" style={linkStyle}>العودة للوحة المعلم</Link>
          </div>
        </header>

        {message && <p style={errorStyle}>{message}</p>}
        {!loading && results.length > 0 && (
          <section style={filterCardStyle} aria-label="تصفية نتائج تحديد المستوى">
            <label style={filterLabelStyle}>
              الفصل
              <select value={classroomFilter} onChange={(event) => setClassroomFilter(event.target.value)} style={selectStyle}>
                {classrooms.map((classroom) => <option key={classroom}>{classroom}</option>)}
              </select>
            </label>
            <label style={filterLabelStyle}>
              المستوى
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} style={selectStyle}>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <strong style={{ color: "#0f8a67" }}>{filteredResults.length} نتيجة مطابقة</strong>
          </section>
        )}
        {loading ? <section style={cardStyle}>جارٍ تحميل النتائج...</section> : results.length === 0 ? <section style={cardStyle}>لا توجد نتائج مرسلة حتى الآن.</section> : filteredResults.length === 0 ? <section style={cardStyle}>لا توجد نتائج تطابق الفلاتر الحالية.</section> : <section style={{ display: "grid", gap: 14 }}>{filteredResults.map((result) => <article key={result.studentDocId} style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, color: "#174c3b", fontSize: 20 }}>{result.studentName}</h2><p style={{ margin: "5px 0 0", color: "#718078" }}>{result.classroom || "الصف غير محدد"} • {formatDate(result.completedAt)}</p></div><div style={{ textAlign: "left" }}><strong style={{ color: "#0f8a67" }}>{result.level}</strong><div style={{ color: "#718078", fontSize: 13 }}>{result.score} من {result.total}</div></div></div><div style={skillsGridStyle}>{result.skillSummaries.map((skill, index) => <div key={`${result.studentDocId}-${skill.skill || index}`} style={skillStyle}><span>{skill.skill || "مهارة"}</span><strong style={{ color: skill.status === "متقن" ? "#087f5b" : "#a14b16" }}>{skill.status || "غير محدد"}</strong></div>)}</div><div style={{ display: "flex", justifyContent: "flex-start", marginTop: 16 }}><button type="button" onClick={() => void deleteResult(result)} disabled={deletingStudentId === result.studentDocId || Boolean(deletingStudentId)} style={{ ...deleteButtonStyle, opacity: deletingStudentId ? 0.65 : 1 }}>{deletingStudentId === result.studentDocId ? "جارٍ حذف النتيجة..." : "حذف النتيجة"}</button></div></article>)}</section>}
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", padding: "28px 16px 70px", background: "linear-gradient(180deg, #f3fbf7 0%, #ffffff 55%, #f5f8ff 100%)", color: "#173f32" } as const;
const contentStyle = { maxWidth: 1180, margin: "0 auto" } as const;
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" as const, marginBottom: 22, padding: "24px", borderRadius: 26, background: "#ffffff", border: "1px solid #dcefe8", boxShadow: "0 12px 30px rgba(24, 75, 57, 0.07)" };
const cardStyle = { padding: "20px", borderRadius: 22, background: "#ffffff", border: "1px solid #dcefe8", boxShadow: "0 8px 22px rgba(24, 75, 57, 0.06)" } as const;
const skillsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginTop: 18 } as const;
const skillStyle = { display: "flex", justifyContent: "space-between", gap: 8, padding: "9px 11px", borderRadius: 11, background: "#f7fbf8", color: "#245646", fontSize: 13 } as const;
const buttonStyle = { padding: "10px 14px", border: 0, borderRadius: 12, background: "#0f8a67", color: "#ffffff", font: "inherit", fontWeight: 900, cursor: "pointer" } as const;
const linkStyle = { display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "#ffffff", border: "1px solid #b8e3d4", color: "#087f5b", fontWeight: 900, textDecoration: "none" } as const;
const errorStyle = { padding: 14, borderRadius: 13, background: "#fff1f1", color: "#b42318", fontWeight: 800 } as const;
const filterCardStyle = { display: "flex", alignItems: "end", gap: 14, flexWrap: "wrap" as const, marginBottom: 14, padding: "16px 18px", borderRadius: 18, background: "#ffffff", border: "1px solid #dcefe8" };
const filterLabelStyle = { display: "grid", gap: 6, minWidth: 180, color: "#245646", fontWeight: 800, fontSize: 13 } as const;
const selectStyle = { width: "100%", padding: "9px 10px", borderRadius: 10, border: "1px solid #cfe3da", background: "#fbfffd", color: "#17352d", font: "inherit" } as const;
const deleteButtonStyle = { padding: "9px 13px", border: "1px solid #f1b8b8", borderRadius: 11, background: "#fff7f7", color: "#b42318", font: "inherit", fontWeight: 900, cursor: "pointer" } as const;
