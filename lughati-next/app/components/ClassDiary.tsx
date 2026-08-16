"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

type StarStudentSnapshot = {
  studentId: string;
  studentName: string;
  classroom: string;
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type DiaryPost = {
  id: string;

  title: string;
  description: string;
  imageUrl: string;
  date: string;
  isPublished: boolean;

  learnedToday?: string;
  teacherMessage?: string;

  /*
   * النظام الجديد:
   * حتى 10 نجوم.
   */
  starStudents?: StarStudentSnapshot[];

  /*
   * النظام القديم:
   * حتى لا تتعطل اليوميات السابقة.
   */
  starOfDay?: string;
  starStudentId?: string;
  starStudentName?: string;
  starPersonalPhotoUrl?: string;
  starSelectedAvatarIcon?: string;
};

export default function ClassDiary() {
  const [
    latestPost,
    setLatestPost,
  ] = useState<DiaryPost | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    async function loadLatestDiary() {
      try {
        const diaryQuery =
          query(
            collection(
              db,
              "classDiary"
            ),
            where(
              "isPublished",
              "==",
              true
            ),
            orderBy(
              "createdAt",
              "desc"
            ),
            limit(1)
          );

        const snapshot =
          await getDocs(
            diaryQuery
          );

        if (
          snapshot.empty
        ) {
          setLatestPost(
            null
          );

          return;
        }

        const item =
          snapshot.docs[0];

        setLatestPost({
          id: item.id,

          ...(item.data() as Omit<
            DiaryPost,
            "id"
          >),
        });
      } catch (error) {
        console.error(
          "خطأ في تحميل يوميات الفصل:",
          error
        );

        setLatestPost(
          null
        );
      } finally {
        setLoading(false);
      }
    }

    void loadLatestDiary();
  }, []);

  /*
   * توحيد بيانات نجوم اليوم.
   */
  const stars =
    useMemo<
      StarStudentSnapshot[]
    >(() => {
      if (!latestPost) {
        return [];
      }

      /*
       * اليوميات الجديدة.
       */
      if (
        Array.isArray(
          latestPost.starStudents
        ) &&
        latestPost.starStudents.length >
          0
      ) {
        return latestPost.starStudents.slice(
          0,
          10
        );
      }

      /*
       * اليوميات القديمة.
       */
      const oldName =
        latestPost.starStudentName?.trim() ||
        latestPost.starOfDay?.trim() ||
        "";

      if (!oldName) {
        return [];
      }

      return [
        {
          studentId:
            latestPost.starStudentId ||
            "",

          studentName:
            oldName,

          classroom:
            "",

          personalPhotoUrl:
            latestPost.starPersonalPhotoUrl?.trim() ||
            "",

          selectedAvatarIcon:
            latestPost.starSelectedAvatarIcon?.trim() ||
            "👦🏻",
        },
      ];
    }, [latestPost]);

  return (
    <section className="classDiary">

      {/* رأس يوميات الفصل */}

      <div className="classDiary__header">
        <span className="classDiary__label">
          📖 من دفتر أكاديمية لغتي
        </span>

        <h2>
          يوميات الفصل
        </h2>

        <p>
          لمحة سريعة تنقل للأسرة أجمل لحظات التعلم والإنجاز.
        </p>
      </div>

      {/* اليومية الرئيسية */}

      {loading ? (
        <div className="classDiary__featured">
          <div className="classDiary__featuredIcon">
            ⏳
          </div>

          <div className="classDiary__featuredContent">
            <span>
              لحظة من فضلك
            </span>

            <h3>
              جاري تحميل آخر يومية...
            </h3>
          </div>
        </div>
      ) : latestPost ? (
        <div className="classDiary__featured">
          {latestPost.imageUrl ? (
            <div className="classDiary__imageWrap">
              <img
                src={
                  latestPost.imageUrl
                }
                alt={
                  latestPost.title
                }
                className="classDiary__featuredImage"
              />
            </div>
          ) : (
            <div className="classDiary__featuredIcon">
              📸
            </div>
          )}

          <div className="classDiary__featuredContent">
            <span>
              لقطة اليوم
            </span>

            <h3>
              {latestPost.title}
            </h3>

            <p>
              {
                latestPost.description
              }
            </p>

            {latestPost.date && (
              <small>
                📅{" "}
                {
                  latestPost.date
                }
              </small>
            )}
          </div>
        </div>
      ) : (
        <div className="classDiary__featured">
          <div className="classDiary__featuredIcon">
            📸
          </div>

          <div className="classDiary__featuredContent">
            <span>
              لقطة اليوم
            </span>

            <h3>
              لا توجد يوميات منشورة حاليًا
            </h3>

            <p>
              سيتم عرض أحدث يومية هنا بعد نشرها من لوحة المعلم.
            </p>
          </div>
        </div>
      )}

      {/* بطاقات اليوم */}

      <div className="classDiary__highlights">

        {/* تعلمنا اليوم */}

        <article className="classDiary__highlight">
          <span className="classDiary__highlightIcon">
            📚
          </span>

          <div>
            <strong>
              تعلمنا اليوم
            </strong>

            <p>
              {latestPost?.learnedToday?.trim() ||
                "سيضيف المعلم هنا ما تعلمه الطلاب اليوم."}
            </p>
          </div>
        </article>

        {/* نجوم اليوم */}

        <article
          className="classDiary__highlight"
          style={{
            border:
              stars.length > 0
                ? "2px solid #f2d06b"
                : undefined,

            background:
              stars.length > 0
                ? "linear-gradient(135deg,#fffdf2,#ffffff)"
                : undefined,

            alignItems:
              "stretch",
          }}
        >
          {stars.length > 0 ? (
            <div
              style={{
                width: "100%",
              }}
            >
              {/* رأس بطاقة النجوم */}

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: "10px",
                  marginBottom:
                    "10px",
                }}
              >
                <strong
                  style={{
                    color:
                      "#996800",
                    fontSize:
                      "17px",
                  }}
                >
                  🌟 نجوم اليوم
                </strong>

                <span
                  style={{
                    background:
                      "#fff1b8",
                    color:
                      "#8b6500",
                    borderRadius:
                      "999px",
                    padding:
                      "4px 9px",
                    fontSize:
                      "12px",
                    fontWeight:
                      900,
                  }}
                >
                  {stars.length}{" "}
                  {stars.length === 1
                    ? "طالب"
                    : "طلاب"}
                </span>
              </div>

              {/* شبكة النجوم */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(5, minmax(0, 1fr))",

                  gap:
                    "8px",
                }}
              >
                {stars.map(
                  (
                    star,
                    index
                  ) => (
                    <div
                      key={`${star.studentId}-${index}`}
                      style={{
                        minWidth:
                          0,

                        padding:
                          "8px 5px",

                        borderRadius:
                          "16px",

                        background:
                          "#ffffff",

                        border:
                          "1px solid #f4dea0",

                        textAlign:
                          "center",

                        boxShadow:
                          "0 4px 10px rgba(170,125,15,0.06)",
                      }}
                    >
                      {/* صورة الطالب */}

                      <div
                        style={{
                          width:
                            "48px",

                          height:
                            "48px",

                          margin:
                            "0 auto",

                          borderRadius:
                            "50%",

                          display:
                            "grid",

                          placeItems:
                            "center",

                          overflow:
                            "hidden",

                          background:
                            "#fff8d9",

                          border:
                            "2px solid #efc94e",

                          fontSize:
                            "27px",
                        }}
                      >
                        {star.personalPhotoUrl ? (
                          <img
                            src={
                              star.personalPhotoUrl
                            }
                            alt={
                              star.studentName
                            }
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              objectFit:
                                "cover",
                            }}
                          />
                        ) : (
                          <span>
                            {star.selectedAvatarIcon ||
                              "👦🏻"}
                          </span>
                        )}
                      </div>

                      {/* اسم الطالب */}

                      <div
                        style={{
                          marginTop:
                            "5px",

                          color:
                            "#173b31",

                          fontWeight:
                            900,

                          fontSize:
                            "12px",

                          lineHeight:
                            1.35,

                          overflow:
                            "hidden",

                          textOverflow:
                            "ellipsis",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          star.studentName
                        }
                      </div>

                      {/* الفصل */}

                      {star.classroom && (
                        <div
                          style={{
                            marginTop:
                              "2px",

                            color:
                              "#9a8b64",

                            fontSize:
                              "10px",

                            fontWeight:
                              700,
                          }}
                        >
                          {
                            star.classroom
                          }
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <>
              <span className="classDiary__highlightIcon">
                🌟
              </span>

              <div>
                <strong>
                  نجوم اليوم
                </strong>

                <p>
                  سيضيف المعلم هنا نجوم اليوم المميزين.
                </p>
              </div>
            </>
          )}
        </article>

        {/* رسالة المعلم */}

        <article className="classDiary__highlight">
          <span className="classDiary__highlightIcon">
            💬
          </span>

          <div>
            <strong>
              رسالة المعلم
            </strong>

            <p>
              {latestPost?.teacherMessage?.trim() ||
                "سيضيف المعلم هنا رسالته للطلاب والأسرة."}
            </p>
          </div>
        </article>
      </div>

      {/* أسفل اليوميات */}

      <div className="classDiary__footer">
        <span>
          تُراجع الصور والمقاطع من المعلم قبل النشر.
        </span>

        <Link
          href="/class-diary"
          className="classDiary__button"
        >
          عرض جميع اليوميات

          <span>
            ←
          </span>
        </Link>
      </div>
    </section>
  );
}