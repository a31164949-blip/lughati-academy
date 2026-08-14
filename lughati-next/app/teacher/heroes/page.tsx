"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type HeroCategory =
  | "reading"
  | "spelling"
  | "progress"
  | "commitment"
  | "creativity"
  | "notebook";

type StudentOption = {
  id: string;
  name: string;
  classroom: string;
  photoConsent: boolean;
};

type SavedHero = {
  id: string;
  studentId: string;
  studentFirstName: string;
  classroom: string;
  category: HeroCategory;
  title: string;
  badge: string;
  imageUrl: string;
  achievementsCount: number;
  readingCount: number;
  spellingCount: number;
  photoConsent: boolean;
  published: boolean;
};

const categoryOptions: {
  key: HeroCategory;
  label: string;
  icon: string;
}[] = [
  {
    key: "reading",
    label: "ملك القراءة",
    icon: "📖",
  },
  {
    key: "spelling",
    label: "ملك الإملاء",
    icon: "✍️",
  },
  {
    key: "progress",
    label: "الأكثر تطورًا",
    icon: "🌱",
  },
  {
    key: "commitment",
    label: "الأكثر التزامًا",
    icon: "🔥",
  },
  {
    key: "creativity",
    label: "المبدع",
    icon: "🎨",
  },
  {
    key: "notebook",
    label: "دفتر أنيق",
    icon: "✨",
  },
];

function firstNameOnly(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return "بطل الأكاديمية";
  }

  return trimmed.split(/\s+/)[0] || trimmed;
}

function getHeroCategory(value: unknown): HeroCategory {
  if (
    value === "spelling" ||
    value === "progress" ||
    value === "commitment" ||
    value === "creativity" ||
    value === "notebook"
  ) {
    return value;
  }

  return "reading";
}

export default function TeacherHeroesPage() {
  const [students, setStudents] =
    useState<StudentOption[]>([]);

  const [savedHeroes, setSavedHeroes] =
    useState<SavedHero[]>([]);

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [category, setCategory] =
    useState<HeroCategory>("reading");

  const [customTitle, setCustomTitle] =
    useState("ملك القراءة");

  const [badge, setBadge] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [achievementsCount, setAchievementsCount] =
    useState(0);

  const [readingCount, setReadingCount] =
    useState(0);

  const [spellingCount, setSpellingCount] =
    useState(0);

  const [published, setPublished] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  async function loadSavedHeroes() {
    const heroesSnapshot = await getDocs(
      collection(db, "academyHeroes")
    );

    const loadedHeroes: SavedHero[] =
      heroesSnapshot.docs.map((heroDoc) => {
        const data = heroDoc.data();

        return {
          id: heroDoc.id,

          studentId:
            typeof data.studentId === "string"
              ? data.studentId
              : "",

          studentFirstName:
            typeof data.studentFirstName === "string"
              ? data.studentFirstName
              : "بطل الأكاديمية",

          classroom:
            typeof data.classroom === "string"
              ? data.classroom
              : "",

          category:
            getHeroCategory(data.category),

          title:
            typeof data.title === "string"
              ? data.title
              : "بطل الأكاديمية",

          badge:
            typeof data.badge === "string"
              ? data.badge
              : "",

          imageUrl:
            typeof data.imageUrl === "string"
              ? data.imageUrl
              : "",

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

          photoConsent:
            data.photoConsent === true,

          published:
            data.published === true,
        };
      });

    loadedHeroes.sort((a, b) =>
      a.studentId.localeCompare(b.studentId)
    );

    setSavedHeroes(loadedHeroes);
  }

  useEffect(() => {
    async function loadPageData() {
      try {
        setIsLoading(true);
        setStatusMessage("");

        const studentsSnapshot = await getDocs(
          collection(db, "students")
        );

        const loadedStudents: StudentOption[] = [];

        for (const studentDoc of studentsSnapshot.docs) {
          const data = studentDoc.data();

          const name =
            typeof data.studentName === "string"
              ? data.studentName
              : typeof data.name === "string"
                ? data.name
                : studentDoc.id;

          const classroom =
            typeof data.classroom === "string"
              ? data.classroom
              : "";

          let photoConsent = false;

          try {
            const caseStudySnapshot =
              await getDoc(
                doc(
                  db,
                  "studentCaseStudies",
                  studentDoc.id
                )
              );

            if (caseStudySnapshot.exists()) {
              const caseStudyData =
                caseStudySnapshot.data();

              photoConsent =
                caseStudyData.photoConsent === true ||
                caseStudyData.photoConsent === "نعم" ||
                caseStudyData.photoConsent === "yes";
            }
          } catch (error) {
            console.error(
              `تعذر قراءة موافقة الصورة للطالب ${studentDoc.id}:`,
              error
            );
          }

          loadedStudents.push({
            id: studentDoc.id,
            name,
            classroom,
            photoConsent,
          });
        }

        loadedStudents.sort((a, b) =>
          a.id.localeCompare(b.id)
        );

        setStudents(loadedStudents);

        await loadSavedHeroes();
      } catch (error) {
        console.error(
          "تعذر تحميل لوحة الأبطال:",
          error
        );

        setStatusMessage(
          "تعذر تحميل بعض بيانات لوحة الأبطال."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPageData();
  }, []);

  const selectedStudent = useMemo(
    () =>
      students.find(
        (student) =>
          student.id === selectedStudentId
      ) ?? null,
    [students, selectedStudentId]
  );

  const selectedCategory =
    categoryOptions.find(
      (item) => item.key === category
    ) ?? categoryOptions[0];

  function resetForm() {
    setSelectedStudentId("");
    setCategory("reading");
    setCustomTitle("ملك القراءة");
    setBadge("");
    setImageUrl("");
    setAchievementsCount(0);
    setReadingCount(0);
    setSpellingCount(0);
    setPublished(false);
  }

  function handleEditHero(hero: SavedHero) {
    setSelectedStudentId(hero.studentId);
    setCategory(hero.category);
    setCustomTitle(hero.title);
    setBadge(hero.badge);
    setImageUrl(hero.imageUrl);
    setAchievementsCount(
      hero.achievementsCount
    );
    setReadingCount(hero.readingCount);
    setSpellingCount(hero.spellingCount);
    setPublished(hero.published);

    setStatusMessage(
      `✏️ أنت الآن تعدّل بطل: ${hero.studentFirstName} — ${hero.title}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSave() {
    if (!selectedStudent) {
      setStatusMessage(
        "اختر الطالب أولًا."
      );
      return;
    }

    if (
      published &&
      !selectedStudent.photoConsent
    ) {
      setStatusMessage(
        "لا يمكن نشر صورة هذا الطالب للزوار لأن موافقة الأسرة على النشر غير موجودة."
      );
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      const heroId =
        `${selectedStudent.id}_${category}`;

      await setDoc(
        doc(
          db,
          "academyHeroes",
          heroId
        ),
        {
          studentId:
            selectedStudent.id,

          studentFirstName:
            firstNameOnly(
              selectedStudent.name
            ),

          classroom:
            selectedStudent.classroom,

          category,

          title:
            customTitle.trim() ||
            selectedCategory.label,

          badge:
            badge.trim(),

          imageUrl:
            imageUrl.trim(),

          achievementsCount:
            Math.max(
              0,
              achievementsCount
            ),

          readingCount:
            Math.max(
              0,
              readingCount
            ),

          spellingCount:
            Math.max(
              0,
              spellingCount
            ),

          photoConsent:
            selectedStudent.photoConsent,

          published,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      await loadSavedHeroes();

      setStatusMessage(
        published
          ? "✅ تم حفظ البطل ونشره في ركن الأبطال."
          : "✅ تم حفظ البطل كمسودة غير منشورة."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ البطل:",
        error
      );

      setStatusMessage(
        "تعذر حفظ بيانات البطل. تحقق من الاتصال أو الصلاحيات."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">
          جارٍ تحميل لوحة الأبطال...
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-6xl">

        <header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-800 to-emerald-600 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-100">
                لوحة المعلم
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                🌟 إدارة أبطال أكاديمية لغتي
              </h1>

              <p className="mt-3 max-w-3xl leading-8 text-emerald-50">
                اختر الطالب واللقب والإنجازات،
                ثم قرر هل يظهر في الواجهة
                العامة أم يبقى محفوظًا فقط.
              </p>
            </div>

            <a
              href="/teacher"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline"
            >
              ← العودة إلى لوحة المعلم
            </a>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2">

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-lg font-black text-slate-800">
              👨‍🎓 اختر الطالب
            </label>

            <select
              value={selectedStudentId}
              onChange={(event) => {
                setSelectedStudentId(
                  event.target.value
                );
                setStatusMessage("");
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold"
            >
              <option value="">
                اختر الطالب
              </option>

              {students.map(
                (student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name} —{" "}
                    {student.classroom}
                  </option>
                )
              )}
            </select>

            {selectedStudent && (
              <div
                className={`mt-4 rounded-2xl p-4 font-bold ${
                  selectedStudent.photoConsent
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {selectedStudent.photoConsent
                  ? "✅ الأسرة موافقة على نشر الصورة."
                  : "⚠️ لا توجد موافقة أسرة على نشر الصورة للزوار."}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-lg font-black text-slate-800">
              🏆 نوع البطولة
            </label>

            <select
              value={category}
              onChange={(event) => {
                const newCategory =
                  event.target
                    .value as HeroCategory;

                setCategory(
                  newCategory
                );

                const categoryInfo =
                  categoryOptions.find(
                    (item) =>
                      item.key ===
                      newCategory
                  );

                if (categoryInfo) {
                  setCustomTitle(
                    categoryInfo.label
                  );
                }

                setStatusMessage("");
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold"
            >
              {categoryOptions.map(
                (item) => (
                  <option
                    key={item.key}
                    value={item.key}
                  >
                    {item.icon}{" "}
                    {item.label}
                  </option>
                )
              )}
            </select>
          </article>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block font-black text-slate-800">
              👑 اللقب المعروض
            </label>

            <input
              value={customTitle}
              onChange={(event) =>
                setCustomTitle(
                  event.target.value
                )
              }
              placeholder="مثال: ملك القراءة"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
            />
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block font-black text-slate-800">
              🏅 الشارة
            </label>

            <input
              value={badge}
              onChange={(event) =>
                setBadge(
                  event.target.value
                )
              }
              placeholder="مثال: الأكثر تطورًا هذا الأسبوع"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
            />
          </article>
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-3 block font-black text-slate-800">
            🖼️ رابط صورة الطالب
          </label>

          <input
            value={imageUrl}
            onChange={(event) =>
              setImageUrl(
                event.target.value
              )
            }
            placeholder="ضع رابط الصورة هنا"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <p className="mt-2 text-sm text-slate-500">
            في نسخة الإطلاق نستخدم رابط
            الصورة. لاحقًا يمكن إضافة زر رفع
            مباشر.
          </p>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">

          <NumberField
            label="⭐ عدد الإنجازات"
            value={achievementsCount}
            onChange={
              setAchievementsCount
            }
          />

          <NumberField
            label="📖 قراءات معتمدة"
            value={readingCount}
            onChange={
              setReadingCount
            }
          />

          <NumberField
            label="✍️ إنجازات الإملاء"
            value={spellingCount}
            onChange={
              setSpellingCount
            }
          />
        </section>

        <section className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-emerald-800">
                🌍 نشر البطل للزوار
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                لن يسمح بالنشر إذا لم تكن
                موافقة الأسرة موجودة.
              </p>
            </div>

            <input
              type="checkbox"
              checked={published}
              onChange={(event) => {
                setPublished(
                  event.target.checked
                );
                setStatusMessage("");
              }}
              className="h-7 w-7 accent-emerald-600"
            />
          </label>
        </section>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving
              ? "⏳ جارٍ حفظ البطل..."
              : "💾 حفظ البطل"}
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();

              setStatusMessage(
                "تم تجهيز نموذج جديد."
              );
            }}
            className="rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 font-black text-slate-700"
          >
            ＋ بطل جديد
          </button>
        </div>

        {statusMessage && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-800">
            {statusMessage}
          </p>
        )}

        {/* الأبطال المحفوظون */}

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-2xl font-black text-slate-800">
                🌟 الأبطال المحفوظون
              </h2>

              <p className="mt-2 text-slate-500">
                المسودات والأبطال المنشورون
                في مكان واحد.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 font-black text-emerald-700">
              {savedHeroes.length} بطل
            </span>
          </div>

          {savedHeroes.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center font-bold text-slate-500">
              لا يوجد أبطال محفوظون حتى الآن.
            </div>
          ) : (
            <div className="grid gap-3">
              {savedHeroes.map(
                (hero) => {
                  const categoryData =
                    categoryOptions.find(
                      (item) =>
                        item.key ===
                        hero.category
                    );

                  return (
                    <article
                      key={hero.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3">

                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                          {categoryData?.icon ??
                            "🌟"}
                        </div>

                        <div>
                          <h3 className="font-black text-slate-800">
                            {
                              hero.studentFirstName
                            }
                            {" — "}
                            {hero.title}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {hero.classroom ||
                              "الفصل غير محدد"}
                            {" • "}
                            ⭐{" "}
                            {
                              hero.achievementsCount
                            }{" "}
                            إنجازًا
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded-full px-3 py-2 text-sm font-black ${
                            hero.published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {hero.published
                            ? "🌍 منشور"
                            : "📝 مسودة"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleEditHero(
                              hero
                            )
                          }
                          className="rounded-xl bg-white px-4 py-2 font-black text-slate-700 shadow-sm"
                        >
                          ✏️ تعديل
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">

          <h2 className="text-xl font-black text-violet-800">
            🔐 الخصوصية أولًا
          </h2>

          <p className="mt-2 leading-8 text-violet-900">
            الطالب يحصل على اللقب والتكريم
            داخل الأكاديمية سواء وافقت الأسرة
            على نشر الصورة أم لا. موافقة
            الأسرة مطلوبة فقط للظهور في
            الواجهة العامة.
          </p>
        </section>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      <label className="mb-3 block font-black text-slate-800">
        {label}
      </label>

      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              0,
              Number(
                event.target.value
              ) || 0
            )
          )
        }
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center text-xl font-black"
      />
    </article>
  );
}