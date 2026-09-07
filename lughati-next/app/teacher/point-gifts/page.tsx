"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  auth,
} from "../../../firebase";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
};

type ClassroomsResponse = {
  success?: boolean;
  classrooms?: string[];
  message?: string;
};

type StudentsResponse = {
  success?: boolean;
  classroom?: string;
  students?: Student[];
  message?: string;
};

type GiftResponse = {
  success?: boolean;
  message?: string;
  newPoints?: number;
};

const QUICK_POINTS = [1, 3, 5, 10];

export default function PointGiftsPage() {
  const [classrooms, setClassrooms] =
    useState<string[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [selectedClass, setSelectedClass] =
    useState("");

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [points, setPoints] =
    useState(5);

  const [
    customPoints,
    setCustomPoints,
  ] = useState("");

  const [reason, setReason] =
    useState("");

  const [loadingClasses, setLoadingClasses] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isSuccess, setIsSuccess] =
    useState(false);

  useEffect(() => {
    async function loadClassrooms() {
      try {
        setLoadingClasses(true);
        setMessage("");
        setIsSuccess(false);

        const response = await fetch(
          "/api/students",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            ClassroomsResponse;

        if (
          !response.ok ||
          data.success !== true
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل الفصول."
          );
        }

        const loadedClassrooms =
          Array.isArray(data.classrooms)
            ? data.classrooms
            : [];

        setClassrooms(
          loadedClassrooms
        );

        /*
          بما أن عدد الطلاب في الأكاديمية صغير،
          نحمل طلاب كل فصل مرة واحدة عند فتح الصفحة
          من نفس API المعتمد في الأكاديمية.
        */
        const responses =
          await Promise.all(
            loadedClassrooms.map(
              async (classroom) => {
                const studentsResponse =
                  await fetch(
                    `/api/students?classroom=${encodeURIComponent(
                      classroom
                    )}`,
                    {
                      cache: "no-store",
                    }
                  );

                const studentsData =
                  (await studentsResponse.json()) as
                    StudentsResponse;

                if (
                  !studentsResponse.ok ||
                  studentsData.success !== true
                ) {
                  return [] as Student[];
                }

                return Array.isArray(
                  studentsData.students
                )
                  ? studentsData.students
                  : [];
              }
            )
          );

        const allStudents =
          responses
            .flat()
            .filter(
              (student) =>
                student.active !== false
            )
            .sort((first, second) =>
              first.studentName.localeCompare(
                second.studentName,
                "ar"
              )
            );

        setStudents(allStudents);

        if (
          loadedClassrooms.length === 0
        ) {
          setMessage(
            "لم يتم العثور على فصول نشطة."
          );
        } else if (
          allStudents.length === 0
        ) {
          setMessage(
            "تم العثور على الفصول، ولكن لم يتم تحميل أي طالب نشط."
          );
        }
      } catch (error) {
        console.error(
          "تعذر تحميل الطلاب:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "تعذر تحميل قائمة الطلاب."
        );
      } finally {
        setLoadingClasses(false);
      }
    }

    void loadClassrooms();
  }, []);

  const filteredStudents =
    useMemo(() => {
      if (!selectedClass) {
        return students;
      }

      return students.filter(
        (student) =>
          student.classroom ===
          selectedClass
      );
    }, [
      students,
      selectedClass,
    ]);

  const selectedStudent =
    students.find(
      (student) =>
        student.id ===
        selectedStudentId
    );

  const finalPoints =
    customPoints.trim()
      ? Number(customPoints)
      : points;

  const handleClassChange =
    async (
      classroom: string
    ) => {
      setSelectedClass(classroom);
      setSelectedStudentId("");
      setMessage("");
      setIsSuccess(false);

      /*
        الطلاب محمّلون مسبقًا،
        لذلك لا نحتاج قراءة جديدة هنا.
        نترك الحالة فقط للتوافق مع الواجهة.
      */
      setLoadingStudents(false);
    };

  const handleSendGift =
    async () => {
      setMessage("");
      setIsSuccess(false);

      if (!selectedStudent) {
        setMessage(
          "اختر الطالب أولًا."
        );
        return;
      }

      if (
        !Number.isFinite(
          finalPoints
        ) ||
        finalPoints <= 0 ||
        !Number.isInteger(
          finalPoints
        )
      ) {
        setMessage(
          "حدد عدد نقاط صحيحًا أكبر من صفر."
        );
        return;
      }

      if (
        finalPoints > 100
      ) {
        setMessage(
          "الحد الأعلى للهدية الواحدة هو 100 نقطة."
        );
        return;
      }

      if (!reason.trim()) {
        setMessage(
          "اكتب سبب إهداء النقاط."
        );
        return;
      }

      try {
        setSending(true);

        const currentUser =
          auth.currentUser;

        if (!currentUser) {
          throw new Error(
            "يجب تسجيل الدخول بحساب المعلم أولًا."
          );
        }

        const idToken =
          await currentUser.getIdToken();

        const response =
          await fetch(
            "/api/point-gifts",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                studentDocId:
                  selectedStudent.id,
                points:
                  finalPoints,
                reason:
                  reason.trim(),
              }),
            }
          );

        const data =
          (await response.json()) as
            GiftResponse;

        if (
          !response.ok ||
          data.success !== true
        ) {
          throw new Error(
            data.message ||
              "تعذر إرسال الهدية."
          );
        }

        setIsSuccess(true);

        setMessage(
          `🎁 تم إهداء ${finalPoints} نقطة إلى ${selectedStudent.studentName} بنجاح.`
        );

        setReason("");
        setCustomPoints("");
        setPoints(5);
      } catch (error) {
        console.error(
          "تعذر إرسال هدية النقاط:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إرسال الهدية."
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <main
      dir="rtl"
      style={styles.page}
    >
      <section style={styles.header}>
        <div>
          <p style={styles.label}>
            أكاديمية لغتي الرقمية
          </p>

          <h1 style={styles.title}>
            🎁 إهداء النقاط
          </h1>

          <p style={styles.subtitle}>
            أرسل هدية تحفيزية للطالب،
            وتدخل النقاط مباشرة في رصيده
            ومدينة الإنجاز.
          </p>
        </div>

        <Link
          href="/teacher"
          style={styles.backButton}
        >
          ← العودة إلى لوحة المعلم
        </Link>
      </section>

      <section style={styles.giftCard}>
        <div style={styles.giftTop}>
          <span style={styles.giftIcon}>
            🎁
          </span>

          <div>
            <h2 style={styles.giftTitle}>
              هدية جديدة
            </h2>

            <p style={styles.giftText}>
              اختر الفصل والطالب ثم
              عدد النقاط وسبب الهدية.
            </p>
          </div>
        </div>

        {loadingClasses ? (
          <div style={styles.loadingBox}>
            جاري تحميل الفصول
            والطلاب...
          </div>
        ) : (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.labelText}>
                الفصل
              </label>

              <select
                value={selectedClass}
                onChange={(event) =>
                  void handleClassChange(
                    event.target.value
                  )
                }
                style={styles.input}
              >
                <option value="">
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
            </div>

            <div style={styles.studentCountBox}>
              👨‍🎓 تم تحميل{" "}
              <strong>
                {filteredStudents.length}
              </strong>{" "}
              طالبًا
              {selectedClass
                ? ` في ${selectedClass}`
                : " في جميع الفصول"}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelText}>
                الطالب
              </label>

              <select
                value={selectedStudentId}
                onChange={(event) =>
                  setSelectedStudentId(
                    event.target.value
                  )
                }
                disabled={
                  loadingStudents ||
                  filteredStudents.length ===
                    0
                }
                style={styles.input}
              >
                <option value="">
                  اختر الطالب
                </option>

                {filteredStudents.map(
                  (student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.studentName}
                      {" - "}
                      {student.classroom}
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedStudent && (
              <div
                style={
                  styles.studentSummary
                }
              >
                <div>
                  <strong>
                    {
                      selectedStudent.studentName
                    }
                  </strong>

                  <p
                    style={
                      styles.studentMeta
                    }
                  >
                    {
                      selectedStudent.classroom
                    }
                  </p>
                </div>

                <div
                  style={
                    styles.studentIdBadge
                  }
                >
                  {
                    selectedStudent.studentId
                  }
                </div>
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.labelText}>
                عدد النقاط
              </label>

              <div
                style={
                  styles.quickPointsRow
                }
              >
                {QUICK_POINTS.map(
                  (pointValue) => {
                    const active =
                      !customPoints &&
                      points ===
                        pointValue;

                    return (
                      <button
                        key={pointValue}
                        type="button"
                        onClick={() => {
                          setPoints(
                            pointValue
                          );
                          setCustomPoints(
                            ""
                          );
                        }}
                        style={
                          active
                            ? {
                                ...styles.quickPointButton,
                                ...styles.quickPointButtonActive,
                              }
                            : styles.quickPointButton
                        }
                      >
                        +{pointValue}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelText}>
                أو عدد مخصص
              </label>

              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={customPoints}
                onChange={(event) =>
                  setCustomPoints(
                    event.target.value
                  )
                }
                placeholder="مثال: 7"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelText}>
                سبب الهدية
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                placeholder="مثال: تميزك ومشاركتك الرائعة اليوم"
                rows={4}
                maxLength={250}
                style={styles.textarea}
              />
            </div>

            <div style={styles.preview}>
              <span
                style={
                  styles.previewIcon
                }
              >
                ✨
              </span>

              <div>
                <strong>
                  معاينة الهدية
                </strong>

                <p
                  style={
                    styles.previewText
                  }
                >
                  🎁 لديك هدية من
                  معلمك!
                  <br />
                  حصلت على{" "}
                  <strong>
                    {Number.isFinite(
                      finalPoints
                    )
                      ? finalPoints
                      : 0}
                  </strong>{" "}
                  نقطة ⭐
                  {reason.trim()
                    ? ` بسبب: ${reason.trim()}`
                    : ""}
                </p>
              </div>
            </div>

            {message && (
              <div
                style={
                  isSuccess
                    ? styles.successMessage
                    : styles.errorMessage
                }
              >
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                void handleSendGift()
              }
              disabled={
                sending ||
                !selectedStudent
              }
              style={{
                ...styles.sendButton,
                opacity:
                  sending ||
                  !selectedStudent
                    ? 0.55
                    : 1,
                cursor:
                  sending ||
                  !selectedStudent
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {sending
                ? "جاري إرسال الهدية..."
                : `🎁 إرسال ${
                    Number.isFinite(
                      finalPoints
                    )
                      ? finalPoints
                      : 0
                  } نقطة`}
            </button>
          </>
        )}
      </section>

      <section style={styles.note}>
        <span style={styles.noteIcon}>
          🏙️
        </span>

        <div>
          <strong>
            مرتبطة بمدينة الإنجاز
          </strong>

          <p style={styles.noteText}>
            هدية المعلم تزيد حقل
            points وكذلك journey.xp،
            وتُسجل في سجل النقاط
            وإشعارات الطالب.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f3fbf7 0%, #ffffff 100%)",
    color: "#174d3b",
    fontFamily:
      "Arial, sans-serif",
  },

  header: {
    maxWidth: "900px",
    margin: "0 auto 24px",
    padding: "24px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #fffaf0 100%)",
    border:
      "1px solid rgba(224, 173, 44, 0.28)",
    boxShadow:
      "0 14px 36px rgba(23,77,59,.08)",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },

  label: {
    margin: "0 0 6px",
    color: "#168c65",
    fontWeight: 900,
  },

  title: {
    margin: 0,
    fontSize: "36px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#668379",
    lineHeight: 1.8,
  },

  backButton: {
    padding: "11px 16px",
    borderRadius: "14px",
    textDecoration: "none",
    background: "#eef8f3",
    color: "#176b4d",
    fontWeight: 900,
    border:
      "1px solid #cfe8dd",
  },

  giftCard: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "28px",
    borderRadius: "30px",
    background: "#ffffff",
    border:
      "2px solid #f0d56b",
    boxShadow:
      "0 18px 46px rgba(154, 103, 0, 0.11)",
  },

  giftTop: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
  },

  giftIcon: {
    width: "64px",
    height: "64px",
    display: "grid",
    placeItems: "center",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #fff7cf, #fff1ad)",
    fontSize: "34px",
  },

  giftTitle: {
    margin: 0,
    fontSize: "26px",
  },

  giftText: {
    margin: "6px 0 0",
    color: "#6c8179",
  },

  loadingBox: {
    padding: "25px",
    textAlign: "center",
    borderRadius: "18px",
    background: "#f5faf7",
    color: "#668379",
  },

  fieldGroup: {
    marginBottom: "20px",
  },

  labelText: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 900,
    color: "#174d3b",
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box",
    padding: "13px 14px",
    borderRadius: "14px",
    border:
      "1px solid #cfe3da",
    background: "#ffffff",
    fontSize: "16px",
    color: "#174d3b",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing:
      "border-box",
    padding: "13px 14px",
    borderRadius: "14px",
    border:
      "1px solid #cfe3da",
    background: "#ffffff",
    fontSize: "16px",
    color: "#174d3b",
    resize: "vertical",
    outline: "none",
    fontFamily:
      "Arial, sans-serif",
  },

  studentCountBox: {
    margin: "0 0 18px",
    padding: "11px 14px",
    borderRadius: "14px",
    background: "#f2fbf7",
    border:
      "1px solid #cfe7dc",
    color: "#176b4d",
    fontWeight: 800,
  },

  quickPointsRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "10px",
  },

  quickPointButton: {
    padding: "13px",
    borderRadius: "15px",
    border:
      "1px solid #e5d180",
    background: "#fffdf4",
    color: "#8a6500",
    fontWeight: 900,
    fontSize: "17px",
    cursor: "pointer",
  },

  quickPointButtonActive: {
    background:
      "linear-gradient(135deg, #f5cd4f, #f1b91f)",
    color: "#513800",
    border:
      "1px solid #d9a80e",
    boxShadow:
      "0 7px 18px rgba(217,168,14,.20)",
  },

  studentSummary: {
    padding: "14px 16px",
    marginBottom: "20px",
    borderRadius: "17px",
    background:
      "linear-gradient(135deg, #f2fbf7, #f8fffb)",
    border:
      "1px solid #cee8dc",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "12px",
  },

  studentMeta: {
    margin: "4px 0 0",
    color: "#6b8279",
    fontSize: "13px",
  },

  studentIdBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eef6f2",
    color: "#176b4d",
    fontWeight: 900,
    fontSize: "13px",
  },

  preview: {
    margin: "24px 0",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #fffdf4, #fff7d8)",
    border:
      "1px solid #eedb84",
    display: "flex",
    gap: "12px",
  },

  previewIcon: {
    fontSize: "27px",
  },

  previewText: {
    margin: "7px 0 0",
    color: "#725b19",
    lineHeight: 1.9,
  },

  successMessage: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "14px",
    background: "#e9f8ef",
    color: "#166534",
    border:
      "1px solid #bbdfc8",
    fontWeight: 800,
  },

  errorMessage: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "14px",
    background: "#fff1f1",
    color: "#b42318",
    border:
      "1px solid #f2c4c4",
    fontWeight: 800,
  },

  sendButton: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, #f5cd4f, #e9ad14)",
    color: "#4c3500",
    fontSize: "18px",
    fontWeight: 900,
    boxShadow:
      "0 12px 26px rgba(206, 152, 15, .23)",
  },

  note: {
    maxWidth: "720px",
    margin: "22px auto 0",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    borderRadius: "20px",
    background: "#eaf7f0",
    border:
      "1px solid #cee7dc",
  },

  noteIcon: {
    fontSize: "31px",
  },

  noteText: {
    margin: "5px 0 0",
    color: "#668379",
    lineHeight: 1.7,
  },
};
