"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type GradeId =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6";

type SuspectId =
  | "salem"
  | "noura"
  | "majed"
  | "reem";

type Participant = {
  name: string;
  grade: GradeId;
  participantType: "student" | "visitor";
  studentId?: string;
};

type CaseQuestion = {
  id: string;
  title: string;
  clue: string;
  question: string;
  options: string[];
  answer: number;
};

const EVENT_START_AT =
  "2026-09-04T00:00:00+03:00";

const EVENT_END_AT =
  "2026-09-05T16:00:00+03:00";
const STORAGE_KEY =
  "lughati-detective-2026-09-04-official-v2-attempt";

const VISITOR_ID_KEY =
  "lughati-community-visitor-id";

type SavedResult = {
  durationSeconds: number;
  totalPoints: number | null;
  message: string;
};

const grades: {
  id: GradeId;
  label: string;
}[] = [
  { id: "2", label: "الصف الثاني" },
  { id: "3", label: "الصف الثالث" },
  { id: "4", label: "الصف الرابع" },
  { id: "5", label: "الصف الخامس" },
  { id: "6", label: "الصف السادس" },
];

const suspects: {
  id: SuspectId;
  name: string;
  role: string;
  icon: string;
  statement: string;
}[] = [
  {
    id: "salem",
    name: "سالم",
    role: "مسؤول ترتيب المنصة",
    icon: "🧑🏻‍💼",
    statement:
      "كنت أرتب البطاقات قرب المسرح قبل بداية الحفل.",
  },
  {
    id: "noura",
    name: "نورة",
    role: "مساعدة المكتبة",
    icon: "👩🏻‍💼",
    statement:
      "كنت في المكتبة أعيد الكتب إلى أماكنها.",
  },
  {
    id: "majed",
    name: "ماجد",
    role: "مصور الفعالية",
    icon: "📸",
    statement:
      "كنت ألتقط صورًا للساحة ولم أدخل غرفة الجوائز.",
  },
  {
    id: "reem",
    name: "ريم",
    role: "منظمة الحفل",
    icon: "🗂️",
    statement:
      "كنت أراجع قائمة الفائزين عند مكتب الاستقبال.",
  },
];

const casesByGrade: Record<
  GradeId,
  CaseQuestion[]
> = {
  "2": [
    {
      id: "g2-1",
      title: "الدليل الأول",
      clue:
        "وُجدت بطاقة بجانب الخزانة مكتوب عليها: «مَكْتَب»",
      question:
        "أي كلمة تبدأ بالحركة نفسها التي تبدأ بها كلمة «مَكْتَب»؟",
      options: [
        "مَدْرَسَة",
        "كِتاب",
        "سُوق",
      ],
      answer: 0,
    },
    {
      id: "g2-2",
      title: "الدليل الثاني",
      clue:
        "شاهد الحارس شخصًا يحمل «كِتابًا» ويتجه ناحية الممر.",
      question:
        "ما الحركة تحت حرف الكاف في كلمة «كِتاب»؟",
      options: [
        "الفتحة",
        "الكسرة",
        "الضمة",
      ],
      answer: 1,
    },
    {
      id: "g2-3",
      title: "الدليل الحاسم",
      clue:
        "وجد المحقق ورقة مكتوبًا فيها: «أعيدُ الكتبَ إلى أماكنها»",
      question:
        "أي مشتبه به قال كلامًا يطابق هذا الدليل؟",
      options: [
        "سالم",
        "نورة",
        "ماجد",
        "ريم",
      ],
      answer: 1,
    },
  ],

  "3": [
    {
      id: "g3-1",
      title: "الدليل الأول",
      clue:
        "وُجدت ورقة ممزقة قرب غرفة الجوائز تحمل كلمة «المكتبة».",
      question:
        "أي كلمة ترتبط بالمكتبة أكثر؟",
      options: [
        "الكتب",
        "الكاميرا",
        "المسرح",
      ],
      answer: 0,
    },
    {
      id: "g3-2",
      title: "الدليل الثاني",
      clue:
        "قال الحارس: رأيت شخصًا يحمل ثلاثة كتب ويمشي بسرعة.",
      question:
        "أي عبارة توافق وصف الحارس؟",
      options: [
        "يلتقط الصور",
        "يعيد الكتب",
        "يرتب البطاقات",
      ],
      answer: 1,
    },
    {
      id: "g3-3",
      title: "الدليل الحاسم",
      clue:
        "أحد المشتبه بهم ذكر بنفسه أنه كان يعيد الكتب إلى أماكنها.",
      question:
        "من صاحب هذه العبارة؟",
      options: [
        "سالم",
        "نورة",
        "ماجد",
        "ريم",
      ],
      answer: 1,
    },
  ],

  "4": [
    {
      id: "g4-1",
      title: "الدليل الأول",
      clue:
        "البصمة الموجودة على الورقة كانت بجانب ختم المكتبة، لا بجانب المسرح.",
      question:
        "أي موقع أصبح أكثر ارتباطًا بالقضية؟",
      options: [
        "المكتبة",
        "المسرح",
        "الاستقبال",
      ],
      answer: 0,
    },
    {
      id: "g4-2",
      title: "الدليل الثاني",
      clue:
        "التقطت الكاميرا صورة لشخص يحمل كتبًا قبل اختفاء الكأس بدقائق.",
      question:
        "أي شهادة تتفق مع الصورة؟",
      options: [
        "كنت أصور الساحة",
        "كنت أعيد الكتب",
        "كنت أراجع الفائزين",
      ],
      answer: 1,
    },
    {
      id: "g4-3",
      title: "الدليل الحاسم",
      clue:
        "المشتبه به الذي كان في المكتبة هو الوحيد الذي ذكر الكتب في إفادته.",
      question:
        "من تنطبق عليه الأدلة؟",
      options: [
        "سالم",
        "نورة",
        "ماجد",
        "ريم",
      ],
      answer: 1,
    },
  ],

  "5": [
    {
      id: "g5-1",
      title: "الدليل الأول",
      clue:
        "سجلّ الدخول إلى الممر أظهر مرور بطاقة مرتبطة بقسم المكتبة.",
      question:
        "ما الاستنتاج الأقوى من هذا الدليل؟",
      options: [
        "المشتبه به مرّ قرب الممر",
        "المصور حذف الصور",
        "الحفل أُلغي",
      ],
      answer: 0,
    },
    {
      id: "g5-2",
      title: "الدليل الثاني",
      clue:
        "في إفادات المشتبه بهم، شخص واحد فقط ذكر نشاطًا مرتبطًا بالكتب.",
      question:
        "أي إفادة هي المقصودة؟",
      options: [
        "ترتيب البطاقات",
        "إعادة الكتب",
        "التصوير",
        "مراجعة الفائزين",
      ],
      answer: 1,
    },
    {
      id: "g5-3",
      title: "الدليل الحاسم",
      clue:
        "وجدت ورقة من سجل المكتبة في مكان اختفاء الكأس، وتطابق وقتها مع زمن الحادثة.",
      question:
        "من أصبح المشتبه به الأقوى وفق الأدلة مجتمعة؟",
      options: [
        "سالم",
        "نورة",
        "ماجد",
        "ريم",
      ],
      answer: 1,
    },
  ],

  "6": [
    {
      id: "g6-1",
      title: "الدليل الأول",
      clue:
        "سجل الممر يثبت أن بطاقة قسم المكتبة استُخدمت قبل اختفاء الكأس بأربع دقائق.",
      question:
        "أي استنتاج يمكن إثباته دون مبالغة؟",
      options: [
        "صاحب البطاقة هو السارق قطعًا",
        "بطاقة مرتبطة بالمكتبة مرت بالممر",
        "جميع المشتبه بهم كانوا في المكتبة",
      ],
      answer: 1,
    },
    {
      id: "g6-2",
      title: "الدليل الثاني",
      clue:
        "ثلاث إفادات تتعلق بالمسرح أو التصوير أو الاستقبال، وإفادة واحدة مرتبطة بالمكتبة.",
      question:
        "أي إفادة تتقاطع مباشرة مع سجل الممر؟",
      options: [
        "إعادة الكتب",
        "التصوير",
        "ترتيب البطاقات",
        "مراجعة الفائزين",
      ],
      answer: 0,
    },
    {
      id: "g6-3",
      title: "الدليل الحاسم",
      clue:
        "وُجدت قصاصة من سجل إعادة الكتب داخل غرفة الجوائز، وتحمل التوقيت نفسه تقريبًا.",
      question:
        "من هو المشتبه به الذي تتقاطع معه الأدلة الثلاثة؟",
      options: [
        "سالم",
        "نورة",
        "ماجد",
        "ريم",
      ],
      answer: 1,
    },
  ],
};

function riyadhDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(
    totalSeconds / 60
  );
  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function getOrCreateVisitorId() {
  const existing =
    window.localStorage.getItem(
      VISITOR_ID_KEY
    );

  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;

  window.localStorage.setItem(
    VISITOR_ID_KEY,
    generated
  );

  return generated;
}

function getAcademyStudent() {
  const studentId =
    window.localStorage.getItem(
      "student-id"
    )?.trim() ?? "";

  const studentName =
    window.localStorage.getItem(
      "student-name"
    )?.trim() ?? "";

  const studentClassroom =
    window.localStorage.getItem(
      "student-classroom"
    )?.trim() ?? "";

  if (!studentId || !studentName) {
    return null;
  }

  const gradeMatch =
    studentClassroom.match(/[2-6٢-٦]/);

  const arabicToEnglish: Record<
    string,
    GradeId
  > = {
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
  };

  const detectedGrade =
    gradeMatch?.[0]
      ? ((arabicToEnglish[
          gradeMatch[0]
        ] ??
          gradeMatch[0]) as GradeId)
      : null;

  return {
    studentId,
    studentName,
    detectedGrade:
      detectedGrade &&
      ["2", "3", "4", "5", "6"].includes(
        detectedGrade
      )
        ? detectedGrade
        : null,
  };
}

export default function DetectiveChallengePage() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [academyStudent, setAcademyStudent] =
    useState<{
      studentId: string;
      studentName: string;
      detectedGrade: GradeId | null;
    } | null>(null);

  const [participant, setParticipant] =
    useState<Participant | null>(null);

  const [name, setName] =
    useState("");

  const [grade, setGrade] =
    useState<GradeId>("2");

  const [startedAt, setStartedAt] =
    useState<number | null>(null);

  const [elapsed, setElapsed] =
    useState(0);

  const [step, setStep] =
    useState(0);

  const [answers, setAnswers] =
    useState<number[]>([]);

  const [selectedSuspect, setSelectedSuspect] =
    useState<SuspectId | null>(null);

  const [finished, setFinished] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [alreadyPlayed, setAlreadyPlayed] =
    useState(false);

  const [savingResult, setSavingResult] =
    useState(false);

  const [savedResult, setSavedResult] =
    useState<SavedResult | null>(null);

  const [saveError, setSaveError] =
    useState("");

  const nowMs = Date.now();

  const isEventDay =
    isPreview ||
    (
      nowMs >=
        Date.parse(
          EVENT_START_AT
        ) &&
      nowMs <
        Date.parse(
          EVENT_END_AT
        )
    );

  const questions = useMemo(
    () =>
      participant
        ? casesByGrade[
            participant.grade
          ]
        : [],
    [participant]
  );

  useEffect(() => {
    const currentStudent =
      getAcademyStudent();

    setAcademyStudent(
      currentStudent
    );

    if (currentStudent) {
      setName(
        currentStudent.studentName
      );

      if (
        currentStudent.detectedGrade
      ) {
        setGrade(
          currentStudent.detectedGrade
        );
      }
    }
  }, []);

  useEffect(() => {
    /*
      وضع المعاينة لا يفحص المحاولة الرسمية،
      حتى يمكن للمعلم إعادة الاختبار أكثر من مرة.
    */
    if (isPreview) {
      setAlreadyPlayed(false);
      return;
    }

    const saved =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    setAlreadyPlayed(
      Boolean(saved)
    );
  }, [isPreview]);

  useEffect(() => {
    if (
      !startedAt ||
      finished
    ) {
      return;
    }

    const update = () => {
      setElapsed(
        Math.max(
          0,
          Math.floor(
            (Date.now() -
              startedAt) /
              1000
          )
        )
      );
    };

    update();

    const timer =
      window.setInterval(
        update,
        1000
      );

    return () =>
      window.clearInterval(timer);
  }, [startedAt, finished]);

  function startChallenge(
    event: FormEvent
  ) {
    event.preventDefault();

    const cleanName =
      name.trim();

    if (!cleanName) {
      window.alert(
        "اكتب اسمك أولًا."
      );
      return;
    }

    if (alreadyPlayed) {
      window.alert(
        "تم تسجيل محاولة على هذا الجهاز لهذا التحدي."
      );
      return;
    }

    setParticipant({
      name: academyStudent
        ? academyStudent.studentName
        : cleanName,
      grade:
        academyStudent?.detectedGrade ??
        grade,
      participantType:
        academyStudent
          ? "student"
          : "visitor",
      studentId:
        academyStudent?.studentId,
    });

    setStartedAt(
      Date.now()
    );
  }

  function chooseAnswer(
    answerIndex: number
  ) {
    const currentQuestion =
      questions[step];

    if (!currentQuestion) {
      return;
    }

    if (
      answerIndex !==
      currentQuestion.answer
    ) {
      window.alert(
        "🔎 هذا الاستنتاج غير صحيح. راجع الدليل وحاول مرة أخرى."
      );
      return;
    }

    const updatedAnswers = [
      ...answers,
      answerIndex,
    ];

    setAnswers(
      updatedAnswers
    );

    if (
      step <
      questions.length - 1
    ) {
      setStep(
        (value) =>
          value + 1
      );
    } else {
      setStep(
        questions.length
      );
    }
  }

  async function submitAccusation() {
    if (!selectedSuspect) {
      window.alert(
        "اختر المشتبه به قبل إغلاق القضية."
      );
      return;
    }

    const solved =
      selectedSuspect ===
      "noura";

    setSuccess(solved);

    if (!solved) {
      window.alert(
        "❌ الاتهام غير صحيح. راجع الأدلة قبل اعتماد قرارك."
      );
      return;
    }

    if (
      !participant ||
      !startedAt ||
      savingResult
    ) {
      return;
    }

    const finalDuration =
      Math.max(
        1,
        Math.floor(
          (Date.now() -
            startedAt) /
            1000
        )
      );

    setElapsed(
      finalDuration
    );
    setSavingResult(true);
    setSaveError("");

    try {
      const visitorId =
        participant.participantType ===
        "visitor"
          ? getOrCreateVisitorId()
          : undefined;

      const response =
        await fetch(
          "/api/detective-result",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              challengeId:
                "detective-2026-09-04",
              visitorId,
              participantType:
                participant.participantType,
              studentId:
                participant.studentId,
              name:
                participant.name,
              grade:
                participant.grade,
              durationSeconds:
                finalDuration,
              preview:
                isPreview,
            }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          duplicate?: boolean;
          totalPoints?: number | null;
          message?: string;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر حفظ النتيجة."
        );
      }

      setSavedResult({
        durationSeconds:
          finalDuration,
        totalPoints:
          typeof data.totalPoints ===
          "number"
            ? data.totalPoints
            : null,
        message:
          data.message ||
          "تم حفظ النتيجة الرسمية.",
      });

      setFinished(true);

      /*
        المعاينة لا تُنشئ أي علامة محاولة محلية رسمية.
        النتيجة الرسمية فقط هي التي تمنع إعادة المحاولة.
      */
      if (!isPreview) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            name:
              participant.name,
            grade:
              participant.grade,
            completedAt:
              new Date().toISOString(),
            durationSeconds:
              finalDuration,
            correct: true,
          })
        );

        setAlreadyPlayed(true);
      }
    } catch (error) {
      console.error(
        "تعذر حفظ نتيجة تحدي المحقق:",
        error
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "تعذر حفظ النتيجة."
      );
    } finally {
      setSavingResult(false);
    }
  }

  if (!isEventDay) {
    return (
      <main
        dir="rtl"
        style={styles.page}
      >
        <div
          style={
            styles.centerWrap
          }
        >
          <div
            style={
              styles.closedCard
            }
          >
            <div
              style={{
                fontSize: 64,
              }}
            >
              🔒
            </div>

            <div
              style={
                styles.secretBadge
              }
            >
              ملف سري
            </div>

            <h1
              style={
                styles.closedTitle
              }
            >
              تحدّي المحقّق
            </h1>

            <p
              style={
                styles.closedText
              }
            >
              انتهت فترة القضية.
              كانت متاحة من الجمعة
              4 سبتمبر حتى السبت
              5 سبتمبر الساعة 4:00
              مساءً بتوقيت الرياض.
            </p>

            <Link
              href="/games"
              style={
                styles.backButton
              }
            >
              ← العودة إلى
              الألعاب
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!participant) {
    return (
      <main
        dir="rtl"
        style={styles.page}
      >
        <div
          style={styles.shell}
        >
          <div
            style={
              styles.topBar
            }
          >
            <Link
              href="/games"
              style={
                styles.smallBack
              }
            >
              ← الألعاب
            </Link>

            <span
              style={
                styles.liveBadge
              }
            >
              {isPreview
                ? "🧪 وضع المعاينة"
                : "🔴 ممتد حتى السبت 4:00 م"}
            </span>
          </div>

          <section
            style={
              styles.hero
            }
          >
            <div
              style={
                styles.caseNumber
              }
            >
              CASE #0904
            </div>

            <div
              style={{
                fontSize: 76,
              }}
            >
              🕵️
            </div>

            <h1
              style={
                styles.heroTitle
              }
            >
              قضية الكأس
              الذهبي المفقود
            </h1>

            <p
              style={
                styles.heroText
              }
            >
              اختفى كأس أبطال
              لغتي قبل دقائق من
              حفل التكريم.
              أمامك أدلة،
              مشتبه بهم، ووقت
              يُحسب منذ فتح
              الملف.
            </p>

            <div
              style={
                styles.prizeBar
              }
            >
              🏆 التحدّي ممتد حتى السبت
              5 سبتمبر الساعة 4:00 م
              • الأول 5 نقاط • الثاني 3
              • الثالث 2
            </div>
          </section>

          <section
            style={
              styles.entryCard
            }
          >
            <div>
              <span
                style={
                  styles.secretBadge
                }
              >
                {academyStudent
                  ? "🎓 دخول طالب الأكاديمية"
                  : "دخول الزائر"}
              </span>

              <h2
                style={
                  styles.entryTitle
                }
              >
                سجّل بيانات
                المحقّق
              </h2>

              <p
                style={
                  styles.muted
                }
              >
                {academyStudent
                  ? "تم التعرّف على حسابك تلقائيًا دون قراءة إضافية من Firestore."
                  : "نحتاج الاسم والصف فقط."}
              </p>
            </div>

            <form
              onSubmit={
                startChallenge
              }
              style={
                styles.form
              }
            >
              <label
                style={
                  styles.label
                }
              >
                الاسم
                <input
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="اكتب اسمك"
                  style={
                    styles.input
                  }
                  maxLength={40}
                  readOnly={
                    Boolean(
                      academyStudent
                    )
                  }
                />
              </label>

              <label
                style={
                  styles.label
                }
              >
                الصف
                <select
                  value={
                    grade
                  }
                  onChange={(
                    event
                  ) =>
                    setGrade(
                      event
                        .target
                        .value as GradeId
                    )
                  }
                  style={
                    styles.input
                  }
                  disabled={
                    Boolean(
                      academyStudent?.detectedGrade
                    )
                  }
                >
                  {grades.map(
                    (item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <button
                type="submit"
                style={
                  styles.startButton
                }
              >
                فتح ملف القضية
                🔐
              </button>
            </form>

            {alreadyPlayed && (
              <div
                style={
                  styles.warning
                }
              >
                ⚠️ توجد محاولة
                مسجلة على هذا
                الجهاز. عند ربط
                المرحلة التالية
                بالخادم ستكون
                المحاولة الرسمية
                محفوظة بالحساب.
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main
        dir="rtl"
        style={styles.page}
      >
        <div
          style={
            styles.centerWrap
          }
        >
          <section
            style={
              styles.resultCard
            }
          >
            <div
              style={{
                fontSize: 78,
              }}
            >
              🏆
            </div>

            <div
              style={
                styles.secretBadge
              }
            >
              القضية أُغلقت
            </div>

            <h1
              style={
                styles.resultTitle
              }
            >
              أحسنت يا{" "}
              {
                participant.name
              }
            </h1>

            <p
              style={
                styles.resultText
              }
            >
              جمعت الأدلة
              واتخذت القرار
              الصحيح.
            </p>

            <div
              style={
                styles.timeResult
              }
            >
              ⏱️ وقت الحل:{" "}
              {formatTime(
                savedResult?.durationSeconds ??
                  elapsed
              )}
            </div>

            <p
              style={
                styles.resultNote
              }
            >
              {savedResult?.message ??
                "تم حفظ النتيجة الرسمية."}
            </p>

            {savedResult?.totalPoints !==
              null &&
              savedResult?.totalPoints !==
                undefined && (
                <div
                  style={
                    styles.pointsBox
                  }
                >
                  ⭐ رصيد مجتمع لغتي:{" "}
                  <strong>
                    {
                      savedResult.totalPoints
                    }
                    /50
                  </strong>
                </div>
              )}

            <Link
              href="/games"
              style={
                styles.startButton
              }
            >
              العودة إلى ساحة
              الألعاب
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={styles.page}
    >
      <div
        style={styles.shell}
      >
        <div
          style={
            styles.investigationBar
          }
        >
          <div>
            <small
              style={
                styles.miniLabel
              }
            >
              المحقّق
            </small>

            <strong>
              {participant.name}
            </strong>

            <span
              style={
                styles.gradePill
              }
            >
              {
                grades.find(
                  (item) =>
                    item.id ===
                    participant.grade
                )?.label
              }
            </span>
          </div>

          <div
            style={
              styles.timer
            }
          >
            ⏱️{" "}
            {formatTime(
              elapsed
            )}
          </div>
        </div>

        <section
          style={
            styles.caseHeader
          }
        >
          <span
            style={
              styles.secretBadge
            }
          >
            🔴 ملف سري
          </span>

          <h1
            style={
              styles.caseTitle
            }
          >
            قضية الكأس الذهبي
            المفقود
          </h1>

          <p
            style={
              styles.caseText
            }
          >
            لا تتهم أحدًا قبل
            جمع الأدلة. كل دليل
            صحيح يفتح الخطوة
            التالية.
          </p>
        </section>

        <section
          style={
            styles.progressWrap
          }
        >
          <div
            style={
              styles.progressHead
            }
          >
            <strong>
              تقدّم التحقيق
            </strong>

            <span>
              {Math.min(
                step,
                questions.length
              )}
              /{questions.length}
            </span>
          </div>

          <div
            style={
              styles.progressTrack
            }
          >
            <div
              style={{
                ...styles.progressFill,
                width: `${
                  (Math.min(
                    step,
                    questions.length
                  ) /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </section>

        {step <
          questions.length && (
          <section
            style={
              styles.evidenceCard
            }
          >
            <div
              style={
                styles.evidenceTop
              }
            >
              <span
                style={
                  styles.evidenceIcon
                }
              >
                🔍
              </span>

              <div>
                <small
                  style={
                    styles.miniLabel
                  }
                >
                  الدليل رقم{" "}
                  {step + 1}
                </small>

                <h2
                  style={
                    styles.evidenceTitle
                  }
                >
                  {
                    questions[
                      step
                    ].title
                  }
                </h2>
              </div>
            </div>

            <div
              style={
                styles.clueBox
              }
            >
              {
                questions[step]
                  .clue
              }
            </div>

            <h3
              style={
                styles.question
              }
            >
              {
                questions[step]
                  .question
              }
            </h3>

            <div
              style={
                styles.options
              }
            >
              {questions[
                step
              ].options.map(
                (
                  option,
                  index
                ) => (
                  <button
                    key={
                      option
                    }
                    type="button"
                    onClick={() =>
                      chooseAnswer(
                        index
                      )
                    }
                    style={
                      styles.optionButton
                    }
                  >
                    <span
                      style={
                        styles.optionNumber
                      }
                    >
                      {index + 1}
                    </span>
                    {option}
                  </button>
                )
              )}
            </div>
          </section>
        )}

        {step ===
          questions.length && (
          <>
            <section
              style={
                styles.suspectSection
              }
            >
              <div
                style={
                  styles.finalBadge
                }
              >
                🚨 القرار النهائي
              </div>

              <h2
                style={
                  styles.finalTitle
                }
              >
                من المشتبه به
                الذي تشير إليه
                الأدلة؟
              </h2>

              <div
                style={
                  styles.suspectGrid
                }
              >
                {suspects.map(
                  (suspect) => {
                    const selected =
                      selectedSuspect ===
                      suspect.id;

                    return (
                      <button
                        key={
                          suspect.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedSuspect(
                            suspect.id
                          )
                        }
                        style={{
                          ...styles.suspectCard,
                          ...(selected
                            ? styles.suspectSelected
                            : {}),
                        }}
                      >
                        <span
                          style={{
                            fontSize: 38,
                          }}
                        >
                          {
                            suspect.icon
                          }
                        </span>

                        <strong
                          style={{
                            fontSize: 19,
                          }}
                        >
                          {
                            suspect.name
                          }
                        </strong>

                        <small
                          style={
                            styles.suspectRole
                          }
                        >
                          {
                            suspect.role
                          }
                        </small>

                        <p
                          style={
                            styles.statement
                          }
                        >
                          «
                          {
                            suspect.statement
                          }
                          »
                        </p>
                      </button>
                    );
                  }
                )}
              </div>

              <button
                type="button"
                onClick={
                  submitAccusation
                }
                disabled={
                  savingResult
                }
                style={{
                  ...styles.accuseButton,
                  opacity:
                    savingResult
                      ? 0.65
                      : 1,
                  cursor:
                    savingResult
                      ? "wait"
                      : "pointer",
                }}
              >
                {savingResult
                  ? "جارٍ اعتماد النتيجة... ⏳"
                  : "اعتماد الاتهام وإغلاق القضية 🔐"}
              </button>

              {saveError && (
                <div
                  style={
                    styles.warning
                  }
                >
                  ⚠️ {saveError}
                  <br />
                  لم تُغلق القضية؛
                  يمكنك المحاولة
                  مرة أخرى لحفظ
                  النتيجة.
                </div>
              )}

              {success && (
                <p>
                  تم الحل بنجاح.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #16324a 0%, #08121f 42%, #050a10 100%)",
    color: "#f8fafc",
    fontFamily:
      "Arial, sans-serif",
    padding: "24px 14px 70px",
  },

  shell: {
    maxWidth: 980,
    margin: "0 auto",
  },

  centerWrap: {
    minHeight: "82vh",
    display: "grid",
    placeItems: "center",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  smallBack: {
    textDecoration: "none",
    color: "#e2e8f0",
    background:
      "rgba(255,255,255,.08)",
    border:
      "1px solid rgba(255,255,255,.12)",
    padding: "10px 14px",
    borderRadius: 14,
    fontWeight: 900,
  },

  liveBadge: {
    background: "#7f1d1d",
    border:
      "1px solid #ef4444",
    padding: "9px 13px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    textAlign: "center",
    padding: "36px 20px",
    borderRadius: 30,
    background:
      "linear-gradient(135deg, rgba(16,42,67,.96), rgba(8,18,31,.98) 55%, rgba(116,74,12,.88))",
    border:
      "1px solid rgba(245,193,83,.28)",
    boxShadow:
      "0 26px 70px rgba(0,0,0,.35)",
    marginBottom: 22,
  },

  caseNumber: {
    display: "inline-block",
    letterSpacing: 2,
    fontFamily:
      "monospace",
    color: "#facc15",
    border:
      "1px solid rgba(250,204,21,.35)",
    padding: "7px 10px",
    borderRadius: 8,
    marginBottom: 14,
    fontWeight: 900,
  },

  heroTitle: {
    fontSize:
      "clamp(34px,7vw,60px)",
    margin: "8px 0 12px",
    lineHeight: 1.2,
  },

  heroText: {
    maxWidth: 720,
    margin: "0 auto",
    lineHeight: 1.9,
    fontSize: 17,
    color: "#d9e4ee",
  },

  prizeBar: {
    display: "inline-flex",
    marginTop: 22,
    background:
      "linear-gradient(135deg, #d29a24, #f6d365)",
    color: "#241600",
    padding: "12px 17px",
    borderRadius: 999,
    fontWeight: 900,
    boxShadow:
      "0 10px 26px rgba(225,173,45,.22)",
  },

  entryCard: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: 24,
    padding: 24,
    borderRadius: 25,
    background:
      "rgba(11,25,40,.92)",
    border:
      "1px solid rgba(148,163,184,.17)",
  },

  entryTitle: {
    fontSize: 28,
    margin: "10px 0 7px",
  },

  muted: {
    margin: 0,
    color: "#aebdca",
    lineHeight: 1.7,
  },

  form: {
    display: "grid",
    gap: 14,
  },

  label: {
    display: "grid",
    gap: 8,
    fontWeight: 900,
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box",
    border:
      "1px solid #35485b",
    borderRadius: 14,
    padding: "14px 15px",
    background: "#0a1724",
    color: "#fff",
    fontSize: 16,
    outline: "none",
  },

  startButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    border: 0,
    borderRadius: 15,
    padding: "14px 18px",
    background:
      "linear-gradient(135deg, #d59b22, #f7d36a)",
    color: "#211600",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 12px 26px rgba(225,170,40,.17)",
  },

  warning: {
    gridColumn: "1 / -1",
    padding: 13,
    borderRadius: 13,
    background:
      "rgba(127,29,29,.2)",
    border:
      "1px solid rgba(239,68,68,.28)",
    color: "#fecaca",
    lineHeight: 1.6,
  },

  investigationBar: {
    position: "sticky",
    top: 10,
    zIndex: 20,
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 14,
    padding: "13px 15px",
    borderRadius: 18,
    background:
      "rgba(5,10,16,.9)",
    backdropFilter:
      "blur(12px)",
    border:
      "1px solid rgba(148,163,184,.18)",
    boxShadow:
      "0 12px 30px rgba(0,0,0,.25)",
    marginBottom: 18,
  },

  miniLabel: {
    display: "block",
    color: "#93a8ba",
    fontWeight: 900,
    marginBottom: 4,
  },

  gradePill: {
    display: "inline-flex",
    marginRight: 8,
    padding: "5px 8px",
    borderRadius: 999,
    background:
      "rgba(59,130,246,.16)",
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: 900,
  },

  timer: {
    fontFamily:
      "monospace",
    fontWeight: 900,
    fontSize: 20,
    background:
      "rgba(220,38,38,.13)",
    border:
      "1px solid rgba(239,68,68,.25)",
    color: "#fecaca",
    padding: "9px 12px",
    borderRadius: 12,
  },

  caseHeader: {
    textAlign: "center",
    padding: "22px 15px",
  },

  secretBadge: {
    display: "inline-flex",
    background:
      "rgba(239,68,68,.13)",
    color: "#fecaca",
    border:
      "1px solid rgba(239,68,68,.28)",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 900,
  },

  caseTitle: {
    fontSize:
      "clamp(30px,6vw,48px)",
    margin: "12px 0 8px",
  },

  caseText: {
    color: "#b8c6d4",
    lineHeight: 1.8,
    margin: 0,
  },

  progressWrap: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    background:
      "rgba(255,255,255,.05)",
    border:
      "1px solid rgba(255,255,255,.08)",
  },

  progressHead: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: 10,
  },

  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    background:
      "rgba(255,255,255,.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg,#d29a24,#f8de83)",
    transition:
      "width .3s ease",
  },

  evidenceCard: {
    padding: "24px",
    borderRadius: 25,
    background:
      "linear-gradient(145deg, rgba(13,31,48,.98), rgba(7,17,28,.98))",
    border:
      "1px solid rgba(148,163,184,.16)",
    boxShadow:
      "0 20px 55px rgba(0,0,0,.25)",
  },

  evidenceTop: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    marginBottom: 16,
  },

  evidenceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 27,
    background:
      "rgba(245,158,11,.12)",
    border:
      "1px solid rgba(245,158,11,.22)",
  },

  evidenceTitle: {
    margin: 0,
    fontSize: 25,
  },

  clueBox: {
    padding: "17px",
    borderRadius: 16,
    background:
      "repeating-linear-gradient(-45deg, rgba(255,255,255,.045), rgba(255,255,255,.045) 10px, rgba(255,255,255,.025) 10px, rgba(255,255,255,.025) 20px)",
    borderRight:
      "4px solid #d7a534",
    lineHeight: 1.9,
    fontSize: 17,
  },

  question: {
    fontSize: 21,
    margin: "22px 0 13px",
  },

  options: {
    display: "grid",
    gap: 10,
  },

  optionButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "right",
    border:
      "1px solid #304459",
    background: "#0b1a29",
    color: "#f8fafc",
    borderRadius: 15,
    padding: "13px 14px",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 800,
  },

  optionNumber: {
    minWidth: 31,
    height: 31,
    borderRadius: 9,
    display: "grid",
    placeItems: "center",
    background:
      "rgba(250,204,21,.12)",
    color: "#fde68a",
    fontWeight: 900,
  },

  suspectSection: {
    padding: "25px",
    borderRadius: 25,
    background:
      "rgba(9,22,35,.98)",
    border:
      "1px solid rgba(239,68,68,.2)",
  },

  finalBadge: {
    display: "inline-flex",
    padding: "8px 11px",
    borderRadius: 999,
    background:
      "rgba(220,38,38,.15)",
    color: "#fecaca",
    fontWeight: 900,
    fontSize: 13,
  },

  finalTitle: {
    fontSize: 28,
    margin: "13px 0 20px",
  },

  suspectGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(190px,1fr))",
    gap: 12,
  },

  suspectCard: {
    display: "grid",
    gap: 6,
    textAlign: "center",
    border:
      "1px solid #2c4053",
    borderRadius: 18,
    background: "#0a1826",
    color: "#fff",
    padding: 16,
    cursor: "pointer",
  },

  suspectSelected: {
    border:
      "2px solid #f6c453",
    background:
      "rgba(166,113,19,.18)",
    boxShadow:
      "0 0 0 4px rgba(246,196,83,.06)",
  },

  suspectRole: {
    color: "#9fb0bf",
  },

  statement: {
    margin: "5px 0 0",
    lineHeight: 1.6,
    fontSize: 13,
    color: "#ccd6df",
  },

  accuseButton: {
    width: "100%",
    marginTop: 18,
    border: 0,
    borderRadius: 16,
    padding: "15px 18px",
    background:
      "linear-gradient(135deg,#b91c1c,#ef4444)",
    color: "#fff",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
  },

  resultCard: {
    width: "min(650px,100%)",
    textAlign: "center",
    padding: "34px 22px",
    borderRadius: 30,
    background:
      "linear-gradient(145deg,#102a43,#08121f)",
    border:
      "1px solid rgba(245,193,83,.28)",
    boxShadow:
      "0 28px 70px rgba(0,0,0,.38)",
  },

  resultTitle: {
    fontSize: 38,
    margin: "14px 0 8px",
  },

  resultText: {
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 1.8,
  },

  timeResult: {
    display: "inline-flex",
    padding: "12px 16px",
    borderRadius: 14,
    background:
      "rgba(245,193,83,.13)",
    color: "#fde68a",
    fontFamily:
      "monospace",
    fontSize: 22,
    fontWeight: 900,
    margin: "8px 0 12px",
  },

  resultNote: {
    color: "#9fb0bf",
    lineHeight: 1.7,
  },

  pointsBox: {
    margin: "8px auto 18px",
    padding: "12px 16px",
    borderRadius: 14,
    background:
      "rgba(34,197,94,.12)",
    border:
      "1px solid rgba(34,197,94,.22)",
    color: "#bbf7d0",
    fontSize: 17,
    fontWeight: 900,
  },

  closedCard: {
    width: "min(620px,100%)",
    textAlign: "center",
    padding: "35px 22px",
    borderRadius: 28,
    background:
      "rgba(10,24,38,.96)",
    border:
      "1px solid rgba(148,163,184,.16)",
  },

  closedTitle: {
    fontSize: 36,
    margin: "13px 0 8px",
  },

  closedText: {
    color: "#b7c5d1",
    lineHeight: 1.8,
    marginBottom: 22,
  },

  backButton: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#fff",
    color: "#102a43",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 900,
  },
};
