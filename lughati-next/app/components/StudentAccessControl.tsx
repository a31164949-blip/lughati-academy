"use client";
import { useState } from "react";
import { auth } from "../../firebase";
import type { AccessState } from "../lib/studentAccessPolicy";
export default function StudentAccessControl({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AccessState | null>(null);
  const [days, setDays] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function request(mode?: string) {
    setBusy(true); setMessage("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("سجّل الدخول بحساب المعلم.");
      const response = await fetch(mode ? "/api/student-access" : "/api/student-access?studentId=" + encodeURIComponent(studentId), { method: mode ? "POST" : "GET", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: mode ? JSON.stringify({ studentId, mode, days }) : undefined });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setState(data); if (mode) setMessage(data.accountSuspended ? "تم تجميد الحساب بالكامل. لا يتاح للطالب سوى تواصل مع معلمي." : mode === "extras" ? "تم تعليق المزايا الإضافية فقط؛ تبقى الخدمات التعليمية الأساسية متاحة." : "تمت إعادة تفعيل الحساب.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر الحفظ."); }
    finally { setBusy(false); }
  }
  return <div className="rounded-xl border border-amber-200 p-3 text-sm">
    <button type="button" disabled={busy} onClick={() => { setOpen(!open); if (!open) void request(); }}>⚙️ تجميد الحساب وإعادة التفعيل</button>
    {open && <div className="space-y-3 pt-3">
      <p>{state ? state.accountSuspended ? "الحساب معلّق مؤقتًا" : state.extrasSuspended ? state.automatic ? "المزايا معلّقة تلقائيًا لغياب المشاركة أسبوعين" : "المزايا معلّقة بقرار المعلم" : "المزايا مفعّلة" : "جارٍ قراءة الحالة…"}</p>
      <label>مدة التجميد <select value={days} onChange={event => setDays(Number(event.target.value))} disabled={busy}><option value={0}>حتى أعيد تفعيله</option><option value={3}>3 أيام</option><option value={7}>أسبوع</option><option value={14}>أسبوعان</option><option value={30}>شهر</option></select></label>
      <div className="flex flex-wrap gap-3"><button className="rounded-xl bg-red-700 px-4 py-3 font-bold text-white" disabled={busy} onClick={() => void request("account")}>تجميد الحساب بالكامل — تواصل مع معلمي فقط</button><button disabled={busy} onClick={() => void request("extras")}>تعليق الإضافات فقط — تبقى الواجبات والقراءة</button><button disabled={busy} onClick={() => void request("resume")}>إعادة التفعيل ومنح مهلة أسبوعين</button></div>
      <p role="status">{message}</p>
    </div>}
  </div>;
}
