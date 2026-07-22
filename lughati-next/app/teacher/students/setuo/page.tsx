"use client";

import Link from "next/link";

export default function StudentSetupPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "32px 16px",
        background: "#f0fdf4",
        fontFamily: "Arial, Tahoma, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "28px",
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "58px", marginBottom: "12px" }}>👨‍🎓</div>

        <h1
          style={{
            margin: "0 0 12px",
            color: "#166534",
            fontSize: "30px",
          }}
        >
          إعداد حسابات الطلاب
        </h1>

        <p
          style={{
            color: "#475569",
            lineHeight: 1.9,
            fontSize: "17px",
            marginBottom: "24px",
          }}
        >
          سيتم من هذه الصفحة تجهيز حسابات طلاب أكاديمية لغتي الرقمية
          وتوزيعهم على الفصلين وتحديد رموز الدخول الخاصة بهم.
        </p>

        <div
          style={{
            padding: "18px",
            marginBottom: "24px",
            borderRadius: "16px",
            background: "#ecfdf5",
            color: "#166534",
            fontWeight: 700,
          }}
        >
          الصفحة قيد التجهيز وستُربط قريبًا بقائمة الطلاب.
        </div>

        <Link
          href="/teacher/students"
          style={{
            display: "inline-block",
            padding: "13px 22px",
            borderRadius: "14px",
            background: "#16a34a",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          العودة إلى إدارة الطلاب
        </Link>
      </section>
    </main>
  );
}