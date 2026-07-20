"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";

export default function TeacherLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/teacher");
        return;
      }

      setIsChecking(false);
    });

    return unsubscribe;
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      router.replace("/teacher");
    } catch (error) {
      console.error(error);
      setMessage("بيانات الدخول غير صحيحة، تحقق من البريد وكلمة المرور.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isChecking) {
    return (
      <main dir="rtl" style={styles.page}>
        <section style={styles.loadingCard}>
          <div style={styles.loadingIcon}>⏳</div>
          <p style={styles.loadingText}>جارٍ التحقق من تسجيل الدخول...</p>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.card}>
        <div style={styles.icon}>👨‍🏫</div>

        <p style={styles.label}>أكاديمية لغتي الرقمية</p>
        <h1 style={styles.title}>دخول المعلم</h1>

        <p style={styles.description}>
          هذه الصفحة مخصصة للمعلم وإدارة محتوى الأكاديمية.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>البريد الإلكتروني</span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="اكتب بريد المعلم"
              autoComplete="email"
              style={styles.input}
              disabled={isLoading}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>كلمة المرور</span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="اكتب كلمة المرور"
              autoComplete="current-password"
              style={styles.input}
              disabled={isLoading}
            />
          </label>

          {message && <div style={styles.error}>{message}</div>}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              opacity: isLoading ? 0.65 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "جارٍ تسجيل الدخول..." : "دخول لوحة المعلم"}
          </button>
        </form>

        <div style={styles.note}>
          <span style={styles.noteIcon}>🛡️</span>

          <div>
            <strong style={styles.noteTitle}>دخول محمي</strong>
            <p style={styles.noteText}>
              لا تشارك بيانات دخول المعلم مع الطلاب أو الزوار.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, #f2fbf7 0%, #e8f7f0 50%, #ffffff 100%)",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    padding: "34px 26px",
    borderRadius: "28px",
    background: "#ffffff",
    border: "1px solid #cde9dc",
    boxShadow: "0 20px 60px rgba(22, 134, 101, 0.14)",
    textAlign: "center",
  },

  icon: {
    width: "92px",
    height: "92px",
    margin: "0 auto 18px",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#168c65",
    fontSize: "48px",
  },

  label: {
    margin: 0,
    color: "#168c65",
    fontSize: "17px",
    fontWeight: 800,
  },

  title: {
    margin: "10px 0 8px",
    color: "#124f3d",
    fontSize: "38px",
  },

  description: {
    margin: "0 auto 26px",
    color: "#668379",
    fontSize: "17px",
    lineHeight: 1.8,
  },

  form: {
    display: "grid",
    gap: "18px",
    textAlign: "right",
  },

  field: {
    display: "grid",
    gap: "8px",
  },

  fieldLabel: {
    color: "#285e4f",
    fontSize: "16px",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    borderRadius: "14px",
    border: "1px solid #bcded0",
    background: "#fbfffd",
    color: "#173f34",
    fontSize: "17px",
    outline: "none",
  },

  error: {
    padding: "13px 14px",
    borderRadius: "13px",
    border: "1px solid #f2b8b5",
    background: "#fff0ef",
    color: "#a33a34",
    fontSize: "15px",
    lineHeight: 1.7,
  },

  button: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "15px",
    background: "#168c65",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
  },

  note: {
    marginTop: "24px",
    padding: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    textAlign: "right",
    borderRadius: "16px",
    background: "#edf9f3",
    border: "1px solid #cde9dc",
  },

  noteIcon: {
    fontSize: "30px",
  },

  noteTitle: {
    display: "block",
    marginBottom: "4px",
    color: "#225f4d",
  },

  noteText: {
    margin: 0,
    color: "#668379",
    lineHeight: 1.7,
  },

  loadingCard: {
    padding: "30px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #cde9dc",
    textAlign: "center",
  },

  loadingIcon: {
    fontSize: "40px",
  },

  loadingText: {
    marginBottom: 0,
    color: "#285e4f",
    fontSize: "17px",
  },
};