"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase";

type CaseStudy = {
  id: string;
  studentId: string;
  studentName: string;
  homeFollower: string;
  strengths: string;
  supportNeeds: string;
  readingLevel: string;
  writingLevel: string;
  motivation: string;
  familyNotes: string;
  healthStatus: string;
  healthDetails: string;
  photoConsent: string;
  updatedAt?: {
    toDate?: () => Date;
  } | null;
};

export default function TeacherCaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedStudy, setSelectedStudy] =
    useState<CaseStudy | null>(null);
const searchParams = useSearchParams();
const requestedStudentId = searchParams.get("studentId");
  useEffect(() => {
    async function loadCaseStudies() {
      try {
        setLoading(true);

        const snapshot = await getDocs(
          collection(db, "studentCaseStudies")
        );

        const rows: CaseStudy[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            studentId:
              typeof data.studentId === "string"
                ? data.studentId
                : docSnap.id,
            studentName:
              typeof data.studentName === "string"
                ? data.studentName
                : "طالب",
            homeFollower:
              typeof data.homeFollower === "string"
                ? data.homeFollower
                : "",
            strengths:
              typeof data.strengths === "string"
                ? data.strengths
                : "",
            supportNeeds:
              typeof data.supportNeeds === "string"
                ? data.supportNeeds
                : "",
            readingLevel:
              typeof data.readingLevel === "string"
                ? data.readingLevel
                : "",
            writingLevel:
              typeof data.writingLevel === "string"
                ? data.writingLevel
                : "",
            motivation:
              typeof data.motivation === "string"
                ? data.motivation
                : "",
            familyNotes:
              typeof data.familyNotes === "string"
                ? data.familyNotes
                : "",
            healthStatus:
              typeof data.healthStatus === "string"
                ? data.healthStatus
                : "",
            healthDetails:
              typeof data.healthDetails === "string"
                ? data.healthDetails
                : "",
            photoConsent:
              typeof data.photoConsent === "string"
                ? data.photoConsent
                : "",
            updatedAt:
              data.updatedAt &&
              typeof data.updatedAt === "object"
                ? data.updatedAt
                : null,
          };
        });

        rows.sort((a, b) =>
          a.studentName.localeCompare(b.studentName, "ar")
        );

        setCaseStudies(rows);
        if (requestedStudentId) {
  const requestedStudy = rows.find(
    (study) =>
      study.studentId === requestedStudentId ||
      study.id === requestedStudentId
  );

  setSelectedStudy(requestedStudy ?? null);

  if (!requestedStudy) {
    setSearchText(requestedStudentId);
  }
}

      } catch (error) {
        console.error("تعذر تحميل دراسات الحالة:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCaseStudies();
  
}, [requestedStudentId]);
  const filteredStudies = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return caseStudies;

    return caseStudies.filter((study) =>
      `${study.studentName} ${study.studentId}`
        .toLowerCase()
        .includes(query)
    );
  }, [caseStudies, searchText]);

  function followerLabel(value: string) {
    if (value === "father") return "الأب";
    if (value === "mother") return "الأم";
    if (value === "both") return "الأب والأم";
    if (value === "other") return "شخص آخر من الأسرة";
    return "غير محدد";
  }

  function levelLabel(value: string) {
    if (value === "excellent") return "ممتاز";
    if (value === "good") return "جيد";
    if (value === "developing") return "في طور التطور";
    if (value === "needs-support") return "يحتاج دعمًا";
    return "غير محدد";
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f4fbf8 0%, #eef8f4 45%, #f8fbfa 100%)",
        padding: "24px 16px 60px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/teacher/students"
            style={{
              textDecoration: "none",
              color: "#147a5b",
              fontWeight: 800,
              border: "1px solid #9fd7c4",
              borderRadius: "14px",
              padding: "10px 16px",
              background: "white",
            }}
          >
            ← العودة إلى الطلاب
          </Link>

          <div
            style={{
              color: "#648177",
              fontWeight: 700,
            }}
          >
            أكاديمية لغتي الرقمية
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg, #147a5b 0%, #1d9671 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "28px 22px",
            marginBottom: "20px",
            boxShadow: "0 14px 32px rgba(20,122,91,0.18)",
          }}
        >
          <div style={{ fontSize: "44px" }}>📋</div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "30px",
            }}
          >
            دراسات حالة الطلاب
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            نظرة سريعة تساعدك على فهم الطالب قبل أن تبدأ رحلة دعمه.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "16px",
              border: "1px solid #e0ece7",
            }}
          >
            <div style={{ color: "#71877f" }}>
              النماذج المكتملة
            </div>
            <strong
              style={{
                fontSize: "28px",
                color: "#147a5b",
              }}
            >
              {caseStudies.length}
            </strong>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "16px",
              border: "1px solid #e0ece7",
            }}
          >
            <div style={{ color: "#71877f" }}>
              موافقون على التصوير
            </div>
            <strong
              style={{
                fontSize: "28px",
                color: "#147a5b",
              }}
            >
              {
                caseStudies.filter(
                  (study) => study.photoConsent === "yes"
                ).length
              }
            </strong>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "16px",
              border: "1px solid #e0ece7",
            }}
          >
            <div style={{ color: "#71877f" }}>
              يحتاجون دعم قراءة
            </div>
            <strong
              style={{
                fontSize: "28px",
                color: "#147a5b",
              }}
            >
              {
                caseStudies.filter(
                  (study) =>
                    study.readingLevel === "needs-support"
                ).length
              }
            </strong>
          </div>
        </section>

        <input
          type="search"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
          placeholder="🔎 ابحث باسم الطالب أو رقمه..."
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid #cfe1d9",
            marginBottom: "18px",
            fontSize: "16px",
            boxSizing: "border-box",
            background: "white",
          }}
        />

        {loading ? (
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            جاري تحميل دراسات الحالة...
          </div>
        ) : filteredStudies.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
              color: "#71877f",
            }}
          >
            لا توجد دراسات حالة مطابقة حاليًا.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredStudies.map((study) => (
              <article
                key={study.id}
                style={{
                  background: "white",
                  borderRadius: "22px",
                  padding: "18px",
                  border: "1px solid #e0ece7",
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 900,
                        color: "#173b31",
                      }}
                    >
                      👤 {study.studentName}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#71877f",
                        fontSize: "14px",
                      }}
                    >
                      رقم الطالب: {study.studentId}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: "999px",
                      padding: "6px 10px",
                      background: "#eaf8f2",
                      color: "#147a5b",
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    ✅ مكتملة
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    color: "#355c50",
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    📚 القراءة:{" "}
                    <strong>
                      {levelLabel(study.readingLevel)}
                    </strong>
                  </div>

                  <div>
                    ✍️ الكتابة:{" "}
                    <strong>
                      {levelLabel(study.writingLevel)}
                    </strong>
                  </div>

                  <div>
                    📸 التصوير:{" "}
                    <strong>
                      {study.photoConsent === "yes"
                        ? "مسموح"
                        : study.photoConsent === "no"
                          ? "غير مسموح"
                          : "غير محدد"}
                    </strong>
                  </div>

                  <div>
                    🩺 الحالة الصحية:{" "}
                    <strong>
                      {study.healthStatus === "yes"
                        ? "توجد ملاحظة"
                        : study.healthStatus === "no"
                          ? "لا توجد"
                          : "غير محددة"}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedStudy(study)
                  }
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    border: "none",
                    borderRadius: "14px",
                    padding: "12px",
                    background: "#147a5b",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  👁️ عرض دراسة الحالة
                </button>
              </article>
            ))}
          </div>
        )}

        {selectedStudy && (
          <div
            onClick={() => setSelectedStudy(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: "100%",
                maxWidth: "760px",
                maxHeight: "88vh",
                overflowY: "auto",
                background: "white",
                borderRadius: "26px",
                padding: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#147a5b",
                  }}
                >
                  📋 {selectedStudy.studentName}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedStudy(null)
                  }
                  style={{
                    border: "none",
                    background: "#f2f5f4",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  ✕ إغلاق
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  lineHeight: 1.8,
                  color: "#294d42",
                }}
              >
                <div>
                  🏡 المتابع في المنزل:{" "}
                  <strong>
                    {followerLabel(
                      selectedStudy.homeFollower
                    )}
                  </strong>
                </div>

                <div>
                  🌟 نقاط القوة:
                  <div>
                    {selectedStudy.strengths ||
                      "لم تُذكر"}
                  </div>
                </div>

                <div>
                  🧩 الاحتياجات:
                  <div>
                    {selectedStudy.supportNeeds ||
                      "لم تُذكر"}
                  </div>
                </div>

                <div>
                  📚 القراءة:{" "}
                  <strong>
                    {levelLabel(
                      selectedStudy.readingLevel
                    )}
                  </strong>
                </div>

                <div>
                  ✍️ الكتابة:{" "}
                  <strong>
                    {levelLabel(
                      selectedStudy.writingLevel
                    )}
                  </strong>
                </div>

                <div>
                  🎯 التحفيز:
                  <div>
                    {selectedStudy.motivation ||
                      "لم يُذكر"}
                  </div>
                </div>

                <div>
                  💬 رسالة الأسرة:
                  <div>
                    {selectedStudy.familyNotes ||
                      "لا توجد ملاحظة"}
                  </div>
                </div>

                <div>
                  🩺 المعلومات الصحية:
                  <div>
                    {selectedStudy.healthStatus ===
                    "yes"
                      ? selectedStudy.healthDetails ||
                        "توجد ملاحظة دون تفاصيل"
                      : "لا توجد أعراض مذكورة"}
                  </div>
                </div>

                <div>
                  📸 موافقة التصوير:{" "}
                  <strong>
                    {selectedStudy.photoConsent ===
                    "yes"
                      ? "✅ موافق"
                      : selectedStudy.photoConsent ===
                          "no"
                        ? "❌ غير موافق"
                        : "غير محدد"}
                  </strong>
                </div>

                <div>
                  🕒 آخر تحديث:{" "}
                  <strong>
                    {selectedStudy.updatedAt?.toDate
                      ? selectedStudy.updatedAt
                          .toDate()
                          .toLocaleString("ar-SA")
                      : "غير متوفر"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}