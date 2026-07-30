"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";

type TeacherLayoutProps = {
  children: ReactNode;
};

export default function TeacherLayout({
  children,
}: TeacherLayoutProps) {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAuthorized(false);
        setIsChecking(false);
        router.replace("/teacher-login");
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    });

    return unsubscribe;
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/teacher-login");
  }

  if (isChecking) {
    return (
      <main dir="rtl" style={styles.loadingPage}>
        <section style={styles.loadingCard}>
          <div style={styles.loadingIcon}>⏳</div>
          <h2 style={styles.loadingTitle}>جارٍ التحقق من صلاحية الدخول</h2>
          <p style={styles.loadingText}>لحظات قليلة يا أستاذ إبراهيم...</p>
        </section>
      </main>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <div dir="rtl" style={styles.topBar}>
        <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() => router.push("/teacher")}
    style={styles.backButton}
  >
    ← العودة إلى لوحة المعلم
  </button>

  <button
    type="button"
    onClick={handleLogout}
    style={styles.logoutButton}
  >
    تسجيل الخروج
  </button>
</div>
      </div>
<button
  type="button"
  onClick={() => router.back()}
  style={styles.backButton}
>
  ← رجوع
</button>
      {children}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f2fbf7 0%, #e8f7f0 55%, #ffffff 100%)",
    fontFamily: "Arial, sans-serif",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "460px",
    padding: "34px 24px",
    borderRadius: "26px",
    background: "#ffffff",
    border: "1px solid #cde9dc",
    boxShadow: "0 18px 50px rgba(22, 134, 101, 0.13)",
    textAlign: "center",
  },

  loadingIcon: {
    fontSize: "44px",
  },

  loadingTitle: {
    margin: "14px 0 8px",
    color: "#175b47",
    fontSize: "25px",
  },

  loadingText: {
    margin: 0,
    color: "#668379",
    fontSize: "17px",
  },

  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 18px",
    background: "rgba(255, 255, 255, 0.96)",
    borderBottom: "1px solid #cde9dc",
    boxShadow: "0 4px 18px rgba(22, 134, 101, 0.08)",
    fontFamily: "Arial, sans-serif",
  },

  topBarTitle: {
    color: "#176b50",
    fontSize: "17px",
  },

  topBarText: {
    marginRight: "7px",
    color: "#6a8179",
    fontSize: "14px",
  },
backButton: {
  border: "1px solid #16835f",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "#ffffff",
  color: "#166534",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
},
  logoutButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "12px",
    background: "#176b50",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },
};