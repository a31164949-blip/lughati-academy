"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { cloudinaryImageUrl } from "../lib/cloudinaryDelivery";

type PickItem = {
  id: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  action: string;
  href: string;
  color: string;
  lightColor: string;
};

const picks: PickItem[] = [
  {
    id: "story",
    icon: "📖",
    label: "قصة الأسبوع",
    title: "صندوق الصور في بيت جدي",
    description:
  "قصة مصوّرة عن الأقارب والمحبة وصلة الرحم، مع مفردات وأسئلة فهم ونسخة قابلة للطباعة.",
    action: "اقرأ القصة",
    href: "/reading/stories/relatives",
    color: "#6d4bd8",
    lightColor: "#f2efff",
  },
  {
    id: "word",
    icon: "💎",
    label: "اكتشف كلمة الأسبوع",
    title: "كلمة هذا الأسبوع: 🔒 ؟",
    description:
      "اكتشف معناها، واستمع إليها، ثم حاول استخدامها في جملة من إنشائك.",
    action: "اكتشف الكلمة",
    href: "/picks/word",
    color: "#168a63",
    lightColor: "#eaf9f2",
  },
  {
    id: "did-you-know",
    icon: "💡",
    label: "هل تعلم؟",
    title: "معلومة صغيرة… معرفة كبيرة",
    description:
      "معلومة ممتعة ومبسطة نضيفها كل أسبوع لتتعلم شيئًا جديدًا.",
    action: "اكتشف المعلومة",
    href: "/picks/did-you-know",
    color: "#d77a17",
    lightColor: "#fff5e7",
  },
  {
    id: "quick-challenge",
    icon: "⚡",
    label: "تحدي سريع",
    title: "هل تستطيع حلها؟",
    description:
      "سؤال لغوي قصير يحتاج إلى تركيز. فكّر جيدًا قبل اختيار الإجابة.",
    action: "ابدأ التحدي",
    href: "/picks/challenge",
    color: "#167bb2",
    lightColor: "#eaf7ff",
  },
];

type WeeklyStory = { title: string; description: string; href: string; published: boolean };

type WeeklyHero = { name: string; grade: string; praise: string; photoUrl: string; revealed: boolean };
const defaultHero: WeeklyHero = { name: "", grade: "الصف الثاني", praise: "نفخر بك وبجهدك الجميل. استمر في التعلّم والمثابرة؛ فكل خطوة تصنع إنجازًا جديدًا.", photoUrl: "", revealed: false };

export default function WeeklyPicks() {
  const [hero, setHero] = useState<WeeklyHero>(defaultHero);
  const [story, setStory] = useState<Partial<WeeklyStory> | null>(null);
  useEffect(() => {
    void getDoc(doc(db, "weeklyPicks", "current")).then((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (data.hero) setHero({ ...defaultHero, ...data.hero });
      if (data.story) setStory(data.story);
    }).catch((error) => console.error("تعذر تحميل بطل الأسبوع:", error));
  }, []);
  const revealed = hero.revealed && Boolean(hero.name.trim());
  const currentPicks = picks.flatMap((item) => {
    if (item.id !== "story" || !story) return [item];
    if (story.published === false) return [];
    return [{ ...item, title: story.title || item.title, description: story.description || item.description, href: story.href || item.href }];
  });
  return (
    <section
      dir="rtl"
      style={{
        maxWidth: "1180px",
        margin: "28px auto",
      }}
    >
      {/* رأس الركن */}

      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 13px",
              borderRadius: "999px",
              background: "#eef8f3",
              color: "#14704b",
              fontSize: "13px",
              fontWeight: 900,
            }}
          >
            ✨ من اختيار أكاديمية لغتي
          </span>

          <h2
            style={{
              margin: "8px 0 3px",
              color: "#174c3b",
              fontSize: "clamp(26px,4vw,35px)",
              lineHeight: 1.4,
            }}
          >
            مختارات متنوعة 🌟
          </h2>

          <p
            style={{
              margin: 0,
              color: "#718078",
              lineHeight: 1.8,
              fontWeight: 700,
            }}
          >
            اقرأ، اكتشف، فكّر واستمتع
            بمختارات جديدة ومتنوعة.
          </p>
        </div>

        <Link
          href="/picks"
          style={{
            textDecoration: "none",
            padding: "11px 17px",
            borderRadius: "15px",
            background: "#fff",
            color: "#14704b",
            border: "1px solid #d3eade",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          جميع المختارات ←
        </Link>
      </div>

      {/* واجهة مختارات الأسبوع: بطلنا هذا الأسبوع */}
      <div
        style={{ position: "relative", overflow: "hidden", padding: "28px", marginBottom: "15px", borderRadius: "30px", background: "linear-gradient(135deg,#0f7654 0%,#168a63 55%,#29a77a 100%)", color: "white", boxShadow: "0 15px 35px rgba(20,112,75,.18)" }}
      >
        <div style={{ position: "absolute", width: "210px", height: "210px", borderRadius: "50%", background: "rgba(255,255,255,.07)", left: "-65px", top: "-85px" }} />
        <div className="picks-featured weekly-hero-featured" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(220px,.55fr)", alignItems: "center", gap: "24px" }}>
          <div>
            <span style={{ display: "inline-flex", padding: "7px 12px", borderRadius: "999px", background: "#fff0a8", color: "#765800", fontSize: "13px", fontWeight: 900 }}>🏆 نجم أكاديمية لغتي</span>
            <h3 style={{ margin: "12px 0 4px", fontSize: "clamp(30px,4vw,43px)", lineHeight: 1.35 }}>{revealed ? "🏆 بطلنا هذا الأسبوع" : "🌟 قصة بطل هذا الأسبوع"}</h3>
            <strong style={{ display: "block", marginTop: "8px", fontSize: "clamp(21px,3vw,28px)", color: "#fff4b8" }}>{revealed ? hero.name : "شخصية قصتنا ما زالت سرًّا 🤫"}</strong>
            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "14px" }}>{revealed ? <><span className="pick-chip">📚 {hero.grade}</span><span className="pick-chip">⭐ تميز ومثابرة</span><span className="pick-chip">👏 تطور ملحوظ</span></> : <><span className="pick-chip">🌱 بدأ متأخرًا</span><span className="pick-chip">💪 لم يستسلم</span><span className="pick-chip">🏆 ينافس على الصدارة</span></>}</div>
            <p style={{ maxWidth: "690px", margin: "16px 0 0", color: "rgba(255,255,255,.94)", lineHeight: 1.95, fontWeight: 800, fontSize: "16px" }}>{revealed ? hero.praise : "في بداية الرحلة كان بعيدًا عن المقدمة، لكنه قرر أن يبدأ. قرأ، وأنجز، وشارك، وحاول مرة بعد مرة. ومع الأيام اقترب أكثر فأكثر، واليوم أصبح ينافس بقوة على الصدارة. فمن يكون هذا البطل؟ 🤔"}</p>
          </div>
          <div style={{ display: "grid", placeItems: "center" }}>
            <div className="weekly-hero-photo" style={{ position: "relative", width: "190px", height: "190px", borderRadius: "50%", padding: "7px", background: "linear-gradient(135deg,#facc15,#fff2a3,#facc15)", boxShadow: "0 14px 34px rgba(0,0,0,.18)" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", display: "grid", placeItems: "center", overflow: "hidden", background: "rgba(255,255,255,.96)", fontSize: "86px", color: "#14704b", fontWeight: 950 }}>{revealed && hero.photoUrl ? <img src={cloudinaryImageUrl(hero.photoUrl, 420)} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "❓"}</div>
              <span style={{ position: "absolute", left: "2px", bottom: "5px", width: "52px", height: "52px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#facc15", border: "4px solid white", fontSize: "27px" }}>🏆</span>
            </div>
            <span style={{ marginTop: "13px", padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.2)", fontWeight: 900 }}>{revealed ? "🥇 بطل الأسبوع" : "🔒 سنكشف عنه قريبًا"}</span>
          </div>
        </div>
      </div>

      {/* المختارات */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(230px,1fr))",
          gap: "14px",
        }}
      >
        {currentPicks.map((item) => (
          <article
            key={item.id}
            className="pick-card"
            style={{
              background: "white",
              border: "1px solid #e1ebe6",
              borderRadius: "24px",
              padding: "18px",
              boxShadow:
                "0 8px 20px rgba(30,90,60,.06)",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "18px",
                display: "grid",
                placeItems: "center",
                fontSize: "31px",
                background: item.lightColor,
              }}
            >
              {item.icon}
            </div>

            <span
              style={{
                display: "block",
                marginTop: "13px",
                color: item.color,
                fontSize: "12px",
                fontWeight: 900,
              }}
            >
              {item.label}
            </span>

            <h3
              style={{
                margin: "5px 0 0",
                color: "#243d34",
                fontSize: "18px",
                lineHeight: 1.55,
              }}
            >
              {item.title}
            </h3>

            <p
              style={{
                margin: "8px 0 0",
                minHeight: "66px",
                color: "#708078",
                fontSize: "13px",
                lineHeight: 1.75,
              }}
            >
              {item.description}
            </p>

            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "14px",
                background: item.lightColor,
                color: item.color,
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              <span>{item.action}</span>
              <span>←</span>
            </Link>
          </article>
        ))}
      </div>

      <style jsx>{`
.pick-chip {
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 12px;
          font-weight: 800;
        }

        .pick-card {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .pick-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 28px rgba(30, 90, 60, 0.1) !important;
        }

        .pick-book {
          position: relative;
          width: 180px;
          height: 180px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          animation: pickFloat 4s ease-in-out infinite;
        }

        .pick-book__main {
          font-size: 82px;
        }

        .pick-book__star {
          position: absolute;
        }

        .pick-book__star--one {
          right: 18px;
          top: 22px;
          font-size: 27px;
        }

        .pick-book__star--two {
          left: 19px;
          bottom: 26px;
          font-size: 24px;
        }

        .pick-book__star--three {
          right: 24px;
          bottom: 25px;
          font-size: 23px;
        }

        @keyframes pickFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        @media (max-width: 760px) {\n          .weekly-hero-photo { width: 150px !important; height: 150px !important; }
          .picks-featured {
            grid-template-columns: 1fr !important;
          }

          .pick-book {
            width: 150px;
            height: 150px;
          }

          .pick-book__main {
            font-size: 68px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pick-book {
            animation: none;
          }

          .pick-card {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}