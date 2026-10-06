"use client";

import Link from "next/link";
import { useState } from "react";
import { auth } from "../../../firebase";

type Source = "cloudinary" | "r2" | "retention";
type Item = { id: string; name: string; kind: string; createdAt: string; bytes?: number; duplicate?: boolean; href?: string };
function kindLabel(kind: string, source: Source) {
  return ({ image: "صورة", video: source === "r2" ? "فيديو" : "صوت أو فيديو", raw: "ملف", studentWorks: "أعمال الطلاب", academyStories: "نبض الأكاديمية", notebookNominations: "ترشيحات الدفاتر" } as Record<string, string>)[kind] || "ملف";
}
export default function StorageReviewPage() {
  const [source, setSource] = useState<Source>("cloudinary");
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function review(nextSource: Source, nextCursor = "") {
    setBusy(true); setMessage(""); setSource(nextSource); setItems([]); setCursor("");
    try {
      const user = auth.currentUser;
      if (!user) throw Error("يلزم تسجيل الدخول بحساب المعلم.");
      const token = await user.getIdToken();
      const response = await fetch("/api/teacher/storage-review", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ source: nextSource, cursor: nextCursor }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || "تعذر إجراء المراجعة.");
      setItems(result.items); setCursor(result.nextCursor || "");
      setMessage(nextSource === "retention" ? `تمت مراجعة ${result.checkedRecords} سجلًا من المرفوضات. هذه قائمة محدودة وليست جردًا كاملًا؛ ${result.items.length} مشاركة أقدم من 30 يومًا.${result.partial ? " توجد نتائج أخرى لم تُفحص." : ""}` : "هذه بيانات أحجام الملفات الأصلية، ولا تشمل مجموع النسخ المحوّلة أو الاحتياطية. لم يُفحص استخدام الملفات بعد، ولم يُحذف شيء.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر إجراء المراجعة."); }
    finally { setBusy(false); }
  }
  return <main dir="rtl" className="mx-auto max-w-6xl space-y-6 p-5">
    <Link href="/teacher" className="font-bold text-emerald-800">← لوحة المعلم</Link>
    <header><h1 className="text-3xl font-black text-emerald-900">💾 إدارة مساحة التخزين</h1><p className="mt-3 text-slate-700">الصور الجديدة تُجهّز بحجم مناسب قبل الرفع. مراجعة الملفات القديمة تبدأ باختيارك، دون تحميل الصور أو الفيديوهات.</p></header>
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="text-xl font-bold">سياسة الاحتفاظ والمراجعة</h2><ul className="mt-3 list-inside list-disc space-y-2"><li>مراجعة المشاركات المرفوضة وغير المنشورة بعد 30 يومًا، دون حذف تلقائي.</li><li>القراءات التدريبية تُراجع بعد نهاية الفصل الدراسي مع حفظ النتائج والأعمال المميزة. لم يُحدد موعد حذف.</li><li>الأعمال المعتمدة والمنشورة تبقى محفوظة. نشر العمل في المعرض يستخدم رابط الملف نفسه.</li><li>قبل حذف أي ملف قديم، نتحقق من استخدامه ونراجع حجم التوفير. الملفات الكبيرة أو المتشابهة ليست بالضرورة زائدة.</li></ul></section>
    <div className="flex flex-wrap gap-3">{([['cloudinary','مراجعة أكبر ملفات Cloudinary'],['r2','مراجعة دفعة فيديوهات R2'],['retention','مراجعة المرفوضات القديمة']] as const).map(([value,label]) => <button key={value} disabled={busy} onClick={() => void review(value)} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white disabled:opacity-50">{label}</button>)}</div>
    <p className="text-sm text-slate-600">كل طلب يعرض حتى 50 ملفًا للتخزين، أو يفحص حتى 75 سجلًا للمرفوضات. النتائج تُحفظ مؤقتًا لخمس دقائق لتقليل الطلبات. ترتيب R2 حسب الحجم داخل الدفعة المعروضة فقط.</p>
    <p role="status" aria-live="polite" className="rounded-xl bg-white p-4 text-slate-800">{busy ? "جارٍ إجراء المراجعة…" : message || "اختر نوع المراجعة لبدء الفحص."}</p>
    {items.length > 0 && <section className="space-y-3"><h2 className="text-xl font-bold">النتائج المعروضة: {items.length}{source !== "retention" ? ` — حجم الأصول في هذه الدفعة: ${(items.reduce((n,item) => n + (item.bytes || 0),0) / 1048576).toFixed(2)} ميجابايت` : ""}</h2><div className="overflow-x-auto"><table className="w-full border-collapse text-right"><thead><tr className="bg-emerald-50"><th className="p-3">الملف / المشاركة</th><th className="p-3">النوع</th><th className="p-3">التاريخ</th><th className="p-3">الحجم / المراجعة</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-b"><td className="max-w-sm break-all p-3">{item.name}{item.duplicate && <span className="block text-sm text-amber-800">تشابه محتمل مع ملف في هذه الدفعة — يلزم التحقق</span>}</td><td className="p-3">{kindLabel(item.kind,source)}</td><td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SA') : "غير محدد"}</td><td className="p-3">{item.href ? <Link href={item.href} className="font-bold text-emerald-800">فتح القسم للمراجعة</Link> : `${((item.bytes || 0) / 1048576).toFixed(2)} ميجابايت`}</td></tr>)}</tbody></table></div></section>}
    {cursor && <button disabled={busy} onClick={() => void review(source,cursor)} className="rounded-xl border border-emerald-700 px-5 py-3 font-bold text-emerald-900">مراجعة الدفعة التالية</button>}
    <Link href="/teacher/notebook-gallery" className="block font-bold text-emerald-800">فتح جماليات الدفاتر — حذف صورة وسجلها بعد الفحص والتأكيد</Link>
  </main>;
}
