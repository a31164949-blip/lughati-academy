"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";


import { db } from "../../../firebase";

const STUDENTS_PAGE_CACHE_KEY =
  "teacher-students-page-data-v1";
const STUDENTS_PAGE_CACHE_MS =
  5 * 60 * 1000;

type StudentsPageCache = {
  cachedAt: number;
  students: Array<Record<string, unknown>>;
  profiles: Record<string, FamilyProfile>;
};

function clearStudentsPageCache() {
  try {
    sessionStorage.removeItem(
      STUDENTS_PAGE_CACHE_KEY
    );
  } catch {}
}


type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  loginCode: string;
  active: boolean;
  archived: boolean;
  points: number;
  streakDays: number;

  accountActivated: boolean;
  loginCount: number;
  firstLoginAt: Date | null;
  lastLoginAt: Date | null;
};

type FamilyProfile = {
  studentId: string;
  studentName: string;

  guardianRelation: string;
  homeFollower: string;
  homeReadingFrequency: string;
  learningEnvironment: string;

  strengths: string;
  interests: string;
  supportNeeds: string;

  readingLevel: string;
  writingLevel: string;

  motivation: string;
  preferredLearning: string;

  healthStatus: string;
  healthDetails: string;

  familyNotes: string;
  photoConsent: string;
};

export default function StudentsPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [profiles, setProfiles] =
    useState<Record<string, FamilyProfile>>({});

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

    const [showAddStudent, setShowAddStudent] =
  useState(false);

  const [newStudentName, setNewStudentName] =
  useState("");

const [newStudentClassroom, setNewStudentClassroom] =
  useState("الثاني أ");

const [newLoginCode, setNewLoginCode] =
  useState("");

const [savingStudent, setSavingStudent] =
  useState(false);

const [editingStudent, setEditingStudent] =
  useState<Student | null>(null);

const [editStudentName, setEditStudentName] =
  useState("");

const [editStudentClassroom, setEditStudentClassroom] =
  useState("الثاني أ");

const [editLoginCode, setEditLoginCode] =
  useState("");

const [savingEdit, setSavingEdit] =
  useState(false);

const [showArchivedStudents, setShowArchivedStudents] =
  useState(false);

const [restoringStudentId, setRestoringStudentId] =
  useState<string | null>(null);
  
  const [classFilter, setClassFilter] =
    useState("الكل");

  const [loginFilter, setLoginFilter] =
    useState<
      "all" | "never" | "today" | "previous" | "followup"
    >("all");

 async function fetchStudentsData(
  forceRefresh = false
) {
  if (!forceRefresh) {
    try {
      const raw = sessionStorage.getItem(
        STUDENTS_PAGE_CACHE_KEY
      );

      if (raw) {
        const cached = JSON.parse(
          raw
        ) as StudentsPageCache;

        if (
          Date.now() - cached.cachedAt <
          STUDENTS_PAGE_CACHE_MS
        ) {
          const cachedStudents =
            (cached.students || []).map(
              (student) => ({
                ...student,
                firstLoginAt:
                  typeof student.firstLoginAt ===
                  "number"
                    ? new Date(
                        student.firstLoginAt
                      )
                    : null,
                lastLoginAt:
                  typeof student.lastLoginAt ===
                  "number"
                    ? new Date(
                        student.lastLoginAt
                      )
                    : null,
              })
            ) as Student[];

          return {
            loadedStudents:
              cachedStudents,
            loadedProfiles:
              cached.profiles || {},
          };
        }
      }
    } catch {
      // إذا فشل الكاش نكمل القراءة من Firestore.
    }
  }
  const [
    studentsSnapshot,
    profilesSnapshot,
  ] = await Promise.all([
    getDocs(
      collection(
        db,
        "students"
      )
    ),
    getDocs(
      collection(
        db,
        "studentCaseStudies"
      )
    ),
  ]);

  const loadedStudents =
    studentsSnapshot.docs.map(
      (studentDoc) => {
        const data =
          studentDoc.data();

        return {
          id: studentDoc.id,

          studentId: String(
            data.studentId ??
              studentDoc.id
          ),

          studentName: String(
            data.studentName ??
              data.name ??
              "طالب دون اسم"
          ),

          classroom: String(
            data.classroom ??
              "غير محدد"
          ),
         loginCode: String(
  data.loginCode ?? ""
),

archived:
  data.archived === true,
          active:
            data.active !== false &&
            data.archived !== true,

          points: Number(
            data.points ?? 0
          ),

          streakDays: Number(
            data.streakDays ?? 0
          ),

          accountActivated:
            data.accountActivated === true,

          loginCount:
            typeof data.loginCount === "number"
              ? data.loginCount
              : 0,

          firstLoginAt:
            data.firstLoginAt?.toDate
              ? data.firstLoginAt.toDate()
              : null,

          lastLoginAt:
            data.lastLoginAt?.toDate
              ? data.lastLoginAt.toDate()
              : null,
        };
      }
    );

  loadedStudents.sort(
    (a, b) =>
      a.studentName.localeCompare(
        b.studentName,
        "ar"
      )
  );

  const loadedProfiles: Record<
    string,
    FamilyProfile
  > = {};

  profilesSnapshot.docs.forEach(
    (profileDoc) => {
      const data =
        profileDoc.data();

      const profileStudentId =
        String(
          data.studentId ??
            profileDoc.id
        );

      loadedProfiles[
        profileStudentId
      ] = {
        studentId:
          profileStudentId,

        studentName: String(
          data.studentName ?? ""
        ),

        guardianRelation:
          String(
            data.guardianRelation ??
              ""
          ),

        homeFollower: String(
          data.homeFollower ?? ""
        ),

        homeReadingFrequency:
          String(
            data.homeReadingFrequency ??
              ""
          ),

        learningEnvironment:
          String(
            data.learningEnvironment ??
              ""
          ),

        strengths: String(
          data.strengths ?? ""
        ),

        interests: String(
          data.interests ?? ""
        ),

        supportNeeds: String(
          data.supportNeeds ?? ""
        ),

        readingLevel: String(
          data.readingLevel ?? ""
        ),

        writingLevel: String(
          data.writingLevel ?? ""
        ),

        motivation: String(
          data.motivation ?? ""
        ),

        preferredLearning:
          String(
            data.preferredLearning ??
              ""
          ),

        healthStatus: String(
          data.healthStatus ?? ""
        ),

        healthDetails: String(
          data.healthDetails ?? ""
        ),

        familyNotes: String(
          data.familyNotes ?? ""
        ),

        photoConsent: String(
          data.photoConsent ?? ""
        ),
      };
    }
  );

  try {
    sessionStorage.setItem(
      STUDENTS_PAGE_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        students: loadedStudents.map(
          (student) => ({
            ...student,
            firstLoginAt:
              student.firstLoginAt?.getTime() ??
              null,
            lastLoginAt:
              student.lastLoginAt?.getTime() ??
              null,
          })
        ),
        profiles: loadedProfiles,
      })
    );
  } catch {
    // التخزين المؤقت اختياري.
  }

  return {
    loadedStudents,
    loadedProfiles,
  };
}

async function loadStudents(forceRefresh = false) {
  try {
    setLoading(true);
    setMessage("");

    const {
      loadedStudents,
      loadedProfiles,
    } =
      await fetchStudentsData(forceRefresh);

    setStudents(
      loadedStudents
    );

    setProfiles(
      loadedProfiles
    );
  } catch (error) {
    console.error(error);

    setMessage(
      "❌ تعذر تحميل بيانات الطلاب."
    );
  } finally {
    setLoading(false);
  }
}


async function handleAddStudent() {
  const cleanName =
    newStudentName.trim();

  const cleanLoginCode =
    newLoginCode.trim();

  if (!cleanName) {
    setMessage(
      "❌ اكتب اسم الطالب كاملًا."
    );
    return;
  }

  if (!/^\d{4}$/.test(cleanLoginCode)) {
    setMessage(
      "❌ رقم الدخول يجب أن يكون آخر 4 أرقام من السجل المدني أو الإقامة."
    );
    return;
  }

  const loginCodeExists =
    students.some(
      (student) =>
        student.loginCode === cleanLoginCode
    );

  if (loginCodeExists) {
    setMessage(
      "❌ رقم الدخول مستخدم لطالب آخر."
    );
    return;
  }

  const largestStudentNumber =
    students.reduce(
      (largest, student) => {
        const match =
          student.studentId.match(
            /^student-(\d+)$/
          );

        if (!match) {
          return largest;
        }

        return Math.max(
          largest,
          Number(match[1])
        );
      },
      0
    );

  const nextStudentId =
    `student-${String(
      largestStudentNumber + 1
    ).padStart(3, "0")}`;

  try {
    setSavingStudent(true);
    setMessage("");

    await setDoc(
      doc(
        db,
        "students",
        nextStudentId
      ),
      {
        studentId:
          nextStudentId,
        studentName:
          cleanName,
        classroom:
          newStudentClassroom,
        loginCode:
          cleanLoginCode,

        active: true,
        archived: false,
        temporary: false,

        points: 0,
        stars: 0,
        streakDays: 0,

        badges: [],
        attendanceHistory: [],
        dailyTaskRewardKeys: [],
        pointsHistory: [],
        readingHistory: [],
        spellingHistory: [],

        journey: {
          currentLevel: 1,
          currentPath: "",
          lastActivityAt: null,
          lastCompletedDate: "",
          streak: 0,
          xp: 0,
        },

        selectedAvatar:
          "boy-1",
        selectedAvatarIcon:
          "👦🏻",
        selectedAvatarName:
          "الفارس الصغير",

        teacherMessage: "",
        teacherMessageUpdatedAt:
          null,

        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      }
    );

    setNewStudentName("");
    setNewStudentClassroom(
      "الثاني أ"
    );
    setNewLoginCode("");
    setShowAddStudent(false);

    setMessage(
      `✅ تمت إضافة ${cleanName} بنجاح.`
    );

    clearStudentsPageCache();
    await loadStudents(true);
  } catch (error) {
    console.error(
      "تعذر إضافة الطالب:",
      error
    );

    setMessage(
      "❌ تعذر إضافة الطالب."
    );
  } finally {
    setSavingStudent(false);
  }
}

function openEditStudent(
  student: Student
) {
  setEditingStudent(student);
  setEditStudentName(
    student.studentName
  );
  setEditStudentClassroom(
    student.classroom
  );
  setEditLoginCode(
    student.loginCode
  );
  setMessage("");
}

async function handleSaveStudentEdit() {
  if (!editingStudent) {
    return;
  }

  const cleanName =
    editStudentName.trim();

  const cleanLoginCode =
    editLoginCode.trim();

  if (!cleanName) {
    setMessage(
      "❌ اكتب اسم الطالب كاملًا."
    );
    return;
  }

  if (!/^\d{4}$/.test(cleanLoginCode)) {
    setMessage(
      "❌ رقم الدخول يجب أن يتكون من 4 أرقام."
    );
    return;
  }

  const duplicateLoginCode =
    students.some(
      (student) =>
        student.id !==
          editingStudent.id &&
        student.loginCode ===
          cleanLoginCode
    );

  if (duplicateLoginCode) {
    setMessage(
      "❌ رقم الدخول مستخدم لطالب آخر."
    );
    return;
  }

  try {
    setSavingEdit(true);
    setMessage("");

    await updateDoc(
      doc(
        db,
        "students",
        editingStudent.id
      ),
      {
        studentName:
          cleanName,
        classroom:
          editStudentClassroom,
        loginCode:
          cleanLoginCode,
        updatedAt:
          serverTimestamp(),
      }
    );

    setEditingStudent(null);

    setMessage(
      `✅ تم تحديث بيانات ${cleanName} بنجاح.`
    );

    clearStudentsPageCache();
    await loadStudents(true);
  } catch (error) {
    console.error(
      "تعذر تعديل الطالب:",
      error
    );

    setMessage(
      "❌ تعذر حفظ تعديلات الطالب."
    );
  } finally {
    setSavingEdit(false);
  }
}

async function handleMoveStudent(
  student: Student
) {
  const targetClassroom =
    student.classroom === "الثاني أ"
      ? "الثاني ب"
      : "الثاني أ";

  const confirmed =
    window.confirm(
      `هل تريد نقل الطالب:\n${student.studentName}\n\nمن ${student.classroom} إلى ${targetClassroom}؟`
    );

  if (!confirmed) {
    return;
  }

  try {
    setMessage("");

    await updateDoc(
      doc(
        db,
        "students",
        student.id
      ),
      {
        classroom:
          targetClassroom,
        updatedAt:
          serverTimestamp(),
      }
    );

    setMessage(
      `✅ تم نقل ${student.studentName} إلى ${targetClassroom} بنجاح.`
    );

    clearStudentsPageCache();
    await loadStudents(true);
  } catch (error) {
    console.error(
      "تعذر نقل الطالب:",
      error
    );

    setMessage(
      "❌ تعذر نقل الطالب. حاول مرة أخرى."
    );
  }
}

async function handleArchiveStudent(
  student: Student
) {
  const confirmed =
    window.confirm(
      `هل تريد أرشفة الطالب:\n${student.studentName}؟\n\nسيختفي من قائمة الطلاب، ولكن لن تُحذف بياناته ويمكن استعادته لاحقًا.`
    );

  if (!confirmed) {
    return;
  }

  try {
    setMessage("");

    await updateDoc(
      doc(
        db,
        "students",
        student.id
      ),
      {
        active: false,
        archived: true,
        archivedAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      }
    );

    setMessage(
      `✅ تمت أرشفة ${student.studentName} بأمان.`
    );

    clearStudentsPageCache();
    await loadStudents(true);
  } catch (error) {
    console.error(
      "تعذر أرشفة الطالب:",
      error
    );

    setMessage(
      "❌ تعذر أرشفة الطالب. حاول مرة أخرى."
    );
  }
}

async function handleRestoreStudent(
  student: Student
) {
  const confirmed =
    window.confirm(
      `هل تريد استعادة الطالب:\n${student.studentName}؟\n\nسيعود إلى قائمة الطلاب النشطين مع الاحتفاظ بجميع بياناته وسجلاته السابقة.`
    );

  if (!confirmed) {
    return;
  }

  try {
    setRestoringStudentId(student.id);
    setMessage("");

    await updateDoc(
      doc(
        db,
        "students",
        student.id
      ),
      {
        active: true,
        archived: false,
        archivedAt: null,
        restoredAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      }
    );

    setMessage(
      `✅ تمت استعادة ${student.studentName} بنجاح.`
    );

    clearStudentsPageCache();
    await loadStudents(true);
  } catch (error) {
    console.error(
      "تعذر استعادة الطالب:",
      error
    );

    setMessage(
      "❌ تعذر استعادة الطالب. حاول مرة أخرى."
    );
  } finally {
    setRestoringStudentId(null);
  }
}

useEffect(() => {
  let active = true;

  async function loadInitialStudents() {
    try {
      const {
        loadedStudents,
        loadedProfiles,
      } =
        await fetchStudentsData();

      if (!active) {
        return;
      }

      setStudents(
        loadedStudents
      );

      setProfiles(
        loadedProfiles
      );
    } catch (error) {
      console.error(error);

      if (active) {
        setMessage(
          "❌ تعذر تحميل بيانات الطلاب."
        );
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void loadInitialStudents();

  return () => {
    active = false;
  };
}, []);

  const activeStudents =
    students.filter(
      (student) => student.active
    );

  const archivedStudents =
    students.filter(
      (student) => student.archived
    );

  const classrooms =
    useMemo(() => {
      return Array.from(
        new Set(
          activeStudents
            .map(
              (student) =>
                student.classroom
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b, "ar")
      );
    }, [activeStudents]);

  const todayInRiyadh =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(new Date());

  const FOLLOW_UP_DAYS = 3;

  const followUpThreshold =
    Date.now() -
    FOLLOW_UP_DAYS *
      24 *
      60 *
      60 *
      1000;

  const needsFollowUp = (
    student: Student
  ) =>
    student.accountActivated &&
    student.loginCount > 0 &&
    Boolean(student.lastLoginAt) &&
    (student.lastLoginAt?.getTime() ?? 0) <
      followUpThreshold;

  const needsFollowUpCount =
    activeStudents.filter(
      needsFollowUp
    ).length;

  const activatedStudentsCount =
    activeStudents.filter(
      (student) =>
        student.accountActivated
    ).length;

  const neverLoggedInCount =
    activeStudents.filter(
      (student) =>
        !student.accountActivated ||
        student.loginCount === 0
    ).length;

  const loggedInTodayCount =
    activeStudents.filter(
      (student) => {
        if (!student.lastLoginAt) {
          return false;
        }

        const loginDay =
          new Intl.DateTimeFormat(
            "en-CA",
            {
              timeZone:
                "Asia/Riyadh",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ).format(
            student.lastLoginAt
          );

        return (
          loginDay === todayInRiyadh
        );
      }
    ).length;

  const visibleStudents =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return activeStudents.filter(
        (student) => {
          const matchesSearch =
            search === "" ||
            student.studentName
              .toLowerCase()
              .includes(search) ||
            student.studentId
              .toLowerCase()
              .includes(search);

          const matchesClass =
            classFilter ===
              "الكل" ||
            student.classroom ===
              classFilter;

          const matchesLoginStatus =
            (() => {
              if (
                loginFilter === "all"
              ) {
                return true;
              }

              if (
                loginFilter === "never"
              ) {
                return (
                  !student.accountActivated ||
                  student.loginCount === 0
                );
              }

              if (
                loginFilter ===
                "followup"
              ) {
                return (
                  student.accountActivated &&
                  student.loginCount > 0 &&
                  Boolean(
                    student.lastLoginAt
                  ) &&
                  (student.lastLoginAt?.getTime() ??
                    0) <
                    followUpThreshold
                );
              }

              if (
                !student.lastLoginAt
              ) {
                return false;
              }

              const loginDay =
                new Intl.DateTimeFormat(
                  "en-CA",
                  {
                    timeZone:
                      "Asia/Riyadh",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }
                ).format(
                  student.lastLoginAt
                );

              if (
                loginFilter === "today"
              ) {
                return (
                  loginDay ===
                  todayInRiyadh
                );
              }

              if (
                loginFilter ===
                "previous"
              ) {
                return (
                  student.accountActivated &&
                  loginDay !==
                    todayInRiyadh
                );
              }

              return true;
            })();

          return (
            matchesSearch &&
            matchesClass &&
            matchesLoginStatus
          );
        }
      );
    }, [
      activeStudents,
      searchText,
      classFilter,
      loginFilter,
      todayInRiyadh,
      followUpThreshold,
    ]);

  const totalPoints =
    activeStudents.reduce(
      (total, student) =>
        total + student.points,
      0
    );

  const completedProfiles =
    activeStudents.filter(
      (student) =>
        Boolean(
          profiles[
            student.studentId
          ]
        )
    ).length;

  const selectedProfile =
    selectedStudent
      ? profiles[
          selectedStudent.studentId
        ]
      : undefined;

  return (
    <main
      dir="rtl"
      style={styles.page}
    >
     <section style={styles.header}>
  <div>
    <p style={styles.eyebrow}>
      أكاديمية لغتي الرقمية
    </p>

    <h1 style={styles.title}>
      👨‍🎓 إدارة الطلاب
    </h1>

    <p style={styles.subtitle}>
      متابعة الطلاب والفصول
      والنقاط وملفات الطالب
      والأسرة.
    </p>
  </div>

  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      onClick={() =>
        setShowArchivedStudents(true)
      }
      style={{
        ...styles.refreshButton,
        background: "#f1f5f9",
        color: "#475569",
      }}
    >
      📦 الطلاب المؤرشفون ({archivedStudents.length})
    </button>

    <button
      type="button"
      onClick={() =>
        setShowAddStudent(true)
      }
      style={{
        ...styles.refreshButton,
        background: "#fef3c7",
        color: "#92400e",
      }}
    >
      ➕ إضافة طالب
    </button>

    <button
      type="button"
      onClick={() =>
        void loadStudents(true)
      }
      style={styles.refreshButton}
    >
      🔄 تحديث
    </button>
  </div>
</section>

      <section
        style={styles.statsGrid}
      >
        <StatCard
          icon="👨‍🎓"
          title="عدد الطلاب"
          value={
            activeStudents.length
          }
        />

        <StatCard
          icon="🏫"
          title="عدد الفصول"
          value={
            new Set(
              activeStudents.map(
                (student) =>
                  student.classroom
              )
            ).size
          }
        />

        <StatCard
          icon="⭐"
          title="إجمالي النقاط"
          value={totalPoints}
        />

        <StatCard
          icon="👨‍👩‍👦"
          title="ملفات الأسرة المكتملة"
          value={
            completedProfiles
          }
        />

        <StatCard
          icon="✅"
          title="فعّلوا الحساب"
          value={
            activatedStudentsCount
          }
        />

        <StatCard
          icon="⏳"
          title="لم يدخلوا بعد"
          value={
            neverLoggedInCount
          }
        />

        <StatCard
          icon="🟢"
          title="دخلوا اليوم"
          value={
            loggedInTodayCount
          }
        />

        <StatCard
          icon="🟠"
          title="يحتاجون متابعة"
          value={
            needsFollowUpCount
          }
        />
      </section>

      <section
        style={styles.tools}
      >
        <input
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
          placeholder="ابحث باسم الطالب أو رقمه"
          style={styles.input}
        />

        <select
          value={classFilter}
          onChange={(event) =>
            setClassFilter(
              event.target.value
            )
          }
          style={styles.select}
        >
          <option value="الكل">
            جميع الفصول
          </option>

          {classrooms.map(
            (classroom) => (
              <option
                key={classroom}
                value={classroom}
              >
                {classroom}
              </option>
            )
          )}
        </select>

        <select
          value={loginFilter}
          onChange={(event) =>
            setLoginFilter(
              event.target.value as
                | "all"
                | "never"
                | "today"
                | "previous"
                | "followup"
            )
          }
          style={styles.select}
        >
          <option value="all">
            جميع حالات الدخول
          </option>

          <option value="never">
            ⏳ لم يدخلوا بعد
          </option>

          <option value="today">
            🟢 دخلوا اليوم
          </option>

          <option value="previous">
            🔵 دخلوا سابقًا
          </option>

          <option value="followup">
            🟠 يحتاجون متابعة
          </option>
        </select>
      </section>

      {message && (
        <div
          style={styles.message}
        >
          {message}
        </div>
      )}

      <section
        style={styles.card}
      >
        <h2
          style={styles.cardTitle}
        >
          قائمة الطلاب
        </h2>

        {loading ? (
          <div
            style={styles.empty}
          >
            ⏳ جارٍ تحميل الطلاب...
          </div>
        ) : visibleStudents.length ===
          0 ? (
          <div
            style={styles.empty}
          >
            لا توجد نتائج.
          </div>
        ) : (
          <div
            style={styles.list}
          >
            {visibleStudents.map(
              (student) => {
                const hasProfile =
                  Boolean(
                    profiles[
                      student
                        .studentId
                    ]
                  );

                const isLoggedInToday =
                  (() => {
                    if (
                      !student.lastLoginAt
                    ) {
                      return false;
                    }

                    const loginDay =
                      new Intl.DateTimeFormat(
                        "en-CA",
                        {
                          timeZone:
                            "Asia/Riyadh",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      ).format(
                        student.lastLoginAt
                      );

                    return (
                      loginDay ===
                      todayInRiyadh
                    );
                  })();

                const studentNeedsFollowUp =
                  student.accountActivated &&
                  student.loginCount > 0 &&
                  Boolean(
                    student.lastLoginAt
                  ) &&
                  (student.lastLoginAt?.getTime() ??
                    0) <
                    followUpThreshold;

                const loginStatus =
                  !student.accountActivated ||
                  student.loginCount === 0
                    ? {
                        label:
                          "لم يدخل بعد",
                        icon: "⏳",
                        background:
                          "#fff7ed",
                        color:
                          "#9a3412",
                        border:
                          "#fed7aa",
                      }
                    : studentNeedsFollowUp
                      ? {
                          label:
                            "يحتاج متابعة",
                          icon: "🟠",
                          background:
                            "#fff7ed",
                          color:
                            "#c2410c",
                          border:
                            "#fdba74",
                        }
                    : isLoggedInToday
                      ? {
                          label:
                            "دخل اليوم",
                          icon: "🟢",
                          background:
                            "#ecfdf5",
                          color:
                            "#166534",
                          border:
                            "#86efac",
                        }
                      : {
                          label:
                            "دخل سابقًا",
                          icon: "🔵",
                          background:
                            "#eff6ff",
                          color:
                            "#1d4ed8",
                          border:
                            "#93c5fd",
                        };

                return (
                  <article
                    key={student.id}
                    style={
                      styles.studentCard
                    }
                  >
                    <div
                      style={
                        styles.studentMain
                      }
                    >
                      <div
                        style={
                          styles.avatar
                        }
                      >
                        {student.studentName.charAt(
                          0
                        )}
                      </div>

                      <div>
                        <a
                          href={`/teacher/students/${student.id}`}
                          style={
                            styles.studentLink
                          }
                        >
                          {
                            student.studentName
                          }
                        </a>

                        <p
                          style={
                            styles.studentMeta
                          }
                        >
                          {
                            student.classroom
                          }{" "}
                          •{" "}
                          {
                            student.studentId
                          }
                        </p>
                      </div>
                    </div>

                    <div
                      style={
                        styles.studentActions
                      }
                    >
                      <div
                        style={
                          styles.details
                        }
                      >
                        <span
                          style={{
                            padding:
                              "7px 10px",
                            borderRadius:
                              "999px",
                            background:
                              loginStatus.background,
                            color:
                              loginStatus.color,
                            border:
                              `1px solid ${loginStatus.border}`,
                            fontWeight: 900,
                            fontSize: "13px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {loginStatus.icon}{" "}
                          {loginStatus.label}
                        </span>

                        <span>
                          🔐{" "}
                          {student.loginCount}{" "}
                          دخول
                        </span>

                        <span>
                          🕒{" "}
                          {student.lastLoginAt
                            ? student.lastLoginAt.toLocaleString(
                                "ar-SA",
                                {
                                  timeZone:
                                    "Asia/Riyadh",
                                  dateStyle:
                                    "short",
                                  timeStyle:
                                    "short",
                                }
                              )
                            : "لا يوجد دخول"}
                        </span>

                        <span>
                          🔥{" "}
                          {
                            student.streakDays
                          }{" "}
                          أيام
                        </span>

                        <span>
                          ⭐{" "}
                          {
                            student.points
                          }{" "}
                          نقطة
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStudent(
                            student
                          )
                        }
                        style={{
                          ...styles.profileButton,
                          background:
                            hasProfile
                              ? "#ecfdf5"
                              : "#f8fafc",
                          color:
                            hasProfile
                              ? "#166534"
                              : "#64748b",
                          borderColor:
                            hasProfile
                              ? "#86efac"
                              : "#cbd5e1",
                        }}
                      >
                        {hasProfile
                          ? "👨‍👩‍👦 ملف الطالب والأسرة"
                          : "⏳ لم تعبئ الأسرة الملف"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditStudent(
                            student
                          )
                        }
                        style={{
                          ...styles.profileButton,
                          background:
                            "#eff6ff",
                          color:
                            "#1d4ed8",
                          borderColor:
                            "#93c5fd",
                        }}
                      >
                        ✏️ تعديل
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleMoveStudent(
                            student
                          )
                        }
                        style={{
                          ...styles.profileButton,
                          background:
                            "#fff7ed",
                          color:
                            "#c2410c",
                          borderColor:
                            "#fdba74",
                        }}
                      >
                        🔄 نقل
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleArchiveStudent(
                            student
                          )
                        }
                        style={{
                          ...styles.profileButton,
                          background:
                            "#fef2f2",
                          color:
                            "#b91c1c",
                          borderColor:
                            "#fca5a5",
                        }}
                      >
                        📦 أرشفة
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
        
      </section>
      {showArchivedStudents && (
        <div
          style={styles.modalOverlay}
          onClick={() =>
            setShowArchivedStudents(false)
          }
        >
          <div
            style={{
              ...styles.modal,
              maxWidth: "850px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalEyebrow}>
                  👨‍🎓 إدارة الطلاب
                </p>
                <h2 style={styles.modalTitle}>
                  📦 الطلاب المؤرشفون
                </h2>
                <p style={styles.modalMeta}>
                  {archivedStudents.length} طالب مؤرشف
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowArchivedStudents(false)
                }
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            {archivedStudents.length === 0 ? (
              <div style={styles.empty}>
                لا يوجد طلاب مؤرشفون حاليًا.
              </div>
            ) : (
              <div
                style={{
                  ...styles.list,
                  background: "#ffffff",
                }}
              >
                {archivedStudents.map(
                  (student) => (
                    <article
                      key={student.id}
                      style={styles.studentCard}
                    >
                      <div style={styles.studentMain}>
                        <div
                          style={{
                            ...styles.avatar,
                            background: "#64748b",
                          }}
                        >
                          {student.studentName.charAt(0)}
                        </div>

                        <div>
                          <strong
                            style={{
                              color: "#163b32",
                              fontSize: "17px",
                            }}
                          >
                            {student.studentName}
                          </strong>

                          <p style={styles.studentMeta}>
                            {student.classroom} •{" "}
                            {student.studentId}
                          </p>
                        </div>
                      </div>

                      <div style={styles.studentActions}>
                        <div style={styles.details}>
                          <span>
                            🔥 {student.streakDays} أيام
                          </span>
                          <span>
                            ⭐ {student.points} نقطة
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleRestoreStudent(
                              student
                            )
                          }
                          disabled={
                            restoringStudentId === student.id
                          }
                          style={{
                            ...styles.profileButton,
                            background: "#ecfdf5",
                            color: "#166534",
                            borderColor: "#86efac",
                            opacity:
                              restoringStudentId === student.id
                                ? 0.65
                                : 1,
                            cursor:
                              restoringStudentId === student.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {restoringStudentId === student.id
                            ? "⏳ جارٍ الاستعادة..."
                            : "♻️ استعادة الطالب"}
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editingStudent && (
        <div
          style={styles.modalOverlay}
          onClick={() =>
            setEditingStudent(null)
          }
        >
          <div
            style={{
              ...styles.modal,
              maxWidth: "520px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={styles.modalHeader}
            >
              <div>
                <p
                  style={
                    styles.modalEyebrow
                  }
                >
                  👨‍🎓 إدارة الطلاب
                </p>

                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  ✏️ تعديل بيانات الطالب
                </h2>

                <p
                  style={
                    styles.modalMeta
                  }
                >
                  {
                    editingStudent.studentId
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingStudent(null)
                }
                style={
                  styles.closeButton
                }
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                display: "grid",
                gap: "16px",
              }}
            >
              <label>
                <strong>
                  اسم الطالب الكامل
                </strong>

                <input
                  value={
                    editStudentName
                  }
                  onChange={(event) =>
                    setEditStudentName(
                      event.target.value
                    )
                  }
                  style={{
                    ...styles.input,
                    width: "100%",
                    marginTop: "8px",
                    boxSizing:
                      "border-box",
                  }}
                />
              </label>

              <label>
                <strong>
                  الفصل
                </strong>

                <select
                  value={
                    editStudentClassroom
                  }
                  onChange={(event) =>
                    setEditStudentClassroom(
                      event.target.value
                    )
                  }
                  style={{
                    ...styles.select,
                    width: "100%",
                    marginTop: "8px",
                  }}
                >
                  <option value="الثاني أ">
                    الثاني أ
                  </option>

                  <option value="الثاني ب">
                    الثاني ب
                  </option>
                </select>
              </label>

              <label>
                <strong>
                  رقم الدخول
                </strong>

                <input
                  value={
                    editLoginCode
                  }
                  onChange={(event) =>
                    setEditLoginCode(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 4)
                    )
                  }
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="آخر 4 أرقام"
                  style={{
                    ...styles.input,
                    width: "100%",
                    marginTop: "8px",
                    boxSizing:
                      "border-box",
                  }}
                />

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#64748b",
                  }}
                >
                  تغيير رقم الدخول لا
                  يغيّر رقم الطالب أو
                  سجلاته السابقة.
                </small>
              </label>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                🔒 رقم الطالب الداخلي:{" "}
                <strong>
                  {
                    editingStudent.studentId
                  }
                </strong>{" "}
                لن يتغير.
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSaveStudentEdit()
                }
                disabled={
                  savingEdit
                }
                style={{
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px",
                  background: "#166534",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 900,
                  cursor:
                    savingEdit
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    savingEdit
                      ? 0.65
                      : 1,
                }}
              >
                {savingEdit
                  ? "جارٍ حفظ التعديلات... ⏳"
                  : "✅ حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddStudent && (
  <div
    style={styles.modalOverlay}
    onClick={() =>
      setShowAddStudent(false)
    }
  >
    <div
      style={{
        ...styles.modal,
        maxWidth: "520px",
      }}
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div
        style={styles.modalHeader}
      >
        <div>
          <p
            style={
              styles.modalEyebrow
            }
          >
            👨‍🎓 إدارة الطلاب
          </p>

          <h2
            style={
              styles.modalTitle
            }
          >
            ➕ إضافة طالب جديد
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowAddStudent(false)
          }
          style={
            styles.closeButton
          }
        >
          ✕
        </button>
      </div>

      <div
        style={{
          padding: "20px",
          display: "grid",
          gap: "16px",
        }}
      >
        <label>
          <strong>
            اسم الطالب الكامل
          </strong>

          <input
            value={
              newStudentName
            }
            onChange={(event) =>
              setNewStudentName(
                event.target.value
              )
            }
            placeholder="اكتب الاسم كاملًا"
            style={{
              ...styles.input,
              width: "100%",
              marginTop: "8px",
              boxSizing:
                "border-box",
            }}
          />
        </label>

        <label>
          <strong>
            الفصل
          </strong>

          <select
            value={
              newStudentClassroom
            }
            onChange={(event) =>
              setNewStudentClassroom(
                event.target.value
              )
            }
            style={{
              ...styles.select,
              width: "100%",
              marginTop: "8px",
            }}
          >
            <option value="الثاني أ">
              الثاني أ
            </option>

            <option value="الثاني ب">
              الثاني ب
            </option>
          </select>
        </label>

        <label>
          <strong>
            رقم الدخول
          </strong>

          <input
            value={
              newLoginCode
            }
            onChange={(event) =>
              setNewLoginCode(
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(0, 4)
              )
            }
            inputMode="numeric"
            placeholder="آخر 4 أرقام"
            maxLength={4}
            style={{
              ...styles.input,
              width: "100%",
              marginTop: "8px",
              boxSizing:
                "border-box",
            }}
          />

          <small
            style={{
              display: "block",
              marginTop: "6px",
              color: "#64748b",
            }}
          >
            آخر أربعة أرقام من
            السجل المدني أو الإقامة.
          </small>
        </label>

        <button
          type="button"
          onClick={() =>
            void handleAddStudent()
          }
          disabled={
            savingStudent
          }
          style={{
            border: "none",
            borderRadius: "14px",
            padding: "14px",
            background: "#166534",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 900,
            cursor:
              savingStudent
                ? "not-allowed"
                : "pointer",
            opacity:
              savingStudent
                ? 0.65
                : 1,
          }}
        >
          {savingStudent
            ? "جارٍ إضافة الطالب... ⏳"
            : "✅ حفظ الطالب"}
        </button>
      </div>
    </div>
  </div>
)}
      {selectedStudent && (
        <div
          style={
            styles.modalOverlay
          }
          onClick={() =>
            setSelectedStudent(null)
          }
        >
          <div
            style={styles.modal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={
                styles.modalHeader
              }
            >
              <div>
                <p
                  style={
                    styles.modalEyebrow
                  }
                >
                  👨‍👩‍👦 ملف الطالب
                  والأسرة
                </p>

                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    selectedStudent.studentName
                  }
                </h2>

                <p
                  style={
                    styles.modalMeta
                  }
                >
                  {
                    selectedStudent.classroom
                  }{" "}
                  •{" "}
                  {
                    selectedStudent.studentId
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(
                    null
                  )
                }
                style={
                  styles.closeButton
                }
              >
                ✕
              </button>
            </div>

            {!selectedProfile ? (
              <div
                style={
                  styles.noProfile
                }
              >
                <div
                  style={{
                    fontSize:
                      "48px",
                  }}
                >
                  📋
                </div>

                <h3>
                  لم تعبئ الأسرة
                  الملف بعد
                </h3>

                <p>
                  سيظهر ملف الطالب
                  والأسرة هنا بمجرد
                  حفظه من صفحة ولي
                  الأمر.
                </p>
              </div>
            ) : (
              <div
                style={
                  styles.profileContent
                }
              >
                <ProfileSection
                  title="👨‍👩‍👦 الأسرة والمتابعة المنزلية"
                >
                  <InfoItem
                    label="صلة القرابة"
                    value={translateGuardian(
                      selectedProfile.guardianRelation
                    )}
                  />

                  <InfoItem
                    label="المتابع في المنزل"
                    value={translateFollower(
                      selectedProfile.homeFollower
                    )}
                  />

                  <InfoItem
                    label="القراءة المنزلية"
                    value={translateReadingFrequency(
                      selectedProfile.homeReadingFrequency
                    )}
                  />

                  <InfoItem
                    label="بيئة المذاكرة"
                    value={translateEnvironment(
                      selectedProfile.learningEnvironment
                    )}
                  />
                </ProfileSection>

                <ProfileSection
                  title="🌟 شخصية الطالب"
                >
                  <InfoItem
                    label="نقاط القوة"
                    value={
                      selectedProfile.strengths
                    }
                  />

                  <InfoItem
                    label="الاهتمامات"
                    value={
                      selectedProfile.interests
                    }
                  />

                  <InfoItem
                    label="ما يحتاج إلى دعم"
                    value={
                      selectedProfile.supportNeeds
                    }
                  />
                </ProfileSection>

                <ProfileSection
                  title="📚 القراءة والكتابة"
                >
                  <InfoItem
                    label="مستوى القراءة"
                    value={translateReadingLevel(
                      selectedProfile.readingLevel
                    )}
                  />

                  <InfoItem
                    label="مستوى الكتابة"
                    value={translateWritingLevel(
                      selectedProfile.writingLevel
                    )}
                  />
                </ProfileSection>

                <ProfileSection
                  title="🎯 التحفيز والتعلم"
                >
                  <InfoItem
                    label="ما يحفزه"
                    value={
                      selectedProfile.motivation
                    }
                  />

                  <InfoItem
                    label="الطريقة المفضلة للتعلم"
                    value={translateLearningStyle(
                      selectedProfile.preferredLearning
                    )}
                  />
                </ProfileSection>

                <ProfileSection
                  title="🩺 معلومات صحية"
                >
                  <InfoItem
                    label="هل توجد معلومات صحية؟"
                    value={translateYesNo(
                      selectedProfile.healthStatus
                    )}
                  />

                  {selectedProfile.healthStatus ===
                    "yes" && (
                    <InfoItem
                      label="التفاصيل"
                      value={
                        selectedProfile.healthDetails
                      }
                    />
                  )}
                </ProfileSection>

                <ProfileSection
                  title="💬 رسالة الأسرة"
                >
                  <InfoItem
                    label="ملاحظات الأسرة"
                    value={
                      selectedProfile.familyNotes
                    }
                  />
                </ProfileSection>

                <ProfileSection
                  title="📸 موافقة التصوير"
                >
                  <div
                    style={{
                      ...styles.consentBox,

                      background:
                        selectedProfile.photoConsent ===
                        "yes"
                          ? "#ecfdf5"
                          : "#fff7ed",

                      color:
                        selectedProfile.photoConsent ===
                        "yes"
                          ? "#166534"
                          : "#9a3412",

                      borderColor:
                        selectedProfile.photoConsent ===
                        "yes"
                          ? "#86efac"
                          : "#fdba74",
                    }}
                  >
                    {selectedProfile.photoConsent ===
                    "yes"
                      ? "✅ الأسرة موافقة على التصوير وعرض الصور في يوميات الفصل."
                      : selectedProfile.photoConsent ===
                        "no"
                      ? "🚫 الأسرة لا توافق على التصوير أو عرض الصور."
                      : "لم يتم تحديد الموافقة."}
                  </div>
                </ProfileSection>
              </div>
            )}
          </div>
        </div>
      )}
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
  value: number;
}) {
  return (
    <article
      style={styles.statCard}
    >
      <div
        style={styles.statIcon}
      >
        {icon}
      </div>

      <div>
        <p
          style={styles.statTitle}
        >
          {title}
        </p>

        <strong
          style={styles.statValue}
        >
          {value}
        </strong>
      </div>
    </article>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={
        styles.profileSection
      }
    >
      <h3
        style={
          styles.profileSectionTitle
        }
      >
        {title}
      </h3>

      <div
        style={
          styles.profileGrid
        }
      >
        {children}
      </div>
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={styles.infoItem}
    >
      <div
        style={styles.infoLabel}
      >
        {label}
      </div>

      <div
        style={styles.infoValue}
      >
        {value?.trim()
          ? value
          : "لم يذكر"}
      </div>
    </div>
  );
}

function translateGuardian(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    father: "الأب",
    mother: "الأم",
    brother:
      "الأخ / الأخت",
    guardian:
      "ولي أمر آخر",
  };

  return labels[value] ?? value;
}

function translateFollower(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    father: "الأب",
    mother: "الأم",
    both: "الأب والأم",
    other:
      "شخص آخر من الأسرة",
  };

  return labels[value] ?? value;
}

function translateReadingFrequency(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    daily: "يوميًا",
    often:
      "عدة مرات في الأسبوع",
    sometimes: "أحيانًا",
    rarely: "نادرًا",
  };

  return labels[value] ?? value;
}

function translateEnvironment(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    yes: "نعم",
    sometimes: "أحيانًا",
    no: "لا",
  };

  return labels[value] ?? value;
}

function translateReadingLevel(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    excellent:
      "يقرأ بطلاقة",
    good:
      "يقرأ جيدًا مع بعض التوقف",
    developing:
      "لا يزال يتدرب على القراءة",
    "needs-support":
      "يحتاج دعمًا واضحًا",
  };

  return labels[value] ?? value;
}

function translateWritingLevel(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    excellent:
      "يكتب بصورة جيدة ومستقلة",
    good:
      "يكتب جيدًا مع بعض الأخطاء",
    developing:
      "يحتاج مساعدة أحيانًا",
    "needs-support":
      "يحتاج دعمًا مستمرًا",
  };

  return labels[value] ?? value;
}

function translateLearningStyle(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    visual:
      "الصور والمشاهدة",
    audio:
      "الاستماع والشرح",
    practice:
      "التطبيق والممارسة",
    games:
      "الألعاب والمسابقات",
    mixed:
      "أكثر من طريقة",
  };

  return labels[value] ?? value;
}

function translateYesNo(
  value: string
) {
  if (value === "yes")
    return "نعم";

  if (value === "no")
    return "لا";

  return value;
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f8fafc",
    fontFamily:
      "Arial, sans-serif",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    padding: "24px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, #166534, #15803d)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#dcfce7",
    fontWeight: 700,
  },

  title: {
    margin: 0,
    fontSize: "34px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#ecfdf5",
  },

  refreshButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#166534",
    fontWeight: 800,
    cursor: "pointer",
  },

  statsGrid: {
    maxWidth: "1100px",
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },

  statCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow:
      "0 8px 24px rgba(15, 23, 42, 0.06)",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#ecfdf5",
    display: "grid",
    placeItems: "center",
    fontSize: "24px",
  },

  statTitle: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  statValue: {
    color: "#166534",
    fontSize: "26px",
  },

  tools: {
    maxWidth: "1100px",
    margin: "0 auto 16px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  input: {
    flex: "1 1 300px",
    padding: "13px 14px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "13px",
    fontSize: "15px",
  },

  select: {
    minWidth: "190px",
    padding: "13px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "13px",
    background: "#ffffff",
    fontSize: "15px",
  },

  message: {
    maxWidth: "1100px",
    margin: "0 auto 16px",
    padding: "13px",
    borderRadius: "12px",
    background: "#fef2f2",
    color: "#b91c1c",
  },

  card: {
    maxWidth: "1100px",
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.06)",
  },

  cardTitle: {
    margin: 0,
    padding: "20px",
    borderBottom:
      "1px solid #e2e8f0",
    color: "#163b32",
  },

  list: {
    display: "grid",
  },

  studentCard: {
    padding: "16px 20px",
    borderBottom:
      "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  studentMain: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#166534",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    fontWeight: 900,
  },

  studentLink: {
    color: "#163b32",
    fontSize: "17px",
    fontWeight: 800,
    textDecoration: "none",
  },

  studentMeta: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  studentActions: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },

  details: {
    display: "flex",
    gap: "16px",
    color: "#334155",
    fontWeight: 700,
    flexWrap: "wrap",
  },

  profileButton: {
    border: "1px solid",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  empty: {
    padding: "50px 20px",
    color: "#64748b",
    textAlign: "center",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background:
      "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  modal: {
    width: "100%",
    maxWidth: "850px",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: "24px",
    background: "#f8fafc",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    padding: "20px",
    background:
      "linear-gradient(135deg, #166534, #15803d)",
    color: "#ffffff",
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "20px",
  },

  modalEyebrow: {
    margin: "0 0 5px",
    color: "#dcfce7",
    fontWeight: 700,
  },

  modalTitle: {
    margin: 0,
    fontSize: "27px",
  },

  modalMeta: {
    margin: "7px 0 0",
    color: "#dcfce7",
  },

  closeButton: {
    width: "42px",
    height: "42px",
    border: "none",
    borderRadius: "12px",
    background:
      "rgba(255,255,255,0.17)",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
  },

  profileContent: {
    padding: "18px",
  },

  profileSection: {
    background: "#ffffff",
    border:
      "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px",
  },

  profileSectionTitle: {
    margin: "0 0 15px",
    color: "#166534",
    fontSize: "19px",
  },

  profileGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
  },

  infoItem: {
    background: "#f8fafc",
    borderRadius: "13px",
    padding: "13px",
  },

  infoLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "6px",
  },

  infoValue: {
    color: "#0f3d2f",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },

  consentBox: {
    gridColumn: "1 / -1",
    border: "1px solid",
    borderRadius: "14px",
    padding: "15px",
    fontWeight: 800,
    lineHeight: 1.7,
  },

  noProfile: {
    margin: "20px",
    padding: "45px 20px",
    background: "#ffffff",
    borderRadius: "18px",
    textAlign: "center",
    color: "#64748b",
  },
};