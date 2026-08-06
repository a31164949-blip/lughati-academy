"use client";

import { useState } from "react";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
const NOTEBOOK_CATEGORIES = [
  { id: "handwriting", label: "خط جميل", icon: "✍️" },
  { id: "design", label: "تنسيق مميز", icon: "🎨" },
  { id: "care", label: "عناية بالدفتر", icon: "📒" },
  { id: "progress", label: "تطور ملحوظ", icon: "🌱" },
];

export default function NotebookGalleryTeacherPage() {
  const [studentName, setStudentName] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);
const [publishMessage, setPublishMessage] = useState("");
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState("");
async function uploadImageToCloudinary(file: File) {
  const formData = new FormData();
  

  formData.append("file", file);
  formData.append("upload_preset", "lughati_homework_upload");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`فشل رفع الصورة: ${errorText}`);
}

const data = await response.json();

  return data.secure_url as string;
}
async function handlePublish() {
  if (!studentName.trim() || !category || !selectedFile) {
    setPublishMessage("أكمل اسم الطالب والتصنيف والصورة أولًا.");
    return;
  }

  try {
    setPublishing(true);
    setPublishMessage("");

    const imageUrl = await uploadImageToCloudinary(selectedFile);

    const entryId = `notebook-${Date.now()}`;

    await setDoc(doc(db, "notebookGallery", entryId), {
      studentName: studentName.trim(),
      category,
      note: note.trim(),
      imageUrl,
      badge: "دفتر أنيق ✨",
      publishedAt: serverTimestamp(),
    });

    setPublishMessage("تم النشر في جماليات الدفاتر ✨");

    setStudentName("");
    setCategory("");
    setNote("");
    setSelectedFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
  } catch (error) {
    console.error(error);
    setPublishMessage("تعذر النشر، حاول مرة أخرى.");
  } finally {
    setPublishing(false);
  }
}
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "32px 18px 70px",
        background:
          "linear-gradient(180deg, #fffdf7 0%, #f4fbf8 50%, #fffaf0 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#174c3b",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section
          style={{
            background: "white",
            borderRadius: 28,
            padding: "30px 22px",
            textAlign: "center",
            boxShadow: "0 12px 35px rgba(22, 138, 99, 0.10)",
            border: "1px solid #e5eee9",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 55 }}>✨📒</div>

          <h1
            style={{
              margin: "10px 0",
              fontSize: 34,
              color: "#936b12",
            }}
          >
            جماليات الدفاتر
          </h1>

          <p
            style={{
              margin: 0,
              color: "#637a71",
              lineHeight: 1.9,
            }}
          >
            مساحة المعلم لتكريم جمال الخط، وحسن التنظيم،
            والعناية بالدفتر، والتطور الملحوظ.
          </p>
        </section>

        <section
          style={{
            background: "white",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>🌟 إضافة عمل جديد</h2>

          <label style={{ fontWeight: 800 }}>اسم الطالب</label>

          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="اكتب اسم الطالب"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 8,
              marginBottom: 22,
              padding: 15,
              borderRadius: 14,
              border: "1px solid #d8e6df",
              fontSize: 16,
            }}
          />

          <div style={{ fontWeight: 800, marginBottom: 10 }}>
            اختر جمال التميز
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 22,
            }}
          >
            {NOTEBOOK_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                style={{
                  padding: "16px 10px",
                  borderRadius: 16,
                  border:
                    category === item.id
                      ? "2px solid #168a63"
                      : "1px solid #e7d7a5",
                  background:
                    category === item.id ? "#eaf8f2" : "#fffdf7",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 27, marginBottom: 6 }}>
                  {item.icon}
                </div>
                {item.label}
              </button>
            ))}
          </div>

          <label style={{ fontWeight: 800 }}>كلمة من المعلم</label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: تطور رائع في جمال الخط وترتيب الدفتر 👏"
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 8,
              padding: 15,
              borderRadius: 14,
              border: "1px solid #d8e6df",
              fontSize: 16,
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: 22 }}>
  <div style={{ fontWeight: 800, marginBottom: 10 }}>
    📷 صورة الدفتر
  </div>

  <label
    style={{
      display: "block",
      border: "2px dashed #c9ded4",
      borderRadius: 18,
      padding: 22,
      textAlign: "center",
      background: "#f8fcfa",
      cursor: "pointer",
    }}
  >
    <div style={{ fontSize: 38, marginBottom: 8 }}>📸</div>

    <div style={{ fontWeight: 900, color: "#168a63" }}>
      اضغط لاختيار صورة الدفتر
    </div>

    <div
      style={{
        marginTop: 6,
        fontSize: 13,
        color: "#7a8d85",
      }}
    >
      JPG أو PNG
    </div>

    <input
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setSelectedFile(file);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(file));
      }}
    />
  </label>

  {previewUrl && (
    <div
      style={{
        marginTop: 18,
        padding: 12,
        borderRadius: 20,
        background: "#fffaf0",
        border: "1px solid #ead7a3",
      }}
    >
      <div
        style={{
          fontWeight: 900,
          marginBottom: 10,
          color: "#936b12",
        }}
      >
        ✨ معاينة قبل النشر
      </div>

      <img
        src={previewUrl}
        alt="معاينة صورة الدفتر"
        style={{
          width: "100%",
          maxHeight: 430,
          objectFit: "contain",
          borderRadius: 16,
          background: "white",
        }}
      />
    </div>
  )}
</div>
<button
  type="button"
  onClick={handlePublish}
  disabled={
  publishing ||
  !studentName.trim() ||
  !category ||
  !selectedFile
}
  style={{
    width: "100%",
    marginTop: 24,
    padding: "16px 18px",
    border: "none",
    borderRadius: 16,
    background:
      !studentName.trim() || !category || !selectedFile
        ? "#b9c9c2"
        : "linear-gradient(135deg, #168a63, #0f7654)",
    color: "white",
    fontSize: 18,
    fontWeight: 900,
    cursor:
      !studentName.trim() || !category || !selectedFile
        ? "not-allowed"
        : "pointer",
    boxShadow:
      !studentName.trim() || !category || !selectedFile
        ? "none"
        : "0 10px 24px rgba(22,138,99,.22)",
  }}
>
{publishing
  ? "جارٍ النشر... ⏳"
  : "✨ نشر في جماليات الدفاتر"}
</button>
{publishMessage && (
  <div
    style={{
      marginTop: 14,
      textAlign: "center",
      fontWeight: 800,
      color: publishMessage.includes("تم")
        ? "#168a63"
        : "#a33a3a",
    }}
  >
    {publishMessage}
  </div>
)}
        </section>
      </div>
    </main>
  );
}