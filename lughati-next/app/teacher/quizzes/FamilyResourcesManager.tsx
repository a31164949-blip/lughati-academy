"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type Resource = {
  id: string;
  title: string;
  description: string;
  category: "worksheet" | "test" | "review";
  classroom: string;
  fileUrl: string;
  fileName: string;
  fileKind: "image" | "pdf";
  published: boolean;
};

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ffv5igmg";
const UPLOAD_PRESET = "lughati_homework_upload";

function labelForCategory(category: Resource["category"]) {
  if (category === "test") return "اختبار";
  if (category === "review") return "مراجعة";
  return "ورقة عمل";
}

export default function FamilyResourcesManager() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Resource["category"]>("worksheet");
  const [classroom, setClassroom] = useState("جميع طلاب الصف الثاني");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadItems() {
    try {
      setLoading(true);
      const snapshot = await getDocs(
        query(collection(db, "familyLearningResources"), orderBy("createdAt", "desc"))
      );
      setItems(
        snapshot.docs.map((snapshotDoc) => {
          const data = snapshotDoc.data();
          return {
            id: snapshotDoc.id,
            title: String(data.title ?? "مادة تعليمية"),
            description: String(data.description ?? ""),
            category:
              data.category === "test" || data.category === "review"
                ? data.category
                : "worksheet",
            classroom: String(data.classroom ?? "جميع طلاب الصف الثاني"),
            fileUrl: String(data.fileUrl ?? ""),
            fileName: String(data.fileName ?? "الملف"),
            fileKind: data.fileKind === "pdf" ? "pdf" : "image",
            published: data.published === true,
          };
        })
      );
    } catch (error) {
      console.error("تعذر تحميل مواد الأسرة:", error);
      setMessage("تعذر تحميل المواد حاليًا.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function uploadFile(selectedFile: File) {
    const isPdf = selectedFile.type === "application/pdf";
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", UPLOAD_PRESET);
    const response = await fetch(
      `${CLOUDINARY_URL}/${isPdf ? "raw" : "image"}/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) throw new Error("UPLOAD_FAILED");
    const result = (await response.json()) as { secure_url?: string };
    if (!result.secure_url) throw new Error("MISSING_URL");
    return { fileUrl: result.secure_url, fileKind: isPdf ? "pdf" as const : "image" as const };
  }

  async function publishResource() {
    if (!title.trim()) return setMessage("اكتب عنوان المادة أولًا.");
    if (!file) return setMessage("اختر ملف PDF أو صورة أولًا.");
    if (file.size > 10 * 1024 * 1024) return setMessage("حجم الملف يجب ألا يتجاوز 10 ميجابايت.");
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      return setMessage("الملفات المتاحة: PDF أو صورة فقط.");
    }

    try {
      setSaving(true);
      setMessage("جارٍ رفع الملف ونشره...");
      const uploaded = await uploadFile(file);
      await addDoc(collection(db, "familyLearningResources"), {
        title: title.trim(),
        description: description.trim(),
        category,
        classroom,
        fileUrl: uploaded.fileUrl,
        fileName: file.name.slice(0, 160),
        fileKind: uploaded.fileKind,
        published: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTitle("");
      setDescription("");
      setFile(null);
      setMessage("تم النشر لولي الأمر بنجاح ✅");
      await loadItems();
    } catch (error) {
      console.error("تعذر نشر المادة:", error);
      setMessage("تعذر رفع الملف أو نشره. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: Resource) {
    await updateDoc(doc(db, "familyLearningResources", item.id), {
      published: !item.published,
      updatedAt: serverTimestamp(),
    });
    setItems((current) =>
      current.map((entry) => entry.id === item.id ? { ...entry, published: !entry.published } : entry)
    );
  }

  async function removeItem(item: Resource) {
    if (!window.confirm(`هل تريد حذف «${item.title}»؟`)) return;
    await deleteDoc(doc(db, "familyLearningResources", item.id));
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <span style={eyebrowStyle}>جديد في قسم الاختبارات</span>
          <h2 style={{ margin: "8px 0 5px", color: "#173f34" }}>📚 أوراق العمل والاختبارات للأسرة</h2>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.8 }}>
            ارفع ورقة عمل أو اختبارًا ليتمكن ولي الأمر من الاطلاع عليه وتحميله.
          </p>
        </div>
        <div style={iconStyle}>📄</div>
      </div>

      <div style={formGridStyle}>
        <label style={fieldStyle}><b>نوع المادة</b><select value={category} onChange={(e) => setCategory(e.target.value as Resource["category"])} style={inputStyle}><option value="worksheet">ورقة عمل</option><option value="test">اختبار</option><option value="review">مراجعة وتدريب</option></select></label>
        <label style={fieldStyle}><b>الفصل المستهدف</b><select value={classroom} onChange={(e) => setClassroom(e.target.value)} style={inputStyle}><option>جميع طلاب الصف الثاني</option><option>الصف الثاني أ</option><option>الصف الثاني ب</option></select></label>
        <label style={fieldStyle}><b>عنوان المادة</b><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ورقة عمل درس آداب التعامل" style={inputStyle} /></label>
        <label style={fieldStyle}><b>الملف</b><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={fileStyle} /></label>
      </div>
      <label style={fieldStyle}><b>تعليمات لولي الأمر — اختياري</b><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: تُحل الورقة بعد مراجعة الدرس" style={{ ...inputStyle, minHeight: 78, resize: "vertical" }} /></label>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={publishResource} disabled={saving} style={{ ...publishStyle, opacity: saving ? .65 : 1 }}>{saving ? "جارٍ النشر..." : "نشر لولي الأمر ←"}</button>
        {message && <span style={{ color: message.includes("✅") ? "#147a5b" : "#9a6700", fontWeight: 700 }}>{message}</span>}
      </div>

      <div style={{ marginTop: 24, borderTop: "1px solid #e2ece8", paddingTop: 18 }}>
        <h3 style={{ margin: "0 0 12px", color: "#294f44" }}>المواد المرفوعة</h3>
        {loading ? <p>جارٍ التحميل...</p> : items.length === 0 ? <p style={emptyStyle}>لم تُرفع أي مادة حتى الآن.</p> : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item) => <article key={item.id} style={itemStyle}>
              <div><strong>{item.fileKind === "pdf" ? "📕" : "🖼️"} {item.title}</strong><div style={{ color: "#64748b", marginTop: 5, fontSize: 14 }}>{labelForCategory(item.category)} • {item.classroom} • {item.published ? "منشور" : "مخفي"}</div></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><a href={item.fileUrl} target="_blank" rel="noreferrer" style={smallLinkStyle}>معاينة</a><button onClick={() => void togglePublished(item)} style={smallButtonStyle}>{item.published ? "إخفاء" : "إعادة النشر"}</button><button onClick={() => void removeItem(item)} style={{ ...smallButtonStyle, color: "#b42318" }}>حذف</button></div>
            </article>)}
          </div>
        )}
      </div>
    </section>
  );
}

const cardStyle = { padding: 22, marginBottom: 22, borderRadius: 24, background: "linear-gradient(135deg,#fffdf4,#f3fbf7)", border: "1px solid #eadb9d", boxShadow: "0 10px 30px rgba(30,80,65,.06)" };
const headerStyle = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 20 };
const eyebrowStyle = { display: "inline-block", padding: "5px 10px", borderRadius: 999, background: "#fff0b9", color: "#805b00", fontWeight: 800, fontSize: 13 };
const iconStyle = { width: 64, height: 64, borderRadius: 18, display: "grid", placeItems: "center", background: "#fff4c8", fontSize: 32, flexShrink: 0 };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 };
const fieldStyle = { display: "grid", gap: 8, color: "#294f44", marginBottom: 14 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px 13px", border: "1px solid #cbded6", borderRadius: 12, background: "#fff", color: "#173f34", fontSize: 15 };
const fileStyle = { ...inputStyle, padding: 10 };
const publishStyle = { border: 0, borderRadius: 14, background: "linear-gradient(135deg,#17845f,#126747)", color: "#fff", padding: "13px 20px", fontSize: 16, fontWeight: 800, cursor: "pointer" };
const emptyStyle = { margin: 0, padding: 16, textAlign: "center" as const, borderRadius: 14, background: "rgba(255,255,255,.7)", color: "#64748b" };
const itemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const, padding: 14, borderRadius: 15, background: "rgba(255,255,255,.86)", border: "1px solid #dce9e4" };
const smallButtonStyle = { border: "1px solid #d4e5dd", background: "#fff", borderRadius: 10, padding: "8px 11px", cursor: "pointer", color: "#245b49", fontWeight: 700 };
const smallLinkStyle = { ...smallButtonStyle, textDecoration: "none", display: "inline-block" };
