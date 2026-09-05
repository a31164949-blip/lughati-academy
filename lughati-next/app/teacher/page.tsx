"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase";

const sections = [
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

          if (readingNeedsReview) {
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

          if (solutionNeedsReview) {
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

          if (!teacherReply) {
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
      {/* رأس الصفحة */}
      <section style={styles.hero}>
        <div style={styles.icon}>
          👨‍🏫
        </div>

        <div>
          <p style={styles.label}>
            أكاديمية لغتي الرقمية
          </p>

          <h1 style={styles.title}>
            لوحة المعلم
          </h1>

          <p style={styles.subtitle}>
            أهلاً أستاذ إبراهيم، اختر القسم
            الذي ترغب في إدارته.
          </p>
        </div>

        {/* 🔔 جرس الإشعارات */}
        <Link
          href="/teacher/notifications"
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
          <strong
            style={
              styles.statNumber
            }
          >
            60
          </strong>

          <span>
            طالبًا
          </span>
        </article>

        <article style={styles.statCard}>
          <strong
            style={
              styles.statNumber
            }
          >
            2
          </strong>

          <span>
            فصلان
          </span>
        </article>

        <article style={styles.statCard}>
          <strong
            style={
              styles.statNumber
            }
          >
            {sections.length}
          </strong>

          <span>
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
                isHeroes
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
                isHeroes
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
      "0 auto 28px",
    padding:
      "28px",
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "20px",
    borderRadius:
      "28px",
    background:
      "#ffffff",
    border:
      "1px solid #d6ebe2",
    boxShadow:
      "0 12px 35px rgba(23, 77, 59, 0.08)",
  },

  icon: {
    width:
      "90px",
    height:
      "90px",
    display:
      "grid",
    placeItems:
      "center",
    borderRadius:
      "24px",
    background:
      "#168c65",
    fontSize:
      "45px",
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
      "#f2fbf7",
    border:
      "1px solid #cde9dc",
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
      "22px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap:
      "8px",
    borderRadius:
      "22px",
    background:
      "#ffffff",
    border:
      "1px solid #d6ebe2",
  },

  statNumber: {
    color:
      "#168c65",
    fontSize:
      "38px",
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
      "0 10px 28px rgba(23, 77, 59, 0.06)",
    color:
      "#174d3b",
    textDecoration:
      "none",
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