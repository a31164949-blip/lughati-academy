"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
where,
getDoc,
runTransaction,
} from "firebase/firestore";
import { db } from "../../../firebase";

type ClassroomFilter = "الكل" | "الثاني أ" | "الثاني ب";
type StatusFilter = "الكل" | "لم يؤكد" | "بانتظار المراجعة" | "تمت المراجعة";
type DailyCompletionFilter = "الكل" | "المنجزون" | "لم ينجزوا";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
};

type Homework = {
  id: string;
  title: string;
  instructions: string;
  targetClass: string;
  dueDate: string;
  published: boolean;
  createdAtMilliseconds: number;
};

type Completion = {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  completionMethod: string;
  completed: boolean;
  completedAtText: string;
  teacherReviewed: boolean;
  needsRevision?: boolean;
teacherNote?: string;
  solutionUrl?: string;
  solutionStatus?: "pending" | "approved" | "rejected";
  readingAudioUrl: string;
readingDurationSeconds: number;
readingReviewed: boolean;
readingStatus: "pending" | "approved" | "rejected";
  
};
type DailyCompletion = {
  id: string;
  studentId: string;
  day: string;
  date: string;
  weekTitle: string;
  completed: boolean;
  completedAtText: string;
};
type StudentHomeworkRow = {
  studentId: string;
  studentName: string;
  classroom: string;
  completionId: string;
  completed: boolean;
  completionMethod: string;
  completedAtText: string;
  teacherReviewed: boolean;
  needsRevision?: boolean;
teacherNote?: string;
  solutionUrl?: string;
  solutionStatus?: "pending" | "approved" | "rejected";
  readingAudioUrl: string;
readingDurationSeconds: number;
readingReviewed: boolean;
readingStatus: "pending" | "approved" | "rejected";
  status: "لم يؤكد" | "بانتظار المراجعة" | "تمت المراجعة";
};

export default function HomeworkTrackingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
const [dailyCompletions, setDailyCompletions] =
  useState<DailyCompletion[]>([]);
  const [dailyCompletionFilter, setDailyCompletionFilter] =
  useState<DailyCompletionFilter>("الكل");
  const [selectedHomeworkId, setSelectedHomeworkId] = useState("");
  const [classroomFilter, setClassroomFilter] =
    useState<ClassroomFilter>("الكل");
    const [dailyClassroomFilter, setDailyClassroomFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("الكل");
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [
  studentsSnapshot,
  homeworksSnapshot,
  completionsSnapshot,
  dailyCompletionsSnapshot,
] = await Promise.all([
  getDocs(collection(db, "students")),
  getDocs(collection(db, "homeworks")),
  getDocs(collection(db, "homeworkCompletions")),
  getDocs(collection(db, "dailyCompletions")),
]);

      const loadedStudents: Student[] = studentsSnapshot.docs
        .map((studentDocument) => {
          const data = studentDocument.data();

          return {
            id: studentDocument.id,
            studentId: data.studentId || studentDocument.id,
            studentName: data.studentName || "طالب",
            classroom: data.classroom || "",
            active: data.active !== false,
          };
        })
        .filter((student) => student.active)
        .sort((first, second) =>
          first.studentId.localeCompare(second.studentId)
        );

      const loadedHomeworks: Homework[] = homeworksSnapshot.docs
        .map((homeworkDocument) => {
          const data = homeworkDocument.data();

          return {
            id: homeworkDocument.id,
            title: data.title || "واجب دون عنوان",
            instructions: data.instructions || "",
            targetClass: data.targetClass || "الفصلان",
            dueDate: data.dueDate || "",
            published: data.published === true,
            createdAtMilliseconds:
              data.createdAt?.toMillis?.() ||
              data.updatedAt?.toMillis?.() ||
              0,
          };
        })
        .sort(
          (first, second) =>
            second.createdAtMilliseconds -
            first.createdAtMilliseconds
        );

      const loadedCompletions: Completion[] =
        completionsSnapshot.docs.map((completionDocument) => {
          const data = completionDocument.data();

          return {
            id: completionDocument.id,
            homeworkId: data.homeworkId || "",
            studentId: data.studentId || "",
            studentName: data.studentName || "طالب",
            classroom: data.classroom || "",
            completionMethod: data.completionMethod || "",
            completed:
  data.completed === true || data.status === "completed",
            completedAtText:
  data.completedAtText ||
  (data.completedAt &&
  typeof data.completedAt.toDate === "function"
    ? data.completedAt.toDate().toLocaleString("ar-SA")
    : ""),
            teacherReviewed: data.teacherReviewed === true,
            needsRevision: data.needsRevision === true,
teacherNote:
  typeof data.teacherNote === "string"
    ? data.teacherNote
    : "",
            solutionUrl:
  typeof data.solutionUrl === "string"
    ? data.solutionUrl
    : "",
    solutionStatus:
  data.solutionStatus === "approved" ||
  data.solutionStatus === "rejected"
    ? data.solutionStatus
    : "pending",
    readingAudioUrl:
  typeof data.readingAudioUrl === "string"
    ? data.readingAudioUrl
    : "",

readingDurationSeconds:
  typeof data.readingDurationSeconds === "number"
    ? data.readingDurationSeconds
    : 0,

readingReviewed:
  data.readingReviewed === true,
  readingStatus:
  data.readingStatus === "approved" ||
  data.readingStatus === "rejected"
    ? data.readingStatus
    : data.readingReviewed === true
      ? "approved"
      : "pending",
          };
        });
const loadedDailyCompletions: DailyCompletion[] =
  dailyCompletionsSnapshot.docs.map((completionDocument) => {
    const data = completionDocument.data();

    const completedAtText =
      data.completedAt &&
      typeof data.completedAt.toDate === "function"
        ? data.completedAt.toDate().toLocaleString("ar-SA")
        : "";

    return {
      id: completionDocument.id,
      studentId:
        typeof data.studentId === "string" ? data.studentId : "",
      day: typeof data.day === "string" ? data.day : "",
      date: typeof data.date === "string" ? data.date : "",
      weekTitle:
        typeof data.weekTitle === "string" ? data.weekTitle : "",
      completed: data.completed === true,
      completedAtText,
    };
  });
      setStudents(loadedStudents);
      setHomeworks(loadedHomeworks);
      setCompletions(loadedCompletions);
      setDailyCompletions(loadedDailyCompletions);

      setSelectedHomeworkId((currentId) => {
        const currentStillExists = loadedHomeworks.some(
          (homework) => homework.id === currentId
        );

        if (currentStillExists) return currentId;

        return loadedHomeworks[0]?.id || "";
      });
    } catch (loadError) {
      console.error(loadError);
      setError("تعذر تحميل بيانات الطلاب والواجبات من Firebase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedHomework = useMemo(
    () =>
      homeworks.find(
        (homework) => homework.id === selectedHomeworkId
      ) || null,
    [homeworks, selectedHomeworkId]
  );

  const eligibleStudents = useMemo(() => {
    if (selectedHomeworkId.startsWith("madrasati_")) {
  return students;
}
    if (!selectedHomework) return [];

    return students.filter((student) => {
      if (selectedHomework.targetClass === "الفصلان") {
        return (
          student.classroom === "الثاني أ" ||
          student.classroom === "الثاني ب"
        );
      }

      return student.classroom === selectedHomework.targetClass;
    });
  }, [students, selectedHomework, selectedHomeworkId]);

  const studentRows = useMemo<StudentHomeworkRow[]>(() => {
    return eligibleStudents.map((student) => {
      const completion = completions.find(
        (item) =>
          item.homeworkId === selectedHomeworkId &&
          item.studentId === student.studentId
      );

      if (!completion) {
        return {
          studentId: student.studentId,
          studentName: student.studentName,
          classroom: student.classroom,
          completionId: "",
          completed: false,
          completionMethod: "",
          completedAtText: "",
          teacherReviewed: false,
          needsRevision: false,
          teacherNote: "",
          solutionUrl: "",
          readingAudioUrl: "",
          readingDurationSeconds: 0,
          readingReviewed: false,
          readingStatus: "pending",
          status: "لم يؤكد",
        };
      }

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        classroom: student.classroom,
        completionId: completion.id,
        completed: completion.completed,
        completionMethod: completion.completionMethod,
        completedAtText: completion.completedAtText,
        teacherReviewed: completion.teacherReviewed,
        needsRevision: completion?.needsRevision === true,
teacherNote: completion?.teacherNote ?? "",
        solutionUrl: completion.solutionUrl ?? "",
        solutionStatus: completion.solutionStatus ?? "pending",
        readingAudioUrl: completion.readingAudioUrl,
readingDurationSeconds: completion.readingDurationSeconds,
readingReviewed: completion.readingReviewed,
readingStatus: completion.readingStatus,
        status: completion.teacherReviewed
          ? "تمت المراجعة"
          : "بانتظار المراجعة",
      };
    });
  }, [eligibleStudents, completions, selectedHomeworkId]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return studentRows.filter((row) => {
      const matchesClassroom =
        classroomFilter === "الكل" ||
        row.classroom === classroomFilter;

      const matchesStatus =
        statusFilter === "الكل" || row.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        row.studentName.toLowerCase().includes(normalizedSearch) ||
        row.studentId.toLowerCase().includes(normalizedSearch);

      return matchesClassroom && matchesStatus && matchesSearch;
    });
  }, [studentRows, classroomFilter, statusFilter, searchText]);

  const totalCount = studentRows.length;
  const completedCount = studentRows.filter(
    (row) => row.completed
  ).length;
  const pendingReviewCount = studentRows.filter(
    (row) => row.status === "بانتظار المراجعة"
  ).length;
  const reviewedCount = studentRows.filter(
    (row) => row.status === "تمت المراجعة"
  ).length;
  const notConfirmedCount = studentRows.filter(
    (row) => row.status === "لم يؤكد"
  ).length;

  const completionPercentage =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  const classAStudents = studentRows.filter(
    (row) => row.classroom === "الثاني أ"
  );
  const classBStudents = studentRows.filter(
    (row) => row.classroom === "الثاني ب"
  );

  const classACompleted = classAStudents.filter(
    (row) => row.completed
  ).length;
  const classBCompleted = classBStudents.filter(
    (row) => row.completed
  ).length;

  const classAPercentage =
    classAStudents.length > 0
      ? Math.round(
          (classACompleted / classAStudents.length) * 100
        )
      : 0;

  const classBPercentage =
    classBStudents.length > 0
      ? Math.round(
          (classBCompleted / classBStudents.length) * 100
        )
      : 0;

  async function toggleReviewed(row: StudentHomeworkRow) {
    if (!row.completionId) return;

    try {
      setUpdatingId(row.completionId);
      setError("");
      setMessage("جاري تحديث حالة المراجعة...");

      const newReviewedStatus = !row.teacherReviewed;

      await updateDoc(
  doc(db, "homeworkCompletions", row.completionId),
  {
    teacherReviewed: newReviewedStatus,
    teacherReviewedAt: newReviewedStatus
      ? serverTimestamp()
      : null,
...(row.solutionUrl?.trim()
  ? {
      solutionStatus: newReviewedStatus
        ? ("approved" as const)
        : ("pending" as const),
      solutionReviewedAt: newReviewedStatus
        ? serverTimestamp()
        : null,
      solutionRejectedAt: null,
      needsRevision: false,
      teacherNote: "",
      returnedAt: null,
    }
  : {}),
    readingReviewed: row.readingReviewed,
readingStatus: row.readingStatus,

    updatedAt: serverTimestamp(),
  }
);
if (
  newReviewedStatus &&
  row.completionMethod.includes("مدرستي")
) {
  const completionReference = doc(
    db,
    "homeworkCompletions",
    row.completionId
  );

  const studentReference = doc(
    db,
    "students",
    row.studentId
  );

  await runTransaction(db, async (transaction) => {
    const completionSnapshot =
      await transaction.get(completionReference);

    const studentSnapshot =
      await transaction.get(studentReference);

    if (
      completionSnapshot.exists() &&
      completionSnapshot.data().madrasatiPointsGranted === true
    ) {
      return;
    }

    const currentPoints =
      studentSnapshot.exists() &&
      typeof studentSnapshot.data().points === "number"
        ? studentSnapshot.data().points
        : 0;

    transaction.set(
      studentReference,
      {
        points: currentPoints + 2,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      completionReference,
      {
        madrasatiPointsGranted: true,
        madrasatiPoints: 2,
        madrasatiPointsGrantedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
if (
  newReviewedStatus &&
  row.completionMethod.includes("إبداعي")
) {
  const completionReference = doc(
    db,
    "homeworkCompletions",
    row.completionId
  );

  const studentReference = doc(
    db,
    "students",
    row.studentId
  );

  await runTransaction(db, async (transaction) => {
    const completionSnapshot =
      await transaction.get(completionReference);

    const studentSnapshot =
      await transaction.get(studentReference);

    if (
      completionSnapshot.exists() &&
      completionSnapshot.data().creativePointsGranted === true
    ) {
      return;
    }

    const currentPoints =
      studentSnapshot.exists() &&
      typeof studentSnapshot.data().points === "number"
        ? studentSnapshot.data().points
        : 0;

    transaction.set(
      studentReference,
      {
        points: currentPoints + 4,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      completionReference,
      {
        creativePointsGranted: true,
        creativePoints: 4,
        creativePointsGrantedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
  if (row.solutionUrl?.trim()) {
  const galleryResponse = await fetch("/api/submissions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      studentName: row.studentName,
      studentId: row.studentId,
      type: "واجب إبداعي",
      fileUrl: row.solutionUrl,
      classroom: row.classroom,
      note: "نُشر تلقائيًا بعد اعتماد المعلم",
    }),
  });

  const galleryResult = await galleryResponse.json();

  if (!galleryResponse.ok || !galleryResult.success) {
    console.error(
      "تعذر نشر الواجب الإبداعي في المعرض:",
      galleryResult
    );
  }
}
}
      setCompletions((currentCompletions) =>
        currentCompletions.map((completion) =>
          completion.id === row.completionId
            ? {
                ...completion,
                teacherReviewed: newReviewedStatus,
                readingReviewed:
  row.readingAudioUrl && newReviewedStatus
    ? true
    : false,
              }
            : completion
        )
      );

      setMessage(
        newReviewedStatus
          ? `تمت مراجعة إنجاز ${row.studentName} ✅`
          : `تم إلغاء مراجعة إنجاز ${row.studentName}.`
      );
    } catch (updateError) {
      console.error(updateError);
      setError("تعذر تحديث حالة المراجعة.");
    } finally {
      setUpdatingId("");
    }
  }
async function saveDailyReadingRecord(row: StudentHomeworkRow) {
  if (!row.readingAudioUrl) {
    return;
  }

  const today = new Date();

  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const recordId = `${row.studentId}_${dateKey}`;

  await setDoc(
    doc(db, "dailyReadingRecords", recordId),
    {
      studentId: row.studentId,
      studentName: row.studentName,
      classroom: row.classroom,
      dateKey,
      readingAudioUrl: row.readingAudioUrl,
      readingDurationSeconds: row.readingDurationSeconds,
      approved: true,
      homeworkCompletionId: row.completionId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
async function returnHomeworkToStudent(
  row: StudentHomeworkRow,
  note: string
) {
  if (!row.completionId) return;

  try {
    setUpdatingId(row.completionId);
    setError("");
    setMessage("...جاري إعادة الواجب للطالب");

    await updateDoc(
      doc(db, "homeworkCompletions", row.completionId),
      {
        teacherReviewed: false,
        teacherReviewedAt: null,
        teacherNote: note.trim(),
        needsRevision: true,
        ...(row.solutionUrl?.trim()
  ? {
      solutionStatus: "rejected" as const,
      solutionReviewedAt: null,
      solutionRejectedAt: serverTimestamp(),
    }
  : {}),
        returnedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    setMessage(`🔄 تمت إعادة الواجب إلى ${row.studentName}`);
  } catch (error) {
    console.error(error);
    setError("تعذر إعادة الواجب للطالب، حاول مرة أخرى.");
  } finally {
    setUpdatingId("");
  }
}
async function approveReading(row: StudentHomeworkRow) {
  if (!row.completionId || !row.readingAudioUrl) {
    return;
  }

  try {
    setUpdatingId(row.completionId);
    setError("");
    setMessage("جارٍ اعتماد تسجيل القراءة...");

    await updateDoc(
      doc(db, "homeworkCompletions", row.completionId),
      {
        readingReviewed: true,
        readingStatus: "approved",
        readingReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    await saveDailyReadingRecord(row);

    const readingProgress =
      await getReadingProgress(row.studentId);

    if (
      readingProgress.readingDays > 0 &&
      readingProgress.readingDays % 5 === 0
    ) {
      await grantReadingCycleReward(
        row,
        readingProgress.completedCycles
      );
    }

    setCompletions((currentCompletions) =>
      currentCompletions.map((completion) =>
        completion.id === row.completionId
          ? {
              ...completion,
              readingReviewed: true,
              readingStatus: "approved",
            }
          : completion
      )
    );

    setMessage(
      `✅ تم اعتماد قراءة ${row.studentName}`
    );
  } catch (error) {
    console.error(error);
    setError("تعذر اعتماد القراءة، حاول مرة أخرى.");
  } finally {
    setUpdatingId("");
  }
}
async function rejectReading(row: StudentHomeworkRow) {
  if (!row.completionId) {
    return;
  }

  try {
    setUpdatingId(row.completionId);
    setError("");
    setMessage("جارٍ رفض تسجيل القراءة...");

    await updateDoc(
      doc(db, "homeworkCompletions", row.completionId),
      {
        readingReviewed: false,
        readingStatus: "rejected",
        readingReviewedAt: null,
        readingRejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    const readingQuery = query(
      collection(db, "dailyReadingRecords"),
      where(
        "homeworkCompletionId",
        "==",
        row.completionId
      )
    );

    const readingSnapshot =
      await getDocs(readingQuery);

    for (const readingDocument of readingSnapshot.docs) {
      await updateDoc(
        doc(
          db,
          "dailyReadingRecords",
          readingDocument.id
        ),
        {
          approved: false,
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
    }

    setCompletions((currentCompletions) =>
      currentCompletions.map((completion) =>
        completion.id === row.completionId
          ? {
              ...completion,
              readingReviewed: false,
              readingStatus: "rejected",
            }
          : completion
      )
    );

    setMessage(
      `❌ تم رفض قراءة ${row.studentName} ويحتاج إلى إعادة التسجيل`
    );
  } catch (error) {
    console.error(error);
    setError("تعذر رفض القراءة، حاول مرة أخرى.");
  } finally {
    setUpdatingId("");
  }
}
async function approveSolution(row: StudentHomeworkRow) {
  if (!row.completionId) {
    return;
  }

  try {
    setUpdatingId(row.completionId);
    setError("");
    setMessage("...جار اعتماد صورة الحل");

    await updateDoc(
      doc(db, "homeworkCompletions", row.completionId),
      {
        solutionStatus: "approved",
        solutionReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
    if (
  row.completionMethod.includes("الكتاب") ||
  row.completionMethod.includes("الدفتر")
) {
  const completionReference = doc(
    db,
    "homeworkCompletions",
    row.completionId
  );

  const studentReference = doc(
    db,
    "students",
    row.studentId
  );

  await runTransaction(db, async (transaction) => {
    const completionSnapshot =
      await transaction.get(completionReference);

    const studentSnapshot =
      await transaction.get(studentReference);

    // منع تكرار النقاط
    if (
      completionSnapshot.exists() &&
      completionSnapshot.data().solutionPointsGranted === true
    ) {
      return;
    }

    const currentPoints =
      studentSnapshot.exists() &&
      typeof studentSnapshot.data().points === "number"
        ? studentSnapshot.data().points
        : 0;

    // إضافة 3 نقاط للطالب
    transaction.set(
      studentReference,
      {
        points: currentPoints + 3,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // تسجيل أن مكافأة هذا الحل مُنحت
    transaction.set(
      completionReference,
      {
        solutionPointsGranted: true,
        solutionPoints: 3,
        solutionPointsGrantedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

    setCompletions((currentCompletions) =>
      currentCompletions.map((completion) =>
        completion.id === row.completionId
          ? {
              ...completion,
              solutionStatus: "approved",
            }
          : completion
      )
    );

    setMessage(`✅ تم اعتماد حل ${row.studentName}`);
  } catch (error) {
    console.error(error);
    setError("تعذر اعتماد صورة الحل، حاول مرة أخرى.");
  } finally {
    setUpdatingId("");
  }
}

async function rejectSolution(row: StudentHomeworkRow) {
  if (!row.completionId) {
    return;
  }

  try {
    setUpdatingId(row.completionId);
    setError("");
    setMessage("...جار طلب إعادة صورة الحل");

    await updateDoc(
      doc(db, "homeworkCompletions", row.completionId),
      {
        solutionStatus: "rejected",
        solutionReviewedAt: null,
        solutionRejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    setCompletions((currentCompletions) =>
      currentCompletions.map((completion) =>
        completion.id === row.completionId
          ? {
              ...completion,
              solutionStatus: "rejected",
            }
          : completion
      )
    );

    setMessage(`❌ تم طلب إعادة صورة الحل من ${row.studentName}`);
  } catch (error) {
    console.error(error);
    setError("تعذر رفض صورة الحل، حاول مرة أخرى.");
  } finally {
    setUpdatingId("");
  }
}
async function getStudentReadingDays(studentId: string) {
  const readingQuery = query(
    collection(db, "dailyReadingRecords"),
    where("studentId", "==", studentId),
    where("approved", "==", true)
  );

  const readingSnapshot = await getDocs(readingQuery);

  return readingSnapshot.size;
}
  function formatDueDate(dateValue: string) {
    if (!dateValue) return "غير محدد";

    const date = new Date(`${dateValue}T12:00:00`);

    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  async function getReadingProgress(studentId: string) {
  const readingDays = await getStudentReadingDays(studentId);

  const completedCycles = Math.floor(readingDays / 5);
  const progressInCurrentCycle = readingDays % 5;

  return {
    readingDays,
    completedCycles,
    progressInCurrentCycle,
  };
}
async function saveReadingCycleReward(
  row: StudentHomeworkRow,
  cycleNumber: number
) {
  if (cycleNumber <= 0) {
    return;
  }

  const rewardId = `${row.studentId}_reading-cycle-${cycleNumber}`;

  await setDoc(
    doc(db, "readingCycleRewards", rewardId),
    {
      studentId: row.studentId,
      studentName: row.studentName,
      classroom: row.classroom,
      cycleNumber,
      readingDaysRequired: cycleNumber * 5,
      rewardType: "reading-five-days",
      points: 50,
      granted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
async function grantReadingCycleReward(
  row: StudentHomeworkRow,
  cycleNumber: number
) {
  if (cycleNumber <= 0) {
    return;
  }

  const rewardId =
    `${row.studentId}_reading-cycle-${cycleNumber}`;

  const rewardReference = doc(
    db,
    "readingCycleRewards",
    rewardId
  );

  const studentReference = doc(
    db,
    "students",
    row.studentId
  );

  await runTransaction(db, async (transaction) => {
    const rewardSnapshot =
      await transaction.get(rewardReference);

    const studentSnapshot =
      await transaction.get(studentReference);

    // إذا مُنحت مكافأة هذه الدورة سابقًا، لا نفعل شيئًا.
    if (
      rewardSnapshot.exists() &&
      rewardSnapshot.data().granted === true
    ) {
      return;
    }

    const currentPoints =
      studentSnapshot.exists() &&
      typeof studentSnapshot.data().points === "number"
        ? studentSnapshot.data().points
        : 0;

    // إضافة 50 نقطة إلى رصيد الطالب الحقيقي.
    transaction.set(
      studentReference,
      {
        studentId: row.studentId,
        studentName: row.studentName,
        classroom: row.classroom,
        points: currentPoints + 50,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // إغلاق مكافأة هذه الدورة نهائيًا.
    transaction.set(
      rewardReference,
      {
        studentId: row.studentId,
        studentName: row.studentName,
        classroom: row.classroom,
        cycleNumber,
        readingDaysRequired: cycleNumber * 5,
        rewardType: "reading-five-days",
        points: 50,
        granted: true,
        grantedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
const today = new Date();

const todayDateKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

const todayCompletionRows = students.map((student) => {
  const completion = dailyCompletions.find(
    (item) =>
      item.studentId === student.studentId &&
      item.date === todayDateKey
  );

  return {
    studentId: student.studentId,
    studentName: student.studentName,
    classroom: student.classroom,
    completed: completion?.completed === true,
    day: completion?.day ?? "",
    completedAtText: completion?.completedAtText ?? "",
  };
});

const completedTodayCount = todayCompletionRows.filter(
  (item) => item.completed
).length;
const filteredTodayCompletionRows = todayCompletionRows.filter((student) => {
  const matchesStatus =
    dailyCompletionFilter === "المنجزون"
      ? student.completed
      : dailyCompletionFilter === "لم ينجزوا"
        ? !student.completed
        : true;
 const matchesClassroom =
    dailyClassroomFilter === "الكل"
      ? true
      : student.classroom === dailyClassroomFilter;

  return matchesStatus && matchesClassroom;
});
const dailyClassroomOptions = [
  "الكل",
  ...Array.from(
    new Set(
      todayCompletionRows
        .map((student) => student.classroom)
        .filter((classroom) => classroom.trim() !== "")
    )
  ),
];
  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div style={styles.headerIcon}>📋</div>

        <div>
          <p style={styles.smallTitle}>لوحة المعلم</p>

          <h1 style={styles.title}>متابعة إنجاز الواجبات</h1>

          <p style={styles.subtitle}>
            متابعة جميع الطلاب، بمن فيهم من لم يؤكد إنجاز الواجب.
          </p>
        </div>
      </section>
      <section
  style={{
    marginBottom: "24px",
    border: "1px solid #bbf7d0",
    borderRadius: "24px",
    background: "#ffffff",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08)",
  }}
>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      marginBottom: "20px",
    }}
  >
    <div>
      <h2
        style={{
          margin: 0,
          color: "#047857",
          fontSize: "26px",
          fontWeight: 900,
        }}
      >
        ✅ متابعة مهام اليوم
      </h2>

      <p
        style={{
          margin: "8px 0 0",
          color: "#64748b",
          fontWeight: 700,
        }}
      >
        متابعة الطلاب الذين أكدوا إنجاز مهامهم اليومية
      </p>
    </div>

    <div
      style={{
        borderRadius: "18px",
        background: "#ecfdf5",
        padding: "14px 20px",
        color: "#047857",
        fontWeight: 900,
      }}
    >
      أنجز اليوم: {completedTodayCount} من {todayCompletionRows.length}
    </div>
  </div>
  <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  }}
>
  {(["الكل", "المنجزون", "لم ينجزوا"] as DailyCompletionFilter[]).map(
    (filterOption) => {
      const isActive = dailyCompletionFilter === filterOption;

      return (
        <button
          key={filterOption}
          type="button"
          onClick={() => setDailyCompletionFilter(filterOption)}
          style={{
            cursor: "pointer",
            border: isActive
              ? "2px solid #059669"
              : "1px solid #cbd5e1",
            borderRadius: "999px",
            background: isActive ? "#059669" : "#ffffff",
            padding: "10px 18px",
            color: isActive ? "#ffffff" : "#475569",
            fontWeight: 900,
          }}
        >
          {filterOption === "الكل"
            ? `الكل (${todayCompletionRows.length})`
            : filterOption === "المنجزون"
              ? `✅ المنجزون (${completedTodayCount})`
              : `⏳ لم ينجزوا (${
                  todayCompletionRows.length - completedTodayCount
                })`}
        </button>
      );
    }
  )}
  <div
  style={{
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <label
    htmlFor="daily-classroom-filter"
    style={{
      color: "#334155",
      fontWeight: 900,
    }}
  >
    الفصل:
  </label>

  <select
    id="daily-classroom-filter"
    value={dailyClassroomFilter}
    onChange={(event) => setDailyClassroomFilter(event.target.value)}
    style={{
      minWidth: "180px",
      border: "1px solid #cbd5e1",
      borderRadius: "14px",
      background: "#ffffff",
      padding: "10px 14px",
      color: "#0f172a",
      fontWeight: 800,
    }}
  >
    {dailyClassroomOptions.map((classroom) => (
      <option key={classroom} value={classroom}>
        {classroom === "الكل" ? "جميع الفصول" : classroom}
      </option>
    ))}
  </select>
</div>
</div>

  {filteredTodayCompletionRows.length === 0 ? (
    <div
      style={{
        margin: 0,
        borderRadius: "16px",
        background: "#f8fafc",
        padding: "18px",
        textAlign: "center",
        color: "#64748b",
        fontWeight: 800,
      }}
    >
      <div
  style={{
    margin: 0,
    borderRadius: "16px",
    background: "#f8fafc",
    padding: "18px",
    textAlign: "center",
    color: "#64748b",
    fontWeight: 800,
  }}
>
  لا يوجد طلاب ضمن هذا التصنيف حاليًا.
</div>
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {filteredTodayCompletionRows.map((student) => (
        <article
          key={student.studentId}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(150px, 1fr) minmax(90px, auto) minmax(130px, auto)",
            alignItems: "center",
            gap: "12px",
            border: student.completed
              ? "1px solid #86efac"
              : "1px solid #e2e8f0",
            borderRadius: "18px",
            background: student.completed ? "#f0fdf4" : "#f8fafc",
            padding: "16px",
          }}
        >
          <div>
            <strong
              style={{
                display: "block",
                color: "#0f172a",
                fontSize: "17px",
              }}
            >
              {student.studentName}
            </strong>

            <span
              style={{
                color: "#64748b",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {student.classroom || "لم يُحدد الفصل"}
            </span>
          </div>

          <span
            style={{
              borderRadius: "999px",
              background: student.completed ? "#16a34a" : "#e2e8f0",
              padding: "8px 14px",
              textAlign: "center",
              color: student.completed ? "#ffffff" : "#475569",
              fontWeight: 900,
            }}
          >
            {student.completed ? "تم الإنجاز ✅" : "لم يُنجز بعد"}
          </span>

          <span
            style={{
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {student.completedAtText || "—"}
          </span>
        </article>
      ))}
    </div>
  )}
</section>

      <section style={styles.controlsCard}>
        <div style={styles.controlsGrid}>
          <label style={styles.label}>
            اختر الواجب
            <select
              value={selectedHomeworkId}
              onChange={(event) => {
                setSelectedHomeworkId(event.target.value);
                setClassroomFilter("الكل");
                setStatusFilter("الكل");
                setSearchText("");
                setMessage("");
              }}
              style={styles.input}
            >
              <option value={`madrasati_${new Date().toLocaleDateString("en-CA")}`}>
  🏫 جسر مدرستي
</option>
              {homeworks.length === 0 && (
                <option value="">لا توجد واجبات</option>
              )}

              {homeworks.map((homework) => (
                <option key={homework.id} value={homework.id}>
                  {homework.title}
                  {homework.published ? " — منشور" : " — غير منشور"}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            الفصل
            <select
              value={classroomFilter}
              onChange={(event) =>
                setClassroomFilter(
                  event.target.value as ClassroomFilter
                )
              }
              style={styles.input}
            >
              <option value="الكل">جميع الفصول</option>
              <option value="الثاني أ">الثاني أ</option>
              <option value="الثاني ب">الثاني ب</option>
            </select>
          </label>

          <label style={styles.label}>
            حالة الطالب
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              style={styles.input}
            >
              <option value="الكل">جميع الحالات</option>
              <option value="لم يؤكد">لم يؤكد الإنجاز</option>
              <option value="بانتظار المراجعة">
                بانتظار المراجعة
              </option>
              <option value="تمت المراجعة">
                تمت المراجعة
              </option>
            </select>
          </label>

          <label style={styles.label}>
            البحث عن طالب
            <input
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="اكتب اسم الطالب"
              style={styles.input}
            />
          </label>
        </div>

        <button
  type="button"
  onClick={loadData}
  disabled={loading}
  style={styles.refreshButton}
>
  {loading ? "جارٍ تحديث البيانات…" : "تحديث البيانات"}
</button>
      </section>

      {selectedHomework && (
        <section style={styles.homeworkSummary}>
          <div>
            <p style={styles.sectionLabel}>الواجب المحدد</p>

            <h2 style={styles.homeworkTitle}>
              {selectedHomework.title}
            </h2>

            <p style={styles.homeworkInstructions}>
              {selectedHomework.instructions}
            </p>
          </div>

          <div style={styles.homeworkMeta}>
            <span>
              الفصل:{" "}
              {selectedHomework.targetClass === "الفصلان"
                ? "الثاني أ والثاني ب"
                : selectedHomework.targetClass}
            </span>

            <span>
              تاريخ الاستحقاق:{" "}
              {formatDueDate(selectedHomework.dueDate)}
            </span>

            <span>
              {selectedHomework.published
                ? "منشور للطلاب ✅"
                : "غير منشور"}
            </span>
          </div>
        </section>
      )}

      <section style={styles.statistics}>
        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{totalCount}</strong>
          <span style={styles.statLabel}>الطلاب المستهدفون</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{completedCount}</strong>
          <span style={styles.statLabel}>أكدوا الإنجاز</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {notConfirmedCount}
          </strong>
          <span style={styles.statLabel}>لم يؤكدوا</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {pendingReviewCount}
          </strong>
          <span style={styles.statLabel}>بانتظار المراجعة</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{reviewedCount}</strong>
          <span style={styles.statLabel}>تمت مراجعتهم</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {completionPercentage}%
          </strong>
          <span style={styles.statLabel}>نسبة الإنجاز</span>
        </article>
      </section>

      <section style={styles.classProgressCard}>
        <div style={styles.progressItem}>
          <div style={styles.progressHeading}>
            <strong>الثاني أ</strong>
            <span>
              {classACompleted} من {classAStudents.length} —{" "}
              {classAPercentage}%
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${classAPercentage}%`,
              }}
            />
          </div>
        </div>

        <div style={styles.progressItem}>
          <div style={styles.progressHeading}>
            <strong>الثاني ب</strong>
            <span>
              {classBCompleted} من {classBStudents.length} —{" "}
              {classBPercentage}%
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${classBPercentage}%`,
              }}
            />
          </div>
        </div>
      </section>

      {message && <div style={styles.successMessage}>{message}</div>}
      {error && <div style={styles.errorMessage}>{error}</div>}

      <section style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <p style={styles.sectionLabel}>سجل الطلاب</p>
            <h2 style={styles.listTitle}>
              حالات إنجاز الواجب
            </h2>
          </div>

          <span style={styles.resultsCount}>
            النتائج الظاهرة: {filteredRows.length}
          </span>
        </div>

        {loading && (
          <div style={styles.emptyState}>
            جاري تحميل بيانات الطلاب...
          </div>
        )}

        {!loading && !selectedHomework && (
          <div style={styles.emptyState}>
            أنشئ واجبًا أولًا من صفحة إدارة الواجبات.
          </div>
        )}

        {!loading &&
          selectedHomework &&
          filteredRows.length === 0 && (
            <div style={styles.emptyState}>
              لا توجد نتائج مطابقة للفلاتر الحالية.
            </div>
          )}

        <div style={styles.studentsGrid}>
          {filteredRows.map((row) => (
            <article key={row.studentId} style={styles.studentRowCard}>
              <div style={styles.studentTop}>
                <div>
                  <p style={styles.classroom}>
                    {row.classroom}
                  </p>

                  <h3 style={styles.studentName}>
                    {row.studentName}
                  </h3>

                  <span style={styles.studentId}>
                    {row.studentId}
                  </span>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    background:
                      row.status === "تمت المراجعة"
                        ? "#dcfce7"
                        : row.status === "بانتظار المراجعة"
                        ? "#fff3cd"
                        : "#feecec",
                    color:
                      row.status === "تمت المراجعة"
                        ? "#166534"
                        : row.status === "بانتظار المراجعة"
                        ? "#806000"
                        : "#993232",
                  }}
                >
                  {row.status === "تمت المراجعة"
                    ? "تمت المراجعة ✅"
                    : row.status === "بانتظار المراجعة"
                    ? "بانتظار المراجعة ⏳"
                    : "لم يؤكد الإنجاز"}
                </span>
              </div>

              {row.completed ? (
                <div style={styles.completionDetails}>
                
                    <div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "999px",
    background:
      row.completionMethod.includes("الدفتر")
        ? "#e8f1ff"
        : row.completionMethod.includes("الكتاب")
        ? "#f3e8ff"
        : row.completionMethod.includes("إلكتروني")
        ? "#e8fff1"
        : row.completionMethod.includes("مدرستي")
? "#ecfdf5"
        : row.completionMethod.includes("صورة")
        ? "#fff7e6"
        : row.completionMethod.includes("ملف")
        ? "#f3f4f6"
        : row.completionMethod.includes("صوتي")
        ? "#ede9fe"
        : "#f8fafc",
    color: "#065f46",
    fontWeight: 800,
    marginBottom: "10px",
  }}
>
  <span>طريقة الإنجاز:</span>
  <span>{row.completionMethod || "غير محددة"}</span>
</div>

                  <p>
                    <strong>وقت التأكيد:</strong>{" "}
                    {row.completedAtText || "غير محدد"}
                  </p>

                  <p>
                    <strong>حالة الطالب:</strong> تم تأكيد الإنجاز
                    ✅
                  </p>
                </div>
              ) : (
                <div style={styles.notCompletedBox}>
                  لم يضغط الطالب زر «أتممت حل الواجب» حتى الآن.
                </div>
              )}

              {row.completed && (
       <div
  style={{
    display: "grid",
    gap: "10px",
    marginTop: "10px",
  }}
>
       <button
  type="button"
  
  onClick={() => {
  const solutionUrl = row.solutionUrl?.trim();
  const readingAudioUrl = row.readingAudioUrl?.trim();

  if (readingAudioUrl) {
    window.open(readingAudioUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (solutionUrl) {
    window.open(solutionUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (row.completionMethod.includes("الدفتر")) {
    alert("حل الطالب في الدفتر، اطلب منه إرفاق صورة عند الحاجة.");
    return;
  }

  if (row.completionMethod.includes("الكتاب")) {
    alert("حل الطالب في الكتاب، ويمكن طلب صورة عند الحاجة.");
    return;
  }

  alert("لا يوجد حل مرفق يمكن عرضه حاليًا.");
}}
  style={{
    ...styles.reviewButton,
    background: "#eef6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    marginBottom: "10px",
  }}
>
  {row.readingAudioUrl?.trim()
  ? "🎙️ تشغيل التسجيل"
  : row.solutionUrl?.trim()
  ? row.completionMethod.includes("صورة")
    ? "📸 عرض الصورة"
    : row.completionMethod.includes("رابط")
    ? "🔗 فتح الرابط"
    : row.completionMethod.includes("ملف")
    ? "📄 فتح الملف"
    : "👁️ عرض الحل"
  : row.completionMethod.includes("الدفتر")
  ? "📘 حل في الدفتر"
  : row.completionMethod.includes("الكتاب")
  ? "📗 حل في الكتاب"
  : "👁️ عرض الحل"}
</button>
{row.solutionUrl &&
  (row.completionMethod.includes("الدفتر") ||
    row.completionMethod.includes("الكتاب") ||
    row.completionMethod.includes("صورة")) && (
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        marginBottom: "10px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          marginBottom: "10px",
          fontWeight: 700,
          color:
            row.solutionStatus === "approved"
              ? "#15803d"
              : row.solutionStatus === "rejected"
              ? "#b91c1c"
              : "#a16207",
        }}
      >
        {row.solutionStatus === "approved"
          ? "✅ تم اعتماد صورة الحل"
          : row.solutionStatus === "rejected"
          ? "❌ يحتاج الطالب إلى إعادة رفع الصورة"
          : "⏳ صورة الحل بانتظار المراجعة"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <button
          type="button"
          disabled={updatingId === row.completionId}
          onClick={() => approveSolution(row)}
          style={{
            ...styles.reviewButton,
            background: "#bbf7d0",
            color: "#166534",
            border: "1px solid #86efac",
          }}
        >
          ✅ اعتماد الحل
        </button>

        <button
          type="button"
          disabled={updatingId === row.completionId}
          onClick={() => rejectSolution(row)}
          style={{
            ...styles.reviewButton,
            background: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
          }}
        >
          ❌ طلب إعادة الصورة
        </button>
      </div>
    </div>
  )}
{row.readingAudioUrl && (
  <button
    type="button"
    onClick={() => {
      window.open(
        row.readingAudioUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }}
    style={{
      ...styles.reviewButton,
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
      marginBottom: "10px",
    }}
  >
    🎧 استماع للقراءة
    {row.readingDurationSeconds > 0
      ? ` — ${row.readingDurationSeconds} ثانية`
      : ""}
  </button>
)}
          <button
                  type="button"
                  disabled={updatingId === row.completionId}
                  onClick={() => toggleReviewed(row)}
                  style={{
                    ...styles.reviewButton,
                    background: row.teacherReviewed
                      ? "#ffffff"
                      : "#16845f",
                    color: row.teacherReviewed
                      ? "#356858"
                      : "#ffffff",
                    border: row.teacherReviewed
                      ? "1px solid #c5ded2"
                      : "none",
                    opacity:
                      updatingId === row.completionId ? 0.6 : 1,
                  }}
                >
                  {updatingId === row.completionId
                    ? "جاري التحديث..."
                    : row.teacherReviewed
                    ? "إلغاء المراجعة"
                    : "تمت المراجعة"}
                
</button>
<button
  type="button"
  disabled={updatingId === row.completionId}
  onClick={() => {
    const note = window.prompt(
      "اكتب ملاحظة للطالب قبل إعادة الواجب:"
    );

    if (!note?.trim()) {
      return;
    }
returnHomeworkToStudent(row, note.trim()
    );
  }}
  style={{
    ...styles.reviewButton,
    marginTop: "10px",
    background: "#fff1f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    opacity:
      updatingId === row.completionId ? 0.6 : 1,
  }}
>
  🔄 إعادة للطالب
</button>
{row.needsRevision && (
  <div
    style={{
      marginTop: "10px",
      padding: "12px",
      borderRadius: "12px",
      background: "#fff1f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      fontWeight: 800,
      textAlign: "center",
      lineHeight: 1.7,
    }}
  >
    <div>🔄 تمت إعادة الواجب للطالب للتعديل</div>

    {row.teacherNote && (
      <div
        style={{
          marginTop: "6px",
          fontWeight: 600,
        }}
      >
        ✏️ ملاحظتك: {row.teacherNote}
      </div>
    )}
  </div>
)}
{row.readingAudioUrl && (
  <div
    style={{
      marginTop: "12px",
      padding: "12px",
      borderRadius: "14px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
    }}
  >
    <div
      style={{
        textAlign: "center",
        marginBottom: "10px",
        fontWeight: 800,
        color:
          row.readingStatus === "approved"
            ? "#15803d"
            : row.readingStatus === "rejected"
              ? "#b91c1c"
              : "#92400e",
      }}
    >
      {row.readingStatus === "approved"
        ? "✅ القراءة معتمدة"
        : row.readingStatus === "rejected"
          ? "❌ القراءة مرفوضة — يحتاج الطالب إلى إعادة التسجيل"
          : "⏳ تسجيل القراءة بانتظار قرار المعلم"}
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
      }}
    >
      <button
        type="button"
        disabled={
          updatingId === row.completionId ||
          row.readingStatus === "approved"
        }
        onClick={() => approveReading(row)}
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background:
            row.readingStatus === "approved"
              ? "#bbf7d0"
              : "#16a34a",
          color:
            row.readingStatus === "approved"
              ? "#166534"
              : "#ffffff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        ✅ اعتماد القراءة
      </button>

      <button
        type="button"
        disabled={
          updatingId === row.completionId ||
          row.readingStatus === "rejected"
        }
        onClick={() => rejectReading(row)}
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background:
            row.readingStatus === "rejected"
              ? "#fecaca"
              : "#dc2626",
          color:
            row.readingStatus === "rejected"
              ? "#991b1b"
              : "#ffffff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        ❌ رفض القراءة
      </button>
    </div>
  </div>
)}
</div>
)}
</article>
))}
</div>
</section>
      <section style={styles.noteCard}>
        <span style={styles.noteIcon}>🛡️</span>

        <div>
          <h3 style={styles.noteTitle}>تنبيه مهم</h3>

          <p style={styles.noteText}>
            تأكيد الطالب يعني أنه صرّح بإنجاز الواجب، ولا يعني صحة
            الإجابات إلا بعد مراجعة المعلم.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px 18px 50px",
    background:
      "linear-gradient(180deg, #f3faf6 0%, #edf7f2 55%, #ffffff 100%)",
    color: "#143f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "27px",
    boxShadow: "0 12px 35px rgba(25, 104, 76, 0.08)",
  },

  headerIcon: {
    width: "78px",
    height: "78px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "23px",
    background: "#16845f",
    fontSize: "39px",
  },

  smallTitle: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(27px, 4vw, 40px)",
  },

  subtitle: {
    margin: 0,
    color: "#607a70",
    lineHeight: 1.8,
  },

  controlsCard: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "24px",
  },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "15px",
  },

  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 900,
    color: "#234f40",
  },

  input: {
    width: "100%",
    padding: "14px",
    border: "2px solid #d5e8df",
    borderRadius: "15px",
    background: "#fbfefc",
    color: "#143f32",
    fontSize: "16px",
    outline: "none",
  },

  refreshButton: {
    width: "100%",
    marginTop: "17px",
    padding: "14px",
    border: "none",
    borderRadius: "15px",
    background: "#16845f",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "17px",
    cursor: "pointer",
  },

  homeworkSummary: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "24px",
  },

  sectionLabel: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  homeworkTitle: {
    margin: "0 0 8px",
    fontSize: "clamp(24px, 4vw, 33px)",
  },

  homeworkInstructions: {
    margin: 0,
    color: "#5b756b",
    lineHeight: 1.8,
  },

  homeworkMeta: {
    display: "grid",
    alignContent: "center",
    gap: "8px",
    color: "#45685b",
    fontWeight: 700,
  },

  statistics: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "13px",
  },

  statCard: {
    padding: "21px 12px",
    display: "grid",
    placeItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "21px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "34px",
    color: "#16845f",
  },

  statLabel: {
    color: "#587368",
    fontWeight: 800,
  },

  classProgressCard: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "24px",
    display: "grid",
    gap: "21px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "24px",
  },

  progressItem: {
    display: "grid",
    gap: "9px",
  },

  progressHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    color: "#285b49",
  },

  progressTrack: {
    width: "100%",
    height: "14px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#e2eee8",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "#16845f",
    transition: "width 0.3s ease",
  },

  successMessage: {
    maxWidth: "1160px",
    margin: "0 auto 18px",
    padding: "16px",
    borderRadius: "16px",
    background: "#e8f8ef",
    color: "#17603f",
    fontWeight: 800,
  },

  errorMessage: {
    maxWidth: "1160px",
    margin: "0 auto 18px",
    padding: "16px",
    borderRadius: "16px",
    background: "#feecec",
    color: "#983434",
    fontWeight: 800,
  },

  listCard: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    padding: "25px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "27px",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.08)",
  },

  listHeader: {
    marginBottom: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
  },

  listTitle: {
    margin: 0,
    fontSize: "clamp(25px, 4vw, 34px)",
  },

  resultsCount: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eef8f3",
    color: "#376a57",
    fontWeight: 800,
  },

  emptyState: {
    padding: "27px",
    borderRadius: "18px",
    background: "#f1f8f5",
    textAlign: "center",
    color: "#597469",
    fontWeight: 800,
  },

  studentsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },

  studentRowCard: {
    padding: "20px",
    borderRadius: "21px",
    border: "1px solid #d6e9e0",
    background: "#fbfefc",
  },

  studentTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  classroom: {
    margin: "0 0 5px",
    color: "#16845f",
    fontWeight: 800,
  },

  studentName: {
    margin: "0 0 5px",
    fontSize: "23px",
  },

  studentId: {
    color: "#7a8e86",
    fontSize: "14px",
  },

  statusBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: 800,
  },

  completionDetails: {
    marginTop: "17px",
    padding: "15px",
    borderRadius: "16px",
    background: "#f0f8f4",
    color: "#4a695e",
    lineHeight: 1.8,
  },

  notCompletedBox: {
    marginTop: "17px",
    padding: "17px",
    borderRadius: "16px",
    background: "#fff1f1",
    color: "#8c3c3c",
    lineHeight: 1.8,
    fontWeight: 700,
  },

  reviewButton: {
    width: "100%",
    marginTop: "16px",
    padding: "13px",
    borderRadius: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  noteCard: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef7f3",
    border: "1px solid #cfe5da",
  },

  noteIcon: {
    fontSize: "38px",
  },

  noteTitle: {
    margin: "0 0 6px",
  },

  noteText: {
    margin: 0,
    color: "#5c776c",
    lineHeight: 1.8,
  },
};