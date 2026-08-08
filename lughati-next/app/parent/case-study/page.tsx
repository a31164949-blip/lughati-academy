"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";

export default function StudentCaseStudyPage() {
  const [formData, setFormData] = useState({
    homeFollower: "",
    strengths: "",
    supportNeeds: "",
    readingLevel: "",
    writingLevel: "",
    motivation: "",
    familyNotes: "",
    healthStatus: "",
healthDetails: "",
photoConsent: "",
  });
const [studentId, setStudentId] = useState("");
const [studentName, setStudentName] = useState("");
  function updateField(field: string, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }
useEffect(() => {
  async function loadCaseStudy() {
    const savedStudentId =
      window.localStorage.getItem("student-id") ?? "";

    const savedStudentName =
      window.localStorage.getItem("student-name") ?? "";

    setStudentId(savedStudentId);
    setStudentName(savedStudentName);

    if (!savedStudentId) return;

    try {
      const caseStudyRef = doc(
        db,
        "studentCaseStudies",
        savedStudentId
      );

      const caseStudySnapshot = await getDoc(caseStudyRef);

      if (!caseStudySnapshot.exists()) return;

      const data = caseStudySnapshot.data();

      setFormData({
        homeFollower:
          typeof data.homeFollower === "string"
            ? data.homeFollower
            : "",

        strengths:
          typeof data.strengths === "string"
            ? data.strengths
            : "",

        supportNeeds:
          typeof data.supportNeeds === "string"
            ? data.supportNeeds
            : "",

        readingLevel:
          typeof data.readingLevel === "string"
            ? data.readingLevel
            : "",

        writingLevel:
          typeof data.writingLevel === "string"
            ? data.writingLevel
            : "",

        motivation:
          typeof data.motivation === "string"
            ? data.motivation
            : "",

        familyNotes:
          typeof data.familyNotes === "string"
            ? data.familyNotes
            : "",

        healthStatus:
          typeof data.healthStatus === "string"
            ? data.healthStatus
            : "",

        healthDetails:
          typeof data.healthDetails === "string"
            ? data.healthDetails
            : "",

        photoConsent:
          typeof data.photoConsent === "string"
            ? data.photoConsent
            : "",
      });
    } catch (error) {
      console.error("تعذر تحميل دراسة الحالة:", error);
    }
  }

  loadCaseStudy();
}, []);

async function saveCaseStudy() {
  if (!studentId) {
    alert("تعذر تحديد الطالب. الرجاء تسجيل الدخول مرة أخرى.");
    return;
  }

  if (!formData.photoConsent) {
    alert("يرجى تحديد الموافقة على التصوير قبل الحفظ.");
    return;
  }

  if (
    formData.healthStatus === "yes" &&
    !formData.healthDetails.trim()
  ) {
    alert("يرجى ذكر الأعراض الصحية.");
    return;
  }

  try {
    await setDoc(
      doc(db, "studentCaseStudies", studentId),
      {
        studentId,
        studentName,
        ...formData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    alert("✅ تم حفظ دراسة حالة الطالب بنجاح");
  } catch (error) {
    console.error("تعذر حفظ دراسة الحالة:", error);
    alert("تعذر حفظ دراسة الحالة. حاول مرة أخرى.");
  }
}
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #cfe1d9",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#173b31",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #e0ece7",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 800,
    marginBottom: "8px",
    color: "#174f3d",
  };

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f4fbf8 0%, #eef8f4 45%, #f8fbfa 100%)",
        padding: "24px 16px 60px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/parent"
            style={{
              textDecoration: "none",
              color: "#147a5b",
              fontWeight: 800,
              border: "1px solid #9fd7c4",
              borderRadius: "14px",
              padding: "10px 16px",
              background: "white",
            }}
          >
            ← العودة لصفحة ولي الأمر
          </Link>

          <div
            style={{
              color: "#648177",
              fontWeight: 700,
            }}
          >
            أكاديمية لغتي الرقمية
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg, #147a5b 0%, #1d9671 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "30px 22px",
            marginBottom: "20px",
            boxShadow: "0 14px 32px rgba(20,122,91,0.18)",
          }}
        >
          <div style={{ fontSize: "46px", marginBottom: "8px" }}>📋</div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "30px",
            }}
          >
            دراسة حالة الطالب
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: "16px",
              opacity: 0.95,
            }}
          >
            ساعدونا في معرفة الطالب بصورة أفضل؛ فهذه المعلومات تساعد المعلم
            على تقديم دعم يناسب احتياجاته وقدراته 🌱
          </p>
        </section>

        <div
          style={{
            background: "#fff8e8",
            border: "1px solid #f2dfad",
            color: "#745b1f",
            borderRadius: "18px",
            padding: "14px 16px",
            marginBottom: "18px",
            lineHeight: 1.8,
          }}
        >
          🔒 هذه المعلومات مخصصة للمتابعة التعليمية وتظهر للمعلم فقط.
        </div>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            🏡 المتابعة في المنزل
          </h2>

          <label style={labelStyle}>
            من الشخص الذي يتابع دراسة الطالب غالبًا؟
          </label>

          <select
            value={formData.homeFollower}
            onChange={(event) =>
              updateField("homeFollower", event.target.value)
            }
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="father">الأب</option>
            <option value="mother">الأم</option>
            <option value="both">الأب والأم</option>
            <option value="other">شخص آخر من الأسرة</option>
          </select>
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            🌟 أعرف طفلي
          </h2>

          <label style={labelStyle}>ما أبرز نقاط القوة لديه؟</label>

          <textarea
            value={formData.strengths}
            onChange={(event) =>
              updateField("strengths", event.target.value)
            }
            placeholder="مثال: يحب القراءة، سريع الحفظ، اجتماعي..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              marginBottom: "18px",
            }}
          />

          <label style={labelStyle}>
            ما المهارات التي ترون أنه يحتاج دعمًا فيها؟
          </label>

          <textarea
            value={formData.supportNeeds}
            onChange={(event) =>
              updateField("supportNeeds", event.target.value)
            }
            placeholder="اكتبوا ما تلاحظونه في المنزل..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            📚 القراءة والكتابة
          </h2>

          <label style={labelStyle}>
            كيف تصفون مستوى القراءة حاليًا؟
          </label>

          <select
            value={formData.readingLevel}
            onChange={(event) =>
              updateField("readingLevel", event.target.value)
            }
            style={{
              ...inputStyle,
              marginBottom: "18px",
            }}
          >
            <option value="">اختر...</option>
            <option value="excellent">يقرأ بطلاقة</option>
            <option value="good">يقرأ جيدًا مع بعض التوقف</option>
            <option value="developing">لا يزال يتدرب على القراءة</option>
            <option value="needs-support">يحتاج دعمًا واضحًا</option>
          </select>

          <label style={labelStyle}>
            كيف تصفون مستوى الكتابة حاليًا؟
          </label>

          <select
            value={formData.writingLevel}
            onChange={(event) =>
              updateField("writingLevel", event.target.value)
            }
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="excellent">يكتب بصورة جيدة ومستقلة</option>
            <option value="good">يكتب جيدًا مع بعض الأخطاء</option>
            <option value="developing">يحتاج مساعدة أحيانًا</option>
            <option value="needs-support">يحتاج دعمًا مستمرًا</option>
          </select>
        </section>
<section style={cardStyle}>
  <h2
    style={{
      marginTop: 0,
      color: "#147a5b",
      fontSize: "21px",
    }}
  >
    🩺 معلومات صحية مهمة
  </h2>

  <label style={labelStyle}>
    هل يعاني الطالب من أي أعراض صحية؟
  </label>

  <select
    value={formData.healthStatus}
    onChange={(event) => {
      const value = event.target.value;
      updateField("healthStatus", value);

      if (value === "no") {
        updateField("healthDetails", "");
      }
    }}
    style={inputStyle}
  >
    <option value="">اختر...</option>
    <option value="yes">نعم</option>
    <option value="no">لا</option>
  </select>

  {formData.healthStatus === "yes" && (
    <div style={{ marginTop: "16px" }}>
      <label style={labelStyle}>
        اذكر الأعراض التي يحتاج المعلم إلى معرفتها
      </label>

      <textarea
        value={formData.healthDetails}
        onChange={(event) =>
          updateField("healthDetails", event.target.value)
        }
        placeholder="اكتب هنا..."
        rows={4}
        style={{
          ...inputStyle,
          resize: "vertical",
        }}
      />
    </div>
  )}
</section>
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            🎯 مفتاح التحفيز
          </h2>

          <label style={labelStyle}>
            ما أكثر شيء يحفز الطالب على التعلم؟
          </label>

          <textarea
            value={formData.motivation}
            onChange={(event) =>
              updateField("motivation", event.target.value)
            }
            placeholder="مثال: التشجيع، المنافسة، المكافآت، القصص، الألعاب..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            💬 رسالة الأسرة للمعلم
          </h2>

          <label style={labelStyle}>
            هل توجد ملاحظة ترون أنها تساعد المعلم في فهم الطالب؟
          </label>

          <textarea
            value={formData.familyNotes}
            onChange={(event) =>
              updateField("familyNotes", event.target.value)
            }
            placeholder="هذه المساحة لكم..."
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </section>

<section style={cardStyle}>
  <h2
    style={{
      marginTop: 0,
      color: "#147a5b",
      fontSize: "21px",
    }}
  >
    📸 موافقة الأسرة على التصوير
  </h2>

  <label style={labelStyle}>
    هل توافق على تصوير ابنكم داخل الصف وعرض صوره في يوميات الفصل؟
  </label>

  <select
    value={formData.photoConsent}
    onChange={(event) =>
      updateField("photoConsent", event.target.value)
    }
    style={inputStyle}
  >
    <option value="">اختر...</option>
    <option value="yes">نعم، أوافق</option>
    <option value="no">لا أوافق</option>
  </select>

  <div
    style={{
      marginTop: "12px",
      padding: "12px",
      borderRadius: "12px",
      background: "#f8fbfa",
      color: "#607a70",
      fontSize: "14px",
      lineHeight: 1.8,
    }}
  >
    سيتم الالتزام باختيار الأسرة عند نشر الصور في يوميات الفصل.
  </div>
</section>
        <button
          type="button"
          onClick={saveCaseStudy}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "18px",
            padding: "17px",
            background: "#147a5b",
            color: "white",
            fontSize: "18px",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(20,122,91,0.18)",
          }}
        >
          💾 حفظ دراسة الحالة
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "14px",
            color: "#71877f",
            fontSize: "14px",
          }}
        >
          شكرًا لشراكتكم في رحلة تعلم الطالب 🤝
        </div>
      </div>
    </main>
  );
}