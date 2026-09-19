"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const EVENT_START = new Date("2026-09-20T00:00:00+03:00").getTime();
const EVENT_END = new Date("2026-09-26T23:59:59+03:00").getTime();

type Countdown = {
  label: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const activities = [
  {
    icon: "🎮",
    title: "خَمِّن كلمة الوطن",
    description: "ألغاز وطنية سريعة بتعليقات طريفة وتحدٍ فردي أو جماعي.",
    href: "/national-day/guess-the-word",
    status: "متاحة الآن",
  },
  {
    icon: "🧺",
    title: "سلة حروف الوطن",
    description: "التقط الحروف الصحيحة، واجمع كلمات الوطن قبل انتهاء الوقت.",
    href: "/national-day/letter-basket",
    status: "متاحة الآن",
  },
  {
    icon: "🎙️",
    title: "صوت الوطن",
    description: "إلقاء قصير يعبّر فيه الطالب عن حبه للمملكة.",
    href: "/national-day/voice-of-nation",
    status: "تفتح 20 سبتمبر",
  },
 {
  icon: "📖",
  title: "قارئ الوطن",
  description: "قراءة نص وطني بصوت واضح وأداء جميل.",
  href: "/national-day/reader-of-nation",
  status: "متاحة الآن",
},
  {
  icon: "🎨",
  title: "وطني بريشتي",
  description: "رسمة أو تصميم إبداعي يحكي قصة الوطن.",
  href: "/national-day/my-country-with-my-brush",
  status: "متاحة الآن",
},
  {
    icon: "🧠",
    title: "تحدي أعرف وطني",
    description: "أسئلة ممتعة ومعلومات مبسطة عن المملكة.",
    href: "/national-day/know-my-country",
    status: "متاحة الآن",
  },
 {
  icon: "🇸🇦",
  title: "نحن نحتفل",
  description: "شارك فرحتك بالوطن بصورة أو فيديو قصير، ودعنا نحتفل معًا 💚",
  href: "/national-day/we-celebrate",
  status: "متاحة الآن",
},
];

function getCountdown(now: number): Countdown {
  const target = now < EVENT_START ? EVENT_START : EVENT_END;
  const finished = now > EVENT_END;

  if (finished) {
    return { label: "انتهى أسبوع الفعاليات", days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const difference = Math.max(0, target - now);
  return {
    label: now < EVENT_START ? "متبقي على انطلاق الفعاليات" : "متبقي على ختام الفعاليات",
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function NationalDayPage() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const update = () => setCountdown(getCountdown(Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main dir="rtl" className="national-page">
      <style>{`
        .national-page {
          min-height: 100vh;
          padding: 24px;
          color: #123d31;
          background:
            radial-gradient(circle at 8% 6%, rgba(250,204,21,.16), transparent 20%),
            linear-gradient(180deg, #effcf6 0%, #ffffff 48%, #f5fbf8 100%);
        }
        .national-shell { max-width: 1180px; margin: 0 auto; }
        .national-hero {
          position: relative;
          overflow: hidden;
          padding: clamp(26px, 5vw, 54px);
          border-radius: 36px;
          color: white;
          text-align: center;
          background: linear-gradient(135deg, #064e3b, #087b52 56%, #10a36b);
          border: 1px solid rgba(250,204,21,.5);
          box-shadow: 0 22px 55px rgba(6,78,59,.22);
        }
        .national-hero::before {
          content: "وطننا";
          position: absolute;
          left: -24px;
          bottom: -66px;
          font-size: 120px;
          font-weight: 950;
          opacity: .07;
          transform: rotate(-8deg);
        }
        .national-countdown {
          display: grid;
          grid-template-columns: repeat(4, minmax(78px, 115px));
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
        }
        .national-time {
          padding: 13px 8px;
          border-radius: 18px;
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.22);
          backdrop-filter: blur(4px);
        }
        .national-time strong { display: block; font-size: 27px; color: #fde68a; }
        .national-time span { font-size: 12px; font-weight: 800; color: #dcfce7; }
        .activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }
        .activity-card {
          padding: 22px;
          border-radius: 24px;
          background: white;
          border: 1px solid #ccebdd;
          box-shadow: 0 12px 30px rgba(15,118,72,.08);
        }
        @media (max-width: 560px) {
          .national-page { padding: 13px; }
          .national-countdown { grid-template-columns: repeat(2, minmax(90px, 1fr)); }
        }
      `}</style>

      <div className="national-shell">
        <div style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "#087b52", fontWeight: 900, textDecoration: "none" }}>
            → العودة إلى الأكاديمية
          </Link>
        </div>

        <section className="national-hero">
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 18px",
                marginBottom: 10,
                borderRadius: 999,
                color: "#ffffff",
                background: "rgba(255,255,255,.13)",
                border: "1px solid rgba(255,255,255,.28)",
                fontWeight: 950,
              }}
            >
              راية العز والوطن
            </div>
            <div
              dir="ltr"
              style={{
                display: "inline-grid",
                gridTemplateColumns: "auto auto auto",
                justifyContent: "center",
                alignItems: "center",
                gap: 5,
                color: "#fde68a",
                fontWeight: 900,
              }}
            >
              <span>20 – 26</span>
              <span>سبتمبر</span>
              <span>2026</span>
            </div>
            <h1 style={{ margin: "8px 0", fontSize: "clamp(32px, 6vw, 58px)", lineHeight: 1.25 }}>
              أسبوع الوطن في أكاديمية لغتي
            </h1>
            <p style={{ maxWidth: 760, margin: "0 auto", color: "#dcfce7", lineHeight: 1.9, fontSize: 18 }}>
              نقرأ، نبدع، ونتشارك الفرح في أسبوع وطني مليء بالمسابقات والفعاليات الجميلة.
            </p>

            {countdown ? (
              <>
                <div style={{ marginTop: 20, fontWeight: 900, color: "#fff7c2" }}>{countdown.label}</div>
                <div className="national-countdown">
                  {[
                    [countdown.days, "يوم"],
                    [countdown.hours, "ساعة"],
                    [countdown.minutes, "دقيقة"],
                    [countdown.seconds, "ثانية"],
                  ].map(([value, label]) => (
                    <div className="national-time" key={String(label)}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#b58400", fontWeight: 900 }}>اللمسات الأولى</span>
            <h2 style={{ margin: "5px 0", fontSize: "clamp(25px, 4vw, 36px)" }}>مسابقات أسبوع الوطن</h2>
            <p style={{ margin: 0, color: "#647b73" }}>سنفتح كل مسابقة في موعدها، وترقّبوا تفاصيل المشاركة قريبًا.</p>
          </div>

          <div className="activity-grid">
            {activities.map((activity) => (
              <article className="activity-card" key={activity.title}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 38 }}>{activity.icon}</div>
                  <span style={{ padding: "6px 10px", borderRadius: 999, color: "#996c00", background: "#fff7cc", fontSize: 12, fontWeight: 900 }}>
                    {activity.status || "قريبًا"}
                  </span>
                </div>
                <h3 style={{ margin: "14px 0 7px", color: "#086447", fontSize: 21 }}>{activity.title}</h3>
                <p style={{ margin: 0, color: "#657b74", lineHeight: 1.8 }}>{activity.description}</p>
                {activity.href ? (
                  <Link
                    href={activity.href}
                    style={{
                      display: "block",
                      marginTop: 16,
                      padding: "11px 14px",
                      borderRadius: 13,
                      color: "#ffffff",
                      background: "#087b52",
                      textAlign: "center",
                      textDecoration: "none",
                      fontWeight: 900,
                    }}
                  >
                    عرض المسابقة ←
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 25, padding: 22, borderRadius: 24, textAlign: "center", color: "#075f46", background: "#fff8d8", border: "1px solid #f1d36c" }}>
          <strong style={{ display: "block", fontSize: 21, marginBottom: 5 }}>✨ البداية تقترب</strong>
          <span style={{ lineHeight: 1.8 }}>سيتم قريبًا تفعيل التسجيل ورفع المشاركات وإعلان برنامج كل يوم.</span>
        </section>
      </div>
    </main>
  );
}
