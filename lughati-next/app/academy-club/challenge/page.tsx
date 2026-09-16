"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../firebase";

type WorkType = "image" | "audio" | "video";
type Challenge = {
  challengeId: string;
  title: string;
  instructions: string;
  points: number;
  allowedTypes: WorkType[];
  closesAt: string;
  isClosed: boolean;
};
type Submission = {
  status: "pending" | "approved" | "returned";
  teacherNote: string;
  submittedAt: string;
};

const CLOUD_NAME = "ffv5igmg";
const UPLOAD_PRESET = "lughati_homework_upload";

export default function AcademyClubChallengePage() {
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [workType, setWorkType] = useState<WorkType>("image");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function loadChallenge(currentUser: User) {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/academy-club/challenge", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر تحميل التحدي.");
      setChallenge(data.challenge ?? null);
      setSubmission(data.submission ?? null);
      if (data.challenge?.allowedTypes?.length) setWorkType(data.challenge.allowedTypes[0]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تحميل التحدي.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void loadChallenge(user);
    else setLoading(false);
  }, [user]);

  async function submitChallenge() {
    if (!user || !challenge || !file) {
      setError("اختر ملف المشاركة أولًا.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const resourceType = workType === "image" ? "image" : "video";
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok || !uploaded.secure_url) throw new Error("تعذر رفع الملف.");

      const token = await user.getIdToken();
      const response = await fetch("/api/academy-club/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          workType,
          fileUrl: uploaded.secure_url,
          cloudinaryPublicId: uploaded.public_id ?? "",
          note,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "تعذر إرسال المشاركة.");

      setMessage("تم إرسال مشاركتك إلى المعلم بنجاح 🌟");
      setFile(null);
      setNote("");
      await loadChallenge(user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر إرسال المشاركة.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ fontWeight: 900, color: "#f5d56b" }}>🏅 نادي الأكاديمية</div>
          <h1 style={{ margin: "6px 0" }}>🎯 تحدي النادي الأسبوعي</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>مهمة حصرية لأعضاء النادي</p>
        </div>
        <Link href="/academy-club" style={backStyle}>العودة إلى النادي ←</Link>
      </header>

      <div style={{ maxWidth: 850, margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <section style={cardStyle}>⏳ جارٍ تحميل التحدي...</section>
        ) : error && !challenge ? (
          <section style={cardStyle}>⚠️ {error}</section>
        ) : !challenge ? (
          <section style={cardStyle}>لا يوجد تحدٍ منشور الآن. انتظر التحدي القادم 🌟</section>
        ) : (
          <section style={cardStyle}>
            <div style={{ color: "#9a6b08", fontWeight: 900 }}>تحدي هذا الأسبوع</div>
            <h2 style={{ color: "#176c46", fontSize: 28 }}>{challenge.title}</h2>
            <p style={{ lineHeight: 1.9, color: "#53665d", whiteSpace: "pre-wrap" }}>
              {challenge.instructions}
            </p>
            <div style={infoStyle}>
              <span>⭐ المكافأة: {challenge.points} نقطة</span>
              <span>⏳ الإغلاق: {new Date(challenge.closesAt).toLocaleDateString("ar-SA")}</span>
            </div>

            {submission ? (
              <div style={{ ...statusStyle, background: submission.status === "approved" ? "#ecfdf5" : submission.status === "returned" ? "#fff7ed" : "#eff6ff" }}>
                {submission.status === "approved"
                  ? "✅ تم اعتماد مشاركتك وإضافة النقاط"
                  : submission.status === "returned"
                    ? "↩️ أعاد المعلم المشاركة"
                    : "⏳ مشاركتك تنتظر مراجعة المعلم"}
                {submission.teacherNote && <div style={{ marginTop: 8 }}>ملاحظة المعلم: {submission.teacherNote}</div>}
              </div>
            ) : challenge.isClosed ? (
              <div style={statusStyle}>انتهى وقت استقبال المشاركات.</div>
            ) : (
              <div style={{ display: "grid", gap: 15, marginTop: 22 }}>
                <label style={labelStyle}>
                  نوع المشاركة
                  <select value={workType} onChange={(e) => { setWorkType(e.target.value as WorkType); setFile(null); }} style={inputStyle}>
                    {challenge.allowedTypes.includes("image") && <option value="image">صورة</option>}
                    {challenge.allowedTypes.includes("audio") && <option value="audio">تسجيل صوتي</option>}
                    {challenge.allowedTypes.includes("video") && <option value="video">فيديو قصير</option>}
                  </select>
                </label>
                <label style={labelStyle}>
                  اختر الملف
                  <input
                    type="file"
                    accept={workType === "image" ? "image/*" : workType === "audio" ? "audio/*" : "video/*"}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  ملاحظة قصيرة (اختيارية)
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={inputStyle} />
                </label>
                {error && <div style={errorStyle}>{error}</div>}
                {message && <div style={successStyle}>{message}</div>}
                <button type="button" disabled={uploading || !file} onClick={() => void submitChallenge()} style={buttonStyle}>
                  {uploading ? "جارٍ رفع المشاركة..." : "📤 إرسال مشاركتي"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(#eefaf4,#fffaf0)", fontFamily: "Arial", color: "#17352a" };
const headerStyle: React.CSSProperties = { padding: "28px max(16px,calc((100% - 1050px)/2))", background: "linear-gradient(135deg,#176c46,#0f5237)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" };
const backStyle: React.CSSProperties = { color: "white", textDecoration: "none", padding: "11px 15px", border: "1px solid #ffffff66", borderRadius: 14 };
const cardStyle: React.CSSProperties = { background: "white", border: "2px solid #e7c35d", borderRadius: 26, padding: "clamp(22px,5vw,36px)", boxShadow: "0 15px 35px #174c3620", textAlign: "right" };
const infoStyle: React.CSSProperties = { display: "flex", gap: 18, flexWrap: "wrap", padding: 14, borderRadius: 15, background: "#fff8dc", fontWeight: 800 };
const statusStyle: React.CSSProperties = { marginTop: 20, padding: 18, borderRadius: 16, fontWeight: 900, textAlign: "center", background: "#f8fafc" };
const labelStyle: React.CSSProperties = { display: "grid", gap: 7, fontWeight: 900 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 13, border: "1px solid #bed8ca", font: "inherit", background: "white" };
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 15, padding: 14, background: "#176c46", color: "white", fontWeight: 900, fontSize: 17, cursor: "pointer" };
const errorStyle: React.CSSProperties = { padding: 12, borderRadius: 12, background: "#fff1f2", color: "#b91c1c", fontWeight: 800 };
const successStyle: React.CSSProperties = { padding: 12, borderRadius: 12, background: "#ecfdf5", color: "#166534", fontWeight: 800 };
