"use client";

import { useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

type StudentPreview = {
  id: string;
  name: string;
  className: string;
  loginCode: string;
};

export default function SchoolYearPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
const [checking, setChecking] = useState(false);

  const students = useMemo<StudentPreview[]>(() => {
    return Array.from({ length: 60 }, (_, index) => {
      const number = index + 1;
      const paddedNumber = String(number).padStart(3, "0");
      const className = number <= 30 ? "الصف الثاني أ" : "الصف الثاني ب";

      return {
        id: `student-${paddedNumber}`,
        name: `طالب ${String(number).padStart(2, "0")}`,
        className,
        loginCode: `LG${paddedNumber}`,
      };
    });
  }, []);
async function handleCheckStudents() {
  try {
    setChecking(true);

    const snapshot = await getDocs(collection(db, "students"));

    setStudentsCount(snapshot.size);
  } catch (error) {
    console.error(error);
    alert("تعذر التحقق من قاعدة البيانات.");
  } finally {
    setChecking(false);
  }
}
  async function handleCreateStudents() {
    setMessage("");

    const confirmed = window.confirm(
      "سيتم لاحقًا إنشاء 60 طالبًا تجريبيًا في قاعدة البيانات. هل تريد المتابعة؟"
    );

    if (!confirmed) return;

    try {
      setIsCreating(true);

      // سنربط هذا الزر بقاعدة Firestore في الخطوة القادمة.
      await new Promise((resolve) => setTimeout(resolve, 700));

      setMessage(
        "المعاينة جاهزة بنجاح ✅ ولم يتم الحفظ في قاعدة البيانات حتى الآن."
      );
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء تجهيز الطلاب.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "22px",
            padding: "24px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            marginBottom: "22px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            أكاديمية لغتي الرقمية
          </p>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "30px",
              color: "#0f172a",
            }}
          >
            ⚙️ إدارة العام الدراسي
          </h1>

          <p
            style={{
              margin: 0,
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            تهيئة حسابات الطلاب وتقسيمهم إلى فصلين بطريقة آمنة قبل بداية
            العام الدراسي.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <SummaryCard title="إجمالي الطلاب" value="60" icon="👨‍🎓" />
          <SummaryCard title="الصف الثاني أ" value="30" icon="🏫" />
          <SummaryCard title="الصف الثاني ب" value="30" icon="🏫" />
          <SummaryCard title="حالة الحفظ" value="معاينة فقط" icon="🛡️" />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "22px",
            padding: "22px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            marginBottom: "22px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0f172a",
              fontSize: "22px",
            }}
          >
            🚀 تهيئة الطلاب التجريبيين
          </h2>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            هذه الخطوة تعرض الحسابات المقترحة فقط. لن يتم إنشاء أي طالب في
            قاعدة البيانات حتى نضيف الحماية من التكرار في الخطوة التالية.
          </p>

          <button
            type="button"
            onClick={handleCreateStudents}
            disabled={isCreating}
            style={{
              border: "none",
              borderRadius: "14px",
              padding: "13px 22px",
              fontSize: "16px",
              fontWeight: 800,
              cursor: isCreating ? "not-allowed" : "pointer",
              background: isCreating ? "#cbd5e1" : "#16a34a",
              color: "white",
            }}
          >
            {isCreating ? "جارٍ التجهيز..." : "معاينة تهيئة 60 طالبًا"}
          </button>

<button
  type="button"
  onClick={handleCheckStudents}
  disabled={checking}
  style={{
    border: "1px solid #16a34a",
    borderRadius: "14px",
    padding: "13px 22px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: checking ? "not-allowed" : "pointer",
    background: "white",
    color: "#166534",
    marginRight: "10px",
  }}
>
  {checking ? "جارٍ التحقق..." : "التحقق من عدد الطلاب"}
</button>
{studentsCount !== null && (
  <div
    style={{
      marginTop: "16px",
      padding: "14px",
      borderRadius: "12px",
      background: studentsCount > 0 ? "#ecfdf5" : "#fff7ed",
      color: studentsCount > 0 ? "#166534" : "#9a3412",
      fontWeight: 800,
    }}
  >
    عدد الطلاب الموجودين في Firebase حاليًا: {studentsCount} طالبًا.
  </div>
)}
          {message && (
            <div
              style={{
                marginTop: "16px",
                padding: "13px",
                borderRadius: "12px",
                background: "#ecfdf5",
                color: "#166534",
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "22px",
            padding: "22px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            overflowX: "auto",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0f172a",
              fontSize: "22px",
            }}
          >
            👀 معاينة حسابات الطلاب
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "700px",
            }}
          >
            <thead>
              <tr>
                <TableHeader>المعرّف</TableHeader>
                <TableHeader>الاسم المؤقت</TableHeader>
                <TableHeader>الفصل</TableHeader>
                <TableHeader>رمز الدخول</TableHeader>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.className}</TableCell>
                  <TableCell>{student.loginCode}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "18px",
        padding: "18px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#64748b",
          fontWeight: 700,
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontSize: "24px",
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "13px",
        background: "#f1f5f9",
        color: "#334155",
        textAlign: "right",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "12px 13px",
        color: "#334155",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {children}
    </td>
  );
}