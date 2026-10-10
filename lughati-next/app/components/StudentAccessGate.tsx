"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { auth, db } from "../../firebase";
import type { AccessState } from "../lib/studentAccessPolicy";
const extras = ["/academy-club", "/weekly-challenge", "/notebook-excellence", "/student-avatar"];
export default function StudentAccessGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const lastFocusCheck = useRef(0);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AccessState | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const loginRoute = path === "/login" || path === "/teacher-login";
  async function leaveAccount() {
    setSigningOut(true); setSignOutError("");
    try { await signOut(auth); window.location.assign("/teacher-login"); }
    catch { setSignOutError("تعذر تسجيل الخروج. حاول مرة أخرى."); setSigningOut(false); }
  }
  useEffect(() => onAuthStateChanged(auth, value => { setUser(value); setAuthReady(true); setState(null); setChecked(false); setError(false); lastFocusCheck.current = 0; }), []);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    const refresh = (force = false) => {
      if (!alive || document.visibilityState === "hidden") return;
      if (!force && Date.now() - lastFocusCheck.current < 15000) return;
      lastFocusCheck.current = Date.now();
      setRetry(value => value + 1);
    };
    void user.getIdTokenResult().then(token => {
      if (!alive || token.claims.role !== "student" || typeof token.claims.studentDocId !== "string") return;
      let previous: string | undefined;
      unsubscribe = onSnapshot(doc(db, "students", token.claims.studentDocId), snapshot => {
        const current = JSON.stringify(snapshot.data()?.accessControl ?? {});
        if (previous !== undefined && current !== previous) { setChecked(false); refresh(true); }
        previous = current;
      }, () => { setChecked(false); refresh(true); });
    }).catch(() => refresh());
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      unsubscribe?.();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user]);
  useEffect(() => {
    if (!state?.accountSuspended || !state.until) return;
    const until = state.until;
    let timer: number | undefined;
    const waitForExpiry = () => {
      const remaining = until - Date.now();
      if (remaining <= 0) {
        if (document.visibilityState !== "hidden") setRetry(value => value + 1);
        return;
      }
      timer = window.setTimeout(waitForExpiry, Math.min(remaining + 100, 2147483647));
    };
    waitForExpiry();
    return () => window.clearTimeout(timer);
  }, [state?.accountSuspended, state?.until]);
  useEffect(() => {
    let alive = true;
    // Recheck in the background: replacing children on focus clears file inputs
    // and unsaved forms when Safari returns from its native file picker.
    if (!user || loginRoute) return;
    async function check() {
      try {
        const token = await user!.getIdTokenResult();
        if (alive) setError(false);
        if (token.claims.role !== "student") { if (alive) setChecked(true); return; }
        const response = await fetch("/api/student-access", { headers: { Authorization: "Bearer " + token.token }, cache: "no-store" });
        if (!response.ok) throw new Error("ACCESS_CHECK_FAILED");
        const data = await response.json() as AccessState;
        if (alive) { setState(data); setChecked(true); }
      } catch { if (alive) { setError(true); setChecked(true); } }
    }
    void check();
    return () => { alive = false; };
  }, [user, retry, loginRoute]);
  if (loginRoute) return <>{children}</>;
  if (!authReady && path !== "/login") return <main className="p-8 text-center">جارٍ التحقق من الدخول…</main>;
  const protectedRoute = extras.some(prefix => path === prefix || path.startsWith(prefix + "/"));
  if (user && !checked && path !== "/login") return <main className="p-8 text-center">جارٍ التحقق من حالة الحساب…</main>;
  if (error) return <main className="p-8 text-center">تعذر التحقق من المزايا. <button onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</button></main>;
  const blocked = (state?.accountSuspended && path !== "/student-contact") || (state?.extrasSuspended && protectedRoute);
  return <>
    {state?.extrasSuspended && <section role="alert" className="m-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 leading-8">
      <h2 className="font-bold">{state.accountSuspended ? "الحساب معلّق مؤقتًا بقرار المعلم" : "تنبيه للأسرة: المزايا الإضافية متوقفة مؤقتًا"}</h2>
      <p>{state.accountSuspended ? "الحساب معلّق نظرًا لعدم استفادة ابنكم من خدمات الأكاديمية. ستستمر متابعة الطالب داخل الفصل. نرجو التواصل مع المعلم لمساندة ابنكم وتمكينه من الاستفادة من الأكاديمية. وعند استمرار تأخر الواجبات ستتم إحالة الطالب إلى الموجّه الطلابي بالتنسيق مع الأسرة لتقديم الدعم المناسب." : state.message}</p>
      {state.until && <p>حتى {new Date(state.until).toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh" })}، ويمكن للمعلم إعادة التفعيل قبل ذلك.</p>}
      {state.automatic && <p>يعود تفعيل المزايا بعد إرسال واجب أو قراءة مقبولة، أو بقرار المعلم.</p>}
      {state.accountSuspended && path !== "/student-contact" && <Link href="/student-contact" className="mt-5 block rounded-2xl bg-emerald-700 p-5 text-center font-bold text-white">💬 تواصل مع معلمي — للدعم والاستفسار</Link>}
      {state.accountSuspended && !state.until && <p>يبقى الحساب مجمّدًا حتى يعيد المعلم تفعيله.</p>}
      {state.accountSuspended && <div className="mt-4"><button type="button" disabled={signingOut} onClick={() => void leaveAccount()} className="rounded-xl border border-amber-700 px-4 py-2 font-bold">{signingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج / الدخول بحساب المعلم"}</button>{signOutError && <p role="status">{signOutError}</p>}</div>}
      {!state.accountSuspended && <div className="flex flex-wrap gap-4"><Link href="/homeworks">الواجبات</Link><Link href="/reading-journey">القراءة</Link><Link href="/parent/support">طلب مساعدة</Link></div>}
    </section>}
    {!blocked && children}
  </>;
}
