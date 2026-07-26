"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, increment, arrayUnion} from "firebase/firestore";

import { db } from "../../../../firebase";
type Student = {
  studentName?: string;
  className?: string;
  points?: number;
  pointsHistory?: {
  reason: string;
  points: number;
  badge: string;
  category: "قراءة" | "إملاء" | "يدوي";
  createdAt?: Date;
}[];
  level?: number;
  goldenIndex?: number;
  achievementStreak?: number;
  lastAchievementDate?: string;
  attendanceDays?: number;
  absenceDays?: number;
  lateDays?: number;
  attendanceRate?: number;
  latestReading?: {
  textName: string;
  errors: number;
  fluency: string;
  expression: string;
  notes: string;
};

readingHistory?: {
  textName: string;
  errors: number;
  fluency: string;
  expression: string;
  notes: string;
  createdAt?: {
    seconds?: number;
    nanoseconds?: number;
  };
}[];
latestSpelling?: {
  textName: string;
  errors: number;
  level: string;
  notes: string;
  createdAt?: Date;
};

spellingHistory?: {
  textName: string;
  errors: number;
  level: string;
  notes: string;
  createdAt?: Date;
}[];

attendanceHistory?: {
  status: "حاضر" | "غائب" | "متأخر";
  note: string;
  createdAt?: Date;
}[];
};
const BADGE_OPTIONS = [
  {
    category: "القراءة",
    badges: [
      {
        id: "reading-star",
        icon: "📖",
        title: "نجم القراءة",
        description: "للتقدم والتميز في القراءة",
      },
      {
        id: "fluent-reader",
        icon: "🌟",
        title: "القارئ الطليق",
        description: "للقراءة بطلاقة ووضوح",
      },
      {
        id: "reading-king",
        icon: "👑",
        title: "ملك القراءة",
        description: "لإنجاز متميز في مسابقة القراءة",
      },
    ],
  },
  {
    category: "الإملاء والكتابة",
    badges: [
      {
        id: "spelling-star",
        icon: "✍️",
        title: "نجم الإملاء",
        description: "للتقدم والتميز في الإملاء",
      },
      {
        id: "beautiful-handwriting",
        icon: "🖋️",
        title: "الخط الجميل",
        description: "لجمال الخط والالتزام بالسطر",
      },
      {
        id: "spelling-king",
        icon: "👑",
        title: "ملك الإملاء",
        description: "لإنجاز متميز في مسابقة الإملاء",
      },
    ],
  },
  {
    category: "الالتزام والتطور",
    badges: [
      {
        id: "commitment-hero",
        icon: "✅",
        title: "بطل الالتزام",
        description: "للمحافظة على أداء الواجبات",
      },
      {
        id: "most-improved",
        icon: "🚀",
        title: "الأكثر تطورًا",
        description: "للتقدم الملحوظ والمستمر",
      },
      {
        id: "effort-medal",
        icon: "💪",
        title: "وسام الاجتهاد",
        description: "لبذل الجهد وعدم الاستسلام",
      },
    ],
  },
  {
    category: "السلوك والتعاون",
    badges: [
      {
        id: "good-manners",
        icon: "🌷",
        title: "حسن الخلق",
        description: "للأخلاق الحسنة والتعامل الجميل",
      },
      {
        id: "cooperation-star",
        icon: "🤝",
        title: "نجم التعاون",
        description: "لمساعدة الزملاء والعمل بروح الفريق",
      },
      {
        id: "class-role-model",
        icon: "🏆",
        title: "قدوة الفصل",
        description: "للتميز في السلوك والالتزام",
      },
    ],
  },
];
export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPointsBox, setShowPointsBox] = useState(false);
  const [showReadingBox, setShowReadingBox] = useState(false);
  const [showReadingHistory, setShowReadingHistory] = useState(false);
  const [showSpellingBox, setShowSpellingBox] = useState(false);
  const [showSpellingHistory, setShowSpellingHistory] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [showAttendanceBox, setShowAttendanceBox] = useState(false);
  const [showBadgeBox, setShowBadgeBox] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
const [badgeReason, setBadgeReason] = useState("");
const [isSavingBadge, setIsSavingBadge] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
const [attendanceStatus, setAttendanceStatus] = useState<
  "حاضر" | "غائب" | "متأخر"
>("حاضر");
const [attendanceNote, setAttendanceNote] = useState("");
const [spellingText, setSpellingText] = useState("");
const [spellingErrors, setSpellingErrors] = useState(0);
const [spellingLevel, setSpellingLevel] = useState("");
const [spellingNotes, setSpellingNotes] = useState("");
  const [readingText, setReadingText] = useState("");
const [readingErrors, setReadingErrors] = useState(0);
const [readingFluency, setReadingFluency] = useState("");
const [readingExpression, setReadingExpression] = useState("");
const [readingNotes, setReadingNotes] = useState("");
const [pointsReason, setPointsReason] = useState("");
const [pointsToAdd, setPointsToAdd] = useState(1);
const [savingPoints, setSavingPoints] = useState(false);
const [pointsMessage, setPointsMessage] = useState("");
  useEffect(() => {
    async function loadStudent() {
      try {
        const studentRef = doc(db, "students", studentId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          setStudent(studentSnap.data() as Student);
        }
      } catch (error) {
        console.error("حدث خطأ أثناء تحميل بيانات الطالب:", error);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);


    async function handleAddPoints() {
  if (!studentId || !student) return;

  if (!pointsReason.trim()) {
    setPointsMessage("اكتب سبب منح النقاط أولًا.");
    return;
  }

  try {
    setSavingPoints(true);
    setPointsMessage("");

    const studentRef = doc(db, "students", studentId);

    const newHistoryEntry = {
  reason: pointsReason.trim(),
  points: pointsToAdd,
  badge: "",
  category: "يدوي" as const,
  createdAt: new Date(),
};

await updateDoc(studentRef, {
  points: increment(pointsToAdd),
  pointsHistory: arrayUnion(newHistoryEntry),
});

    
setStudent({
  ...student,
  points: (student.points ?? 0) + pointsToAdd,

  pointsHistory: [
  ...(student.pointsHistory ?? []),
  newHistoryEntry,
],
});
    setPointsMessage(`تمت إضافة ${pointsToAdd} نقاط بنجاح ⭐`);

    setTimeout(() => {
      setShowPointsBox(false);
      setPointsReason("");
      setPointsMessage("");
    }, 1200);
  } catch (error) {
    console.error("حدث خطأ أثناء إضافة النقاط:", error);
    setPointsMessage("تعذر حفظ النقاط، حاول مرة أخرى.");
  } finally {
    setSavingPoints(false);
  }
}
if (loading) {
    return <main style={styles.message}>جاري تحميل ملف الطالب...</main>;
  }

  if (!student) {
    return <main style={styles.message}>لم يتم العثور على بيانات الطالب.</main>;
  }

  const points = student.points ?? 0;
  const level = student.level ?? 1;
  const pointsPerLevel = 100;
const currentLevelStart = (level - 1) * pointsPerLevel;
const currentLevelPoints = Math.max(0, points - currentLevelStart);
const levelProgress = Math.min(
  100,
  Math.round((currentLevelPoints / pointsPerLevel) * 100)
);
const pointsToNextLevel = Math.max(
  0,
  pointsPerLevel - currentLevelPoints
);
  const achievementStreak = student.achievementStreak ?? 0;
const goldenIndex = student.goldenIndex ?? 0;
const latestReading = student.latestReading;

const isReadingKing =
  !!latestReading &&
  latestReading.errors === 0 &&
  latestReading.fluency === "ممتاز" &&
  latestReading.expression === "معبّر";

const isReadingHero =
  !!latestReading &&
  !isReadingKing &&
  latestReading.errors <= 2 &&
  ["ممتاز", "جيد جدًا"].includes(latestReading.fluency);

const readingHistory = student.readingHistory ?? [];

const isReadingStar =
  !isReadingKing &&
  !isReadingHero &&
  readingHistory.length >= 2 &&
  readingHistory[readingHistory.length - 1].errors <
    readingHistory[readingHistory.length - 2].errors;
    const latestSpelling = student.latestSpelling;

const isSpellingKing =
  !!latestSpelling &&
  latestSpelling.errors === 0 &&
  latestSpelling.level === "ممتاز";

const isSpellingHero =
  !!latestSpelling &&
  !isSpellingKing &&
  latestSpelling.errors <= 2 &&
  ["ممتاز", "جيد جدًا"].includes(latestSpelling.level);

const spellingHistory = student.spellingHistory ?? [];

const isSpellingStar =
  !isSpellingKing &&
  !isSpellingHero &&
  spellingHistory.length >= 2 &&
  spellingHistory[spellingHistory.length - 1].errors <
    spellingHistory[spellingHistory.length - 2].errors;
    const attendanceHistory = student.attendanceHistory ?? [];

const attendanceCount = attendanceHistory.filter(
  (item) => item.status === "حاضر"
).length;

const absenceCount = attendanceHistory.filter(
  (item) => item.status === "غائب"
).length;

const lateCount = attendanceHistory.filter(
  (item) => item.status === "متأخر"
).length;
const totalAttendanceDays =
  attendanceCount + absenceCount + lateCount;

const attendanceRate =
  totalAttendanceDays > 0
    ? Math.round(
        ((attendanceCount + lateCount) / totalAttendanceDays) * 100
      )
    : 100;
    const getReadingReward = (
  errors: number,
  fluency: string,
  expression: string,
  previousErrors: number | null
) => {
  if (
    errors === 0 &&
    fluency === "ممتاز" &&
    expression === "معبّر"
  ) {
    return {
      badge: "ملك القراءة",
      points: 10,
      message: "👑 حصل الطالب على وسام ملك القراءة و10 نقاط",
    };
  }

  if (
    errors >= 1 &&
    errors <= 2 &&
    ["ممتاز", "جيد جدًا"].includes(fluency)
  ) {
    return {
      badge: "بطل القراءة",
      points: 7,
      message: "🦸 حصل الطالب على وسام بطل القراءة و7 نقاط",
    };
  }
if (
  previousErrors !== null &&
  errors < previousErrors
) {
  return {
    badge: "نجم القراءة",
    points: 5,
    message: "🌟 حصل الطالب على وسام نجم القراءة و5 نقاط لتطوره",
  };
}
  return {
    badge: "",
    points: 0,
    message: "",
  };
};
const getSpellingReward = (
  errors: number,
  level: string,
  previousErrors: number | null
) => {
  if (
    errors === 0 &&
    level === "ممتاز"
  ) {
    return {
      badge: "ملك الإملاء",
      points: 10,
      message: "👑 حصل الطالب على وسام ملك الإملاء و10 نقاط",
    };
  }

  if (
    errors >= 1 &&
    errors <= 2 &&
    ["ممتاز", "جيد جدًا"].includes(level)
  ) {
    return {
      badge: "بطل الإملاء",
      points: 7,
      message: "🦸 حصل الطالب على وسام بطل الإملاء و7 نقاط",
    };
  }
if (
  previousErrors !== null &&
  errors < previousErrors
) {
  return {
    badge: "نجم الإملاء",
    points: 5,
    message: "🌟 حصل الطالب على وسام نجم الإملاء و5 نقاط لتطوره",
  };
}
  return {
    badge: "",
    points: 0,
    message: "",
  };
};
async function handleSaveAttendance() {
  if (!studentId || !student) return;

  try {
    const studentRef = doc(db, "students", studentId);

    const newAttendance = {
      status: attendanceStatus,
      note: attendanceNote.trim(),
      createdAt: new Date(),
    };

    await updateDoc(studentRef, {
      attendanceHistory: arrayUnion(newAttendance),
    });

    setStudent({
      ...student,
      attendanceHistory: [
        ...(student.attendanceHistory ?? []),
        newAttendance,
      ],
    } as Student);

    alert(`✅ تم تسجيل الطالب: ${attendanceStatus}`);

    setAttendanceNote("");
    setShowAttendanceBox(false);
  } catch (error) {
    console.error("حدث خطأ أثناء حفظ الحضور:", error);
    alert("تعذر حفظ الحضور، حاول مرة أخرى.");
  }


}
async function handleSaveReading() {
  if (!studentId || !student) return;

  if (!readingText.trim()) {
    alert("اكتب اسم النص المقروء");
    return;
  }

  if (!readingFluency) {
    alert("اختر مستوى الطلاقة");
    return;
  }

  if (!readingExpression) {
    alert("اختر مستوى التعبير أثناء القراءة");
    return;
  }

  try {
    const readingReward = getReadingReward(
  readingErrors,
  readingFluency,
  readingExpression,student.latestReading?.errors ?? null
);
    const studentRef = doc(db, "students", studentId);

    await updateDoc(studentRef, {
      latestReading: {
        textName: readingText.trim(),
        errors: readingErrors,
        fluency: readingFluency,
        expression: readingExpression,
        notes: readingNotes.trim(),
        createdAt: new Date(),
      },
      readingHistory: arrayUnion({
  textName: readingText.trim(),
  errors: readingErrors,
  fluency: readingFluency,
  expression: readingExpression,
  notes: readingNotes.trim(),
  createdAt: new Date(),
}),
points: increment(readingReward.points),
pointsHistory: readingReward.points > 0
  ? arrayUnion({
      reason: readingReward.message,
      points: readingReward.points,
      badge: readingReward.badge,
      category: "قراءة",
      createdAt: new Date(),
    })
  : arrayUnion(),
    });

    const newReading = {
  textName: readingText.trim(),
  errors: readingErrors,
  fluency: readingFluency,
  expression: readingExpression,
  notes: readingNotes.trim(),
};

setStudent({
  ...student,
  latestReading: newReading,
  points: (student.points ?? 0) + readingReward.points,
  readingHistory: [
    ...(student.readingHistory ?? []),
    newReading,
  ],
  pointsHistory:
  readingReward.points > 0
    ? [
        ...(student.pointsHistory ?? []),
        {
          reason: readingReward.message,
          points: readingReward.points,
          badge: readingReward.badge,
          category: "قراءة",
          createdAt: new Date(),
        },
      ]
    : student.pointsHistory ?? [],
} as Student);

    alert(
  readingReward.message ||
    "✅ تم حفظ تقييم القراءة بنجاح دون نقاط إضافية"
);

    setShowReadingBox(false);
    setReadingText("");
    setReadingErrors(0);
    setReadingFluency("");
    setReadingExpression("");
    setReadingNotes("");
  } catch (error) {
    console.error("خطأ أثناء حفظ تقييم القراءة:", error);
    alert("حدث خطأ أثناء حفظ التقييم");
  }
}
async function handleSaveSpelling() {
  if (!studentId || !student) return;

  if (!spellingText.trim()) {
    alert("اكتب اسم النص أو المهارة الإملائية");
    return;
  }

  if (!spellingLevel) {
    alert("اختر مستوى الإملاء");
    return;
  }

  try {
    const spellingReward = getSpellingReward(
  spellingErrors,
  spellingLevel,
  student.latestSpelling?.errors ?? null
);
    const studentRef = doc(db, "students", studentId);

    const newSpelling = {
      textName: spellingText.trim(),
      errors: spellingErrors,
      level: spellingLevel,
      notes: spellingNotes.trim(),
      createdAt: new Date(),
    };

    await updateDoc(studentRef, {
      latestSpelling: newSpelling,
      spellingHistory: arrayUnion(newSpelling),
      points: increment(spellingReward.points),
      pointsHistory: spellingReward.points > 0
  ? arrayUnion({
      reason: spellingReward.message,
      points: spellingReward.points,
      badge: spellingReward.badge,
      category: "إملاء",
      createdAt: new Date(),
    })
  : arrayUnion(),
    });
    setStudent({
      ...student,
      latestSpelling: newSpelling,
      points: (student.points ?? 0) + spellingReward.points,
      spellingHistory: [
        ...(student.spellingHistory ?? []),
        newSpelling,
      ],
      pointsHistory:
  spellingReward.points > 0
    ? [
        ...(student.pointsHistory ?? []),
        {
          reason: spellingReward.message,
          points: spellingReward.points,
          badge: spellingReward.badge,
          category: "إملاء",
          createdAt: new Date(),
        },
      ]
    : student.pointsHistory ?? [],
    } as Student);
alert(
  spellingReward.message ||
    "✅ تم حفظ تقييم الإملاء بنجاح دون نقاط إضافية"
);
  

    setShowSpellingBox(false);
    setSpellingText("");
    setSpellingErrors(0);
    setSpellingLevel("");
    setSpellingNotes("");
  } catch (error) {
    console.error("خطأ أثناء حفظ تقييم الإملاء:", error);
    alert("حدث خطأ أثناء حفظ تقييم الإملاء");
  }
}
  return (
    <main style={styles.page} dir="rtl">
      <a href="/teacher/students" style={styles.backButton}>
        ← العودة إلى الطلاب
      </a>

      <section style={styles.profileCard}>
        <div style={styles.avatar}>🧒</div>

        <div style={styles.profileInfo}>
          <p style={styles.smallLabel}>ملف الطالب</p>
          <h1 style={styles.studentName}>
            {student.studentName || "طالب الأكاديمية"}
          </h1>
          <p style={styles.className}>
            {student.className || "الفصل غير محدد"}
          </p>
        </div>

        <div style={styles.goldenIndex}>
          <span style={styles.goldenTitle}>🟢 المؤشر الذهبي</span>
          <strong style={styles.goldenNumber}>{goldenIndex} / 100</strong>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>⭐</span>
          <p style={styles.summaryTitle}>النقاط</p>
          <strong style={styles.summaryValue}>{points}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>🚀</span>
          <p style={styles.summaryTitle}>المستوى</p>
          <strong style={styles.summaryValue}>{level}</strong>
        </div>

        <div
  style={{
    ...styles.summaryCard,
    border:
      attendanceRate >= 90
        ? "2px solid #16a34a"
        : attendanceRate >= 75
        ? "2px solid #f59e0b"
        : "2px solid #dc2626",
    background:
      attendanceRate >= 90
        ? "#f0fdf4"
        : attendanceRate >= 75
        ? "#fffbeb"
        : "#fef2f2",
  }}
>
  <span style={styles.summaryIcon}>📅</span>

  <p style={styles.summaryTitle}>الانتظام</p>

  <strong style={styles.summaryValue}>
    {attendanceRate}%
  </strong>

  <span
    style={{
      marginTop: "6px",
      fontSize: "13px",
      fontWeight: "bold",
      color:
        attendanceRate >= 90
          ? "#15803d"
          : attendanceRate >= 75
          ? "#b45309"
          : "#b91c1c",
    }}
  >
    {attendanceRate >= 90
      ? "انتظام ممتاز"
      : attendanceRate >= 75
      ? "انتظام جيد"
      : "يحتاج إلى تحسين"}
  </span>
</div>
<div style={styles.summaryCard}>
  <span style={styles.summaryIcon}>✅</span>
  <p style={styles.summaryTitle}>الحضور</p>
  <strong style={styles.summaryValue}>{attendanceCount}</strong>
</div>

<div style={styles.summaryCard}>
  <span style={styles.summaryIcon}>❌</span>
  <p style={styles.summaryTitle}>الغياب</p>
  <strong style={styles.summaryValue}>{absenceCount}</strong>
</div>

<div style={styles.summaryCard}>
  <span style={styles.summaryIcon}>⏰</span>
  <p style={styles.summaryTitle}>التأخر</p>
  <strong style={styles.summaryValue}>{lateCount}</strong>
</div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryIcon}>🔥</span>
          <p style={styles.summaryTitle}>سلسلة الإنجاز</p>
          <strong style={styles.summaryValue}>
  {achievementStreak} {achievementStreak === 1 ? "يوم" : "أيام"}
</strong>
        </div>
      </section>
<section style={styles.quickActionsSection}>
  <div style={styles.quickActionsHeader}>
    <div>
      <p style={styles.quickActionsLabel}>إدارة ملف الطالب</p>
      <h2 style={styles.quickActionsTitle}>⚡ إجراءات سريعة</h2>
    </div>

    <span style={styles.quickActionsHint}>
      اختر الإجراء الذي تريد تسجيله للطالب
    </span>
  </div>
<section
  style={{
    background: "#ffffff",
    border: "1px solid #d9ebe2",
    borderRadius: "20px",
    padding: "20px",
    marginTop: "18px",
    marginBottom: "22px",
    boxShadow: "0 8px 24px rgba(6, 95, 70, 0.08)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      marginBottom: "12px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "14px",
          color: "#527068",
          marginBottom: "4px",
        }}
      >
        رحلة التقدم 🚀
      </div>

      <strong
        style={{
          fontSize: "20px",
          color: "#0f513f",
        }}
      >
        المستوى {level}
      </strong>
    </div>

    <strong
      style={{
        color: "#b7791f",
        fontSize: "18px",
      }}
    >
      {levelProgress}%
    </strong>
  </div>

  <div
    style={{
      width: "100%",
      height: "18px",
      background: "#e8f2ed",
      borderRadius: "999px",
      overflow: "hidden",
      direction: "ltr",
    }}
  >
    <div
      style={{
        width: `${levelProgress}%`,
        height: "100%",
        background: "linear-gradient(90deg, #34a853, #f4c542)",
        borderRadius: "999px",
        transition: "width 0.4s ease",
      }}
    />
  </div>

  <div
    style={{
      marginTop: "12px",
      textAlign: "center",
      color: "#315c4e",
      fontSize: "14px",
      lineHeight: "1.8",
    }}
  >
    {pointsToNextLevel > 0
      ? `بقيت ${pointsToNextLevel} نقطة للوصول إلى المستوى ${level + 1} ⭐`
      : `أحسنت! أنت جاهز للانتقال إلى المستوى ${level + 1} 🎉`}
  </div>
</section>
  <div style={styles.quickActionsGrid}>
    <button
  style={styles.actionButton}
  onClick={() => setShowPointsBox(true)}
>
  <span style={styles.actionIcon}>⭐</span>
  <strong>منح نقاط</strong>
  <span style={styles.actionDescription}>إضافة نقاط تحفيزية</span>
</button>
<button
  type="button"
  style={styles.actionButton}
  onClick={() => setShowPointsHistory(true)}
>
  <span style={styles.actionIcon}>📜</span>
  <strong>سجل النقاط</strong>
  <span style={styles.actionDescription}>
    عرض جميع النقاط والأوسمة
  </span>
</button>

    <button
  style={styles.actionButton}
  onClick={() => setShowReadingBox(true)}
>
      <span style={styles.actionIcon}>📖</span>
      <strong>تسجيل قراءة</strong>
      <span style={styles.actionDescription}>تقييم قراءة الطالب</span>
    </button>

    <button
  type="button"
  style={styles.actionButton}
  onClick={() => setShowSpellingBox(true)}
>
      <span style={styles.actionIcon}>✍️</span>
      <strong>تسجيل إملاء</strong>
      <span style={styles.actionDescription}>إدخال عدد الأخطاء</span>
    </button>
    <button
  type="button"
  style={styles.actionButton}
  onClick={() => setShowAttendanceBox(true)}
>
  <span style={styles.actionIcon}>📅</span>
  <strong>تسجيل حضور</strong>
  <span style={styles.actionDescription}>
    حضور أو غياب أو تأخر
  </span>
</button>
<button
  type="button"
  style={styles.actionButton}
  onClick={() => setShowAttendanceHistory(true)}
>
  <span style={styles.actionIcon}>📋</span>
  <strong>سجل الحضور</strong>
  <span style={styles.actionDescription}>
    عرض الحضور والغياب والتأخر
  </span>
</button>

    <button
  type="button"
  style={styles.actionButton}
  onClick={() => setShowBadgeBox(true)}
>
  <span style={styles.actionIcon}>🏅</span>
  <strong>منح وسام</strong>
  <span style={styles.actionDescription}>اختيار وسام جديد</span>
</button>
{showBadgeBox && (
  <div style={styles.modalOverlay}>
    <div
      style={{
        ...styles.modalContent,
        background: "#ffffff",
        position: "relative",
        zIndex: 10000,
        width: "min(92%, 600px)",
        textAlign: "center",
      }}
    >
      <button
        type="button"
        onClick={() => {
  setShowBadgeBox(false);
  setSelectedBadgeId("");
  setBadgeReason("");
}}
        style={styles.closeModalButton}
      >
        ✕
      </button>

      <div style={{ fontSize: "52px", marginBottom: "8px" }}>🏅</div>

<h2
  style={{
    margin: "0 0 6px",
    color: "#14532d",
    fontSize: "25px",
  }}
>
  منح وسام جديد
</h2>

<p
  style={{
    margin: "0 0 22px",
    color: "#64748b",
    fontSize: "15px",
  }}
>
  اختر الوسام الذي يستحقه الطالب
</p>

<div
  style={{
    maxHeight: "55vh",
    overflowY: "auto",
    padding: "2px 5px 10px",
    textAlign: "right",
  }}
>
  {BADGE_OPTIONS.map((group) => (
    <div key={group.category} style={{ marginBottom: "22px" }}>
      <h3
        style={{
          margin: "0 0 10px",
          color: "#334155",
          fontSize: "17px",
        }}
      >
        {group.category}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
          gap: "10px",
        }}
      >
        {group.badges.map((badge) => {
          const isSelected = selectedBadgeId === badge.id;

          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => setSelectedBadgeId(badge.id)}
              style={{
                padding: "14px 10px",
                borderRadius: "16px",
                border: isSelected
                  ? "3px solid #16a34a"
                  : "1px solid #dbe4ee",
                background: isSelected ? "#f0fdf4" : "#ffffff",
                cursor: "pointer",
                textAlign: "center",
                boxShadow: isSelected
                  ? "0 6px 16px rgba(22, 163, 74, 0.18)"
                  : "0 3px 10px rgba(15, 23, 42, 0.06)",
                transform: isSelected ? "translateY(-2px)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "34px", marginBottom: "6px" }}>
                {badge.icon}
              </div>

              <strong
                style={{
                  display: "block",
                  color: "#14532d",
                  fontSize: "15px",
                  marginBottom: "5px",
                }}
              >
                {badge.title}
              </strong>

              <span
                style={{
                  display: "block",
                  color: "#64748b",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {badge.description}
              </span>

              {isSelected && (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#15803d",
                    fontWeight: 800,
                    fontSize: "13px",
                  }}
                >
                  ✓ تم الاختيار
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  ))}

  <div style={{ marginTop: "8px" }}>
    <label
      htmlFor="badgeReason"
      style={{
        display: "block",
        marginBottom: "7px",
        color: "#334155",
        fontWeight: 800,
      }}
    >
      سبب منح الوسام
      <span
        style={{
          color: "#94a3b8",
          fontWeight: 500,
          marginRight: "5px",
        }}
      >
        (اختياري)
      </span>
    </label>

    <textarea
      id="badgeReason"
      value={badgeReason}
      onChange={(event) => setBadgeReason(event.target.value)}
      placeholder="مثال: لتقدمه الملحوظ في القراءة هذا الأسبوع"
      rows={3}
      maxLength={160}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        borderRadius: "13px",
        border: "1px solid #cbd5e1",
        resize: "vertical",
        fontFamily: "inherit",
        fontSize: "14px",
        outline: "none",
      }}
    />

    <div
      style={{
        marginTop: "5px",
        color: "#94a3b8",
        fontSize: "12px",
        textAlign: "left",
      }}
    >
      {badgeReason.length} / 160
    </div>
  </div>
</div>

<button
  type="button"
  disabled={!selectedBadgeId || isSavingBadge}
  onClick={() => {
    console.log({
      selectedBadgeId,
      badgeReason,
    });
  }}
  style={{
    width: "100%",
    marginTop: "14px",
    padding: "13px",
    border: "none",
    borderRadius: "14px",
    background:
      !selectedBadgeId || isSavingBadge ? "#cbd5e1" : "#16a34a",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 900,
    cursor:
      !selectedBadgeId || isSavingBadge ? "not-allowed" : "pointer",
  }}
>
  {isSavingBadge ? "جارٍ حفظ الوسام..." : "🏅 منح الوسام"}
</button>
    </div>
  </div>
)}
  </div>
</section>
{showAttendanceBox && (
  <div style={styles.modalOverlay}>
    <div
      style={{
        ...styles.modalContent,
        background: "#ffffff",
        position: "relative",
        zIndex: 10000,
        width: "min(92%, 600px)",
      }}
    >
      <button
        type="button"
        onClick={() => setShowAttendanceBox(false)}
        style={styles.closeModalButton}
      >
        ✕
      </button>

      <div style={styles.modalIcon}>📅</div>

      <h2 style={styles.modalTitle}>تسجيل الحضور</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {(["حاضر", "غائب", "متأخر"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setAttendanceStatus(status)}
            style={{
              padding: "14px",
              borderRadius: "12px",
              border:
                attendanceStatus === status
                  ? "3px solid #0f766e"
                  : "1px solid #cccccc",
              background:
                attendanceStatus === status
                  ? "#d1fae5"
                  : "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <textarea
        value={attendanceNote}
        onChange={(event) => setAttendanceNote(event.target.value)}
        placeholder="ملاحظة اختيارية"
        style={{
          width: "100%",
          minHeight: "110px",
          marginTop: "18px",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #cccccc",
          resize: "vertical",
        }}
      />

      <button
        type="button"
        onClick={handleSaveAttendance}
        style={{
          width: "100%",
          marginTop: "16px",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          background: "#0f766e",
          color: "#ffffff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        حفظ الحضور
      </button>
    </div>
  </div>
)}

{showAttendanceHistory && (
  <div
    style={{
      ...styles.modalOverlay,
      zIndex: 9999,
    }}
  >
    <div
      style={{
        ...styles.modalContent,
        background: "#ffffff",
        position: "relative",
        zIndex: 10000,
        width: "min(92%, 650px)",
        maxHeight: "85vh",
        overflowY: "auto",
      }}
    >
      <button
        type="button"
        onClick={() => setShowAttendanceHistory(false)}
        style={styles.closeModalButton}
      >
        ✕
      </button>

      <div style={styles.modalIcon}>📋</div>

      <h2 style={styles.modalTitle}>سجل حضور الطالب</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>

      {student.attendanceHistory &&
      student.attendanceHistory.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {[...student.attendanceHistory]
            .reverse()
            .map((attendance, index) => (
              <div
                key={`${attendance.status}-${index}`}
                style={{
                  background:
                    attendance.status === "حاضر"
                      ? "#ecfdf5"
                      : attendance.status === "غائب"
                      ? "#fef2f2"
                      : "#fff7ed",
                  border:
                    attendance.status === "حاضر"
                      ? "2px solid #10b981"
                      : attendance.status === "غائب"
                      ? "2px solid #ef4444"
                      : "2px solid #f59e0b",
                  borderRadius: "14px",
                  padding: "14px",
                  lineHeight: "1.8",
                }}
              >
                <strong>
                  {attendance.status === "حاضر"
                    ? "✅ حاضر"
                    : attendance.status === "غائب"
                    ? "❌ غائب"
                    : "⏰ متأخر"}
                </strong>

                {attendance.note && (
                  <p>
                    <strong>الملاحظة:</strong> {attendance.note}
                  </p>
                )}
                {attendance.createdAt && (
  <p>
    <strong>التاريخ والوقت:</strong>{" "}
    {(
  typeof attendance.createdAt === "object" &&
  attendance.createdAt !== null &&
  "toDate" in attendance.createdAt
    ? (attendance.createdAt as { toDate: () => Date }).toDate()
    : new Date(attendance.createdAt)
).toLocaleString("ar-SA")}
  </p>
)}
              </div>
            ))}
        </div>
      ) : (
        <p style={styles.badgeText}>
          لا يوجد سجل حضور محفوظ للطالب حتى الآن.
        </p>
      )}
    </div>
  </div>
  )}
{showPointsBox && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalCard}>
      <button
        style={styles.closeButton}
        onClick={() => setShowPointsBox(false)}
      >
        ✕
      </button>

      <div style={styles.modalIcon}>⭐</div>
      <h2 style={styles.modalTitle}>منح نقاط للطالب</h2>

      <p style={styles.modalStudentName}>
        {student.studentName || "طالب الأكاديمية"}
      </p>

      <label style={styles.fieldLabel}>عدد النقاط</label>

      <div style={styles.pointsChoices}>
        {[1, 5, 10].map((value) => (
          <button
            key={value}
            onClick={() => setPointsToAdd(value)}
            style={{
              ...styles.pointsChoice,
              ...(pointsToAdd === value ? styles.pointsChoiceActive : {}),
            }}
          >
            +{value}
          </button>
        ))}
      </div>

      <label style={styles.fieldLabel}>سبب منح النقاط</label>
      <div style={styles.reasonChoices}>
  {[
    "📖 قراءة متميزة",
    "✍️ إملاء ممتاز",
    "📚 حل الواجب",
    "🌟 مشاركة فعالة",
    "🤝 تعاون",
    "🏅 سلوك حسن",
    "🧠 تميّز في استخراج المهارة",
  ].map((reason) => (
    <button
      key={reason}
      type="button"
      onClick={() => setPointsReason(reason)}
      style={{
        ...styles.reasonChoice,
        ...(pointsReason === reason
          ? styles.reasonChoiceActive
          : {}),
      }}
    >
      {reason}
    </button>
  ))}
</div>
    
      <input
  type="text"
  value={pointsReason}
  onChange={(e) => setPointsReason(e.target.value)}
  placeholder="مثال: قراءة متميزة"
  style={styles.pointsInput}
/>
    
{pointsMessage && (
  <p style={styles.pointsMessage}>{pointsMessage}</p>
)}
      <button
  style={styles.savePointsButton}
  onClick={handleAddPoints}
  disabled={savingPoints}
>
  {savingPoints
    ? "جاري الحفظ..."
    : `حفظ وإضافة ${pointsToAdd} نقاط`}
</button>
    </div>
  </div>
)}

     {showReadingBox && (
  <div style={styles.modalOverlay}>
    <div
  style={{
    ...styles.pointsModal,
    position: "relative",
    zIndex: 1001,
    background: "#ffffff",
    width: "min(92%, 520px)",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "28px",
    boxSizing: "border-box",
  }}
>
      <button
        type="button"
        onClick={() => setShowReadingBox(false)}
        style={styles.closeModalButton}
      >
        ×
      </button>

      <div style={styles.modalIcon}>📖</div>

      <h2 style={styles.modalTitle}>تسجيل قراءة الطالب</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>

      <input
  type="text"
  value={readingText}
  onChange={(e) => setReadingText(e.target.value)}
  placeholder="اسم النص المقروء"
  style={{
  ...styles.pointsInput,
  width: "100%",
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#064e3b",
  border: "2px solid #d1d5db",
  borderRadius: "12px",
  padding: "12px",
  marginBottom: "14px",
}}
/>
<p style={styles.fieldLabel}>عدد أخطاء القراءة</p>
<input
  type="number"
  min="0"
  value={readingErrors}
  onChange={(e) => setReadingErrors(Number(e.target.value))}
  placeholder="عدد أخطاء القراءة"
  style={{
  ...styles.pointsInput,
  width: "100%",
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#064e3b",
  border: "2px solid #d1d5db",
  borderRadius: "12px",
  padding: "12px",
  marginBottom: "14px",
}}
/>
<p style={styles.fieldLabel}>مستوى الطلاقة</p>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginBottom: "18px",
  }}
>
  {[
    "ممتاز",
    "جيد جدًا",
    "جيد",
    "يحتاج دعمًا",
  ].map((level) => (
    <button
      key={level}
      type="button"
      onClick={() => setReadingFluency(level)}
      style={{
  ...styles.reasonChoice,
  padding: "12px",
  borderRadius: "12px",
  border:
    readingFluency === level
      ? "2px solid #047857"
      : "2px solid #d1d5db",
  background:
    readingFluency === level
      ? "#d1fae5"
      : "#ffffff",
  color: "#064e3b",
  fontWeight: "700",
  cursor: "pointer",
}}
    >
      {level}
    </button>
  ))}
</div>
<p style={styles.fieldLabel}>التعبير أثناء القراءة</p>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginBottom: "18px",
  }}
>
  {[
    "معبّر",
    "جيد",
    "متردد",
    "يحتاج تدريبًا",
  ].map((level) => (
    <button
      key={level}
      type="button"
      onClick={() => setReadingExpression(level)}
      style={{
  ...styles.reasonChoice,
  padding: "12px",
  borderRadius: "12px",
  border:
    readingExpression === level
      ? "2px solid #047857"
      : "2px solid #d1d5db",
  background:
    readingExpression === level
      ? "#d1fae5"
      : "#ffffff",
  color: "#064e3b",
  fontWeight: "700",
  cursor: "pointer",
}}
    >
      {level}
    </button>
  ))}
</div>
<p style={styles.fieldLabel}>ملاحظات المعلم</p>

<textarea
  value={readingNotes}
  onChange={(e) => setReadingNotes(e.target.value)}
  placeholder="اكتب ملاحظة مختصرة عن أداء الطالب"
  rows={3}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: "16px",
  }}
/>

<button
  type="button"
  onClick={handleSaveReading}
  style={styles.savePointsButton}
>
  حفظ تقييم القراءة
</button>
    </div>

  </div>

  )}
  {showSpellingHistory && (
  <div style={styles.modalOverlay}>
    <div
      style={{
        ...styles.pointsModal,
        position: "relative",
        zIndex: 1001,
        background: "#ffffff",
        width: "min(92%, 620px)",
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "24px",
        borderRadius: "20px",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={() => setShowSpellingHistory(false)}
        style={styles.closeModalButton}
      >
        ×
      </button>

      <div style={styles.modalIcon}>📚</div>

      <h2 style={styles.modalTitle}>سجل إملاء الطالب</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>

      {student.spellingHistory && student.spellingHistory.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {[...student.spellingHistory]
            .reverse()
            .map((spelling, index) => (
              <div
                key={`${spelling.textName}-${index}`}
                style={{
                  background: "#fffbeb",
                  border: "2px solid #fde68a",
                  borderRadius: "14px",
                  padding: "14px",
                  lineHeight: "1.8",
                }}
              >
                <strong style={{ color: "#92400e" }}>
                  الإملاء رقم {student.spellingHistory!.length - index}
                </strong>

                <p>
                  <strong>النص أو المهارة:</strong> {spelling.textName}
                </p>

                <p>
                  <strong>عدد الأخطاء:</strong> {spelling.errors}
                </p>

                <p>
                  <strong>المستوى:</strong> {spelling.level}
                </p>

                {spelling.notes && (
                  <p>
                    <strong>ملاحظات المعلم:</strong> {spelling.notes}
                  </p>
                )}
              </div>
            ))}
        </div>
      ) : (
        <p style={styles.badgeText}>
          لا يوجد سجل إملاء محفوظ للطالب حتى الآن.
        </p>
      )}
    </div>
  </div>
)}
{showPointsHistory && (
  <div
  style={{
    ...styles.modalOverlay,
    zIndex: 9999,
  }}
>
  <div
    style={{
      ...styles.modalContent,
      background: "#ffffff",
      position: "relative",
      zIndex: 10000,
      maxHeight: "85vh",
      overflowY: "auto",
      width: "min(92%, 650px)",
    }}
  >
      <button
        onClick={() => setShowPointsHistory(false)}
        style={styles.closeModalButton}
      >
        ✕
      </button>

      <div style={styles.modalIcon}>📜</div>

      <h2 style={styles.modalTitle}>سجل نقاط الطالب</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "14px",
    marginBottom: "18px",
  }}
>
  <div
    style={{
      background: "#f3faf6",
      border: "1px solid #b7dec8",
      borderRadius: "12px",
      padding: "10px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "22px" }}>🏅</div>
    <strong>{student.pointsHistory?.length ?? 0}</strong>
    <div style={{ fontSize: "12px", marginTop: "4px" }}>
      إجمالي الإنجازات
    </div>
  </div>

  <div
    style={{
      background: "#fff8e1",
      border: "1px solid #f4c542",
      borderRadius: "12px",
      padding: "10px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "22px" }}>✨</div>
    <strong style={{ fontSize: "13px" }}>
      {[...(student.pointsHistory ?? [])].reverse()[0]?.reason ?? "لا يوجد"}
    </strong>
    <div style={{ fontSize: "12px", marginTop: "4px" }}>
      أحدث إنجاز
    </div>
  </div>

  <div
    style={{
      background: "#eef6ff",
      border: "1px solid #91bce7",
      borderRadius: "12px",
      padding: "10px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "22px" }}>⭐</div>
    <strong>
      +{[...(student.pointsHistory ?? [])].reverse()[0]?.points ?? 0}
    </strong>
    <div style={{ fontSize: "12px", marginTop: "4px" }}>
      آخر نقاط
    </div>
  </div>
</div>
      {student.pointsHistory && student.pointsHistory.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {[...student.pointsHistory]
            .reverse()
            .map((item, index) => (
              <div
                key={`${item.badge}-${index}`}
                style={{

  background:
  item.category === "قراءة" || item.reason.includes("قراءة")
    ? "#eefbf3"
    : item.category === "إملاء" || item.reason.includes("إملاء")
    ? "#eef6ff"
    : item.category === "يدوي"
    ? "#fff8e1"
    : "#f5f7f8",

border:
  item.category === "قراءة" || item.reason.includes("قراءة")
    ? "2px solid #55b981"
    : item.category === "إملاء" || item.reason.includes("إملاء")
    ? "2px solid #6aa9e9"
    : item.category === "يدوي"
    ? "2px solid #f4c542"
    : "2px solid #cfd8dc",

  borderRadius: "14px",
  padding: "14px",
  lineHeight: "1.8",
}}
              >
                <strong>
  {item.reason.includes("قراءة")
    ? "📖"
    : item.reason.includes("إملاء")
    ? "✍️"
    : item.reason.includes("تعاون")
    ? "🤝"
    : item.reason.includes("استخراج")
    ? "🧠"
    : "⭐"}{" "}
  {item.badge ||
  (item.reason.includes("قراءة")
    ? "وسام قارئ متميز"
    : item.reason.includes("إملاء")
    ? "وسام الإملاء"
    : item.reason.includes("تعاون")
    ? "وسام التعاون"
    : item.reason.includes("استخراج")
    ? "وسام اكتشاف المهارة"
    : "وسام التميز")}
</strong>

                <p>
                  <strong>عدد النقاط:</strong> {item.points}
                </p>

                <p>
                  <strong>القسم:</strong> {item.category}
                </p>

                <p>
                  <strong>السبب:</strong> {item.reason}
                </p>
                <p>
  التاريخ:{" "}
  {item.createdAt
    ? new Date(
        typeof item.createdAt === "object" &&
        "seconds" in item.createdAt
          ? Number(item.createdAt.seconds) * 1000
          : item.createdAt
      ).toLocaleString("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "غير محدد"}
</p>
              </div>
            ))}
        </div>
      ) : (
        <p style={styles.badgeText}>
          لا يوجد سجل نقاط محفوظ للطالب حتى الآن.
        </p>
      )}
    </div>
  </div>
)}
)<section style={styles.cardsGrid}>
        <article style={styles.card}>
          <h2 style={styles.cardTitle}>📖 القراءة</h2>

{student.latestReading ? (
  <div
style={{
  background: "#fff8e1",
  border: "2px solid #f4c542",
  borderRadius: "14px",
  padding: "14px",
  lineHeight: "1.8",
}}
  >
    <strong style={{ color: "#065f46" }}>
      آخر تقييم للقراءة
    </strong>

    <p>
      <strong>النص:</strong>{" "}
      {student.latestReading.textName}
    </p>

    <p>
      <strong>عدد الأخطاء:</strong>{" "}
      {student.latestReading.errors}
    </p>

    <p>
      <strong>الطلاقة:</strong>{" "}
      {student.latestReading.fluency}
    </p>

    <p>
      <strong>التعبير:</strong>{" "}
      {student.latestReading.expression}
    </p>

    {student.latestReading.notes && (
      <p>
        <strong>ملاحظات المعلم:</strong>{" "}
        {student.latestReading.notes}
      </p>
    )}
  </div>
) : (
  <p style={styles.badgeText}>
    لم يُسجَّل تقييم قراءة للطالب بعد.
  </p>
)}

     <button
  type="button"
  onClick={() => setShowReadingHistory(true)}
  style={{
    width: "100%",
    padding: "12px",
    marginBottom: "18px",
    border: "2px solid #047857",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#065f46",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  📚 عرض سجل القراءات
</button>     <div style={isReadingKing ? styles.badgeActive : styles.badge}>
  <span>👑</span>

  <div>
    <strong>ملك القراءة</strong>

    <p style={styles.badgeText}>
      {isReadingKing
        ? "مستحق الوسام: قراءة متقنة بلا أخطاء"
        : "يتطلب صفر أخطاء وطلاقة ممتازة وتعبيرًا معبّرًا"}
    </p>
  </div>
</div>

<div style={isReadingHero ? styles.badgeActive : styles.badge}>
  <span>🦸</span>

  <div>
    <strong>بطل القراءة</strong>

    <p style={styles.badgeText}>
      {isReadingHero
        ? "مستحق الوسام: قراءة جيدة بأخطاء قليلة"
        : "يتطلب خطأين أو أقل وطلاقة ممتازة أو جيدة جدًا"}
    </p>
  </div>
</div>
          <div style={isReadingStar ? styles.badgeActive : styles.badge}>
  <span>🌟</span>

  <div>
    <strong>نجم القراءة</strong>

    <p style={styles.badgeText}>
      {isReadingStar
        ? "مستحق الوسام: تحسّن عدد الأخطاء عن القراءة السابقة"
        : "يتطلب وجود قراءتين وانخفاض الأخطاء في القراءة الأخيرة"}
    </p>
  </div>
</div>
        </article>
        {showSpellingBox && (
  <div style={styles.modalOverlay}>
    <div
      style={{
        ...styles.pointsModal,
        position: "relative",
        zIndex: 1001,
        background: "#ffffff",
        width: "min(92%, 520px)",
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "28px",
        borderRadius: "20px",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={() => setShowSpellingBox(false)}
        style={styles.closeModalButton}
      >
        ×
      </button>

      <div style={styles.modalIcon}>✍️</div>

      <h2 style={styles.modalTitle}>تسجيل إملاء الطالب</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>

      <p style={styles.fieldLabel}>اسم النص أو المهارة الإملائية</p>

      <input
        type="text"
        value={spellingText}
        onChange={(e) => setSpellingText(e.target.value)}
        placeholder="مثال: التاء المفتوحة والمربوطة"
        style={{
          ...styles.pointsInput,
          width: "100%",
          boxSizing: "border-box",
          background: "#ffffff",
          color: "#064e3b",
          border: "2px solid #d1d5db",
          borderRadius: "12px",
          padding: "12px",
          marginBottom: "14px",
        }}
      />

      <p style={styles.fieldLabel}>عدد أخطاء الإملاء</p>

      <input
        type="number"
        min="0"
        value={spellingErrors}
        onChange={(e) =>
          setSpellingErrors(Number(e.target.value))
        }
        style={{
          ...styles.pointsInput,
          width: "100%",
          boxSizing: "border-box",
          background: "#ffffff",
          color: "#064e3b",
          border: "2px solid #d1d5db",
          borderRadius: "12px",
          padding: "12px",
          marginBottom: "14px",
        }}
      />

      <p style={styles.fieldLabel}>مستوى الإملاء</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        {[
          "ممتاز",
          "جيد جدًا",
          "جيد",
          "يحتاج دعمًا",
        ].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setSpellingLevel(level)}
            style={{
              ...styles.reasonChoice,
              padding: "12px",
              borderRadius: "12px",
              border:
                spellingLevel === level
                  ? "2px solid #047857"
                  : "2px solid #d1d5db",
              background:
                spellingLevel === level
                  ? "#d1fae5"
                  : "#ffffff",
              color: "#064e3b",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {level}
          </button>
        ))}
      </div>

      <p style={styles.fieldLabel}>ملاحظات المعلم</p>

      <textarea
        value={spellingNotes}
        onChange={(e) => setSpellingNotes(e.target.value)}
        placeholder="اكتب ملاحظة مختصرة عن أداء الطالب"
        rows={3}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
          fontSize: "16px",
          resize: "vertical",
          boxSizing: "border-box",
          marginBottom: "16px",
        }}
      />

      <button
        type="button"
        onClick={handleSaveSpelling}
        style={styles.savePointsButton}
      >
        حفظ تقييم الإملاء
      </button>
    </div>
  </div>
)}
        {showReadingHistory && (
  <div style={styles.modalOverlay}>

<div
  style={{
    ...styles.pointsModal,
    position: "relative",
    zIndex: 1001,
    background: "#ffffff",
    width: "min(92%, 620px)",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "24px",
    borderRadius: "20px",
    boxSizing: "border-box",
  }}
>
  <button
    type="button"
    onClick={() => setShowReadingHistory(false)}
    style={styles.closeModalButton}
  >
    ×
  </button>
      <div style={styles.modalIcon}>📚</div>

      <h2 style={styles.modalTitle}>سجل قراءات الطالب</h2>

      <p style={styles.modalStudentName}>
        {student?.studentName ?? "الطالب"}
      </p>

      {student.readingHistory && student.readingHistory.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {[...student.readingHistory]
            .reverse()
            .map((reading, index) => (
              <div
                key={`${reading.textName}-${index}`}
                style={{
                  background: "#f0fdf4",
                  border: "2px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "14px",
                  lineHeight: "1.8",
                }}
              >
                <strong style={{ color: "#065f46" }}>
                  القراءة رقم {student.readingHistory!.length - index}
                </strong>

                <p>
                  <strong>النص:</strong> {reading.textName}
                </p>

                <p>
                  <strong>عدد الأخطاء:</strong> {reading.errors}
                </p>

                <p>
                  <strong>الطلاقة:</strong> {reading.fluency}
                </p>

                <p>
                  <strong>التعبير:</strong> {reading.expression}
                </p>

                {reading.notes && (
                  <p>
                    <strong>ملاحظات المعلم:</strong> {reading.notes}
                  </p>
                )}
              </div>
            ))}
        </div>
      ) : (
        <p style={styles.badgeText}>
          لا يوجد سجل قراءات محفوظ للطالب حتى الآن.
        </p>
      )}
    </div>
  </div>
)}

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>✍️ الإملاء</h2>
          {student.latestSpelling ? (
  <div
    style={{
      background: "#fffbeb",
      border: "2px solid #fde68a",
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "18px",
      lineHeight: "1.9",
    }}
  >
    <strong style={{ color: "#92400e" }}>
      آخر تقييم للإملاء
    </strong>

    <p>
      <strong>النص أو المهارة:</strong>{" "}
      {student.latestSpelling.textName}
    </p>

    <p>
      <strong>عدد الأخطاء:</strong>{" "}
      {student.latestSpelling.errors}
    </p>

    <p>
      <strong>المستوى:</strong>{" "}
      {student.latestSpelling.level}
    </p>

    {student.latestSpelling.notes && (
      <p>
        <strong>ملاحظات المعلم:</strong>{" "}
        {student.latestSpelling.notes}
      </p>
    )}
  </div>
) : (
  <p style={styles.badgeText}>
    لم يُسجَّل تقييم إملاء للطالب بعد.
  </p>
)}
<button
  type="button"
  onClick={() => setShowSpellingHistory(true)}
  style={{
    width: "100%",
    padding: "12px",
    marginBottom: "18px",
    border: "2px solid #d97706",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#92400e",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  📚 عرض سجل الإملاء
</button>
          <div style={isSpellingKing ? styles.badgeActive : styles.badge}>
  <span>👑</span>

  <div>
    <strong>ملك الإملاء</strong>

    <p style={styles.badgeText}>
      {isSpellingKing
        ? "مستحق الوسام: إملاء متقن بلا أخطاء"
        : "يتطلب صفر أخطاء ومستوى ممتاز"}
    </p>
  </div>
</div>

          <div style={isSpellingHero ? styles.badgeActive : styles.badge}>
  <span>🦸</span>

  <div>
    <strong>بطل الإملاء</strong>

    <p style={styles.badgeText}>
      {isSpellingHero
        ? "مستحق الوسام: إملاء جيد بأخطاء قليلة"
        : "يتطلب خطأين أو أقل ومستوى ممتاز أو جيد جدًا"}
    </p>
  </div>
</div>

          <div style={isSpellingStar ? styles.badgeActive : styles.badge}>
  <span>🌟</span>

  <div>
    <strong>نجم الإملاء</strong>

    <p style={styles.badgeText}>
      {isSpellingStar
        ? "مستحق الوسام: تحسّن عدد الأخطاء عن الإملاء السابق"
        : "يتطلب وجود تقييمين وانخفاض الأخطاء في التقييم الأخير"}
    </p>
  </div>
</div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>📅 الحضور والانضباط</h2>

          <div style={styles.statsRow}>
            <div style={styles.miniStat}>
              <strong>{student.attendanceDays ?? 0}</strong>
              <span>حضور</span>
            </div>

            <div style={styles.miniStat}>
              <strong>{student.absenceDays ?? 0}</strong>
              <span>غياب</span>
            </div>

            <div style={styles.miniStat}>
              <strong>{student.lateDays ?? 0}</strong>
              <span>تأخر</span>
            </div>
          </div>

          <div style={styles.buttonsRow}>
            <button style={styles.greenButton}>تسجيل حضور</button>
            <button style={styles.redButton}>تسجيل غياب</button>
            <button style={styles.yellowButton}>تسجيل تأخر</button>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>📚 الواجبات</h2>

          <div style={styles.progressItem}>
            <span>الواجبات المنجزة</span>
            <strong>8</strong>
          </div>

          <div style={styles.progressItem}>
            <span>الواجبات المتبقية</span>
            <strong>2</strong>
          </div>

          <div style={styles.progressItem}>
            <span>نسبة الإنجاز</span>
            <strong>80%</strong>
          </div>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>🎨 مشاركات المعرض</h2>

          <div style={styles.progressItem}>
            <span>الأعمال المنشورة</span>
            <strong>3</strong>
          </div>

          <div style={styles.progressItem}>
            <span>الإعجابات</span>
            <strong>18</strong>
          </div>

          <div style={styles.exhibitionWork}>
            <span style={styles.workIcon}>🖼️</span>
            <div>
              <strong>آخر عمل منشور</strong>
              <p style={styles.badgeText}>لوحة: لغتي الجميلة</p>
            </div>
          </div>

          <button style={styles.exhibitionButton}>
            عرض أعمال الطالب في المعرض
          </button>
        </article>

        <article style={styles.farisCard}>
          <div style={styles.farisAvatar}>🧒🏻</div>
          <div>
            <h2 style={styles.farisTitle}>رسالة من فارس</h2>
            <p style={styles.farisMessage}>
              رائع يا بطل! تقدّمك جميل، واصل القراءة والتدرب على الإملاء لتصل
              إلى التاج القادم.
            </p>
          </div>
        </article>
      </section>

      <section style={styles.timelineSection}>
        <h2 style={styles.sectionTitle}>📜 رحلة الإنجازات</h2>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>🎨</span>
          <div>
            <strong>نُشر عمل جديد في معرض الطلاب</strong>
            <p style={styles.timelineText}>اليوم</p>
          </div>
        </div>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>✍️</span>
          <div>
            <strong>حصل على لقب بطل الإملاء</strong>
            <p style={styles.timelineText}>منذ يومين</p>
          </div>
        </div>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>⭐</span>
          <div>
            <strong>حصل على 10 نقاط جديدة</strong>
            <p style={styles.timelineText}>منذ 3 أيام</p>
          </div>
        </div>

        <div style={styles.timelineItem}>
          <span style={styles.timelineIcon}>📖</span>
          <div>
            <strong>أتم قراءة نص جديد</strong>
            <p style={styles.timelineText}>منذ أسبوع</p>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f8f6",
    padding: "24px 16px 50px",
    fontFamily: "Arial, sans-serif",
    color: "#163b32",
  },

  message: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    fontWeight: 700,
    background: "#f3f8f6",
  },

  backButton: {
    display: "inline-block",
    marginBottom: "18px",
    color: "#166534",
    fontWeight: 800,
    textDecoration: "none",
  },

  profileCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #ffffff, #e8f7ef)",
    boxShadow: "0 14px 40px rgba(22, 101, 52, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  avatar: {
    width: "86px",
    height: "86px",
    borderRadius: "50%",
    background: "#dff4e7",
    display: "grid",
    placeItems: "center",
    fontSize: "48px",
    border: "4px solid #ffffff",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
  },

  profileInfo: {
    flex: "1 1 260px",
  },

  smallLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  studentName: {
    margin: "0 0 6px",
    fontSize: "30px",
  },

  className: {
    margin: 0,
    color: "#527064",
    fontWeight: 700,
  },

  goldenIndex: {
    minWidth: "175px",
    padding: "16px",
    borderRadius: "18px",
    background: "#fff8dc",
    textAlign: "center",
    border: "1px solid #f4d35e",
  },

  goldenTitle: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 800,
  },

  goldenNumber: {
    fontSize: "26px",
    color: "#9a6700",
  },

  summaryGrid: {
    maxWidth: "1100px",
    margin: "18px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(15, 61, 50, 0.07)",
  },

  summaryIcon: {
    fontSize: "30px",
  },

  summaryTitle: {
    margin: "7px 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  summaryValue: {
    fontSize: "25px",
  },

  cardsGrid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 8px 26px rgba(15, 61, 50, 0.07)",
  },

  cardTitle: {
    margin: "0 0 16px",
    fontSize: "20px",
  },

  badgeActive: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "13px",
    marginBottom: "10px",
    borderRadius: "15px",
    background: "#fff8d8",
    border: "1px solid #f7d35c",
    fontSize: "23px",
  },

  badge: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "13px",
    marginBottom: "10px",
    borderRadius: "15px",
    background: "#f6faf8",
    border: "1px solid #dcebe4",
    fontSize: "23px",
  },

  badgeText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },

  miniStat: {
    padding: "14px 8px",
    borderRadius: "14px",
    background: "#f4f8f6",
    textAlign: "center",
    display: "grid",
    gap: "5px",
  },

  buttonsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "14px",
  },

  greenButton: {
    flex: 1,
    border: 0,
    borderRadius: "12px",
    padding: "11px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 800,
  },

  redButton: {
    flex: 1,
    border: 0,
    borderRadius: "12px",
    padding: "11px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  },

  yellowButton: {
    flex: 1,
    border: 0,
    borderRadius: "12px",
    padding: "11px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 800,
  },

  progressItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #edf2ef",
  },

  exhibitionWork: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    marginTop: "14px",
    borderRadius: "15px",
    background: "#f7f3ff",
  },

  workIcon: {
    fontSize: "34px",
  },

  exhibitionButton: {
    width: "100%",
    marginTop: "14px",
    border: 0,
    borderRadius: "13px",
    padding: "13px",
    background: "#7c3aed",
    color: "#ffffff",
    fontWeight: 800,
  },

  farisCard: {
    background: "linear-gradient(135deg, #e3f8ea, #ffffff)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 8px 26px rgba(15, 61, 50, 0.07)",
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },

  farisAvatar: {
    fontSize: "56px",
  },

  farisTitle: {
    margin: "0 0 7px",
    fontSize: "20px",
  },

  farisMessage: {
    margin: 0,
    color: "#527064",
    lineHeight: 1.8,
  },

  timelineSection: {
    maxWidth: "1100px",
    margin: "18px auto 0",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 8px 26px rgba(15, 61, 50, 0.07)",
  },

  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "21px",
  },

  timelineItem: {
    display: "flex",
    gap: "13px",
    alignItems: "center",
    padding: "13px 0",
    borderBottom: "1px solid #edf2ef",
  },

  timelineIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#eef8f2",
    display: "grid",
    placeItems: "center",
    fontSize: "21px",
  },

  timelineText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  quickActionsSection: {
  maxWidth: "1100px",
  margin: "18px auto",
  padding: "22px",
borderRadius: "24px",
background: "linear-gradient(135deg, #173f35, #24735e)",
boxShadow: "0 14px 35px rgba(15, 61, 50, 0.16)",
color: "#ffffff",
},
quickActionsHeader: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
},

quickActionsLabel: {
  margin: "0 0 5px",
  color: "#c9f3df",
  fontSize: "13px",
  fontWeight: 700,
},

quickActionsTitle: {
  margin: 0,
  fontSize: "23px",
},

quickActionsHint: {
  color: "#d9eee6",
  fontSize: "13px",
},
quickActionsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
  gap: "12px",
},

actionButton: {
  minHeight: "135px",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "18px",
  padding: "16px 12px",
  background: "rgba(255,255,255,0.1)",
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  fontSize: "16px",
  cursor: "pointer",
},

actionIcon: {
  fontSize: "34px",
},

actionDescription: {
  color: "#d9eee6",
  fontSize: "12px",
  fontWeight: 400,
},
modalOverlay: {
  position: "fixed",
  inset: 0,
  background: "rgba(6, 31, 25, 0.58)",
  display: "grid",
  placeItems: "center",
  padding: "18px",
  zIndex: 1000,
},

modalCard: {
  width: "100%",
  maxWidth: "420px",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  position: "relative",
  textAlign: "center",
  boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
},

closeButton: {
  position: "absolute",
  top: "14px",
  left: "14px",
  width: "36px",
  height: "36px",
  border: 0,
  borderRadius: "50%",
  background: "#eef5f2",
  color: "#163b32",
  fontWeight: 800,
},

modalIcon: {
  fontSize: "52px",
},

modalTitle: {
  margin: "8px 0 5px",
  color: "#163b32",
  fontSize: "23px",
},

modalStudentName: {
  margin: "0 0 20px",
  color: "#64748b",
  fontWeight: 700,
},

fieldLabel: {
  display: "block",
  margin: "14px 0 8px",
  textAlign: "right",
  color: "#244a40",
  fontWeight: 800,
},

pointsChoices: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
},

pointsChoice: {
  border: "1px solid #d9e8e1",
  borderRadius: "14px",
  padding: "13px",
  background: "#f6faf8",
  color: "#166534",
  fontSize: "18px",
  fontWeight: 900,
},

pointsChoiceActive: {
  background: "#166534",
  color: "#ffffff",
  borderColor: "#166534",
},

reasonInput: {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "13px",
  padding: "13px 14px",
  fontSize: "15px",
  textAlign: "right",
},

savePointsButton: {
  width: "100%",
  marginTop: "18px",
  border: 0,
  borderRadius: "14px",
  padding: "14px",
  background: "#f4b400",
  color: "#453200",
  fontSize: "16px",
  fontWeight: 900,
},
pointsMessage: {
  margin: "14px 0 0",
  color: "#166534",
  fontWeight: 800,
  fontSize: "14px",
},
reasonChoices: {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px",
},

reasonChoiceActive: {
  background: "#166534",
  color: "#ffffff",
  borderColor: "#166534",
},
};