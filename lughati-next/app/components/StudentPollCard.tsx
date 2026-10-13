"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";

type Poll = { pollId: string; question: string; options: string[]; active: boolean; showResults: boolean; counts?: Record<string, number>; totalVotes?: number; closesAt: string };

export default function StudentPollCard({ user, teacherPreview = false }: { user: User | null; teacherPreview?: boolean }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [mine, setMine] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const requestId = useRef(0);
  const saving = useRef(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;
    const id = ++requestId.current;
    const token = await user.getIdToken();
    const response = await fetch(`/api/student-poll${teacherPreview ? "?teacherPreview=1" : ""}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
    const data = await response.json();
    if (id !== requestId.current || signal?.aborted) return;
    if (!response.ok || !data.success) {
      setPoll(null);
      if (response.status !== 403) throw new Error(data.message || "تعذر تحميل التصويت.");
      return;
    }
    setPoll(data.poll);
    setMine(Number.isInteger(data.myVote) ? data.myVote : null);
  }, [user, teacherPreview]);

  useEffect(() => {
    const controller = new AbortController();
    setPoll(null);
    setMine(null);
    setMessage("");
    void load(controller.signal).catch(error => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "تعذر تحميل التصويت.");
    });
    // Read on entry and when returning to the page, without continuous polling.
    const refresh = () => {
      if (document.visibilityState === "visible") void load(controller.signal).catch(() => {});
    };
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); ++requestId.current; document.removeEventListener("visibilitychange", refresh); };
  }, [load]);

  useEffect(() => {
    if (!poll) return;
    const delay = Date.parse(poll.closesAt) - Date.now();
    const timeout = window.setTimeout(() => setPoll(null), Math.max(0, Math.min(delay, 2147483647)));
    return () => window.clearTimeout(timeout);
  }, [poll]);

  async function vote(optionIndex: number) {
    if (!user || !poll || teacherPreview || saving.current) return;
    saving.current = true;
    setBusy(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/student-poll", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ pollId: poll.pollId, optionIndex }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر حفظ صوتك.");
      setMine(optionIndex);
      setMessage("تم تسجيل صوتك ✅ يمكنك تغيير اختيارك ما دام التصويت مفتوحًا.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ صوتك، حاول مرة أخرى.");
    } finally { saving.current = false; setBusy(false); }
  }

  if (!user) return null;
  return <section dir="rtl" aria-label="تصويت الطلاب" style={{ maxWidth: 1068, margin: "20px auto", padding: "20px 16px", background: "#fff8dc", border: "2px solid #dcaa35", borderRadius: 20, color: "#17352a" }}>
    <h2 style={{ margin: "0 0 8px", color: "#805500" }}>🗳️ صوتك يهمنا</h2>
    {!poll ? <p>{message || "لا يوجد تصويت مفتوح الآن. سيظهر تصويت معلمك هنا عند دخولك."}</p> : <>
      <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.7 }}>{poll.question}</p>
      <p>ينتهي التصويت: {new Date(poll.closesAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</p>
      <div style={{ display: "grid", gap: 10 }}>{poll.options.map((option, index) => <button key={index} type="button" aria-pressed={mine === index} disabled={busy || teacherPreview || !poll.active} onClick={() => void vote(index)} style={{ padding: "14px 18px", textAlign: "right", border: mine === index ? "2px solid #176c46" : "1px solid #dcaa35", borderRadius: 14, background: mine === index ? "#e8f7ef" : "white", color: "#17352a", font: "inherit", fontWeight: 800, cursor: "pointer" }}>
        {mine === index ? "✓ " : ""}{option}{poll.showResults && <span style={{ display: "block", marginTop: 6 }}>{poll.counts?.[String(index)] ?? 0} صوت</span>}
      </button>)}</div>
      {poll.showResults && <p>إجمالي المشاركين: {poll.totalVotes ?? 0}</p>}
      {teacherPreview && <p>معاينة المعلم للعرض فقط.</p>}
      <p role="status" aria-live="polite">{busy ? "جارٍ حفظ صوتك…" : message}</p>
    </>}
  </section>;
}
