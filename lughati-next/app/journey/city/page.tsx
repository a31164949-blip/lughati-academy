"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type CityStage = {
  points: number;
  name: string;
  icon: string;
  description: string;
};

type LandmarkInfo = {
  title: string;
  icon: string;
  description: string;
};

const UNIT1_INTRO_KEY =
  "lughati-unit1-intro-completed";

const UNIT1_LESSON2_KEY =
  "lughati-unit1-lesson2-completed";

const UNIT1_REVIEW_KEY =
  "lughati-unit1-review-completed";

const cityStages: CityStage[] = [
  {
    points: 0,
    name: "منزل البطل",
    icon: "🏠",
    description: "هنا تبدأ قصة مدينتك.",
  },
  {
    points: 50,
    name: "شجرة الإنجاز",
    icon: "🌳",
    description:
      "بدأت الحياة تظهر في مدينتك.",
  },
  {
    points: 100,
    name: "طريق النجاح",
    icon: "🛣️",
    description:
      "طريق جديد يربط أجزاء مدينتك.",
  },
  {
    points: 150,
    name: "حديقة البطل",
    icon: "🌷",
    description:
      "أصبحت مدينتك أكثر جمالًا.",
  },
  {
    points: 250,
    name: "إنارة المدينة",
    icon: "💡",
    description:
      "بدأت شوارع مدينتك تضيء.",
  },
  {
    points: 350,
    name: "حديقة الألعاب",
    icon: "🛝",
    description:
      "افتتحت منطقة جديدة للمرح.",
  },
  {
    points: 500,
    name: "مكتبة لغتي",
    icon: "📚",
    description:
      "القراءة بنت مكتبة في مدينتك.",
  },
  {
    points: 700,
    name: "أكاديمية لغتي",
    icon: "🏫",
    description:
      "أصبح للعلم مبنى كبير في مدينتك.",
  },
  {
    points: 900,
    name: "نافورة المدينة",
    icon: "⛲",
    description:
      "ازدانت المدينة بنافورة جميلة.",
  },
  {
    points: 1200,
    name: "ملعب الأبطال",
    icon: "🏟️",
    description:
      "افتتح ملعب أبطال الأكاديمية.",
  },
  {
    points: 1500,
    name: "متجر المدينة",
    icon: "🏪",
    description:
      "أصبحت مدينتك أكثر نشاطًا.",
  },
  {
    points: 1800,
    name: "سيارتي",
    icon: "🚗",
    description:
      "أصبحت تستطيع التجول في مدينتك.",
  },
  {
    points: 2200,
    name: "قصر الإنجاز",
    icon: "🏰",
    description:
      "قصر كبير يرمز إلى استمرارك.",
  },
  {
    points: 2700,
    name: "وسط المدينة",
    icon: "🌆",
    description:
      "تحولت مدينتك إلى مدينة متكاملة.",
  },
  {
    points: 3500,
    name: "مدينة البطل الكبرى",
    icon: "👑",
    description:
      "بلغت أعلى مراحل مدينة الإنجاز.",
  },
];

export default function AchievementCityPage() {
  const [points, setPoints] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [mounted] =
  useState(true);
    useState(false);

  const [showStages, setShowStages] =
    useState(false);

  const [
    selectedLandmark,
    setSelectedLandmark,
  ] = useState<LandmarkInfo | null>(
    null
  );

  const [unitOneCompleted] = useState(() => {
  if (typeof window === "undefined") {
    return false;
  }

  const introCompleted =
    window.localStorage.getItem(
      UNIT1_INTRO_KEY
    ) === "true";

  const lessonTwoCompleted =
    window.localStorage.getItem(
      UNIT1_LESSON2_KEY
    ) === "true";

  const reviewCompleted =
    window.localStorage.getItem(
      UNIT1_REVIEW_KEY
    ) === "true";

  return (
    introCompleted &&
    lessonTwoCompleted &&
    reviewCompleted
  );
});

  const [carStyle, setCarStyle] =
    useState<
      "blue" | "green" | "gold"
    >("blue");

  useEffect(() => {
    async function loadStudentPoints() {
      try {
        setLoading(true);

        const studentId =
          window.localStorage.getItem(
            "student-id"
          );

        if (
          !studentId ||
          studentId === "student-demo"
        ) {
          setPoints(0);
          return;
        }

        const studentSnapshot =
          await getDoc(
            doc(
              db,
              "students",
              studentId
            )
          );

        if (!studentSnapshot.exists()) {
          setPoints(0);
          return;
        }

        const data =
          studentSnapshot.data();

        setPoints(
          typeof data.points === "number"
            ? data.points
            : 0
        );
      } catch (error) {
        console.error(
          "تعذر تحميل نقاط الطالب:",
          error
        );

        setPoints(0);
      } finally {
        setLoading(false);
      }
    }

    void loadStudentPoints();
  }, []);

  const unlockedStages =
    useMemo(
      () =>
        cityStages.filter(
          (stage) =>
            points >= stage.points
        ),
      [points]
    );

  const currentStage =
    unlockedStages[
      unlockedStages.length - 1
    ] ?? cityStages[0];

  const nextStage =
    cityStages.find(
      (stage) =>
        points < stage.points
    ) ?? null;

  const currentIndex =
    cityStages.findIndex(
      (stage) =>
        stage.name ===
        currentStage.name
    );

  const level = Math.max(
    1,
    currentIndex + 1
  );

  const remainingPoints =
    nextStage
      ? Math.max(
          0,
          nextStage.points - points
        )
      : 0;

  const previousThreshold =
    currentStage.points;

  const nextThreshold =
    nextStage?.points ??
    currentStage.points;

  const progress =
    nextStage &&
    nextThreshold >
      previousThreshold
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((points -
                previousThreshold) /
                (nextThreshold -
                  previousThreshold)) *
                100
            )
          )
        )
      : 100;

  if (!mounted) {
    return <CityLoading />;
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 px-3 py-5 sm:px-5"
    >
      {/* ======================== */}
      {/* حركات مدينة الإنجاز */}
      {/* ======================== */}

      <style>{`
        @keyframes cityCloudDrift {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(18px);
          }
        }

        @keyframes cityCloudDriftReverse {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-15px);
          }
        }

        @keyframes citySunGlow {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.06);
            filter: brightness(1.08);
          }
        }

        @keyframes cityTreeSway {
          0%, 100% {
            transform: rotate(-1deg);
          }
          50% {
            transform: rotate(1.5deg);
          }
        }

        @keyframes cityLampGlow {
          0%, 100% {
            opacity: .86;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes cityGatePulse {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes cityGateGlow {
          0%, 100% {
            filter:
              drop-shadow(
                0 10px 10px
                rgba(91,33,182,.18)
              );
          }
          50% {
            filter:
              drop-shadow(
                0 13px 15px
                rgba(124,58,237,.38)
              );
          }
        }

        @keyframes cityUnitGateGlow {
          0%, 100% {
            filter:
              drop-shadow(
                0 10px 10px
                rgba(217,119,6,.16)
              );
          }
          50% {
            filter:
              drop-shadow(
                0 13px 16px
                rgba(245,158,11,.38)
              );
          }
        }

        @keyframes cityWaterRise {
          0%, 100% {
            transform:
              translateX(-50%)
              scaleY(.84);
            opacity: .8;
          }
          50% {
            transform:
              translateX(-50%)
              scaleY(1.08);
            opacity: 1;
          }
        }

        @keyframes cityFlowerFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes citySparkFloat {
          0%, 100% {
            transform:
              translateY(0)
              rotate(0deg);
          }
          50% {
            transform:
              translateY(-8px)
              rotate(8deg);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .city-motion {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">

        {/* الترويسة */}

        <header className="relative mb-5 overflow-hidden rounded-[34px] bg-gradient-to-l from-emerald-900 via-emerald-700 to-teal-600 p-5 text-white shadow-2xl sm:p-7">
          <div className="absolute -left-14 -top-16 h-48 w-48 rounded-full bg-white/10" />

          <div className="absolute bottom-[-80px] right-[25%] h-44 w-44 rounded-full bg-amber-300/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur">
                ✨ مدينتك تتطور بإنجازك
              </span>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                🏙️ مدينة الإنجاز
              </h1>

              <p className="mt-2 max-w-2xl leading-8 text-emerald-50">
                كل قراءة وواجب واختبار
                وإنجاز يترك أثرًا جديدًا
                داخل مدينتك.
              </p>
            </div>

      <a
  href="/journey"
  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-6 py-3 no-underline shadow-lg transition hover:bg-emerald-50 active:scale-95"
  style={{
    color: "#065f46",
    fontSize: "18px",
    fontWeight: 900,
    direction: "rtl",
    whiteSpace: "nowrap",
  }}
>
  ← العودة إلى رحلتي
</a>
          </div>
        </header>

        {/* الإحصاءات */}

        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CityStat
            icon="⭐"
            label="نقاطي"
            value={
              loading
                ? "..."
                : String(points)
            }
          />

          <CityStat
            icon="🏙️"
            label="المستوى"
            value={`المستوى ${level}`}
          />

          <CityStat
            icon={currentStage.icon}
            label="آخر بناء"
            value={currentStage.name}
          />

          <CityStat
            icon={
              nextStage?.icon ?? "👑"
            }
            label="القادم"
            value={
              nextStage
                ? nextStage.name
                : "اكتملت المدينة"
            }
          />
        </section>

        {/* تقدم المدينة */}

        <section className="mb-5 rounded-[28px] border border-white bg-white/90 p-5 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-emerald-700">
                🚀 تقدم مدينتي
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-800 sm:text-xl">
                {nextStage
                  ? `${remainingPoints} نقطة تفصلك عن ${nextStage.name}`
                  : "👑 وصلت إلى أعلى مرحلة في المدينة"}
              </h2>
            </div>

            <strong className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">
              {progress}%
            </strong>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-500 via-teal-400 to-amber-400 transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* المدينة */}

        <section
          className="relative min-h-[700px] overflow-hidden rounded-[42px] border-4 border-white bg-sky-200 shadow-2xl sm:min-h-[780px] lg:min-h-[820px]"
          style={{
            perspective: "1350px",
          }}
        >
          {/* السماء */}

          <div className="absolute inset-x-0 top-0 z-0 h-[46%] bg-gradient-to-b from-sky-300 via-sky-200 to-sky-50" />

          <Sun />

          <Cloud
            className="left-[7%] top-[10%]"
            animation="cityCloudDrift 15s ease-in-out infinite"
          />

          <Cloud
            className="left-[39%] top-[6%] scale-75"
            animation="cityCloudDriftReverse 18s ease-in-out infinite"
          />

          <Cloud
            className="right-[24%] top-[14%] scale-90"
            animation="cityCloudDrift 20s ease-in-out infinite"
          />

          {/* الجبال */}

          <MountainLayer
            className="bottom-[52%] left-0 w-[52%]"
            color="rgba(16,185,129,.20)"
          />

          <MountainLayer
            className="bottom-[52%] right-0 w-[55%]"
            color="rgba(5,150,105,.18)"
          />

          {/* السهل البعيد */}

          <div className="absolute inset-x-0 bottom-[46%] z-[1] h-[12%] bg-gradient-to-b from-emerald-100 via-emerald-200 to-emerald-300" />

          <div className="absolute inset-x-[5%] bottom-[47%] z-[2] h-[62px] rounded-[50%] bg-emerald-300/45 blur-[1px]" />

          {/* عنوان المستوى */}

          <div className="absolute left-1/2 top-5 z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-5 py-2 text-xs font-black text-emerald-800 shadow-lg backdrop-blur sm:text-sm">
            🧭 المستوى {level} —{" "}
            {currentStage.name}
          </div>

          {/* أرض المدينة */}

          <div className="absolute inset-x-0 bottom-0 z-[1] h-[55%] bg-gradient-to-b from-emerald-50 via-emerald-200 to-emerald-500" />

          {/* ملمس الأرض */}

          <div
            className="absolute inset-x-0 bottom-0 z-[2] h-[53%] opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,.55) 0 2px, transparent 3px), radial-gradient(circle at 70% 55%, rgba(16,185,129,.35) 0 2px, transparent 3px)",
              backgroundSize:
                "55px 55px, 70px 70px",
            }}
          />

          {/* عمق الأرض */}

          <div
            className="absolute bottom-[-105px] left-1/2 z-[3] h-[520px] w-[118%] -translate-x-1/2 rounded-[48%] border-[14px] border-emerald-500/10 bg-gradient-to-b from-emerald-100/65 via-emerald-300/80 to-emerald-600/90 shadow-[0_-18px_55px_rgba(16,185,129,.14)]"
            style={{
              transform:
                "translateX(-50%) rotateX(54deg)",
              transformOrigin:
                "center bottom",
            }}
          />

          {/* منطقة خضراء خلفية */}

          <div className="absolute inset-x-[7%] bottom-[39%] z-[4] h-[68px] rounded-[50%] bg-emerald-200/35 blur-[1px]" />

          {/* الساحة */}

          <div
            className="absolute bottom-[18%] left-1/2 z-[6] h-[145px] w-[310px] -translate-x-1/2 rounded-[50%] border-[8px] border-stone-300 bg-gradient-to-b from-white to-stone-100 shadow-2xl sm:w-[360px]"
            style={{
              transform:
                "translateX(-50%) rotateX(58deg)",
            }}
          />

          {/* الطريق */}

          {points >= 100 && (
            <CityRoad />
          )}

          {/* الرصيف */}

          {points >= 100 && (
            <>
              <Sidewalk side="left" />
              <Sidewalk side="right" />
            </>
          )}

          {/* الحدائق */}

          <ParkPatch className="bottom-[11%] left-[3%]" />

          <ParkPatch className="bottom-[11%] right-[3%]" />

          {/* المكتبة */}

          {points >= 500 && (
            <LandmarkButton
              className="bottom-[48%] left-[4%] z-20 scale-[.9]"
              title="مكتبة لغتي"
              icon="📚"
              description="مكتبتك الخاصة؛ بنتها القراءة والاستمرار."
              onOpen={
                setSelectedLandmark
              }
            >
              <LibraryBuilding />
            </LandmarkButton>
          )}

          {/* الأكاديمية */}

          {points >= 700 && (
            <LandmarkButton
              className="bottom-[48%] right-[4%] z-20 scale-[.92]"
              title="أكاديمية لغتي"
              icon="🏫"
              description="أكبر مباني التعلم في مدينتك."
              onOpen={
                setSelectedLandmark
              }
            >
              <AcademyBuilding />
            </LandmarkButton>
          )}

          {/* بوابة المتاهة */}

          {points >= 350 && (
            <a
              href="/journey/city/maze"
              className="absolute bottom-[48%] left-[27%] z-30 border-0 bg-transparent p-0 text-center no-underline transition duration-300 hover:-translate-y-2 hover:scale-105"
            >
              <div
                className="city-motion"
                style={{
                  animation:
                    "cityGatePulse 3.4s ease-in-out infinite",
                }}
              >
                <MazeGate />
              </div>

              <div className="mx-auto mt-1 w-fit whitespace-nowrap rounded-full border border-violet-200 bg-white/95 px-3 py-1 text-[9px] font-black text-violet-700 shadow-lg sm:text-xs">
                🌀 بوابة المتاهة
              </div>

              <div className="city-motion mx-auto mt-1 w-fit rounded-full bg-violet-600 px-3 py-1 text-[8px] font-black text-white shadow-md sm:text-[10px]"
                style={{
                  animation:
                    "cityGatePulse 2.4s ease-in-out infinite",
                }}
              >
                🎮 العب الآن
              </div>
            </a>
          )}

          {/* بوابة أقاربي */}

          {unitOneCompleted && (
            <LandmarkButton
              className="bottom-[49%] right-[26%] z-30"
              title="بوابة أقاربي"
              icon="🏅"
              description="فتحت هذه البوابة لأنك أكملت الوحدة الأولى «أقاربي»."
              onOpen={
                setSelectedLandmark
              }
            >
              <div
                className="city-motion"
                style={{
                  animation:
                    "cityGatePulse 4s ease-in-out infinite",
                }}
              >
                <UnitGate />
              </div>
            </LandmarkButton>
          )}

          {/* المنزل */}

          <LandmarkButton
            className="bottom-[33%] left-1/2 z-40 -translate-x-1/2"
            title="منزل البطل"
            icon="🏠"
            description="أول مبنى في مدينتك، ومنه تبدأ رحلة الإنجاز."
            onOpen={
              setSelectedLandmark
            }
          >
            <HeroHouse3D />
          </LandmarkButton>

          {/* الأشجار الخلفية */}

          {points >= 150 && (
            <>
              <MiniTree className="bottom-[37%] left-[31%]" />
              <MiniTree className="bottom-[39%] left-[25%]" />
              <MiniTree className="bottom-[37%] right-[31%]" />
              <MiniTree className="bottom-[39%] right-[25%]" />
            </>
          )}

          {/* شجرة الإنجاز */}

          {points >= 50 && (
            <LandmarkButton
              className="bottom-[18%] left-[5%] z-30"
              title="شجرة الإنجاز"
              icon="🌳"
              description="تكبر شجرة الإنجاز كلما واصلت التعلم."
              onOpen={
                setSelectedLandmark
              }
            >
              <AchievementTree />
            </LandmarkButton>
          )}

          {/* حديقة الألعاب */}

          {points >= 350 && (
            <LandmarkButton
              className="bottom-[18%] left-[18%] z-30"
              title="حديقة الألعاب"
              icon="🛝"
              description="منطقة المرح التي فتحتها باستمرارك في الإنجاز."
              onOpen={
                setSelectedLandmark
              }
            >
              <Playground />
            </LandmarkButton>
          )}

          {/* حديقة البطل */}

          {points >= 150 && (
            <LandmarkButton
              className="bottom-[15%] right-[5%] z-30"
              title="حديقة البطل"
              icon="🌷"
              description="مساحة جميلة فتحتها نقاطك داخل المدينة."
              onOpen={
                setSelectedLandmark
              }
            >
              <HeroGarden />
            </LandmarkButton>
          )}

          {/* الإنارة */}

          {points >= 250 && (
            <>
              <StreetLamp className="bottom-[19%] left-[38%]" />

              <StreetLamp className="bottom-[19%] right-[38%]" />

              <StreetLamp className="bottom-[7%] left-[31%]" />

              <StreetLamp className="bottom-[7%] right-[31%]" />
            </>
          )}

          {/* النافورة */}

          {points >= 900 && (
            <LandmarkButton
              className="bottom-[10%] left-1/2 z-40 -translate-x-1/2"
              title="نافورة المدينة"
              icon="⛲"
              description="قلب المدينة ومكان الاحتفال بإنجازاتك."
              onOpen={
                setSelectedLandmark
              }
            >
              <Fountain />
            </LandmarkButton>
          )}

          {/* الملعب */}

          {points >= 1200 && (
            <LandmarkButton
              className="bottom-[60%] left-[3%] z-20 scale-[.86]"
              title="ملعب الأبطال"
              icon="🏟️"
              description="ملعب خاص بأبطال أكاديمية لغتي."
              onOpen={
                setSelectedLandmark
              }
            >
              <Stadium />
            </LandmarkButton>
          )}

          {/* المتجر */}

          {points >= 1500 && (
            <LandmarkButton
              className="bottom-[60%] right-[3%] z-20 scale-[.86]"
              title="متجر المدينة"
              icon="🏪"
              description="منطقة مستقبلية للمكافآت والتخصيص."
              onOpen={
                setSelectedLandmark
              }
            >
              <CityShop />
            </LandmarkButton>
          )}

          {/* السيارة */}

          {points >= 1800 && (
            <div className="absolute bottom-[5%] left-[22%] z-50">
              <CityCar
                style={
                  carStyle
                }
              />
            </div>
          )}

          {/* القصر */}

          {points >= 2200 && (
            <LandmarkButton
              className="bottom-[62%] left-1/2 z-20 -translate-x-1/2 scale-[.85]"
              title="قصر الإنجاز"
              icon="🏰"
              description="قصر لا يظهر إلا لمن واصل رحلة الإنجاز طويلًا."
              onOpen={
                setSelectedLandmark
              }
            >
              <AchievementCastle />
            </LandmarkButton>
          )}

          {/* الأبراج */}

          {points >= 2700 && (
            <>
              <CityTower
                className="bottom-[49%] left-[33%]"
                height={105}
              />

              <CityTower
                className="bottom-[50%] right-[32%]"
                height={125}
              />

              <CityTower
                className="bottom-[61%] left-[20%]"
                height={85}
              />

              <CityTower
                className="bottom-[61%] right-[19%]"
                height={95}
              />
            </>
          )}

          {/* المرحلة العليا */}

          {points >= 3500 && (
            <>
              <div className="absolute left-1/2 top-[14%] z-50 -translate-x-1/2 rounded-full border-2 border-amber-300 bg-white/95 px-6 py-3 text-lg font-black text-amber-700 shadow-2xl">
                👑 مدينة البطل الكبرى
              </div>

              <FloatingSpark className="left-[19%] top-[22%]" />
              <FloatingSpark className="right-[18%] top-[22%]" />
              <FloatingSpark className="left-[45%] top-[17%]" />
            </>
          )}

          {/* الحالة */}

          <div className="absolute bottom-4 right-4 z-[80] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[10px] font-bold text-slate-500 sm:text-xs">
              مدينتي الآن
            </p>

            <strong className="text-xs text-emerald-800 sm:text-lg">
              {currentStage.icon}{" "}
              {currentStage.name}
            </strong>
          </div>

          {nextStage && (
            <div className="absolute bottom-4 left-4 z-[80] rounded-2xl bg-slate-900/85 px-4 py-3 text-white shadow-xl backdrop-blur">
              <p className="text-[10px] text-slate-300 sm:text-xs">
                🔒 البناء القادم
              </p>

              <strong className="text-xs sm:text-base">
                {nextStage.icon}{" "}
                {nextStage.name}
              </strong>

              <p className="mt-1 text-[9px] text-slate-300 sm:text-xs">
                عند {nextStage.points} نقطة
              </p>
            </div>
          )}
        </section>

        {/* مرآب السيارة */}

        {points >= 1800 && (
          <section className="mt-5 rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-sky-700">
                  🚗 مرآب البطل
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-800">
                  اختر شكل سيارتك
                </h2>
              </div>

              <div className="flex gap-2">
                <CarChoice
                  selected={
                    carStyle === "blue"
                  }
                  onClick={() =>
                    setCarStyle(
                      "blue"
                    )
                  }
                >
                  🔵
                </CarChoice>

                <CarChoice
                  selected={
                    carStyle === "green"
                  }
                  onClick={() =>
                    setCarStyle(
                      "green"
                    )
                  }
                >
                  🟢
                </CarChoice>

                <CarChoice
                  selected={
                    carStyle === "gold"
                  }
                  onClick={() =>
                    setCarStyle(
                      "gold"
                    )
                  }
                >
                  🟡
                </CarChoice>
              </div>
            </div>
          </section>
        )}

        {/* إنجاز الوحدة */}

        {unitOneCompleted && (
          <section className="mt-5 rounded-[30px] border-2 border-amber-300 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-100 text-4xl">
                🏅
              </div>

              <div>
                <p className="text-sm font-black text-amber-700">
                  إنجاز دراسي ظهر في مدينتك
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-800">
                  فتحت بوابة «أقاربي»
                </h2>

                <p className="mt-1 leading-7 text-slate-600">
                  لأنك أكملت الوحدة
                  الأولى، أصبح لها أثر
                  دائم داخل مدينة الإنجاز.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* آخر بناء والقادم */}

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-black text-emerald-700">
              ✅ آخر ما بنيته
            </p>

            <div className="mt-3 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl shadow-sm">
                {currentStage.icon}
              </div>

              <div>
                <h3 className="font-black text-slate-800">
                  {currentStage.name}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {
                    currentStage.description
                  }
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-black text-amber-700">
              🎯 البناء القادم
            </p>

            {nextStage ? (
              <div className="mt-3 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl shadow-sm">
                  {nextStage.icon}
                </div>

                <div>
                  <h3 className="font-black text-slate-800">
                    {nextStage.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    بقي{" "}
                    <strong className="text-amber-700">
                      {
                        remainingPoints
                      }
                    </strong>{" "}
                    نقطة.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 font-black text-amber-800">
                👑 أكملت جميع مراحل
                المدينة!
              </p>
            )}
          </article>
        </section>

        {/* فارس */}

        <section className="mt-5 rounded-[28px] border border-violet-200 bg-gradient-to-l from-violet-50 to-white p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-4xl">
              🦸
            </div>

            <div>
              <p className="text-sm font-black text-violet-700">
                فارس يقول
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-800">
                مدينتك تكبر معك 🌟
              </h2>

              <p className="mt-1 leading-7 text-slate-600">
                واصل القراءة والواجبات
                والاختبارات، وستكتشف
                أماكن جديدة ومفاجآت أخرى
                داخل المدينة.
              </p>
            </div>
          </div>
        </section>

        {/* خريطة المراحل */}

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowStages(
                (current) =>
                  !current
              )
            }
            className="flex w-full items-center justify-between gap-3 text-right"
          >
            <div>
              <h2 className="text-xl font-black text-slate-800">
                🗺️ خريطة بناء مدينتي
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                شاهد كل ما فتحته وما
                ينتظرك لاحقًا.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 font-black text-emerald-700">
              {showStages
                ? "إخفاء ↑"
                : "عرض ↓"}
            </span>
          </button>

          {showStages && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cityStages.map(
                (stage) => {
                  const unlocked =
                    points >=
                    stage.points;

                  const isCurrent =
                    stage.name ===
                    currentStage.name;

                  const isNext =
                    nextStage?.name ===
                    stage.name;

                  return (
                    <article
                      key={stage.name}
                      className={`rounded-2xl border p-4 ${
                        isCurrent
                          ? "border-amber-400 bg-amber-50"
                          : isNext
                            ? "border-sky-300 bg-sky-50"
                            : unlocked
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                          {unlocked ||
                          isNext
                            ? stage.icon
                            : "🔒"}
                        </div>

                        <div>
                          <h3 className="font-black text-slate-800">
                            {
                              stage.name
                            }
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {stage.points ===
                            0
                              ? "مرحلة البداية"
                              : `${stage.points} نقطة`}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer className="mt-7 text-center text-sm leading-7 text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>

          <br />

          كل إنجاز يبني شيئًا جديدًا
          في مدينتك 🏙️✨
        </footer>
      </div>

      {selectedLandmark && (
        <LandmarkModal
          item={selectedLandmark}
          onClose={() =>
            setSelectedLandmark(
              null
            )
          }
        />
      )}
    </main>
  );
}

/* ============================ */
/* المكونات */
/* ============================ */

function CityLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 px-4 py-6"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-xl">
          <div className="text-6xl">
            🏙️
          </div>

          <p className="mt-3 font-black text-emerald-700">
            جارٍ تجهيز مدينة الإنجاز...
          </p>
        </div>
      </div>
    </main>
  );
}

function CityStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-3xl">
        {icon}
      </div>

      <p className="mt-2 text-xs font-bold text-slate-500 sm:text-sm">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-800 sm:text-base">
        {value}
      </p>
    </article>
  );
}

function LandmarkButton({
  className,
  title,
  icon,
  description,
  onOpen,
  children,
}: {
  className: string;
  title: string;
  icon: string;
  description: string;
  onOpen: (
    item: LandmarkInfo
  ) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onOpen({
          title,
          icon,
          description,
        })
      }
      className={`absolute border-0 bg-transparent p-0 transition duration-300 hover:-translate-y-2 hover:scale-105 ${className}`}
      style={{
        transformStyle:
          "preserve-3d",
      }}
    >
      {children}

      <div className="mx-auto mt-1 w-fit whitespace-nowrap rounded-full border border-white/90 bg-white/95 px-3 py-1 text-[9px] font-black text-slate-700 shadow-lg sm:text-xs">
        {icon} {title}
      </div>
    </button>
  );
}

function LandmarkModal({
  item,
  onClose,
}: {
  item: LandmarkInfo;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[999] grid place-items-center bg-slate-950/40 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[30px] border border-white bg-white p-6 text-center shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="text-6xl">
          {item.icon}
        </div>

        <h2 className="mt-3 text-2xl font-black text-emerald-800">
          {item.title}
        </h2>

        <p className="mt-3 leading-8 text-slate-600">
          {item.description}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white"
        >
          جميل، تابع المدينة ✨
        </button>
      </div>
    </div>
  );
}

function Sun() {
  return (
    <div
      className="city-motion absolute right-[7%] top-[7%] z-[3] h-20 w-20 rounded-full bg-amber-300 shadow-[0_0_55px_rgba(251,191,36,.65)]"
      style={{
        animation:
          "citySunGlow 5s ease-in-out infinite",
      }}
    >
      <div className="absolute inset-3 rounded-full bg-amber-400" />
    </div>
  );
}

function Cloud({
  className,
  animation,
}: {
  className: string;
  animation: string;
}) {
  return (
    <div
      className={`city-motion absolute z-[3] h-12 w-24 opacity-90 ${className}`}
      style={{
        animation,
      }}
    >
      <div className="absolute bottom-0 left-0 h-8 w-24 rounded-full bg-white/90" />

      <div className="absolute bottom-2 left-4 h-10 w-10 rounded-full bg-white" />

      <div className="absolute bottom-3 left-10 h-12 w-12 rounded-full bg-white" />
    </div>
  );
}

function MountainLayer({
  className,
  color,
}: {
  className: string;
  color: string;
}) {
  return (
    <div
      className={`absolute z-[1] h-[27%] ${className}`}
      style={{
        background: color,
        clipPath:
          "polygon(0 100%,16% 55%,31% 77%,49% 12%,66% 72%,82% 42%,100% 100%)",
      }}
    />
  );
}

function ParkPatch({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`absolute z-[5] h-[155px] w-[29%] rounded-[46px] border-4 border-emerald-500/20 bg-gradient-to-b from-emerald-100/80 to-emerald-200/80 shadow-inner ${className}`}
      style={{
        transform:
          "rotateX(45deg)",
      }}
    />
  );
}

function CityRoad() {
  return (
    <div
      className="absolute bottom-[-20px] left-1/2 z-[8] h-[400px] -translate-x-1/2 bg-slate-600 shadow-2xl"
      style={{
        width: "165px",
        clipPath:
          "polygon(42% 0%,58% 0%,100% 100%,0% 100%)",
      }}
    >
      <div className="absolute left-1/2 top-5 h-[92%] -translate-x-1/2 border-l-[3px] border-dashed border-white/80" />
    </div>
  );
}

function Sidewalk({
  side,
}: {
  side: "left" | "right";
}) {
  const isLeft =
    side === "left";

  return (
    <div
      className={`absolute bottom-[-18px] z-[7] h-[390px] ${
        isLeft
          ? "left-[calc(50%-104px)]"
          : "right-[calc(50%-104px)]"
      }`}
      style={{
        width: "38px",
        clipPath: isLeft
          ? "polygon(58% 0%,100% 0%,100% 100%,0% 100%)"
          : "polygon(0% 0%,42% 0%,100% 100%,0% 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-stone-200 to-stone-300 shadow-lg" />

      <div
        className={`absolute top-0 h-full w-[5px] bg-stone-400/70 ${
          isLeft
            ? "right-0"
            : "left-0"
        }`}
      />

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 30px, rgba(120,113,108,.45) 31px 33px)",
        }}
      />
    </div>
  );
}

function HeroHouse3D() {
  return (
    <div
      style={{
        transform:
          "rotateX(-4deg) rotateY(-6deg)",
        filter:
          "drop-shadow(0 18px 12px rgba(0,0,0,.2))",
      }}
    >
      <svg
        width="145"
        height="120"
        viewBox="0 0 150 125"
      >
        <rect
          x="28"
          y="46"
          width="94"
          height="67"
          rx="5"
          fill="#f3c58c"
        />

        <polygon
          points="18,53 75,10 132,53"
          fill="#c95d3c"
        />

        <polygon
          points="27,53 75,18 123,53"
          fill="#e9784e"
        />

        <rect
          x="62"
          y="71"
          width="28"
          height="42"
          rx="5"
          fill="#81543e"
        />

        <rect
          x="98"
          y="67"
          width="18"
          height="20"
          rx="3"
          fill="#6ec5e9"
        />

        <rect
          x="33"
          y="65"
          width="18"
          height="19"
          rx="3"
          fill="#6ec5e9"
        />

        <rect
          x="106"
          y="26"
          width="10"
          height="25"
          fill="#9c5b3d"
        />
      </svg>
    </div>
  );
}

function AchievementTree() {
  return (
    <div
      className="city-motion"
      style={{
        transformOrigin:
          "center bottom",
        animation:
          "cityTreeSway 5.5s ease-in-out infinite",
      }}
    >
      <svg
        width="105"
        height="125"
        viewBox="0 0 110 130"
        className="drop-shadow-xl"
      >
        <rect
          x="49"
          y="78"
          width="13"
          height="45"
          rx="4"
          fill="#79513a"
        />

        <circle
          cx="55"
          cy="50"
          r="38"
          fill="#4fa94d"
        />

        <circle
          cx="34"
          cy="56"
          r="24"
          fill="#5fbc58"
        />

        <circle
          cx="76"
          cy="57"
          r="25"
          fill="#62bb57"
        />

        <circle
          cx="55"
          cy="31"
          r="24"
          fill="#79c867"
        />
      </svg>
    </div>
  );
}

function HeroGarden() {
  return (
    <div className="relative h-[110px] w-[185px] rounded-[50%] border-4 border-emerald-600/30 bg-emerald-200 shadow-xl">
      <div
        className="city-motion absolute bottom-5 left-5 text-4xl"
        style={{
          animation:
            "cityFlowerFloat 3.8s ease-in-out infinite",
        }}
      >
        🌷
      </div>

      <div
        className="city-motion absolute bottom-7 left-20 text-3xl"
        style={{
          animation:
            "cityFlowerFloat 4.4s ease-in-out infinite",
        }}
      >
        🌼
      </div>

      <div
        className="city-motion absolute bottom-5 right-8 text-4xl"
        style={{
          animation:
            "cityFlowerFloat 4s ease-in-out infinite",
        }}
      >
        🌹
      </div>

      <div
        className="city-motion absolute bottom-8 right-20 text-3xl"
        style={{
          animation:
            "cityFlowerFloat 4.7s ease-in-out infinite",
        }}
      >
        🌸
      </div>
    </div>
  );
}

function StreetLamp({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`absolute z-30 h-24 w-8 ${className}`}
    >
      <div className="absolute left-1/2 top-3 h-20 w-2 -translate-x-1/2 rounded-full bg-slate-700" />

      <div
        className="city-motion absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 rounded-md border-4 border-slate-700 bg-amber-200 shadow-[0_0_18px_rgba(251,191,36,.85)]"
        style={{
          animation:
            "cityLampGlow 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function MiniTree({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`city-motion absolute z-[12] h-16 w-12 ${className}`}
      style={{
        transformOrigin:
          "center bottom",
        animation:
          "cityTreeSway 6s ease-in-out infinite",
      }}
    >
      <div className="absolute bottom-0 left-1/2 h-7 w-2 -translate-x-1/2 rounded bg-amber-800" />

      <div className="absolute bottom-5 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-emerald-600 shadow-sm" />

      <div className="absolute bottom-9 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />
    </div>
  );
}

function Playground() {
  return (
    <div className="relative h-[110px] w-[150px] drop-shadow-xl">
      <div className="absolute bottom-0 left-0 h-5 w-full rounded-full bg-amber-200" />

      <div className="absolute bottom-5 left-5 h-20 w-4 rounded bg-sky-700" />

      <div className="absolute bottom-5 left-20 h-20 w-4 rounded bg-sky-700" />

      <div className="absolute bottom-[84px] left-5 h-4 w-20 rounded bg-sky-700" />

      <div className="absolute bottom-5 right-2 h-16 w-16 rotate-[-24deg] rounded-lg bg-rose-400" />
    </div>
  );
}

function MazeGate() {
  return (
    <div
      className="city-motion relative h-[125px] w-[120px]"
      style={{
        animation:
          "cityGateGlow 3.4s ease-in-out infinite",
      }}
    >
      <div className="absolute bottom-0 left-3 h-[100px] w-6 rounded-t-lg bg-violet-700" />

      <div className="absolute bottom-0 right-3 h-[100px] w-6 rounded-t-lg bg-violet-700" />

      <div className="absolute left-3 right-3 top-2 h-6 rounded-full bg-violet-500 shadow-lg" />

      <div className="absolute left-1/2 top-9 -translate-x-1/2 text-5xl">
        🌀
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-3 rounded-full bg-violet-900/30" />
    </div>
  );
}

function UnitGate() {
  return (
    <div
      className="city-motion relative h-[130px] w-[140px]"
      style={{
        animation:
          "cityUnitGateGlow 4s ease-in-out infinite",
      }}
    >
      <div className="absolute bottom-0 left-3 h-[108px] w-7 rounded-t-lg bg-amber-500" />

      <div className="absolute bottom-0 right-3 h-[108px] w-7 rounded-t-lg bg-amber-500" />

      <div className="absolute left-3 right-3 top-3 h-8 rounded-full bg-amber-400 shadow-lg" />

      <div className="absolute left-1/2 top-11 -translate-x-1/2 text-5xl">
        🏅
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-3 rounded-full bg-amber-700/30" />
    </div>
  );
}

function LibraryBuilding() {
  return (
    <svg
      width="175"
      height="140"
      viewBox="0 0 190 145"
      className="drop-shadow-2xl"
    >
      <rect
        x="20"
        y="47"
        width="150"
        height="82"
        rx="5"
        fill="#d9c8a4"
      />

      <polygon
        points="12,50 95,14 178,50"
        fill="#3c6b59"
      />

      <rect
        x="35"
        y="62"
        width="120"
        height="20"
        rx="4"
        fill="#168c65"
      />

      <text
        x="95"
        y="77"
        textAnchor="middle"
        fill="white"
        fontSize="15"
        fontWeight="700"
      >
        مكتبة لغتي
      </text>

      <rect
        x="82"
        y="88"
        width="27"
        height="41"
        rx="3"
        fill="#72513d"
      />

      <rect
        x="38"
        y="88"
        width="22"
        height="25"
        rx="3"
        fill="#72b7d5"
      />

      <rect
        x="132"
        y="88"
        width="22"
        height="25"
        rx="3"
        fill="#72b7d5"
      />
    </svg>
  );
}

function AcademyBuilding() {
  return (
    <svg
      width="190"
      height="150"
      viewBox="0 0 205 155"
      className="drop-shadow-2xl"
    >
      <rect
        x="20"
        y="52"
        width="165"
        height="87"
        rx="5"
        fill="#d9ad78"
      />

      <polygon
        points="11,53 102,18 194,53"
        fill="#8b5338"
      />

      <rect
        x="78"
        y="78"
        width="49"
        height="22"
        rx="4"
        fill="#176c88"
      />

      <text
        x="102"
        y="94"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="700"
      >
        أكاديمية لغتي
      </text>

      <rect
        x="90"
        y="106"
        width="26"
        height="33"
        rx="3"
        fill="#6d4935"
      />

      <rect
        x="38"
        y="79"
        width="24"
        height="26"
        fill="#73b9d7"
      />

      <rect
        x="143"
        y="79"
        width="24"
        height="26"
        fill="#73b9d7"
      />
    </svg>
  );
}

function Fountain() {
  return (
    <div className="relative h-[115px] w-[150px]">
      <div className="absolute bottom-0 left-1/2 h-11 w-28 -translate-x-1/2 rounded-[50%] border-4 border-sky-300 bg-sky-100 shadow-xl" />

      <div className="absolute bottom-8 left-1/2 h-12 w-5 -translate-x-1/2 rounded bg-stone-300" />

      <div className="absolute bottom-[60px] left-1/2 h-8 w-16 -translate-x-1/2 rounded-[50%] bg-stone-200" />

      <div
        className="city-motion absolute bottom-[70px] left-1/2 h-12 w-3 -translate-x-1/2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,.8)]"
        style={{
          transformOrigin:
            "center bottom",
          animation:
            "cityWaterRise 1.8s ease-in-out infinite",
        }}
      />

      <div
        className="city-motion absolute bottom-[62px] left-[42%] h-7 w-2 rotate-[-24deg] rounded-full bg-sky-300/80"
        style={{
          animation:
            "cityWaterRise 2.1s ease-in-out infinite",
        }}
      />

      <div
        className="city-motion absolute bottom-[62px] right-[42%] h-7 w-2 rotate-[24deg] rounded-full bg-sky-300/80"
        style={{
          animation:
            "cityWaterRise 2.3s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function Stadium() {
  return (
    <div className="relative h-[105px] w-[165px]">
      <div className="absolute bottom-0 h-20 w-full rounded-[50%] border-[12px] border-slate-400 bg-emerald-500 shadow-xl" />

      <div className="absolute bottom-5 left-1/2 h-10 w-24 -translate-x-1/2 border-2 border-white" />
    </div>
  );
}

function CityShop() {
  return (
    <div className="relative h-[120px] w-[150px] drop-shadow-xl">
      <div className="absolute bottom-0 h-24 w-full rounded-lg bg-amber-100" />

      <div className="absolute bottom-[88px] h-8 w-full rounded-t-xl bg-rose-500" />

      <div className="absolute bottom-0 left-1/2 h-14 w-8 -translate-x-1/2 rounded-t bg-slate-600" />

      <div className="absolute bottom-4 left-5 h-12 w-28 rounded border-4 border-sky-300 bg-sky-100" />
    </div>
  );
}

function CityCar({
  style,
}: {
  style:
    | "blue"
    | "green"
    | "gold";
}) {
  const bodyColor =
    style === "green"
      ? "bg-emerald-600"
      : style === "gold"
        ? "bg-amber-500"
        : "bg-sky-600";

  return (
    <div className="relative h-16 w-28 animate-[bounce_2.6s_ease-in-out_infinite] drop-shadow-xl">
      <div
        className={`absolute bottom-3 h-10 w-28 rounded-xl shadow-xl ${bodyColor}`}
      />

      <div className="absolute bottom-10 left-6 h-7 w-14 rounded-t-xl bg-sky-200" />

      <div className="absolute bottom-0 left-4 h-7 w-7 rounded-full border-4 border-slate-700 bg-slate-300" />

      <div className="absolute bottom-0 right-4 h-7 w-7 rounded-full border-4 border-slate-700 bg-slate-300" />
    </div>
  );
}

function CarChoice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-12 w-12 place-items-center rounded-2xl border-2 text-xl ${
        selected
          ? "border-emerald-500 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function AchievementCastle() {
  return (
    <svg
      width="200"
      height="155"
      viewBox="0 0 215 165"
      className="drop-shadow-2xl"
    >
      <rect
        x="47"
        y="60"
        width="122"
        height="92"
        fill="#e2c38f"
      />

      <rect
        x="15"
        y="42"
        width="50"
        height="110"
        fill="#d2ae77"
      />

      <rect
        x="150"
        y="42"
        width="50"
        height="110"
        fill="#d2ae77"
      />

      <polygon
        points="15,42 40,12 65,42"
        fill="#b45647"
      />

      <polygon
        points="150,42 175,12 200,42"
        fill="#b45647"
      />

      <polygon
        points="47,60 108,25 169,60"
        fill="#c86450"
      />

      <rect
        x="94"
        y="101"
        width="29"
        height="51"
        rx="14"
        fill="#78533e"
      />
    </svg>
  );
}

function CityTower({
  className,
  height,
}: {
  className: string;
  height: number;
}) {
  return (
    <div
      className={`absolute z-[15] w-[62px] rounded-t-lg border border-slate-400 bg-gradient-to-b from-sky-200 to-slate-300 shadow-2xl ${className}`}
      style={{
        height,
      }}
    >
      <div className="grid grid-cols-3 gap-1 p-2">
        {Array.from({
          length: 12,
        }).map(
          (_, index) => (
            <span
              key={index}
              className="h-3 rounded-sm bg-sky-500/70"
            />
          )
        )}
      </div>
    </div>
  );
}

function FloatingSpark({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`city-motion absolute z-40 text-4xl ${className}`}
      style={{
        animation:
          "citySparkFloat 2.8s ease-in-out infinite",
      }}
    >
      ✨
    </div>
  );
}