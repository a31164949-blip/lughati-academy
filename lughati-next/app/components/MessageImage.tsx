"use client";

import { useEffect, useRef, useState } from "react";

export function MessageImage({ url }: { url?: string }) {
  if (!url || !/^https:\/\/res\.cloudinary\.com\/ffv5igmg\/image\/upload\//.test(url)) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt="الصورة المرفقة بالرسالة — اضغط لتكبيرها" loading="lazy" className="max-h-96 max-w-full rounded-2xl object-contain" />
  </a>;
}

export function MessageImagePicker({ file, onChange, disabled = false }: {
  file: File | null; onChange: (file: File | null) => void; disabled?: boolean;
}) {
  const previewRef = useRef<HTMLImageElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file || !previewRef.current) return;
    const url = URL.createObjectURL(file);
    previewRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="mt-4 rounded-2xl border border-emerald-100 p-3">
    <label className="block font-bold text-emerald-800">📷 إرفاق صورة (اختياري)
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled}
        className="mt-2 block w-full" onChange={event => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          if (!selected) return;
          if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 30 * 1024 * 1024) {
            setError("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 30 ميجابايت."); return;
          }
          setError(""); onChange(selected);
        }} />
    </label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {file && <div className="mt-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={previewRef} alt="معاينة الصورة قبل الإرسال" className="max-h-52 max-w-full rounded-xl object-contain" />
      <button type="button" disabled={disabled} onClick={() => { onChange(null); setError(""); }} className="mt-2 rounded-xl bg-red-50 px-3 py-2 font-bold text-red-700">إزالة الصورة</button>
    </div>}
  </div>;
}
