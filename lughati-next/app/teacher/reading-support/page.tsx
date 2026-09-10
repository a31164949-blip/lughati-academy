"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { auth } from "../../../firebase";

type SupportRequest = {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  studentGrade: string;
  studentClass: string;
  skill: string;
  priority: number;
  status: "pending";
  createdAt: string | null;
};

type RequestsResponse = {
  success?: boolean;
  requests?: SupportRequest[];
  upcomingSessions?: UpcomingSession[];
  message?: string;
};

type UpcomingSession = {
  id: string;
  sessionDate: string;
  sessionTime: string;
  locationNote: string;
  studentCount: number;
  students: Array<{
    studentName: string;
    grade: string;
    skill: string;
  }>;
};

type SessionResponse = {
  success?: boolean;
  message?: string;
};

const gradeOptions = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
const skillOptions = [
  "نطق الحروف",
  "الحركات القصيرة",
  "حروف المد",
  "المقاطع الساكنة",
  "قراءة الكلمات والجمل",
];

function isSecondGradePriority(item: SupportRequest) {
  return item.priority === 1 ||
    item.studentGrade.includes("الثاني") ||
    item.studentClass.includes("الثاني");
}

function formatCreatedAt(value: unknown) {
  if (typeof value !== "string") {
    return "غير محدد";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";

  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatSessionDateTime(sessionDate: string, sessionTime: string) {
  const date = new Date(`${sessionDate}T${sessionTime}:00+03:00`);
  if (Number.isNaN(date.getTime())) return "موعد غير محدد";

  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول",
  completed: "مكتملة",
  cancelled: "ملغى",
};

export default function ReadingSupportTeacherPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gradeFilter, setGradeFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function getTeacherToken() {
    const user = auth.currentUser;
    if (!user) throw new Error("يجب تسجيل الدخول بحساب المعلم.");
    return user.getIdToken();
  }

  async function loadRequests() {
    try {
      setLoading(true);
      setMessage("");
      const token = await getTeacherToken();
      const response = await fetch("/api/reading-support-sessions", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await response.json()) as RequestsResponse;
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر تحميل طلبات التمكين.");
      }
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setUpcomingSessions(Array.isArray(data.upcomingSessions) ? data.upcomingSessions : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل الطلبات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  const filteredRequests = useMemo(
    () => requests.filter((item) =>
      (!gradeFilter || item.grade === gradeFilter) &&
      (!skillFilter || item.skill === skillFilter) &&
      (!statusFilter || item.status === statusFilter)
    ),
    [gradeFilter, requests, skillFilter, statusFilter]
  );

  function toggleSelection(id: string) {
    setMessage("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 6) {
        setMessage("لا يمكن اختيار أكثر من 6 طلاب للحصة الواحدة.");
        return current;
      }
      return [...current, id];
    });
  }

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedIds.length === 0 || selectedIds.length > 6 || submitting) return;
    if (!locationNote.trim()) {
      setMessage("يرجى إدخال مكان الحصة أو ملاحظة قصيرة.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setSuccess(false);
      const token = await getTeacherToken();
      const response = await fetch("/api/reading-support-sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestIds: selectedIds,
          sessionDate,
          sessionTime,
          locationNote,
        }),
      });
      const data = (await response.json()) as SessionResponse;
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر إنشاء الحصة.");
      }
      setSuccess(true);
      setMessage("تم إنشاء الحصة وتحديث الطلبات المقبولة.");
      setSelectedIds([]);
      setSessionDate("");
      setSessionTime("");
      setLocationNote("");
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إنشاء الحصة.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <Link href="/teacher" style={styles.backLink}>← العودة إلى لوحة المعلم</Link>
        <header style={styles.header}>
          <div style={styles.headerIcon}>📚</div>
          <div>
            <p style={styles.eyebrow}>إدارة الدعم القرائي</p>
            <h1 style={styles.title}>حصص التمكين القرائي</h1>
            <p style={styles.subtitle}>اختيار المقبولين وتنظيم الحصص للطلاب المسجلين.</p>
          </div>
        </header>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>الحصص القادمة</h2>
              <p style={styles.muted}>أقرب الحصص المجدولة للطلاب المقبولين.</p>
            </div>
            <strong style={styles.upcomingBadge}>قادمة</strong>
          </div>

          {upcomingSessions.length === 0 ? (
            <p style={styles.empty}>لا توجد حصص قادمة حاليًا.</p>
          ) : (
            <div style={styles.sessionList}>
              {upcomingSessions.map((session) => (
                <article key={session.id} style={styles.session}>
                  <div style={styles.sessionHeader}>
                    <div>
                      <strong style={styles.sessionDate}>
                        {formatSessionDateTime(session.sessionDate, session.sessionTime)}
                      </strong>
                      <p style={styles.muted}>المكان أو الملاحظة: {session.locationNote}</p>
                    </div>
                    <span style={styles.upcomingBadge}>قادمة</span>
                  </div>
                  <p style={styles.sessionCount}>عدد الطلاب: {session.studentCount} من 6</p>
                  <div style={styles.studentList}>
                    {session.students.map((student, index) => (
                      <div key={`${session.id}-${index}`} style={styles.sessionStudent}>
                        <strong>{student.studentName}</strong>
                        <span>الصف {student.grade}</span>
                        <span>المهارة: {student.skill}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>طلبات الطلاب</h2>
              <p style={styles.muted}>طلاب الصف الثاني يظهرون أولًا، ثم الأقدم تسجيلًا.</p>
            </div>
            <strong style={styles.counter}>تم اختيار {selectedIds.length} من 6</strong>
          </div>

          <div style={styles.filters}>
            <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} style={styles.input}>
              <option value="">كل الصفوف</option>
              {gradeOptions.map((grade) => <option key={grade} value={grade}>الصف {grade}</option>)}
            </select>
            <select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} style={styles.input}>
              <option value="">كل المهارات</option>
              {skillOptions.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.input}>
              <option value="pending">قيد الانتظار</option>
              <option value="">كل الحالات</option>
            </select>
          </div>

          {loading ? (
            <p style={styles.muted}>جارٍ تحميل الطلبات...</p>
          ) : filteredRequests.length === 0 ? (
            <p style={styles.empty}>لا توجد طلبات مطابقة للفلاتر الحالية.</p>
          ) : (
            <div style={styles.list}>
              {filteredRequests.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <label key={item.id} style={{ ...styles.request, ...(selected ? styles.selected : {}) }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSelection(item.id)} />
                    <div style={styles.requestBody}>
                      <div style={styles.requestTop}>
                        <strong>{item.studentName}</strong>
                        {isSecondGradePriority(item) && <span style={styles.priority}>⭐ أولوية الصف الثاني</span>}
                        <span style={styles.status}>{statusLabels[item.status] ?? "حالة غير محددة"}</span>
                      </div>
                      <span>الصف {item.grade} · {item.studentClass}</span>
                      <span>المهارة: {item.skill}</span>
                      <small style={styles.muted}>سُجل في: {formatCreatedAt(item.createdAt)}</small>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <form onSubmit={createSession} style={styles.panel}>
          <h2 style={styles.panelTitle}>بيانات الحصة</h2>
          <p style={styles.muted}>التحديد لا يغيّر حالة الطلب. يتم القبول فقط عند تأكيد إنشاء الحصة.</p>
          <div style={styles.formGrid}>
            <label style={styles.field}>تاريخ الحصة<input type="date" required value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} style={styles.input} /></label>
            <label style={styles.field}>وقت الحصة<input type="time" required value={sessionTime} onChange={(event) => setSessionTime(event.target.value)} style={styles.input} /></label>
          </div>
          <label style={styles.field}>مكان الحصة أو ملاحظة قصيرة <span aria-hidden="true" style={{ color: "#b91c1c" }}>*</span><textarea required value={locationNote} onChange={(event) => setLocationNote(event.target.value)} maxLength={160} rows={3} style={styles.input} /></label>
          <button type="submit" disabled={submitting || selectedIds.length === 0} style={styles.button}>
            {submitting ? "جارٍ إنشاء الحصة..." : "تأكيد إنشاء الحصة"}
          </button>
          {message && <p role="status" style={{ ...styles.message, color: success ? "#166534" : "#b91c1c" }}>{message}</p>}
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", padding: "28px 16px 50px", background: "linear-gradient(180deg, #f0fdf4 0%, #f8fafc 48%, #eff6ff 100%)" },
  container: { width: "100%", maxWidth: "1120px", margin: "0 auto" },
  backLink: { color: "#166534", fontWeight: 800, textDecoration: "none" },
  header: { display: "flex", alignItems: "center", gap: "16px", margin: "18px 0", padding: "24px", borderRadius: "26px", color: "white", background: "linear-gradient(135deg, #166534, #0f766e)", boxShadow: "0 18px 40px rgba(22, 101, 52, .16)" },
  headerIcon: { width: "64px", height: "64px", display: "grid", placeItems: "center", borderRadius: "20px", background: "rgba(255,255,255,.16)", fontSize: "34px" },
  eyebrow: { margin: 0, color: "#bbf7d0", fontWeight: 800 },
  title: { margin: "6px 0", fontSize: "clamp(26px, 5vw, 40px)" },
  subtitle: { margin: 0, color: "#dcfce7", lineHeight: 1.8 },
  panel: { marginTop: "18px", padding: "22px", borderRadius: "24px", background: "#ffffff", border: "1px solid #dbeafe", boxShadow: "0 12px 30px rgba(15, 23, 42, .07)" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" },
  panelTitle: { margin: 0, color: "#164e63", fontSize: "22px" },
  muted: { margin: "6px 0", color: "#64748b", lineHeight: 1.7 },
  counter: { padding: "9px 14px", borderRadius: "999px", color: "#075985", background: "#e0f2fe" },
  filters: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", margin: "18px 0" },
  input: { width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: "12px", background: "#fff", color: "#1e293b", font: "inherit" },
  list: { display: "grid", gap: "10px" },
  sessionList: { display: "grid", gap: "12px" },
  session: { padding: "16px", border: "1px solid #bae6fd", borderRadius: "16px", background: "#f8fdff" },
  sessionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" },
  sessionDate: { color: "#164e63", fontSize: "18px" },
  upcomingBadge: { padding: "5px 10px", borderRadius: "999px", color: "#166534", background: "#dcfce7", fontSize: "12px", fontWeight: 900, whiteSpace: "nowrap" },
  sessionCount: { margin: "12px 0 8px", color: "#0f766e", fontWeight: 900 },
  studentList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "8px" },
  sessionStudent: { display: "grid", gap: "3px", padding: "10px", borderRadius: "12px", background: "#ffffff", color: "#334155", fontSize: "14px" },
  request: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", border: "1px solid #e2e8f0", borderRadius: "16px", cursor: "pointer" },
  selected: { borderColor: "#14b8a6", background: "#f0fdfa" },
  requestBody: { display: "grid", gap: "4px", minWidth: 0 },
  requestTop: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", color: "#0f172a" },
  priority: { padding: "3px 8px", borderRadius: "999px", color: "#92400e", background: "#fef3c7", fontSize: "12px", fontWeight: 900 },
  status: { padding: "3px 8px", borderRadius: "999px", color: "#1d4ed8", background: "#dbeafe", fontSize: "12px", fontWeight: 800 },
  empty: { padding: "22px", textAlign: "center", color: "#64748b" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  field: { display: "grid", gap: "7px", marginTop: "12px", color: "#334155", fontWeight: 800 },
  button: { marginTop: "16px", width: "100%", padding: "13px", border: 0, borderRadius: "14px", background: "#0f766e", color: "white", font: "inherit", fontWeight: 900, cursor: "pointer" },
  message: { margin: "12px 0 0", fontWeight: 800 },
};
