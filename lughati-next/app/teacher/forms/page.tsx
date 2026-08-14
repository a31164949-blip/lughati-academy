import Link from "next/link";

export default function FormsPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f4fbf8 0%, #ffffff 55%, #f8fbff 100%)",
        padding: "32px 20px 70px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                color: "#0f8a67",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              أكاديمية لغتي الرقمية
            </div>

            <h1
              style={{
                margin: 0,
                color: "#14513d",
                fontSize: "clamp(30px, 5vw, 46px)",
              }}
            >
              📝 النماذج الإلكترونية
            </h1>

            <p
              style={{
                color: "#64756e",
                fontSize: "18px",
                lineHeight: 1.9,
                marginTop: "12px",
              }}
            >
              أنشئ نماذج تربوية منظمة، وانشرها للطلاب وأسرهم، وتابع الردود
              بسهولة.
            </p>
          </div>

          <Link
            href="/teacher"
            style={{
              textDecoration: "none",
              color: "#087f5b",
              background: "#ffffff",
              border: "1px solid #b8e3d4",
              borderRadius: "16px",
              padding: "12px 18px",
              fontWeight: 800,
            }}
          >
            ← العودة للوحة المعلم
          </Link>
        </div>

        <section
          style={{
            background: "linear-gradient(135deg, #11875f, #1d9a71)",
            borderRadius: "28px",
            padding: "30px",
            color: "white",
            marginBottom: "28px",
            boxShadow: "0 18px 45px rgba(13, 116, 84, 0.14)",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>🧩</div>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "30px",
            }}
          >
            مركز النماذج الذكية
          </h2>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: "18px",
              opacity: 0.95,
            }}
          >
            سنجمع هنا الاستمارات التشخيصية، والاستبيانات، ونماذج المتابعة
            والموافقات؛ لتصبح المعلومات المهمة أمام المعلم بصورة مختصرة
            ومنظمة.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          <article
            style={{
              background: "#ffffff",
              border: "1px solid #dcefe8",
              borderRadius: "24px",
              padding: "26px",
              boxShadow: "0 10px 30px rgba(34, 80, 64, 0.07)",
            }}
          >
            <div style={{ fontSize: "40px" }}>🌱</div>

            <h3
              style={{
                color: "#14513d",
                fontSize: "24px",
                margin: "14px 0 8px",
              }}
            >
              استمارة التشخيص الأولي
            </h3>

            <p
              style={{
                color: "#677973",
                lineHeight: 1.9,
                minHeight: "70px",
              }}
            >
              يجيب عنها الطالب بمساعدة أسرته، وتساعد المعلم على تكوين صورة
              أولية عن القراءة والإملاء والفهم والكتابة.
            </p>
  <Link
  href="/teacher/forms/diagnostic"
  style={{
    display: "inline-block",
    background: "#e8f8f1",
    color: "#087f5b",
    border: "1px solid #b8e3d4",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: 800,
    textDecoration: "none",
  }}
>
  فتح الاستمارة ←
</Link>
          </article>

          <article
            style={{
              background: "#ffffff",
              border: "1px dashed #cbdcd6",
              borderRadius: "24px",
              padding: "26px",
            }}
          >
            <div style={{ fontSize: "40px" }}>➕</div>

            <h3
              style={{
                color: "#14513d",
                fontSize: "24px",
                margin: "14px 0 8px",
              }}
            >
              نماذج أخرى
            </h3>

            <p
              style={{
                color: "#677973",
                lineHeight: 1.9,
              }}
            >
              لاحقًا سنتمكن من إضافة استبيانات وموافقات ونماذج متابعة جديدة
              من هذا الركن.
            </p>
          </article>
        </div>
      </div>
    </main>
  );
}