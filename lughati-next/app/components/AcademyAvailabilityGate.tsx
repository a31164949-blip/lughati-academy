"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import AcademyFriendsBoard from "./AcademyFriendsBoard";
import { ACADEMY_FRIENDS_ACTIVE } from "../lib/academyFriends";
import { auth } from "../../firebase";
import { STUDENT_ACADEMY_PAUSED, STUDENT_PAUSE_MESSAGE } from "../lib/academyAvailability";

export default function AcademyAvailabilityGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [access, setAccess] = useState<"loading" | "teacher" | "guest" | "student" | "error">("loading");
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
        setAccess(teacher ? "teacher" : "student");
      } catch { if (current === version) setAccess("error"); }
    });
    return () => { version++; unsubscribe(); };
  }, []);
  async function teacherLogin() {
    setBusy(true); setError("");
    try { await signOut(auth); window.location.assign("/teacher-login"); }
    catch { setError("تعذر تسجيل الخروج. حاول مرة أخرى."); setBusy(false); }
  }
  if (!STUDENT_ACADEMY_PAUSED || access === "teacher" || (access === "guest" && (path === "/teacher-login" || (ACADEMY_FRIENDS_ACTIVE && path === "/login")))) return <>{children}</>;
  if (access === "loading") return <main dir="rtl" className="p-8 text-center">جارٍ التحقق من الدخول…</main>;
  return <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "28px 16px", background: "linear-gradient(145deg, #eaf7ef, #fffaf0)", color: "#183f30" }}>
    <div style={{ width: "100%", maxWidth: 1100 }}>{ACADEMY_FRIENDS_ACTIVE && <AcademyFriendsBoard />}
    <section style={{ margin: "24px auto", maxWidth: 760, width: "100%", background: "white", border: "1px solid #d5e6db", borderTop: "6px solid #b99336", borderRadius: 24, padding: "clamp(22px, 5vw, 44px)", boxShadow: "0 16px 50px #16553412" }}>
      <p style={{ color: "#17674d", fontWeight: 800 }}>أكاديمية لغتي الرقمية</p>
      <h1 style={{ fontSize: "clamp(24px, 5vw, 34px)", lineHeight: 1.5, margin: "16px 0" }}>{STUDENT_PAUSE_MESSAGE.title}</h1>
      {STUDENT_PAUSE_MESSAGE.paragraphs.map(paragraph => <p key={paragraph} style={{ fontSize: 19, lineHeight: 2, margin: "16px 0", overflowWrap: "anywhere" }}>{paragraph}</p>)}
      <a href="https://schools.madrasati.sa/" style={{ display: "block", textAlign: "center", background: "#17674d", color: "white", borderRadius: 14, padding: 16, marginTop: 24, fontSize: 20, fontWeight: 800 }}>الانتقال إلى منصة مدرستي ←</a>
      <button type="button" disabled={busy} onClick={() => void teacherLogin()} style={{ display: "block", margin: "22px auto 0", padding: "10px 18px", color: "#17674d", border: "1px solid #c8dfd2", borderRadius: 12, background: "white", cursor: "pointer", font: "inherit" }}>{busy ? "جارٍ الانتقال…" : "دخول المعلم"}</button>
      {(error || access === "error") && <p role="alert">{error || "تعذر التحقق من الحساب. أعد تحميل الصفحة أو استخدم دخول المعلم."}</p>}
    </section></div>
  </main>;
}
