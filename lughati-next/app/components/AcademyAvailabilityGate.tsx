"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import AcademyContinuationCard from "./AcademyContinuationCard";
import AcademyWelcome from "./AcademyWelcome";
import NationalIdentity from "./NationalIdentity";
import { ACADEMY_FRIENDS_ACTIVE } from "../lib/academyFriends";
import { auth } from "../../firebase";
import { STUDENT_ACADEMY_PAUSED, STUDENT_PAUSE_MESSAGE, isStudentPreviewAccount } from "../lib/academyAvailability";

export default function AcademyAvailabilityGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [access, setAccess] = useState<"loading" | "teacher" | "preview" | "guest" | "student" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!STUDENT_ACADEMY_PAUSED) return;
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      const current = ++version;
      if (!user) { setAccess("guest"); return; }
      setAccess("loading");
      try {
        const token = await user.getIdTokenResult();
        if (current !== version) return;
        const teacher = token.claims.role === "teacher" || token.claims.role === "admin" || token.claims.email === "a31164949@gmail.com";
        const preview = token.claims.role === "student" && isStudentPreviewAccount(token.claims.studentDocId);
        setAccess(teacher ? "teacher" : preview ? "preview" : "student");
      } catch { if (current === version) setAccess("error"); }
    });
    return () => { version++; unsubscribe(); };
  }, []);
  async function teacherLogin() {
    setBusy(true); setError("");
    try { await signOut(auth); window.location.assign("/teacher-login"); }
    catch { setError("تعذر تسجيل الخروج. حاول مرة أخرى."); setBusy(false); }
  }
  if (!STUDENT_ACADEMY_PAUSED || access === "teacher" || access === "preview" || (access === "guest" && (path === "/teacher-login" || path === "/login")) || ((access === "guest" || access === "student") && path === "/discussion")) return <>{children}</>;
  if (access === "loading") return <main dir="rtl" className="p-8 text-center">جارٍ التحقق من الدخول…</main>;
  return <main dir="rtl" style={{ minHeight: "100vh", padding: "20px 16px 45px", background: "radial-gradient(ellipse at top left,#ece5d4aa,transparent 40%),#f6f6ef", color: "#183f30" }}>
    <div style={{ width: "100%", maxWidth: 1100, margin: "auto" }}><AcademyWelcome paused /><NationalIdentity />
    <section style={{ margin: "24px auto", width: "100%", background: "#fffdf6", border: "1px solid #dfd7b6", borderRadius: 24, padding: "clamp(22px, 4vw, 34px)" }}>
      <p style={{ color: "#17674d", fontWeight: 800 }}>أكاديمية لغتي الرقمية</p>
      <h1 style={{ fontSize: "clamp(22px, 4vw, 28px)", lineHeight: 1.6, margin: "12px 0" }}>{STUDENT_PAUSE_MESSAGE.title}</h1>
      <p style={{ lineHeight: 1.9, fontSize: 17 }}>تستمر متابعة المستوى الدراسي والواجبات والخطط الأسبوعية عبر منصة مدرستي.</p>
      <details style={{ marginTop: 16 }}><summary style={{ cursor: "pointer", color: "#6d663f", fontWeight: 700 }}>قراءة رسالة المعلم كاملة</summary>{STUDENT_PAUSE_MESSAGE.paragraphs.map(paragraph => <p key={paragraph} style={{ fontSize: 17, lineHeight: 2, margin: "16px 0", overflowWrap: "anywhere" }}>{paragraph}</p>)}</details>
      <a href="https://schools.madrasati.sa/" style={{ display: "block", textAlign: "center", background: "#17674d", color: "white", borderRadius: 14, padding: 16, marginTop: 24, fontSize: 20, fontWeight: 800 }}>الانتقال إلى منصة مدرستي ←</a>
      <button type="button" disabled={busy} onClick={() => void teacherLogin()} style={{ display: "block", margin: "22px auto 0", padding: "10px 18px", color: "#17674d", border: "1px solid #c8dfd2", borderRadius: 12, background: "white", cursor: "pointer", font: "inherit" }}>{busy ? "جارٍ الانتقال…" : "دخول المعلم"}</button>
      {(error || access === "error") && <p role="alert">{error || "تعذر التحقق من الحساب. أعد تحميل الصفحة أو استخدم دخول المعلم."}</p>}
    </section>{ACADEMY_FRIENDS_ACTIVE && <AcademyContinuationCard />}<p style={{ textAlign: "center", fontSize: 14, color: "#6f7e6d", marginTop: 28 }}>أكاديمية لغتي الرقمية — لكل جهد أثر، ولكل قارئ حكاية.</p></div>
  </main>;
}
