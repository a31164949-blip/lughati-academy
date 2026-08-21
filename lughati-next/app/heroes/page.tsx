"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";

type HeroCategory =
  | "reading"
  | "spelling"
  | "progress"
  | "commitment"
  | "creativity"
  | "notebook";

type AcademyHero = {
  id: string;
  studentFirstName: string;
  classroom: string;
  title: string;
  category: HeroCategory;
  achievementsCount: number;
  readingCount: number;
  spellingCount: number;
  badge: string;
  imageUrl: string;
  photoConsent: boolean;
  published: boolean;
};

const categoryInfo: Record<
  HeroCategory,
  {
    label: string;
    icon: string;
  }
> = {
  reading: {
    label: "ملك القراءة",
    icon: "📖",
  },
  spelling: {
    label: "ملك الإملاء",
    icon: "✍️",
  },
  progress: {
    label: "الأكثر تطورًا",
    icon: "🌱",
  },
  commitment: {
    label: "الأكثر التزامًا",
    icon: "🔥",
  },
  creativity: {
    label: "المبدع",
    icon: "🎨",
  },
  notebook: {
    label: "دفتر أنيق",
    icon: "✨",
  },
};

export default function HeroesPage() {
  const [heroes, setHeroes] = useState<AcademyHero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<HeroCategory | "all">("all");

  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    async function loadHeroes() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const snapshot = await getDocs(
          collection(db, "academyHeroes")
        );

        const loadedHeroes: AcademyHero[] =
          snapshot.docs
            .map((docSnap) => {
              const data = docSnap.data();

              const category: HeroCategory =
                data.category === "spelling" ||
                data.category === "progress" ||
                data.category === "commitment" ||
                data.category === "creativity" ||
                data.category === "notebook"
                  ? data.category
                  : "reading";

              return {
                id: docSnap.id,

                studentFirstName:
                  typeof data.studentFirstName === "string"
                    ? data.studentFirstName
                    : "بطل الأكاديمية",

                classroom:
                  typeof data.classroom === "string"
                    ? data.classroom
                    : "",

                title:
                  typeof data.title === "string"
                    ? data.title
                    : categoryInfo[category].label,

                category,

                achievementsCount:
                  typeof data.achievementsCount === "number"
                    ? data.achievementsCount
                    : 0,

                readingCount:
                  typeof data.readingCount === "number"
                    ? data.readingCount
                    : 0,

                spellingCount:
                  typeof data.spellingCount === "number"
                    ? data.spellingCount
                    : 0,

                badge:
                  typeof data.badge === "string"
                    ? data.badge
                    : "",

                imageUrl:
                  typeof data.imageUrl === "string"
                    ? data.imageUrl
                    : "",

                photoConsent:
                  data.photoConsent === true,

                published:
                  data.published === true,
              };
            })
            .filter(
              (hero) =>
                hero.published &&
                hero.photoConsent
            );

        setHeroes(loadedHeroes);
      } catch (error) {
        console.error(
          "تعذر تحميل أبطال الأكاديمية:",
          error
        );

        setHeroes([]);

        setErrorMessage(
          "سيظهر أبطال الأكاديمية هنا فور اعتماد إنجازاتهم للنشر 🌟"
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadHeroes();
  }, []);

  useEffect(() => {
    if (heroes.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setFeaturedIndex((current) =>
        current + 1 >= heroes.length
          ? 0
          : current + 1
      );
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [heroes.length]);

  const filteredHeroes = useMemo(() => {
    if (selectedCategory === "all") {
      return heroes;
    }

    return heroes.filter(
      (hero) =>
        hero.category === selectedCategory
    );
  }, [heroes, selectedCategory]);

  const featuredHero =
    heroes.length > 0
      ? heroes[
          Math.min(
            featuredIndex,
            heroes.length - 1
          )
        ]
      : null;

  const totalAchievements =
    heroes.reduce(
      (total, hero) =>
        total + hero.achievementsCount,
      0
    );

  const totalReading =
    heroes.reduce(
      (total, hero) =>
        total + hero.readingCount,
      0
    );

  const totalSpelling =
    heroes.reduce(
      (total, hero) =>
        total + hero.spellingCount,
      0
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-7xl">

        {/* الترويسة */}

        <header className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-l from-emerald-800 via-emerald-700 to-emerald-600 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="font-bold text-emerald-100">
                أكاديمية لغتي الرقمية
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                🌟 أبطال أكاديمية لغتي
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50">
                هنا نحتفي بالجهد، والتقدم،
                والاستمرار، والإبداع…
                فلكل بطل طريقه الخاص نحو
                التميز.
              </p>
            </div>

<Link
  href="/"
  className="inline-flex items-center justify-center rounded-2xl bg-emerald-..."
>
  ← العودة إلى الرئيسية
</Link>
          </div>
        </header>

        {/* تاج لغتي */}

        <section className="mb-6 rounded-[30px] border-2 border-amber-300 bg-gradient-to-l from-amber-100 via-yellow-50 to-white p-6 shadow-lg">
          <div className="text-center">
            <div className="text-5xl">
              👑
            </div>

            <h2 className="mt-2 text-3xl font-black text-amber-800">
              تاج لغتي
            </h2>

            <p className="mt-2 text-amber-700">
              اقرأ… أتقن… وتقدّم نحو التاج
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-emerald-200 bg-white p-5 text-center shadow-sm">
              <div className="text-4xl">
                📖
              </div>

              <h3 className="mt-2 text-2xl font-black text-emerald-700">
                ملك القراءة
              </h3>

              <p className="mt-2 leading-7 text-slate-600">
                نحتفي بالقراءة المستمرة،
                والتطور، والالتزام.
              </p>
            </article>

            <article className="rounded-3xl border border-rose-200 bg-white p-5 text-center shadow-sm">
              <div className="text-4xl">
                ✍️
              </div>

              <h3 className="mt-2 text-2xl font-black text-rose-700">
                ملك الإملاء
              </h3>

              <p className="mt-2 leading-7 text-slate-600">
                نحتفي بإتقان الكلمات،
                والتحسن، والمثابرة.
              </p>
            </article>
          </div>
        </section>

        {/* البطل المتحرك */}

        <section className="mb-6 rounded-[30px] border border-emerald-200 bg-white p-6 shadow-lg">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                🏆 بطل في الواجهة
              </h2>

              <p className="mt-1 text-slate-500">
                تتغير البطاقة تلقائيًا لعرض
                أبطال الأكاديمية.
              </p>
            </div>

            <span className="rounded-full bg-emerald-100 px-4 py-2 font-black text-emerald-700">
              مباشر ✨
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-3xl bg-slate-50 p-10 text-center font-black text-emerald-700">
              جارٍ تجهيز لوحة الأبطال...
            </div>
          ) : featuredHero ? (
            <div className="grid items-center gap-6 rounded-[28px] bg-gradient-to-l from-emerald-50 via-white to-amber-50 p-6 md:grid-cols-[180px_1fr]">
              <HeroImage hero={featuredHero} />

              <div>
                <span className="rounded-full bg-amber-100 px-4 py-2 font-black text-amber-800">
                  {
                    categoryInfo[
                      featuredHero.category
                    ].icon
                  }{" "}
                  {featuredHero.title}
                </span>

                <h3 className="mt-5 text-3xl font-black text-emerald-800">
                  {featuredHero.studentFirstName}
                </h3>

                <p className="mt-2 font-bold text-slate-500">
                  {featuredHero.classroom}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <HeroStat
                    icon="⭐"
                    label="الإنجازات"
                    value={
                      featuredHero.achievementsCount
                    }
                  />

                  <HeroStat
                    icon="📖"
                    label="القراءات"
                    value={
                      featuredHero.readingCount
                    }
                  />

                  <HeroStat
                    icon="✍️"
                    label="الإملاء"
                    value={
                      featuredHero.spellingCount
                    }
                  />
                </div>

                {featuredHero.badge && (
                  <p className="mt-5 font-black text-amber-700">
                    🏅 {featuredHero.badge}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50 p-10 text-center">
              <div className="text-5xl">
                🌟
              </div>

              <h3 className="mt-3 text-xl font-black text-emerald-800">
                الأبطال قادمون قريبًا
              </h3>

              <p className="mt-2 text-emerald-700">
                ستظهر هنا الإنجازات المعتمدة
                التي وافقت الأسر على نشرها.
              </p>
            </div>
          )}

          {errorMessage && !featuredHero && (
            <p className="mt-3 text-center font-bold text-slate-500">
              {errorMessage}
            </p>
          )}
        </section>

        {/* إحصاءات عامة */}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <PublicStat
            icon="⭐"
            label="إنجازات الأبطال"
            value={totalAchievements}
          />

          <PublicStat
            icon="📖"
            label="قراءات معتمدة"
            value={totalReading}
          />

          <PublicStat
            icon="✍️"
            label="إنجازات إملائية"
            value={totalSpelling}
          />
        </section>

        {/* الفلاتر */}

        <section className="mb-5 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            <CategoryButton
              active={
                selectedCategory === "all"
              }
              label="🌟 جميع الأبطال"
              onClick={() =>
                setSelectedCategory("all")
              }
            />

            {(
              Object.keys(
                categoryInfo
              ) as HeroCategory[]
            ).map((category) => (
              <CategoryButton
                key={category}
                active={
                  selectedCategory ===
                  category
                }
                label={`${categoryInfo[category].icon} ${categoryInfo[category].label}`}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* جميع الأبطال */}

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-800">
              🌟 لوحة الأبطال
            </h2>

            <p className="mt-2 text-slate-500">
              نحتفي بالإنجاز دون ترتيب أول
              وثانٍ وثالث.
            </p>
          </div>

          {filteredHeroes.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHeroes.map(
                (hero) => (
                  <article
                    key={hero.id}
                    className="rounded-[26px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 text-center shadow-sm"
                  >
                    <div className="mx-auto w-28">
                      <HeroImage hero={hero} />
                    </div>

                    <p className="mt-4 text-sm font-black text-amber-700">
                      {
                        categoryInfo[
                          hero.category
                        ].icon
                      }{" "}
                      {hero.title}
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-slate-800">
                      {hero.studentFirstName}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {hero.classroom}
                    </p>

                    <div className="mt-4 rounded-2xl bg-emerald-50 p-3 font-black text-emerald-700">
                      ⭐ {hero.achievementsCount}{" "}
                      إنجازًا
                    </div>

                    {hero.badge && (
                      <p className="mt-3 text-sm font-bold text-amber-700">
                        🏅 {hero.badge}
                      </p>
                    )}
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-10 text-center">
              <div className="text-5xl">
                🏆
              </div>

              <p className="mt-3 font-black text-slate-600">
                لا يوجد أبطال منشورون في
                هذا المسار حتى الآن.
              </p>
            </div>
          )}
        </section>

        {/* فلسفة التكريم */}

        <section className="mt-6 rounded-[30px] border border-violet-200 bg-violet-50 p-6">
          <h2 className="text-2xl font-black text-violet-800">
            💜 في أكاديمية لغتي…
          </h2>

          <p className="mt-3 text-lg leading-9 text-violet-900">
            لا نحتفي بالدرجات فقط؛ نحتفي
            بالطالب الذي تطور، والذي استمر،
            والذي حاول، والذي أبدع. لكل طالب
            فرصة حقيقية ليكون بطلًا.
          </p>
        </section>

        <footer className="mt-7 text-center text-sm leading-7 text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>

          <br />

          نتعلّم… نقرأ… نبدع
        </footer>
      </div>
    </main>
  );
}

function HeroImage({
  hero,
}: {
  hero: AcademyHero;
}) {
  if (hero.imageUrl) {
    return (
      <img
        src={hero.imageUrl}
        alt={`صورة ${hero.studentFirstName}`}
        className="aspect-square w-full rounded-[28px] object-cover shadow-md"
      />
    );
  }

  return (
    <div className="grid aspect-square w-full place-items-center rounded-[28px] bg-emerald-100 text-6xl shadow-sm">
      👦
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm font-bold text-slate-500">
        {icon} {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function PublicStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="text-3xl">
        {icon}
      </div>

      <p className="mt-2 text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-emerald-700">
        {value}
      </p>
    </article>
  );
}

function CategoryButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 font-black transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}