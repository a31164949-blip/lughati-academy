"use client";

import InstallAppButton from "../components/InstallAppButton";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  orderBy,
  limit,
  type Timestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../firebase";

const journeyCards = [
  {
    icon: "🏡",
    title: "مدينة الإنجاز",
    description:
      "ابنِ مدينتك مع كل تقدم جديد",
    href: "/journey/city",
    background: "#fff7d6",
  },
  {
  icon: "👦🏻",
  title: "شخصيتي",
  description:
    "اختر شخصيتك وافتح صورًا جديدة مع تقدمك",
  href: "/student-avatar",
  background: "#eefbf6",
},
  {
    icon: "📚",
    title: "الدروس",
    description:
      "تعلّم واقرأ واستمتع",
    href: "/lessons",
    background: "#e8f2ff",
  },
  {
    icon: "📝",
    title: "واجباتي",
    description:
      "أنجز واجباتك اليومية",
    href: "/homeworks",
    background: "#fff3df",
  },
  {
    icon: "🎙️",
    title: "رحلة القراءة",
    description:
      "سجّل دقيقة قراءة يومية وواصل سلسلة إنجازك",
    href: "/reading-journey",
    background: "#ecfdf5",
  },
  {
    icon: "🗓️",
    title: "الخطة الأسبوعية",
    description:
      "تعرّف على مهام الأسبوع",
    href: "/weekly-plan",
    background: "#e9f9ee",
  },
  {
    icon: "📝",
    title: "اختباراتي",
    description:
      "ادخل إلى اختباراتك الإلكترونية وابدأ الحل",
    href: "/quizzes/take",
    background: "#eef8f2",
  },
  {
    icon: "🌱",
    title: "رحلة الدعم",
    description:
      "تدريبات تساعدني على التقدم",
    href: "/support",
    background: "#f2ebff",
  },
  {
    icon: "🏆",
    title: "لوحة الشرف",
    description:
      "شاهد أوسمتك وألقابك وإنجازاتك المميزة",
    href: "/honor-board",
    background: "#fff8d8",
  },
  {
    icon: "🌟",
    title: "أبطال الأكاديمية",
    description:
      "شاهد أبطال القراءة والإملاء والإنجاز",
    href: "/heroes",
    background: "#fff6dc",
  },
  {
    icon: "📝",
    title: "نتائج اختباراتي",
    description:
      "شاهد درجاتك ونتائج اختباراتك وتابع تقدمك",
    href: "/quizzes",
    background: "#eef4ff",
  },
  {
    icon: "🎨",
    title: "معرض الطلاب",
    description:
      "شاهد إبداعاتك وإبداعات زملائك ✨",
    href: "/gallery",
    background: "#fff3e8",
  },
  {
    icon: "📤",
    title: "ارفع عملي",
    description:
      "أرسل صوتًا أو صورة أو فيديو",
    href: "/upload",
    background: "#e9fbff",
  },
  {
    icon: "💬",
    title: "تواصل مع معلمي",
    description:
      "أرسل استفسارك أو طلب المساعدة إلى معلمك",
    href: "/student-contact",
    background: "#eefbf6",
  },
];

const dailyTasks = [
  {
    id: 1,
    title: "قراءة درس اليوم",
    reward: "نجمتان",
    icon: "📖",
    actionLabel: "تمت القراءة",
    href: "",
  },
  {
    id: 2,
    title: "حل الواجب اليومي",
    reward: "+3 نقاط بعد اعتماد المعلم",
    icon: "✏️",
    actionLabel: "📎 أرفق واجبك",
    href: "/homeworks",
  },
  {
    id: 4,
    title: "مراجعة كلمات الإملاء",
    reward: "مهمة تدريبية دون نقاط مباشرة",
    icon: "🔤",
    actionLabel: "تمت المراجعة",
    href: "",
  },
];

type StudentSmartFollowUp = {
  date: string;

  homeworkLabel: string;

  readingLevelLabel: string;
  readingAccuracyLabel: string;
  readingFluencyLabel: string;
  readingDiacriticsLabel: string;

  readingNote: string;
};

type JourneyData = {
  success: boolean;
  points?: number;
  stars?: number;
  streak?: number;
  readingDays?: number;
  fluencyLevel?: number;
  personalPhotoUrl?: string;
  selectedAvatarIcon?: string;
  completedTaskIds?: number[];
  homeworkStatus?:
    | "none"
    | "pending"
    | "approved"
    | "rejected";
  smartFollowUp?: StudentSmartFollowUp | null;
  message?: string;
};
type CrownAchievement = {
  id: string;
  mode: string;
  lessonName: string;
  king: boolean;
  kingTitle: string;
  fullMastery: boolean;
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type CrownAssessmentPreview = {
  mode: string;
  lessonName: string;
  pageNumber: number;
  bestErrors: number;
  lastErrors: number;
  attemptCount: number;
  title: string;
  updatedAt: string;
};

type CrownData = {
  success: boolean;
  readingKingCount?: number;
  spellingKingCount?: number;
  masteryCount?: number;
  latestAchievement?: CrownAchievement | null;
  latestAssessment?: CrownAssessmentPreview | null;
  achievements?: CrownAchievement[];
  message?: string;
};
type StudentNotification = {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: string;
  homeworkId: string;
  href: string;
  read: boolean;

  milestoneId?: string;
  badgeTitle?: string;
  pointsReached?: number;

  createdAt?: Timestamp | null;
};
type WeeklySummary = {
  success: boolean;

  shouldShow: boolean;
  parentViewed: boolean;

  weekKey: string;
  weekStart: string;
  weekEnd: string;

  studentName: string;

  status:
    | "excellent"
    | "good"
    | "needs-follow-up";

  statusLabel: string;

  readingDays: number;

  homeworkSubmitted: number;
  homeworkApproved: number;

  activityDays: number;

  weeklyPoints: number;

  message?: string;
};


const fluencyLevels = [
  { number: 1, icon: "🌱", title: "القارئ المنطلق", requirement: 0 },
  { number: 2, icon: "⭐", title: "القارئ المتقدم", requirement: 3 },
  { number: 3, icon: "🥉", title: "القارئ الواثق", requirement: 7 },
  { number: 4, icon: "🥈", title: "القارئ المتمكن", requirement: 12 },
  { number: 5, icon: "🥇", title: "القارئ المتميز", requirement: 17 },
  { number: 6, icon: "🏆", title: "بطل القراءة", requirement: 23 },
  { number: 7, icon: "👑", title: "فارس الطلاقة", requirement: 30 },
  { number: 8, icon: "💎", title: "سفير القراءة", requirement: 37 },
] as const;

export default function JourneyPage() {
  const [studentName, setStudentName] =
  useState("");


useEffect(() => {
  const savedStudentName =
    window.localStorage.getItem(
      "student-name"
    ) || "";

  setStudentName(savedStudentName);
}, []);
  const [user, setUser] =
    useState<User | null>(null);
const [
  weeklySummary,
  setWeeklySummary,
] = useState<WeeklySummary | null>(
  null
);

const [
  weeklySummaryLoading,
  setWeeklySummaryLoading,
] = useState(false);

const [
  savingWeeklySummaryView,
  setSavingWeeklySummaryView,
] = useState(false);
  const [notifications, setNotifications] =
    useState<StudentNotification[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);
const [
  celebrationNotification,
  setCelebrationNotification,
] = useState<StudentNotification | null>(null);
  const unreadNotificationsCount =
    notifications.filter((notification) => !notification.read).length;

  const [
    smartFollowUp,
    setSmartFollowUp,
  ] =
    useState<StudentSmartFollowUp | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [points, setPoints] =
    useState(0);

  const [stars, setStars] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [readingDays, setReadingDays] =
    useState(0);


  const [
    fluencyLevel,
    setFluencyLevel,
  ] = useState(1);
  const [
    completedTasks,
    setCompletedTasks,
  ] = useState<number[]>([]);

  const [
    homeworkStatus,
    setHomeworkStatus,
  ] = useState<
    "none" |
    "pending" |
    "approved" |
    "rejected"
  >("none");

  const [
    savingTaskId,
    setSavingTaskId,
  ] =
  
    useState<number | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
  personalPhotoUrl,
  setPersonalPhotoUrl,
] = useState("");

const [
  selectedAvatarIcon,
  setSelectedAvatarIcon,
] = useState("🧒🏻");
const [
  crownLoading,
  setCrownLoading,
] = useState(true);

const [
  readingKingCount,
  setReadingKingCount,
] = useState(0);

const [
  spellingKingCount,
  setSpellingKingCount,
] = useState(0);

const [
  masteryCount,
  setMasteryCount,
] = useState(0);

const [
  latestCrownAchievement,
  setLatestCrownAchievement,
] =
  useState<CrownAchievement | null>(
    null
  );

const [
  latestCrownAssessment,
  setLatestCrownAssessment,
] =
  useState<CrownAssessmentPreview | null>(
    null
  );
  
  useEffect(() => {
    let active = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!active) {
            return;
          }

          // لا يوجد مستخدم مسجل
          if (!currentUser) {
            setUser(null);
            return;
          }

          try {
            /*
              لا نسمح لبقية صفحة الرحلة
              بالبدء قبل التحقق من دراسة الحالة.
            */
          const token =
  await currentUser.getIdToken(true);

            const response =
              await fetch(
                "/api/case-study-status",
                {
                  method: "GET",
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                  cache: "no-store",
                }
              );

            const data =
              await response.json();

            if (!active) {
              return;
            }

            if (
              !response.ok ||
              !data.success
            ) {
              throw new Error(
                data.message ||
                  "تعذر التحقق من دراسة الحالة."
              );
            }

            /*
              إذا لم تكتمل دراسة الحالة:
              لا نضع المستخدم في state،
              وبالتالي لا تبدأ بقية قراءات الرحلة.
            */
            if (
              data.completed !== true
            ) {
              window.location.replace(
                "/parent/case-study?required=1"
              );

              return;
            }

            /*
              دراسة الحالة مكتملة:
              الآن فقط نفتح بقية الرحلة.
            */
            setUser(currentUser);

            const tokenResult =
              await currentUser.getIdTokenResult(true);

            console.log(
              "🔎 student-id المحلي:",
              window.localStorage.getItem(
                "student-id"
              )
            );

            console.log(
              "🔎 studentDocId في التوكن:",
              tokenResult.claims.studentDocId
            );

            console.log(
              "🔎 studentId في التوكن:",
              tokenResult.claims.studentId
            );
          } catch (error) {
            console.error(
              "تعذر التحقق من دراسة الحالة:",
              error
            );

            /*
              بما أن الدراسة أصبحت إلزامية،
              لا نفتح الرحلة إذا فشل التحقق.
            */
            setUser(null);

            alert(
              "تعذر التحقق من دراسة الحالة حاليًا. يرجى المحاولة مرة أخرى."
            );
          }
        }
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const studentId =
      window.localStorage.getItem("student-id") || "";

    if (!studentId || studentId === "student-demo") {
      setNotifications([]);
      return;
    }

    const notificationsQuery = query(
  collection(db, "studentNotifications"),
  where("studentId", "==", studentId),
  orderBy("createdAt", "desc"),
  limit(20)
);

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((notificationDocument) => {
            const data = notificationDocument.data();

           return {
  id: notificationDocument.id,

  studentId:
    typeof data.studentId === "string"
      ? data.studentId
      : "",

  title:
    typeof data.title === "string"
      ? data.title
      : "إشعار جديد",

  message:
    typeof data.message === "string"
      ? data.message
      : "",

  type:
    typeof data.type === "string"
      ? data.type
      : "",

  homeworkId:
    typeof data.homeworkId === "string"
      ? data.homeworkId
      : "",

  href:
    typeof data.href === "string" &&
    data.href
      ? data.href
      : "/homeworks",

  read:
    data.read === true,

  milestoneId:
    typeof data.milestoneId === "string"
      ? data.milestoneId
      : "",

  badgeTitle:
    typeof data.badgeTitle === "string"
      ? data.badgeTitle
      : "",

  pointsReached:
    typeof data.pointsReached === "number"
      ? data.pointsReached
      : undefined,

  createdAt:
    data.createdAt ?? null,
} as StudentNotification;
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });

        setNotifications(items);
        const latestUnreadMilestone =
  items.find(
    (notification) =>
      notification.type ===
        "academy-milestone" &&
      !notification.read
  );

if (latestUnreadMilestone) {
  setCelebrationNotification(
    latestUnreadMilestone
  );
}
      },
      (error) => {
        console.error("تعذر تحميل إشعارات الطالب:", error);
      }
    );

    return unsubscribeNotifications;
  }, [user]);

 

  async function openNotification(notification: StudentNotification) {
    try {
      if (!notification.read) {
        await updateDoc(
          doc(db, "studentNotifications", notification.id),
          { read: true }
        );
      }
    } catch (error) {
      console.error("تعذر تحديث حالة الإشعار:", error);
    } finally {
      window.location.href = notification.href || "/homeworks";
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;

    async function loadJourneyData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const token =
          await currentUser.getIdToken();
// مزامنة تذكير استمارة التشخيص من الخادم الآمن.
try {
  await fetch(
    "/api/diagnostic-reminder",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
} catch (reminderError) {
  console.error(
    "تعذر مزامنة تذكير استمارة التشخيص:",
    reminderError
  );
}
        const response =
          await fetch(
            "/api/student-journey",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as JourneyData;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل بيانات الرحلة."
          );
        }

        setPoints(
          typeof data.points ===
            "number"
            ? data.points
            : 0
        );

        setStars(
          typeof data.stars ===
            "number"
            ? data.stars
            : 0
        );

        setStreak(
          typeof data.streak ===
            "number"
            ? data.streak
            : 0
        );

        setReadingDays(
          typeof data.readingDays ===
            "number"
            ? data.readingDays
            : 0
        );


        setFluencyLevel(
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
            : 1
        );
        setPersonalPhotoUrl(
          typeof data.personalPhotoUrl ===
            "string"
            ? data.personalPhotoUrl
            : ""
        );

        setSelectedAvatarIcon(
          typeof data.selectedAvatarIcon ===
            "string"
            ? data.selectedAvatarIcon
            : "🧒🏻"
        );

        setCompletedTasks(
          Array.isArray(
            data.completedTaskIds
          )
            ? data.completedTaskIds
            : []
        );

        setHomeworkStatus(
          data.homeworkStatus ??
            "none"
        );

        const savedFollowUp =
          data.smartFollowUp;

        if (
          savedFollowUp &&
          typeof savedFollowUp === "object"
        ) {
          setSmartFollowUp({
            date:
              typeof savedFollowUp.date ===
              "string"
                ? savedFollowUp.date
                : "",
            homeworkLabel:
              typeof savedFollowUp.homeworkLabel ===
              "string"
                ? savedFollowUp.homeworkLabel
                : "",
            readingLevelLabel:
              typeof savedFollowUp.readingLevelLabel ===
              "string"
                ? savedFollowUp.readingLevelLabel
                : "",
            readingAccuracyLabel:
              typeof savedFollowUp.readingAccuracyLabel ===
              "string"
                ? savedFollowUp.readingAccuracyLabel
                : "",
            readingFluencyLabel:
              typeof savedFollowUp.readingFluencyLabel ===
              "string"
                ? savedFollowUp.readingFluencyLabel
                : "",
            readingDiacriticsLabel:
              typeof savedFollowUp.readingDiacriticsLabel ===
              "string"
                ? savedFollowUp.readingDiacriticsLabel
                : "",
            readingNote:
              typeof savedFollowUp.readingNote ===
              "string"
                ? savedFollowUp.readingNote
                : "",
          });
        } else {
          setSmartFollowUp(null);
        }
      } catch (error) {
        console.error(
          "تعذر تحميل رحلة الطالب:",
          error
        );

        setErrorMessage(
          "تعذر تحميل بعض بيانات الرحلة حاليًا."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadJourneyData();
  }, [user]);
  useEffect(() => {
    if (!user) {
      setWeeklySummary(null);
      return;
    }

    const currentUser = user;

    async function loadWeeklySummary() {
      try {
        setWeeklySummaryLoading(true);

        const token =
          await currentUser.getIdToken();

        const response =
          await fetch(
            "/api/weekly-summary",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as WeeklySummary;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل موجز الأسبوع."
          );
        }

        setWeeklySummary(data);
      } catch (error) {
        console.error(
          "تعذر تحميل موجز الأسبوع:",
          error
        );

        setWeeklySummary(null);
      } finally {
        setWeeklySummaryLoading(false);
      }
    }

    void loadWeeklySummary();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;

    async function loadCrownData() {
      try {
        setCrownLoading(true);

        const token =
          await currentUser.getIdToken();

        const response =
          await fetch(
            "/api/student-crown",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as CrownData;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل تاج لغتي."
          );
        }

        setReadingKingCount(
          typeof data.readingKingCount ===
            "number"
            ? data.readingKingCount
            : 0
        );

        setSpellingKingCount(
          typeof data.spellingKingCount ===
            "number"
            ? data.spellingKingCount
            : 0
        );

        setMasteryCount(
          typeof data.masteryCount ===
            "number"
            ? data.masteryCount
            : 0
        );

        setLatestCrownAchievement(
          data.latestAchievement ?? null
        );

        setLatestCrownAssessment(
          data.latestAssessment ?? null
        );
      } catch (error) {
        console.error(
          "تعذر تحميل تاج لغتي:",
          error
        );

        setReadingKingCount(0);
        setSpellingKingCount(0);
        setMasteryCount(0);
        setLatestCrownAchievement(null);
        setLatestCrownAssessment(null);
      } finally {
        setCrownLoading(false);
      }
    }

    void loadCrownData();
  }, [user]);


  const completedCount =
    dailyTasks.filter((task) =>
      completedTasks.includes(task.id)
    ).length;

  const allTasksCompleted =
    completedCount ===
    dailyTasks.length;

  const progress = useMemo(() => {
    return Math.round(
      (completedCount /
        dailyTasks.length) *
        100
    );
  }, [completedCount]);

  const readingProgress =
    readingDays % 5;

  const displayedReadingProgress =
    readingDays > 0 &&
    readingProgress === 0
      ? 5
      : readingProgress;

  const remainingReadingDays =
    displayedReadingProgress === 5
      ? 0
      : 5 -
        displayedReadingProgress;
  /*
    * قمة الطلاقة:
    * fluencyLevel هو المستوى الرسمي المعتمد من المعلم.
    * عدد القراءات لا يرفع المستوى تلقائيًا؛
    * بل يفتح فقط بوابة اختبار المستوى التالي.
   */
  const fluencyCurrentLevel =
    fluencyLevels[
      Math.max(
        0,
        Math.min(
          7,
          fluencyLevel - 1
        )
      )
    ];

  const fluencyNextLevel =
    fluencyLevel < 8
      ? fluencyLevels[
          fluencyLevel
        ]
      : null;

  const fluencyReadingsNeeded =
    fluencyNextLevel
      ? Math.max(
          0,
          fluencyNextLevel.requirement -
            readingDays
        )
      : 0;

  const fluencyReadyForTest =
    Boolean(
      fluencyNextLevel &&
        fluencyReadingsNeeded === 0
    );

  const rank =
    points > 0 || stars > 0
      ? "بطل نشيط"
      : "بداية الرحلة";

  function getTaskActionState(
    taskId: number,
    completed: boolean
  ) {
    if (taskId === 2) {
      if (
        homeworkStatus ===
        "approved"
      ) {
        return {
          label:
            "✅ معتمد +3 نقاط",
          background:
            "#dcfce7",
          color: "#08734b",
          disabled: true,
        };
      }

      if (
        homeworkStatus ===
        "pending"
      ) {
        return {
          label:
            "⏳ بانتظار الاعتماد",
          background:
            "#fff7d6",
          color: "#8a6200",
          disabled: false,
        };
      }

      if (
        homeworkStatus ===
        "rejected"
      ) {
        return {
          label:
            "🔄 أعد إرفاق الواجب",
          background:
            "#fff0f0",
          color: "#b42318",
          disabled: false,
        };
      }

      return {
        label:
          "📎 أرفق واجبك",
        background:
          "#eef8ff",
        color: "#185b89",
        disabled: false,
      };
    }


    return {
      label:
        completed
          ? "✅ معتمد"
          : "⬜",
      background:
        completed
          ? "#dcfce7"
          : "transparent",
      color:
        completed
          ? "#08734b"
          : "#185b89",
      disabled: completed,
    };
  }

  async function completeTask(
    taskId: number
  ) {
    const selectedTask =
      dailyTasks.find(
        (task) => task.id === taskId
      );

    if (selectedTask?.href) {
      window.location.href =
        selectedTask.href;
      return;
    }

    if (!user) {
      alert(
        "يرجى تسجيل الدخول من جديد."
      );
      return;
    }

    if (
      completedTasks.includes(taskId)
    ) {
      return;
    }

    if (savingTaskId !== null) {
      return;
    }

    try {
      setSavingTaskId(taskId);

      const token =
        await user.getIdToken();

      const response =
        await fetch(
          "/api/student-journey",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              taskId,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "تعذر حفظ المهمة."
        );
      }

      if (
        typeof data.points ===
        "number"
      ) {
        setPoints(data.points);
      }

      if (
        typeof data.stars ===
        "number"
      ) {
        setStars(data.stars);
      }

      if (
        typeof data.streak ===
        "number"
      ) {
        setStreak(data.streak);
      }

      setCompletedTasks(
        (currentTasks) =>
          currentTasks.includes(
            taskId
          )
            ? currentTasks
            : [
                ...currentTasks,
                taskId,
              ]
      );
    } catch (error) {
      console.error(
        "تعذر إكمال المهمة:",
        error
      );

      alert(
        "تعذر حفظ المهمة، حاول مرة أخرى."
      );
    } finally {
      setSavingTaskId(null);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effbf4 0%, #f7fbff 48%, #fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#17352a",
        paddingBottom: "50px",
      }}
    >
      {weeklySummary?.shouldShow && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12000,
            background: "rgba(15, 23, 42, 0.68)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: "18px",
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: "30px",
              background:
                "linear-gradient(145deg,#ffffff 0%,#f4fff8 58%,#fffaf0 100%)",
              border: "2px solid #b9e4cc",
              boxShadow: "0 28px 80px rgba(0,0,0,.28)",
              padding: "26px 22px",
              position: "relative",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "86px",
                  height: "86px",
                  margin: "0 auto 14px",
                  borderRadius: "24px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "48px",
                  background:
                    "linear-gradient(135deg,#dff8ea,#fff3bd)",
                  border: "2px solid #c4e8d4",
                }}
              >
                📊
              </div>

              <div
                style={{
                  color: "#8a6500",
                  fontWeight: 900,
                  fontSize: "13px",
                  marginBottom: "5px",
                }}
              >
                ولي أمري العزيز 🌟
              </div>

              <h2
                style={{
                  margin: "0 0 8px",
                  color: "#126b49",
                  fontSize: "clamp(25px,5vw,34px)",
                  lineHeight: 1.4,
                }}
              >
                موجز مستوى هذا الأسبوع
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#607268",
                  lineHeight: 1.8,
                  fontWeight: 700,
                }}
              >
                هذا موجز تقدمي خلال الأسبوع الدراسي.
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "20px",
                background:
                  weeklySummary.status === "excellent"
                    ? "#ecfdf5"
                    : weeklySummary.status === "good"
                    ? "#fffbea"
                    : "#fff7ed",
                border:
                  weeklySummary.status === "excellent"
                    ? "1px solid #b9e7cf"
                    : weeklySummary.status === "good"
                    ? "1px solid #f0dfa3"
                    : "1px solid #f1c8a8",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#64748b",
                  marginBottom: "5px",
                }}
              >
                المستوى العام
              </div>

              <strong
                style={{
                  display: "block",
                  color:
                    weeklySummary.status === "excellent"
                      ? "#08734b"
                      : weeklySummary.status === "good"
                      ? "#8a6200"
                      : "#b45309",
                  fontSize: "24px",
                }}
              >
                {weeklySummary.statusLabel}
              </strong>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap: "11px",
                marginBottom: "16px",
              }}
            >
              <div style={weeklySummaryMetricStyle}>
                <span>📖 القراءة</span>
                <strong>{weeklySummary.readingDays} / 5 أيام</strong>
              </div>
              <div style={weeklySummaryMetricStyle}>
                <span>📝 الواجبات المعتمدة</span>
                <strong>{weeklySummary.homeworkApproved}</strong>
              </div>
              <div style={weeklySummaryMetricStyle}>
                <span>📤 الواجبات المرفوعة</span>
                <strong>{weeklySummary.homeworkSubmitted}</strong>
              </div>
              <div style={weeklySummaryMetricStyle}>
                <span>🚀 أيام النشاط</span>
                <strong>{weeklySummary.activityDays} / 5</strong>
              </div>
              <div style={weeklySummaryMetricStyle}>
                <span>⭐ نقاط الأسبوع</span>
                <strong>{weeklySummary.weeklyPoints}</strong>
              </div>
            </div>

            <div
              style={{
                padding: "15px",
                borderRadius: "18px",
                background:
                  "linear-gradient(135deg,#eef8ff,#ffffff)",
                border: "1px solid #d8eaf5",
                color: "#476174",
                lineHeight: 1.8,
                fontWeight: 700,
                marginBottom: "18px",
              }}
            >
              🦸 فارس يقول: استمروا في دعم بطل لغتي بالقراءة اليومية وإنجاز المهام، فكل تقدم صغير يصنع فرقًا كبيرًا.
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "15px",
                borderRadius: "18px",
                background: "#f8fafc",
                border: "2px solid #d9e5df",
                cursor: savingWeeklySummaryView
                  ? "default"
                  : "pointer",
                fontWeight: 900,
                color: "#17352a",
              }}
            >
              <input
                type="checkbox"
                disabled={savingWeeklySummaryView}
                onChange={async (event) => {
                  if (!event.target.checked || !user) {
                    return;
                  }

                  try {
                    setSavingWeeklySummaryView(true);
                    const token = await user.getIdToken();
                    const response = await fetch(
                      "/api/weekly-summary",
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                      throw new Error(
                        data.message || "تعذر تسجيل الاطلاع."
                      );
                    }

                    setWeeklySummary((current) =>
                      current
                        ? {
                            ...current,
                            shouldShow: false,
                            parentViewed: true,
                          }
                        : null
                    );
                  } catch (error) {
                    console.error(
                      "تعذر تسجيل اطلاع ولي الأمر:",
                      error
                    );
                    event.target.checked = false;
                    alert(
                      "تعذر تسجيل الاطلاع حاليًا، حاول مرة أخرى."
                    );
                  } finally {
                    setSavingWeeklySummaryView(false);
                  }
                }}
                style={{
                  width: "22px",
                  height: "22px",
                  accentColor: "#168a63",
                  flexShrink: 0,
                }}
              />

              <span>
                {savingWeeklySummaryView
                  ? "جارٍ تسجيل الاطلاع..."
                  : "لقد اطّلعت على مستوى ابني"}
              </span>
            </label>

            <p
              style={{
                margin: "12px 0 0",
                textAlign: "center",
                color: "#7b8b83",
                fontSize: "12px",
                lineHeight: 1.7,
                fontWeight: 700,
              }}
            >
              ستغلق هذه النافذة بعد تسجيل اطلاع ولي الأمر.
            </p>
          </div>
        </div>
      )}

    {celebrationNotification && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(15, 23, 42, 0.62)",
      backdropFilter: "blur(5px)",
      display: "grid",
      placeItems: "center",
      padding: "20px",
    }}
  >
    <div
      style={{
        width: "min(500px, 100%)",
        borderRadius: "30px",
        background:
          "linear-gradient(145deg,#fffdf3 0%,#ffffff 55%,#f7f1ff 100%)",
        border: "2px solid #efd77b",
        boxShadow: "0 26px 70px rgba(0,0,0,.25)",
        padding: "28px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "12px",
          right: "18px",
          fontSize: "28px",
        }}
      >
        ✨
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "14px",
          left: "18px",
          fontSize: "25px",
        }}
      >
        🎊
      </div>

      <div
        style={{
          width: "92px",
          height: "92px",
          margin: "0 auto 16px",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: "54px",
          background:
            "linear-gradient(135deg,#fff0a8,#fff8d8)",
          border: "3px solid #e9c94f",
          boxShadow:
            "0 12px 28px rgba(180,140,20,.18)",
        }}
      >
        🏆
      </div>

      <div
        style={{
          color: "#8a6500",
          fontWeight: 900,
          fontSize: "14px",
          marginBottom: "7px",
        }}
      >
        إنجاز تاريخي في أكاديمية لغتي
      </div>

      <h2
        style={{
          margin: "0 0 12px",
          color: "#174c36",
          fontSize: "clamp(26px,5vw,36px)",
          lineHeight: 1.4,
        }}
      >
        أحسنت يا بطل! 🎉
      </h2>

      <p
        style={{
          margin: "0 auto 18px",
          maxWidth: "420px",
          color: "#58685f",
          lineHeight: 1.9,
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        {celebrationNotification.message}
      </p>

      {celebrationNotification.badgeTitle && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "#fff4c7",
            color: "#805b00",
            fontWeight: 900,
            marginBottom: "12px",
            border: "1px solid #ead487",
          }}
        >
          🥇 {celebrationNotification.badgeTitle}
        </div>
      )}

      {typeof celebrationNotification.pointsReached ===
        "number" && (
        <div
          style={{
            marginBottom: "18px",
            color: "#6d4bc3",
            fontWeight: 900,
            fontSize: "14px",
          }}
        >
          ⭐ وصلت إلى {celebrationNotification.pointsReached} نقطة
        </div>
      )}

      <button
        type="button"
        onClick={async () => {
          try {
            await updateDoc(
              doc(
                db,
                "studentNotifications",
                celebrationNotification.id
              ),
              {
                read: true,
              }
            );
          } catch (error) {
            console.error(
              "تعذر تسجيل عرض احتفالية الإنجاز:",
              error
            );
          } finally {
            setCelebrationNotification(null);
          }
        }}
        style={{
          width: "100%",
          border: "none",
          borderRadius: "17px",
          padding: "15px 18px",
          background:
            "linear-gradient(135deg,#168a63,#0f7654)",
          color: "#ffffff",
          fontSize: "17px",
          fontWeight: 900,
          cursor: "pointer",
          boxShadow:
            "0 8px 18px rgba(22,138,99,.20)",
        }}
      >
        رائع! أكمل رحلتي 🚀
      </button>
    </div>
  </div>
)}
      <header
        style={{
          background:
            "linear-gradient(135deg, #157347, #239764)",
          color: "white",
          padding: "22px 18px",
          boxShadow:
            "0 6px 20px rgba(20, 90, 60, 0.18)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                fontSize: "14px",
                opacity: 0.9,
              }}
            >
              أكاديمية لغتي الرقمية
            </p>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(27px, 5vw, 42px)",
              }}
            >
              رحلتي 🚀
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "16px",
                lineHeight: 1.7,
              }}
            >
              نتعلّم… نقرأ… نبدع
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                position: "relative",
              }}
            >
              <button
                type="button"
                aria-label="الإشعارات"
                onClick={() =>
                  setNotificationsOpen((current) => !current)
                }
                style={{
                  ...headerButtonStyle,
                  position: "relative",
                  minWidth: "52px",
                  fontSize: "22px",
                  padding: "10px 14px",
                }}
              >
                🔔
                {unreadNotificationsCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-7px",
                      right: "-7px",
                      minWidth: "23px",
                      height: "23px",
                      padding: "0 6px",
                      borderRadius: "999px",
                      background: "#dc2626",
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "12px",
                      fontWeight: 900,
                      border: "2px solid #ffffff",
                    }}
                  >
                    {unreadNotificationsCount > 99
                      ? "99+"
                      : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "58px",
                    left: 0,
                    width: "min(360px, calc(100vw - 32px))",
                    maxHeight: "430px",
                    overflowY: "auto",
                    background: "#ffffff",
                    color: "#17352a",
                    borderRadius: "20px",
                    border: "1px solid #dcebe3",
                    boxShadow: "0 18px 45px rgba(15, 70, 50, 0.22)",
                    zIndex: 1000,
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      padding: "5px 5px 11px",
                      borderBottom: "1px solid #edf3ef",
                    }}
                  >
                    <strong style={{ color: "#126b49" }}>🔔 إشعاراتي</strong>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: 800,
                      }}
                    >
                      {unreadNotificationsCount > 0
                        ? `${unreadNotificationsCount} جديد`
                        : "لا جديد"}
                    </span>
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 12px",
                        textAlign: "center",
                        color: "#64748b",
                        lineHeight: 1.8,
                        fontWeight: 700,
                      }}
                    >
                      لا توجد إشعارات جديدة الآن 🌟
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "8px", marginTop: "9px" }}>
                      {notifications.slice(0, 12).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => void openNotification(notification)}
                          style={{
                            width: "100%",
                            border: notification.read
                              ? "1px solid #e5ece8"
                              : "1px solid #9eddbd",
                            background: notification.read
                              ? "#ffffff"
                              : "#effcf5",
                            borderRadius: "15px",
                            padding: "12px",
                            cursor: "pointer",
                            textAlign: "right",
                            color: "#17352a",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                              marginBottom: "5px",
                            }}
                          >
                            <strong style={{ color: "#126b49", fontSize: "14px" }}>
                              {notification.title}
                            </strong>
                            {!notification.read && (
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "50%",
                                  background: "#16a34a",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                          <div
                            style={{
                              color: "#5f7067",
                              fontSize: "13px",
                              lineHeight: 1.7,
                            }}
                          >
                            {notification.message}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <InstallAppButton />
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/parent";
              }}
              style={
                headerButtonStyle
              }
            >
              👨‍👩‍👦 ولي الأمر
            </button>

            <button
              type="button"
              onClick={() => {
                const confirmed =
                  window.confirm(
                    "هل تريد تسجيل الخروج؟"
                  );

                if (confirmed) {
                  window.location.href =
                    "/login";
                }
              }}
              style={
                headerButtonStyle
              }
            >
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "22px 16px",
        }}
      >
        {/* الترحيب */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
        <div
  style={{
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#e6f8ed",
    display: "grid",
    placeItems: "center",
    fontSize: "40px",
    flexShrink: 0,
    overflow: "hidden",
    border:
      "3px solid #d5eee1",
  }}
>
  {personalPhotoUrl ? (
    <img
      src={personalPhotoUrl}
      alt="صورة الطالب"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <span>
      {selectedAvatarIcon}
    </span>
  )}
</div>

            <div>
              <h2
                style={{
                  margin: "0 0 7px",
                  color: "#176c46",
                  fontSize: "23px",
                }}
              >
               {studentName
  ? `أهلاً بك يا ${studentName} 🌟`
  : "أهلاً بك يا بطل! 🌟"}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#587064",
                  lineHeight: 1.8,
                }}
              >
                فارس سعيد بوجودك
                اليوم، هيا نكمل
                رحلتنا ونحقق إنجازًا
                جديدًا.
              </p>
            </div>
          </div> 
        </section>

        {/* أساس لغتي - تنبيه مراجعة المهارات */}
        <Link
          href="/foundation"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            marginBottom: "20px",
          }}
        >
          <section
            style={{
              border: "2px solid #a7dfc2",
              background:
                "linear-gradient(135deg, #eafff3 0%, #ffffff 58%, #fff8df 100%)",
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 10px 28px rgba(20, 110, 70, 0.10)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "-18px", left: "-12px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.08)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 430px" }}>
                <div style={{ width: "62px", height: "62px", borderRadius: "19px", background: "linear-gradient(135deg, #d8f7e6, #fff4c9)", display: "grid", placeItems: "center", fontSize: "34px", flexShrink: 0, border: "1px solid #c5ead6" }}>🌱</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
                    <strong style={{ color: "#126b49", fontSize: "21px" }}>راجع معلوماتك واختبر مهاراتك</strong>
                    <span style={{ background: "#fff1b8", color: "#7a5900", padding: "5px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: 900 }}>أساس لغتي</span>
                  </div>
                  <p style={{ margin: 0, color: "#5d7167", lineHeight: 1.8, fontWeight: 700 }}>مهمة قصيرة تساعدك على تقوية مهاراتك السابقة. ابدأ اليوم بمهارة السكون.</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ background: "#ffffff", border: "1px solid #d7e9df", color: "#5c6f65", borderRadius: "13px", padding: "10px 12px", fontWeight: 800, whiteSpace: "nowrap" }}>⏱️ 4 دقائق</span>
                <span style={{ background: "linear-gradient(135deg, #168a63, #0f7654)", color: "#ffffff", borderRadius: "14px", padding: "11px 16px", fontWeight: 900, whiteSpace: "nowrap", boxShadow: "0 6px 14px rgba(22, 138, 99, 0.18)" }}>ابدأ الآن ←</span>
              </div>
            </div>
          </section>
        </Link>

        {/* مستواي اليوم */}

        <section
          style={{
            ...cardStyle,
            border:
              "2px solid #cfe9dd",
            background:
              "linear-gradient(135deg,#ffffff 0%,#effcf6 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#126b49",
                  fontSize: "24px",
                }}
              >
                🌟 مستواي اليوم
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                }}
              >
                شاهد ما أتقنته وما يمكنني تحسينه.
              </p>
            </div>

            {smartFollowUp?.date && (
              <span
                style={{
                  padding:
                    "7px 12px",
                  borderRadius:
                    "999px",
                  background:
                    "#dcfce7",
                  color: "#08734b",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                📅{" "}
                {smartFollowUp.date}
              </span>
            )}
          </div>

          {!smartFollowUp ? (
            <div
              style={{
                padding: "18px",
                borderRadius:
                  "18px",
                background:
                  "#f8fafc",
                color: "#64748b",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              ⏳ لم يسجل المعلم تقييمًا جديدًا حتى الآن.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "17px",
                  borderRadius:
                    "20px",
                  background:
                    "#eef8ff",
                  border:
                    "1px solid #d4eafb",
                  marginBottom:
                    "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "10px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "14px",
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        "18px",
                      color:
                        "#075985",
                    }}
                  >
                    📖 قراءتي
                  </strong>

                  <span
                    style={{
                      background:
                        "#ffffff",
                      borderRadius:
                        "999px",
                      padding:
                        "7px 12px",
                      fontWeight: 900,
                      color:
                        "#075985",
                    }}
                  >
                    {smartFollowUp.readingLevelLabel ||
                      "لم أُقيّم بعد"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(135px,1fr))",
                    gap: "10px",
                  }}
                >
                  <div
                    style={
                      studentLevelCardStyle
                    }
                  >
                    <span>
                      🎯 الدقة
                    </span>

                    <strong>
                      {smartFollowUp.readingAccuracyLabel ||
                        "لم أُقيّم"}
                    </strong>
                  </div>

                  <div
                    style={
                      studentLevelCardStyle
                    }
                  >
                    <span>
                      ⚡ الطلاقة
                    </span>

                    <strong>
                      {smartFollowUp.readingFluencyLabel ||
                        "لم أُقيّم"}
                    </strong>
                  </div>

                  <div
                    style={
                      studentLevelCardStyle
                    }
                  >
                    <span>
                      🎨 الحركات
                    </span>

                    <strong>
                      {smartFollowUp.readingDiacriticsLabel ||
                        "لم أُقيّم"}
                    </strong>
                  </div>
                </div>

                {smartFollowUp.readingNote && (
                  <div
                    style={{
                      marginTop:
                        "12px",
                      padding:
                        "13px",
                      background:
                        "#ffffff",
                      borderRadius:
                        "15px",
                      color:
                        "#475569",
                      lineHeight: 1.8,
                      fontWeight: 700,
                    }}
                  >
                    💬 معلمي يقول:{" "}
                    {
                      smartFollowUp.readingNote
                    }
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "17px",
                  borderRadius:
                    "20px",
                  background:
                    "#fff8e7",
                  border:
                    "1px solid #f0dfae",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color:
                      "#8a5b00",
                    marginBottom:
                      "8px",
                    fontSize:
                      "18px",
                  }}
                >
                  📝 إنجاز واجبي
                </strong>

                <div
                  style={{
                    fontWeight: 900,
                    color:
                      "#735316",
                    lineHeight: 1.8,
                  }}
                >
                  {smartFollowUp.homeworkLabel ||
                    "لم تُسجل متابعة الواجب بعد"}
                </div>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  padding: "15px",
                  borderRadius:
                    "18px",
                  background:
                    "linear-gradient(135deg,#eaf9f1,#ffffff)",
                  border:
                    "1px solid #cfead9",
                  color: "#176c46",
                  lineHeight: 1.8,
                  fontWeight: 800,
                }}
              >
                🦸 فارس يقول: استمر يا بطل! كل تدريب صغير اليوم يجعلك قارئًا أقوى غدًا. 🌟
              </div>
            </>
          )}
        </section>

        {errorMessage && (
          <section
            style={{
              ...cardStyle,
              background: "#fff7ed",
              color: "#9a3412",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </section>
        )}

        {/* مدرستي اليوم */}

        <section
          style={{
            ...cardStyle,
            padding: "20px",
            border:
              "2px solid #cdeee0",
            background:
              "linear-gradient(135deg, #f0fff7, #f7fbff)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  color: "#126b49",
                  fontSize: "24px",
                }}
              >
                🏫 مدرستي اليوم
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#627168",
                  lineHeight: 1.7,
                }}
              >
                اعرف جدولك، وتابع حصتك الحالية والقادمة بسهولة.
              </p>
            </div>

            <span
              style={{
                background: "#dcfce7",
                color: "#08734b",
                padding: "8px 13px",
                borderRadius:
                  "999px",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              يوم منظم ✨
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "14px",
            }}
          >
            <Link
              href="/school-day"
              style={{
                textDecoration:
                  "none",
                color: "#17352a",
                background:
                  "linear-gradient(135deg, #e8fff2, #ffffff)",
                border:
                  "2px solid #9ee3bf",
                borderRadius:
                  "20px",
                padding: "18px",
                display: "flex",
                alignItems:
                  "center",
                gap: "15px",
                boxShadow:
                  "0 6px 16px rgba(20, 100, 70, 0.07)",
              }}
            >
              <span
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius:
                    "17px",
                  background:
                    "#d7f7e6",
                  display: "grid",
                  placeItems:
                    "center",
                  fontSize: "30px",
                  flexShrink: 0,
                }}
              >
                ⏰
              </span>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "20px",
                    color: "#126b49",
                    marginBottom:
                      "5px",
                  }}
                >
                  يومي الدراسي
                </strong>

                <span
                  style={{
                    color: "#64756d",
                    lineHeight: 1.6,
                  }}
                >
                  الحصة الحالية، القادمة، وبقية اليوم
                </span>
              </div>
            </Link>

     <Link
  href="/school-schedule"
  style={{
    textDecoration: "none",
    color: "#17352a",
    background:
      "linear-gradient(135deg, #edf6ff, #ffffff)",
    border: "2px solid #b9d9f5",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 6px 16px rgba(40, 90, 130, 0.07)",
  }}
>
  <span
    style={{
      width: "55px",
      height: "55px",
      borderRadius: "17px",
      background: "#dceeff",
      display: "grid",
      placeItems: "center",
      fontSize: "30px",
      flexShrink: 0,
    }}
  >
    📅
  </span>

  <div>
    <strong
      style={{
        display: "block",
        fontSize: "20px",
        color: "#185b89",
        marginBottom: "5px",
      }}
    >
      جدولي المدرسي
    </strong>

    <span
      style={{
        color: "#64748b",
        lineHeight: 1.6,
      }}
    >
      شاهد حصص الأسبوع كاملة في مكان واحد
    </span>
  </div>
</Link>

<Link
  href="/madrasati-bridge"
  style={{
    textDecoration: "none",
    color: "#17352a",
    background:
      "linear-gradient(135deg, #fff7e8, #ffffff)",
    border: "2px solid #f4d39a",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 6px 16px rgba(130, 90, 20, 0.07)",
  }}
>
  <span
    style={{
      width: "55px",
      height: "55px",
      borderRadius: "17px",
      background: "#fff0cf",
      display: "grid",
      placeItems: "center",
      fontSize: "30px",
      flexShrink: 0,
    }}
  >
    🌉
  </span>

  <div>
    <strong
      style={{
        display: "block",
        fontSize: "20px",
        color: "#9a6400",
        marginBottom: "5px",
      }}
    >
      جسر مدرستي
    </strong>

    <span
      style={{
        color: "#6f746f",
        lineHeight: 1.6,
      }}
    >
      أنجز مهامك في مدرستي ثم عد للأكاديمية
    </span>
  </div>
</Link>
          </div>
        </section>

        {/* الإحصاءات */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            icon="⭐"
            title="نقاطي"
            value={
              loading
                ? "..."
                : String(points)
            }
          />

          <StatCard
            icon="🔥"
            title="سلسلة الإنجاز"
            value={
              loading
                ? "..."
                : `${streak} ${
                    streak === 1
                      ? "يوم"
                      : "أيام"
                  }`
            }
          />

          <StatCard
            icon="👑"
            title="رتبتي"
            value={
              loading
                ? "..."
                : rank
            }
          />
        </section>
{/* تاج لغتي */}

<section
  style={{
    ...cardStyle,
    border: "2px solid #edc84d",
    background:
      "linear-gradient(135deg,#fff7c9 0%,#fffdf2 55%,#ffffff 100%)",
    position: "relative",
    overflow: "hidden",
  }}
>
  <div
    style={{
      position: "absolute",
      top: "12px",
      left: "18px",
      fontSize: "30px",
      opacity: 0.35,
    }}
  >
    ✨
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          color: "#805b00",
          fontSize: "25px",
        }}
      >
        👑 تاج لغتي
      </h2>

      <p
        style={{
          margin: 0,
          color: "#7f7147",
          lineHeight: 1.7,
        }}
      >
        هنا أحتفظ بتيجاني وإنجازاتي في القراءة والإملاء.
      </p>
    </div>

    <Link
      href="/lughati-crown"
      style={{
        textDecoration: "none",
        padding: "10px 15px",
        borderRadius: "14px",
        background: "#8a6500",
        color: "#ffffff",
        fontWeight: 900,
      }}
    >
      شاهد تيجاني ←
    </Link>
  </div>

  {crownLoading ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background: "rgba(255,255,255,.65)",
        textAlign: "center",
        color: "#8a783e",
        fontWeight: 800,
      }}
    >
      ⏳ جارٍ تجهيز تيجاني...
    </div>
  ) : (
    <>
      {latestCrownAssessment && (
        <div
          style={{
            marginBottom: "14px",
            padding: "16px",
            borderRadius: "18px",
            background: "#ffffff",
            border: "2px solid #d9e9df",
            boxShadow:
              "0 7px 18px rgba(24,108,70,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "9px",
            }}
          >
            <strong
              style={{
                color: "#176c46",
                fontSize: "17px",
              }}
            >
              📘 آخر تقييم من معلمي
            </strong>

            <span
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#fff6cf",
                color: "#8a6500",
                fontWeight: 900,
              }}
            >
              {latestCrownAssessment.title}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(145px,1fr))",
              gap: "9px",
              color: "#5f6f67",
              fontWeight: 700,
              lineHeight: 1.7,
            }}
          >
            <span>
              📚 الدرس: {latestCrownAssessment.lessonName || "—"}
            </span>
            <span>
              📄 الصفحة: {latestCrownAssessment.pageNumber || "—"}
            </span>
            <span>
              ✅ أفضل نتيجة: {latestCrownAssessment.bestErrors} أخطاء
            </span>
            <span>
              🔁 المحاولات: {latestCrownAssessment.attemptCount}
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
          gap: "11px",
        }}
      >
        <div style={crownStatStyle}>
          <span
            style={{
              fontSize: "29px",
            }}
          >
            📖👑
          </span>

          <strong>
            {readingKingCount}
          </strong>

          <small>
            تاج قراءة
          </small>
        </div>

        <div style={crownStatStyle}>
          <span
            style={{
              fontSize: "29px",
            }}
          >
            ✍️👑
          </span>

          <strong>
            {spellingKingCount}
          </strong>

          <small>
            تاج إملاء
          </small>
        </div>

        <div style={crownStatStyle}>
          <span
            style={{
              fontSize: "29px",
            }}
          >
            💎
          </span>

          <strong>
            {masteryCount}
          </strong>

          <small>
            إتقان كامل
          </small>
        </div>
      </div>

      {latestCrownAchievement ? (
        <div
          style={{
            marginTop: "14px",
            padding: "15px",
            borderRadius: "18px",
            background: "#ffffff",
            border: "1px solid #edd88a",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              background: "#fff8d9",
              border: "2px solid #e6bf3d",
              fontSize: "31px",
              flexShrink: 0,
            }}
          >
            {latestCrownAchievement.personalPhotoUrl ? (
              <img
                src={
                  latestCrownAchievement.personalPhotoUrl
                }
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>
                {latestCrownAchievement.selectedAvatarIcon ||
                  selectedAvatarIcon}
              </span>
            )}
          </div>

          <div>
            <div
              style={{
                color: "#8a6500",
                fontWeight: 900,
                fontSize: "17px",
              }}
            >
              {
                latestCrownAchievement.kingTitle
              }
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#6c705f",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              في درس:{" "}
              {
                latestCrownAchievement.lessonName
              }
            </div>

            {latestCrownAchievement.fullMastery && (
              <div
                style={{
                  marginTop: "5px",
                  color: "#16724d",
                  fontSize: "13px",
                  fontWeight: 900,
                }}
              >
                💎 إتقان كامل للدرس
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: "14px",
            padding: "15px",
            textAlign: "center",
            borderRadius: "18px",
            background: "rgba(255,255,255,.6)",
            color: "#8b7a46",
            fontWeight: 800,
          }}
        >
          🌱 ابدأ رحلتك نحو أول تاج في القراءة أو الإملاء.
        </div>
      )}
    </>
  )}
</section>
        {allTasksCompleted && (
          <section
            style={{
              background:
                "linear-gradient(135deg, #fff4bd, #fffdf2)",
              border:
                "3px solid #f3c94f",
              borderRadius: "26px",
              padding: "26px 20px",
              marginBottom: "22px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "46px",
                marginBottom: "10px",
              }}
            >
              🎉 ⭐ 🏅 ⭐ 🎉
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                color: "#8a6500",
              }}
            >
              أحسنت يا بطل!
            </h2>

            <p
              style={{
                margin: 0,
                color: "#6f5a1c",
                lineHeight: 1.8,
              }}
            >
              أكملت جميع مهام اليوم بنجاح ✅
              <strong>
                {" "}
                وتُحتسب مكافأة الواجب بعد اعتماد المعلم فقط.
              </strong>
            </p>
          </section>
        )}

        {/* تقدمي اليوم */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                  fontSize: "24px",
                  color: "#176c46",
                }}
              >
                🌟 تقدمي اليوم
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#687b72",
                }}
              >
                أنجزت{" "}
                {completedCount} من{" "}
                {dailyTasks.length} مهام
              </p>
            </div>

            <strong
              style={{
                background: "#e7f8ee",
                color: "#157347",
                padding: "9px 14px",
                borderRadius: "20px",
                fontSize: "18px",
              }}
            >
              {progress}%
            </strong>
          </div>

          <div
            style={{
              width: "100%",
              height: "18px",
              background: "#e5eee9",
              borderRadius:
                "999px",
              overflow: "hidden",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #25a765, #64d58f)",
                borderRadius:
                  "999px",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {dailyTasks.map(
              (task) => {
                const completed =
                  completedTasks.includes(
                    task.id
                  );

                const actionState =
                  getTaskActionState(
                    task.id,
                    completed
                  );

                return (
                  <button
                    key={task.id}
                    type="button"
                    disabled={
                      actionState.disabled ||
                      savingTaskId !==
                        null ||
                      loading
                    }
                    onClick={() =>
                      completeTask(
                        task.id
                      )
                    }
                    style={{
                      width: "100%",
                      border:
                        completed
                          ? "2px solid #3bb978"
                          : "2px solid #e3ece7",
                      background:
                        completed
                          ? "#edfbf3"
                          : "#ffffff",
                      borderRadius:
                        "18px",
                      padding: "15px",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "12px",
                      cursor:
                        actionState.disabled
                          ? "default"
                          : "pointer",
                      textAlign:
                        "right",
                      color: "#17352a",
                      opacity:
                        savingTaskId !==
                          null &&
                        savingTaskId !==
                          task.id
                          ? 0.7
                          : 1,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          width: "42px",
                          height:
                            "42px",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "13px",
                          background:
                            completed
                              ? "#c9f1d9"
                              : "#f3f7f5",
                          fontSize:
                            "23px",
                        }}
                      >
                        {completed
                          ? "✅"
                          : task.icon}
                      </span>

                      <span>
                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "17px",
                            marginBottom:
                              "5px",
                          }}
                        >
                          {task.title}
                        </strong>

                        <small
                          style={{
                            color:
                              "#718077",
                          }}
                        >
                          المكافأة:{" "}
                          {task.reward}
                        </small>
                      </span>
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth:
                          task.href
                            ? "126px"
                            : "42px",
                        padding:
                          task.href
                            ? "8px 11px"
                            : "0",
                        borderRadius:
                          task.href
                            ? "12px"
                            : "0",
                        background:
                          actionState.background,
                        color:
                          actionState.color,
                        fontSize:
                          task.href
                            ? "12px"
                            : "22px",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {savingTaskId ===
                      task.id
                        ? "⏳"
                        : actionState.label}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* المكافأة والسلسلة */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={
              rewardCardStyle
            }
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "8px",
              }}
            >
              🎁
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#7b5c00",
              }}
            >
              {allTasksCompleted
                ? "تم فتح المكافأة 🎉"
                : "المكافأة القادمة"}
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                color: "#6e623a",
              }}
            >
              {allTasksCompleted
                ? "أحسنت! حصلت على مكافأة النشاط اليومي."
                : `بقيت لك ${
                    dailyTasks.length -
                    completedCount
                  } مهام لإكمال تحدي اليوم.`}
            </p>
          </div>

          <div
            style={
              streakCardStyle
            }
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "8px",
              }}
            >
              🔥
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#a34025",
              }}
            >
              سلسلة الإنجاز
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                color: "#795044",
              }}
            >
              {streak > 0 ? (
                <>
                  أنت مستمر منذ{" "}
                  <strong>
                    {streak} أيام
                  </strong>
                  . واصل تألقك يا بطل!
                </>
              ) : (
                <>
                  ابدأ اليوم أول خطوة
                  في سلسلة إنجازك 🔥
                </>
              )}
            </p>
          </div>
        </section>

        {/* مستواي في قمة الطلاقة */}

        <Link
          href="/reading-journey/fluency-levels"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            marginBottom: "18px",
          }}
        >
          <section
            style={{
              ...cardStyle,
              background:
                "linear-gradient(135deg, #fff7ed, #fffbeb)",
              border: "1px solid #fed7aa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#b45309",
                    marginBottom: "6px",
                  }}
                >
                  🏔️ مستواي في الطلاقة
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#92400e",
                  }}
                >
                  {fluencyCurrentLevel.icon} المستوى{" "}
                  {fluencyCurrentLevel.number} —{" "}
                  {fluencyCurrentLevel.title}
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#78716c",
                    lineHeight: 1.8,
                    fontWeight: 700,
                  }}
                >
                  📖 قراءاتي المعتمدة:{" "}
                  <strong>{readingDays}</strong>
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    color: fluencyReadyForTest
                      ? "#047857"
                      : "#9a3412",
                    lineHeight: 1.8,
                    fontWeight: 900,
                  }}
                >
                  {fluencyReadyForTest
                    ? "🎉 أصبحت جاهزًا لاختبار المستوى 2"
                    : `بقيت ${fluencyReadingsNeeded} قراءة معتمدة لفتح اختبار المستوى 2`}
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #fdba74",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  color: "#9a3412",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                قمة الطلاقة ←
              </div>
            </div>
          </section>
        </Link>

        {/* رحلة القراءة */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#0f6b52",
                }}
              >
                🔥 رحلة القراءة
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                اقرأ في 5 أيام لتحصل
                على 50 نقطة
              </div>
            </div>

            <div
              style={{
                background: "#ecfdf5",
                color: "#047857",
                padding: "8px 14px",
                borderRadius:
                  "999px",
                fontWeight: 900,
              }}
            >
              {
                displayedReadingProgress
              }{" "}
              / 5
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, 1fr)",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            {[1, 2, 3, 4, 5].map(
              (day) => (
                <div
                  key={day}
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "11px 4px",
                    borderRadius:
                      "14px",
                    background:
                      day <=
                      displayedReadingProgress
                        ? "#dcfce7"
                        : "#f1f5f9",
                    border:
                      day <=
                      displayedReadingProgress
                        ? "1px solid #86efac"
                        : "1px solid #e2e8f0",
                    fontSize:
                      "21px",
                  }}
                >
                  {day <=
                  displayedReadingProgress
                    ? day === 5
                      ? "👑"
                      : "⭐"
                    : "○"}
                </div>
              )
            )}
          </div>

          <div
            style={{
              textAlign: "center",
              fontWeight: 800,
              color: "#475569",
            }}
          >
            {displayedReadingProgress ===
            5
              ? "🎉 أكملت خمسة أيام قراءة وحصلت على المكافأة!"
              : remainingReadingDays ===
                  1
                ? "🔥 بقي يوم واحد فقط لتحصل على +50 نقطة!"
                : `بقيت ${remainingReadingDays} أيام لتحصل على +50 نقطة 🎁`}
          </div>
        </section>

        {/* المحطات */}

        <section>
          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "25px",
                color: "#176c46",
              }}
            >
              🗺️ محطات رحلتي
            </h2>

            <p
              style={{
                margin: 0,
                color: "#687b72",
              }}
            >
              اختر المحطة التي ترغب في زيارتها
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {journeyCards.map(
              (card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  style={{
                    textDecoration:
                      "none",
                    color: "#17352a",
                    background:
                      card.background,
                    borderRadius:
                      "23px",
                    padding: "21px",
                    minHeight:
                      "150px",
                    border:
                      "2px solid rgba(255,255,255,0.85)",
                    boxShadow:
                      "0 8px 22px rgba(40, 80, 65, 0.08)",
                    display: "flex",
                    flexDirection:
                      "column",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "39px",
                    }}
                  >
                    {card.icon}
                  </span>

                  <div>
                    <h3
                      style={{
                        margin:
                          "12px 0 7px",
                        fontSize:
                          "21px",
                      }}
                    >
                      {card.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color:
                          "#627168",
                        lineHeight:
                          1.7,
                      }}
                    >
                      {
                        card.description
                      }
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: "35px",
            color: "#6a7b72",
            fontSize: "14px",
            lineHeight: 1.9,
          }}
        >
          <strong>
            أكاديمية لغتي الرقمية
          </strong>
          <br />
          بإشراف الأستاذ / إبراهيم أحمد
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "17px",
        textAlign: "center",
        boxShadow:
          "0 8px 22px rgba(38, 105, 75, 0.08)",
        border:
          "1px solid #e5f1ea",
      }}
    >
      <div
        style={{
          fontSize: "31px",
          marginBottom: "7px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: "0 0 6px",
          color: "#718077",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <strong
        style={{
          color: "#176c46",
          fontSize: "19px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "25px",
  padding: "22px",
  marginBottom: "20px",
  boxShadow:
    "0 10px 28px rgba(38, 105, 75, 0.1)",
};

const weeklySummaryMetricStyle = {
  padding: "15px",
  borderRadius: "17px",
  background: "#ffffff",
  border: "1px solid #dfece5",
  display: "grid",
  gap: "7px",
  textAlign: "center" as const,
  color: "#126b49",
  fontWeight: 900,
  boxShadow:
    "0 5px 14px rgba(20, 90, 60, 0.05)",
};

const headerButtonStyle = {
  background: "white",
  color: "#157347",
  padding: "12px 18px",
  borderRadius: "16px",
  fontWeight: "bold",
  boxShadow:
    "0 5px 12px rgba(0,0,0,0.12)",
  border: "none",
  cursor: "pointer",
};

const rewardCardStyle = {
  background:
    "linear-gradient(135deg, #fff8d8, #fffdf1)",
  border: "2px solid #f6da66",
  borderRadius: "24px",
  padding: "20px",
};

const streakCardStyle = {
  background:
    "linear-gradient(135deg, #ffece8, #fff8f5)",
  border: "2px solid #ffbcae",
  borderRadius: "24px",
  padding: "20px",
};

const studentLevelCardStyle = {
  background: "#ffffff",
  borderRadius: "15px",
  padding: "13px",
  display: "grid",
  gap: "6px",
  textAlign: "center" as const,
  color: "#475569",
};
const crownStatStyle = {
  background:
    "rgba(255,255,255,.82)",
  border:
    "1px solid #ead487",
  borderRadius:
    "17px",
  padding:
    "14px",
  textAlign:
    "center" as const,
  display:
    "grid",
  gap:
    "5px",
  color:
    "#7c620d",
};
