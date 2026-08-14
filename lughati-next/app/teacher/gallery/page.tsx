"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type GalleryWork = {
  id?: string;
  row?: number;
  studentName?: string;
  studentId?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  imageUrl?: string;
  classroom?: string;
  note?: string;
  status?: string;
  publishedAt?: string;
  timestamp?: string;
};

export default function TeacherGalleryPage() {
  const [works, setWorks] = useState<GalleryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGallery() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/gallery", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحميل أعمال المعرض");
      }

      const incomingWorks = Array.isArray(data.works)
        ? data.works
        : Array.isArray(data.submissions)
          ? data.submissions
          : Array.isArray(data.items)
            ? data.items
            : [];

      setWorks(incomingWorks);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل المعرض"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGallery();
  }, []);

  const creativeWorks = useMemo(
    () =>
      works.filter((work) => {
        const type = String(work.type || "").toLowerCase();
        return (
          type.includes("إبداع") ||
          type.includes("creative") ||
          type.includes("واجب")
        );
      }),
    [works]
  );

  function getWorkUrl(work: GalleryWork) {
    return work.imageUrl || work.fileUrl || "";
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f4fbf7 0%, #ffffff 50%, #f8fcfa 100%)",
        padding: "24px",
        color: "#174f3c",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <Link
            href="/teacher"
            style={{
              textDecoration: "none",
              border: "1px solid #1c8f68",
              borderRadius: "14px",
              padding: "12px 18px",
              color: "#17674d",
              background: "#ffffff",
              fontWeight: 800,
            }}
          >
            ← العودة إلى لوحة المعلم
          </Link>

          <Link
            href="/gallery"
            target="_blank"
            style={{
              textDecoration: "none",
              borderRadius: "14px",
              padding: "12px 18px",
              color: "#ffffff",
              background: "#178f68",
              fontWeight: 800,
            }}
          >
            👀 فتح المعرض كما يراه الطلاب
          </Link>
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #d8eee5",
            borderRadius: "28px",
            padding: "28px",
            textAlign: "center",
            boxShadow: "0 12px 35px rgba(23, 143, 104, 0.08)",
            marginBottom: "22px",
          }}
        >
          <div style={{ fontSize: "46px", marginBottom: "8px" }}>🎨</div>

          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              color: "#146748",
            }}
          >
            إدارة معرض الطلاب
          </h1>

          <p
            style={{
              margin: "12px auto 0",
              maxWidth: "700px",
              color: "#648378",
              lineHeight: 1.9,
              fontSize: "17px",
            }}
          >
            مساحة المعلم لمتابعة الأعمال المنشورة ومعاينتها وإدارة محتوى
            المعرض بأمان.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            icon="🖼️"
            label="إجمالي الأعمال"
            value={works.length}
          />

          <StatCard
            icon="🎨"
            label="الأعمال الإبداعية"
            value={creativeWorks.length}
          />

          <StatCard
            icon="✨"
            label="جماليات الدفاتر"
            value="قسم مستقل"
          />
        </section>

        <section
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <Link
            href="/teacher/submissions"
            style={actionLinkStyle}
          >
            📤 مراجعة الأعمال الواردة
          </Link>

          <Link
            href="/teacher/notebook-gallery"
            style={actionLinkStyle}
          >
            ✨ نشر في جماليات الدفاتر
          </Link>

          <button
            onClick={loadGallery}
            style={{
              ...actionButtonStyle,
              cursor: "pointer",
            }}
          >
            🔄 تحديث المعرض
          </button>
        </section>

        {loading ? (
          <div style={messageStyle}>
            ⏳ جار تحميل الأعمال المنشورة...
          </div>
        ) : error ? (
          <div
            style={{
              ...messageStyle,
              color: "#a33a3a",
              borderColor: "#f0caca",
              background: "#fff7f7",
            }}
          >
            ⚠️ {error}
          </div>
        ) : works.length === 0 ? (
          <div style={messageStyle}>
            لا توجد أعمال منشورة في المعرض حاليًا.
          </div>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {works.map((work, index) => {
              const workUrl = getWorkUrl(work);

              return (
                <article
                  key={`${work.id || work.row || "work"}-${index}`}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dceee7",
                    borderRadius: "22px",
                    overflow: "hidden",
                    boxShadow: "0 8px 25px rgba(20, 103, 72, 0.07)",
                  }}
                >
                  <div
                    style={{
                      minHeight: "220px",
                      background:
                        "linear-gradient(135deg, #eef9f4, #fffdf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px",
                    }}
                  >
                    {workUrl ? (
                      <img
                        src={workUrl}
                        alt={work.title || work.studentName || "عمل طالب"}
                        style={{
                          width: "100%",
                          height: "230px",
                          objectFit: "cover",
                          borderRadius: "14px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: "58px",
                        }}
                      >
                        🖼️
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "18px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <strong
                        style={{
                          color: "#17674d",
                          fontSize: "20px",
                        }}
                      >
                        {work.studentName || "طالب"}
                      </strong>

                      <span
                        style={{
                          background: "#edf8f3",
                          color: "#177454",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {work.type || "عمل طالب"}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: "18px",
                        margin: "0 0 10px",
                        color: "#294f42",
                      }}
                    >
                      {work.title || "عمل منشور"}
                    </h2>

                    {work.note ? (
                      <p
                        style={{
                          color: "#6b8179",
                          lineHeight: 1.8,
                          minHeight: "28px",
                        }}
                      >
                        {work.note}
                      </p>
                    ) : null}

                    {work.classroom ? (
                      <div
                        style={{
                          color: "#799087",
                          fontSize: "14px",
                          marginBottom: "12px",
                        }}
                      >
                        👥 الفصل: {work.classroom}
                      </div>
                    ) : null}

                    {workUrl ? (
                      <a
                        href={workUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          textAlign: "center",
                          textDecoration: "none",
                          background: "#178f68",
                          color: "#ffffff",
                          borderRadius: "14px",
                          padding: "12px",
                          fontWeight: 800,
                        }}
                      >
                        👀 معاينة العمل
                      </a>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          background: "#f3f6f5",
                          color: "#70827c",
                          borderRadius: "14px",
                          padding: "12px",
                        }}
                      >
                        لا يوجد مرفق للمعاينة
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div
          style={{
            marginTop: "28px",
            background: "#eef9f5",
            border: "1px solid #d1eae0",
            borderRadius: "20px",
            padding: "18px",
            textAlign: "center",
            color: "#55776b",
            lineHeight: 1.8,
          }}
        >
          🛡️ إدارة الحذف والإخفاء والتمييز سنضيفها بعد التأكد من أن قراءة
          الأعمال المنشورة تعمل بصورة صحيحة، حتى نحافظ على المعرض الحالي دون
          مخاطرة.
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #d8eee5",
        borderRadius: "20px",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "32px" }}>{icon}</div>
      <div
        style={{
          color: "#738a82",
          marginTop: "7px",
          fontSize: "14px",
        }}
      >
        {label}
      </div>
      <strong
        style={{
          display: "block",
          color: "#17674d",
          marginTop: "7px",
          fontSize: "24px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const actionLinkStyle = {
  flex: "1 1 220px",
  textAlign: "center" as const,
  textDecoration: "none",
  background: "#ffffff",
  color: "#17674d",
  border: "1px solid #cfe7dd",
  borderRadius: "15px",
  padding: "14px 16px",
  fontWeight: 800,
};

const actionButtonStyle = {
  flex: "1 1 220px",
  textAlign: "center" as const,
  background: "#ffffff",
  color: "#17674d",
  border: "1px solid #cfe7dd",
  borderRadius: "15px",
  padding: "14px 16px",
  fontWeight: 800,
};

const messageStyle = {
  background: "#ffffff",
  border: "1px solid #d8eee5",
  borderRadius: "20px",
  padding: "28px",
  textAlign: "center" as const,
  color: "#58796d",
  fontWeight: 700,
};