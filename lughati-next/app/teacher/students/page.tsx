"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
  points: number;
  streakDays: number;
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

  const [classFilter, setClassFilter] =
    useState("الكل");

  async function loadStudents() {
    try {
      setLoading(true);
      setMessage("");

      const [
        studentsSnapshot,
        profilesSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "students")),
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

              active:
                data.active !== false &&
                data.archived !== true,

              points: Number(
                data.points ?? 0
              ),

              streakDays: Number(
                data.streakDays ?? 0
              ),
            };
          }
        );

      loadedStudents.sort((a, b) =>
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

  useEffect(() => {
    void loadStudents();
  }, []);

  const activeStudents =
    students.filter(
      (student) => student.active
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

          return (
            matchesSearch &&
            matchesClass
          );
        }
      );
    }, [
      activeStudents,
      searchText,
      classFilter,
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
      <section
        style={styles.header}
      >
        <div>
          <p
            style={styles.eyebrow}
          >
            أكاديمية لغتي الرقمية
          </p>

          <h1
            style={styles.title}
          >
            👨‍🎓 إدارة الطلاب
          </h1>

          <p
            style={styles.subtitle}
          >
            متابعة الطلاب والفصول
            والنقاط وملفات الطالب
            والأسرة.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadStudents()
          }
          style={
            styles.refreshButton
          }
        >
          🔄 تحديث
        </button>
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
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

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