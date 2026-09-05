"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type CrownMode =
  | "reading"
  | "spelling";

type StudentOption = {
  id: string;
  name: string;
  classroom: string;

  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type AssessmentRecord = {
  studentId: string;
  studentName: string;
  classroom: string;

  mode: CrownMode;

  lessonName: string;
  lessonKey: string;

  pageNumber: number;

  bestErrors: number;
  lastErrors: number;

  attemptCount: number;

  title: string;

  personalPhotoUrl: string;
  selectedAvatarIcon: string;

  updatedAt?: unknown;
  createdAt?: unknown;
};

const MAX_ERRORS = 20;

/*
 * مفاتيح تخزين محلي لتقليل قراءات Firestore.
 * لا تُنشئ أي بيانات جديدة في Firestore.
 */
const STUDENTS_SESSION_KEY = "lughati-crown-students-v1";
const LAST_STUDENT_KEY = "lughati-crown-last-student-v1";
const LESSON_LOAD_DELAY_MS = 650;

function getModeLabel(
  mode: CrownMode
) {
  return mode === "reading"
    ? "القراءة"
    : "الإملاء";
}

function getTitle(
  mode: CrownMode,
  errors: number
) {
  const suffix =
    mode === "reading"
      ? "القراءة"
      : "الإملاء";

  if (errors === 0) {
    return `👑 أمير ${suffix}`;
  }

  if (errors <= 2) {
    return `🏆 بطل ${suffix}`;
  }

  if (errors <= 4) {
    return `⭐ نجم ${suffix}`;
  }

  return mode === "reading"
    ? "🌱 قارئ مجتهد"
    : "🌱 مجتهد الإملاء";
}

function normalizeLessonKey(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/\\/g, "-");
}

function getAssessmentId({
  studentId,
  mode,
  lessonKey,
  pageNumber,
}: {
  studentId: string;
  mode: CrownMode;
  lessonKey: string;
  pageNumber: number;
}) {
  return `${studentId}__${mode}__${lessonKey}__page-${pageNumber}`;
}


function getCrownLevelKey(
  mode: CrownMode,
  errors: number
) {
  const prefix =
    mode === "reading"
      ? "reading"
      : "spelling";

  if (errors === 0) {
    return `${prefix}-prince`;
  }

  if (errors <= 2) {
    return `${prefix}-hero`;
  }

  if (errors <= 4) {
    return `${prefix}-star`;
  }

  return "";
}

function getCrownLevelPoints(
  errors: number
) {
  if (errors === 0) return 3;
  if (errors <= 2) return 2;
  if (errors <= 4) return 1;
  return 0;
}

function getRiyadhDate() {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone: "Asia/Riyadh",
    }
  );
}

export default function LughatiCrownTeacherPage() {
  const [
    mode,
    setMode,
  ] =
    useState<CrownMode>(
      "reading"
    );

  const [
    students,
    setStudents,
  ] =
    useState<StudentOption[]>(
      []
    );

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(true);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    lessonName,
    setLessonName,
  ] = useState("");

  const [
    pageNumber,
    setPageNumber,
  ] = useState(1);

  const [
    errors,
    setErrors,
  ] = useState(0);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    currentBestErrors,
    setCurrentBestErrors,
  ] =
    useState<number | null>(
      null
    );

  const [
    currentAttemptCount,
    setCurrentAttemptCount,
  ] = useState(0);

  const [
    pageOneBest,
    setPageOneBest,
  ] =
    useState<number | null>(
      null
    );

  const [
    pageTwoBest,
    setPageTwoBest,
  ] =
    useState<number | null>(
      null
    );

  const [
    pageThreeBest,
    setPageThreeBest,
  ] =
    useState<number | null>(
      null
    );

  const [
    pageAttempts,
    setPageAttempts,
  ] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
  });

  const selectedStudent =
    useMemo(() => {
      return (
        students.find(
          (student) =>
            student.id ===
            selectedStudentId
        ) ?? null
      );
    }, [
      students,
      selectedStudentId,
    ]);

  /*
   * اللقب المتوقع للمحاولة الحالية.
   */
  const previewTitle =
    getTitle(
      mode,
      errors
    );

  /*
   * هل أصبح ملكًا؟
   */
  const isKing =
    pageOneBest === 0 &&
    pageTwoBest === 0;

  /*
   * هل أتقن الدرس كاملًا؟
   * هذا الوسام يظهر عند وجود صفحة ثالثة
   * وإتقانها كذلك بلا أخطاء.
   */
  const hasFullMastery =
    isKing &&
    pageThreeBest === 0;

  /*
   * تحميل الطلاب.
   * أولًا نحاول استخدام نسخة الجلسة لتجنب إعادة قراءة
   * مجموعة students عند الرجوع إلى الصفحة.
   */
  useEffect(() => {
    async function loadStudents() {
      try {
        setStudentsLoading(true);

        if (typeof window !== "undefined") {
          const cached = window.sessionStorage.getItem(
            STUDENTS_SESSION_KEY
          );

          if (cached) {
            try {
              const parsed = JSON.parse(cached) as StudentOption[];

              if (Array.isArray(parsed) && parsed.length > 0) {
                setStudents(parsed);

                const lastStudentId =
                  window.localStorage.getItem(LAST_STUDENT_KEY) ?? "";

                if (parsed.some((student) => student.id === lastStudentId)) {
                  setSelectedStudentId(lastStudentId);
                }

                return;
              }
            } catch {
              window.sessionStorage.removeItem(STUDENTS_SESSION_KEY);
            }
          }
        }

        const snapshot = await getDocs(
          collection(db, "students")
        );

        const loadedStudents: StudentOption[] = snapshot.docs.map(
          (studentDoc) => {
            const data = studentDoc.data();

            const approvedPhoto =
              data.personalPhotoStatus === "approved" &&
              typeof data.personalPhotoUrl === "string"
                ? data.personalPhotoUrl
                : "";

            return {
              id: studentDoc.id,
              name:
                typeof data.studentName === "string"
                  ? data.studentName
                  : typeof data.name === "string"
                    ? data.name
                    : `طالب ${studentDoc.id}`,
              classroom:
                typeof data.classroom === "string"
                  ? data.classroom
                  : "",
              personalPhotoUrl: approvedPhoto,
              selectedAvatarIcon:
                typeof data.selectedAvatarIcon === "string"
                  ? data.selectedAvatarIcon
                  : "👦🏻",
            };
          }
        );

        loadedStudents.sort((a, b) =>
          a.name.localeCompare(b.name, "ar")
        );

        setStudents(loadedStudents);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            STUDENTS_SESSION_KEY,
            JSON.stringify(loadedStudents)
          );

          const lastStudentId =
            window.localStorage.getItem(LAST_STUDENT_KEY) ?? "";

          if (
            loadedStudents.some(
              (student) => student.id === lastStudentId
            )
          ) {
            setSelectedStudentId(lastStudentId);
          }
        }
      } catch (error) {
        console.error("تعذر تحميل الطلاب:", error);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    }

    void loadStudents();
  }, []);

  /*
   * حفظ آخر طالب مختار محليًا فقط.
   * لا توجد أي كتابة إضافية في Firestore.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (selectedStudentId) {
      window.localStorage.setItem(
        LAST_STUDENT_KEY,
        selectedStudentId
      );
    }
  }, [selectedStudentId]);

  /*
   * تحميل تقدم الدرس.
   * مهم: نؤخر القراءة قليلًا حتى ينتهي المعلم من كتابة اسم الدرس،
   * بدل تنفيذ 3 قراءات مع كل حرف يكتبه.
   */
  useEffect(() => {
    if (!selectedStudentId || !lessonName.trim()) {
      setPageOneBest(null);
      setPageTwoBest(null);
      setPageThreeBest(null);
      setPageAttempts({ 1: 0, 2: 0, 3: 0 });
      setCurrentBestErrors(null);
      setCurrentAttemptCount(0);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      async function loadLessonProgress() {
        try {
          const lessonKey = normalizeLessonKey(lessonName);

          async function readPage(targetPage: number) {
            const id = getAssessmentId({
              studentId: selectedStudentId,
              mode,
              lessonKey,
              pageNumber: targetPage,
            });

            const snapshot = await getDoc(
              doc(db, "lughatiCrownAssessments", id)
            );

            if (!snapshot.exists()) {
              return { bestErrors: null, attemptCount: 0 };
            }

            const data = snapshot.data();

            return {
              bestErrors:
                typeof data.bestErrors === "number"
                  ? data.bestErrors
                  : null,
              attemptCount:
                typeof data.attemptCount === "number"
                  ? data.attemptCount
                  : 0,
            };
          }

          const [first, second, third] = await Promise.all([
            readPage(1),
            readPage(2),
            readPage(3),
          ]);

          if (cancelled) return;

          setPageOneBest(first.bestErrors);
          setPageTwoBest(second.bestErrors);
          setPageThreeBest(third.bestErrors);
          setPageAttempts({
            1: first.attemptCount,
            2: second.attemptCount,
            3: third.attemptCount,
          });
        } catch (error) {
          console.error("تعذر تحميل تقدم تاج لغتي:", error);
        }
      }

      void loadLessonProgress();
    }, LESSON_LOAD_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedStudentId, lessonName, mode]);

  /*
   * الصفحة المختارة تستخدم ما حُمّل مسبقًا في الذاكرة.
   * لا نقرأ Firestore مرة ثانية عند التنقل بين الصفحات.
   */
  useEffect(() => {
    const bestByPage: Record<number, number | null> = {
      1: pageOneBest,
      2: pageTwoBest,
      3: pageThreeBest,
    };

    setCurrentBestErrors(bestByPage[pageNumber] ?? null);
    setCurrentAttemptCount(pageAttempts[pageNumber] ?? 0);
  }, [
    pageNumber,
    pageOneBest,
    pageTwoBest,
    pageThreeBest,
    pageAttempts,
  ]);

  /*
   * حفظ التقييم.
   */
async function saveAssessment() {
  if (!selectedStudent) {
    setMessage(
      "⚠️ اختر الطالب أولًا."
    );

    return;
  }

  if (!lessonName.trim()) {
    setMessage(
      "⚠️ اكتب اسم الدرس أولًا."
    );

    return;
  }

  if (
    errors < 0 ||
    errors > MAX_ERRORS
  ) {
    setMessage(
      "⚠️ عدد الأخطاء غير صحيح."
    );

    return;
  }

  try {
    setSaving(true);
    setMessage("");

    const lessonKey =
      normalizeLessonKey(
        lessonName
      );

    /*
     * سجل الصفحة الحالية.
     */
    const id =
      getAssessmentId({
        studentId:
          selectedStudent.id,

        mode,

        lessonKey,

        pageNumber,
      });

    const assessmentRef =
      doc(
        db,
        "lughatiCrownAssessments",
        id
      );

    /*
     * نستخدم أفضل نتيجة المحمّلة في الذاكرة بدل قراءة الوثيقة
     * مرة أخرى وقت الحفظ. هذا يوفر قراءة Firestore لكل اعتماد.
     */
    const oldBest = currentBestErrors;
    const isNewAssessment =
      currentBestErrors === null &&
      currentAttemptCount === 0;

    /*
     * نحفظ أفضل محاولة فقط.
     */
    const newBest =
      oldBest === null
        ? errors
        : Math.min(
            oldBest,
            errors
          );

    const attemptCount =
      currentAttemptCount + 1;

    const bestTitle =
      getTitle(
        mode,
        newBest
      );

    /*
     * حفظ نتيجة الصفحة.
     */
    await setDoc(
      assessmentRef,
      {
        studentId:
          selectedStudent.id,

        studentName:
          selectedStudent.name,

        classroom:
          selectedStudent.classroom,

        mode,

        lessonName:
          lessonName.trim(),

        lessonKey,

        pageNumber,

        bestErrors:
          newBest,

        lastErrors:
          errors,

        attemptCount,

        title:
          bestTitle,

        personalPhotoUrl:
          selectedStudent.personalPhotoUrl,

        selectedAvatarIcon:
          selectedStudent.selectedAvatarIcon ||
          "👦🏻",

        updatedAt:
          serverTimestamp(),

        ...(isNewAssessment
          ? {
              createdAt:
                serverTimestamp(),
            }
          : {}),
      },
      {
        merge: true,
      }
    );

    /*
     * ملخص خفيف لآخر تقييم يظهر للطالب.
     * كتابة واحدة فقط بدون أي قراءة إضافية من Firestore.
     */
    await setDoc(
      doc(
        db,
        "studentCrownSummary",
        selectedStudent.id
      ),
      {
        studentId:
          selectedStudent.id,

        latestAssessment: {
          mode,
          lessonName:
            lessonName.trim(),
          lessonKey,
          pageNumber,
          bestErrors:
            newBest,
          lastErrors:
            errors,
          attemptCount,
          title:
            bestTitle,
          updatedAt:
            serverTimestamp(),
        },

        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    /*
     * نقاط لقب الصفحة:
     * نجم = 1، بطل = 2، أمير = 3.
     *
     * نستخدم وثيقة منح ثابتة + transaction حتى لا تتكرر
     * النقاط عند إعادة اعتماد الصفحة نفسها.
     * القراءة هنا تحدث فقط وقت الضغط على "اعتماد"،
     * ولا يوجد onSnapshot أو استعلام مستمر.
     */
    const pageLevelKey =
      getCrownLevelKey(
        mode,
        newBest
      );

    const pageLevelPoints =
      getCrownLevelPoints(
        newBest
      );

    let pagePointsGranted = 0;

    if (
      pageLevelKey &&
      pageLevelPoints > 0
    ) {
      const pageGrantId =
        `${selectedStudent.id}__${mode}__${lessonKey}__page-${pageNumber}__${pageLevelKey}`;

      const pageGrantRef =
        doc(
          db,
          "lughatiCrownPointGrants",
          pageGrantId
        );

      const studentRef =
        doc(
          db,
          "students",
          selectedStudent.id
        );

      await runTransaction(
        db,
        async (transaction) => {
          const [
            grantSnapshot,
            studentSnapshot,
          ] = await Promise.all([
            transaction.get(
              pageGrantRef
            ),
            transaction.get(
              studentRef
            ),
          ]);

          if (
            grantSnapshot.exists()
          ) {
            return;
          }

          if (
            !studentSnapshot.exists()
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const studentData =
            studentSnapshot.data();

          const currentPoints =
            typeof studentData.points ===
            "number"
              ? studentData.points
              : 0;

          const currentHistory =
            Array.isArray(
              studentData.pointsHistory
            )
              ? studentData.pointsHistory
              : [];

          const reason =
            `${bestTitle.replace(
              /^[^\\p{L}\\p{N}]+/u,
              ""
            )} – درس ${lessonName.trim()} – الصفحة ${pageNumber}`;

          transaction.set(
            studentRef,
            {
              points:
                currentPoints +
                pageLevelPoints,

              pointsHistory: [
                ...currentHistory,
                {
                  reason,
                  points:
                    pageLevelPoints,
                  stars: 0,
                  category:
                    "تاج لغتي",
                  source:
                    "lughati-crown",
                  sourceId:
                    pageGrantId,
                  date:
                    getRiyadhDate(),
                  createdAt:
                    new Date(),
                },
              ],

              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          transaction.set(
            pageGrantRef,
            {
              studentId:
                selectedStudent.id,
              studentName:
                selectedStudent.name,
              classroom:
                selectedStudent.classroom,
              mode,
              lessonName:
                lessonName.trim(),
              lessonKey,
              pageNumber,
              levelKey:
                pageLevelKey,
              title:
                bestTitle,
              points:
                pageLevelPoints,
              grantedAt:
                serverTimestamp(),
            }
          );

          pagePointsGranted =
            pageLevelPoints;
        }
      );
    }

    /*
     * نحسب حالة الصفحات بعد حفظ
     * المحاولة الحالية مباشرة.
     */
    const nextPageOneBest =
      pageNumber === 1
        ? newBest
        : pageOneBest;

    const nextPageTwoBest =
      pageNumber === 2
        ? newBest
        : pageTwoBest;

    const nextPageThreeBest =
      pageNumber === 3
        ? newBest
        : pageThreeBest;

    /*
     * شرط الملك:
     * الصفحة الأولى والثانية
     * دون أخطاء.
     */
    const becameKing =
      nextPageOneBest === 0 &&
      nextPageTwoBest === 0;

    /*
     * شرط الإتقان الكامل:
     * الصفحات الثلاث كلها بلا أخطاء.
     */
    const becameFullMaster =
      becameKing &&
      nextPageThreeBest === 0;

    /*
     * إذا تحقق الملك نحفظ
     * التتويج رسميًا.
     */
    if (becameKing) {
      const achievementId =
        `${selectedStudent.id}__${mode}__${lessonKey}`;

      const achievementRef =
        doc(
          db,
          "lughatiCrownAchievements",
          achievementId
        );

      const achievementSnapshot =
        await getDoc(
          achievementRef
        );

      const achievementData =
        achievementSnapshot.exists()
          ? achievementSnapshot.data()
          : null;

      const alreadyKing =
        achievementData?.king ===
        true;

      const alreadyFullMaster =
        achievementData?.fullMastery ===
        true;

      const crownTitle =
        mode === "reading"
          ? "👑 ملك القراءة"
          : "👑 ملك الإملاء";

      const achievementPayload: Record<
        string,
        unknown
      > = {
        studentId:
          selectedStudent.id,

        studentName:
          selectedStudent.name,

        classroom:
          selectedStudent.classroom,

        mode,

        lessonName:
          lessonName.trim(),

        lessonKey,

        king: true,

        kingTitle:
          crownTitle,

        personalPhotoUrl:
          selectedStudent.personalPhotoUrl,

        selectedAvatarIcon:
          selectedStudent.selectedAvatarIcon ||
          "👦🏻",

        pageOneBest:
          nextPageOneBest,

        pageTwoBest:
          nextPageTwoBest,

        pageThreeBest:
          nextPageThreeBest,

        fullMastery:
          becameFullMaster,

        updatedAt:
          serverTimestamp(),
      };

      /*
       * أول مرة يحصل فيها
       * على لقب الملك.
       */
      if (!alreadyKing) {
        achievementPayload.kingAchievedAt =
          serverTimestamp();
      }

      /*
       * أول مرة يحقق فيها
       * الإتقان الكامل.
       */
      if (
        becameFullMaster &&
        !alreadyFullMaster
      ) {
        achievementPayload.fullMasteryAt =
          serverTimestamp();
      }

      if (
        !achievementSnapshot.exists()
      ) {
        achievementPayload.createdAt =
          serverTimestamp();
      }

      await setDoc(
        achievementRef,
        achievementPayload,
        {
          merge: true,
        }
      );

      /*
       * نقاط الملك = 5 مرة واحدة لكل درس.
       * الإتقان الكامل = +3 مرة واحدة لكل درس.
       */
      const bonusGrants: Array<{
        key: string;
        points: number;
        reason: string;
      }> = [];

      if (!alreadyKing) {
        bonusGrants.push({
          key: "king",
          points: 5,
          reason:
            `${crownTitle.replace(
              /^[^\\p{L}\\p{N}]+/u,
              ""
            )} – درس ${lessonName.trim()}`,
        });
      }

      if (
        becameFullMaster &&
        !alreadyFullMaster
      ) {
        bonusGrants.push({
          key: "full-mastery",
          points: 3,
          reason:
            `الإتقان الكامل – درس ${lessonName.trim()}`,
        });
      }

      for (
        const bonus of
        bonusGrants
      ) {
        const bonusGrantId =
          `${selectedStudent.id}__${mode}__${lessonKey}__${bonus.key}`;

        const bonusGrantRef =
          doc(
            db,
            "lughatiCrownPointGrants",
            bonusGrantId
          );

        const studentRef =
          doc(
            db,
            "students",
            selectedStudent.id
          );

        await runTransaction(
          db,
          async (transaction) => {
            const [
              grantSnapshot,
              studentSnapshot,
            ] = await Promise.all([
              transaction.get(
                bonusGrantRef
              ),
              transaction.get(
                studentRef
              ),
            ]);

            if (
              grantSnapshot.exists()
            ) {
              return;
            }

            if (
              !studentSnapshot.exists()
            ) {
              throw new Error(
                "STUDENT_NOT_FOUND"
              );
            }

            const studentData =
              studentSnapshot.data();

            const currentPoints =
              typeof studentData.points ===
              "number"
                ? studentData.points
                : 0;

            const currentHistory =
              Array.isArray(
                studentData.pointsHistory
              )
                ? studentData.pointsHistory
                : [];

            transaction.set(
              studentRef,
              {
                points:
                  currentPoints +
                  bonus.points,

                pointsHistory: [
                  ...currentHistory,
                  {
                    reason:
                      bonus.reason,
                    points:
                      bonus.points,
                    stars: 0,
                    category:
                      "تاج لغتي",
                    source:
                      "lughati-crown",
                    sourceId:
                      bonusGrantId,
                    date:
                      getRiyadhDate(),
                    createdAt:
                      new Date(),
                  },
                ],

                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            transaction.set(
              bonusGrantRef,
              {
                studentId:
                  selectedStudent.id,
                studentName:
                  selectedStudent.name,
                classroom:
                  selectedStudent.classroom,
                mode,
                lessonName:
                  lessonName.trim(),
                lessonKey,
                reward:
                  bonus.key,
                points:
                  bonus.points,
                grantedAt:
                  serverTimestamp(),
              }
            );
          }
        );
      }
    }

    /*
     * تحديث الشاشة محليًا.
     */
    setCurrentBestErrors(
      newBest
    );

    setCurrentAttemptCount(
      attemptCount
    );

    setPageAttempts((previous) => ({
      ...previous,
      [pageNumber]: attemptCount,
    }));

    if (
      pageNumber === 1
    ) {
      setPageOneBest(
        newBest
      );
    }

    if (
      pageNumber === 2
    ) {
      setPageTwoBest(
        newBest
      );
    }

    if (
      pageNumber === 3
    ) {
      setPageThreeBest(
        newBest
      );
    }

    /*
     * رسالة النجاح.
     */
    if (becameFullMaster) {
      setMessage(
        mode === "reading"
          ? "💎 رائع! أصبح الطالب ملك القراءة وحقق وسام الإتقان الكامل للدرس."
          : "💎 رائع! أصبح الطالب ملك الإملاء وحقق وسام الإتقان الكامل للدرس."
      );
    } else if (becameKing) {
      setMessage(
        mode === "reading"
          ? "👑 تم التتويج رسميًا: ملك القراءة في هذا الدرس."
          : "👑 تم التتويج رسميًا: ملك الإملاء في هذا الدرس."
      );
    } else if (
      oldBest !== null &&
      errors > oldBest
    ) {
      setMessage(
        `✅ تم تسجيل المحاولة، وبقي أفضل إنجاز للطالب: ${oldBest} خطأ.`
      );
    } else if (
      newBest === 0
    ) {
      setMessage(
        pagePointsGranted > 0
          ? `🎉 رائع! الصفحة متقنة بلا أخطاء — ${bestTitle} — أضيفت ${pagePointsGranted} نقاط.`
          : `🎉 رائع! الصفحة متقنة بلا أخطاء — ${bestTitle} — نقاط هذا الاستحقاق ممنوحة سابقًا.`
      );
    } else {
      setMessage(
        pagePointsGranted > 0
          ? `✅ تم حفظ أفضل نتيجة: ${newBest} خطأ — ${bestTitle} — أضيفت ${pagePointsGranted} نقاط.`
          : `✅ تم حفظ أفضل نتيجة: ${newBest} خطأ — ${bestTitle}`
      );
    }
  } catch (error) {
    console.error(
      "تعذر حفظ تقييم تاج لغتي:",
      error
    );

    setMessage(
      "❌ تعذر حفظ التقييم، حاول مرة أخرى."
    );
  } finally {
    setSaving(false);
  }
}

  const crownWord =
    mode === "reading"
      ? "القراءة"
      : "الإملاء";

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",

        padding:
          "28px 16px 70px",

        background:
          "linear-gradient(180deg,#fff9e8 0%,#f4fbf7 45%,#ffffff 100%)",

        fontFamily:
          "Arial, sans-serif",

        color:
          "#173b31",
      }}
    >
      <div
        style={{
          maxWidth:
            1100,

          margin:
            "0 auto",
        }}
      >
        {/* التنقل */}

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  }}
>
  <a
    href="/teacher"
    style={{
      display: "inline-block",
      textDecoration: "none",
      background: "#ffffff",
      color: "#176c46",
      border: "1px solid #d6e9df",
      borderRadius: 15,
      padding: "11px 17px",
      fontWeight: 900,
    }}
  >
    ← العودة إلى لوحة المعلم
  </a>

  <a
    href="/teacher/lughati-crown/hall-of-fame"
    style={{
      display: "inline-block",
      textDecoration: "none",
      background:
        "linear-gradient(135deg,#fff3bd,#ffe58a)",
      color: "#805b00",
      border: "2px solid #e5c24a",
      borderRadius: 15,
      padding: "11px 17px",
      fontWeight: 900,
      boxShadow:
        "0 7px 18px rgba(160,120,20,.10)",
    }}
  >
    🏆 سجل المتوجين
  </a>
</div>

        {/* رأس تاج لغتي */}

        <section
          style={{
            textAlign:
              "center",

            borderRadius:
              30,

            padding:
              "32px 20px",

            marginBottom:
              22,

            background:
              "linear-gradient(135deg,#fff1a8,#fffdf2)",

            border:
              "2px solid #f1cc54",

            boxShadow:
              "0 14px 35px rgba(165,120,10,.12)",
          }}
        >
          <div
            style={{
              fontSize:
                62,
            }}
          >
            👑
          </div>

          <h1
            style={{
              margin:
                "8px 0",

              color:
                "#805b00",

              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            تاج لغتي
          </h1>

          <p
            style={{
              margin:
                0,

              color:
                "#796a41",

              lineHeight:
                1.9,

              fontWeight:
                700,
            }}
          >
            نحتفي بالإتقان والتطور والمحاولة في القراءة والإملاء.
          </p>
        </section>

        {/* التبويبات */}

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(2,minmax(0,1fr))",

            gap:
              12,

            marginBottom:
              22,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode(
                "reading"
              );

              setMessage(
                ""
              );
            }}
            style={{
              border:
                mode ===
                "reading"
                  ? "3px solid #17845b"
                  : "1px solid #dce9e3",

              borderRadius:
                22,

              padding:
                "19px 12px",

              background:
                mode ===
                "reading"
                  ? "#e8f8ef"
                  : "#ffffff",

              color:
                "#176c46",

              fontWeight:
                900,

              fontSize:
                19,

              cursor:
                "pointer",
            }}
          >
            📖 ملك القراءة
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(
                "spelling"
              );

              setMessage(
                ""
              );
            }}
            style={{
              border:
                mode ===
                "spelling"
                  ? "3px solid #c28b12"
                  : "1px solid #eadfbd",

              borderRadius:
                22,

              padding:
                "19px 12px",

              background:
                mode ===
                "spelling"
                  ? "#fff7da"
                  : "#ffffff",

              color:
                "#8a6500",

              fontWeight:
                900,

              fontSize:
                19,

              cursor:
                "pointer",
            }}
          >
            ✍️ ملك الإملاء
          </button>
        </section>

        {/* لوحة التقييم */}

        <section
          style={{
            background:
              "#ffffff",

            borderRadius:
              28,

            padding:
              24,

            border:
              "1px solid #deebe5",

            boxShadow:
              "0 12px 32px rgba(30,90,65,.08)",
          }}
        >
          <div
            style={{
              marginBottom:
                20,
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 7px",

                color:
                  mode ===
                    "reading"
                    ? "#176c46"
                    : "#8a6500",
              }}
            >
              {mode ===
              "reading"
                ? "📖 تقييم القراءة"
                : "✍️ تقييم الإملاء"}
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  "#64756d",

                lineHeight:
                  1.8,
              }}
            >
              سجّل عدد الأخطاء، وسيحدد النظام اللقب تلقائيًا ويحفظ أفضل محاولة.
            </p>
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",

              gap:
                16,
            }}
          >
            {/* الطالب */}

            <div>
              <label
                style={
                  labelStyle
                }
              >
                الطالب
              </label>

              <select
                value={
                  selectedStudentId
                }
                disabled={
                  studentsLoading
                }
                onChange={(
                  event
                ) => {
                  setSelectedStudentId(
                    event
                      .target
                      .value
                  );

                  setMessage(
                    ""
                  );
                }}
                style={
                  fieldStyle
                }
              >
                <option value="">
                  {studentsLoading
                    ? "جارٍ تحميل الطلاب..."
                    : "اختر الطالب"}
                </option>

                {students.map(
                  (
                    student
                  ) => (
                    <option
                      key={
                        student.id
                      }
                      value={
                        student.id
                      }
                    >
                      {
                        student.name
                      }
                      {student.classroom
                        ? ` — ${student.classroom}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* الدرس */}

            <div>
              <label
                style={
                  labelStyle
                }
              >
                اسم الدرس
              </label>

              <input
                value={
                  lessonName
                }
                onChange={(
                  event
                ) => {
                  setLessonName(
                    event
                      .target
                      .value
                  );

                  setMessage(
                    ""
                  );
                }}
                placeholder="مثال: درس آداب الزيارة"
                style={
                  fieldStyle
                }
              />
            </div>

            {/* الصفحة */}

            <div>
              <label
                style={
                  labelStyle
                }
              >
                الصفحة
              </label>

              <select
                value={
                  pageNumber
                }
                onChange={(
                  event
                ) =>
                  setPageNumber(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                style={
                  fieldStyle
                }
              >
                <option
                  value={1}
                >
                  الصفحة الأولى
                </option>

                <option
                  value={2}
                >
                  الصفحة الثانية
                </option>

                <option
                  value={3}
                >
                  الصفحة الثالثة
                </option>
              </select>
            </div>

            {/* الأخطاء */}

            <div>
              <label
                style={
                  labelStyle
                }
              >
                عدد الأخطاء
              </label>

              <input
                type="number"
                min={0}
                max={
                  MAX_ERRORS
                }
                value={
                  errors
                }
                onChange={(
                  event
                ) => {
                  const next =
                    Number(
                      event
                        .target
                        .value
                    );

                  setErrors(
                    Number.isFinite(
                      next
                    )
                      ? Math.max(
                          0,
                          Math.min(
                            MAX_ERRORS,
                            next
                          )
                        )
                      : 0
                  );
                }}
                style={
                  fieldStyle
                }
              />
            </div>
          </div>

          {/* هوية الطالب */}

          {selectedStudent && (
            <div
              style={{
                marginTop:
                  20,

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  15,

                padding:
                  17,

                borderRadius:
                  22,

                background:
                  "#f7fbf9",

                border:
                  "1px solid #dfece6",
              }}
            >
              <div
                style={{
                  width:
                    70,

                  height:
                    70,

                  borderRadius:
                    "50%",

                  display:
                    "grid",

                  placeItems:
                    "center",

                  overflow:
                    "hidden",

                  background:
                    "#eaf8f1",

                  border:
                    "3px solid #b9e4cf",

                  fontSize:
                    42,

                  flexShrink:
                    0,
                }}
              >
                {selectedStudent.personalPhotoUrl ? (
                  <img
                    src={
                      selectedStudent.personalPhotoUrl
                    }
                    alt={
                      selectedStudent.name
                    }
                    style={{
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",
                    }}
                  />
                ) : (
                  <span>
                    {selectedStudent.selectedAvatarIcon ||
                      "👦🏻"}
                  </span>
                )}
              </div>

              <div>
                <div
                  style={{
                    fontWeight:
                      900,

                    fontSize:
                      20,

                    color:
                      "#173b31",
                  }}
                >
                  {
                    selectedStudent.name
                  }
                </div>

                {selectedStudent.classroom && (
                  <div
                    style={{
                      marginTop:
                        4,

                      color:
                        "#75847d",

                      fontWeight:
                        700,
                    }}
                  >
                    {
                      selectedStudent.classroom
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* اللقب المتوقع */}

          <div
            style={{
              marginTop:
                20,

              padding:
                20,

              borderRadius:
                24,

              textAlign:
                "center",

              background:
                errors === 0
                  ? "linear-gradient(135deg,#fff4bd,#fffdf2)"
                  : "#f7faf8",

              border:
                errors === 0
                  ? "2px solid #eac54e"
                  : "1px solid #e0ebe5",
            }}
          >
            <div
              style={{
                color:
                  "#7b7f79",

                fontSize:
                  13,

                fontWeight:
                  800,
              }}
            >
              اللقب المتوقع للمحاولة
            </div>

            <div
              style={{
                marginTop:
                  8,

                fontSize:
                  "clamp(22px,4vw,30px)",

                fontWeight:
                  900,

                color:
                  errors === 0
                    ? "#8a6500"
                    : "#176c46",
              }}
            >
              {
                previewTitle
              }
            </div>
          </div>

          {/* أفضل محاولة */}

          <div
            style={{
              marginTop:
                16,

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(170px,1fr))",

              gap:
                12,
            }}
          >
            <ProgressCard
              title="الصفحة الأولى"
              value={
                pageOneBest
              }
              mode={
                mode
              }
            />

            <ProgressCard
              title="الصفحة الثانية"
              value={
                pageTwoBest
              }
              mode={
                mode
              }
            />

            <ProgressCard
              title="الصفحة الثالثة"
              value={
                pageThreeBest
              }
              mode={
                mode
              }
            />
          </div>

    {isKing && selectedStudent && (
  <div
    style={{
      marginTop: 20,
      padding: "26px 20px",
      borderRadius: 28,
      background:
        "linear-gradient(135deg,#fff0a6 0%,#fffaf0 55%,#ffffff 100%)",
      border: "3px solid #e5bd38",
      boxShadow:
        "0 16px 36px rgba(175,130,15,.16)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 18,
        fontSize: 28,
        opacity: 0.45,
      }}
    >
      ✨
    </div>

    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 18,
        fontSize: 24,
        opacity: 0.4,
      }}
    >
      ⭐
    </div>

    <div
      style={{
        fontSize: 54,
        marginBottom: 8,
      }}
    >
      👑
    </div>

    <div
      style={{
        width: 86,
        height: 86,
        margin: "0 auto",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background: "#fff8d8",
        border: "4px solid #e8c34a",
        boxShadow:
          "0 10px 24px rgba(150,110,10,.18)",
        fontSize: 50,
      }}
    >
      {selectedStudent.personalPhotoUrl ? (
        <img
          src={selectedStudent.personalPhotoUrl}
          alt={selectedStudent.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span>
          {selectedStudent.selectedAvatarIcon || "👦🏻"}
        </span>
      )}
    </div>

    <div
      style={{
        marginTop: 12,
        fontSize: 22,
        fontWeight: 900,
        color: "#5f4a11",
      }}
    >
      {selectedStudent.name}
    </div>

    {selectedStudent.classroom && (
      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          fontWeight: 800,
          color: "#8c7a46",
        }}
      >
        {selectedStudent.classroom}
      </div>
    )}

    <div
      style={{
        marginTop: 14,
        fontSize: "clamp(27px,4vw,36px)",
        fontWeight: 900,
        color: "#7a5600",
      }}
    >
      👑 ملك {crownWord}
    </div>

    <div
      style={{
        marginTop: 8,
        color: "#7f6b36",
        fontWeight: 800,
        lineHeight: 1.8,
      }}
    >
      في درس: {lessonName}
    </div>

    <p
      style={{
        margin: "10px auto 0",
        maxWidth: 620,
        color: "#806d35",
        lineHeight: 1.9,
        fontWeight: 700,
      }}
    >
      أتقن الطالب الصفحة الأولى والثانية دون أخطاء،
      واستحق تاج {crownWord} بكل جدارة 🌟
    </p>

    <div
      style={{
        marginTop: 16,
        display: "inline-block",
        padding: "9px 16px",
        borderRadius: 999,
        background: "#ffffff",
        color: "#8a6500",
        fontWeight: 900,
        border: "1px solid #e6ca6e",
      }}
    >
      🏅 إنجاز جديد في تاج لغتي
    </div>
  </div>
)}

          {/* الإتقان الكامل */}

          {hasFullMastery && (
            <div
              style={{
                marginTop:
                  13,

                padding:
                  16,

                borderRadius:
                  20,

                textAlign:
                  "center",

                background:
                  "#eefaf4",

                border:
                  "2px solid #a8dec2",

                color:
                  "#176c46",

                fontWeight:
                  900,
              }}
            >
              💎 وسام الإتقان الكامل للدرس
            </div>
          )}

          {/* بيانات الصفحة الحالية */}

          {currentBestErrors !==
            null && (
            <div
              style={{
                marginTop:
                  16,

                padding:
                  14,

                borderRadius:
                  18,

                background:
                  "#eef6ff",

                color:
                  "#315b79",

                lineHeight:
                  1.8,

                fontWeight:
                  800,
              }}
            >
              🏅 أفضل نتيجة في الصفحة الحالية:
              {" "}
              {currentBestErrors}
              {" "}
              {currentBestErrors ===
              1
                ? "خطأ"
                : "أخطاء"}
              {" — "}
              {getTitle(
                mode,
                currentBestErrors
              )}
              <br />
              🔁 عدد المحاولات:
              {" "}
              {
                currentAttemptCount
              }
            </div>
          )}

          {/* زر الحفظ */}

          <button
            type="button"
            disabled={
              saving ||
              !selectedStudent ||
              !lessonName.trim()
            }
            onClick={
              saveAssessment
            }
            style={{
              width:
                "100%",

              marginTop:
                20,

              padding:
                "16px 18px",

              border:
                "none",

              borderRadius:
                17,

              background:
                saving ||
                !selectedStudent ||
                !lessonName.trim()
                  ? "#bccbc4"
                  : mode ===
                      "reading"
                    ? "linear-gradient(135deg,#168a63,#0f7654)"
                    : "linear-gradient(135deg,#c89826,#9f7110)",

              color:
                "white",

              fontSize:
                18,

              fontWeight:
                900,

              cursor:
                saving
                  ? "wait"
                  : "pointer",
            }}
          >
            {saving
              ? "⏳ جاري حفظ التقييم..."
              : "⭐ اعتماد نتيجة الطالب"}
          </button>

          {message && (
            <div
              style={{
                marginTop:
                  15,

                padding:
                  "14px 16px",

                textAlign:
                  "center",

                borderRadius:
                  17,

                background:
                  message.startsWith(
                    "❌"
                  ) ||
                  message.startsWith(
                    "⚠️"
                  )
                    ? "#fff2f2"
                    : "#edf9f3",

                color:
                  message.startsWith(
                    "❌"
                  ) ||
                  message.startsWith(
                    "⚠️"
                  )
                    ? "#a73d3d"
                    : "#176c46",

                fontWeight:
                  900,

                lineHeight:
                  1.8,
              }}
            >
              {
                message
              }
            </div>
          )}

          {/* سلم الألقاب */}

          <div
            style={{
              marginTop:
                24,

              borderTop:
                "1px solid #e4ece8",

              paddingTop:
                20,
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 14px",

                color:
                  "#173b31",
              }}
            >
              🏅 سلم الألقاب
            </h3>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",

                gap:
                  10,
              }}
            >
              <TitleGuide
                icon="👑"
                errors="0 أخطاء"
                title={`أمير ${crownWord}`}
              />

              <TitleGuide
                icon="🏆"
                errors="1–2 خطأ"
                title={`بطل ${crownWord}`}
              />

              <TitleGuide
                icon="⭐"
                errors="3–4 أخطاء"
                title={`نجم ${crownWord}`}
              />

              <TitleGuide
                icon="🌱"
                errors="5 فأكثر"
                title={
                  mode ===
                  "reading"
                    ? "قارئ مجتهد"
                    : "مجتهد الإملاء"
                }
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProgressCard({
  title,
  value,
  mode,
}: {
  title: string;
  value: number | null;
  mode: CrownMode;
}) {
  const mastered =
    value === 0;

  return (
    <div
      style={{
        padding:
          15,

        borderRadius:
          18,

        background:
          mastered
            ? "#fff8d9"
            : "#f7faf8",

        border:
          mastered
            ? "2px solid #edcc61"
            : "1px solid #dfe9e4",

        textAlign:
          "center",
      }}
    >
      <strong
        style={{
          display:
            "block",

          color:
            "#173b31",
        }}
      >
        {
          title
        }
      </strong>

      <div
        style={{
          marginTop:
            8,

          color:
            mastered
              ? "#8a6500"
              : "#64756d",

          fontWeight:
            900,

          lineHeight:
            1.6,
        }}
      >
        {value === null
          ? "لم تُقيّم"
          : value === 0
            ? `✅ ${getTitle(
                mode,
                0
              )}`
            : `${value} أخطاء — ${getTitle(
                mode,
                value
              )}`}
      </div>
    </div>
  );
}

function TitleGuide({
  icon,
  errors,
  title,
}: {
  icon: string;
  errors: string;
  title: string;
}) {
  return (
    <div
      style={{
        padding:
          "14px 12px",

        borderRadius:
          17,

        background:
          "#f9fbfa",

        border:
          "1px solid #e1ebe6",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            27,
        }}
      >
        {
          icon
        }
      </div>

      <strong
        style={{
          display:
            "block",

          marginTop:
            5,

          color:
            "#173b31",
        }}
      >
        {
          title
        }
      </strong>

      <small
        style={{
          display:
            "block",

          marginTop:
            5,

          color:
            "#7a8982",

          fontWeight:
            700,
        }}
      >
        {
          errors
        }
      </small>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display:
    "block",

  marginBottom:
    7,

  color:
    "#465c53",

  fontWeight:
    900,
};

const fieldStyle: React.CSSProperties = {
  width:
    "100%",

  boxSizing:
    "border-box",

  padding:
    "13px 14px",

  borderRadius:
    14,

  border:
    "1px solid #d8e5df",

  background:
    "#ffffff",

  color:
    "#173b31",

  fontSize:
    16,

  fontWeight:
    700,

  outline:
    "none",
};