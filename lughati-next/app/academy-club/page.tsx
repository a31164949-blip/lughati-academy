"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";

const CLUB_LAUNCH_AT = Date.parse("2026-09-26T19:00:00+03:00");

type AcademyClubMembership = {
  active: boolean;
  membershipNumber: string;
  level: "member" | "star" | "ambassador" | "leader";
  levelLabel: string;
  joinedAt?: string;
  expiresAt?: string;
};

type JourneyResponse = {
  success: boolean;
  academyClubMembership?: AcademyClubMembership | null;
  message?: string;
};

const clubSections = [
  {
    icon: "🔴",
    title: "التحدي المباشر",
    description: "ادخل برمز الغرفة ونافس زملاءك في الوقت نفسه.",
    href: "/academy-club/live-game",
    color: "#fff0f0",
    border: "#f4a7a7",
  },
  {
    icon: "📖",
    title: "حصص التمكين القرائي",
    description: "واصل تدريبات القراءة والطلاقة، وتابع تقدمك في مسارك القرائي.",
    href: "/reading-journey",
    color: "#eaf8f0",
    border: "#9ed8b8",
  },
  {
    icon: "🎯",
    title: "تحديات النادي",
    description: "تحديات إثرائية ممتعة للأعضاء ومحبي التميز.",
    href: "/academy-club/challenge",
    color: "#fff7dc",
    border: "#edd27a",
  },
  {
    icon: "🎮",
    title: "مدينة لغتي",
    description: "مغامرة مجسّمة حصرية لأعضاء النادي؛ اعبر المراحل واجمع النجوم.",
    href: "/academy-club/lughati-city",
    color: "#eef2ff",
    border: "#a5b4fc",
  },
  {
    icon: "🎙️",
    title: "رحلة القراءة",
    description: "واصل تسجيل قراءتك وتقدم نحو مستويات أعلى.",
    href: "/reading-journey",
    color: "#eef5ff",
    border: "#a9c9f5",
  },
  {
    icon: "🏆",
    title: "أوسمتي وإنجازاتي",
    description: "شاهد الأوسمة والإنجازات التي حققتها في الأكاديمية.",
    href: "/honor-board",
    color: "#fff1e7",
    border: "#f2bd91",
  },
];

function formatDate(value?: string) {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ar-SA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function AcademyClubContent({ teacherPreview = false }: { teacherPreview?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] =
    useState<AcademyClubMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const studentName = teacherPreview
    ? "الأستاذ إبراهيم"
    : typeof window !== "undefined"
      ? window.localStorage.getItem("student-name") || "بطل الأكاديمية"
      : "بطل الأكاديمية";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    async function loadMembership() {
      try {
        setLoading(true);
        setErrorMessage("");

        const token = await user!.getIdToken();

        if (teacherPreview) {
          const response = await fetch("/api/teacher/academy-club/challenge", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error("المعاينة متاحة لحساب المعلم فقط.");
          }

          if (active) {
            setMembership({
              active: true,
              membershipNumber: "TEACHER-PREVIEW",
              level: "leader",
              levelLabel: "معاينة المعلم",
            });
          }
          return;
        }

        const response = await fetch("/api/student-journey", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = (await response.json()) as JourneyResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر التحقق من العضوية.");
        }

        if (active) {
          setMembership(
            data.academyClubMembership?.active
              ? data.academyClubMembership
              : null
          );
        }
      } catch (error) {
        console.error("تعذر تحميل عضوية النادي:", error);

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "تعذر تحميل عضوية النادي."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMembership();

    return () => {
      active = false;
    };
  }, [user, teacherPreview]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        paddingBottom: "55px",
        color: "#17352a",
        fontFamily: "Arial, sans-serif",
        background:
          "linear-gradient(180deg,#0f5c3d 0,#18754f 255px,#f4fbf7 255px,#fffaf0 100%)",
      }}
    >
      <header
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "25px 16px 22px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "22px",
              display: "grid",
              placeItems: "center",
              fontSize: "39px",
              background: "rgba(255,255,255,.13)",
              border: "2px solid #f2cf65",
            }}
          >
            🏅
          </div>

          <div>
            <p style={{ margin: "0 0 4px", opacity: 0.84, fontWeight: 800 }}>
              أكاديمية لغتي الرقمية
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(27px,6vw,43px)" }}>
              نادي الأكاديمية
            </h1>
            <p style={{ margin: "7px 0 0", color: "#f9df8b", fontWeight: 900 }}>
              كل متفاعل ومهتم يستحق منا الدعم والاهتمام
            </p>
          </div>
        </div>

        <Link
          href="/journey"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            padding: "11px 15px",
            borderRadius: "14px",
            background: "rgba(255,255,255,.12)",
            border: "1px solid rgba(255,255,255,.32)",
            fontWeight: 900,
          }}
        >
          العودة إلى رحلتي ←
        </Link>
      </header>

      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        {loading ? (
          <section style={statusCardStyle}>
            <div style={{ fontSize: "48px" }}>⏳</div>
            <h2 style={{ margin: "10px 0 5px" }}>جارٍ التحقق من عضويتك...</h2>
          </section>
        ) : errorMessage ? (
          <section style={statusCardStyle}>
            <div style={{ fontSize: "48px" }}>⚠️</div>
            <h2 style={{ margin: "10px 0 8px" }}>تعذر فتح النادي</h2>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
              {errorMessage}
            </p>
          </section>
        ) : !user ? (
          <section style={statusCardStyle}>
            <div style={{ fontSize: "48px" }}>🔐</div>
            <h2 style={{ margin: "10px 0 8px" }}>سجل دخولك أولًا</h2>
            <Link href="/login" style={mainButtonStyle}>
              الذهاب إلى تسجيل الدخول
            </Link>
          </section>
        ) : !membership ? (
          <section style={statusCardStyle}>
            <div style={{ fontSize: "55px" }}>🌱</div>
            <h2 style={{ margin: "10px 0 8px", color: "#176c46" }}>
              العضوية لم تُفعّل بعد
            </h2>
            <p
              style={{
                maxWidth: "610px",
                margin: "0 auto",
                color: "#607169",
                fontWeight: 700,
                lineHeight: 1.9,
              }}
            >
              استمر في القراءة وإنجاز مهامك والمشاركة في أنشطة الأكاديمية؛
              فالحرص والاستمرار هما طريقك إلى عضوية النادي.
            </p>
          </section>
        ) : (
          <>
            <section
              style={{
                borderRadius: "28px",
                padding: "clamp(21px,5vw,34px)",
                background:
                  "linear-gradient(135deg,#fff8d8 0%,#ffffff 53%,#eaf8f0 100%)",
                border: "2px solid #e8c75f",
                boxShadow: "0 18px 45px rgba(22,80,55,.14)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 6px", color: "#9a6b08", fontWeight: 900 }}>
                    أهلًا بك يا {studentName} 🌟
                  </p>
                  <h2
                    style={{
                      margin: "0 0 10px",
                      color: "#176c46",
                      fontSize: "clamp(24px,5vw,35px)",
                    }}
                  >
                    {membership.levelLabel}
                  </h2>
                  <p style={{ margin: 0, color: "#627168", fontWeight: 800 }}>
                    رقم العضوية: {membership.membershipNumber || "قيد الإصدار"}
                  </p>
                </div>

                <div
                  style={{
                    minWidth: "210px",
                    padding: "15px 18px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1px solid #dcebe3",
                    lineHeight: 1.9,
                    fontWeight: 800,
                    color: "#52675c",
                  }}
                >
                  <div>📅 الانضمام: {formatDate(membership.joinedAt)}</div>
                  <div>⏳ تنتهي: {formatDate(membership.expiresAt)}</div>
                </div>
              </div>
            </section>

            <section
              style={{
                marginTop: "24px",
                padding: "25px",
                borderRadius: "26px",
                color: "#ffffff",
                background: "linear-gradient(135deg,#7c5808,#c2931f)",
                boxShadow: "0 16px 35px rgba(124,88,8,.18)",
              }}
            >
              <span style={{ padding: "7px 13px", borderRadius: "999px", background: "rgba(255,255,255,.18)", fontWeight: 900 }}>
                🎁 حزمة الافتتاح الحصرية
              </span>
              <h2 style={{ margin: "14px 0 7px", fontSize: "clamp(24px,5vw,34px)" }}>
                البداية من هنا يا بطل النادي!
              </h2>
              <p style={{ margin: "0 0 17px", lineHeight: 1.9, fontWeight: 700 }}>
                تحدٍّ خاص بالأعضاء، مهام إثرائية، نقاط إضافية، وأوسمة لا تظهر إلا لأبطال نادي الأكاديمية.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px", marginBottom: "17px" }}>
                {[
                  ["🎯", "تحدي العضو الأول"],
                  ["⭐", "نقاط حصرية"],
                  ["🏅", "وسام الافتتاح"],
                ].map(([icon, title]) => (
                  <div key={title} style={{ padding: "13px", borderRadius: "16px", textAlign: "center", background: "rgba(255,255,255,.14)", fontWeight: 900 }}>
                    <div style={{ fontSize: "27px" }}>{icon}</div>{title}
                  </div>
                ))}
              </div>
              <Link href="/academy-club/challenge" style={{ ...mainButtonStyle, marginTop: 0, background: "#ffffff", color: "#7c5808" }}>
                اكتشف تحدي الافتتاح ←
              </Link>
            </section>

            <section style={{ marginTop: "27px" }}>
              <h2 style={{ margin: "0 0 7px", color: "#176c46" }}>
                ✨ مزايا عضويتك
              </h2>
              <p style={{ margin: "0 0 17px", color: "#687b72", fontWeight: 700 }}>
                اختر الركن الذي ترغب في زيارته
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(225px,1fr))",
                  gap: "16px",
                }}
              >
                {clubSections.map((section) => (
                  <Link
                    key={section.title}
                    href={
                      teacherPreview && section.href === "/academy-club/lughati-city"
                        ? "/academy-club/lughati-city?teacherPreview=1"
                        : section.href
                    }
                    style={{
                      minHeight: "170px",
                      padding: "21px",
                      borderRadius: "23px",
                      background: section.color,
                      border: `2px solid ${section.border}`,
                      color: "#17352a",
                      textDecoration: "none",
                      boxShadow: "0 9px 25px rgba(25,70,52,.08)",
                    }}
                  >
                    <div style={{ fontSize: "40px" }}>{section.icon}</div>
                    <h3 style={{ margin: "12px 0 7px", fontSize: "20px" }}>
                      {section.title}
                    </h3>
                    <p style={{ margin: 0, color: "#607169", lineHeight: 1.7 }}>
                      {section.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section
              style={{
                marginTop: "24px",
                padding: "20px",
                borderRadius: "22px",
                textAlign: "center",
                background: "#ffffff",
                border: "1px solid #dcebe3",
                color: "#52675c",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              💫 حافظ على نشاطك واستمرارك لتتقدم إلى مستوى أعلى في نادي الأكاديمية.
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AcademyClubComingSoon({ remainingMs }: { remainingMs: number }) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px 16px",
        color: "#17352a",
        fontFamily: "Arial, sans-serif",
        background:
          "radial-gradient(circle at 15% 15%,rgba(242,207,101,.24),transparent 28%), linear-gradient(145deg,#0f5c3d 0%,#18754f 48%,#f4fbf7 48%,#fffaf0 100%)",
      }}
    >
      <section
        aria-label="نادي الأكاديمية قريبًا"
        style={{
          width: "min(100%,720px)",
          position: "relative",
          overflow: "hidden",
          padding: "clamp(28px,6vw,52px) clamp(20px,6vw,48px)",
          textAlign: "center",
          borderRadius: "30px",
          border: "2px solid #e7c35d",
          background:
            "linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,248,216,.97))",
          boxShadow: "0 24px 65px rgba(7,58,37,.24)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "92px",
            height: "92px",
            margin: "0 auto 18px",
            display: "grid",
            placeItems: "center",
            borderRadius: "28px",
            fontSize: "50px",
            background: "linear-gradient(145deg,#176c46,#0e5135)",
            border: "3px solid #f0cf6b",
            boxShadow: "0 12px 26px rgba(23,108,70,.22)",
          }}
        >
          🏅
        </div>

        <span
          style={{
            display: "inline-flex",
            padding: "8px 18px",
            borderRadius: "999px",
            color: "#79560a",
            background: "#fff0ad",
            border: "1px solid #e7c35d",
            fontWeight: 900,
          }}
        >
          قريبًا… ✨
        </span>

        <h1
          style={{
            margin: "18px 0 10px",
            color: "#176c46",
            fontSize: "clamp(30px,7vw,48px)",
          }}
        >
          نادي الأكاديمية
        </h1>

        <p
          style={{
            maxWidth: "570px",
            margin: "0 auto",
            color: "#52685e",
            fontSize: "clamp(17px,3.5vw,21px)",
            fontWeight: 700,
            lineHeight: 1.9,
          }}
        >
          نعمل حاليًا على استكمال الترتيبات، لنقدّم لأبطالنا تجربة مميزة
          تجمع بين التعلم والمتعة والتحدي.
        </p>

        <p style={{ margin: "18px 0 10px", color: "#9a6b08", fontWeight: 900, fontSize: "18px" }}>
          الافتتاح السبت 26 سبتمبر — الساعة 7:00 مساءً 💫
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "9px", margin: "12px auto 24px", maxWidth: "500px" }}>
          {[[days,"يوم"],[hours,"ساعة"],[minutes,"دقيقة"],[seconds,"ثانية"]].map(([value,label]) => (
            <div key={String(label)} style={{ padding: "12px 6px", borderRadius: "16px", background: "#f3faf6", border: "1px solid #cfe6da" }}>
              <strong style={{ display: "block", color: "#176c46", fontSize: "25px" }}>{value}</strong>
              <small style={{ fontWeight: 800 }}>{label}</small>
            </div>
          ))}
        </div>

        <Link
          href="/journey"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 22px",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "15px",
            background: "linear-gradient(135deg,#18835b,#116744)",
            border: "2px solid #f0cf6b",
            fontWeight: 900,
            boxShadow: "0 8px 18px rgba(23,108,70,.18)",
          }}
        >
          العودة إلى رحلتي ←
        </Link>
      </section>
    </main>
  );
}

export default function AcademyClubPage() {
  const [now, setNow] = useState(() => Date.now());
  const [teacherPreview, setTeacherPreview] = useState(false);

  useEffect(() => {
    setTeacherPreview(
      new URLSearchParams(window.location.search).get("teacherPreview") === "1"
    );
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now >= CLUB_LAUNCH_AT || teacherPreview
    ? <AcademyClubContent teacherPreview={teacherPreview} />
    : <AcademyClubComingSoon remainingMs={CLUB_LAUNCH_AT - now} />;
}

const statusCardStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "45px 22px",
  borderRadius: "28px",
  background: "#ffffff",
  border: "1px solid #dcebe3",
  boxShadow: "0 18px 45px rgba(22,80,55,.12)",
  textAlign: "center",
};

const mainButtonStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "15px",
  padding: "12px 18px",
  borderRadius: "14px",
  color: "#ffffff",
  background: "#176c46",
  textDecoration: "none",
  fontWeight: 900,
};
