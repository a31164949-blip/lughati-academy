"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

type Story = {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption: string;
  authorLabel: string;
};
type StoriesData = {
  success: boolean;
  stories: Story[];
  ownPending?: { id: string; status: "pending" } | null;
  message?: string;
};

const CLOUD_NAME = "ffv5igmg";
const UPLOAD_PRESET = "lughati_homework_upload";
const VIEWED_KEY = "academy-stories-viewed";

function readViewed() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(VIEWED_KEY) || "[]"));
  } catch {
    return new Set<string>();
  }
}

export default function AcademyStories() {
  const [data, setData] = useState<StoriesData | null>(null);
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : "";
    const response = await fetch("/api/academy-stories", {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      cache: "no-store",
    });
    const body = (await response.json()) as StoriesData;
    if (response.ok) setData(body);
  }

  useEffect(() => {
    setViewed(readViewed());
    return onAuthStateChanged(auth, () => {
      void load();
    });
  }, []);

  function openStory(index: number) {
    const story = data?.stories[index];
    if (!story) return;
    const nextViewed = new Set(viewed);
    nextViewed.add(story.id);
    setViewed(nextViewed);
    localStorage.setItem(VIEWED_KEY, JSON.stringify(Array.from(nextViewed).slice(-200)));
    setViewerIndex(index);
  }

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

  async function submit() {
    if (!file || sending) return;
    setSending(true);
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

      const user = auth.currentUser;
      if (!user) throw new Error("سجّل الدخول من جديد.");
      const token = await user.getIdToken();
      const response = await fetch("/api/academy-stories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          mediaUrl: uploaded.secure_url,
          publicId: uploaded.public_id || "",
          duration,
          caption,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "تعذر إرسال الحالة.");
      setMessage(body.message);
      setFile(null);
      setCaption("");
      await load();
      setTimeout(() => setUploadOpen(false), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إرسال الحالة.");
    } finally {
      setSending(false);
    }
  }

  const stories = data?.stories ?? [];
  const activeStory = viewerIndex === null ? null : stories[viewerIndex];

  return (
    <section dir="rtl" style={{ ...wrapStyle, padding: stories.length === 0 ? "14px 16px" : 17 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: "#176c46", fontSize: 22 }}>✨ نبض الأكاديمية</h2>
          <p style={{ margin: "5px 0 0", color: "#6b7b73" }}>
            {stories.length === 0 ? "شارك صورة أو مقطعًا قصيرًا بعد موافقة المعلّم." : "لحظات سريعة من تحديات وأبطال الأكاديمية."}
          </p>
        </div>
        {data?.ownPending && (
          <span style={{ padding: "7px 11px", borderRadius: 999, background: "#fff5cf", color: "#8a6200", fontWeight: 900 }}>
            ⏳ حالتك بانتظار موافقة المعلّم
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 13, overflowX: "auto", padding: stories.length === 0 ? "8px 2px 0" : "15px 2px 3px" }}>
        <button type="button" onClick={() => setUploadOpen(true)} style={circleButtonStyle}>
          <span style={{ ...circleStyle, width: stories.length === 0 ? 54 : 66, height: stories.length === 0 ? 54 : 66, border: "3px dashed #178b5a", background: "#edfbf3", fontSize: stories.length === 0 ? 24 : 28 }}>＋</span>
          <small style={{ fontWeight: 900, color: "#176c46" }}>أضف حالتك</small>
        </button>

        {stories.map((story, index) => (
          <button key={story.id} type="button" onClick={() => openStory(index)} style={circleButtonStyle}>
            <span style={{ ...circleStyle, border: viewed.has(story.id) ? "3px solid #cbd5ce" : "3px solid #18a66a", padding: 3 }}>
              {story.mediaType === "image" ? (
                <img src={story.mediaUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 26 }}>🎬</span>
              )}
            </span>
            <small style={{ maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#40594e", fontWeight: 800 }}>
              {story.authorLabel}
            </small>
          </button>
        ))}

        {stories.length === 0 && (
          <div style={{ flex: 1, minWidth: 210, padding: "10px 14px", color: "#65766d", background: "#f7fbf9", borderRadius: 14 }}>
            🌟 أضف أول حالة وابدأ نبض الأكاديمية
          </div>
        )}
      </div>

      {uploadOpen && (
        <div style={overlayStyle} onClick={() => !sending && setUploadOpen(false)}>
          <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setUploadOpen(false)} style={closeStyle}>×</button>
            <h3 style={{ margin: "0 0 8px", color: "#176c46" }}>أضف حالتك ✨</h3>
            <p style={{ color: "#67776e", lineHeight: 1.7 }}>اختر صورة أو فيديو قصير، ولن يظهر إلا بعد موافقة المعلّم.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(["image", "video"] as const).map((type) => (
                <button key={type} type="button" onClick={() => { setMediaType(type); setFile(null); }} style={{ flex: 1, padding: 10, borderRadius: 12, border: "1px solid #96cdb3", background: mediaType === type ? "#178b5a" : "#fff", color: mediaType === type ? "#fff" : "#176c46", fontWeight: 900 }}>
                  {type === "image" ? "🖼️ صورة" : "🎬 فيديو"}
                </button>
              ))}
            </div>
            <input type="file" accept={mediaType === "image" ? "image/*" : "video/*"} onChange={(event) => setFile(event.target.files?.[0] || null)} style={{ width: "100%", marginBottom: 12 }} />
            <textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 120))} placeholder="اكتب عبارة قصيرة للحالة — اختياري" style={{ width: "100%", minHeight: 78, boxSizing: "border-box", borderRadius: 12, border: "1px solid #bdd8ca", padding: 10, resize: "vertical" }} />
            <button type="button" disabled={!file || sending || Boolean(data?.ownPending)} onClick={() => void submit()} style={{ width: "100%", marginTop: 12, border: 0, borderRadius: 13, padding: 12, background: !file || sending || data?.ownPending ? "#cbd5ce" : "#178b5a", color: "#fff", fontWeight: 900 }}>
              {sending ? "جارٍ الإرسال..." : data?.ownPending ? "لديك حالة قيد المراجعة" : "إرسال للمعلّم للموافقة"}
            </button>
            {message && <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "#fff6d8", color: "#795b00", fontWeight: 800 }}>{message}</div>}
          </div>
        </div>
      )}

      {activeStory && viewerIndex !== null && (
        <div style={{ ...overlayStyle, background: "rgba(6,17,12,.96)" }}>
          <button type="button" onClick={() => setViewerIndex(null)} style={{ ...closeStyle, position: "fixed", top: 18, left: 18, zIndex: 3, color: "#fff", background: "rgba(255,255,255,.16)" }}>×</button>
          <div style={{ width: "min(430px,92vw)", color: "#fff", textAlign: "center" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {stories.map((story, index) => <span key={story.id} style={{ flex: 1, height: 4, borderRadius: 999, background: index <= viewerIndex ? "#fff" : "rgba(255,255,255,.3)" }} />)}
            </div>
            <strong style={{ display: "block", marginBottom: 10 }}>{activeStory.authorLabel}</strong>
            {activeStory.mediaType === "image" ? (
              <img src={activeStory.mediaUrl} alt="" style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 20 }} />
            ) : (
              <video src={activeStory.mediaUrl} controls autoPlay playsInline style={{ width: "100%", maxHeight: "70vh", borderRadius: 20 }} />
            )}
            {activeStory.caption && <p style={{ lineHeight: 1.7 }}>{activeStory.caption}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button type="button" disabled={viewerIndex === 0} onClick={() => openStory(viewerIndex - 1)} style={navStyle}>السابق</button>
              <button type="button" disabled={viewerIndex === stories.length - 1} onClick={() => openStory(viewerIndex + 1)} style={navStyle}>التالي</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const wrapStyle = { background: "#fff", border: "1px solid #d7e9df", borderRadius: 24, padding: 17, marginBottom: 20, boxShadow: "0 8px 22px rgba(20,90,60,.06)" } as const;
const circleButtonStyle = { border: 0, background: "transparent", display: "grid", justifyItems: "center", gap: 6, minWidth: 82, cursor: "pointer" } as const;
const circleStyle = { width: 66, height: 66, borderRadius: "50%", display: "grid", placeItems: "center", boxSizing: "border-box" } as const;
const overlayStyle = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(8,35,24,.75)", display: "grid", placeItems: "center", padding: 16 } as const;
const modalStyle = { width: "min(470px,94vw)", background: "#fff", borderRadius: 24, padding: 20, position: "relative", boxSizing: "border-box" } as const;
const closeStyle = { border: 0, borderRadius: "50%", width: 38, height: 38, fontSize: 28, lineHeight: 1, cursor: "pointer", background: "#edf4f0", color: "#17352a" } as const;
const navStyle = { flex: 1, border: "1px solid rgba(255,255,255,.4)", borderRadius: 12, padding: 10, background: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 900 } as const;
