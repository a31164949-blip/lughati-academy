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
  const today = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

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