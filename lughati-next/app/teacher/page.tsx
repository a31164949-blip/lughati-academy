"use client";

// لوحة المعلم مع بوابة إدارة الدروس المباشرة.

import Link from "next/link";
import AcademyLogo from "../components/AcademyLogo";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase";

const TEACHER_NOTIFICATIONS_LAST_SEEN_KEY =
  "teacher-notifications-last-seen-at";

function getNotificationTime(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

const sections = [
  {
    title: "🤝 نتعاون من أجل تقدّمه",
    description:
      "متابعة ردود الأسر، تحديد خطوة هذا الأسبوع، وتسجيل موعد المراجعة.",
    href: "/teacher/family-support",
  },
  {
    title: "✨ إدارة نبض الأكاديمية",
    description:
      "مراجعة حالات الطلاب والموافقة على الصور والمقاطع قبل ظهورها.",
    href: "/teacher/academy-stories",
  },
  {
    title: "🔴 الدروس المباشرة",
    description:
      "إنشاء درس مباشر، تحديد الفصل والموعد، ومتابعة حضور الطلاب.",
    href: "/teacher/live-lessons",
  },
  {
    title: "🏅 إدارة نادي الأكاديمية",
    description:
      "إدارة أعضاء النادي والتحديات والمشاركات وبث الدروس المباشرة من مركز واحد.",
    href: "/teacher/academy-club",
  },
  {
    title: "🏆 إدارة أسبوع الوطن",
    description:
      "مراجعة مشاركات صوت الوطن واعتمادها أو إعادتها للطالب مع ملاحظة.",
    href: "/teacher/national-day",
  },
  {
    title: "🏅 إدارة نادي الأكاديمية",
    description:
      "إدارة تحديات أعضاء النادي، نشر المهام، مراجعة المشاركات، واعتماد النقاط والمكافآت.",
    href: "/teacher/academy-club",
  },
  {
    title: "🎁 إهداء النقاط",
    description:
      "إرسال هدية نقاط مباشرة للطالب مع تسجيل السبب وربطها برصيده ومدينة الإنجاز.",
    href: "/teacher/point-gifts",
  },
  {
    title: "📢 إدارة الإعلانات",
    description:
      "إنشاء الإعلانات وتعديلها ونشرها للطلاب.",
    href: "/teacher/announcements",
  },
  {
    title: "🗓️ الخطة الأسبوعية",
    description:
      "إعداد خطة الأسبوع والدروس والأهداف والواجبات.",
    href: "/teacher/weekly-plan",
  },
  {
    title: "📝 إدارة الواجبات",
    description:
      "إنشاء الواجبات اليومية ونشرها للفصول.",
    href: "/teacher/homeworks",
  },
  {
    title: "📝 إدارة الاختبارات",
    description:
      "إنشاء الاختبارات والأسئلة ونشرها للطلاب.",
    href: "/teacher/quizzes",
  },
  {
    title: "📋 متابعة إنجاز الواجبات",
    description:
      "معرفة الطلاب الذين أكدوا الإنجاز ومراجعة حالاتهم.",
    href: "/teacher/homework-tracking",
  },
  {
  title: "⚡ لغز البرق",
  description:
    "إطلاق تحدٍ مفاجئ للطلاب، تحديد الوقت، ومتابعة الإجابات والنتائج.",
  href: "/teacher/surprise-challenge",
},
  {
    title: "🎙️ مراجعة قراءات الطلاب",
    description:
      "الاستماع إلى تسجيلات القراءة واعتمادها أو طلب إعادة التسجيل.",
    href: "/teacher/reading-submissions",
  },
  {
    title: "📖 رحلات القراءة",
    description:
      "متابعة رحلة كل طالب في القراءة، وعدد الأيام، والتسجيلات، والقراءات المعتمدة، وآخر قراءة.",
    href: "/teacher/reading-journeys",
  },
  {
    title: "📚 إدارة حصص التمكين القرائي",
    description:
      "مراجعة طلبات الدعم القرائي واختيار طلاب الحصة وتنظيم موعدها.",
    href: "/teacher/reading-support",
  },
  {
  title: "🏔️ قمة الطلاقة",
  description:
    "مراجعة اختبارات ترقية الطلاب واعتماد انتقالهم بين مستويات قمة الطلاقة.",
  href: "/teacher/fluency-promotions",
},
  {
    title: "👨‍🎓 إدارة الطلاب",
    description:
      "إضافة الطلاب وتنظيمهم حسب الفصل.",
    href: "/teacher/students",
  },
  {
    title: "📷 اعتماد صور الطلاب",
    description:
      "مراجعة الصور الشخصية المرسلة من الأسر واعتمادها أو رفضها قبل ظهورها في الأكاديمية.",
    href: "/teacher/student-photos",
  },
  {
    title: "🏫 تهيئة العام الدراسي",
    description:
      "إعداد الطلاب والفصول وبيانات الدخول قبل بداية العام الدراسي.",
    href: "/teacher/school-year",
  },
  {
    title: "📅 إدارة الجدول المدرسي",
    description:
      "إعداد جدول الثاني أ والثاني ب وأوقات الحصص.",
    href: "/teacher/school-schedule",
  },
  {
    title: "📋 السجل الذكي",
    description:
      "متابعة الحضور والغياب والواجب والقراءة والمشاركة يوميًا.",
    href: "/teacher/smart-record",
  },
  {
    title: "🌟 أبطال الأكاديمية",
    description:
      "إدارة الأبطال والألقاب والإنجازات والنشر في الواجهة العامة.",
    href: "/teacher/heroes",
  },
  {
    title: "🏆 لوحة الأوائل والإعلانات",
    description:
      "إدارة إنجازات الطلاب والإعلانات والفعاليات والمسابقات المعروضة في الصفحة الرئيسية.",
    href: "/teacher/academy-board",
  },
  {
    title: "🎮 إدارة الألعاب والتحديات",
    description:
      "تحديد لعبة الأسبوع، تحدي العائلة، وتحديث كلمات ومحتوى الألعاب.",
    href: "/teacher/games",
  },
  {
    title: "🕵️ نتائج تحدّي المحقّق",
    description:
      "الاطلاع على نتائج المحققين وأوقات الحل، ثم اعتماد الترتيب والنقاط بعد انتهاء التحدي.",
    href: "/teacher/detective-results",
  },
  {
    title: "👑 تاج لغتي",
    description:
      "تقييم القراءة والإملاء، منح الألقاب، وتتويج ملوك القراءة والإملاء.",
    href: "/teacher/lughati-crown",
  },
  {
    title: "📤 مراجعة أعمال الطلاب",
    description:
      "مراجعة الملفات والصور والمقاطع المرفوعة.",
    href: "/teacher/submissions",
  },
  {
    title: "📨 رسائل الطلاب",
    description:
      "استقبال استفسارات الطلاب والرد عليها مباشرة داخل الأكاديمية.",
    href: "/teacher/student-messages",
  },
  {
    title: "🎨 إدارة معرض الطلاب",
    description:
      "إدارة الأعمال المنشورة وتمييزها أو إخفاؤها ومتابعة محتوى المعرض.",
    href: "/teacher/gallery",
  },
  {
    title: "📸 يوميات الفصل",
    description:
      "نشر صور ولقطات يومية من أنشطة الفصل مع عنوان ووصف وتاريخ.",
    href: "/teacher/class-diary",
  },
  {
    title: "✨ جماليات الدفاتر",
    description:
      "إدارة ونشر صور الدفاتر المميزة وتصنيفها وعرضها في معرض الطلاب.",
    href: "/teacher/notebook-gallery",
  },
  {
    title: "🎬 ركن أكاديمية لغتي على تيك توك",
    description:
      "إضافة المقاطع الطلابية المختارة واعتمادها ونشرها في الواجهة الرئيسية.",
    href: "/teacher/tiktok-showcase",
  },
  {
    title: "🎯 نتائج تحديد المستوى القرائي",
    description:
      "عرض أحدث نتيجة محفوظة لكل طالب ومتابعة المهارات التي تحتاج إلى تمكين.",
    href: "/teacher/reading-level-results",
  },
];

export default function TeacherDashboardPage() {
const [
  homeworkNotificationCount,
  setHomeworkNotificationCount,
] = useState(0);

const [
  messageNotificationCount,
  setMessageNotificationCount,
] = useState(0);

const notificationCount =
  homeworkNotificationCount +
  messageNotificationCount;

useEffect(() => {
  let active = true;

  async function loadNotificationCount() {
    try {
      const storedLastSeen = window.localStorage.getItem(
        TEACHER_NOTIFICATIONS_LAST_SEEN_KEY
      );

      const lastSeenAt = storedLastSeen
        ? Number(storedLastSeen)
        : 0;

      const [
        homeworkSnapshot,
        messagesSnapshot,
      ] = await Promise.all([
        getDocs(
          collection(
            db,
            "homeworkCompletions"
          )
        ),

        getDocs(
          collection(
            db,
            "studentTeacherMessages"
          )
        ),
      ]);

      if (!active) {
        return;
      }

      let homeworkCount = 0;

      homeworkSnapshot.docs.forEach(
        (completionDoc) => {
          const data =
            completionDoc.data();

          const hasReadingAudio =
            typeof data.readingAudioUrl ===
              "string" &&
            data.readingAudioUrl.trim() !== "";

          const readingNeedsReview =
            hasReadingAudio &&
            data.readingStatus !==
              "approved" &&
            data.readingStatus !==
              "rejected";

          const notificationTime =
            getNotificationTime(data.updatedAt) ||
            getNotificationTime(data.completedAt) ||
            getNotificationTime(data.createdAt);

          const isNewNotification =
            lastSeenAt === 0 ||
            notificationTime > lastSeenAt;

          if (
            readingNeedsReview &&
            isNewNotification
          ) {
            homeworkCount += 1;
          }

          const hasSolution =
            typeof data.solutionUrl ===
              "string" &&
            data.solutionUrl.trim() !== "";

          const solutionNeedsReview =
            hasSolution &&
            data.solutionStatus !==
              "approved" &&
            data.solutionStatus !==
              "rejected";

          if (
            solutionNeedsReview &&
            isNewNotification
          ) {
            homeworkCount += 1;
          }
        }
      );

      let messagesCount = 0;

      messagesSnapshot.docs.forEach(
        (messageDoc) => {
          const data =
            messageDoc.data();

          const teacherReply =
            typeof data.teacherReply ===
              "string"
              ? data.teacherReply.trim()
              : "";

          const messageTime =
            getNotificationTime(data.updatedAt) ||
            getNotificationTime(data.createdAt) ||
            getNotificationTime(data.sentAt);

          const isNewMessage =
            lastSeenAt === 0 ||
            messageTime > lastSeenAt;

          if (!teacherReply && isNewMessage) {
            messagesCount += 1;
          }
        }
      );

      setHomeworkNotificationCount(
        homeworkCount
      );

      setMessageNotificationCount(
        messagesCount
      );
    } catch (error) {
      console.error(
        "تعذر تحميل عداد الإشعارات:",
        error
      );
    }
  }

  void loadNotificationCount();

  return () => {
    active = false;
  };
}, []);

  return (
    <main
      dir="rtl"
      style={styles.page}
    >
      {/* رأس الصفحة بالهوية الرسمية */}
      <section style={styles.hero}>
        <div style={styles.heroGlowOne} />
        <div style={styles.heroGlowTwo} />

        <div style={styles.brandWrap}>
          <div style={styles.logoShell}>
            <AcademyLogo
              size={116}
              showName={false}
              showDate={false}
            />
          </div>

          <div style={styles.heroText}>
            <div style={styles.eyebrowRow}>
              <span style={styles.eyebrowDot} />
              <p style={styles.label}>
                أكاديمية لغتي الرقمية
              </p>
            </div>

            <h1 style={styles.title}>
              لوحة المعلم
            </h1>

            <p style={styles.subtitle}>
              أهلاً أستاذ إبراهيم، اختر القسم
              الذي ترغب في إدارته.
            </p>

            <div style={styles.heroMetaRow}>
              <div style={styles.symbolicDate}>
                <span style={styles.dateStar}>
                  ✦
                </span>

                <span>
                  1 / 11 / 2020
                </span>
              </div>

              <span style={styles.secureBadge}>
                🔐 لوحة المعلم محمية
              </span>
            </div>
          </div>
        </div>

        {/* 🔔 جرس الإشعارات */}
        <Link
          href="/teacher/notifications"
          onClick={() => {
            window.localStorage.setItem(
              TEACHER_NOTIFICATIONS_LAST_SEEN_KEY,
              String(Date.now())
            );

            setHomeworkNotificationCount(0);
            setMessageNotificationCount(0);
          }}
          style={styles.notificationBell}
          title="مركز الإشعارات"
          aria-label={`مركز الإشعارات - ${notificationCount} إشعار`}
        >
          <span style={styles.bellIcon}>
            🔔
          </span>

          {notificationCount > 0 && (
            <span
              style={
                styles.notificationBadge
              }
            >
              {notificationCount > 99
                ? "99+"
                : notificationCount}
            </span>
          )}

          <span
            style={
              styles.notificationText
            }
          >
            الإشعارات
          </span>
        </Link>
      </section>

      {/* الإحصاءات */}
      <section style={styles.stats}>
        <article style={styles.statCard}>
          <span style={styles.statIcon}>👨‍🎓</span>
          <strong style={styles.statNumber}>
            60
          </strong>
          <span style={styles.statLabel}>
            طالبًا
          </span>
        </article>

        <article style={styles.statCard}>
          <span style={styles.statIcon}>🏫</span>
          <strong style={styles.statNumber}>
            2
          </strong>
          <span style={styles.statLabel}>
            فصلان
          </span>
        </article>

        <article style={styles.statCard}>
          <span style={styles.statIcon}>🧭</span>
          <strong style={styles.statNumber}>
            {sections.length}
          </strong>
          <span style={styles.statLabel}>
            أداة إدارية
          </span>
        </article>
      </section>

      {/* أقسام لوحة المعلم */}
      <section>
        <div style={styles.heading}>
          <p style={styles.label}>
            الإدارة اليومية
          </p>

          <h2
            style={
              styles.sectionTitle
            }
          >
            أقسام لوحة المعلم
          </h2>
        </div>

        <div style={styles.grid}>
          {sections.map(
            (section) => {
              const isPointGift =
                section.href ===
                "/teacher/point-gifts";

              const isHeroes =
                section.href ===
                "/teacher/heroes";

              const isCrown =
                section.href ===
                "/teacher/lughati-crown";

              const isGames =
                section.href ===
                "/teacher/games";

              const isReadingJourney =
                section.href ===
                "/teacher/reading-journeys";

              const isDetectiveResults =
                section.href ===
                "/teacher/detective-results";

              const cardStyle =
                isPointGift
                  ? {
                      ...styles.card,
                      ...styles.pointGiftCard,
                    }
                  : isHeroes
                  ? {
                      ...styles.card,
                      ...styles.heroesCard,
                    }
                  : isCrown
                  ? {
                      ...styles.card,
                      ...styles.crownCard,
                    }
                  : isGames
                  ? {
                      ...styles.card,
                      ...styles.gamesCard,
                    }
                  : isReadingJourney
                  ? {
                      ...styles.card,
                      ...styles.readingJourneyCard,
                    }
                  : isDetectiveResults
                  ? {
                      ...styles.card,
                      ...styles.detectiveResultsCard,
                    }
                  : styles.card;

              const openStyle =
                isPointGift
                  ? {
                      ...styles.open,
                      color:
                        "#b45309",
                    }
                  : isHeroes
                  ? {
                      ...styles.open,
                      color:
                        "#8a6500",
                    }
                  : isCrown
                  ? {
                      ...styles.open,
                      color:
                        "#9a6700",
                    }
                  : isGames
                  ? {
                      ...styles.open,
                      color:
                        "#6d28d9",
                    }
                  : isReadingJourney
                  ? {
                      ...styles.open,
                      color:
                        "#0f766e",
                    }
                  : isDetectiveResults
                  ? {
                      ...styles.open,
                      color:
                        "#b45309",
                    }
                  : styles.open;

              return (
                <Link
                  key={
                    section.href
                  }
                  href={
                    section.href
                  }
                  style={
                    cardStyle
                  }
                >
                  <h3
                    style={
                      styles.cardTitle
                    }
                  >
                    {
                      section.title
                    }
                  </h3>

                  <p
                    style={
                      styles.cardText
                    }
                  >
                    {
                      section.description
                    }
                  </p>

                  <span
                    style={
                      openStyle
                    }
                  >
                    فتح القسم ←
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </section>

      {/* الملاحظة السفلية */}
      <section style={styles.note}>
        <span style={styles.noteIcon}>
          ⚡
        </span>

        <div>
          <strong>
            كل أدوات المعلم في مكان واحد
          </strong>

          <p style={styles.noteText}>
            يمكنك الوصول مباشرة إلى الجدول
            المدرسي والسجل الذكي ورحلات
            القراءة وأبطال الأكاديمية والألعاب
            والواجبات والاختبارات دون كتابة
            أي رابط.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f2fbf7 0%, #ffffff 100%)",
    color:
      "#174d3b",
    fontFamily:
      "Arial, sans-serif",
  },

  hero: {
    maxWidth:
      "1100px",
    margin:
      "0 auto 30px",
    padding:
      "30px 30px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap:
      "24px",
    borderRadius:
      "32px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f8fffb 58%, #fffaf0 100%)",
    border:
      "1px solid rgba(220, 170, 35, 0.24)",
    boxShadow:
      "0 18px 46px rgba(23, 77, 59, 0.10), inset 0 1px 0 rgba(255,255,255,.85)",
    position:
      "relative",
    overflow:
      "hidden",
    isolation:
      "isolate",
  },

  heroGlowOne: {
    position:
      "absolute",
    width:
      "260px",
    height:
      "260px",
    borderRadius:
      "50%",
    top:
      "-150px",
    right:
      "-90px",
    background:
      "radial-gradient(circle, rgba(34,197,94,.13), rgba(34,197,94,0) 70%)",
    pointerEvents:
      "none",
    zIndex:
      0,
  },

  heroGlowTwo: {
    position:
      "absolute",
    width:
      "220px",
    height:
      "220px",
    borderRadius:
      "50%",
    bottom:
      "-150px",
    left:
      "120px",
    background:
      "radial-gradient(circle, rgba(250,204,21,.11), rgba(250,204,21,0) 72%)",
    pointerEvents:
      "none",
    zIndex:
      0,
  },

  brandWrap: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "22px",
    minWidth:
      0,
    position:
      "relative",
    zIndex:
      1,
  },

  logoShell: {
    flexShrink:
      0,
    padding:
      "6px",
    borderRadius:
      "50%",
    background:
      "rgba(255,255,255,.76)",
    boxShadow:
      "0 16px 34px rgba(15,118,72,.14)",
  },

  heroText: {
    minWidth:
      0,
  },

  eyebrowRow: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    marginBottom:
      "7px",
  },

  eyebrowDot: {
    width:
      "9px",
    height:
      "9px",
    borderRadius:
      "50%",
    background:
      "#f3c623",
    boxShadow:
      "0 0 0 5px rgba(243,198,35,.13)",
  },

  heroMetaRow: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "9px",
    flexWrap:
      "wrap",
    marginTop:
      "11px",
  },

  symbolicDate: {
    width:
      "fit-content",
    padding:
      "4px 11px",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "7px",
    direction:
      "ltr",
    borderRadius:
      "999px",
    background:
      "rgba(22, 163, 74, 0.045)",
    border:
      "1px solid rgba(234, 179, 8, 0.17)",
    color:
      "rgba(21, 128, 84, 0.43)",
    fontSize:
      "12px",
    fontWeight:
      900,
    letterSpacing:
      "0.8px",
  },

  dateStar: {
    color:
      "rgba(234, 179, 8, 0.48)",
    fontSize:
      "11px",
  },

  secureBadge: {
    display:
      "inline-flex",
    alignItems:
      "center",
    padding:
      "4px 10px",
    borderRadius:
      "999px",
    background:
      "rgba(15,118,72,.055)",
    border:
      "1px solid rgba(15,118,72,.10)",
    color:
      "#4d7567",
    fontSize:
      "11px",
    fontWeight:
      800,
  },

  label: {
    margin:
      "0 0 8px",
    color:
      "#168c65",
    fontWeight:
      800,
  },

  title: {
    margin:
      0,
    fontSize:
      "42px",
    lineHeight:
      1.3,
  },

  subtitle: {
    margin:
      "10px 0 0",
    color:
      "#668379",
    fontSize:
      "18px",
    lineHeight:
      1.8,
  },

  /* 🔔 جرس الإشعارات */
  notificationBell: {
    position:
      "relative",
    marginRight:
      "auto",
    minWidth:
      "105px",
    padding:
      "12px 15px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "4px",
    borderRadius:
      "20px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #f2fbf7 100%)",
    border:
      "1px solid #c9e7d9",
    color:
      "#174d3b",
    textDecoration:
      "none",
    boxShadow:
      "0 7px 20px rgba(23, 77, 59, 0.07)",
  },

  bellIcon: {
    fontSize:
      "31px",
    lineHeight:
      1,
  },

  notificationBadge: {
    position:
      "absolute",
    top:
      "-8px",
    right:
      "-8px",
    minWidth:
      "27px",
    height:
      "27px",
    padding:
      "0 6px",
    borderRadius:
      "999px",
    display:
      "grid",
    placeItems:
      "center",
    background:
      "#dc2626",
    color:
      "#ffffff",
    border:
      "3px solid #ffffff",
    fontSize:
      "13px",
    fontWeight:
      900,
    boxSizing:
      "border-box",
  },

  notificationText: {
    fontSize:
      "13px",
    fontWeight:
      900,
    color:
      "#176b4d",
  },

  stats: {
    maxWidth:
      "1100px",
    margin:
      "0 auto 30px",
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap:
      "16px",
  },

  statCard: {
    padding:
      "20px 22px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap:
      "6px",
    borderRadius:
      "24px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #fbfffd 100%)",
    border:
      "1px solid #d6ebe2",
    boxShadow:
      "0 10px 26px rgba(23,77,59,.055)",
  },

  statIcon: {
    width:
      "38px",
    height:
      "38px",
    display:
      "grid",
    placeItems:
      "center",
    borderRadius:
      "13px",
    background:
      "#eefaf4",
    fontSize:
      "20px",
    marginBottom:
      "2px",
  },

  statNumber: {
    color:
      "#168c65",
    fontSize:
      "38px",
    lineHeight:
      1,
  },

  statLabel: {
    color:
      "#5d786e",
    fontSize:
      "14px",
    fontWeight:
      800,
  },

  heading: {
    maxWidth:
      "1100px",
    margin:
      "0 auto 18px",
  },

  sectionTitle: {
    margin:
      0,
    fontSize:
      "32px",
  },

  grid: {
    maxWidth:
      "1100px",
    margin:
      "0 auto",
    display:
      "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap:
      "18px",
  },

  card: {
    padding:
      "24px",
    minHeight:
      "170px",
    display:
      "flex",
    flexDirection:
      "column",
    borderRadius:
      "24px",
    background:
      "#ffffff",
    border:
      "1px solid #d6ebe2",
    boxShadow:
      "0 12px 30px rgba(23, 77, 59, 0.065), inset 0 1px 0 rgba(255,255,255,.9)",
    color:
      "#174d3b",
    textDecoration:
      "none",
  },

  /* 🎁 إهداء النقاط */
  pointGiftCard: {
    background:
      "linear-gradient(135deg, #fffaf0 0%, #fff3d6 100%)",
    border:
      "2px solid #f4c76b",
    boxShadow:
      "0 12px 30px rgba(180, 110, 20, 0.11)",
  },

  /* 🌟 أبطال الأكاديمية */
  heroesCard: {
    background:
      "linear-gradient(135deg, #fffdf2 0%, #fff8d8 100%)",
    border:
      "2px solid #f0d56b",
    boxShadow:
      "0 12px 30px rgba(180, 140, 20, 0.12)",
  },

  /* 🎮 الألعاب والتحديات */
  gamesCard: {
    background:
      "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)",
    border:
      "2px solid #c4b5fd",
    boxShadow:
      "0 12px 30px rgba(91, 33, 182, 0.10)",
  },

  /* 🕵️ نتائج تحدّي المحقّق */
  detectiveResultsCard: {
    background:
      "linear-gradient(135deg, #fffaf0 0%, #fff3d6 100%)",
    border:
      "2px solid #f4c76b",
    boxShadow:
      "0 12px 30px rgba(180, 110, 20, 0.11)",
  },

  /* 👑 تاج لغتي */
  crownCard: {
    background:
      "linear-gradient(135deg, #fffdf4 0%, #fff3c4 100%)",
    border:
      "2px solid #e7c65d",
    boxShadow:
      "0 12px 30px rgba(173, 126, 15, 0.11)",
  },

  /* 📖 رحلات القراءة */
  readingJourneyCard: {
    background:
      "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)",
    border:
      "2px solid #99f6e4",
    boxShadow:
      "0 12px 30px rgba(13, 148, 136, 0.10)",
  },

  cardTitle: {
    margin:
      "0 0 12px",
    fontSize:
      "24px",
  },

  cardText: {
    margin:
      0,
    color:
      "#668379",
    lineHeight:
      1.8,
    flex:
      1,
  },

  open: {
    marginTop:
      "20px",
    color:
      "#168c65",
    fontWeight:
      800,
  },

  note: {
    maxWidth:
      "1100px",
    margin:
      "28px auto 0",
    padding:
      "22px",
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "15px",
    borderRadius:
      "22px",
    background:
      "#e8f7f0",
    border:
      "1px solid #cde9dc",
  },

  noteIcon: {
    fontSize:
      "34px",
  },

  noteText: {
    margin:
      "6px 0 0",
    color:
      "#668379",
    lineHeight:
      1.7,
  },
};
