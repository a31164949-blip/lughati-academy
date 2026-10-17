"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
type Meeting = { title: string; meetingUrl: string; enabled: boolean };
const initial: Meeting = { title: "حصة إضافية للتمكين القرائي", meetingUrl: "", enabled: false };
export default function ReadingSupportMeeting({ manage = false }: { manage?: boolean }) {
  const [meeting, setMeeting] = useState<Meeting>(initial);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    async function load(current: User | null) {
      try {
        const headers: HeadersInit = manage && current ? { Authorization: `Bearer ${await current.getIdToken()}` } : {};
        if (manage && !current) return;
        const response = await fetch(`/api/reading-support-meeting${manage ? "?manage=1" : ""}`, { headers, signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message);
        if (alive) { setMeeting(data.meeting ?? initial); setReady(true); }
      } catch { if (alive && manage) setMessage("تعذر تحميل رابط الحصة. حدّث الصفحة للمحاولة مجددًا."); }
    }
    const unsub = manage ? onAuthStateChanged(auth, current => { setUser(current); setReady(false); void load(current); }) : undefined;
    if (!manage) void load(null);
    return () => { alive = false; controller.abort(); unsub?.(); };
  }, [manage]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || busy || !ready) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/reading-support-meeting", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify(meeting) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      setMessage(meeting.enabled ? "تم نشر رابط تيمز في بطاقة التمكين القرائي ✅" : "تم الحفظ؛ رابط الحصة مخفي عن الزوار.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر الحفظ."); }
    finally { setBusy(false); }
  }
  if (!manage) return <div style={{ marginTop: 18, borderTop: "1px solid #bfdbfe", paddingTop: 18 }}><h3 style={{ margin: "0 0 8px", fontSize: 19, color: "#1e3a8a" }}>🎥 الحصص الإضافية عبر تيمز</h3>{ready && meeting.enabled && meeting.meetingUrl ? <><p style={{ color: "#334155", lineHeight: 1.8 }}>{meeting.title}</p><a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "14px 20px", borderRadius: 14, color: "#fff", background: "#4f46a5", fontWeight: 900, textDecoration: "none" }}>دخول الحصة الإضافية عبر تيمز ↗</a></> : <p style={{ color: "#475569", lineHeight: 1.8, margin: 0 }}>يظهر رابط الحصة هنا عند نشره من المعلم. نلتقي لنتدرّب على القراءة ونتقدّم بثقة.</p>}</div>;
  const field = { display: "grid", gap: 8 };
  const input = { padding: 12, border: "1px solid #cbd5e1", borderRadius: 12, font: "inherit", minWidth: 0 };
  return <section style={{ background: "#fff", padding: 22, borderRadius: 22, border: "1px solid #bfdbfe", marginBottom: 20 }}><h2>🎥 رابط تيمز للحصص الإضافية</h2><p style={{ lineHeight: 1.9 }}>أضف رابط اجتماع تيمز للحصص العامة. عند تفعيل إظهاره، يتاح لجميع زوار بطاقة التمكين القرائي. للحصص المخصّصة لطالب محدد استخدم <a href="/teacher/live-lessons">إدارة الحصص المباشرة</a>.</p><form onSubmit={save} style={{ display: "grid", gap: 14 }}><label style={field}>عنوان الحصة<input style={input} value={meeting.title} maxLength={160} required disabled={!ready || busy} onChange={e => setMeeting({ ...meeting, title: e.target.value })} /></label><label style={field}>رابط اجتماع تيمز<input style={input} type="url" dir="ltr" value={meeting.meetingUrl} maxLength={4000} disabled={!ready || busy} placeholder="https://teams.microsoft.com/..." onChange={e => setMeeting({ ...meeting, meetingUrl: e.target.value })} /></label><label><input type="checkbox" checked={meeting.enabled} disabled={!ready || busy} onChange={e => setMeeting({ ...meeting, enabled: e.target.checked })} /> إظهار الرابط لجميع زوار بطاقة التمكين القرائي</label><button disabled={!ready || busy} style={{ ...input, background: "#176c46", color: "white", fontWeight: 800, cursor: "pointer" }}>{busy ? "جارٍ الحفظ…" : "حفظ رابط الحصة"}</button><p role="status">{message}</p></form></section>;
}
