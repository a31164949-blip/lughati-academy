"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase";
type FormData = {
  reading: string;
  spelling: string;
  comprehension: string;
  writing: string;
  independence: string;
  familyNote: string;
};

const steps = [
  "القراءة",
  "الإملاء",
  "الفهم",
  "الكتابة",
  "المتابعة",
];

export default function StudentDiagnosticPage() {
  const [step, setStep] = useState(0);
const [studentId] = useState(() => {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(
      "student-id"
    ) || ""
  );
});

const [studentName] = useState(() => {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(
      "student-name"
    ) || ""
  );
});

const [classroom] = useState(() => {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(
      "student-classroom"
    ) || ""
  );
});


  const [formData, setFormData] = useState<FormData>({
    reading: "",
    spelling: "",
    comprehension: "",
    writing: "",
    independence: "",
    familyNote: "",
  });

  const progress = ((step + 1) / steps.length) * 100;

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function nextStep() {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function previousStep() {
    if (step > 0) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
   async function submitDiagnostic() {
  if (!studentId) {
    alert("تعذر تحديد الطالب. الرجاء تسجيل الدخول أولًا.");
    return;
  }

  if (
    !formData.reading ||
    !formData.spelling ||
    !formData.comprehension ||
    !formData.writing ||
    !formData.independence
  ) {
    alert("فضلاً أكمل جميع محطات الاستمارة قبل الإرسال.");
    return;
  }

  try {
    await addDoc(collection(db, "diagnosticResponses"), {
      studentId,
      studentName,
      classroom,
      reading: formData.reading,
      spelling: formData.spelling,
      comprehension: formData.comprehension,
      writing: formData.writing,
      independence: formData.independence,
      familyNote: formData.familyNote,
      submittedAt: serverTimestamp(),
    });

    alert("✅ تم إرسال استمارة التشخيص بنجاح.");
  } catch (error) {
    console.error("Error saving diagnostic form:", error);
    alert("حدث خطأ أثناء حفظ الاستمارة. حاول مرة أخرى.");
  }
}
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f3fbf7 0%, #ffffff 55%, #f7fbff 100%)",
        padding: "28px 18px 70px",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            background: "linear-gradient(135deg, #11875f, #1d9a71)",
            color: "white",
            borderRadius: "30px",
            padding: "30px 26px",
            marginBottom: "22px",
            boxShadow: "0 18px 45px rgba(13,116,84,.14)",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            🌱
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(28px,5vw,42px)",
            }}
          >
            استمارة التشخيص الأولي
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "18px",
              lineHeight: 1.9,
              opacity: 0.96,
            }}
          >
            رحلة قصيرة تساعد معلمك على معرفة ما تتقنه وما تحتاج إلى دعمه.
            يمكنك الإجابة بمساعدة أسرتك 🤝
          </p>
        </header>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dcefe8",
            borderRadius: "22px",
            padding: "20px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "12px",
              color: "#315d4f",
              fontWeight: 800,
            }}
          >
            <span>
              المحطة {step + 1} من {steps.length}
            </span>

            <span>{steps[step]}</span>
          </div>

          <div
            style={{
              height: "12px",
              background: "#e9f4ef",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg,#0f8a67,#45ba8e)",
                borderRadius: "999px",
                transition: "width .3s ease",
              }}
            />
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dcefe8",
            borderRadius: "28px",
            padding: "28px",
            boxShadow: "0 12px 34px rgba(41,86,70,.06)",
          }}
        >
          {step === 0 && (
            <>
              <div style={{ fontSize: "38px" }}>📖</div>

              <h2
                style={{
                  color: "#14513d",
                  fontSize: "28px",
                }}
              >
                كيف ترى قراءتك؟
              </h2>

              <p
                style={{
                  color: "#657a72",
                  lineHeight: 1.9,
                }}
              >
                اختر الإجابة الأقرب لمستواك الآن. لا توجد إجابة سيئة؛ فنحن
                نريد أن نعرف من أين نبدأ.
              </p>

              <ChoiceGroup
                value={formData.reading}
                onChange={(value) => updateField("reading", value)}
                options={[
                  "أقرأ الكلمات والجمل بسهولة",
                  "أقرأ ولكن أحتاج بعض المساعدة",
                  "أتعرف على بعض الكلمات فقط",
                  "أحتاج مساعدة كبيرة في القراءة",
                ]}
              />
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ fontSize: "38px" }}>✍️</div>

              <h2
                style={{
                  color: "#14513d",
                  fontSize: "28px",
                }}
              >
                ماذا عن الإملاء؟
              </h2>

              <p
                style={{
                  color: "#657a72",
                  lineHeight: 1.9,
                }}
              >
                عندما تسمع كلمة مناسبة لعمرك، كيف يكون أداؤك غالبًا؟
              </p>

              <ChoiceGroup
                value={formData.spelling}
                onChange={(value) => updateField("spelling", value)}
                options={[
                  "أكتب معظم الكلمات بصورة صحيحة",
                  "أكتب بعض الكلمات وأخطئ في بعضها",
                  "أحتاج إلى تكرار الكلمة أكثر من مرة",
                  "أحتاج إلى مساعدة كبيرة في كتابة الكلمات",
                ]}
              />
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: "38px" }}>🧠</div>

              <h2
                style={{
                  color: "#14513d",
                  fontSize: "28px",
                }}
              >
                فهم ما أقرأ
              </h2>

              <p
                style={{
                  color: "#657a72",
                  lineHeight: 1.9,
                }}
              >
                بعد قراءة قصة أو فقرة قصيرة، هل تستطيع الإجابة عن أسئلة بسيطة
                عنها؟
              </p>

              <ChoiceGroup
                value={formData.comprehension}
                onChange={(value) => updateField("comprehension", value)}
                options={[
                  "نعم، أفهم وأجيب بسهولة",
                  "أفهم الفكرة العامة وأحتاج مساعدة أحيانًا",
                  "أحتاج إلى إعادة القراءة أكثر من مرة",
                  "يصعب علي فهم النص دون مساعدة",
                ]}
              />
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: "38px" }}>📝</div>

              <h2
                style={{
                  color: "#14513d",
                  fontSize: "28px",
                }}
              >
                الكتابة والتعبير
              </h2>

              <p
                style={{
                  color: "#657a72",
                  lineHeight: 1.9,
                }}
              >
                عندما يُطلب منك كتابة جملة قصيرة عن صورة أو موقف، كيف يكون
                أداؤك؟
              </p>

              <ChoiceGroup
                value={formData.writing}
                onChange={(value) => updateField("writing", value)}
                options={[
                  "أكتب جملة واضحة بمفردي",
                  "أكتب جملة مع مساعدة بسيطة",
                  "أعرف ما أريد قوله لكن يصعب علي كتابته",
                  "أحتاج إلى مساعدة كبيرة في تكوين الجملة",
                ]}
              />
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ fontSize: "38px" }}>🏡</div>

              <h2
                style={{
                  color: "#14513d",
                  fontSize: "28px",
                }}
              >
                كيف يؤدي الطالب مهامه في المنزل؟
              </h2>

              <ChoiceGroup
                value={formData.independence}
                onChange={(value) => updateField("independence", value)}
                options={[
                  "ينجزها غالبًا بمفرده",
                  "يحتاج إلى تذكير بسيط",
                  "يحتاج إلى متابعة ومساعدة",
                  "يحتاج إلى متابعة مستمرة",
                ]}
              />

              <label
                style={{
                  display: "block",
                  color: "#14513d",
                  fontWeight: 900,
                  fontSize: "20px",
                  marginTop: "28px",
                  marginBottom: "10px",
                }}
              >
                💬 هل هناك ملاحظة تحب الأسرة أن يعرفها المعلم؟
              </label>

              <textarea
                value={formData.familyNote}
                onChange={(e) =>
                  updateField("familyNote", e.target.value)
                }
                placeholder="هذه المساحة اختيارية..."
                style={{
                  width: "100%",
                  minHeight: "140px",
                  border: "1px solid #cfe4dc",
                  borderRadius: "18px",
                  padding: "16px",
                  fontSize: "17px",
                  lineHeight: 1.8,
                  boxSizing: "border-box",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
              marginTop: "30px",
            }}
          >
            {step > 0 ? (
              <button
                type="button"
                onClick={previousStep}
                style={secondaryButton}
              >
                → السابق
              </button>
            ) : (
              <div />
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                style={primaryButton}
              >
                التالي ←
              </button>
            ) : (
              <button
                type="button"
                onClick={submitDiagnostic}
                style={primaryButton}
              >
                إرسال الاستمارة ✅
              </button>
            )}
          </div>
        </section>

        <p
          style={{
            textAlign: "center",
            color: "#7b8d86",
            marginTop: "20px",
            lineHeight: 1.8,
          }}
        >
          🔒 تستخدم هذه المعلومات لمساعدة المعلم على تقديم الدعم المناسب
          للطالب.
        </p>
      </div>
    </main>
  );
}

function ChoiceGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "12px",
        marginTop: "22px",
      }}
    >
      {options.map((option) => {
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              textAlign: "right",
              border: selected
                ? "2px solid #15936a"
                : "1px solid #d5e8e0",
              background: selected ? "#eaf9f3" : "#ffffff",
              color: "#174f3d",
              borderRadius: "18px",
              padding: "16px 18px",
              fontSize: "17px",
              fontWeight: 800,
              cursor: "pointer",
              lineHeight: 1.7,
              transition: "all .2s ease",
            }}
          >
            {selected ? "✅ " : "○ "}
            {option}
          </button>
        );
      })}
    </div>
  );
}

const primaryButton = {
  border: "none",
  background: "#11875f",
  color: "#ffffff",
  borderRadius: "16px",
  padding: "14px 24px",
  fontSize: "17px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #b8e3d4",
  background: "#ffffff",
  color: "#087f5b",
  borderRadius: "16px",
  padding: "14px 24px",
  fontSize: "17px",
  fontWeight: 900,
  cursor: "pointer",
};