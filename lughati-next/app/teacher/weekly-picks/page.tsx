"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type WeeklyWord = {
  word: string;
  vocalizedWord: string;
  meaning: string;
  example: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  published: boolean;
};

type WeeklyStory = {
  title: string;
  description: string;
  href: string;
  published: boolean;
};

type DidYouKnow = {
  title: string;
  text: string;
  published: boolean;
};

type QuickChallenge = {
  question: string;
  options: string[];
  correctIndex: number;
  successMessage: string;
  published: boolean;
};

type WeeklyVideo = {
  title: string;
  description: string;
  videoUrl: string;
  question: string;
  published: boolean;
};

const defaultWord: WeeklyWord = {
  word: "صلة",
  vocalizedWord: "صِلَة",
  meaning:
    "التواصل مع الأقارب والإحسان إليهم والسؤال عنهم.",
  example:
    "أحرص على صِلَةِ أقاربي وزيارتهم.",
  question:
    "ما المعنى الأقرب لكلمة «صِلَة»؟",
  options: [
    "التواصل والإحسان إلى الأقارب",
    "الابتعاد عن الأقارب",
    "اللعب وحدي",
  ],
  correctIndex: 0,
  hint:
    "تذكّر زيارة فواز لبيت جده.",
  published: true,
};

const defaultStory: WeeklyStory = {
  title:
    "صندوق الصور في بيت جدي",
  description:
    "قصة مصوّرة عن الأقارب والمحبة وصلة الرحم.",
  href:
    "/reading/stories/relatives",
  published: true,
};

const defaultDidYouKnow: DidYouKnow = {
  title:
    "هل تعلم؟",
  text:
    "صلة الرحم تعني الإحسان إلى الأقارب وزيارتهم والسؤال عنهم.",
  published: false,
};

const defaultChallenge: QuickChallenge = {
  question:
    "أيُّ عملٍ يدل على صلة الرحم؟",
  options: [
    "زيارة جدتي والسؤال عنها",
    "عدم الحديث مع أقاربي",
    "اللعب وحدي دائمًا",
  ],
  correctIndex: 0,
  successMessage:
    "رائع! زيارة الأقارب والسؤال عنهم من صلة الرحم.",
  published: false,
};

const defaultVideo: WeeklyVideo = {
  title:
    "شاهد وتعلّم",
  description:
    "مقطع قصير مرتبط بمهارة هذا الأسبوع.",
  videoUrl: "",
  question:
    "ماذا تعلمت من المقطع؟",
  published: false,
};

export default function TeacherWeeklyPicksPage() {
  const [
    word,
    setWord,
  ] = useState<WeeklyWord>(
    defaultWord
  );

  const [
    story,
    setStory,
  ] = useState<WeeklyStory>(
    defaultStory
  );

  const [
    didYouKnow,
    setDidYouKnow,
  ] = useState<DidYouKnow>(
    defaultDidYouKnow
  );

  const [
    challenge,
    setChallenge,
  ] =
    useState<QuickChallenge>(
      defaultChallenge
    );

  const [
    video,
    setVideo,
  ] = useState<WeeklyVideo>(
    defaultVideo
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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const ref = doc(
          db,
          "weeklyPicks",
          "current"
        );

        const snapshot =
          await getDoc(ref);

        if (
          snapshot.exists()
        ) {
          const data =
            snapshot.data();

          if (data.word) {
            setWord({
              ...defaultWord,
              ...data.word,
            });
          }

          if (data.story) {
            setStory({
              ...defaultStory,
              ...data.story,
            });
          }

          if (
            data.didYouKnow
          ) {
            setDidYouKnow({
              ...defaultDidYouKnow,
              ...data.didYouKnow,
            });
          }

          if (
            data.challenge
          ) {
            setChallenge({
              ...defaultChallenge,
              ...data.challenge,
            });
          }

          if (data.video) {
            setVideo({
              ...defaultVideo,
              ...data.video,
            });
          }
        }
      } catch (error) {
        console.error(
          "تعذر تحميل المختارات:",
          error
        );

        setMessage(
          "تعذر تحميل مختارات الأسبوع."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function saveAll() {
    try {
      setSaving(true);
      setMessage("");

      const ref = doc(
        db,
        "weeklyPicks",
        "current"
      );

      await setDoc(
        ref,
        {
          story,
          word,
          didYouKnow,
          challenge,
          video,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      setMessage(
        "✅ تم حفظ مختارات الأسبوع بنجاح."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ المختارات:",
        error
      );

      setMessage(
        "❌ تعذر الحفظ. تأكد من تسجيل دخول المعلم وصلاحيات Firestore."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f7fbf8] p-6"
      >
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 text-center text-xl font-black text-emerald-700 shadow-sm">
          ⏳ جاري تحميل مختارات
          الأسبوع...
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[#f3fbf7] via-white to-[#f5f8ff] px-3 py-5 sm:px-5"
    >
      <div className="mx-auto max-w-6xl">

        {/* الترويسة */}

        <header className="relative overflow-hidden rounded-[34px] bg-gradient-to-l from-emerald-900 via-emerald-700 to-teal-600 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black">
                ✨ لوحة المعلم
              </span>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                إدارة مختارات الأسبوع
              </h1>

              <p className="mt-2 max-w-2xl leading-8 text-emerald-50">
                غيّر المحتوى الأسبوعي
                من هنا ثم اضغط حفظ؛
                دون الحاجة إلى تعديل
                الأكواد.
              </p>
            </div>

            <Link
              href="/teacher"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-800 no-underline shadow-lg"
            >
              ← العودة إلى لوحة المعلم
            </Link>
          </div>
        </header>

        {/* قصة الأسبوع */}

        <SectionCard
          icon="📖"
          title="قصة الأسبوع"
          description="القصة التي تظهر للطالب والزائر هذا الأسبوع."
          active={story.published}
          onToggle={() =>
            setStory(
              (
                current
              ) => ({
                ...current,
                published:
                  !current.published,
              })
            )
          }
        >
          <Field
            label="عنوان القصة"
            value={story.title}
            onChange={(value) =>
              setStory({
                ...story,
                title: value,
              })
            }
          />

          <TextAreaField
            label="وصف مختصر"
            value={
              story.description
            }
            onChange={(value) =>
              setStory({
                ...story,
                description:
                  value,
              })
            }
          />

          <Field
            label="رابط القصة داخل المنصة"
            value={story.href}
            onChange={(value) =>
              setStory({
                ...story,
                href: value,
              })
            }
            dir="ltr"
          />
        </SectionCard>

        {/* كلمة جميلة */}

        <SectionCard
          icon="💎"
          title="كلمة جميلة"
          description="كلمة الأسبوع ومعناها والتحدي المرتبط بها."
          active={word.published}
          onToggle={() =>
            setWord(
              (current) => ({
                ...current,
                published:
                  !current.published,
              })
            )
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="الكلمة"
              value={word.word}
              onChange={(value) =>
                setWord({
                  ...word,
                  word: value,
                })
              }
            />

            <Field
              label="الكلمة بالتشكيل"
              value={
                word.vocalizedWord
              }
              onChange={(value) =>
                setWord({
                  ...word,
                  vocalizedWord:
                    value,
                })
              }
            />
          </div>

          <TextAreaField
            label="معنى الكلمة"
            value={word.meaning}
            onChange={(value) =>
              setWord({
                ...word,
                meaning: value,
              })
            }
          />

          <Field
            label="مثال في جملة"
            value={word.example}
            onChange={(value) =>
              setWord({
                ...word,
                example: value,
              })
            }
          />

          <Field
            label="سؤال التحقق"
            value={word.question}
            onChange={(value) =>
              setWord({
                ...word,
                question: value,
              })
            }
          />

          <div className="grid gap-3 md:grid-cols-3">
            {word.options.map(
              (
                option,
                index
              ) => (
                <Field
                  key={index}
                  label={`الخيار ${
                    index + 1
                  }`}
                  value={option}
                  onChange={(
                    value
                  ) => {
                    const options =
                      [
                        ...word.options,
                      ];

                    options[
                      index
                    ] = value;

                    setWord({
                      ...word,
                      options,
                    });
                  }}
                />
              )
            )}
          </div>

          <SelectField
            label="الإجابة الصحيحة"
            value={
              word.correctIndex
            }
            onChange={(value) =>
              setWord({
                ...word,
                correctIndex:
                  Number(value),
              })
            }
            options={[
              {
                value: 0,
                label:
                  "الخيار الأول",
              },
              {
                value: 1,
                label:
                  "الخيار الثاني",
              },
              {
                value: 2,
                label:
                  "الخيار الثالث",
              },
            ]}
          />

          <Field
            label="التلميح"
            value={word.hint}
            onChange={(value) =>
              setWord({
                ...word,
                hint: value,
              })
            }
          />
        </SectionCard>

        {/* هل تعلم */}

        <SectionCard
          icon="💡"
          title="هل تعلم؟"
          description="معلومة قصيرة ومفيدة مرتبطة بمهارة الأسبوع."
          active={
            didYouKnow.published
          }
          onToggle={() =>
            setDidYouKnow(
              (
                current
              ) => ({
                ...current,
                published:
                  !current.published,
              })
            )
          }
        >
          <Field
            label="عنوان المعلومة"
            value={
              didYouKnow.title
            }
            onChange={(value) =>
              setDidYouKnow({
                ...didYouKnow,
                title: value,
              })
            }
          />

          <TextAreaField
            label="المعلومة"
            value={
              didYouKnow.text
            }
            onChange={(value) =>
              setDidYouKnow({
                ...didYouKnow,
                text: value,
              })
            }
          />
        </SectionCard>

        {/* التحدي */}

        <SectionCard
          icon="⚡"
          title="التحدي السريع"
          description="سؤال أسبوعي قصير مع تغذية راجعة مباشرة."
          active={
            challenge.published
          }
          onToggle={() =>
            setChallenge(
              (
                current
              ) => ({
                ...current,
                published:
                  !current.published,
              })
            )
          }
        >
          <Field
            label="السؤال"
            value={
              challenge.question
            }
            onChange={(value) =>
              setChallenge({
                ...challenge,
                question: value,
              })
            }
          />

          <div className="grid gap-3 md:grid-cols-3">
            {challenge.options.map(
              (
                option,
                index
              ) => (
                <Field
                  key={index}
                  label={`الخيار ${
                    index + 1
                  }`}
                  value={option}
                  onChange={(
                    value
                  ) => {
                    const options =
                      [
                        ...challenge.options,
                      ];

                    options[
                      index
                    ] = value;

                    setChallenge({
                      ...challenge,
                      options,
                    });
                  }}
                />
              )
            )}
          </div>

          <SelectField
            label="الإجابة الصحيحة"
            value={
              challenge.correctIndex
            }
            onChange={(value) =>
              setChallenge({
                ...challenge,
                correctIndex:
                  Number(value),
              })
            }
            options={[
              {
                value: 0,
                label:
                  "الخيار الأول",
              },
              {
                value: 1,
                label:
                  "الخيار الثاني",
              },
              {
                value: 2,
                label:
                  "الخيار الثالث",
              },
            ]}
          />

          <Field
            label="رسالة الإجابة الصحيحة"
            value={
              challenge.successMessage
            }
            onChange={(value) =>
              setChallenge({
                ...challenge,
                successMessage:
                  value,
              })
            }
          />
        </SectionCard>

        {/* شاهد وتعلم */}

        <SectionCard
          icon="🎬"
          title="شاهد وتعلّم"
          description="جاهز للمقاطع التعليمية القصيرة عند إضافتها لاحقًا."
          active={
            video.published
          }
          onToggle={() =>
            setVideo(
              (current) => ({
                ...current,
                published:
                  !current.published,
              })
            )
          }
        >
          <Field
            label="عنوان الفيديو"
            value={video.title}
            onChange={(value) =>
              setVideo({
                ...video,
                title: value,
              })
            }
          />

          <TextAreaField
            label="وصف الفيديو"
            value={
              video.description
            }
            onChange={(value) =>
              setVideo({
                ...video,
                description:
                  value,
              })
            }
          />

          <Field
            label="رابط الفيديو"
            value={
              video.videoUrl
            }
            onChange={(value) =>
              setVideo({
                ...video,
                videoUrl: value,
              })
            }
            dir="ltr"
          />

          <Field
            label="سؤال بعد المشاهدة"
            value={
              video.question
            }
            onChange={(value) =>
              setVideo({
                ...video,
                question: value,
              })
            }
          />
        </SectionCard>

        {/* الحفظ */}

        <section className="sticky bottom-3 z-20 mt-6 rounded-[28px] border border-emerald-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <p className="font-black text-slate-800">
                جاهز للنشر؟
              </p>

              <p className="text-sm text-slate-500">
                احفظ التغييرات
                ليقرأها ركن المختارات
                من Firestore.
              </p>
            </div>

            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="rounded-2xl bg-emerald-700 px-7 py-4 font-black text-white shadow-lg disabled:bg-slate-300"
            >
              {saving
                ? "⏳ جاري الحفظ..."
                : "💾 حفظ مختارات الأسبوع"}
            </button>
          </div>

          {message && (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-center font-black text-slate-700">
              {message}
            </div>
          )}
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>
          <br />
          إدارة مختارات الأسبوع ✨
        </footer>
      </div>
    </main>
  );
}

function SectionCard({
  icon,
  title,
  description,
  active,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-[30px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-3xl">
            {icon}
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-800">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-4 py-2 text-sm font-black ${
            active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {active
            ? "✅ منشور"
            : "⏸️ غير منشور"}
        </button>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  dir = "rtl",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <input
        dir={dir}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="min-h-[105px] w-full resize-y rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-bold leading-8 text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (
    value: string
  ) => void;
  options: {
    value: number;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 font-black text-slate-700 outline-none focus:border-emerald-300"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}