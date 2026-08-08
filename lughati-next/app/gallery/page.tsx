"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../firebase";

type GalleryWork = {
  title: string;
  type: string;
  fileUrl: string;
  publishedAt: string;
};

type GalleryResponse = {
  success: boolean;
  count?: number;
  works?: GalleryWork[];
  message?: string;
};
type NotebookGalleryItem = {
  id: string;
  studentName: string;
  category: string;
  note: string;
  imageUrl: string;
  badge: string;
  publishedAt?: unknown;
};
function fixArabicText(value: string) {
  if (!value) return "";

  // إصلاح النص العربي إذا وصل بصيغة Ø / Ù
  if (!value.includes("Ø") && !value.includes("Ù")) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);

    return decoded.includes("�") ? value : decoded;
  } catch {
    return value;
  }
}

function getDriveImageUrl(url: string) {
  try {
    if (!url.includes("drive.google.com")) return url;

    const match =
      url.match(/[?&]id=([^&]+)/) ||
      url.match(/\/d\/([^/]+)/);

    if (!match?.[1]) return url;

    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  } catch {
    return url;
  }
  function parsePublishedAt(value: string) {
  if (!value) return NaN;

  const normalized = value
    .replace(/\u200f|\u200e/g, "")
    .replace("ص", "AM")
    .replace("م", "PM")
    .trim();

  const match = normalized.match(
    /(\d{4})\/(\d{2})\/(\d{2})\s+(AM|PM)\s+(\d{1,2}):(\d{2}):(\d{2})/
  );

  if (!match) return NaN;

  const [, year, month, day, period, hourText, minute, second] = match;

  let hour = Number(hourText);

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour,
    Number(minute),
    Number(second)
  ).getTime();
}
}
function parsePublishedAt(value: string) {
  if (!value) return NaN;

  const normalized = value
    .replace(/\u200f|\u200e/g, "")
    .replace("ص", "AM")
    .replace("م", "PM")
    .trim();

  const match = normalized.match(
    /(\d{4})\/(\d{2})\/(\d{2})\s+(AM|PM)\s+(\d{1,2}):(\d{2}):(\d{2})/
  );

  if (!match) return NaN;

  const [, year, month, day, period, hourText, minute, second] = match;

  let hour = Number(hourText);

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour,
    Number(minute),
    Number(second)
  ).getTime();
}
function GalleryPageContent() {
  const searchParams = useSearchParams();
const fromParent = searchParams.get("from") === "parent";
  const [works, setWorks] = useState<GalleryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [selectedWork, setSelectedWork] = useState<GalleryWork | null>(null);
const [activeGalleryTab, setActiveGalleryTab] =
  useState<"creations" | "notebooks">("creations");
  const [notebookItems, setNotebookItems] =
  useState<NotebookGalleryItem[]>([]);

const [notebookLoading, setNotebookLoading] =
  useState(true);
  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/gallery", {
          cache: "no-store",
        });

        const data: GalleryResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل المعرض");
        }

        setWorks(Array.isArray(data.works) ? data.works : []);
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل أعمال الطلاب حاليًا.");
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, []);
useEffect(() => {
  async function loadNotebookGallery() {
    try {
      setNotebookLoading(true);

      const notebookQuery = query(
        collection(db, "notebookGallery"),
        orderBy("publishedAt", "desc")
      );

      const snapshot = await getDocs(notebookQuery);

      const items: NotebookGalleryItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          studentName:
            typeof data.studentName === "string" ? data.studentName : "",
          category:
            typeof data.category === "string" ? data.category : "",
          note: typeof data.note === "string" ? data.note : "",
          imageUrl:
            typeof data.imageUrl === "string" ? data.imageUrl : "",
          badge:
            typeof data.badge === "string"
              ? data.badge
              : "دفتر أنيق ✨",
          publishedAt: data.publishedAt,
        };
      });

      setNotebookItems(items);
    } catch (error) {
      console.error("تعذر تحميل جماليات الدفاتر:", error);
      setNotebookItems([]);
    } finally {
      setNotebookLoading(false);
    }
  }

  void loadNotebookGallery();
}, []);
  const approvedWorks = useMemo(
    () =>
      works.map((work) => ({
        ...work,
        title: fixArabicText(work.title),
        type: fixArabicText(work.type),
        publishedAt: fixArabicText(work.publishedAt),
      })),
    [works]
  );
const notebookCategoryStyle = {
  background: "white",
  border: "1px solid #ead7a3",
  borderRadius: 18,
  padding: "16px 12px",
  color: "#6f5a18",
  fontWeight: 900,
  boxShadow: "0 6px 18px rgba(147,107,18,.06)",
};
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f3fbf7 0%, #ffffff 45%, #fffaf0 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#174c3b",
      }}
    >
      <style jsx>{`
  @keyframes heroReveal {
    from {
      opacity: 0;
      transform: translateY(22px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes gentleFloat {
    0%,
    100% {
      transform: translateY(0) rotate(-2deg);
    }
    50% {
      transform: translateY(-10px) rotate(2deg);
    }
  }

  @keyframes titleReveal {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes sparkle {
    0%,
    100% {
      opacity: 0.35;
      transform: scale(0.75) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.2) rotate(12deg);
    }
  }

  .gallery-hero {
    position: relative;
    overflow: hidden;
    animation: heroReveal 0.8s ease-out both;
  }

  .gallery-icon {
    display: inline-block;
    animation: gentleFloat 3.8s ease-in-out infinite;
  }

  .gallery-title {
    animation: titleReveal 0.9s ease-out 0.18s both;
  }

  .gallery-sparkle {
    position: absolute;
    font-size: 25px;
    pointer-events: none;
    animation: sparkle 2.4s ease-in-out infinite;
  }

  .sparkle-one {
    top: 24px;
    right: 8%;
  }

  .sparkle-two {
    bottom: 32px;
    left: 9%;
    animation-delay: 0.8s;
  }
    @keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.gallery-card {
  animation: cardReveal 0.7s ease-out both;
  transform-origin: center;
}

.gallery-card:nth-child(2) {
  animation-delay: 0.12s;
}

.gallery-card:nth-child(3) {
  animation-delay: 0.24s;
}

.gallery-card:nth-child(4) {
  animation-delay: 0.36s;
}

  @media (prefers-reduced-motion: reduce) {
    .gallery-hero,
    .gallery-icon,
    .gallery-title,
    .gallery-sparkle {
      animation: none;
    }
      @keyframes newBadgeGlow {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 18px rgba(151,105,0,.20);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 10px 28px rgba(246,196,83,.45);
  }
}

.new-gallery-badge {
  animation: newBadgeGlow 2.2s ease-in-out infinite;
}
  }
`}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        {/* رأس المعرض */}
        <section
  className="gallery-hero"
  style={{
    textAlign: "center",
            background: "rgba(255,255,255,0.94)",
            border: "1px solid #d7eee4",
            borderRadius: 30,
            padding: "32px 20px",
            boxShadow: "0 12px 35px rgba(23,76,59,0.08)",
            marginBottom: 26,
          }}
        >
          <span className="gallery-sparkle sparkle-one">✨</span>
<span className="gallery-sparkle sparkle-two">⭐</span>
          <div
          className="gallery-icon"
            style={{
              fontSize: 54,
              marginBottom: 8,
            }}
          >
            🖼️
          </div>

          <div
            style={{
              display: "inline-block",
              background: "#eef9f4",
              color: "#16835f",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            مساحة آمنة لإبداعات طلابنا
          </div>
<div style={{ marginBottom: "22px", textAlign: "right" }}>
  <a
    href={fromParent ? "/parent" : "/journey"}
    style={{
      display: "inline-block",
      textDecoration: "none",
      color: "#087f5b",
      background: "#ffffff",
      border: "1px solid #b7ead6",
      borderRadius: "16px",
      padding: "12px 20px",
      fontWeight: 800,
      fontSize: "16px",
    }}
  >
    {fromParent ? "← العودة إلى صفحة ولي الأمر" : "← العودة إلى رحلتي"}
  </a>
</div>
          <h1
  className="gallery-title"
            style={{
              margin: 0,
              fontSize: "clamp(30px, 5vw, 48px)",
              color: "#14513d",
            }}
          >
            معرض إبداعات الطلاب ✨
          </h1>

          <p
            style={{
              maxWidth: 720,
              margin: "14px auto 0",
              lineHeight: 1.9,
              color: "#668378",
              fontSize: 17,
            }}
          >
            هنا نحتفي بالمحاولة والإبداع والتطور، ونشارك الأعمال التي
            راجعها المعلم واعتمد نشرها.
          </p>
        </section>

        {/* شريط الأقسام */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div
onClick={() => setActiveGalleryTab("creations")}
            style={{
              background:
  activeGalleryTab === "creations" ? "#168a63" : "#fff9e9",
color:
  activeGalleryTab === "creations" ? "white" : "#936b12",
              borderRadius: 22,
              padding: 20,
              textAlign: "center",
              fontWeight: 900,
              fontSize: 18,
              boxShadow: "0 8px 22px rgba(22,138,99,0.18)",
            }}
          >
            🎨 إبداعات الطلاب
          </div>

          <div
          onClick={() => setActiveGalleryTab("notebooks")}
            style={{
              background:
  activeGalleryTab === "notebooks" ? "#168a63" : "#fff9e9",
color:
  activeGalleryTab === "notebooks" ? "white" : "#936b12",
              border: "1px solid #f2dfaa",
              borderRadius: 22,
              padding: 20,
              textAlign: "center",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            ✨ جماليات الدفاتر
          </div>
        </section>

        {/* العدد */}
        {!loading && !error && approvedWorks.length > 0 && (
          <div
            style={{
              marginBottom: 18,
              fontSize: 16,
              color: "#68857a",
            }}
          >
            نعرض حاليًا{" "}
            <strong style={{ color: "#16835f" }}>
              {approvedWorks.length}
            </strong>{" "}
            من الأعمال المعتمدة 🌟
          </div>
        )}

        {/* التحميل */}
        {loading && (
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 45,
              textAlign: "center",
              border: "1px solid #dfefe8",
            }}
          >
            <div style={{ fontSize: 40 }}>⏳</div>
            <p style={{ marginTop: 12 }}>جاري تجهيز إبداعات الطلاب...</p>
          </div>
        )}

        {/* الخطأ */}
        {!loading && error && (
          <div
            style={{
              background: "#fff3f3",
              color: "#a23c3c",
              borderRadius: 24,
              padding: 28,
              textAlign: "center",
              border: "1px solid #f2d1d1",
            }}
          >
            {error}
          </div>
        )}

        {/* لا توجد أعمال */}
        {!loading && !error && approvedWorks.length === 0 && (
          <div
            style={{
              background: "white",
              borderRadius: 28,
              padding: "55px 20px",
              textAlign: "center",
              border: "1px solid #dfefe8",
            }}
          >
            <div style={{ fontSize: 58 }}>🌱</div>

            <h2 style={{ marginBottom: 8 }}>
              المعرض ينتظر أول إبداع
            </h2>

            <p style={{ color: "#789087" }}>
              ستظهر هنا الأعمال بعد مراجعة المعلم واعتمادها.
            </p>
          </div>
        )}
{activeGalleryTab === "creations" && (
  <>
        {/* بطاقات الأعمال */}
        {!loading && !error && approvedWorks.length > 0 && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 22,
            }}
          >
            {approvedWorks.map((work, index) => {
              const imageUrl = getDriveImageUrl(work.fileUrl);
const publishedTime = parsePublishedAt(work.publishedAt);
const now = Date.now();

const isNewest =
  Number.isFinite(publishedTime) &&
  now - publishedTime >= 0 &&
  now - publishedTime <= 24 * 60 * 60 * 1000;
              return (
                <article
                className="gallery-card"
                  key={`${work.fileUrl}-${index}`}
                  style={{
                    background: "white",
                    borderRadius: 26,
                    overflow: "hidden",
                    border: "1px solid #dceee6",
                    boxShadow: "0 18px 45px rgba(22,138,99,0.18)",
transition: "all 0.35s ease",
cursor: "pointer",
position: "relative",
                  }}
                  onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-10px) scale(1.02)";
  e.currentTarget.style.boxShadow =
    "0 24px 55px rgba(22,138,99,.22)";
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = "";
  e.currentTarget.style.boxShadow =
    "0 10px 28px rgba(31,86,66,.10)";
}}
onTouchStart={(e) => {
  e.currentTarget.style.transform =
    "translateY(-6px) scale(1.01)";
  e.currentTarget.style.boxShadow =
    "0 22px 48px rgba(22,138,99,.20)";
}}

onTouchEnd={(e) => {
  e.currentTarget.style.transform = "";
  e.currentTarget.style.boxShadow =
    "0 18px 45px rgba(22,138,99,0.18)";
}}
                >
            {isNewest && (
  <div
  className="new-gallery-badge"
  style={{
      position: "absolute",
      top: 14,
      right: 14,
      zIndex: 3,
      background: "linear-gradient(135deg, #f6c453, #ffdf7d)",
      color: "#6f4d00",
      padding: "8px 13px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 900,
      boxShadow: "0 8px 18px rgba(151,105,0,.20)",
    }}
  >
    🎉 جديد في المعرض
  </div>
)}    
                  <div
                    style={{
                      minHeight: 270,
                      background:
                        "linear-gradient(135deg,#edf9f4,#fffaf0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={work.title}
                      onClick={() => setSelectedWork(work)}
                      style={{
                        width: "100%",
                        height: 270,
                        objectFit: "cover",
                        borderRadius: 18,
                        transition: "transform 0.6s ease",
                        cursor: "zoom-in",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        background: "#edf9f4",
                        color: "#16835f",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 800,
                        marginBottom: 12,
                      }}
                    >
                      {work.type || "عمل مميز"}
                    </div>

                    <h2
                      style={{
                        margin: "0 0 12px",
                        fontSize: 21,
                        lineHeight: 1.6,
                        color: "#174c3b",
                      }}
                    >
                      {work.title || "إبداع طالب"}
                    </h2>

                    {work.publishedAt && (
                      <div
                        style={{
                          color: "#8a9c95",
                          fontSize: 13,
                          marginBottom: 16,
                        }}
                      >
                        🗓️ نُشر في {work.publishedAt}
                      </div>
                    )}

                    <a
                      href={work.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        textDecoration: "none",
                        textAlign: "center",
                        background: "#168a63",
                        color: "white",
                        borderRadius: 15,
                        padding: "12px 14px",
                        fontWeight: 900,
                      }}
                    >
                      👀 مشاهدة العمل
                    </a>
                  </div>
                </article>
              );
            })}
          </section>
        )}
</>
)}
{activeGalleryTab === "notebooks" && (
  <section
    style={{
      background: "linear-gradient(135deg, #fffaf0, #f0fbf6)",
      border: "1px solid #ead7a3",
      borderRadius: 28,
      padding: "42px 20px",
      marginBottom: 28,
      textAlign: "center",
      boxShadow: "0 12px 30px rgba(147,107,18,.08)",
    }}
  >
    <div style={{ fontSize: 52, marginBottom: 12 }}>
      📒✨
    </div>

    <h2
      style={{
        margin: "0 0 10px",
        color: "#936b12",
        fontSize: 28,
        fontWeight: 900,
      }}
    >
      جماليات الدفاتر
    </h2>

    <p
      style={{
        maxWidth: 720,
        margin: "0 auto 24px",
        color: "#668378",
        lineHeight: 1.9,
        fontSize: 16,
      }}
    >
      هنا نحتفي بالخط الجميل، والتنظيم المميز، والعناية بالدفتر،
      والتطور الملحوظ 🌱
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 14,
        marginTop: 22,
      }}
    >
      <div style={notebookCategoryStyle}>✍️ خط جميل</div>
      <div style={notebookCategoryStyle}>🎨 تنسيق مميز</div>
      <div style={notebookCategoryStyle}>📒 عناية بالدفتر</div>
      <div style={notebookCategoryStyle}>🌱 تطور ملحوظ</div>
    </div>
    {notebookLoading && (
  <div
    style={{
      marginTop: 28,
      textAlign: "center",
      color: "#6b7f75",
      fontWeight: 800,
    }}
  >
    جاري تحميل جماليات الدفاتر... ✨
  </div>
)}

{!notebookLoading && notebookItems.length === 0 && (
  <div
    style={{
      marginTop: 28,
      padding: 24,
      borderRadius: 20,
      background: "rgba(255,255,255,0.72)",
      border: "1px dashed #dfc979",
      color: "#80651a",
      fontWeight: 800,
      textAlign: "center",
    }}
  >
    📒 لم تُنشر صور دفاتر بعد... أول دفتر جميل سيظهر هنا ✨
  </div>
)}

{!notebookLoading && notebookItems.length > 0 && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
      gap: 22,
      marginTop: 30,
      textAlign: "right",
    }}
  >
    {notebookItems.map((item) => {
      const categoryLabel =
        item.category === "handwriting"
          ? "✍️ خط جميل"
          : item.category === "design"
          ? "🎨 تنسيق مميز"
          : item.category === "care"
          ? "📒 عناية بالدفتر"
          : item.category === "progress"
          ? "🌱 تطور ملحوظ"
          : "✨ جماليات الدفاتر";

      return (
        <article
          key={item.id}
          style={{
            background: "white",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid #ead7a3",
            boxShadow: "0 14px 32px rgba(120,95,25,0.10)",
          }}
        >
          <img
            src={item.imageUrl}
            alt={`دفتر ${item.studentName}`}
            onClick={() => window.open(item.imageUrl, "_blank")}
            style={{
              width: "100%",
              height: 280,
              objectFit: "cover",
              display: "block",
              cursor: "zoom-in",
            }}
          />

          <div style={{ padding: 20 }}>
            <div
              style={{
                display: "inline-block",
                padding: "7px 12px",
                borderRadius: 999,
                background: "#fff8dd",
                color: "#8d6d16",
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              {categoryLabel}
            </div>

            <h3
              style={{
                margin: "0 0 10px",
                color: "#174c3b",
                fontSize: 20,
              }}
            >
              {item.studentName}
            </h3>

            {item.note && (
              <p
                style={{
                  margin: "0 0 14px",
                  color: "#66776f",
                  lineHeight: 1.8,
                }}
              >
                {item.note}
              </p>
            )}

            <div
              style={{
                paddingTop: 12,
                borderTop: "1px solid #f1ead7",
                color: "#9a781b",
                fontWeight: 900,
              }}
            >
              {item.badge}
            </div>
          </div>
        </article>
      );
    })}
  </div>
)}
  </section>
)}
        {/* الخصوصية */}
        <section
          style={{
            marginTop: 34,
            background: "#edf8f3",
            border: "1px solid #d5ece2",
            borderRadius: 24,
            padding: 22,
            textAlign: "center",
            lineHeight: 1.9,
            color: "#57766a",
          }}
        >
          🛡️ <strong>خصوصية طلابنا محفوظة</strong>
          <br />
          لا يظهر أي عمل هنا إلا بعد مراجعته واعتماده للنشر.
        </section>
      </div>
      {selectedWork && (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="عرض العمل بالحجم الكبير"
    onClick={() => setSelectedWork(null)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(7, 30, 23, 0.88)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
  >
    <button
      type="button"
      aria-label="إغلاق الصورة"
      onClick={() => setSelectedWork(null)}
      style={{
        position: "fixed",
        top: 18,
        right: 18,
        zIndex: 10000,
        width: 48,
        height: 48,
        border: "1px solid rgba(255,255,255,.35)",
        borderRadius: "50%",
        background: "rgba(255,255,255,.16)",
        color: "white",
        fontSize: 25,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      ✕
    </button>

    <img
      src={getDriveImageUrl(selectedWork.fileUrl)}
      alt="العمل المختار"
      onClick={(event) => event.stopPropagation()}
      style={{
        display: "block",
        maxWidth: "94vw",
        maxHeight: "88vh",
        width: "auto",
        height: "auto",
        objectFit: "contain",
        borderRadius: 22,
        background: "white",
        boxShadow: "0 28px 80px rgba(0,0,0,.45)",
      }}
    />
  </div>
)}
    </main>
  );
}
export default function GalleryPage() {
  return (
    <Suspense fallback={<div>جاري تحميل المعرض...</div>}>
      <GalleryPageContent />
    </Suspense>
  );
}