"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type GalleryWork = {
  id: string;
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

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [featuredIds, setFeaturedIds] =
    useState<string[]>([]);

  const [
    highlightLoadingId,
    setHighlightLoadingId,
  ] = useState<string | null>(null);

  /*
   * تحميل الأعمال المميزة.
   * نعتمد الآن على workId
   * بدل row القديم الخاص بـ Google Sheets.
   */
  async function loadHighlights() {
    try {
      const snapshot = await getDocs(
        collection(db, "galleryHighlights")
      );

      const ids = snapshot.docs
        .map((item) => {
          const data = item.data();

          return typeof data.workId === "string"
            ? data.workId
            : "";
        })
        .filter(Boolean);

      setFeaturedIds(ids);
    } catch (loadError) {
      console.error(
        "تعذر تحميل الأعمال المميزة:",
        loadError
      );
    }
  }

  /*
   * تحميل الأعمال المنشورة
   * من API المعرض.
   */
  async function loadGallery() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/gallery", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "تعذر تحميل أعمال المعرض"
        );
      }

      const incomingWorks: GalleryWork[] =
        Array.isArray(data.works)
          ? data.works
          : Array.isArray(data.submissions)
            ? data.submissions
            : Array.isArray(data.items)
              ? data.items
              : [];

      setWorks(
        incomingWorks.filter(
          (work) =>
            typeof work.id === "string" &&
            work.id.trim() !== ""
        )
      );
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
    void loadGallery();
    void loadHighlights();
  }, []);

  /*
   * الأعمال الإبداعية.
   */
  const creativeWorks = useMemo(
    () =>
      works.filter((work) => {
        const type = String(
          work.type || ""
        ).toLowerCase();

        return (
          type.includes("إبداع") ||
          type.includes("creative") ||
          type.includes("واجب")
        );
      }),
    [works]
  );

  /*
   * تجهيز رابط العمل.
   * يبقي دعم روابط Google Drive
   * للأعمال القديمة إن وُجدت.
   */
  function getWorkUrl(
    work: GalleryWork
  ) {
    const url =
      work.imageUrl ||
      work.fileUrl ||
      "";

    if (!url) {
      return "";
    }

    try {
      if (
        !url.includes(
          "drive.google.com"
        )
      ) {
        return url;
      }

      const match =
        url.match(
          /[?&]id=([^&]+)/
        ) ||
        url.match(
          /\/d\/([^/]+)/
        );

      if (!match?.[1]) {
        return url;
      }

      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
    } catch {
      return url;
    }
  }

  /*
   * إخفاء العمل من المعرض.
   *
   * لا نحذف العمل،
   * ولا نغيّر حالته إلى مرفوض.
   *
   * فقط:
   * publishedToGallery = false
   */
  async function hideFromGallery(
    work: GalleryWork
  ) {
    const workId =
      typeof work.id === "string"
        ? work.id.trim()
        : "";

    if (!workId) {
      alert(
        "تعذر تحديد العمل المراد إخفاؤه."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد إخفاء عمل ${
          work.studentName ||
          "الطالب"
        } من المعرض؟\n\nلن يتم حذف العمل، ويمكن نشره مرة أخرى لاحقًا.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(workId);

      /*
       * إخفاء العمل من المعرض
       * مع إبقاء الاعتماد محفوظًا.
       */
      await updateDoc(
        doc(
          db,
          "studentWorks",
          workId
        ),
        {
          publishedToGallery:
            false,

          updatedAt:
            serverTimestamp(),
        }
      );

      /*
       * إذا كان العمل مميزًا،
       * نزيل التمييز أيضًا.
       */
      if (
        featuredIds.includes(
          workId
        )
      ) {
        await deleteDoc(
          doc(
            db,
            "galleryHighlights",
            workId
          )
        );

        setFeaturedIds(
          (current) =>
            current.filter(
              (currentId) =>
                currentId !== workId
            )
        );
      }

      /*
       * إزالته من العرض المحلي
       * مباشرة بدون الحاجة
       * لإعادة تحميل الصفحة.
       */
      setWorks(
        (currentWorks) =>
          currentWorks.filter(
            (currentWork) =>
              currentWork.id !==
              workId
          )
      );

      alert(
        "✅ تم إخفاء العمل من المعرض دون حذفه."
      );
    } catch (hideError) {
      console.error(
        "تعذر إخفاء العمل:",
        hideError
      );

      alert(
        hideError instanceof Error
          ? hideError.message
          : "حدث خطأ أثناء إخفاء العمل."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * تمييز العمل أو
   * إلغاء تمييزه.
   *
   * نعتمد على workId
   * بدل row.
   */
  async function toggleFeatured(
    work: GalleryWork
  ) {
    const workId =
      typeof work.id === "string"
        ? work.id.trim()
        : "";

    if (!workId) {
      alert(
        "تعذر تحديد العمل."
      );

      return;
    }

    const isFeatured =
      featuredIds.includes(
        workId
      );

    try {
      setHighlightLoadingId(
        workId
      );

      const highlightRef =
        doc(
          db,
          "galleryHighlights",
          workId
        );

      if (isFeatured) {
        /*
         * إلغاء التمييز.
         */
        await deleteDoc(
          highlightRef
        );

        setFeaturedIds(
          (current) =>
            current.filter(
              (currentId) =>
                currentId !==
                workId
            )
        );
      } else {
        /*
         * تمييز العمل.
         */
        await setDoc(
          highlightRef,
          {
            workId,

            studentId:
              work.studentId ||
              "",

            studentName:
              work.studentName ||
              "",

            title:
              work.title ||
              "",

            featured: true,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        setFeaturedIds(
          (current) =>
            current.includes(
              workId
            )
              ? current
              : [
                  ...current,
                  workId,
                ]
        );
      }
    } catch (highlightError) {
      console.error(
        "تعذر تحديث تمييز العمل:",
        highlightError
      );

      alert(
        "تعذر تحديث حالة التمييز."
      );
    } finally {
      setHighlightLoadingId(
        null
      );
    }
  }

  /*
   * معرفة هل نوع العمل
   * صوت أو فيديو.
   */
  function isAudioWork(
    work: GalleryWork
  ) {
    const type = String(
      work.type || ""
    ).toLowerCase();

    return (
      type.includes("audio") ||
      type.includes("صوت")
    );
  }

  function isVideoWork(
    work: GalleryWork
  ) {
    const type = String(
      work.type || ""
    ).toLowerCase();

    return (
      type.includes("video") ||
      type.includes("فيديو")
    );
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
        {/* أزرار الرأس */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginBottom:
              "24px",
          }}
        >
          <Link
            href="/teacher"
            style={{
              textDecoration:
                "none",

              border:
                "1px solid #1c8f68",

              borderRadius:
                "14px",

              padding:
                "12px 18px",

              color:
                "#17674d",

              background:
                "#ffffff",

              fontWeight: 800,
            }}
          >
            ← العودة إلى لوحة المعلم
          </Link>

          <Link
            href="/gallery"
            target="_blank"
            style={{
              textDecoration:
                "none",

              borderRadius:
                "14px",

              padding:
                "12px 18px",

              color:
                "#ffffff",

              background:
                "#178f68",

              fontWeight: 800,
            }}
          >
            👀 فتح المعرض كما يراه الطلاب
          </Link>
        </div>

        {/* عنوان الصفحة */}

        <section
          style={{
            background:
              "#ffffff",

            border:
              "1px solid #d8eee5",

            borderRadius:
              "28px",

            padding:
              "28px",

            textAlign:
              "center",

            boxShadow:
              "0 12px 35px rgba(23, 143, 104, 0.08)",

            marginBottom:
              "22px",
          }}
        >
          <div
            style={{
              fontSize: "46px",
              marginBottom:
                "8px",
            }}
          >
            🎨
          </div>

          <h1
            style={{
              margin: 0,

              fontSize:
                "34px",

              color:
                "#146748",
            }}
          >
            إدارة معرض الطلاب
          </h1>

          <p
            style={{
              margin:
                "12px auto 0",

              maxWidth:
                "700px",

              color:
                "#648378",

              lineHeight: 1.9,

              fontSize:
                "17px",
            }}
          >
            مساحة المعلم لمتابعة
            الأعمال المنشورة
            ومعاينتها وإدارة
            محتوى المعرض بأمان.
          </p>
        </section>

        {/* الإحصائيات */}

        <section
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",

            gap: "14px",

            marginBottom:
              "24px",
          }}
        >
          <StatCard
            icon="🖼️"
            label="إجمالي الأعمال"
            value={
              works.length
            }
          />

          <StatCard
            icon="🎨"
            label="الأعمال الإبداعية"
            value={
              creativeWorks.length
            }
          />

          <StatCard
            icon="⭐"
            label="الأعمال المميزة"
            value={
              featuredIds.length
            }
          />

          <StatCard
            icon="✨"
            label="جماليات الدفاتر"
            value="قسم مستقل"
          />
        </section>

        {/* روابط الإدارة */}

        <section
          style={{
            display: "flex",

            gap: "12px",

            flexWrap: "wrap",

            marginBottom:
              "24px",
          }}
        >
          <Link
            href="/teacher/submissions"
            style={
              actionLinkStyle
            }
          >
            📤 مراجعة الأعمال الواردة
          </Link>

          <Link
            href="/teacher/notebook-gallery"
            style={
              actionLinkStyle
            }
          >
            ✨ نشر في جماليات الدفاتر
          </Link>

          <button
            type="button"
            onClick={() => {
              void loadGallery();
              void loadHighlights();
            }}
            style={{
              ...actionButtonStyle,

              cursor:
                "pointer",
            }}
          >
            🔄 تحديث المعرض
          </button>
        </section>

        {/* حالة التحميل */}

        {loading ? (
          <div
            style={
              messageStyle
            }
          >
            ⏳ جار تحميل الأعمال المنشورة...
          </div>
        ) : error ? (
          <div
            style={{
              ...messageStyle,

              color:
                "#a33a3a",

              borderColor:
                "#f0caca",

              background:
                "#fff7f7",
            }}
          >
            ⚠️ {error}
          </div>
        ) : works.length ===
          0 ? (
          <div
            style={
              messageStyle
            }
          >
            لا توجد أعمال منشورة في المعرض حاليًا.
          </div>
        ) : (
          <section
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",

              gap:
                "18px",
            }}
          >
            {works.map(
              (work) => {
                const workUrl =
                  getWorkUrl(
                    work
                  );

                const isFeatured =
                  featuredIds.includes(
                    work.id
                  );

                const isHighlightLoading =
                  highlightLoadingId ===
                  work.id;

                const isHiding =
                  updatingId ===
                  work.id;

                return (
                  <article
                    key={
                      work.id
                    }
                    style={{
                      background:
                        "#ffffff",

                      border:
                        "1px solid #dceee7",

                      borderRadius:
                        "22px",

                      overflow:
                        "hidden",

                      boxShadow:
                        "0 8px 25px rgba(20, 103, 72, 0.07)",
                    }}
                  >
                    {/* معاينة العمل */}

                    <div
                      style={{
                        minHeight:
                          "220px",

                        background:
                          "linear-gradient(135deg, #eef9f4, #fffdf6)",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        padding:
                          "12px",
                      }}
                    >
                      {workUrl &&
                      !isAudioWork(
                        work
                      ) &&
                      !isVideoWork(
                        work
                      ) ? (
                        <img
                          src={
                            workUrl
                          }
                          alt={
                            work.title ||
                            work.studentName ||
                            "عمل طالب"
                          }
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                          style={{
                            width:
                              "100%",

                            height:
                              "230px",

                            objectFit:
                              "cover",

                            borderRadius:
                              "14px",
                          }}
                        />
                      ) : isAudioWork(
                          work
                        ) ? (
                        <div
                          style={{
                            textAlign:
                              "center",

                            width:
                              "100%",
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "58px",

                              marginBottom:
                                "14px",
                            }}
                          >
                            🎙️
                          </div>

                          {workUrl ? (
                            <audio
                              src={
                                workUrl
                              }
                              controls
                              style={{
                                width:
                                  "100%",
                              }}
                            />
                          ) : null}
                        </div>
                      ) : isVideoWork(
                          work
                        ) ? (
                        workUrl ? (
                          <video
                            src={
                              workUrl
                            }
                            controls
                            style={{
                              width:
                                "100%",

                              maxHeight:
                                "300px",

                              borderRadius:
                                "14px",

                              background:
                                "#000000",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize:
                                "58px",
                            }}
                          >
                            🎬
                          </div>
                        )
                      ) : (
                        <div
                          style={{
                            fontSize:
                              "58px",
                          }}
                        >
                          🖼️
                        </div>
                      )}
                    </div>

                    {/* بيانات العمل */}

                    <div
                      style={{
                        padding:
                          "18px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          gap:
                            "8px",

                          alignItems:
                            "center",

                          marginBottom:
                            "12px",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#17674d",

                            fontSize:
                              "20px",
                          }}
                        >
                          {work.studentName ||
                            "طالب"}
                        </strong>

                        <span
                          style={{
                            background:
                              "#edf8f3",

                            color:
                              "#177454",

                            padding:
                              "6px 10px",

                            borderRadius:
                              "999px",

                            fontSize:
                              "13px",

                            fontWeight:
                              700,
                          }}
                        >
                          {work.type ||
                            "عمل طالب"}
                        </span>
                      </div>

                      <h2
                        style={{
                          fontSize:
                            "18px",

                          margin:
                            "0 0 10px",

                          color:
                            "#294f42",
                        }}
                      >
                        {work.title ||
                          "عمل منشور"}
                      </h2>

                      {work.note ? (
                        <p
                          style={{
                            color:
                              "#6b8179",

                            lineHeight:
                              1.8,

                            minHeight:
                              "28px",
                          }}
                        >
                          {
                            work.note
                          }
                        </p>
                      ) : null}

                      {work.classroom ? (
                        <div
                          style={{
                            color:
                              "#799087",

                            fontSize:
                              "14px",

                            marginBottom:
                              "12px",
                          }}
                        >
                          👥 الفصل:{" "}
                          {
                            work.classroom
                          }
                        </div>
                      ) : null}

                      {/* أزرار الإدارة */}

                      <div
                        style={{
                          display:
                            "grid",

                          gap:
                            "10px",
                        }}
                      >
                        {workUrl ? (
                          <a
                            href={
                              workUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display:
                                "block",

                              textAlign:
                                "center",

                              textDecoration:
                                "none",

                              background:
                                "#178f68",

                              color:
                                "#ffffff",

                              borderRadius:
                                "14px",

                              padding:
                                "12px",

                              fontWeight:
                                800,
                            }}
                          >
                            👀 معاينة العمل
                          </a>
                        ) : (
                          <div
                            style={{
                              textAlign:
                                "center",

                              background:
                                "#f3f6f5",

                              color:
                                "#70827c",

                              borderRadius:
                                "14px",

                              padding:
                                "12px",
                            }}
                          >
                            لا يوجد مرفق للمعاينة
                          </div>
                        )}

                        {/* تمييز */}

                        <button
                          type="button"
                          onClick={() =>
                            void toggleFeatured(
                              work
                            )
                          }
                          disabled={
                            isHighlightLoading
                          }
                          style={{
                            width:
                              "100%",

                            border:
                              isFeatured
                                ? "1px solid #e7b927"
                                : "1px solid #d9e3df",

                            background:
                              isFeatured
                                ? "#fff7cc"
                                : "#f8fbfa",

                            color:
                              isFeatured
                                ? "#8a6500"
                                : "#48665a",

                            borderRadius:
                              "14px",

                            padding:
                              "12px",

                            fontWeight:
                              800,

                            cursor:
                              isHighlightLoading
                                ? "not-allowed"
                                : "pointer",

                            opacity:
                              isHighlightLoading
                                ? 0.65
                                : 1,
                          }}
                        >
                          {isHighlightLoading
                            ? "⏳ جارٍ التحديث..."
                            : isFeatured
                              ? "⭐ عمل مميز — إلغاء التمييز"
                              : "☆ تمييز العمل"}
                        </button>

                        {/* إخفاء */}

                        <button
                          type="button"
                          onClick={() =>
                            void hideFromGallery(
                              work
                            )
                          }
                          disabled={
                            isHiding
                          }
                          style={{
                            width:
                              "100%",

                            border:
                              "1px solid #f2d49b",

                            background:
                              "#fff8e8",

                            color:
                              "#9a6700",

                            borderRadius:
                              "14px",

                            padding:
                              "12px",

                            fontWeight:
                              800,

                            cursor:
                              isHiding
                                ? "not-allowed"
                                : "pointer",

                            opacity:
                              isHiding
                                ? 0.65
                                : 1,
                          }}
                        >
                          {isHiding
                            ? "⏳ جارٍ الإخفاء..."
                            : "🙈 إخفاء من المعرض"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}

        {/* ملاحظة الخصوصية */}

        <div
          style={{
            marginTop:
              "28px",

            background:
              "#eef9f5",

            border:
              "1px solid #d1eae0",

            borderRadius:
              "20px",

            padding:
              "18px",

            textAlign:
              "center",

            color:
              "#55776b",

            lineHeight:
              1.8,
          }}
        >
          🛡️ الأعمال المنشورة فقط تظهر هنا.
          يستطيع المعلم إخفاء العمل دون حذفه،
          كما يمكنه اختيار الأعمال المميزة
          باستخدام معرّف Firestore الآمن.
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
        background:
          "#ffffff",

        border:
          "1px solid #d8eee5",

        borderRadius:
          "20px",

        padding:
          "20px",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            "32px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color:
            "#738a82",

          marginTop:
            "7px",

          fontSize:
            "14px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display:
            "block",

          color:
            "#17674d",

          marginTop:
            "7px",

          fontSize:
            "24px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const actionLinkStyle = {
  flex: "1 1 220px",

  textAlign:
    "center" as const,

  textDecoration:
    "none",

  background:
    "#ffffff",

  color:
    "#17674d",

  border:
    "1px solid #cfe7dd",

  borderRadius:
    "15px",

  padding:
    "14px 16px",

  fontWeight:
    800,
};

const actionButtonStyle = {
  flex: "1 1 220px",

  textAlign:
    "center" as const,

  background:
    "#ffffff",

  color:
    "#17674d",

  border:
    "1px solid #cfe7dd",

  borderRadius:
    "15px",

  padding:
    "14px 16px",

  fontWeight:
    800,
};

const messageStyle = {
  background:
    "#ffffff",

  border:
    "1px solid #d8eee5",

  borderRadius:
    "20px",

  padding:
    "28px",

  textAlign:
    "center" as const,

  color:
    "#58796d",

  fontWeight:
    700,
};