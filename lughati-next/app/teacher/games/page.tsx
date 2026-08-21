"use client";

import Link from "next/link";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { db } from "../../../firebase";

type GameId =
  | "maze"
  | "lost-word"
  | "crosswords";

type GamesSettings = {
  weeklyGameId: GameId;
  familyGameId: GameId;
  mazeAlwaysOpen: boolean;
  familyChallengeEnabled: boolean;
  newsEnabled: boolean;
  weeklyNewsText: string;
  mazeWords: string;
  lostWordWords: string;
  crosswordsWords: string;
};

const DEFAULT_SETTINGS: GamesSettings = {
  weeklyGameId: "lost-word",
  familyGameId: "crosswords",
  mazeAlwaysOpen: true,
  familyChallengeEnabled: true,
  newsEnabled: true,
  weeklyNewsText:
    "تم تحديث تحديات هذا الأسبوع، استعدوا للعب والتعلّم!",
  mazeWords: "",
  lostWordWords: "",
  crosswordsWords: "",
};

const GAME_OPTIONS: {
  id: GameId;
  title: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "maze",
    title: "المتاهة",
    icon: "🌀",
    description:
      "متاحة دائمًا للطلاب، ويتم تحديث كلماتها أسبوعيًا.",
  },
  {
    id: "lost-word",
    title: "الكلمة الضائعة",
    icon: "🔎",
    description:
      "تحدي البحث بين الحروف واكتشاف الكلمات بأسرع وقت.",
  },
  {
    id: "crosswords",
    title: "الكلمات المتقاطعة",
    icon: "✏️",
    description:
      "تحدي مفردات وإملاء وتفكير في شبكة الكلمات.",
  },
];

function getGameInfo(id: GameId) {
  return (
    GAME_OPTIONS.find(
      (item) => item.id === id
    ) ?? GAME_OPTIONS[0]
  );
}

export default function TeacherGamesPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<GamesSettings>(
      DEFAULT_SETTINGS
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const weeklyGame =
    useMemo(
      () =>
        getGameInfo(
          settings.weeklyGameId
        ),
      [settings.weeklyGameId]
    );

  const familyGame =
    useMemo(
      () =>
        getGameInfo(
          settings.familyGameId
        ),
      [settings.familyGameId]
    );

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setMessage("");

        const snapshot =
          await getDoc(
            doc(
              db,
              "gameSettings",
              "weekly"
            )
          );

        if (
          !active ||
          !snapshot.exists()
        ) {
          return;
        }

        const data =
          snapshot.data();

        const isGameId = (
          value: unknown
        ): value is GameId =>
          value === "maze" ||
          value === "lost-word" ||
          value === "crosswords";

        setSettings({
          weeklyGameId:
            isGameId(
              data.weeklyGameId
            )
              ? data.weeklyGameId
              : DEFAULT_SETTINGS.weeklyGameId,

          familyGameId:
            isGameId(
              data.familyGameId
            )
              ? data.familyGameId
              : DEFAULT_SETTINGS.familyGameId,

          mazeAlwaysOpen:
            typeof data.mazeAlwaysOpen ===
            "boolean"
              ? data.mazeAlwaysOpen
              : true,

          familyChallengeEnabled:
            typeof data.familyChallengeEnabled ===
            "boolean"
              ? data.familyChallengeEnabled
              : true,

          newsEnabled:
            typeof data.newsEnabled ===
            "boolean"
              ? data.newsEnabled
              : true,

          weeklyNewsText:
            typeof data.weeklyNewsText ===
            "string"
              ? data.weeklyNewsText
              : DEFAULT_SETTINGS.weeklyNewsText,

          mazeWords:
            typeof data.mazeWords ===
            "string"
              ? data.mazeWords
              : "",

          lostWordWords:
            typeof data.lostWordWords ===
            "string"
              ? data.lostWordWords
              : "",

          crosswordsWords:
            typeof data.crosswordsWords ===
            "string"
              ? data.crosswordsWords
              : "",
        });
      } catch (error) {
        console.error(
          "تعذر تحميل إعدادات الألعاب:",
          error
        );

        if (active) {
          setMessage(
            "⚠️ تعذر تحميل الإعدادات المحفوظة، وتم فتح الإعدادات الافتراضية."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  function updateSetting<
    K extends keyof GamesSettings
  >(
    key: K,
    value: GamesSettings[K]
  ) {
    setSettings(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setMessage("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      await setDoc(
        doc(
          db,
          "gameSettings",
          "weekly"
        ),
        {
          ...settings,
          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      setMessage(
        "✅ تم حفظ إعدادات ساحة التحديات بنجاح."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ إعدادات الألعاب:",
        error
      );

      setMessage(
        "❌ تعذر حفظ الإعدادات. تحقق من الاتصال أو صلاحيات Firestore."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">
          ⏳ جارٍ تحميل إدارة ساحة التحديات...
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
        <header className="mb-6 rounded-3xl bg-gradient-to-l from-violet-800 via-indigo-700 to-emerald-700 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-bold text-white/80">
                لوحة المعلم
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                🎮 إدارة ساحة التحديات
              </h1>

              <p className="mt-3 max-w-3xl leading-8 text-white/90">
                حدّد لعبة الأسبوع، تحدي العائلة، وكلمات الألعاب
                من مكان واحد دون تعديل ملفات البرمجة كل أسبوع.
              </p>
            </div>

            <Link
              href="/teacher"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline"
            >
              ← العودة إلى لوحة المعلم
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon="🌀"
            title="المتاهة"
            value={
              settings.mazeAlwaysOpen
                ? "متاحة دائمًا"
                : "حسب الجدول"
            }
            note="يتم تحديث الكلمات أسبوعيًا"
          />

          <SummaryCard
            icon={weeklyGame.icon}
            title="لعبة الأسبوع"
            value={weeklyGame.title}
            note="تفتح خلال أيام الأسبوع"
          />

          <SummaryCard
            icon="👨‍👩‍👧‍👦"
            title="تحدي العائلة"
            value={
              settings.familyChallengeEnabled
                ? familyGame.title
                : "متوقف"
            }
            note="الخميس والجمعة"
          />
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-lg font-black text-slate-800">
              ⚡ لعبة الأسبوع
            </label>

            <select
              value={
                settings.weeklyGameId
              }
              onChange={(event) =>
                updateSetting(
                  "weeklyGameId",
                  event.target
                    .value as GameId
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold"
            >
              {GAME_OPTIONS.map(
                (game) => (
                  <option
                    key={game.id}
                    value={game.id}
                  >
                    {game.icon}{" "}
                    {game.title}
                  </option>
                )
              )}
            </select>

            <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
              {weeklyGame.description}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-lg font-black text-slate-800">
              👨‍👩‍👧‍👦 تحدي العائلة
            </label>

            <select
              value={
                settings.familyGameId
              }
              onChange={(event) =>
                updateSetting(
                  "familyGameId",
                  event.target
                    .value as GameId
                )
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold"
            >
              {GAME_OPTIONS.map(
                (game) => (
                  <option
                    key={game.id}
                    value={game.id}
                  >
                    {game.icon}{" "}
                    {game.title}
                  </option>
                )
              )}
            </select>

            <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
              {familyGame.description}
            </p>
          </article>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <ToggleCard
            title="🌀 إبقاء المتاهة متاحة دائمًا"
            description="حتى يستفيد الطلاب منها طوال الأسبوع مع تحديث محتواها دوريًا."
            checked={
              settings.mazeAlwaysOpen
            }
            onChange={(checked) =>
              updateSetting(
                "mazeAlwaysOpen",
                checked
              )
            }
          />

          <ToggleCard
            title="👨‍👩‍👧‍👦 تفعيل تحدي العائلة"
            description="يُستخدم لتجربة الخميس والجمعة المخصصة للأسرة والزوار."
            checked={
              settings.familyChallengeEnabled
            }
            onChange={(checked) =>
              updateSetting(
                "familyChallengeEnabled",
                checked
              )
            }
          />
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-800">
              ✍️ محتوى الألعاب الأسبوعي
            </h2>

            <p className="mt-2 leading-7 text-slate-500">
              اكتب الكلمات مفصولة بفاصلة أو كل كلمة في سطر.
              سنربط كل لعبة بهذه البيانات في الخطوة التالية.
            </p>
          </div>

          <div className="grid gap-4">
            <WordsField
              title="🌀 كلمات المتاهة"
              value={
                settings.mazeWords
              }
              onChange={(value) =>
                updateSetting(
                  "mazeWords",
                  value
                )
              }
              placeholder="مثال: مدرسة، كتاب، معلم، قلم..."
            />

            <WordsField
              title="🔎 كلمات الكلمة الضائعة"
              value={
                settings.lostWordWords
              }
              onChange={(value) =>
                updateSetting(
                  "lostWordWords",
                  value
                )
              }
              placeholder="مثال: قراءة، كتابة، نجاح..."
            />

            <WordsField
              title="✏️ كلمات الكلمات المتقاطعة"
              value={
                settings.crosswordsWords
              }
              onChange={(value) =>
                updateSetting(
                  "crosswordsWords",
                  value
                )
              }
              placeholder="مثال: مفردات أو كلمات الوحدة الحالية..."
            />
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-amber-900">
                📣 خبر تحديث الألعاب
              </h2>

              <p className="mt-1 text-sm font-bold text-amber-800">
                النص المقترح ليظهر لاحقًا في نبض الأكاديمية.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                settings.newsEnabled
              }
              onChange={(event) =>
                updateSetting(
                  "newsEnabled",
                  event.target.checked
                )
              }
              className="h-7 w-7 accent-amber-600"
            />
          </div>

          <textarea
            value={
              settings.weeklyNewsText
            }
            onChange={(event) =>
              updateSetting(
                "weeklyNewsText",
                event.target.value
              )
            }
            rows={3}
            className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 font-bold text-slate-700"
            placeholder="مثال: 🌀 تم تحديث كلمات تحدي المتاهة لهذا الأسبوع."
          />
        </section>

        {message && (
          <div className="mb-4 rounded-2xl bg-white p-4 text-center font-black text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving
            ? "⏳ جارٍ حفظ الإعدادات..."
            : "💾 حفظ إعدادات ساحة التحديات"}
        </button>

        <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="text-xl font-black text-violet-900">
            🚀 ما الذي سنربطه بعد نجاح الصفحة؟
          </h2>

          <p className="mt-2 leading-8 text-violet-900">
            سنجعل ساحة الألعاب تقرأ هذه الإعدادات تلقائيًا:
            المتاهة تبقى متاحة، لعبة أسبوع واحدة تفتح، الخميس
            والجمعة يصبحان تحدي عائلة، والكلمات تتغير من هذه
            الصفحة فقط.
          </p>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  note,
}: {
  icon: string;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">
        {icon}
      </div>

      <p className="mt-3 text-sm font-black text-slate-500">
        {title}
      </p>

      <h2 className="mt-1 text-xl font-black text-slate-800">
        {value}
      </h2>

      <p className="mt-2 text-sm font-bold text-slate-500">
        {note}
      </p>
    </article>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800">
            {title}
          </h2>

          <p className="mt-2 text-sm font-bold leading-7 text-slate-500">
            {description}
          </p>
        </div>

        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked
            )
          }
          className="h-7 w-7 shrink-0 accent-emerald-600"
        />
      </label>
    </article>
  );
}

function WordsField({
  title,
  value,
  onChange,
  placeholder,
}: {
  title: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
}) {
  return (
    <article className="rounded-2xl bg-slate-50 p-4">
      <label className="mb-3 block font-black text-slate-800">
        {title}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 leading-8"
      />
    </article>
  );
}