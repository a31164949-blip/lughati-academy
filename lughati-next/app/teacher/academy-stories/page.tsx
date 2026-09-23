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

const CLOUD_NAME = "ffv5igmg";
const UPLOAD_PRESET = "lughati_homework_upload";

export default function TeacherAcademyStoriesPage() {
  const [items, setItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [publishing, setPublishing] = useState(false);

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

  async function getVideoDuration(selected: File) {
    return new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(selected);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("تعذر قراءة مدة الفيديو."));
      };
      video.src = url;
    });
  }

  async function publishAcademyStory() {
    const user = auth.currentUser;
    if (!user || !file || publishing) return;
    setPublishing(true);
    setMessage("");
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error("حجم الملف كبير؛ الحد الأقصى 30 ميجابايت.");
      const duration = mediaType === "video" ? await getVideoDuration(file) : 0;
      if (mediaType === "video" && duration > 30) throw new Error("اختر فيديو مدته 30 ثانية أو أقل.");

      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      const upload = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${mediaType}/upload`, {
        method: "POST",
        body: form,
      });
      const uploaded = await upload.json();
      if (!upload.ok || !uploaded.secure_url) throw new Error("تعذر رفع الملف.");

      const token = await user.getIdToken();
      const response = await fetch("/api/teacher/academy-stories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          mediaUrl: uploaded.secure_url,
          publicId: uploaded.public_id || "",
          duration,
          caption,
          durationHours: Number(durationHours),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "تعذر نشر الحالة.");
      setMessage(body.message);
      setFile(null);
      setCaption("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر نشر الحالة.");
    } finally {
      setPublishing(false);
    }
  }

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

        <section style={{ ...sectionStyle, border: "2px solid #efc84a", background: "linear-gradient(135deg,#fffaf0,#ffffff)" }}>
          <h2 style={{ marginTop: 0, color: "#176c46" }}>📣 نشر حالة الأكاديمية</h2>
          <p style={{ color: "#65766d", lineHeight: 1.8 }}>انشر صورة أو فيديو رسميًا باسم «أكاديمية لغتي» مباشرة لجميع الطلاب.</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["image", "video"] as const).map((type) => (
              <button key={type} type="button" onClick={() => { setMediaType(type); setFile(null); }} style={{ ...secondaryButtonStyle, background: mediaType === type ? "#176c46" : "#fff", color: mediaType === type ? "#fff" : "#176c46" }}>
                {type === "image" ? "🖼️ صورة" : "🎬 فيديو قصير"}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(150px,1fr)", gap: 12 }}>
            <label style={{ display: "grid", gap: 7, fontWeight: 900 }}>
              اختر الملف
              <input type="file" accept={mediaType === "image" ? "image/*" : "video/*"} onChange={(event) => setFile(event.target.files?.[0] || null)} style={{ padding: 11, border: "1px solid #bdd8ca", borderRadius: 12, background: "#fff" }} />
            </label>
            <label style={{ display: "grid", gap: 7, fontWeight: 900 }}>
              مدة العرض
              <select value={durationHours} onChange={(event) => setDurationHours(event.target.value)} style={{ padding: 11, border: "1px solid #bdd8ca", borderRadius: 12, background: "#fff", font: "inherit" }}>
                <option value="24">24 ساعة</option>
                <option value="48">48 ساعة</option>
                <option value="72">72 ساعة</option>
              </select>
            </label>
          </div>
          <textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 120))} placeholder="اكتب عبارة قصيرة للحالة — اختياري" style={{ width: "100%", minHeight: 76, boxSizing: "border-box", marginTop: 12, borderRadius: 12, border: "1px solid #bdd8ca", padding: 11, resize: "vertical", font: "inherit" }} />
          <button type="button" disabled={!file || publishing} onClick={() => void publishAcademyStory()} style={{ ...buttonStyle, width: "100%", marginTop: 12, padding: 13, background: !file || publishing ? "#aebbb4" : "#176c46" }}>
            {publishing ? "جارٍ رفع الحالة ونشرها..." : "🚀 نشر الحالة مباشرة"}
          </button>
        </section>

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
