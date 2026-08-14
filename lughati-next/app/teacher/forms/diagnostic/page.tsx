"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../../firebase";
type DiagnosticResponse = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  reading: string;
  spelling: string;
  comprehension: string;
  writing: string;
  independence: string;
  familyNote: string;
};
export default function DiagnosticFormPage() {
  const [responses, setResponses] = useState<DiagnosticResponse[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadResponses() {
    try {
      const q = query(
        collection(db, "diagnosticResponses"),
        orderBy("submittedAt", "desc")
      );

      const snapshot = await getDocs(q);

      const items: DiagnosticResponse[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          studentId: data.studentId || "",
          studentName: data.studentName || "",
          classroom: data.classroom || "",
          reading: data.reading || "",
          spelling: data.spelling || "",
          comprehension: data.comprehension || "",
          writing: data.writing || "",
          independence: data.independence || "",
          familyNote: data.familyNote || "",
        };
      });

      setResponses(items);
    } catch (error) {
      console.error("Error loading diagnostic responses:", error);
    } finally {
      setLoading(false);
    }
  }

  loadResponses();
}, []);
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
              النماذج الإلكترونية
            </div>

            <h1
              style={{
                margin: 0,
                color: "#14513d",
                fontSize: "clamp(30px, 5vw, 44px)",
              }}
            >
              🌱 استمارة التشخيص الأولي
            </h1>

            <p
              style={{
                color: "#64756e",
                fontSize: "18px",
                lineHeight: 1.9,
                marginTop: "12px",
              }}
            >
              نموذج أولي يساعدك على التعرف على مستوى الطالب واحتياجاته
              التعليمية بمشاركة أسرته.
            </p>
          </div>

          <Link
            href="/teacher/forms"
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
            ← العودة للنماذج
          </Link>
        </div>

        <section
          style={{
            background: "linear-gradient(135deg, #11875f, #1d9a71)",
            borderRadius: "28px",
            padding: "30px",
            color: "white",
            marginBottom: "24px",
            boxShadow: "0 18px 45px rgba(13, 116, 84, 0.14)",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>🧭</div>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "30px",
            }}
          >
            صورة أولية قبل بداية الرحلة
          </h2>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: "18px",
              opacity: 0.95,
            }}
          >
            سيساعد هذا النموذج على رصد القراءة، والإملاء، والفهم، والكتابة،
            ومدى استقلالية الطالب في التعلم؛ ثم نعرض للمعلم ملخصًا واضحًا لكل
            طالب.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dcefe8",
              borderRadius: "22px",
              padding: "24px",
            }}
          >
            <div style={{ fontSize: "34px" }}>📨</div>
            <div
              style={{
                color: "#64756e",
                marginTop: "10px",
                fontWeight: 700,
              }}
            >
              الردود المستلمة
            </div>
            <div
              style={{
                color: "#14513d",
                fontSize: "36px",
                fontWeight: 900,
                marginTop: "6px",
              }}
            >
              {loading ? "..." : responses.length}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dcefe8",
              borderRadius: "22px",
              padding: "24px",
            }}
          >
            <div style={{ fontSize: "34px" }}>🟡</div>
            <div
              style={{
                color: "#64756e",
                marginTop: "10px",
                fontWeight: 700,
              }}
            >
              حالة النموذج
            </div>
            <div
              style={{
                color: "#9a7112",
                fontSize: "24px",
                fontWeight: 900,
                marginTop: "8px",
              }}
            >
              قيد التجهيز
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dcefe8",
              borderRadius: "22px",
              padding: "24px",
            }}
          >
            <div style={{ fontSize: "34px" }}>🎯</div>
            <div
              style={{
                color: "#64756e",
                marginTop: "10px",
                fontWeight: 700,
              }}
            >
              المجالات
            </div>
            <div
              style={{
                color: "#14513d",
                fontSize: "20px",
                fontWeight: 900,
                marginTop: "8px",
                lineHeight: 1.7,
              }}
            >
              قراءة • إملاء • فهم • كتابة
            </div>
          </div>
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dcefe8",
            borderRadius: "26px",
            padding: "28px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#14513d",
              fontSize: "26px",
            }}
          >
            ✨ ما الذي سنجهزه؟
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "14px",
            }}
          >
            {[
              "قراءة كلمات وجمل قصيرة",
              "مؤشرات أولية في الإملاء",
              "فهم نص بسيط",
              "الكتابة والتعبير",
              "استقلالية الطالب في أداء المهام",
              "ملخص تشخيصي تلقائي للمعلم",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "#f6fbf9",
                  border: "1px solid #e0efe9",
                  borderRadius: "16px",
                  padding: "16px",
                  color: "#315d4f",
                  fontWeight: 800,
                  lineHeight: 1.7,
                }}
              >
                ✅ {item}
              </div>
            ))}
         </div>
        </section>
        <section
  style={{
    marginTop: "24px",
    background: "#ffffff",
    border: "1px solid #dcefe8",
    borderRadius: "26px",
    padding: "28px",
  }}
>
  <h2
    style={{
      marginTop: 0,
      color: "#14513d",
      fontSize: "26px",
    }}
  >
    📋 ردود الطلاب
  </h2>

  {loading ? (
    <p style={{ color: "#6b7d76" }}>جاري تحميل الردود...</p>
  ) : responses.length === 0 ? (
    <div
      style={{
        background: "#f7fbf9",
        borderRadius: "18px",
        padding: "22px",
        color: "#6b7d76",
        textAlign: "center",
      }}
    >
      لم تصل أي استمارة حتى الآن.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "16px",
        marginTop: "18px",
      }}
    >
      {responses.map((response) => (
        <article
          key={response.id}
          style={{
            border: "1px solid #dcefe8",
            borderRadius: "20px",
            padding: "20px",
            background: "#fbfefd",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#14513d",
                  fontSize: "22px",
                }}
              >
                👤 {response.studentName || "طالب"}
              </h3>

              <div
                style={{
                  color: "#71827c",
                  marginTop: "5px",
                }}
              >
                {response.classroom
                  ? `الفصل: ${response.classroom}`
                  : "الفصل غير محدد"}
              </div>
            </div>

            <span
              style={{
                background: "#e8f8f1",
                color: "#087f5b",
                borderRadius: "999px",
                padding: "8px 14px",
                fontWeight: 800,
              }}
            >
              ✅ مكتملة
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <ResponseItem title="📖 القراءة" value={response.reading} />
            <ResponseItem title="✍️ الإملاء" value={response.spelling} />
            <ResponseItem
              title="🧠 الفهم"
              value={response.comprehension}
            />
            <ResponseItem title="📝 الكتابة" value={response.writing} />
            <ResponseItem
              title="🏡 المتابعة المنزلية"
              value={response.independence}
            />
          </div>

          {response.familyNote && (
            <div
              style={{
                marginTop: "14px",
                background: "#fffaf0",
                borderRadius: "16px",
                padding: "16px",
                color: "#69552e",
                lineHeight: 1.8,
              }}
            >
              <strong>💬 ملاحظة الأسرة:</strong>
              <div>{response.familyNote}</div>
            </div>
          )}
        </article>
      ))}
    </div>
  )}
</section>
        </div>
    </main>
  );
}
function ResponseItem({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f5faf8",
        border: "1px solid #e1eee9",
        borderRadius: "16px",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: "#14513d",
          fontWeight: 900,
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#61756d",
          lineHeight: 1.7,
        }}
      >
        {value || "لم تتم الإجابة"}
      </div>
    </div>
  );
}