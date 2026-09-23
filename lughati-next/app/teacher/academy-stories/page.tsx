"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";

type StoryItem = {
  id: string;
  studentName: string;
  classroom: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption: string;
  status: string;
  expiresAt: number;
};

export default function TeacherAcademyStoriesPage() {
  const [items, setItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch("/api/teacher/academy-stories", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await response.json();
    if (response.ok) setItems(Array.isArray(body.items) ? body.items : []);
    else setMessage(body.message || "تعذر تحميل الحالات.");
    setLoading(false);
  }

  useEffect(() => onAuthStateChanged(auth, (user) => {
    if (user) void load();
    else setLoading(false);
  }), []);

  async function review(id: string, action: "approve" | "reject", durationHours = 24) {
    const user = auth.currentUser;
    if (!user || savingId) return;
    setSavingId(id);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/teacher/academy-stories", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, durationHours }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "تعذر تحديث الحالة.");
      setMessage(body.message);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحديث الحالة.");
    } finally {
      setSavingId("");
    }
  }

  const pending = items.filter((item) => item.status === "pending");
  const published = items.filter((item) => item.status === "approved" && item.expiresAt > Date.now());

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(180deg,#eefaf4,#fffaf0)", padding: "24px 16px 50px", color: "#17352a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ background: "linear-gradient(135deg,#0b6b43,#15905d)", color: "#fff", borderRadius: 26, padding: 24, marginBottom: 20 }}>
          <Link href="/teacher" style={{ color: "#fff", textDecoration: "none", fontWeight: 900 }}>← العودة إلى لوحة المعلّم</Link>
          <h1 style={{ margin: "14px 0 7px" }}>✨ إدارة نبض الأكاديمية</h1>
          <p style={{ margin: 0, lineHeight: 1.8 }}>راجع حالات الطلاب قبل ظهورها، وحدد مدة عرض الحالة.</p>
        </header>

        {message && <div style={{ marginBottom: 15, padding: 12, borderRadius: 14, background: "#fff5cf", color: "#7b5900", fontWeight: 900 }}>{message}</div>}

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>⏳ بانتظار المراجعة ({pending.length})</h2>
          {loading ? <p>جارٍ التحميل...</p> : pending.length === 0 ? <p style={emptyStyle}>لا توجد حالات بانتظار المراجعة.</p> : (
            <div style={gridStyle}>
              {pending.map((item) => (
                <article key={item.id} style={cardStyle}>
                  {item.mediaType === "image" ? (
                    <img src={item.mediaUrl} alt="" style={mediaStyle} />
                  ) : (
                    <video src={item.mediaUrl} controls style={mediaStyle} />
                  )}
                  <strong style={{ fontSize: 18 }}>{item.studentName}</strong>
                  <span style={{ color: "#6b7a72" }}>{item.classroom || "دون فصل محدد"}</span>
                  {item.caption && <p style={{ margin: "4px 0", lineHeight: 1.7 }}>{item.caption}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                    <button type="button" disabled={Boolean(savingId)} onClick={() => void review(item.id, "approve", 24)} style={{ ...buttonStyle, background: "#178b5a" }}>نشر 24 ساعة ✅</button>
                    <button type="button" disabled={Boolean(savingId)} onClick={() => void review(item.id, "reject")} style={{ ...buttonStyle, background: "#b42318" }}>رفض</button>
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <button type="button" disabled={Boolean(savingId)} onClick={() => void review(item.id, "approve", 48)} style={secondaryButtonStyle}>نشر 48 ساعة</button>
                    <button type="button" disabled={Boolean(savingId)} onClick={() => void review(item.id, "approve", 72)} style={secondaryButtonStyle}>نشر 72 ساعة</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>🟢 الحالات المعروضة الآن ({published.length})</h2>
          {published.length === 0 ? <p style={emptyStyle}>لا توجد حالات نشطة الآن.</p> : (
            <div style={gridStyle}>
              {published.map((item) => (
                <article key={item.id} style={cardStyle}>
                  {item.mediaType === "image" ? <img src={item.mediaUrl} alt="" style={mediaStyle} /> : <video src={item.mediaUrl} controls style={mediaStyle} />}
                  <strong>{item.studentName}</strong>
                  <span style={{ color: "#158052", fontWeight: 900 }}>منشورة الآن</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const sectionStyle = { background: "#fff", border: "1px solid #d8e8df", borderRadius: 24, padding: 20, marginBottom: 18 } as const;
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 } as const;
const cardStyle = { display: "grid", gap: 9, border: "1px solid #dce7e1", borderRadius: 18, padding: 13, background: "#fbfdfc" } as const;
const mediaStyle = { width: "100%", height: 210, objectFit: "contain", borderRadius: 14, background: "#edf3ef" } as const;
const buttonStyle = { border: 0, borderRadius: 12, padding: 11, color: "#fff", fontWeight: 900, cursor: "pointer" } as const;
const secondaryButtonStyle = { flex: 1, border: "1px solid #8fc8ab", borderRadius: 11, padding: 9, color: "#176c46", background: "#fff", fontWeight: 900, cursor: "pointer" } as const;
const emptyStyle = { padding: 16, borderRadius: 14, background: "#f6faf8", color: "#718078" } as const;
