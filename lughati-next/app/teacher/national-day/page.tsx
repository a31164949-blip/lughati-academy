"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";

type Submission = {
  id: string;
  studentName?: string;
  classroom?: string;
  grade?: string;
  school?: string;
  title?: string;
  fileUrl?: string;
  duration?: number;
  status?: "pending" | "approved" | "revision_requested";
  teacherNote?: string;
  createdAt?: { toMillis?: () => number };
};

export default function TeacherNationalDayPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  async function load() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "nationalDaySubmissions"));
      const incoming = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Submission, "id">) }));
      incoming.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setItems(incoming);
      setNotes(Object.fromEntries(incoming.map((item) => [item.id, item.teacherNote || ""])));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => filter === "all" ? items : items.filter((item) => item.status === filter), [filter, items]);
  const pendingCount = items.filter((item) => item.status === "pending").length;

  async function changeStatus(item: Submission, status: "approved" | "revision_requested") {
    const note = (notes[item.id] || "").trim();
    if (status === "revision_requested" && !note) {
      alert("اكتب ملاحظة للطالب قبل إعادة المشاركة.");
      return;
    }
    try {
      setWorkingId(item.id);
      await updateDoc(doc(db, "nationalDaySubmissions", item.id), { status, approved: status === "approved", teacherNote: note, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status, approved: status === "approved", teacherNote: note } : entry));
    } catch {
      alert("تعذر تحديث المشاركة.");
    } finally {
      setWorkingId("");
    }
  }

  async function remove(item: Submission) {
    if (!window.confirm(`هل تريد حذف مشاركة ${item.studentName || "الطالب"}؟\nلن يمكن استعادتها بعد الحذف.`)) return;
    try {
      setWorkingId(item.id);
      await deleteDoc(doc(db, "nationalDaySubmissions", item.id));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch {
      alert("تعذر حذف المشاركة.");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main dir="rtl" style={{ minHeight: "100vh", padding: 22, color: "#153f33", background: "linear-gradient(180deg,#effcf6,#fff)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link href="/teacher" style={linkStyle}>→ العودة إلى لوحة المعلم</Link>
          <button type="button" onClick={() => void load()} style={buttonStyle("#087b52")}>تحديث المشاركات 🔄</button>
        </div>

        <section style={{ marginTop: 18, padding: 28, borderRadius: 28, color: "white", background: "linear-gradient(135deg,#064e3b,#0a8c5c)" }}>
          <div style={{ color: "#fde68a", fontWeight: 900 }}>إدارة أسبوع الوطن</div>
          <h1 style={{ margin: "5px 0", fontSize: "clamp(30px,5vw,48px)" }}>مشاركات صوت الوطن 🎙️</h1>
          <p style={{ margin: 0, color: "#dcfce7" }}>راجع المقاطع واعتمد المشاركة أو أعدها للطالب مع ملاحظة.</p>
        </section>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {[{v:"all",l:`الكل (${items.length})`},{v:"pending",l:`بانتظار المراجعة (${pendingCount})`},{v:"approved",l:"المعتمدة"},{v:"revision_requested",l:"المعادة"}].map((option) => <button key={option.v} onClick={() => setFilter(option.v)} style={{ ...buttonStyle(filter === option.v ? "#087b52" : "#e8f3ee"), color: filter === option.v ? "white" : "#175b45" }}>{option.l}</button>)}
        </div>

        {loading ? <div style={{ padding: 40, textAlign: "center" }}>جارٍ تحميل المشاركات…</div> : shown.length === 0 ? <div style={{ marginTop: 20, padding: 35, textAlign: "center", borderRadius: 22, background: "white" }}>لا توجد مشاركات في هذا القسم.</div> : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18, marginTop: 20 }}>
            {shown.map((item) => {
              const busy = workingId === item.id;
              return <article key={item.id} style={{ overflow: "hidden", borderRadius: 24, background: "white", border: "1px solid #ccebdd", boxShadow: "0 10px 28px rgba(15,118,72,.08)" }}>
                {item.fileUrl ? <video src={item.fileUrl} controls preload="metadata" style={{ width: "100%", height: 260, objectFit: "contain", background: "#000" }} /> : null}
                <div style={{ padding: 20 }}>
                  <Status status={item.status} />
                  <h2 style={{ margin: "10px 0 4px", color: "#086447" }}>{item.studentName || "طالب"}</h2>
                  <div style={{ color: "#6b7f78", lineHeight: 1.8 }}>{item.grade} • {item.classroom || "دون فصل"}<br />{item.school}<br />{item.title}{item.duration ? ` • ${Math.ceil(item.duration)} ثانية` : ""}</div>
                  <textarea value={notes[item.id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))} placeholder="ملاحظة المعلم عند الحاجة" style={{ width: "100%", boxSizing: "border-box", minHeight: 85, marginTop: 13, padding: 12, borderRadius: 13, border: "1px solid #cddfd8", resize: "vertical" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 10 }}>
                    <button disabled={busy} onClick={() => void changeStatus(item,"approved")} style={buttonStyle("#087b52")}>اعتماد ✅</button>
                    <button disabled={busy} onClick={() => void changeStatus(item,"revision_requested")} style={buttonStyle("#b7791f")}>إعادة للمراجعة ↩️</button>
                    <a href={item.fileUrl || "#"} target="_blank" rel="noreferrer" style={{ ...buttonStyle("#2563eb"), textDecoration: "none", textAlign: "center" }}>فتح الفيديو 👀</a>
                    <button disabled={busy} onClick={() => void remove(item)} style={buttonStyle("#b91c1c")}>حذف 🗑️</button>
                  </div>
                </div>
              </article>;
            })}
          </section>
        )}
      </div>
    </main>
  );
}

const linkStyle: React.CSSProperties = { padding: "12px 17px", borderRadius: 14, color: "#087b52", background: "white", border: "1px solid #bde1d2", textDecoration: "none", fontWeight: 900 };
function buttonStyle(background: string): React.CSSProperties { return { padding: "12px 15px", border: 0, borderRadius: 13, color: "white", background, fontWeight: 900, cursor: "pointer" }; }
function Status({ status }: { status?: Submission["status"] }) {
  const value = status === "approved" ? ["معتمدة", "#dcfce7", "#087b52"] : status === "revision_requested" ? ["أُعيدت للطالب", "#fff7cc", "#8a5b00"] : ["بانتظار المراجعة", "#e8f1ff", "#1d4ed8"];
  return <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: value[1], color: value[2], fontSize: 13, fontWeight: 900 }}>{value[0]}</span>;
}
