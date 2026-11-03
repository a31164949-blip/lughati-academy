"use client";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { RESULTS_VIEW_END, isResultsViewingOpen } from "../lib/resultsViewingWindow";
type Result = { id: string; title: string; score: number | null; total: number | null; note: string };
export default function TemporaryQuizResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const expire = () => { if (!isResultsViewingOpen()) { setExpired(true); setResults([]); controller.abort(); } };
    const timer = window.setTimeout(expire, Math.max(0, RESULTS_VIEW_END - Date.now()));
    window.addEventListener("focus", expire);
    document.addEventListener("visibilitychange", expire);
    async function load() {
      try {
        const account = auth.currentUser;
        if (!account) throw Error("يجب تسجيل الدخول مجددًا.");
        const token = await account.getIdToken();
        const response = await fetch("/api/temporary-quiz-results", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Error(data.message || "تعذر تحميل النتائج.");
        if (alive && isResultsViewingOpen()) { setResults(data.results); setError(""); }
      } catch (e) { if (alive && !controller.signal.aborted) setError(e instanceof Error ? e.message : "تعذر تحميل النتائج."); }
      finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; controller.abort(); window.clearTimeout(timer); window.removeEventListener("focus", expire); document.removeEventListener("visibilitychange", expire); };
  }, [retry]);
  async function leave() { try { await signOut(auth); window.location.assign("/login"); } catch { setError("تعذر تسجيل الخروج. حاول مجددًا."); } }
  return <main dir="rtl" className="min-h-screen bg-emerald-50 p-5 text-emerald-950"><section className="mx-auto max-w-3xl space-y-5 rounded-3xl bg-white p-6 shadow-sm">
    <p className="font-bold">أكاديمية لغتي الرقمية</p><h1 className="text-2xl font-bold">نتائج اختباراتي</h1>
    {expired ? <p role="status">انتهت فترة الاطلاع المؤقتة وعادت قيود الدخول السابقة. يمكنكم متابعة الطالب عبر منصة مدرستي.</p> : <>
      <p className="rounded-xl bg-amber-50 p-4 leading-8">الدخول متاح اليوم للاطلاع على درجات الاختبار فقط، وينتهي تلقائيًا عند منتصف الليل بتوقيت الرياض.</p>
      {loading && <p role="status">جارٍ تحميل درجاتك…</p>}
      {error && <div role="alert"><p>{error}</p><button className="rounded-xl border p-3" onClick={() => { setLoading(true); setRetry(v => v + 1); }}>إعادة المحاولة</button></div>}
      {!loading && !error && results.length === 0 && <p>لم تُرصد نتائج اختبار لهذا الحساب بعد.</p>}
      {results.map(result => <article key={result.id} className="rounded-2xl border border-emerald-100 p-5"><h2 className="font-bold">{result.title}</h2><p className="my-3 text-xl">الدرجة: {result.score ?? "لم ترصد"} / {result.total ?? "—"}</p>{result.note && <p className="whitespace-pre-wrap leading-8">ملاحظة المعلم: {result.note}</p>}</article>)}
    </>}
    <button onClick={() => void leave()} className="rounded-xl bg-emerald-800 px-5 py-3 text-white">تسجيل الخروج</button>
  </section></main>;
}
