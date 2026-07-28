"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import HomeworkReminder from "./components/HomeworkReminder";
import Link from "next/link";

type AcademySection = {
  icon: string;
  title: string;
  description: string;
  href: string;
  className: string;
};

const sections: AcademySection[] = [
  {
    icon: "📚",
    title: "دروسي",
    description: "الدروس والأنشطة التعليمية الممتعة",
    href: "/lessons",
    className: "blue-card",
  },
  {
    icon: "🌱",
    title: "رحلة الدعم",
    description: "تدريبات متدرجة لتقوية القراءة والكتابة",
    href: "/support",
    className: "green-card",
  },
  {
  icon: "📤",
  title: "ارفع عملك",
  description: "أرسل صورة أو تسجيلًا صوتيًا أو مقطع فيديو لمعلمك",
  href: "/upload",
  className: "teal-card",
},
  {
    icon: "📖",
    title: "الفهم القرائي",
    description: "نصوص وقصص وأسئلة لتنمية الفهم",
    href: "/reading",
    className: "purple-card",
  },
  {
    icon: "🎮",
    title: "الألعاب التعليمية",
    description: "تعلّم والعب واكسب النجوم",
    href: "/games",
    className: "orange-card",
  },
  {
    icon: "✏️",
    title: "الواجبات",
    description: "شاهد واجباتك اليومية وأنجزها",
    href: "/homework",
    className: "yellow-card",
  },
  {
    icon: "🗓️",
    title: "الخطة الأسبوعية",
    description: "اطّلع على خطة التعلم لهذا الأسبوع",
    href: "/weekly-plan",
    className: "pink-card",
  },
  {
    icon: "🏆",
    title: "لوحة الشرف",
    description: "نحتفي بإنجازات أبطال الأكاديمية",
    href: "/honor-board",
    className: "gold-card",
  },
  {
    icon: "🎨",
    title: "معرض الطلاب",
    description: "شاهد إبداعات وأعمال زملائك",
    href: "/gallery",
    className: "teal-card",
  },
];
type AcademicJourneyEvent = {
  id: string;
  title: string;
  icon: string;
  semester: 1 | 2;
  date: string | null;
  category: "study" | "holiday" | "national" | "exam";
};

const academicJourneyEvents: AcademicJourneyEvent[] = [
  {
    id: "school-start",
    title: "بداية العام الدراسي",
    icon: "🏫",
    semester: 1,
    date: null,
    category: "study",
  },
  {
    id: "national-day",
    title: "إجازة اليوم الوطني",
    icon: "🇸🇦",
    semester: 1,
    date: null,
    category: "national",
  },
  {
    id: "autumn-break",
    title: "إجازة الخريف",
    icon: "🍂",
    semester: 1,
    date: null,
    category: "holiday",
  },
  {
    id: "midyear-break",
    title: "إجازة منتصف العام",
    icon: "❄️",
    semester: 1,
    date: null,
    category: "holiday",
  },
  {
    id: "semester-two-start",
    title: "بداية الفصل الدراسي الثاني",
    icon: "🚀",
    semester: 2,
    date: null,
    category: "study",
  },
  {
    id: "foundation-day",
    title: "إجازة يوم التأسيس",
    icon: "🐪",
    semester: 2,
    date: null,
    category: "national",
  },
  {
    id: "eid-al-fitr",
    title: "إجازة عيد الفطر",
    icon: "🌙",
    semester: 2,
    date: null,
    category: "holiday",
  },
  {
    id: "eid-al-adha",
    title: "إجازة عيد الأضحى",
    icon: "🕋",
    semester: 2,
    date: null,
    category: "holiday",
  },
  {
    id: "school-year-end",
    title: "نهاية العام الدراسي",
    icon: "🎓",
    semester: 2,
    date: null,
    category: "study",
  },
];

export default function Home() {
    const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    async function loadStudentRewards() {
      try {
        const studentId = localStorage.getItem("student-id");

        if (!studentId || studentId === "student-demo") {
          setPoints(0);
          setStars(0);
          return;
        }

        const studentSnapshot = await getDoc(
          doc(db, "students", studentId)
        );

        if (!studentSnapshot.exists()) {
          setPoints(0);
          setStars(0);
          return;
        }

        const studentData = studentSnapshot.data();

        setPoints(
          typeof studentData.points === "number"
            ? studentData.points
            : 0
        );

        setStars(
          typeof studentData.stars === "number"
            ? studentData.stars
            : 0
        );
      } catch (error) {
        console.error("تعذر تحميل مكافآت الطالب:", error);
      }
    }

    loadStudentRewards();
  }, []);
  const [today, setToday] = useState("");

useEffect(() => {
  setToday(
    new Intl.DateTimeFormat("ar-SA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date())
  );
}, []);

  return (
    <main className="academy-page" dir="rtl">
      <HomeworkReminder />
      <header className="academy-header">
        <div className="brand">
          <div className="brand-icon">📚</div>

          <div>
            <p className="brand-label">مرحبًا بك في</p>
            <h1>أكاديمية لغتي الرقمية</h1>
            <p className="slogan">نتعلّم… نقرأ… نبدع</p>
          </div>
        </div>

        <div className="student-points">
          <span>⭐</span>
          <div>
            <small>نجومك</small>
            <strong>{stars}</strong>
<small>{points} نقطة</small>
          </div>
        </div>
      </header>

      <section className="welcome-section">
        <div className="welcome-content">
          <span className="welcome-badge">رحلة تعليمية ممتعة 🚀</span>

          <h2>
            السلام عليكم يا بطل
            <span> 👋</span>
          </h2>

          <p>
            أنا فارس، سأرافقك في رحلة مليئة بالقراءة والتعلّم والألعاب
            والتحديات.
          </p>

          <div className="welcome-actions">
            <Link href="/lessons" className="primary-button">
              ابدأ رحلتي التعليمية
              <span> ←</span>
            </Link>

            <span className="today-date">🗓️ {today}</span>
          </div>
        </div>

        <div className="mascot-card">
          <div className="mascot-circle">🧒🏻</div>
          <strong>فارس</strong>
          <span>مرشد أكاديمية لغتي</span>
          <div className="mascot-message">أنت قادر على التقدم كل يوم ⭐</div>
        </div>
      </section>
      
<section className="visitor-dashboard">
  <div className="visitor-dashboard-header">
    <span className="section-label">واجهة الزائر</span>
    <h2>كل ما تحتاجه في مكان واحد</h2>
    <p>
      تابع التقويم الدراسي، الفصل الحالي، والمناسبة القادمة في أكاديمية لغتي.
    </p>
  </div>

  <div className="visitor-dashboard-grid">
    
<article className="visitor-info-card calendar-card academic-calendar-card">
  <div className="visitor-card-icon">📅</div>

  <div className="academic-calendar-content">
    <span className="visitor-card-label">التقويم الدراسي الرسمي</span>

    <h3>العام الدراسي 1448–1449هـ</h3>

    <p>
      أهم المواعيد والإجازات المعتمدة من وزارة التعليم ستظهر هنا مباشرة.
    </p>

    <div className="academic-calendar-events">
      {academicJourneyEvents
  .filter((event) => event.semester === 1)
  .slice(0, 3)
  .map((event, index) => (
    <div
      key={event.id}
      className={`academic-calendar-event ${
        index === 0 ? "active-event" : ""
      }`}
    >
      <span className="calendar-event-icon">{event.icon}</span>

      <div>
        <strong>{event.title}</strong>
        <small>
          {event.date
            ? new Intl.DateTimeFormat("ar-SA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(event.date))
            : "التاريخ الرسمي قيد التحديث"}
        </small>
      </div>
    </div>
  ))}
    </div>

    <span className="calendar-official-note">
      المصدر: وزارة التعليم السعودية
    </span>
  </div>
</article>
    <article className="visitor-info-card season-card">
      <div className="visitor-card-icon">☀️</div>
      <div>
        <span className="visitor-card-label">الفصل الحالي</span>
        <h3>فصل الصيف</h3>
        <p>واجهة موسمية تتغير مع فصول السنة والمناسبات.</p>
        <Link href="/seasons" className="visitor-card-link">
          استكشاف الفصول
          <span>←</span>
        </Link>
      </div>
    </article>

    <article className="visitor-info-card event-card">
      <div className="visitor-card-icon">⏳</div>
      <div>
        <span className="visitor-card-label">المناسبة القادمة</span>
        <h3>العودة إلى المدرسة</h3>
        <p>استعد لبداية عام مليء بالتعلم والإنجاز.</p>
        <span className="visitor-countdown">قريبًا بإذن الله</span>
      </div>
    </article>
  </div>
</section>

      <section className="quick-plan">
        <div>
          <span className="section-label">خطتي اليوم</span>
          <h2>خطوات صغيرة… وإنجاز كبير</h2>
        </div>

        <div className="plan-items">
          <div className="plan-item">
            <span>1</span>
            <p>أقرأ درسي</p>
          </div>

          <div className="plan-line" />

          <div className="plan-item">
            <span>2</span>
            <p>أتدرّب</p>
          </div>

          <div className="plan-line" />

          <div className="plan-item">
            <span>3</span>
            <p>ألعب وأتحدى</p>
          </div>

          <div className="plan-line" />

          <div className="plan-item">
            <span>4</span>
            <p>أكسب النجوم</p>
          </div>
        </div>
      </section>

      <section className="sections-area">
        <div className="section-heading">
          <div>
            <span className="section-label">أقسام الأكاديمية</span>
            <h2>اختر رحلتك التعليمية</h2>
          </div>

          <p>اضغط على القسم الذي ترغب في البدء به</p>
        </div>

        <div className="sections-grid">
          {sections.map((section) => (
            <Link
              href={section.href}
              className={`academy-card ${section.className}`}
              key={section.title}
            >
              <div className="card-icon">{section.icon}</div>

              <div className="card-content">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>

              <span className="card-arrow">←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="support-banner">
        <div className="support-icon">🌱</div>

        <div className="support-text">
          <span>زاوية مخصصة للتأسيس</span>
          <h2>هل تحتاج إلى مساعدة في القراءة؟</h2>
          <p>
            ابدأ رحلة الدعم من الحروف والأصوات، ثم انتقل إلى المقاطع والكلمات
            والجمل.
          </p>
        </div>

        <Link href="/support" className="support-button">
          ابدأ رحلة الدعم
          <span> ←</span>
        </Link>
      </section>

      <footer className="academy-footer">
        <p>بإشراف الأستاذ / إبراهيم أحمد</p>
        <span>أكاديمية لغتي الرقمية © 2026</span>
      </footer>
    </main>
  );
}