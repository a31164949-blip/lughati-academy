"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type WorkType = "image" | "audio" | "video";
type Submission = {
  id: string;
  studentName: string;
  classroom: string;
  workType: WorkType;
  fileUrl: string;
  note: string;
  status: "pending" | "approved" | "returned";
  teacherNote: string;
  submittedAt: string;
};

export default function TeacherAcademyClubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [points, setPoints] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [allowedTypes, setAllowedTypes] = useState<WorkType[]>(["image"]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function loadData(currentUser: User) {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/teacher/academy-club/challenge", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر تحميل البيانات.");
      setCurrentTitle(data.challenge?.title ?? "");
      setSubmissions(data.submissions ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void loadData(user);
    else setLoading(false);
  }, [user]);

  function toggleType(type: WorkType) {
    setAllowedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  }

  async function publishChallenge() {
    if (!user) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const token = await user.getIdToken();
      const response = await fetch("/api/teacher/academy-club/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          instructions,
          points: Number(points),
          durationDays: Number(durationDays),
          allowedTypes,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر نشر التحدي.");
      setMessage("تم نشر تحدي النادي بنجاح 🎯");
      setTitle("");
      setInstructions("");
      await loadData(user);
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : "تعذر نشر التحدي.";
      setError(text);
      window.alert(text);
    } finally {
      setSaving(false);
    }
  }

  async function reviewSubmission(submission: Submission, decision: "approved" | "returned") {
    if (!user) return;
    const teacherNote = window.prompt(
      decision === "approved" ? "ملاحظة تشجيعية اختيارية:" : "اكتب سبب الإعادة للطالب:",
      submission.teacherNote || ""
    );
    if (teacherNote === null) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/teacher/academy-club/challenge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId: submission.id, decision, teacherNote }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر مراجعة المشاركة.");
      setMessage(decision === "approved" ? "تم اعتماد المشاركة وإضافة النقاط ✅" : "تمت إعادة المشاركة للطالب ↩️");
      await loadData(user);
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "تعذر مراجعة المشاركة.");
    }
  }

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#f4faf7", fontFamily: "Arial", color: "#17352a" }}>
      <header style={headerStyle}>
        <div>
          <div style={{ color: "#f4d46a", fontWeight: 900 }}>🏅 نادي الأكاديمية</div>
          <h1 style={{ margin: "6px 0" }}>إدارة تحدي النادي الأسبوعي</h1>
        </div>
        <Link href="/teacher" style={backStyle}>لوحة المعلم ←</Link>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 22 }}>
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#176c46" }}>🎯 نشر تحدٍّ جديد</h2>
          {currentTitle && <div style={noticeStyle}>التحدي المنشور حاليًا: {currentTitle}</div>}
          <div style={formGridStyle}>
            <label style={labelStyle}>عنوان التحدي<input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>النقاط<input type="number" min="0" max="100" value={points} onChange={(e) => setPoints(e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>مدة التحدي
              <select value={durationDays} onChange={(e) => setDurationDays(e.target.value)} style={inputStyle}>
                <option value="3">3 أيام</option><option value="7">7 أيام</option><option value="14">14 يومًا</option>
              </select>
            </label>
          </div>
          <label style={{ ...labelStyle, marginTop: 15 }}>تعليمات المهمة<textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} style={inputStyle} /></label>
          <div style={{ marginTop: 15, fontWeight: 900 }}>أنواع الملفات المسموحة</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 9 }}>
            {(["image", "audio", "video"] as WorkType[]).map((type) => (
              <button key={type} type="button" onClick={() => toggleType(type)} style={{ ...typeButtonStyle, background: allowedTypes.includes(type) ? "#176c46" : "white", color: allowedTypes.includes(type) ? "white" : "#176c46" }}>
                {type === "image" ? "🖼️ صورة" : type === "audio" ? "🎙️ صوت" : "🎥 فيديو"}
              </button>
            ))}
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          {message && <div style={successStyle}>{message}</div>}
          <button type="button" disabled={saving} onClick={() => void publishChallenge()} style={publishStyle}>
            {saving ? "جارٍ النشر..." : "🚀 نشر التحدي للأعضاء"}
          </button>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#176c46" }}>📥 مشاركات الأعضاء ({submissions.length})</h2>
          {loading ? <div>جارٍ التحميل...</div> : submissions.length === 0 ? <div style={noticeStyle}>لا توجد مشاركات حتى الآن.</div> : (
            <div style={{ display: "grid", gap: 14 }}>
              {submissions.map((submission) => (
                <article key={submission.id} style={submissionStyle}>
                  <div>
                    <strong style={{ fontSize: 18 }}>{submission.studentName}</strong>
                    <div style={{ color: "#64748b", marginTop: 4 }}>{submission.classroom} • {submission.status === "approved" ? "معتمدة ✅" : submission.status === "returned" ? "معادة ↩️" : "تنتظر المراجعة ⏳"}</div>
                    {submission.note && <p>{submission.note}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                    <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={viewStyle}>عرض الملف</a>
                    <button type="button" onClick={() => void reviewSubmission(submission, "approved")} style={approveStyle}>✅ اعتماد</button>
                    <button type="button" onClick={() => void reviewSubmission(submission, "returned")} style={returnStyle}>↩️ إعادة</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const headerStyle: React.CSSProperties = { padding: "26px max(16px,calc((100% - 1100px)/2))", background: "linear-gradient(135deg,#176c46,#0f5237)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 15 };
const backStyle: React.CSSProperties = { color: "white", textDecoration: "none", padding: "10px 14px", borderRadius: 13, border: "1px solid #ffffff66" };
const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #d7e8df", borderRadius: 22, padding: 23, boxShadow: "0 10px 30px #17352a12" };
const formGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 13 };
const labelStyle: React.CSSProperties = { display: "grid", gap: 7, fontWeight: 900 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, border: "1px solid #bfd7ca", font: "inherit" };
const noticeStyle: React.CSSProperties = { padding: 13, marginBottom: 15, borderRadius: 13, background: "#fff8dc", color: "#755309", fontWeight: 800 };
const typeButtonStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: 12, border: "1px solid #79b99a", fontWeight: 900, cursor: "pointer" };
const publishStyle: React.CSSProperties = { width: "100%", marginTop: 18, padding: 14, border: 0, borderRadius: 14, background: "#176c46", color: "white", fontWeight: 900, fontSize: 17, cursor: "pointer" };
const submissionStyle: React.CSSProperties = { padding: 16, borderRadius: 16, border: "1px solid #dce9e2", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" };
const viewStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 11, background: "#eff6ff", color: "#1d4ed8", textDecoration: "none", fontWeight: 900 };
const approveStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 11, border: 0, background: "#176c46", color: "white", fontWeight: 900, cursor: "pointer" };
const returnStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 11, border: "1px solid #f0a16f", background: "#fff7ed", color: "#b45309", fontWeight: 900, cursor: "pointer" };
const errorStyle: React.CSSProperties = { marginTop: 15, padding: 12, borderRadius: 12, background: "#fff1f2", color: "#b91c1c", fontWeight: 800 };
const successStyle: React.CSSProperties = { marginTop: 15, padding: 12, borderRadius: 12, background: "#ecfdf5", color: "#166534", fontWeight: 800 };
