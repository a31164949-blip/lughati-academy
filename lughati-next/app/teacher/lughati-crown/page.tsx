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
   */
  useEffect(() => {
    async function loadStudents() {
      try {
        setStudentsLoading(
          true
        );

        const snapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );

        const loadedStudents: StudentOption[] =
          snapshot.docs.map(
            (studentDoc) => {
              const data =
                studentDoc.data();

              const approvedPhoto =
                data.personalPhotoStatus ===
                  "approved" &&
                typeof data.personalPhotoUrl ===
                  "string"
                  ? data.personalPhotoUrl
                  : "";

              return {
                id:
                  studentDoc.id,

                name:
                  typeof data.studentName ===
                  "string"
                    ? data.studentName
                    : typeof data.name ===
                        "string"
                      ? data.name
                      : `طالب ${studentDoc.id}`,

                classroom:
                  typeof data.classroom ===
                  "string"
                    ? data.classroom
                    : "",

                personalPhotoUrl:
                  approvedPhoto,

                selectedAvatarIcon:
                  typeof data.selectedAvatarIcon ===
                  "string"
                    ? data.selectedAvatarIcon
                    : "👦🏻",
              };
            }
          );

        loadedStudents.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "ar"
            )
        );

        setStudents(
          loadedStudents
        );
      } catch (error) {
        console.error(
          "تعذر تحميل الطلاب:",
          error
        );

        setStudents([]);
      } finally {
        setStudentsLoading(
          false
        );
      }
    }

    void loadStudents();
  }, []);

  /*
   * عند تغيير الطالب أو الدرس أو المسار:
   * نحمّل أفضل النتائج للصفحات.
   */
  useEffect(() => {
    async function loadLessonProgress() {
      if (
        !selectedStudentId ||
        !lessonName.trim()
      ) {
        setPageOneBest(
          null
        );

        setPageTwoBest(
          null
        );

        setPageThreeBest(
          null
        );

        setCurrentBestErrors(
          null
        );

        setCurrentAttemptCount(
          0
        );

        return;
      }

      try {
        const lessonKey =
          normalizeLessonKey(
            lessonName
          );

        async function readPage(
          targetPage: number
        ) {
          const id =
            getAssessmentId({
              studentId:
                selectedStudentId,

              mode,

              lessonKey,

              pageNumber:
                targetPage,
            });

          const snapshot =
            await getDoc(
              doc(
                db,
                "lughatiCrownAssessments",
                id
              )
            );

          if (
            !snapshot.exists()
          ) {
            return null;
          }

          const data =
            snapshot.data();

          return typeof data.bestErrors ===
            "number"
            ? data.bestErrors
            : null;
        }

        const [
          first,
          second,
          third,
        ] =
          await Promise.all([
            readPage(1),
            readPage(2),
            readPage(3),
          ]);

        setPageOneBest(
          first
        );

        setPageTwoBest(
          second
        );

        setPageThreeBest(
          third
        );
      } catch (error) {
        console.error(
          "تعذر تحميل تقدم تاج لغتي:",
          error
        );
      }
    }

    void loadLessonProgress();
  }, [
    selectedStudentId,
    lessonName,
    mode,
  ]);

  /*
   * تحميل أفضل محاولة للصفحة المختارة.
   */
  useEffect(() => {
    async function loadCurrentPage() {
      if (
        !selectedStudentId ||
        !lessonName.trim()
      ) {
        setCurrentBestErrors(
          null
        );

        setCurrentAttemptCount(
          0
        );

        return;
      }

      try {
        const lessonKey =
          normalizeLessonKey(
            lessonName
          );

        const id =
          getAssessmentId({
            studentId:
              selectedStudentId,

            mode,

            lessonKey,

            pageNumber,
          });

        const snapshot =
          await getDoc(
            doc(
              db,
              "lughatiCrownAssessments",
              id
            )
          );

        if (
          !snapshot.exists()
        ) {
          setCurrentBestErrors(
            null
          );

          setCurrentAttemptCount(
            0
          );

          return;
        }

        const data =
          snapshot.data();

        setCurrentBestErrors(
          typeof data.bestErrors ===
            "number"
            ? data.bestErrors
            : null
        );

        setCurrentAttemptCount(
          typeof data.attemptCount ===
            "number"
            ? data.attemptCount
            : 0
        );
      } catch (error) {
        console.error(
          "تعذر تحميل أفضل محاولة:",
          error
        );
      }
    }

    void loadCurrentPage();
  }, [
    selectedStudentId,
    lessonName,
    mode,
    pageNumber,
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

    const oldSnapshot =
      await getDoc(
        assessmentRef
      );

    const oldData =
      oldSnapshot.exists()
        ? (oldSnapshot.data() as Partial<AssessmentRecord>)
        : null;

    const oldBest =
      typeof oldData?.bestErrors ===
        "number"
        ? oldData.bestErrors
        : null;

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
      typeof oldData?.attemptCount ===
        "number"
        ? oldData.attemptCount + 1
        : 1;

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

        ...(oldSnapshot.exists()
          ? {}
          : {
              createdAt:
                serverTimestamp(),
            }),
      },
      {
        merge: true,
      }
    );

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
        `🎉 رائع! الصفحة متقنة بلا أخطاء — ${bestTitle}`
      );
    } else {
      setMessage(
        `✅ تم حفظ أفضل نتيجة: ${newBest} خطأ — ${bestTitle}`
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

           {/* عدد الأخطاء */}

<div>
  <label style={labelStyle}>
    عدد الأخطاء
  </label>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "54px 1fr 54px",
      gap: "9px",
      alignItems: "center",
    }}
  >
    <button
      type="button"
      onClick={() =>
        setErrors((current) =>
          Math.max(0, current - 1)
        )
      }
      disabled={errors === 0}
      style={{
        height: "56px",
        borderRadius: "14px",
        border: "1px solid #d8e5df",
        background:
          errors === 0 ? "#f1f3f2" : "#eaf8f1",
        color: "#176c46",
        fontSize: "28px",
        fontWeight: 900,
        cursor:
          errors === 0 ? "not-allowed" : "pointer",
      }}
    >
      −
    </button>

    <div
      style={{
        height: "56px",
        borderRadius: "14px",
        border:
          errors === 0
            ? "2px solid #e8c44b"
            : "1px solid #d8e5df",
        background:
          errors === 0 ? "#fff9dc" : "#ffffff",
        display: "grid",
        placeItems: "center",
        fontSize: "25px",
        fontWeight: 900,
        color:
          errors === 0 ? "#8a6500" : "#173b31",
      }}
    >
      {errors}
    </div>

    <button
      type="button"
      onClick={() =>
        setErrors((current) =>
          Math.min(MAX_ERRORS, current + 1)
        )
      }
      disabled={errors >= MAX_ERRORS}
      style={{
        height: "56px",
        borderRadius: "14px",
        border: "none",
        background:
          errors >= MAX_ERRORS
            ? "#c8d1cd"
            : mode === "reading"
              ? "#168a63"
              : "#c28b12",
        color: "white",
        fontSize: "28px",
        fontWeight: 900,
        cursor:
          errors >= MAX_ERRORS
            ? "not-allowed"
            : "pointer",
      }}
    >
      +
    </button>
  </div>

  {errors > 0 && (
    <button
      type="button"
      onClick={() => setErrors(0)}
      style={{
        width: "100%",
        marginTop: "8px",
        padding: "8px",
        borderRadius: "11px",
        border: "none",
        background: "#fff7df",
        color: "#8a6500",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      ↺ إعادة إلى صفر
    </button>
  )}
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