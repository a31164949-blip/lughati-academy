"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import City3D from "./City3D";

type CityStage = {
  points: number;
  name: string;
  icon: string;
  description: string;
};

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
    description: "بدأت الحياة تظهر في مدينتك.",
  },
  {
    points: 100,
    name: "طريق النجاح",
    icon: "🛣️",
    description: "طريق جديد يربط أجزاء مدينتك.",
  },
  {
    points: 150,
    name: "حديقة البطل",
    icon: "🌷",
    description: "أصبحت مدينتك أكثر جمالًا.",
  },
  {
    points: 250,
    name: "إنارة المدينة",
    icon: "💡",
    description: "بدأت شوارع مدينتك تضيء.",
  },
  {
    points: 350,
    name: "حديقة الألعاب",
    icon: "🛝",
    description: "افتتحت منطقة جديدة للمرح.",
  },
  {
    points: 500,
    name: "مكتبة لغتي",
    icon: "📚",
    description: "القراءة بنت مكتبة في مدينتك.",
  },
  {
    points: 700,
    name: "أكاديمية لغتي",
    icon: "🏫",
    description: "أصبح للعلم مبنى كبير في مدينتك.",
  },
  {
    points: 900,
    name: "نافورة المدينة",
    icon: "⛲",
    description: "ازدانت المدينة بنافورة جميلة.",
  },
  {
    points: 1200,
    name: "ملعب الأبطال",
    icon: "🏟️",
    description: "افتتح ملعب أبطال الأكاديمية.",
  },
  {
    points: 1500,
    name: "متجر المدينة",
    icon: "🏪",
    description: "أصبحت مدينتك أكثر نشاطًا.",
  },
  {
    points: 1800,
    name: "سيارتي",
    icon: "🚗",
    description: "أصبحت تستطيع التجول في مدينتك.",
  },
  {
    points: 2200,
    name: "قصر الإنجاز",
    icon: "🏰",
    description: "قصر كبير يرمز إلى استمرارك.",
  },
  {
    points: 2700,
    name: "وسط المدينة",
    icon: "🌆",
    description: "تحولت مدينتك إلى مدينة متكاملة.",
  },
  {
    points: 3500,
    name: "مدينة البطل الكبرى",
    icon: "👑",
    description: "بلغت أعلى مراحل مدينة الإنجاز.",
  },
];

export default function AchievementCityPage() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showStages, setShowStages] = useState(false);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);
  useEffect(() => {
    async function loadStudentPoints() {
      try {
        setLoading(true);

        const studentId =
          window.localStorage.getItem("student-id");

        if (!studentId || studentId === "student-demo") {
          setPoints(0);
          return;
        }

        const studentSnapshot = await getDoc(
          doc(db, "students", studentId)
        );

        if (!studentSnapshot.exists()) {
          setPoints(0);
          return;
        }

        const data = studentSnapshot.data();

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

  const unlockedStages = useMemo(
    () =>
      cityStages.filter(
        (stage) => points >= stage.points
      ),
    [points]
  );

  const currentStage =
    unlockedStages[
      unlockedStages.length - 1
    ] ?? cityStages[0];

  const nextStage =
    cityStages.find(
      (stage) => points < stage.points
    ) ?? null;

  const currentIndex =
    cityStages.findIndex(
      (stage) =>
        stage.name === currentStage.name
    );

  const level =
    Math.max(1, currentIndex + 1);

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
    nextThreshold > previousThreshold
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((points - previousThreshold) /
                (nextThreshold -
                  previousThreshold)) *
                100
            )
          )
        )
      : 100;
if (!mounted) {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 px-4 py-6"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-lg">
          <div className="text-5xl">
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
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 px-3 py-5 sm:px-5"
    >
      <div className="mx-auto max-w-7xl">

        {/* الترويسة */}

        <header className="mb-5 rounded-[30px] bg-gradient-to-l from-emerald-800 to-emerald-600 p-5 text-white shadow-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="font-bold text-emerald-100">
                أكاديمية لغتي الرقمية
              </p>

              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                🏙️ مدينة الإنجاز
              </h1>

              <p className="mt-2 text-emerald-50">
                ابنِ مدينتك بإنجازاتك… وشاهدها تكبر أمامك
              </p>
            </div>

            <a
              href="/journey"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm"
            >
              ← العودة إلى رحلتي
            </a>
          </div>
        </header>

        {/* الإحصاءات */}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            label="مستوى المدينة"
            value={`المستوى ${level}`}
          />

          <CityStat
            icon={currentStage.icon}
            label="آخر بناء"
            value={currentStage.name}
          />

          <CityStat
            icon={nextStage?.icon ?? "👑"}
            label="البناء القادم"
            value={
              nextStage
                ? nextStage.name
                : "اكتملت المدينة"
            }
          />
        </section>

        {/* التقدم */}

        <section className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-emerald-700">
                🚀 تقدم مدينتي
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-800 sm:text-xl">
                {nextStage
                  ? `${remainingPoints} نقطة فقط حتى يتم بناء ${nextStage.name}`
                  : "👑 أحسنت! اكتملت مدينة البطل الكبرى"}
              </h2>
            </div>

            <strong className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">
              {progress}%
            </strong>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-amber-400 transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* المدينة */}
        


  <section className="relative min-h-[650px] overflow-hidden rounded-[38px] border-4 border-white bg-sky-200 shadow-2xl">

          {/* السماء */}

          <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />

          {/* الشمس */}

          <div className="absolute right-[5%] top-[6%] h-20 w-20 rounded-full bg-amber-300 shadow-[0_0_45px_rgba(251,191,36,0.55)]">
            <div className="absolute inset-3 rounded-full bg-amber-400" />
          </div>

          {/* السحب */}

          <Cloud className="left-[8%] top-[10%]" />
          <Cloud className="left-[38%] top-[5%] scale-75" />
          <Cloud className="right-[26%] top-[16%] scale-90" />

          {/* الجبال */}

          <div
            className="absolute bottom-[42%] left-0 h-[26%] w-[45%] bg-emerald-500/30"
            style={{
              clipPath:
                "polygon(0 100%, 18% 46%, 32% 72%, 50% 15%, 69% 70%, 82% 43%, 100% 100%)",
            }}
          />

          <div
            className="absolute bottom-[42%] right-0 h-[24%] w-[48%] bg-emerald-600/25"
            style={{
              clipPath:
                "polygon(0 100%, 18% 62%, 34% 22%, 51% 72%, 67% 35%, 82% 67%, 100% 100%)",
            }}
          />

          {/* أرض المدينة */}

          <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-emerald-300 to-emerald-500" />
{/* ساحة المدينة المركزية */}

<div
  className="absolute bottom-[12%] left-1/2 z-[1] -translate-x-1/2 rounded-[50%] border-4 border-stone-300 bg-stone-100/95 shadow-inner"
  style={{
    width: "320px",
    height: "150px",
  }}
/>

{/* رصيف رئيسي حول الطريق */}

{points >= 100 && (
  <>
    <div
      className="absolute bottom-0 left-[calc(50%-120px)] z-[1] bg-stone-200"
      style={{
        width: "34px",
        height: "300px",
        transform: "skewX(-8deg)",
      }}
    />

    <div
      className="absolute bottom-0 right-[calc(50%-120px)] z-[1] bg-stone-200"
      style={{
        width: "34px",
        height: "300px",
        transform: "skewX(8deg)",
      }}
    />
  </>
)}

{/* مناطق خضراء منظمة */}

<div className="absolute bottom-[12%] left-[4%] z-[1] h-[150px] w-[28%] rounded-[40px] border-4 border-emerald-400/40 bg-emerald-200/60" />

<div className="absolute bottom-[12%] right-[4%] z-[1] h-[150px] w-[28%] rounded-[40px] border-4 border-emerald-400/40 bg-emerald-200/60" />

{/* أشجار خلفية صغيرة */}

{points >= 150 && (
  <>
    <MiniTree className="bottom-[34%] left-[32%]" />
    <MiniTree className="bottom-[36%] left-[27%]" />
    <MiniTree className="bottom-[34%] right-[32%]" />
    <MiniTree className="bottom-[36%] right-[27%]" />
  </>
)}
          {/* طريق النجاح */}

          {points >= 100 && (
            <div
              className="absolute bottom-0 left-1/2 z-[2] h-[330px] -translate-x-1/2 bg-slate-600 shadow-inner"
              style={{
                width: "180px",
                clipPath:
                  "polygon(39% 0%, 61% 0%, 100% 100%, 0% 100%)",
              }}
            >
              <div className="absolute left-1/2 top-3 h-[95%] -translate-x-1/2 border-l-4 border-dashed border-white/80" />
            </div>
          )}

          {/* طرق جانبية */}

          {points >= 700 && (
            <>
              <div className="absolute bottom-[17%] left-[8%] z-[1] h-14 w-[43%] rotate-6 rounded-full bg-slate-500" />
              <div className="absolute bottom-[17%] right-[8%] z-[1] h-14 w-[43%] -rotate-6 rounded-full bg-slate-500" />
            </>
          )}

          {/* منزل البطل */}

          <div className="absolute bottom-[32%] left-1/2 z-20 -translate-x-1/2">
            <HeroHouse />

            <CityLabel>
              منزل البطل
            </CityLabel>
          </div>

          {/* شجرة الإنجاز */}

          {points >= 50 && (
            <div className="absolute bottom-[21%] left-[8%] z-10">
              <AchievementTree />

              <CityLabel>
                شجرة الإنجاز
              </CityLabel>
            </div>
          )}

          {/* حديقة البطل */}

          {points >= 150 && (
            <div className="absolute bottom-[13%] right-[7%] z-10">
              <HeroGarden />

              <CityLabel>
                حديقة البطل
              </CityLabel>
            </div>
          )}

          {/* الإنارة */}

          {points >= 250 && (
            <>
              <StreetLamp className="bottom-[18%] left-[36%]" />
              <StreetLamp className="bottom-[18%] right-[36%]" />
              <StreetLamp className="bottom-[7%] left-[28%]" />
              <StreetLamp className="bottom-[7%] right-[28%]" />
            </>
          )}

          {/* حديقة الألعاب */}

          {points >= 350 && (
            <div className="absolute bottom-[17%] left-[19%] z-10">
              <Playground />

              <CityLabel>
                حديقة الألعاب
              </CityLabel>
            </div>
          )}

          {/* مكتبة لغتي */}

          {points >= 500 && (
            <div className="absolute bottom-[42%] left-[5%] z-10">
              <LibraryBuilding />

              <CityLabel>
                مكتبة لغتي
              </CityLabel>
            </div>
          )}

          {/* أكاديمية لغتي */}

          {points >= 700 && (
            <div className="absolute bottom-[43%] right-[5%] z-10">
              <AcademyBuilding />

              <CityLabel>
                أكاديمية لغتي
              </CityLabel>
            </div>
          )}

          {/* النافورة */}

          {points >= 900 && (
            <div className="absolute bottom-[7%] left-1/2 z-20 -translate-x-1/2">
              <Fountain />

              <CityLabel>
                نافورة المدينة
              </CityLabel>
            </div>
          )}

          {/* ملعب الأبطال */}

          {points >= 1200 && (
            <div className="absolute bottom-[54%] left-[3%] z-10">
              <Stadium />

              <CityLabel>
                ملعب الأبطال
              </CityLabel>
            </div>
          )}

          {/* متجر المدينة */}

          {points >= 1500 && (
            <div className="absolute bottom-[54%] right-[3%] z-10">
              <CityShop />

              <CityLabel>
                متجر المدينة
              </CityLabel>
            </div>
          )}

          {/* السيارة */}

          {points >= 1800 && (
            <div className="absolute bottom-[8%] left-[27%] z-30">
              <CityCar />
            </div>
          )}

          {/* قصر الإنجاز */}

          {points >= 2200 && (
            <div className="absolute bottom-[59%] left-1/2 z-10 -translate-x-1/2">
              <AchievementCastle />

              <CityLabel>
                قصر الإنجاز
              </CityLabel>
            </div>
          )}

          {/* وسط المدينة */}

          {points >= 2700 && (
            <>
              <CityTower
                className="bottom-[46%] left-[30%]"
                height={105}
              />

              <CityTower
                className="bottom-[47%] right-[29%]"
                height={125}
              />

              <CityTower
                className="bottom-[57%] left-[22%]"
                height={90}
              />

              <CityTower
                className="bottom-[57%] right-[21%]"
                height={100}
              />
            </>
          )}

          {/* المرحلة الكبرى */}

          {points >= 3500 && (
            <>
              <div className="absolute left-1/2 top-5 z-40 -translate-x-1/2 rounded-full border border-amber-300 bg-white/95 px-6 py-3 text-xl font-black text-amber-700 shadow-xl">
                👑 مدينة البطل الكبرى
              </div>

              <div className="absolute left-[23%] top-[20%] text-4xl">
                ✨
              </div>

              <div className="absolute right-[20%] top-[23%] text-4xl">
                🎉
              </div>

              <div className="absolute left-[44%] top-[14%] text-3xl">
                ⭐
              </div>
            </>
          )}

          {/* الحالة الحالية */}

          <div className="absolute bottom-5 right-5 z-50 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-xs font-bold text-slate-500">
              مدينتي الآن
            </p>

            <strong className="text-lg text-emerald-800">
              {currentStage.icon} {currentStage.name}
            </strong>
          </div>

          {/* القادم */}

          {nextStage && (
            <div className="absolute bottom-5 left-5 z-50 rounded-2xl bg-slate-900/85 px-4 py-3 text-white shadow-xl backdrop-blur">
              <p className="text-xs text-slate-200">
                🔒 البناء القادم
              </p>

              <strong>
                {nextStage.icon} {nextStage.name}
              </strong>

              <p className="mt-1 text-xs text-slate-200">
                عند {nextStage.points} نقطة
              </p>
            </div>
          )}
        </section>

        {/* أثر الإنجاز */}
      

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
                <h3 className="text-lg font-black text-slate-800">
                  {currentStage.name}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {currentStage.description}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-black text-amber-700">
              🎯 ما الذي سأبنيه بعد ذلك؟
            </p>

            {nextStage ? (
              <div className="mt-3 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl shadow-sm">
                  {nextStage.icon}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {nextStage.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    بقي{" "}
                    <strong className="text-amber-700">
                      {remainingPoints}
                    </strong>{" "}
                    نقطة فقط.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 font-black text-amber-800">
                👑 أكملت جميع مراحل المدينة!
              </p>
            )}
          </article>
        </section>

        {/* رسالة فارس */}

        <section className="mt-5 rounded-3xl border border-violet-200 bg-gradient-to-l from-violet-50 to-white p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-4xl">
              🧒🏻
            </div>

            <div>
              <p className="text-sm font-black text-violet-700">
                رسالة فارس
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-800">
                كل إنجاز يترك أثرًا حقيقيًا في مدينتك 🌟
              </h2>

              <p className="mt-1 text-slate-600">
                واصل القراءة والواجبات والاختبارات، وشاهد مدينتك تنمو أمامك.
              </p>
            </div>
          </div>
        </section>

        {/* خريطة المراحل */}

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowStages(
                (current) => !current
              )
            }
            className="flex w-full items-center justify-between gap-3 text-right"
          >
            <div>
              <h2 className="text-xl font-black text-slate-800">
                🗺️ خريطة بناء مدينتي
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                شاهد جميع المباني والمراحل القادمة
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
              {cityStages.map((stage) => {
                const unlocked =
                  points >= stage.points;

                const isCurrent =
                  stage.name ===
                  currentStage.name;

                const isNext =
                  nextStage?.name ===
                  stage.name;

                return (
                  <article
                    key={stage.name}
                    className={`rounded-2xl border p-3 ${
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
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl">
                        {unlocked || isNext
                          ? stage.icon
                          : "🔒"}
                      </div>

                      <div>
                        <h3 className="font-black text-slate-800">
                          {stage.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {stage.points === 0
                            ? "مرحلة البداية"
                            : `${stage.points} نقطة`}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-7 text-center text-sm leading-7 text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>

          <br />

          كل إنجاز يبني شيئًا جديدًا في مدينتك 🏙️✨
        </footer>
      </div>
    </main>
  );
}

/* ============================= */
/* مكونات المدينة */
/* ============================= */

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

      <p className="mt-2 text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-black text-slate-800">
        {value}
      </p>
    </article>
  );
}

function CityLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-1 w-fit whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-black text-slate-700 shadow-md">
      {children}
    </div>
  );
}

function Cloud({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`absolute h-12 w-24 ${className}`}
    >
      <div className="absolute bottom-0 left-0 h-8 w-24 rounded-full bg-white/90" />
      <div className="absolute bottom-2 left-4 h-10 w-10 rounded-full bg-white" />
      <div className="absolute bottom-3 left-10 h-12 w-12 rounded-full bg-white" />
    </div>
  );
}

function HeroHouse() {
  return (
    <svg
      width="150"
      height="125"
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
  );
}

function AchievementTree() {
  return (
    <svg
      width="110"
      height="130"
      viewBox="0 0 110 130"
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
  );
}

function HeroGarden() {
  return (
    <div className="relative h-[120px] w-[210px] rounded-[50%] border-4 border-emerald-600/30 bg-emerald-200 shadow-lg">
      <div className="absolute bottom-5 left-5 text-4xl">
        🌷
      </div>

      <div className="absolute bottom-7 left-20 text-3xl">
        🌼
      </div>

      <div className="absolute bottom-5 right-8 text-4xl">
        🌹
      </div>

      <div className="absolute bottom-8 right-20 text-3xl">
        🌸
      </div>

      <div className="absolute bottom-3 left-1/2 h-10 w-20 -translate-x-1/2 rounded-t-full border-x-8 border-t-8 border-emerald-700/30" />
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
      className={`absolute z-20 h-24 w-8 ${className}`}
    >
      <div className="absolute left-1/2 top-3 h-20 w-2 -translate-x-1/2 rounded-full bg-slate-700" />

      <div className="absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 rounded-md border-4 border-slate-700 bg-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.8)]" />
    </div>
  );
}

function Playground() {
  return (
    <div className="relative h-[120px] w-[170px]">
      <div className="absolute bottom-0 left-0 h-5 w-full rounded-full bg-amber-200/70" />

      <div className="absolute bottom-5 left-5 h-20 w-4 rounded bg-sky-700" />

      <div className="absolute bottom-5 left-20 h-20 w-4 rounded bg-sky-700" />

      <div className="absolute bottom-[84px] left-5 h-4 w-20 rounded bg-sky-700" />

      <div className="absolute bottom-6 left-10 h-14 w-2 bg-slate-600" />

      <div className="absolute bottom-6 left-[66px] h-14 w-2 bg-slate-600" />

      <div className="absolute bottom-5 right-4 h-16 w-16 rotate-[-24deg] rounded-lg bg-rose-400" />
    </div>
  );
}

function LibraryBuilding() {
  return (
    <svg
      width="190"
      height="145"
      viewBox="0 0 190 145"
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

      <rect
        x="10"
        y="129"
        width="170"
        height="8"
        rx="4"
        fill="#c4b08d"
      />
    </svg>
  );
}

function AcademyBuilding() {
  return (
    <svg
      width="205"
      height="155"
      viewBox="0 0 205 155"
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

      <rect
        x="97"
        y="6"
        width="9"
        height="25"
        fill="#6f4b34"
      />

      <polygon
        points="106,6 133,13 106,20"
        fill="#168c65"
      />
    </svg>
  );
}

function Fountain() {
  return (
    <div className="relative h-[115px] w-[150px]">
      <div className="absolute bottom-0 left-1/2 h-11 w-28 -translate-x-1/2 rounded-[50%] border-4 border-sky-300 bg-sky-100" />

      <div className="absolute bottom-8 left-1/2 h-12 w-5 -translate-x-1/2 rounded bg-stone-300" />

      <div className="absolute bottom-[60px] left-1/2 h-8 w-16 -translate-x-1/2 rounded-[50%] bg-stone-200" />

      <div className="absolute bottom-[70px] left-1/2 h-12 w-3 -translate-x-1/2 rounded-full bg-sky-300" />

      <div className="absolute bottom-[62px] left-[42%] h-7 w-2 rotate-[-24deg] rounded-full bg-sky-300" />

      <div className="absolute bottom-[62px] right-[42%] h-7 w-2 rotate-[24deg] rounded-full bg-sky-300" />
    </div>
  );
}

function Stadium() {
  return (
    <div className="relative h-[110px] w-[180px]">
      <div className="absolute bottom-0 h-20 w-full rounded-[50%] border-[12px] border-slate-400 bg-emerald-500 shadow-lg" />

      <div className="absolute bottom-5 left-1/2 h-10 w-24 -translate-x-1/2 border-2 border-white" />

      <div className="absolute bottom-[60px] left-6 h-7 w-6 bg-slate-300" />

      <div className="absolute bottom-[60px] right-6 h-7 w-6 bg-slate-300" />
    </div>
  );
}

function CityShop() {
  return (
    <div className="relative h-[125px] w-[160px]">
      <div className="absolute bottom-0 h-24 w-full rounded-lg bg-amber-100 shadow-lg" />

      <div className="absolute bottom-[88px] h-8 w-full rounded-t-xl bg-rose-500" />

      <div className="absolute bottom-12 left-4 h-12 w-42 bg-white/70" />

      <div className="absolute bottom-0 left-1/2 h-14 w-8 -translate-x-1/2 rounded-t bg-slate-600" />

      <div className="absolute bottom-4 left-5 h-12 w-28 rounded border-4 border-sky-300 bg-sky-100" />
    </div>
  );
}

function CityCar() {
  return (
    <div className="relative h-16 w-28">
      <div className="absolute bottom-3 h-10 w-28 rounded-xl bg-sky-600 shadow-lg" />

      <div className="absolute bottom-10 left-6 h-7 w-14 rounded-t-xl bg-sky-300" />

      <div className="absolute bottom-0 left-4 h-7 w-7 rounded-full border-4 border-slate-700 bg-slate-300" />

      <div className="absolute bottom-0 right-4 h-7 w-7 rounded-full border-4 border-slate-700 bg-slate-300" />
    </div>
  );
}

function AchievementCastle() {
  return (
    <svg
      width="215"
      height="165"
      viewBox="0 0 215 165"
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

      <rect
        x="29"
        y="68"
        width="18"
        height="24"
        fill="#75bcdc"
      />

      <rect
        x="168"
        y="68"
        width="18"
        height="24"
        fill="#75bcdc"
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
      className={`absolute z-[4] w-[70px] rounded-t-lg border border-slate-400 bg-gradient-to-b from-sky-200 to-slate-300 shadow-lg ${className}`}
      style={{
        height,
      }}
    >
      <div className="grid grid-cols-3 gap-1 p-2">
        {Array.from({
          length: 12,
        }).map((_, index) => (
          <span
            key={index}
            className="h-3 rounded-sm bg-sky-500/70"
          />
        ))}
      </div>
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
      className={`absolute z-[3] h-16 w-12 ${className}`}
    >
      <div className="absolute bottom-0 left-1/2 h-7 w-2 -translate-x-1/2 rounded bg-amber-800" />

      <div className="absolute bottom-5 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-emerald-600 shadow-sm" />

      <div className="absolute bottom-9 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />
    </div>
  );
}