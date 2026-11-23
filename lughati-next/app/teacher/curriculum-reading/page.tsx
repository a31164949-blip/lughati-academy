"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";
import { uploadCloudinary } from "../../lib/uploadCloudinary";

type Lesson = { title: string; imageUrl: string };
const field = "w-full rounded-xl border border-emerald-200 bg-white p-3";
export default function ManageCurriculumReading() {
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [current, setCurrent] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(auth, async user => {
    if (!user) { setAuthorized(false); setReady(true); return; }
    try {
      const response = await fetch("/api/curriculum-reading", { cache: "no-store" });
      const body = await response.json();
      if (response.ok && body.success) {
        setCurrent(body.lesson || null);
        if (body.lesson?.title) setTitle(body.lesson.title);
      }
      // Server will enforce the teacher role for writes.
      const claims = (await user.getIdTokenResult()).claims;
      setAuthorized(claims.role === "teacher" || claims.role === "admin" || user.email?.toLowerCase() === "a31164949@gmail.com");
    } catch { setMessage("تعذر تحميل الصورة الحالية."); }
    finally { setReady(true); }
  }), []);

  async function publish() {
    const user = auth.currentUser;
    if (!user || busy || !file) return;
    setBusy(true); setMessage("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)
        throw Error("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 10 ميجابايت.");
      if (title.trim().length < 3 || title.trim().length > 90)
        throw Error("أدخل عنوانًا من 3 إلى 90 حرفًا.");
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "lughati_homework_upload");
      const upload = await uploadCloudinary("https://api.cloudinary.com/v1_1/ffv5igmg/image/upload", { method: "POST", body: form });
      const image = await upload.json();
      if (!upload.ok || typeof image.secure_url !== "string") throw Error("تعذر رفع الصورة.");
      const token = await user.getIdToken();
      const response = await fetch("/api/curriculum-reading", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), imageUrl: image.secure_url }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.message || "تعذر نشر الصورة.");
      setCurrent({ title: title.trim(), imageUrl: image.secure_url });
      setFile(null);
      setMessage("✅ نُشرت صفحة المنهج، ويمكن للطلاب قراءتها وتسجيل أصواتهم.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر النشر."); }
    finally { setBusy(false); }
  }

  async function unpublish() {
    if (!current || !auth.currentUser || busy) return;
    if (!confirm("هل تريد إلغاء نشر صورة المنهج الحالية؟ لن تحذف الصورة من خادم الصور.")) return;
    setBusy(true); setMessage("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/curriculum-reading", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw Error("تعذر إلغاء النشر.");
      setCurrent(null);
      setMessage("تم إلغاء نشر صورة المنهج.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر إلغاء النشر."); }
    finally { setBusy(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-emerald-50 px-4 py-8 text-emerald-950">
    <div className="mx-auto max-w-3xl">
      <Link href="/teacher" className="font-bold text-emerald-800">← لوحة المعلم</Link>
      <header className="my-5 rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">📖 إدارة قراءة المنهج</h1>
        <p className="mt-3 leading-8">أضف صورة واحدة لصفحة القراءة الحالية، أو استبدلها. سيشاهد الطلاب الصورة ويستطيعون تسجيل قراءتهم والاستماع إليها على أجهزتهم دون رفع الصوت تلقائيًا.</p>
      </header>
      {!ready ? <p>جارٍ التحقق من حساب المعلم…</p> :
        !authorized ? <p role="alert" className="rounded-xl bg-red-50 p-5">هذه الصفحة متاحة للمعلم فقط. سجّل الدخول من حساب المعلم.</p> :
          <section className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
            <label className="block font-bold">عنوان الدرس أو الصفحة
              <input className={field + " mt-2"} value={title} onChange={e => setTitle(e.target.value)} maxLength={90} placeholder="مثال: رحلة حبة قمح" />
            </label>
            <label className="block font-bold">صورة صفحة المنهج
              <input className={field + " mt-2"} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            <p className="text-sm text-slate-600">اختر صورة واضحة ومستقيمة. عند نشر صورة جديدة تُستبدل الصفحة السابقة، مع قراءة واحدة فقط من Firestore لكل تحميل للصفحة.</p>
            <button onClick={() => void publish()} disabled={!file || busy} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? "جارٍ النشر…" : "📤 نشر صورة المنهج"}</button>
            {current && <div className="rounded-xl border border-emerald-100 p-4">
              <h2 className="mb-3 text-xl font-bold">الصورة المنشورة حاليًا: {current.title}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.imageUrl} alt="صورة صفحة المنهج المنشورة" className="max-h-[60vh] w-full object-contain" />
              <button onClick={() => void unpublish()} disabled={busy} className="mt-4 rounded-xl border border-red-200 px-5 py-3 font-bold text-red-800">إلغاء نشر الصورة</button>
            </div>}
          </section>}
      {message && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4">{message}</p>}
      <Link href="/curriculum-reading" className="mt-5 inline-block font-bold text-emerald-800 underline">معاينة صفحة الطالب</Link>
    </div>
  </main>;
}
