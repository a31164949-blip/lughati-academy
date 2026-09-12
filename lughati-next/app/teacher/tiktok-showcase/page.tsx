"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../../firebase";

const classroomOptions = ["الفصلان", "الثاني أ", "الثاني ب"];

const emptyForm = {
  title: "",
  tiktokUrl: "",
  coverImageUrl: "",
  description: "",
  classroom: "الفصلان",
  studentDisplayName: "",
  published: false,
  notifyStudents: false,
  displayOrder: "1",
};

type ShowcaseForm = typeof emptyForm;

type TikTokItem = ShowcaseForm & {
  id: string;
  notificationSent: boolean;
};

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getFirstName(value: string) {
  return value.trim().split(/\s+/)[0] || "";
}

function mapItem(id: string, data: Record<string, unknown>): TikTokItem {
  return {
    id,
    title: readString(data.title),
    tiktokUrl: readString(data.tiktokUrl),
    coverImageUrl: readString(data.coverImageUrl),
    description: readString(data.description),
    classroom: readString(data.classroom) || "الفصلان",
    studentDisplayName: getFirstName(readString(data.studentDisplayName)),
    published: data.published === true,
    notifyStudents: false,
    displayOrder:
      typeof data.displayOrder === "number" ? String(data.displayOrder) : "1",
    notificationSent: data.notificationSent === true,
  };
}

export default function TeacherTikTokShowcasePage() {
  const [items, setItems] = useState<TikTokItem[]>([]);
  const [form, setForm] = useState<ShowcaseForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      setLoading(true);
      const snapshot = await getDocs(
        query(collection(db, "tiktokShowcase"), orderBy("displayOrder", "asc"))
      );
      setItems(
        snapshot.docs.map((documentSnapshot) =>
          mapItem(documentSnapshot.id, documentSnapshot.data() as Record<string, unknown>)
        )
      );
    } catch (loadError) {
      console.error("تعذر تحميل مختارات TikTok:", loadError);
      setError("تعذر تحميل المقاطع. تحقق من اتصال Firebase وصلاحيات المعلم.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function updateForm(field: keyof ShowcaseForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setMessage("");
    setError("");
  }

  function editItem(item: TikTokItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      tiktokUrl: item.tiktokUrl,
      coverImageUrl: item.coverImageUrl,
      description: item.description,
      classroom: item.classroom,
      studentDisplayName: item.studentDisplayName,
      published: item.published,
      notifyStudents: false,
      displayOrder: item.displayOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const tiktokUrl = form.tiktokUrl.trim();
    const coverImageUrl = form.coverImageUrl.trim();
    const description = form.description.trim();
    const studentDisplayName = getFirstName(form.studentDisplayName);
    const displayOrder = Number(form.displayOrder);

    if (!title) {
      setError("اكتب عنوان المقطع أولًا.");
      return;
    }

    const isTikTokUrl =
      /^https:\/\/(www\.)?tiktok\.com\//i.test(tiktokUrl) ||
      /^https:\/\/vt\.tiktok\.com\//i.test(tiktokUrl);

    if (!isTikTokUrl) {
      setError("استخدم رابط TikTok كامل أو مختصر يبدأ بـ https://vt.tiktok.com/");
      return;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      setError("ترتيب الظهور يجب أن يكون رقمًا صحيحًا يبدأ من 1.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const existingItem = editingId
        ? items.find((item) => item.id === editingId)
        : undefined;
      const isFirstPublication =
        form.published === true &&
        existingItem?.published !== true &&
        existingItem?.notificationSent !== true;
      const shouldNotifyStudents =
        form.published === true &&
        form.notifyStudents === true &&
        isFirstPublication;
      const itemReference = editingId
        ? doc(db, "tiktokShowcase", editingId)
        : doc(collection(db, "tiktokShowcase"));
      const itemData = {
        title,
        tiktokUrl,
        coverImageUrl,
        description,
        classroom: form.classroom,
        studentDisplayName,
        published: form.published,
        displayOrder,
        notificationSent:
          existingItem?.notificationSent === true || shouldNotifyStudents,
        updatedAt: serverTimestamp(),
      };

      if (shouldNotifyStudents) {
        const studentsSnapshot = await getDocs(
          query(collection(db, "students"), where("active", "==", true))
        );
        const batch = writeBatch(db);

        batch.set(itemReference, {
          ...itemData,
          ...(editingId ? {} : { createdAt: serverTimestamp() }),
        });

        studentsSnapshot.docs
          .filter((studentDocument) => {
            const studentData = studentDocument.data();
            const studentClass = String(
              studentData.classroom ?? studentData.className ?? ""
            ).trim();

            return (
              form.classroom === "الفصلان" ||
              studentClass === form.classroom
            );
          })
          .forEach((studentDocument) => {
            const studentData = studentDocument.data();
            const studentId =
              typeof studentData.studentId === "string"
                ? studentData.studentId
                : studentDocument.id;
            const notificationReference = doc(
              db,
              "studentNotifications",
              `tiktok-${itemReference.id}-${studentDocument.id}`
            );

            batch.set(notificationReference, {
              studentId,
              studentDocId: studentDocument.id,
              title: "🎬 مقطع جديد في ركن تيك توك",
              message: `تم نشر مقطع جديد في أكاديمية لغتي${studentDisplayName ? ` من ${studentDisplayName}` : ""}.`,
              type: "tiktok-showcase",
              tiktokShowcaseId: itemReference.id,
              href: "/#tiktok-section-title",
              read: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });

        await batch.commit();
        setMessage("تم نشر المقطع وإرسال إشعار واحد للطلاب المستهدفين.");
      } else if (editingId) {
        await updateDoc(itemReference, itemData);
        setMessage("تم تحديث المقطع بنجاح.");
      } else {
        await addDoc(collection(db, "tiktokShowcase"), {
          ...itemData,
          createdAt: serverTimestamp(),
        });
        setMessage("تم حفظ المقطع. لن يظهر للزوار إلا إذا كانت حالة النشر مفعّلة.");
      }

      resetForm();
      await loadItems();
    } catch (saveError) {
      console.error("تعذر حفظ مقطع TikTok:", saveError);
      setError("تعذر حفظ المقطع. تأكد من تسجيل دخول المعلم.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: TikTokItem) {
    try {
      setUpdatingId(item.id);
      await updateDoc(doc(db, "tiktokShowcase", item.id), {
        published: !item.published,
        updatedAt: serverTimestamp(),
      });
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, published: !item.published }
            : currentItem
        )
      );
      setMessage(item.published ? "تم إخفاء المقطع من الواجهة." : "تم نشر المقطع في الواجهة.");
    } catch (toggleError) {
      console.error("تعذر تغيير نشر مقطع TikTok:", toggleError);
      setError("تعذر تغيير حالة النشر.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main dir="rtl" style={{ minHeight: "100vh", padding: "28px 16px 70px", background: "linear-gradient(180deg, #f3fbf7 0%, #ffffff 55%, #f5f8ff 100%)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#0f8a67", fontWeight: 900 }}>لوحة المعلم</p>
            <h1 style={{ margin: "6px 0", color: "#14513d", fontSize: "clamp(28px, 5vw, 42px)" }}>🎬 أكاديمية لغتي على تيك توك</h1>
            <p style={{ margin: 0, color: "#64756d", lineHeight: 1.8 }}>اعتمد المقاطع المختارة وأدر ظهورها في الواجهة الرئيسية.</p>
          </div>
          <Link href="/teacher" style={{ padding: "11px 16px", borderRadius: 14, background: "#ffffff", border: "1px solid #b8e3d4", color: "#087f5b", fontWeight: 900 }}>العودة إلى لوحة المعلم</Link>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(280px, 390px) minmax(0, 1fr)", gap: 22, alignItems: "start" }}>
          <form onSubmit={saveItem} style={{ padding: 22, borderRadius: 24, background: "#ffffff", border: "1px solid #dcefe8", boxShadow: "0 12px 30px rgba(24, 75, 57, 0.08)" }}>
            <h2 style={{ marginTop: 0, color: "#14513d" }}>{editingId ? "تعديل المقطع" : "إضافة مقطع مختار"}</h2>
            <p style={{ color: "#64756d", lineHeight: 1.7, fontSize: 14 }}>لا تستخدم بيانات الطالب الشخصية. الاسم الاختياري هنا اسم عرض يكتبه المعلم فقط.</p>

            <label style={labelStyle}>عنوان المقطع<input required value={form.title} onChange={(event) => updateForm("title", event.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>رابط TikTok<input required type="url" value={form.tiktokUrl} onChange={(event) => updateForm("tiktokUrl", event.target.value)} placeholder="https://www.tiktok.com/@.../video/..." style={inputStyle} /></label>
            <label style={labelStyle}>رابط صورة الغلاف (اختياري)<input type="url" value={form.coverImageUrl} onChange={(event) => updateForm("coverImageUrl", event.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>وصف قصير<textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} maxLength={180} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></label>
            <label style={labelStyle}>الصف<select value={form.classroom} onChange={(event) => updateForm("classroom", event.target.value)} style={inputStyle}>{classroomOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label style={labelStyle}>اسم الطالب المشارك (اختياري، الاسم الأول فقط)<input value={form.studentDisplayName} onChange={(event) => updateForm("studentDisplayName", event.target.value)} maxLength={50} style={inputStyle} /></label>
            <label style={labelStyle}>ترتيب الظهور<input required type="number" min="1" step="1" value={form.displayOrder} onChange={(event) => updateForm("displayOrder", event.target.value)} style={inputStyle} /></label>
            <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "14px 0", color: "#14513d", fontWeight: 900 }}><input type="checkbox" checked={form.published} onChange={(event) => updateForm("published", event.target.checked)} /> نشر المقطع بعد الحفظ</label>
            <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "14px 0", color: "#14513d", fontWeight: 900 }}><input type="checkbox" checked={form.notifyStudents} onChange={(event) => updateForm("notifyStudents", event.target.checked)} disabled={!form.published} /> إرسال إشعار للطلاب عند النشر لأول مرة</label>

            {error && <p style={messageStyle("#fff1f1", "#b42318")}>{error}</p>}
            {message && <p style={messageStyle("#ecfdf5", "#087f5b")}>{message}</p>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving} style={buttonStyle}>{saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "حفظ المقطع"}</button>
              {editingId && <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: "#ffffff", color: "#64756d", border: "1px solid #cfe3da" }}>إلغاء التعديل</button>}
            </div>
          </form>

          <section style={{ padding: 22, borderRadius: 24, background: "#ffffff", border: "1px solid #dcefe8", boxShadow: "0 12px 30px rgba(24, 75, 57, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div><h2 style={{ margin: 0, color: "#14513d" }}>المقاطع المختارة</h2><p style={{ margin: "6px 0 0", color: "#64756d" }}>المقاطع غير المنشورة محفوظة للمعلم ولا تظهر للزوار.</p></div>
              <span style={{ color: "#0f8a67", fontWeight: 900 }}>{items.length} مقطع</span>
            </div>
            {loading ? <p style={{ color: "#64756d" }}>جارٍ تحميل المقاطع...</p> : items.length === 0 ? <p style={{ padding: 24, color: "#64756d", background: "#f7fbf8", borderRadius: 16 }}>لا توجد مقاطع مضافة حتى الآن.</p> : <div style={{ display: "grid", gap: 12, marginTop: 18 }}>{items.map((item) => <article key={item.id} style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr)", gap: 14, padding: 12, borderRadius: 18, border: "1px solid #dcefe8", background: item.published ? "#f7fffb" : "#fafafa" }}>{item.coverImageUrl ? <img src={item.coverImageUrl} alt="" style={{ width: "100%", aspectRatio: "1.2", objectFit: "cover", borderRadius: 12, background: "#eaf8f0" }} /> : <div style={{ display: "grid", placeItems: "center", aspectRatio: "1.2", borderRadius: 12, background: "linear-gradient(135deg, #0f6546, #16845b 48%, #f4c95d)", color: "#ffffff", fontSize: 30 }}>🎬</div>}<div style={{ minWidth: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><h3 style={{ margin: 0, color: "#174c3b", fontSize: 17 }}>{item.title}</h3><span style={{ whiteSpace: "nowrap", color: item.published ? "#087f5b" : "#8a6700", fontSize: 12, fontWeight: 900 }}>{item.published ? "منشور" : "مسودة"}</span></div><p style={{ margin: "6px 0", color: "#64756d", fontSize: 13 }}>{item.description || "بدون وصف"}</p><span style={{ color: "#718078", fontSize: 12 }}>{item.classroom} • ترتيب {item.displayOrder}</span><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}><button type="button" onClick={() => editItem(item)} style={smallButtonStyle}>تعديل</button><button type="button" disabled={updatingId === item.id} onClick={() => void togglePublished(item)} style={{ ...smallButtonStyle, color: item.published ? "#b42318" : "#087f5b" }}>{updatingId === item.id ? "..." : item.published ? "إخفاء" : "نشر"}</button><a href={item.tiktokUrl} target="_blank" rel="noopener noreferrer" style={{ ...smallButtonStyle, color: "#111827", textDecoration: "none" }}>فتح الرابط ↗</a></div></div></article>)}</div>}
          </section>
        </section>
      </div>
    </main>
  );
}

const labelStyle = { display: "grid", gap: 7, marginTop: 14, color: "#245646", fontWeight: 800, fontSize: 14 } as const;
const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 12, border: "1px solid #cfe3da", background: "#fbfffd", color: "#17352d", font: "inherit" } as const;
const buttonStyle = { padding: "11px 16px", border: 0, borderRadius: 12, background: "#0f8a67", color: "#ffffff", fontWeight: 900, cursor: "pointer" } as const;
const smallButtonStyle = { padding: "7px 10px", borderRadius: 10, border: "1px solid #cfe3da", background: "#ffffff", color: "#087f5b", fontWeight: 800, cursor: "pointer" } as const;
function messageStyle(background: string, color: string) { return { padding: 11, borderRadius: 12, background, color, lineHeight: 1.7, fontSize: 13 }; }
