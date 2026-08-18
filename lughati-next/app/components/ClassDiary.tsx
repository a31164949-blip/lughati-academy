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

        <article className="classDiary__highlight classDiary__highlight--learned">
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
  className="classDiary__highlight classDiary__highlight--stars"
  style={{
    border:
      stars.length > 0
        ? "2px solid #f2d06b"
        : undefined,
    background:
      stars.length > 0
        ? "linear-gradient(135deg,#fffdf2,#ffffff)"
        : undefined,
    alignItems: "stretch",
  }}
>
  {stars.length > 0 ? (
    <div style={{ width: "100%" }}>
      {/* رأس بطاقة النجوم */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#996800",
            fontSize: "17px",
          }}
        >
          🌟 نجوم اليوم
        </strong>

        <span
          style={{
            background: "#fff1b8",
            color: "#8b6500",
            borderRadius: "999px",
            padding: "4px 9px",
            fontSize: "12px",
            fontWeight: 900,
          }}
        >
          {stars.length}{" "}
          {stars.length === 1
            ? "طالب"
            : "طلاب"}
        </span>
      </div>

      {/* عرض النجوم */}

      <div
        className={
          stars.length <= 3
            ? "classDiary__starsStatic"
            : "classDiary__starsSlider"
        }
      >
        <div
          className={
            stars.length <= 3
              ? "classDiary__starsStaticTrack"
              : "classDiary__starsMovingTrack"
          }
        >
          {(stars.length <= 3
            ? stars
            : [...stars, ...stars]
          ).map((star, index) => (
            <div
              className="classDiary__starMiniCard"
              key={`${star.studentId}-${index}`}
            >
              <div className="classDiary__starAvatar">
                {star.personalPhotoUrl ? (
                  <img
                    src={star.personalPhotoUrl}
                    alt={star.studentName}
                  />
                ) : (
                  <span>
                    {star.selectedAvatarIcon ||
                      "👦🏻"}
                  </span>
                )}
              </div>

              <div className="classDiary__starName">
                {star.studentName}
              </div>

              <div className="classDiary__starBadge">
                ⭐
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .classDiary__starsStatic {
          width: 100%;
        }

        .classDiary__starsStaticTrack {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(100px, 1fr)
          );
          gap: 9px;
        }

        .classDiary__starsSlider {
          width: 100%;
          overflow: hidden;
          position: relative;
          padding: 3px 0;
        }

        .classDiary__starsMovingTrack {
          display: flex;
          width: max-content;
          gap: 9px;
          animation: starsMove 20s linear infinite;
        }

        .classDiary__starsSlider:hover
          .classDiary__starsMovingTrack {
          animation-play-state: paused;
        }

        .classDiary__starMiniCard {
          position: relative;
          flex: 0 0 104px;
          min-height: 100px;
          padding: 8px 7px;
          border-radius: 17px;
          background: #ffffff;
          border: 1px solid #f4dea0;
          text-align: center;
          box-shadow: 0 4px 12px
            rgba(170, 125, 15, 0.06);
        }

        .classDiary__starAvatar {
          width: 42px;
          height: 42px;
          margin: 0 auto;
          border-radius: 50%;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #fff8d9;
          border: 2px solid #efc94e;
          font-size: 23px;
        }

        .classDiary__starAvatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .classDiary__starName {
          margin-top: 5px;
          color: #173b31;
          font-weight: 900;
          font-size: 11px;
          line-height: 1.35;
          min-height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-wrap: anywhere;
        }

        .classDiary__starBadge {
          position: absolute;
          top: 5px;
          left: 6px;
          font-size: 12px;
        }

        @keyframes starsMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(50%);
          }
        }

        @media (max-width: 600px) {
          .classDiary__starMiniCard {
            flex-basis: 92px;
            min-height: 94px;
          }

          .classDiary__starAvatar {
            width: 38px;
            height: 38px;
            font-size: 21px;
          }

          .classDiary__starsMovingTrack {
            animation-duration: 17s;
          }
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .classDiary__starsMovingTrack {
            animation: none;
          }
        }
      `}</style>
    </div>
  ) : (
    <>
      <span className="classDiary__highlightIcon">
        🌟
      </span>

      <div>
        <strong>نجوم اليوم</strong>
        <small>
          ستظهر هنا أسماء الطلاب
          المميزين.
        </small>
      </div>
    </>
  )}
</article>

        {/* رسالة المعلم */}

       <article className="classDiary__highlight classDiary__highlight--message">
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