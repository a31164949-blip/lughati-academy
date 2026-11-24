"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";
import { uploadCloudinary } from "../../lib/uploadCloudinary";

export default function TeacherAchievementPrize() {
  const [authorized, setAuthorized] = useState(false);
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setReady(true); setAuthorized(false); return; }
    try {
      const token = await user.getIdTokenResult();
      setAuthorized(token.claims.role === "teacher" || token.claims.role === "admin" ||
        user.email?.toLowerCase() === "a31164949@gmail.com");
      const response = await fetch("/api/achievement-prize", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        if (typeof data.imageUrl === "string") setImageUrl(data.imageUrl);
      }
    } catch { setStatus("تعذر التحقق من الجائزة الحالية."); }
    finally { setReady(true); }
  }), []);

  async function save() {
    const user = auth.currentUser;
    if (!user || !file || busy) return;
    setBusy(true); setStatus("");
    try {
      if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 10*1024*1024)
        throw Error("اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 10 ميجابايت.");
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "lughati_homework_upload");
      const response = await uploadCloudinary("https://api.cloudinary.com/v1_1/ffv5igmg/image/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || typeof data.secure_url !== "string") throw Error("تعذر رفع صورة الجائزة.");
      const token = await user.getIdToken();
      const saved = await fetch("/api/achievement-prize", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.secure_url }),
      });
      const body = await saved.json();
      if (!saved.ok) throw Error(body.message || "تعذر اعتماد الصورة.");
      setImageUrl(data.secure_url); setFile(null);
      setStatus("✅ تم اعتماد صورة الجائزة. ستظهر للطلاب بعد تحديث المحتوى المخزن مؤقتًا.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "تعذر حفظ الصورة."); }
    finally { setBusy(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-emerald-50 px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-3xl">
      <Link href="/teacher" className="font-bold text-emerald-800">← العودة إلى لوحة المعلم</Link>
      <header className="my-5 rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-extrabold">🏆 بنك الإنجاز — الجائزة الكبرى</h1>
        <p className="mt-3 text-lg font-bold text-emerald-800">الهدف النهائي: 1200 نقطة</p>
        <p className="mt-2 leading-8">الجائزة المستهدفة لنهاية الفصل الدراسي الأول: السيارة الزرقاء ذات العجلات الكبيرة وجهاز التحكم عن بُعد. الوصول للهدف يخضع للتحقق واعتماد المعلم؛ ولا تغير هذه الصفحة أرصدة الطلاب أو تمنح نقاطًا.</p>
      </header>
      {!ready ? <p>جارٍ التحقق من حساب المعلم…</p> : !authorized ?
        <p role="alert" className="rounded-xl bg-red-50 p-5">تعديل الجائزة متاح لحساب المعلم فقط.</p> :
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">📷 صورة السيارة الزرقاء</h2>
          <p className="mb-4 leading-7">اختر الصورة التي اعتمدتها من جهازك، ثم اضغط «اعتماد ونشر صورة الجائزة». ستظهر الصورة للطلاب داخل بنك إنجازي.</p>
          <input className="mb-4 block w-full rounded-xl border border-emerald-200 p-3" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button type="button" onClick={() => void save()} disabled={!file || busy} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">
            {busy ? "جارٍ الاعتماد…" : "📤 اعتماد ونشر صورة الجائزة"}
          </button>
          {imageUrl ? <div className="mt-5 rounded-2xl bg-sky-50 p-4">
            <h3 className="mb-3 font-bold">الصورة المعتمدة حاليًا</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="الصورة الحالية لجائزة السيارة الزرقاء" className="mx-auto max-h-72 w-full object-contain" />
          </div> : <p className="mt-5 text-slate-500">لا توجد صورة منشورة بعد. يظهر للطلاب رمز الجائزة مؤقتًا.</p>}
        </section>}
      {status && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 font-bold">{status}</p>}
      <Link href="/journey" className="mt-4 inline-block font-bold text-emerald-800 underline">معاينة بنك إنجازي في صفحة الطالب</Link>
    </div>
  </main>;
}
