"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../../firebase";

/*
 * =====================================================
 * أنواع البيانات
 * =====================================================
 */

type Level = {
  number: number;
  icon: string;
  title: string;
  requirement: number;
  description: string;
};

type ChallengeText = {
  id: string;
  text: string;
};

type ProgressData = {
  totalApprovedDays?: number;
  fluencyLevel?: number;
};

type PromotionResponse = {
  success?: boolean;
  preview?: boolean;
  status?: string;
  message?: string;
};

/*
 * =====================================================
 * مستويات قمة الطلاقة
 * =====================================================
 *
 * requirement:
 * عدد القراءات المنزلية المعتمدة
 * اللازمة لفتح اختبار المستوى.
 *
 * مهم:
 * القراءة لا ترفع الطالب.
 * المعلم هو من يعتمد الترقية.
 */

const LEVELS: Level[] = [
  {
    number: 1,
    icon: "🌱",
    title: "القارئ المنطلق",
    requirement: 0,
    description:
      "بداية الرحلة وبناء عادة القراءة اليومية.",
  },
  {
    number: 2,
    icon: "⭐",
    title: "القارئ المتقدم",
    requirement: 3,
    description:
      "قراءة كلمات وجمل قصيرة بثقة أكبر.",
  },
  {
    number: 3,
    icon: "🥉",
    title: "القارئ الواثق",
    requirement: 7,
    description:
      "قراءة فقرة قصيرة مع تقليل التوقف والتهجئة.",
  },
  {
    number: 4,
    icon: "🥈",
    title: "القارئ المتمكن",
    requirement: 12,
    description:
      "دقة أعلى مع الوقف السليم واستمرار القراءة.",
  },
  {
    number: 5,
    icon: "🥇",
    title: "القارئ المتميز",
    requirement: 17,
    description:
      "طلاقة مناسبة وفهم أفضل لمعنى النص.",
  },
  {
    number: 6,
    icon: "🏆",
    title: "بطل القراءة",
    requirement: 23,
    description:
      "الاستعداد لقراءة نص جديد لم يسبق التدريب عليه.",
  },
  {
    number: 7,
    icon: "👑",
    title: "فارس الطلاقة",
    requirement: 30,
    description:
      "قراءة معبرة وواثقة بأخطاء قليلة جدًا.",
  },
  {
    number: 8,
    icon: "💎",
    title: "سفير القراءة",
    requirement: 37,
    description:
      "قمة الطلاقة: دقة وطلاقة وتعبير وفهم.",
  },
];

/*
 * =====================================================
 * نصوص اختبارات الترقية
 * =====================================================
 *
 * لكل مستوى أكثر من نص.
 *
 * عند إعادة المحاولة:
 * لا يظهر النص السابق مباشرة.
 */

const CHALLENGE_TEXTS: Record<
  number,
  ChallengeText[]
> = {
  2: [
    {
      id: "l2-01",
      text:
        "ذهب خالد مع أبيه إلى الحديقة. شاهد الأشجار والزهور الجميلة، ثم جلس تحت شجرة كبيرة يقرأ قصة قصيرة.",
    },
    {
      id: "l2-02",
      text:
        "استيقظت سارة مبكرًا، ورتبت غرفتها، ثم تناولت فطورها. حملت حقيبتها وذهبت إلى المدرسة وهي سعيدة.",
    },
    {
      id: "l2-03",
      text:
        "في صباح جميل خرج عمر إلى فناء المنزل. سقى النباتات بالماء، وشاهد عصفورًا صغيرًا يقف فوق السور.",
    },
    {
      id: "l2-04",
      text:
        "عاد مازن من المدرسة، وغسل يديه، ثم جلس مع أسرته لتناول الغداء. بعد ذلك فتح كتابه وقرأ درسه.",
    },
    {
      id: "l2-05",
      text:
        "تحب نورة القراءة كل مساء. تختار قصة قصيرة، وتجلس في مكان هادئ، ثم تحكي لأمها أجمل ما قرأت.",
    },
    {
      id: "l2-06",
      text:
        "زار فهد جده يوم الجمعة. فرح الجد بزيارته، وجلس معه في المجلس، ثم استمع فهد إلى قصة جميلة.",
    },
  ],

  3: [
    {
      id: "l3-01",
      text:
        "خرج سامي مع أسرته في نزهة إلى البحر. حمل حقيبته الصغيرة، ولعب بالرمل، ثم جلس بجوار والده يشاهد الأمواج وهي تقترب من الشاطئ.",
    },
    {
      id: "l3-02",
      text:
        "تحرص هدى على ترتيب مكتبها قبل أن تبدأ واجباتها. تضع الكتب في مكانها، وتجهز أقلامها، ثم تبدأ العمل بهدوء وتركيز.",
    },
    {
      id: "l3-03",
      text:
        "رأى ماجد قطة صغيرة قرب باب المنزل، فقدم لها قليلًا من الماء والطعام. بقي يراقبها حتى اطمأن عليها ثم عاد إلى غرفته.",
    },
    {
      id: "l3-04",
      text:
        "في يوم مشمس ذهب الأطفال إلى الحديقة، وتسابقوا بين الأشجار. وبعد اللعب جلسوا في مكان ظليل وتناولوا الماء والفاكهة.",
    },
    {
      id: "l3-05",
      text:
        "يحب صالح مساعدة والده في المنزل. يجمع الأدوات بعد استخدامها، ويرتب المكان، ثم يشكر والده على تعليمه أعمالًا جديدة.",
    },
    {
      id: "l3-06",
      text:
        "قرأت ريم قصة عن التعاون، فأعجبتها أحداثها. أخبرت أختها بما تعلمته، واتفقا على مساعدة والدتهما في ترتيب الغرفة.",
    },
  ],

  4: [
    {
      id: "l4-01",
      text:
        "استعد الطلاب للرحلة المدرسية منذ الصباح الباكر. أحضر كل طالب حاجاته، ثم ركبوا الحافلة بهدوء. وعندما وصلوا إلى المكان بدأ المعلم يشرح لهم برنامج الرحلة.",
    },
    {
      id: "l4-02",
      text:
        "زرع عبدالرحمن بذرة صغيرة في حديقة منزله، وكان يسقيها كل يوم. وبعد أسابيع ظهرت أوراق خضراء جميلة، فشعر بالسعادة لأنه اعتنى بها جيدًا.",
    },
    {
      id: "l4-03",
      text:
        "يستيقظ أحمد مبكرًا في أيام الدراسة، ويستعد للمدرسة دون تأخير. يتناول فطوره، ويتأكد من كتبه وأدواته، ثم يخرج من المنزل سعيدًا.",
    },
    {
      id: "l4-04",
      text:
        "شاهدت ليان طائرًا يقف على نافذة غرفتها. بقيت هادئة حتى لا تخيفه، ثم أحضرت قليلًا من الحبوب ووضعتها في مكان قريب منه.",
    },
    {
      id: "l4-05",
      text:
        "في المكتبة كتب كثيرة ومفيدة. اختار فارس كتابًا عن الحيوانات، وجلس يقرأه باهتمام. وعندما انتهى أعاده إلى مكانه وشكر أمين المكتبة.",
    },
    {
      id: "l4-06",
      text:
        "ساعد الأطفال عامل النظافة في المحافظة على الحديقة، فجمعوا الأوراق ووضعوها في الحاوية. أصبح المكان جميلًا ونظيفًا، وشعر الجميع بالفخر.",
    },
  ],

  5: [
    {
      id: "l5-01",
      text:
        "أعلنت المدرسة عن مسابقة للقراءة، فقرر ياسر المشاركة فيها. بدأ يقرأ كل يوم قصة جديدة، ويسجل الكلمات التي لم يعرف معناها، ثم يسأل معلمه عنها في اليوم التالي.",
    },
    {
      id: "l5-02",
      text:
        "عندما هطلت الأمطار امتلأت الطرق بالماء، لكن الأطفال وقفوا قرب النافذة يشاهدون قطرات المطر وهي تنساب على الزجاج. وبعد توقف المطر خرجوا يستمتعون بالهواء النقي.",
    },
    {
      id: "l5-03",
      text:
        "ذهبت الأسرة إلى القرية لزيارة الجد، فاستقبلهم بابتسامة كبيرة. جلس الأطفال حوله يستمعون إلى حكاياته القديمة، وكانوا يسألونه عن الحياة في الماضي.",
    },
    {
      id: "l5-04",
      text:
        "اعتاد راشد أن يجهز حقيبته قبل النوم، حتى لا ينسى شيئًا في الصباح. ينظر إلى جدوله المدرسي، ويضع الكتب المطلوبة، ثم يتأكد من أدواته.",
    },
    {
      id: "l5-05",
      text:
        "وجدت مها كتابًا قديمًا في مكتبة المنزل، فمسحت عنه الغبار وبدأت تقرأه. أعجبتها الصور والقصص الموجودة فيه، وقررت الاحتفاظ به في مكان مناسب.",
    },
    {
      id: "l5-06",
      text:
        "يعمل أفراد الأسرة معًا عندما يستعدون لاستقبال الضيوف. يرتب بعضهم المجلس، ويجهز الآخرون الطعام، فيصبح العمل أسهل عندما يتعاون الجميع.",
    },
  ],

  6: [
    {
      id: "l6-01",
      text:
        "كان عبدالله يحب مراقبة النجوم في السماء، لذلك قرأ كتابًا مبسطًا عن الفضاء. عرف أن بعض النجوم بعيدة جدًا، وأن العلماء يستخدمون أجهزة خاصة لمشاهدتها ودراستها.",
    },
    {
      id: "l6-02",
      text:
        "شارك الطلاب في يوم تطوعي لتنظيف ساحة المدرسة. قسم المعلم المهام بينهم، فعمل كل فريق في جزء من الساحة، وبعد وقت قصير أصبح المكان أكثر ترتيبًا وجمالًا.",
    },
    {
      id: "l6-03",
      text:
        "لاحظت مريم أن أختها الصغيرة تجد صعوبة في ترتيب ألعابها، فقررت مساعدتها. صنعت لها صناديق صغيرة وكتبت على كل صندوق اسم الأشياء التي توضع بداخله.",
    },
    {
      id: "l6-04",
      text:
        "أثناء الرحلة رأى الأطفال نهرًا صغيرًا تحيط به الأشجار. طلب منهم المعلم المحافظة على المكان وعدم ترك المخلفات، فجمعوا حاجاتهم قبل العودة.",
    },
    {
      id: "l6-05",
      text:
        "كان خالد يرغب في تحسين خطه، فخصص كل يوم عشر دقائق للتدريب. بدأ يكتب ببطء ثم أصبح أكثر دقة، وبعد مدة لاحظ معلمه تحسن كتابته.",
    },
    {
      id: "l6-06",
      text:
        "تعلمت نورة أن النجاح يحتاج إلى صبر واستمرار. لذلك لم تحزن عندما أخطأت في أحد التمارين، بل راجعت الدرس وحاولت مرة أخرى حتى أتقنته.",
    },
  ],

  7: [
    {
      id: "l7-01",
      text:
        "استيقظ أهل القرية على أصوات الطيور بعد ليلة ممطرة. كانت الأرض رطبة والهواء لطيفًا، فخرج الأطفال يتأملون قطرات الماء فوق أوراق الأشجار، ويتحدثون عن جمال الطبيعة.",
    },
    {
      id: "l7-02",
      text:
        "قرر بدر أن يصنع هدية بسيطة لوالدته، فجمع بعض الأدوات الموجودة في المنزل وبدأ العمل. احتاج إلى عدة محاولات حتى انتهى، لكنه شعر بسعادة كبيرة عندما قدمها لها.",
    },
    {
      id: "l7-03",
      text:
        "في بداية العام وضع المعلم مع طلابه مجموعة من القواعد للفصل. اتفقوا على احترام الآخرين، والمحافظة على الأدوات، والاستماع أثناء الحديث، والعمل بروح الفريق.",
    },
    {
      id: "l7-04",
      text:
        "أثناء زيارته للمتحف شاهد فهد أدوات قديمة كان الناس يستخدمونها منذ سنوات طويلة. قرأ المعلومات المكتوبة بجوارها، وعاد إلى المنزل وهو يرغب في معرفة المزيد.",
    },
    {
      id: "l7-05",
      text:
        "تحب دانة طرح الأسئلة عندما تتعلم شيئًا جديدًا، لأنها ترى أن السؤال يساعدها على الفهم. لذلك تسجل ما لا تعرفه ثم تبحث عن الإجابة في الكتب أو تسأل معلمتها.",
    },
    {
      id: "l7-06",
      text:
        "زار الطلاب معرضًا للعلوم، وشاهدوا تجارب بسيطة عن الماء والهواء والضوء. كان كل طالب يكتب ملاحظاته، ثم ناقشوا ما تعلموه بعد العودة إلى المدرسة.",
    },
  ],

  8: [
    {
      id: "l8-01",
      text:
        "القراءة نافذة واسعة نتعرف من خلالها على أفكار وتجارب جديدة. وكلما قرأ الإنسان بتركيز وفهم، أصبح أكثر قدرة على التعبير عن رأيه والتواصل مع الآخرين بثقة.",
    },
    {
      id: "l8-02",
      text:
        "حين يتعاون أفراد الفريق لتحقيق هدف واحد، تتوزع المسؤوليات ويصبح العمل أكثر تنظيمًا. ولا يعني التعاون أن يقوم شخص بكل شيء، بل أن يعرف كل فرد دوره ويؤديه بإتقان.",
    },
    {
      id: "l8-03",
      text:
        "المحافظة على الوقت عادة تساعد الإنسان على الإنجاز. فعندما يحدد أعماله ويرتب أولوياته، يستطيع أن يوازن بين الدراسة والراحة واللعب دون أن يؤجل واجباته.",
    },
    {
      id: "l8-04",
      text:
        "تمنحنا الأخطاء فرصة للتعلم إذا عرفنا أسبابها وحاولنا تصحيحها. فالطالب المجتهد لا يتوقف عند الخطأ، بل يستفيد منه ويواصل التدريب حتى يصل إلى مستوى أفضل.",
    },
    {
      id: "l8-05",
      text:
        "تختلف اهتمامات الناس وقدراتهم، وهذا الاختلاف يجعل الحياة أكثر تنوعًا. ومن المهم أن نحترم الآخرين ونستمع إلى آرائهم، حتى عندما تكون أفكارهم مختلفة عن أفكارنا.",
    },
    {
      id: "l8-06",
      text:
        "تساعد القراءة اليومية على زيادة الثروة اللغوية وتحسين الفهم. ومع الاستمرار يصبح القارئ أسرع في التعرف على الكلمات وأكثر قدرة على قراءة النصوص بطلاقة وتعبير.",
    },
  ],
};

const CHALLENGE_SECONDS =
  40;

/*
 * =====================================================
 * وضع الاختبار المؤقت
 * =====================================================
 *
 * true:
 * يسمح بتجربة بوابة المستوى التالي
 * حتى لو لم يكتمل عدد القراءات.
 *
 * ويرسل preview إلى API.
 *
 * بعد اكتمال اختبارنا الحالي:
 * أعده إلى false.
 */

const FLUENCY_TEST_MODE = false;

export default function FluencyLevelsPage() {
  /*
   * ===================================================
   * التقدم الرسمي
   * ===================================================
   */

  const [
    approvedReadings,
    setApprovedReadings,
  ] =
    useState(0);

  const [
    officialFluencyLevel,
    setOfficialFluencyLevel,
  ] =
    useState(1);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /*
   * ===================================================
   * الاختبار
   * ===================================================
   */

  const [
    challengeStarted,
    setChallengeStarted,
  ] =
    useState(false);

  const [
    challengeFinished,
    setChallengeFinished,
  ] =
    useState(false);

  const [
    challengeText,
    setChallengeText,
  ] =
    useState<ChallengeText | null>(
      null
    );

  const [
    secondsLeft,
    setSecondsLeft,
  ] =
    useState(
      CHALLENGE_SECONDS
    );

  const [
    challengeMessage,
    setChallengeMessage,
  ] =
    useState("");

  const [
    audioBlob,
    setAudioBlob,
  ] =
    useState<Blob | null>(
      null
    );

  const [
    sendingPromotion,
    setSendingPromotion,
  ] =
    useState(false);

  const [
    promotionSent,
    setPromotionSent,
  ] =
    useState(false);

  const recorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const chunksRef =
    useRef<Blob[]>([]);

  const timerRef =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  /*
   * ===================================================
   * تحميل المستوى الرسمي + عدد القراءات
   * ===================================================
   *
   * قراءة وثيقة واحدة فقط.
   *
   * لا يوجد onSnapshot.
   */

  useEffect(() => {
    let active =
      true;

    async function loadProgress() {
      try {
        const studentId =
          localStorage.getItem(
            "student-id"
          );

        if (!studentId) {
          return;
        }

        const snapshot =
          await getDoc(
            doc(
              db,
              "reading-progress",
              studentId
            )
          );

        if (!active) {
          return;
        }

        if (
          !snapshot.exists()
        ) {
          /*
           * الطالب الجديد:
           * المستوى الرسمي = 1
           * القراءات = 0
           */
          setOfficialFluencyLevel(
            1
          );

          setApprovedReadings(
            0
          );

          return;
        }

        const data =
          snapshot.data() as
            ProgressData;

        const loadedApprovedReadings =
          typeof data.totalApprovedDays ===
          "number"
            ? Math.max(
                0,
                Math.round(
                  data.totalApprovedDays
                )
              )
            : 0;

        /*
         * fluencyLevel هو المصدر
         * الرسمي الوحيد للمستوى.
         */
        const loadedFluencyLevel =
          typeof data.fluencyLevel ===
          "number"
            ? Math.max(
                1,
                Math.min(
                  8,
                  Math.round(
                    data.fluencyLevel
                  )
                )
              )
            : 1;

        setApprovedReadings(
          loadedApprovedReadings
        );

        setOfficialFluencyLevel(
          loadedFluencyLevel
        );
      } catch (error) {
        console.error(
          "تعذر تحميل تقدم قمة الطلاقة:",
          error
        );
      } finally {
        if (active) {
          setLoading(
            false
          );
        }
      }
    }

    void loadProgress();

    return () => {
      active =
        false;
    };
  }, []);

  /*
   * ===================================================
   * المستوى الحالي الرسمي
   * ===================================================
   */

  const currentLevel =
    useMemo(
      () =>
        LEVELS[
          officialFluencyLevel -
            1
        ] ||
        LEVELS[0],
      [
        officialFluencyLevel,
      ]
    );

  /*
   * المستوى التالي فقط.
   */

  const nextLevel =
    useMemo(
      () => {
        if (
          officialFluencyLevel >=
          8
        ) {
          return null;
        }

        return (
          LEVELS[
            officialFluencyLevel
          ] || null
        );
      },
      [
        officialFluencyLevel,
      ]
    );

  /*
   * عدد القراءات المتبقية
   * لفتح الاختبار التالي.
   */

  const readingsNeeded =
    nextLevel
      ? Math.max(
          0,
          nextLevel.requirement -
            approvedReadings
        )
      : 0;

  /*
   * التقدم نحو بوابة
   * المستوى التالي.
   */

  const progressPercent =
    useMemo(
      () => {
        if (
          !nextLevel
        ) {
          return 100;
        }

        const startRequirement =
          currentLevel.requirement;

        const endRequirement =
          nextLevel.requirement;

        const range =
          Math.max(
            1,
            endRequirement -
              startRequirement
          );

        const completed =
          Math.max(
            0,
            approvedReadings -
              startRequirement
          );

        return Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (completed /
                range) *
                100
            )
          )
        );
      },
      [
        approvedReadings,
        currentLevel.requirement,
        nextLevel,
      ]
    );

  /*
   * ===================================================
   * هل الاختبار التالي مفتوح؟
   * ===================================================
   *
   * القراءات تفتح الاختبار فقط.
   *
   * لا ترفع المستوى.
   */

  const promotionReady =
    Boolean(
      nextLevel &&
        (
          FLUENCY_TEST_MODE ||
          approvedReadings >=
            nextLevel.requirement
        )
    );

  /*
   * النصوص الخاصة
   * بالمستوى التالي.
   */

  const currentChallengeTexts =
    nextLevel
      ? CHALLENGE_TEXTS[
          nextLevel.number
        ] || []
      : [];

  /*
   * ===================================================
   * التحكم بالمؤقت والميكروفون
   * ===================================================
   */

  function clearChallengeTimer() {
    if (
      timerRef.current
    ) {
      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }
  }

  function stopMicrophoneTracks() {
    streamRef.current
      ?.getTracks()
      .forEach(
        (
          track
        ) => {
          track.stop();
        }
      );

    streamRef.current =
      null;
  }

  function finishChallenge() {
    clearChallengeTimer();

    const recorder =
      recorderRef.current;

    if (
      recorder &&
      recorder.state !==
        "inactive"
    ) {
      recorder.stop();
    } else {
      stopMicrophoneTracks();
    }

    setSecondsLeft(
      0
    );

    setChallengeFinished(
      true
    );

    setChallengeStarted(
      false
    );

    setChallengeMessage(
      "✅ انتهت المحاولة. أصبح التسجيل جاهزًا للإرسال إلى المعلم."
    );
  }

  /*
   * ===================================================
   * بدء اختبار المستوى التالي
   * ===================================================
   */

  async function startChallenge() {
    if (
      !promotionReady ||
      !nextLevel ||
      challengeStarted
    ) {
      return;
    }

    if (
      currentChallengeTexts.length ===
      0
    ) {
      setChallengeMessage(
        "لا توجد نصوص متاحة لهذا المستوى حاليًا."
      );

      return;
    }

    setChallengeMessage(
      ""
    );

    setAudioBlob(
      null
    );

    setChallengeFinished(
      false
    );

    setPromotionSent(
      false
    );

    try {
      /*
       * لا يظهر النص قبل نجاح
       * تشغيل الميكروفون.
       */

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio:
              true,
          }
        );

      const supportedType =
        typeof MediaRecorder !==
          "undefined" &&
        MediaRecorder.isTypeSupported(
          "audio/webm"
        )
          ? "audio/webm"
          : "";

      const recorder =
        supportedType
          ? new MediaRecorder(
              stream,
              {
                mimeType:
                  supportedType,
              }
            )
          : new MediaRecorder(
              stream
            );

      streamRef.current =
        stream;

      recorderRef.current =
        recorder;

      chunksRef.current =
        [];

      recorder.ondataavailable =
        (
          event
        ) => {
          if (
            event.data.size >
            0
          ) {
            chunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onstop =
        () => {
          const type =
            recorder.mimeType ||
            "audio/webm";

          const blob =
            new Blob(
              chunksRef.current,
              {
                type,
              }
            );

          setAudioBlob(
            blob
          );

          stopMicrophoneTracks();
        };

      /*
       * =================================================
       * اختيار نص مختلف عن السابق
       * =================================================
       */

      const studentId =
        localStorage.getItem(
          "student-id"
        ) ||
        "student";

      const storageKey =
        `fluency-last-text-${studentId}-level-${nextLevel.number}`;

      const previousId =
        localStorage.getItem(
          storageKey
        );

      const candidates =
        currentChallengeTexts.filter(
          (
            item
          ) =>
            item.id !==
            previousId
        );

      const pool =
        candidates.length >
        0
          ? candidates
          : currentChallengeTexts;

      const selected =
        pool[
          Math.floor(
            Math.random() *
              pool.length
          )
        ];

      /*
       * نبدأ التسجيل أولًا.
       */

      recorder.start(
        250
      );

      /*
       * من هذه اللحظة:
       *
       * - يظهر النص
       * - يبدأ العداد
       * - التسجيل بدأ فعلًا
       */

      localStorage.setItem(
        storageKey,
        selected.id
      );

      setChallengeText(
        selected
      );

      setSecondsLeft(
        CHALLENGE_SECONDS
      );

      setChallengeStarted(
        true
      );

      let remaining =
        CHALLENGE_SECONDS;

      timerRef.current =
        setInterval(
          () => {
            remaining -=
              1;

            setSecondsLeft(
              remaining
            );

            if (
              remaining <=
              0
            ) {
              finishChallenge();
            }
          },
          1000
        );
    } catch (error) {
      console.error(
        "تعذر بدء اختبار الطلاقة:",
        error
      );

      stopMicrophoneTracks();

      setChallengeMessage(
        "تعذر تشغيل الميكروفون. اسمح للأكاديمية باستخدام الميكروفون ثم حاول مرة أخرى."
      );
    }
  }

  /*
   * ===================================================
   * إرسال الاختبار للمعلم
   * ===================================================
   */

  async function sendPromotionToTeacher() {
    if (
      !audioBlob ||
      !challengeText ||
      !nextLevel ||
      sendingPromotion ||
      promotionSent
    ) {
      return;
    }

    const currentUser =
      auth.currentUser;

    if (
      !currentUser
    ) {
      setChallengeMessage(
        "تعذر التحقق من حساب الطالب. سجّل الدخول مرة أخرى ثم حاول."
      );

      return;
    }

    try {
      setSendingPromotion(
        true
      );

      setChallengeMessage(
        ""
      );

      /*
       * =================================================
       * رفع التسجيل إلى Cloudinary
       * =================================================
       */

      const formData =
        new FormData();

      formData.append(
        "file",
        audioBlob,
        `fluency-level-${nextLevel.number}-${Date.now()}.webm`
      );

      formData.append(
        "upload_preset",
        "lughati_reading_upload"
      );

      formData.append(
        "resource_type",
        "video"
      );

      const cloudinaryResponse =
        await fetch(
          "https://api.cloudinary.com/v1_1/ffv5igmg/video/upload",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const cloudinaryData =
        await cloudinaryResponse.json();

      if (
        !cloudinaryResponse.ok ||
        typeof cloudinaryData.secure_url !==
          "string"
      ) {
        throw new Error(
          "CLOUDINARY_UPLOAD_FAILED"
        );
      }

      /*
       * =================================================
       * إرسال طلب الترقية
       * =================================================
       */

      const token =
        await currentUser.getIdToken();

      const usedSeconds =
        Math.max(
          1,
          CHALLENGE_SECONDS -
            secondsLeft
        );

      const response =
        await fetch(
          "/api/fluency-promotion",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

           body:
  JSON.stringify({
    targetLevel:
      nextLevel.number,

    textId:
      challengeText.id,

    audioUrl:
      cloudinaryData.secure_url,

    durationSeconds:
      usedSeconds,

    preview: false,

    testMode:
      FLUENCY_TEST_MODE,
  }),
          }
        );

      const data =
        (await response.json()) as
          PromotionResponse;

      if (
        !response.ok ||
        data.success !==
          true
      ) {
        throw new Error(
          typeof data.message ===
            "string"
            ? data.message
            : "PROMOTION_SUBMISSION_FAILED"
        );
      }

      setPromotionSent(
        true
      );

      setChallengeMessage(
  data.preview === true
    ? "🧪 نجح اختبار الإرسال دون الكتابة في Firestore."
    : FLUENCY_TEST_MODE
      ? `🧪 تم إنشاء طلب ترقية حقيقي للمستوى ${nextLevel.number} لاختبار دورة الاعتماد.`
      : `✅ تم إرسال اختبار المستوى ${nextLevel.number} إلى المعلم بنجاح، وهو الآن بانتظار المراجعة.`
);
    } catch (error) {
      console.error(
        "تعذر إرسال اختبار الترقية:",
        error
      );

      setChallengeMessage(
        error instanceof Error &&
          error.message &&
          ![
            "CLOUDINARY_UPLOAD_FAILED",
            "PROMOTION_SUBMISSION_FAILED",
          ].includes(
            error.message
          )
          ? error.message
          : "تعذر إرسال اختبار الترقية حاليًا. حاول مرة أخرى."
      );
    } finally {
      setSendingPromotion(
        false
      );
    }
  }

  /*
   * ===================================================
   * إعادة المحاولة
   * ===================================================
   *
   * سيختار النظام نصًا آخر.
   */

  function resetChallenge() {
    clearChallengeTimer();

    stopMicrophoneTracks();

    recorderRef.current =
      null;

    chunksRef.current =
      [];

    setChallengeText(
      null
    );

    setAudioBlob(
      null
    );

    setSecondsLeft(
      CHALLENGE_SECONDS
    );

    setChallengeStarted(
      false
    );

    setChallengeFinished(
      false
    );

    setChallengeMessage(
      ""
    );

    setPromotionSent(
      false
    );

    setSendingPromotion(
      false
    );
  }

  /*
   * ===================================================
   * تنظيف الميكروفون عند مغادرة الصفحة
   * ===================================================
   */

  useEffect(() => {
    return () => {
      clearChallengeTimer();

      const recorder =
        recorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        recorder.stop();
      }

      stopMicrophoneTracks();
    };
  }, []);

  /*
   * ===================================================
   * واجهة الصفحة
   * ===================================================
   */

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",

        background:
          "#f7fbf9",

        padding:
          "24px",

        fontFamily:
          "inherit",
      }}
    >
      <div
        style={{
          maxWidth:
            "920px",

          margin:
            "0 auto",
        }}
      >
        {/* الرأس */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #92400e, #d97706)",

            color:
              "white",

            borderRadius:
              "28px",

            padding:
              "28px",

            boxShadow:
              "0 12px 30px rgba(0,0,0,0.10)",

            marginBottom:
              "22px",
          }}
        >
          <div
            style={{
              fontSize:
                "48px",
            }}
          >
            🏔️📖
          </div>

          <h1
            style={{
              margin:
                "8px 0 6px",

              fontSize:
                "34px",

              fontWeight:
                900,
            }}
          >
            قمة الطلاقة
          </h1>

          <p
            style={{
              margin:
                0,

              lineHeight:
                1.9,

              fontSize:
                "17px",

              opacity:
                0.96,
            }}
          >
            ثمانية مستويات تقودك من
            بداية القراءة إلى الطلاقة
            العالية. قراءاتك المنزلية
            المعتمدة تفتح لك بوابة
            الاختبار، والمعلم يعتمد
            ترقيتك.
          </p>
        </div>

        {/* المستوى الحالي */}

        <section
          style={{
            background:
              "white",

            border:
              "1px solid #d9eee7",

            borderRadius:
              "24px",

            padding:
              "22px",

            marginBottom:
              "22px",
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign:
                  "center",

                fontWeight:
                  900,

                color:
                  "#64748b",
              }}
            >
              ⏳ جارٍ تحميل مستواك...
            </div>
          ) : (
            <>
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    "14px",

                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        "#64748b",

                      fontWeight:
                        800,

                      fontSize:
                        "14px",
                    }}
                  >
                    مستواك الرسمي الحالي
                  </div>

                  <div
                    style={{
                      marginTop:
                        "5px",

                      color:
                        "#0f6b52",

                      fontSize:
                        "24px",

                      fontWeight:
                        900,
                    }}
                  >
                    {
                      currentLevel.icon
                    }{" "}
                    المستوى{" "}
                    {
                      currentLevel.number
                    }{" "}
                    —{" "}
                    {
                      currentLevel.title
                    }
                  </div>
                </div>

                <div
                  style={{
                    background:
                      "#ecfdf5",

                    color:
                      "#047857",

                    borderRadius:
                      "999px",

                    padding:
                      "10px 15px",

                    fontWeight:
                      900,
                  }}
                >
                  📚{" "}
                  {
                    approvedReadings
                  }{" "}
                  قراءة معتمدة
                </div>
              </div>

              <div
                style={{
                  height:
                    "13px",

                  background:
                    "#e2e8f0",

                  borderRadius:
                    "999px",

                  overflow:
                    "hidden",

                  marginTop:
                    "20px",
                }}
              >
                <div
                  style={{
                    width:
                      `${progressPercent}%`,

                    height:
                      "100%",

                    background:
                      "linear-gradient(90deg, #10b981, #f59e0b)",

                    transition:
                      "width .3s ease",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop:
                    "12px",

                  textAlign:
                    "center",

                  color:
                    "#475569",

                  fontWeight:
                    800,

                  lineHeight:
                    1.8,
                }}
              >
                {!nextLevel
                  ? "💎 وصلت إلى المستوى الثامن — قمة الطلاقة!"
                  : readingsNeeded >
                      0
                    ? `بقيت ${readingsNeeded} قراءة منزلية معتمدة لفتح بوابة اختبار المستوى ${nextLevel.number}.`
                    : `🎉 أصبحت جاهزًا لاختبار المستوى ${nextLevel.number}.`}
              </div>

              {FLUENCY_TEST_MODE && (
                <div
                  style={{
                    marginTop:
                      "12px",

                    padding:
                      "10px",

                    borderRadius:
                      "12px",

                    background:
                      "#fff7ed",

                    color:
                      "#9a3412",

                    fontWeight:
                      800,

                    textAlign:
                      "center",

                    fontSize:
                      "13px",
                  }}
                >
                  🧪 وضع الاختبار مفعّل
                  حاليًا للتطوير فقط.
                </div>
              )}
            </>
          )}
        </section>

        {/* المستويات */}

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",

            gap:
              "14px",
          }}
        >
          {LEVELS.map(
            (
              level
            ) => {
              /*
               * مفتوح رسميًا:
               * فقط المستويات التي
               * اعتمدها المعلم.
               */

              const reached =
                !loading &&
                level.number <=
                  officialFluencyLevel;

              const isCurrent =
                !loading &&
                level.number ===
                  officialFluencyLevel;

              const isNext =
                !loading &&
                nextLevel?.number ===
                  level.number;

              return (
                <div
                  key={
                    level.number
                  }
                  style={{
                    background:
                      "white",

                    borderRadius:
                      "22px",

                    padding:
                      "20px",

                    border:
                      isCurrent
                        ? "2px solid #10b981"
                        : isNext
                          ? "2px solid #f59e0b"
                          : "1px solid #e2e8f0",

                    opacity:
                      reached ||
                      isNext
                        ? 1
                        : 0.72,

                    boxShadow:
                      isCurrent
                        ? "0 8px 22px rgba(16,185,129,.12)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "34px",
                      }}
                    >
                      {
                        level.icon
                      }
                    </div>

                    <div
                      style={{
                        fontWeight:
                          900,

                        color:
                          reached
                            ? "#047857"
                            : isNext
                              ? "#b45309"
                              : "#94a3b8",
                      }}
                    >
                      {isCurrent
                        ? "🏅 مستواك"
                        : reached
                          ? "✓ مجتاز"
                          : isNext
                            ? promotionReady
                              ? "🔓 جاهز للاختبار"
                              : "⏳ التالي"
                            : "🔒 مقفل"}
                    </div>
                  </div>

                  <h3
                    style={{
                      margin:
                        "10px 0 5px",

                      color:
                        "#17352a",
                    }}
                  >
                    المستوى{" "}
                    {
                      level.number
                    }
                  </h3>

                  <div
                    style={{
                      fontWeight:
                        900,

                      color:
                        "#0f6b52",

                      marginBottom:
                        "8px",
                    }}
                  >
                    {
                      level.title
                    }
                  </div>

                  <p
                    style={{
                      margin:
                        0,

                      color:
                        "#64748b",

                      lineHeight:
                        1.7,

                      fontSize:
                        "14px",
                    }}
                  >
                    {
                      level.description
                    }
                  </p>

                  {level.number >
                    1 && (
                    <div
                      style={{
                        marginTop:
                          "12px",

                        paddingTop:
                          "10px",

                        borderTop:
                          "1px solid #f1f5f9",

                        color:
                          "#78716c",

                        fontSize:
                          "13px",

                        fontWeight:
                          800,
                      }}
                    >
                      بوابة الاختبار بعد{" "}
                      {
                        level.requirement
                      }{" "}
                      قراءة معتمدة
                      إجمالًا
                    </div>
                  )}
                </div>
              );
            }
          )}
        </section>

        {/* بوابة الاختبار */}

        {nextLevel && (
          <section
            style={{
              marginTop:
                "22px",

              padding:
                "22px",

              background:
                promotionReady
                  ? "#f0fdf4"
                  : "#f8fafc",

              border:
                promotionReady
                  ? "2px solid #86efac"
                  : "1px solid #cbd5e1",

              borderRadius:
                "24px",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  "12px",

                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      promotionReady
                        ? "#047857"
                        : "#64748b",

                    fontWeight:
                      900,

                    fontSize:
                      "14px",
                  }}
                >
                  {promotionReady
                    ? "🔓 بوابة الترقية مفتوحة"
                    : "🔒 بوابة الترقية مقفلة"}
                </div>

                <h2
                  style={{
                    margin:
                      "5px 0",

                    color:
                      "#17352a",
                  }}
                >
                  {
                    nextLevel.icon
                  }{" "}
                  اختبار المستوى{" "}
                  {
                    nextLevel.number
                  }{" "}
                  —{" "}
                  {
                    nextLevel.title
                  }
                </h2>

                <p
                  style={{
                    margin:
                      0,

                    color:
                      "#64748b",

                    lineHeight:
                      1.8,

                    fontWeight:
                      700,
                  }}
                >
                  النص لن يظهر قبل بدء
                  التسجيل. بعد السماح
                  بالميكروفون يبدأ
                  التسجيل والعداد ويظهر
                  النص في اللحظة نفسها.
                </p>
              </div>

              {!challengeStarted &&
                !challengeFinished && (
                  <button
                    type="button"
                    onClick={
                      startChallenge
                    }
                    disabled={
                      !promotionReady
                    }
                    style={{
                      border:
                        "none",

                      borderRadius:
                        "16px",

                      padding:
                        "14px 20px",

                      background:
                        promotionReady
                          ? "#087f5b"
                          : "#cbd5e1",

                      color:
                        "white",

                      fontWeight:
                        900,

                      fontSize:
                        "16px",

                      cursor:
                        promotionReady
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    {promotionReady
                      ? `🎙️ ابدأ اختبار المستوى ${nextLevel.number}`
                      : `بقيت ${readingsNeeded} قراءات`}
                  </button>
                )}
            </div>

            {/* أثناء الاختبار */}

            {challengeStarted &&
              challengeText && (
                <div
                  style={{
                    marginTop:
                      "20px",

                    background:
                      "white",

                    border:
                      "2px solid #f59e0b",

                    borderRadius:
                      "22px",

                    padding:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      textAlign:
                        "center",

                      fontSize:
                        "28px",

                      fontWeight:
                        900,

                      color:
                        secondsLeft <=
                        10
                          ? "#b91c1c"
                          : "#92400e",

                      marginBottom:
                        "14px",
                    }}
                  >
                    🔴 التسجيل جارٍ —
                    ⏱️{" "}
                    {
                      secondsLeft
                    }
                  </div>

                  <div
                    style={{
                      fontSize:
                        "25px",

                      lineHeight:
                        2.1,

                      color:
                        "#17352a",

                      fontWeight:
                        800,

                      textAlign:
                        "right",
                    }}
                  >
                    {
                      challengeText.text
                    }
                  </div>

                  <button
                    type="button"
                    onClick={
                      finishChallenge
                    }
                    style={{
                      width:
                        "100%",

                      marginTop:
                        "18px",

                      border:
                        "none",

                      borderRadius:
                        "15px",

                      padding:
                        "13px",

                      background:
                        "#334155",

                      color:
                        "white",

                      fontWeight:
                        900,

                      fontSize:
                        "16px",

                      cursor:
                        "pointer",
                    }}
                  >
                    أنهيت القراءة ✓
                  </button>
                </div>
              )}

            {/* بعد انتهاء الاختبار */}

            {challengeFinished && (
              <div
                style={{
                  marginTop:
                    "20px",

                  background:
                    "white",

                  border:
                    "1px solid #bbf7d0",

                  borderRadius:
                    "20px",

                  padding:
                    "18px",

                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "34px",

                    marginBottom:
                      "6px",
                  }}
                >
                  🎉
                </div>

                <div
                  style={{
                    color:
                      "#047857",

                    fontWeight:
                      900,

                    fontSize:
                      "20px",
                  }}
                >
                  انتهت محاولة المستوى{" "}
                  {
                    nextLevel.number
                  }
                </div>

                <p
                  style={{
                    color:
                      "#64748b",

                    lineHeight:
                      1.8,

                    fontWeight:
                      700,
                  }}
                >
                  {audioBlob
                    ? "تم تجهيز التسجيل بنجاح. أرسله الآن إلى المعلم لاعتماد الترقية."
                    : "جارٍ تجهيز التسجيل..."}
                </p>

                <button
                  type="button"
                  onClick={
                    sendPromotionToTeacher
                  }
                  disabled={
                    !audioBlob ||
                    sendingPromotion ||
                    promotionSent
                  }
                  style={{
                    width:
                      "100%",

                    border:
                      "none",

                    background:
                      promotionSent
                        ? "#bbf7d0"
                        : "#087f5b",

                    color:
                      promotionSent
                        ? "#166534"
                        : "white",

                    borderRadius:
                      "14px",

                    padding:
                      "13px 16px",

                    fontWeight:
                      900,

                    fontSize:
                      "16px",

                    cursor:
                      !audioBlob ||
                      sendingPromotion ||
                      promotionSent
                        ? "default"
                        : "pointer",

                    marginBottom:
                      "10px",
                  }}
                >
                  {promotionSent
                    ? "✅ تم الإرسال للمعلم"
                    : sendingPromotion
                      ? "⏳ جارٍ رفع التسجيل وإرساله..."
                      : "📨 إرسال للمعلم لاعتماد الترقية"}
                </button>

                {!promotionSent && (
                  <button
                    type="button"
                    onClick={
                      resetChallenge
                    }
                    style={{
                      border:
                        "1px solid #10b981",

                      background:
                        "white",

                      color:
                        "#047857",

                      borderRadius:
                        "14px",

                      padding:
                        "11px 16px",

                      fontWeight:
                        900,

                      cursor:
                        "pointer",
                    }}
                  >
                    🔄 محاولة أخرى بنص
                    جديد
                  </button>
                )}
              </div>
            )}

            {challengeMessage && (
              <div
                style={{
                  marginTop:
                    "14px",

                  padding:
                    "12px",

                  borderRadius:
                    "14px",

                  background:
                    "#fff7ed",

                  color:
                    "#9a3412",

                  fontWeight:
                    800,

                  textAlign:
                    "center",

                  lineHeight:
                    1.8,
                }}
              >
                {
                  challengeMessage
                }
              </div>
            )}
          </section>
        )}

        {/* المستوى الثامن */}

        {!nextLevel &&
          !loading && (
            <section
              style={{
                marginTop:
                  "22px",

                padding:
                  "28px",

                borderRadius:
                  "24px",

                textAlign:
                  "center",

                background:
                  "#fffbeb",

                border:
                  "2px solid #fde68a",
              }}
            >
              <div
                style={{
                  fontSize:
                    "52px",
                }}
              >
                💎👑
              </div>

              <h2
                style={{
                  color:
                    "#92400e",

                  margin:
                    "10px 0",
                }}
              >
                وصلت إلى قمة الطلاقة
              </h2>

              <p
                style={{
                  color:
                    "#78716c",

                  fontWeight:
                    800,

                  lineHeight:
                    1.8,
                }}
              >
                أحسنت! اجتزت جميع
                مستويات قمة الطلاقة.
              </p>
            </section>
          )}

        <div
          style={{
            marginTop:
              "22px",

            textAlign:
              "center",
          }}
        >
          <Link
            href="/reading-journey"
            style={{
              color:
                "#087f5b",

              textDecoration:
                "none",

              fontWeight:
                900,
            }}
          >
            ← العودة إلى رحلة القراءة
          </Link>
        </div>
      </div>
    </main>
  );
}