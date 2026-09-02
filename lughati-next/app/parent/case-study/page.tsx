"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";

type FormData = {
  guardianRelation: string;
  homeFollower: string;
  homeReadingFrequency: string;
  learningEnvironment: string;

  strengths: string;
  interests: string;
  supportNeeds: string;

  readingLevel: string;
  writingLevel: string;

  motivation: string;
  preferredLearning: string;

  healthStatus: string;
  healthDetails: string;

  familyNotes: string;
  photoConsent: string;
};

const emptyForm: FormData = {
  guardianRelation: "",
  homeFollower: "",
  homeReadingFrequency: "",
  learningEnvironment: "",

  strengths: "",
  interests: "",
  supportNeeds: "",

  readingLevel: "",
  writingLevel: "",

  motivation: "",
  preferredLearning: "",

  healthStatus: "",
  healthDetails: "",

  familyNotes: "",
  photoConsent: "",
};

export default function StudentCaseStudyPage() {
  const searchParams = useSearchParams();
  const requiredMode = searchParams.get("required") === "1";

  const [formData, setFormData] = useState<FormData>(emptyForm);

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] =
    useState(false);

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setSavedSuccessfully(false);

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

      if (!savedStudentId) {
        setLoading(false);
        return;
      }

      try {
        const caseStudyRef = doc(
          db,
          "studentCaseStudies",
          savedStudentId
        );

        const caseStudySnapshot =
          await getDoc(caseStudyRef);

        if (!caseStudySnapshot.exists()) {
          setLoading(false);
          return;
        }

        const data = caseStudySnapshot.data();

        setFormData({
          guardianRelation:
            typeof data.guardianRelation === "string"
              ? data.guardianRelation
              : "",

          homeFollower:
            typeof data.homeFollower === "string"
              ? data.homeFollower
              : "",

          homeReadingFrequency:
            typeof data.homeReadingFrequency === "string"
              ? data.homeReadingFrequency
              : "",

          learningEnvironment:
            typeof data.learningEnvironment === "string"
              ? data.learningEnvironment
              : "",

          strengths:
            typeof data.strengths === "string"
              ? data.strengths
              : "",

          interests:
            typeof data.interests === "string"
              ? data.interests
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

          preferredLearning:
            typeof data.preferredLearning === "string"
              ? data.preferredLearning
              : "",

          healthStatus:
            typeof data.healthStatus === "string"
              ? data.healthStatus
              : "",

          healthDetails:
            typeof data.healthDetails === "string"
              ? data.healthDetails
              : "",

          familyNotes:
            typeof data.familyNotes === "string"
              ? data.familyNotes
              : "",

          photoConsent:
            typeof data.photoConsent === "string"
              ? data.photoConsent
              : "",
        });
      } catch (error) {
        console.error(
          "تعذر تحميل ملف الطالب والأسرة:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCaseStudy();
  }, []);

  async function saveCaseStudy() {
    if (!studentId) {
      alert(
        "تعذر تحديد الطالب. الرجاء تسجيل الدخول مرة أخرى."
      );
      return;
    }

    if (!formData.guardianRelation) {
      alert("يرجى تحديد صلة القرابة بالطالب.");
      return;
    }

    if (!formData.homeFollower) {
      alert(
        "يرجى تحديد الشخص الذي يتابع الطالب في المنزل."
      );
      return;
    }

    if (!formData.photoConsent) {
      alert(
        "يرجى تحديد الموافقة على التصوير قبل الحفظ."
      );
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
      setSaving(true);

     await setDoc(
  doc(
    db,
    "studentCaseStudies",
    studentId
  ),
  {
    studentId,
    studentName,
    ...formData,

    formType: "student-family-profile",

    // ✅ تثبيت أن دراسة الحالة اكتملت
    caseStudyCompleted: true,

    // ✅ وقت إكمال دراسة الحالة
    caseStudyCompletedAt:
      serverTimestamp(),

    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

      setSavedSuccessfully(true);

      if (requiredMode) {
        window.location.replace("/journey");
        return;
      }

      alert(
        "✅ تم حفظ ملف الطالب والأسرة بنجاح"
      );
    } catch (error) {
      console.error(
        "تعذر حفظ ملف الطالب والأسرة:",
        error
      );

      alert(
        "تعذر حفظ الملف. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
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
    outline: "none",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #e0ece7",
    boxShadow:
      "0 8px 24px rgba(0,0,0,0.04)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 800,
    marginBottom: "8px",
    color: "#174f3d",
    lineHeight: 1.7,
  };

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4fbf8",
          color: "#147a5b",
          fontWeight: 900,
          fontSize: "18px",
        }}
      >
        جارٍ تحميل ملف الطالب والأسرة...
      </main>
    );
  }

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
        {/* الشريط العلوي */}
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
          {!requiredMode && (
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
          )}

          <div
            style={{
              color: "#648177",
              fontWeight: 700,
            }}
          >
            أكاديمية لغتي الرقمية
          </div>
        </div>

        {/* العنوان */}
        <section
          style={{
            background:
              "linear-gradient(135deg, #147a5b 0%, #1d9671 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "30px 22px",
            marginBottom: "20px",
            boxShadow:
              "0 14px 32px rgba(20,122,91,0.18)",
          }}
        >
          <div
            style={{
              fontSize: "46px",
              marginBottom: "8px",
            }}
          >
            👨‍👩‍👦
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "30px",
            }}
          >
            ملف الطالب والأسرة
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: "16px",
              opacity: 0.96,
            }}
          >
            لنتعرّف على طالبنا أكثر...
            لنساعده على النجاح 🌱
          </p>

          {studentName && (
            <div
              style={{
                marginTop: "18px",
                background:
                  "rgba(255,255,255,0.15)",
                borderRadius: "16px",
                padding: "12px 16px",
                fontWeight: 800,
              }}
            >
              👦 الطالب: {studentName}
            </div>
          )}
        </section>

        {/* الخصوصية */}
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
          🔒 هذه المعلومات مخصصة للمتابعة
          التعليمية، وتساعد المعلم على تقديم
          الدعم المناسب للطالب.
        </div>

        {/* الأسرة */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            👨‍👩‍👦 أولًا: الأسرة
          </h2>

          <label style={labelStyle}>
            صلة القرابة بالشخص الذي يعبئ
            النموذج
          </label>

          <select
            value={formData.guardianRelation}
            onChange={(event) =>
              updateField(
                "guardianRelation",
                event.target.value
              )
            }
            style={{
              ...inputStyle,
              marginBottom: "18px",
            }}
          >
            <option value="">اختر...</option>
            <option value="father">الأب</option>
            <option value="mother">الأم</option>
            <option value="brother">
              الأخ / الأخت
            </option>
            <option value="guardian">
              ولي أمر آخر
            </option>
          </select>

          <label style={labelStyle}>
            من الشخص الذي يتابع دراسة
            الطالب غالبًا؟
          </label>

          <select
            value={formData.homeFollower}
            onChange={(event) =>
              updateField(
                "homeFollower",
                event.target.value
              )
            }
            style={{
              ...inputStyle,
              marginBottom: "18px",
            }}
          >
            <option value="">اختر...</option>
            <option value="father">الأب</option>
            <option value="mother">الأم</option>
            <option value="both">
              الأب والأم
            </option>
            <option value="other">
              شخص آخر من الأسرة
            </option>
          </select>

          <label style={labelStyle}>
            كم مرة يقرأ الطالب في المنزل؟
          </label>

          <select
            value={
              formData.homeReadingFrequency
            }
            onChange={(event) =>
              updateField(
                "homeReadingFrequency",
                event.target.value
              )
            }
            style={{
              ...inputStyle,
              marginBottom: "18px",
            }}
          >
            <option value="">اختر...</option>
            <option value="daily">
              يوميًا
            </option>
            <option value="often">
              عدة مرات في الأسبوع
            </option>
            <option value="sometimes">
              أحيانًا
            </option>
            <option value="rarely">
              نادرًا
            </option>
          </select>

          <label style={labelStyle}>
            هل يتوفر للطالب مكان مناسب
            وهادئ للمذاكرة؟
          </label>

          <select
            value={
              formData.learningEnvironment
            }
            onChange={(event) =>
              updateField(
                "learningEnvironment",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="yes">
              نعم
            </option>
            <option value="sometimes">
              أحيانًا
            </option>
            <option value="no">
              لا
            </option>
          </select>
        </section>

        {/* أعرف طفلي */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            🌟 ثانيًا: أعرف طفلي
          </h2>

          <label style={labelStyle}>
            ما أبرز نقاط القوة لديه؟
          </label>

          <textarea
            value={formData.strengths}
            onChange={(event) =>
              updateField(
                "strengths",
                event.target.value
              )
            }
            placeholder="مثال: سريع الحفظ، اجتماعي، يحب المشاركة..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              marginBottom: "18px",
            }}
          />

          <label style={labelStyle}>
            ما الأشياء أو الأنشطة التي يحبها؟
          </label>

          <textarea
            value={formData.interests}
            onChange={(event) =>
              updateField(
                "interests",
                event.target.value
              )
            }
            placeholder="مثال: القصص، الرسم، الرياضة، الألعاب التعليمية..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              marginBottom: "18px",
            }}
          />

          <label style={labelStyle}>
            ما المهارات التي ترون أنه يحتاج
            دعمًا فيها؟
          </label>

          <textarea
            value={formData.supportNeeds}
            onChange={(event) =>
              updateField(
                "supportNeeds",
                event.target.value
              )
            }
            placeholder="اكتبوا ما تلاحظونه في المنزل..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </section>

        {/* القراءة والكتابة */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            📚 ثالثًا: القراءة والكتابة
          </h2>

          <label style={labelStyle}>
            كيف تصفون مستوى القراءة
            حاليًا؟
          </label>

          <select
            value={formData.readingLevel}
            onChange={(event) =>
              updateField(
                "readingLevel",
                event.target.value
              )
            }
            style={{
              ...inputStyle,
              marginBottom: "18px",
            }}
          >
            <option value="">اختر...</option>
            <option value="excellent">
              يقرأ بطلاقة
            </option>
            <option value="good">
              يقرأ جيدًا مع بعض التوقف
            </option>
            <option value="developing">
              لا يزال يتدرب على القراءة
            </option>
            <option value="needs-support">
              يحتاج دعمًا واضحًا
            </option>
          </select>

          <label style={labelStyle}>
            كيف تصفون مستوى الكتابة
            حاليًا؟
          </label>

          <select
            value={formData.writingLevel}
            onChange={(event) =>
              updateField(
                "writingLevel",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="excellent">
              يكتب بصورة جيدة ومستقلة
            </option>
            <option value="good">
              يكتب جيدًا مع بعض الأخطاء
            </option>
            <option value="developing">
              يحتاج مساعدة أحيانًا
            </option>
            <option value="needs-support">
              يحتاج دعمًا مستمرًا
            </option>
          </select>
        </section>

        {/* التحفيز */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            🎯 رابعًا: كيف يتعلم الطالب
            بشكل أفضل؟
          </h2>

          <label style={labelStyle}>
            ما أكثر شيء يحفز الطالب على
            التعلم؟
          </label>

          <textarea
            value={formData.motivation}
            onChange={(event) =>
              updateField(
                "motivation",
                event.target.value
              )
            }
            placeholder="مثال: التشجيع، المنافسة، المكافآت، القصص..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              marginBottom: "18px",
            }}
          />

          <label style={labelStyle}>
            ما الطريقة التي يتفاعل معها
            أكثر؟
          </label>

          <select
            value={
              formData.preferredLearning
            }
            onChange={(event) =>
              updateField(
                "preferredLearning",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="visual">
              الصور والمشاهدة
            </option>
            <option value="audio">
              الاستماع والشرح
            </option>
            <option value="practice">
              التطبيق والممارسة
            </option>
            <option value="games">
              الألعاب والمسابقات
            </option>
            <option value="mixed">
              أكثر من طريقة
            </option>
          </select>
        </section>

        {/* الصحة */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            🩺 خامسًا: معلومات صحية مهمة
          </h2>

          <label style={labelStyle}>
            هل يعاني الطالب من أي أعراض
            صحية يحتاج المعلم إلى معرفتها؟
          </label>

          <select
            value={formData.healthStatus}
            onChange={(event) => {
              const value =
                event.target.value;

              updateField(
                "healthStatus",
                value
              );

              if (value === "no") {
                updateField(
                  "healthDetails",
                  ""
                );
              }
            }}
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="yes">نعم</option>
            <option value="no">لا</option>
          </select>

          {formData.healthStatus ===
            "yes" && (
            <div
              style={{
                marginTop: "16px",
              }}
            >
              <label style={labelStyle}>
                اذكر الأعراض أو المعلومات
                المهمة
              </label>

              <textarea
                value={
                  formData.healthDetails
                }
                onChange={(event) =>
                  updateField(
                    "healthDetails",
                    event.target.value
                  )
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

        {/* رسالة الأسرة */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            💬 سادسًا: رسالة الأسرة للمعلم
          </h2>

          <label style={labelStyle}>
            هل توجد ملاحظة ترون أنها
            تساعد المعلم على فهم الطالب
            ودعمه؟
          </label>

          <textarea
            value={formData.familyNotes}
            onChange={(event) =>
              updateField(
                "familyNotes",
                event.target.value
              )
            }
            placeholder="هذه المساحة لكم..."
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </section>

        {/* التصوير */}
        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              color: "#147a5b",
              fontSize: "21px",
            }}
          >
            📸 سابعًا: موافقة الأسرة على
            التصوير
          </h2>

          <label style={labelStyle}>
            هل توافق على تصوير ابنكم داخل
            الصف وعرض صوره في يوميات الفصل؟
          </label>

          <select
            value={formData.photoConsent}
            onChange={(event) =>
              updateField(
                "photoConsent",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">اختر...</option>
            <option value="yes">
              نعم، أوافق
            </option>
            <option value="no">
              لا أوافق
            </option>
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
            سيتم الالتزام باختيار الأسرة عند
            نشر الصور في يوميات الفصل.
          </div>
        </section>

        {savedSuccessfully && (
          <div
            style={{
              background: "#eaf8f1",
              border: "1px solid #a9dbc5",
              color: "#126647",
              padding: "14px 16px",
              borderRadius: "16px",
              marginBottom: "14px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            ✅ تم حفظ ملف الطالب والأسرة
            بنجاح
          </div>
        )}

        <button
          type="button"
          onClick={saveCaseStudy}
          disabled={saving}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "18px",
            padding: "17px",
            background: saving
              ? "#86aa9e"
              : "#147a5b",
            color: "white",
            fontSize: "18px",
            fontWeight: 900,
            cursor: saving
              ? "not-allowed"
              : "pointer",
            boxShadow:
              "0 10px 24px rgba(20,122,91,0.18)",
          }}
        >
          {saving
            ? "⏳ جارٍ الحفظ..."
            : "💾 حفظ ملف الطالب والأسرة"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "14px",
            color: "#71877f",
            fontSize: "14px",
            lineHeight: 1.8,
          }}
        >
          شكرًا لشراكتكم في رحلة تعلم
          الطالب 🤝
          <br />
          نجاح الطالب يبدأ بالتعاون بين
          المدرسة والأسرة.
        </div>
      </div>
    </main>
  );
}