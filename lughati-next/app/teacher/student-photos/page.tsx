"use client";

import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../../../firebase";

type PendingStudentPhoto = {
  id: string;
  studentName: string;
  classroom: string;
  photoUrl: string;
};

export default function StudentPhotosApprovalPage() {
  const [
    pendingPhotos,
    setPendingPhotos,
  ] = useState<
    PendingStudentPhoto[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionStudentId,
    setActionStudentId,
  ] = useState<string | null>(
    null
  );

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    async function loadPendingPhotos() {
      try {
        setLoading(true);
        setMessage("");

        const snapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );

        const loaded:
          PendingStudentPhoto[] =
          snapshot.docs
            .map(
              (
                studentDoc
              ) => {
                const data =
                  studentDoc.data();

                const status =
                  data.personalPhotoStatus;

                const photoUrl =
                  typeof data.personalPhotoPendingUrl ===
                  "string"
                    ? data.personalPhotoPendingUrl
                    : "";

                if (
                  status !==
                    "pending" ||
                  !photoUrl
                ) {
                  return null;
                }

                return {
                  id: studentDoc.id,

                  studentName:
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

                  photoUrl,
                };
              }
            )
            .filter(
              (
                item
              ): item is PendingStudentPhoto =>
                item !== null
            );

        loaded.sort(
          (a, b) =>
            a.studentName.localeCompare(
              b.studentName,
              "ar"
            )
        );

        setPendingPhotos(
          loaded
        );
      } catch (error) {
        console.error(
          "تعذر تحميل صور الطلاب:",
          error
        );

        setPendingPhotos([]);

        setMessage(
          "تعذر تحميل الصور المعلقة حاليًا."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPendingPhotos();
  }, []);

  async function approvePhoto(
    student: PendingStudentPhoto
  ) {
    const confirmed =
      window.confirm(
        `هل تريد اعتماد صورة الطالب ${student.studentName}؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionStudentId(
        student.id
      );

      await updateDoc(
        doc(
          db,
          "students",
          student.id
        ),
        {
          personalPhotoUrl:
            student.photoUrl,

          personalPhotoStatus:
            "approved",

          personalPhotoApprovedAt:
            serverTimestamp(),

          personalPhotoRejectedAt:
            null,

          personalPhotoPendingUrl:
            "",

          updatedAt:
            serverTimestamp(),
        }
      );

      setPendingPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              student.id
          )
      );

      setMessage(
        `✅ تم اعتماد صورة ${student.studentName} بنجاح.`
      );
    } catch (error) {
      console.error(
        "تعذر اعتماد الصورة:",
        error
      );

      setMessage(
        "تعذر اعتماد الصورة. حاول مرة أخرى."
      );
    } finally {
      setActionStudentId(
        null
      );
    }
  }

  async function rejectPhoto(
    student: PendingStudentPhoto
  ) {
    const confirmed =
      window.confirm(
        `هل تريد رفض صورة الطالب ${student.studentName}؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionStudentId(
        student.id
      );

      await updateDoc(
        doc(
          db,
          "students",
          student.id
        ),
        {
          personalPhotoStatus:
            "rejected",

          personalPhotoRejectedAt:
            serverTimestamp(),

          personalPhotoApprovedAt:
            null,

          personalPhotoPendingUrl:
            "",

          updatedAt:
            serverTimestamp(),
        }
      );

      setPendingPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              student.id
          )
      );

      setMessage(
        `❌ تم رفض صورة ${student.studentName}.`
      );
    } catch (error) {
      console.error(
        "تعذر رفض الصورة:",
        error
      );

      setMessage(
        "تعذر رفض الصورة. حاول مرة أخرى."
      );
    } finally {
      setActionStudentId(
        null
      );
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#eefaf5 0%,#f8fbff 55%,#fffaf1 100%)",
        padding:
          "24px 16px 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f33",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <Link
            href="/teacher"
            style={{
              textDecoration:
                "none",
              background:
                "#ffffff",
              color: "#176c4c",
              border:
                "1px solid #cfe6db",
              borderRadius: 16,
              padding:
                "12px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى لوحة المعلم
          </Link>

          <div
            style={{
              background:
                "#eaf9f1",
              color: "#147a58",
              border:
                "1px solid #cceadb",
              borderRadius: 999,
              padding:
                "9px 15px",
              fontWeight: 900,
            }}
          >
            📷 بانتظار الاعتماد:{" "}
            {
              pendingPhotos.length
            }
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#157c58,#2eb280)",
            color: "#ffffff",
            borderRadius: 30,
            padding:
              "34px 22px",
            textAlign:
              "center",
            boxShadow:
              "0 16px 40px rgba(21,124,88,.18)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 58,
            }}
          >
            📷
          </div>

          <h1
            style={{
              margin:
                "10px 0 8px",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            اعتماد صور الطلاب
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: 17,
            }}
          >
            راجع الصور التي أرسلتها الأسر،
            ثم اعتمد الصورة المناسبة أو ارفضها.
          </p>
        </section>

        {message && (
          <div
            style={{
              marginBottom: 20,
              padding:
                "14px 18px",
              borderRadius: 18,
              background:
                message.startsWith(
                  "✅"
                )
                  ? "#eaf9f1"
                  : message.startsWith(
                        "❌"
                      )
                    ? "#fff1f1"
                    : "#fff8e5",
              color:
                message.startsWith(
                  "✅"
                )
                  ? "#176c4c"
                  : message.startsWith(
                        "❌"
                      )
                    ? "#a63f3f"
                    : "#806116",
              fontWeight: 900,
              textAlign:
                "center",
            }}
          >
            {message}
          </div>
        )}

        {loading ? (
          <section
            style={{
              background:
                "#ffffff",
              borderRadius: 24,
              padding: 35,
              textAlign:
                "center",
              fontWeight: 900,
              color: "#176c4c",
            }}
          >
            ⏳ جارٍ تحميل الصور...
          </section>
        ) : pendingPhotos.length ===
          0 ? (
          <section
            style={{
              background:
                "#ffffff",
              borderRadius: 24,
              padding: 40,
              textAlign:
                "center",
              border:
                "1px solid #dcebe4",
              boxShadow:
                "0 10px 30px rgba(30,100,70,.06)",
            }}
          >
            <div
              style={{
                fontSize: 62,
              }}
            >
              ✅
            </div>

            <h2
              style={{
                color: "#176c4c",
              }}
            >
              لا توجد صور بانتظار الاعتماد
            </h2>

            <p
              style={{
                color: "#64756d",
                lineHeight: 1.8,
              }}
            >
              ستظهر هنا تلقائيًا أي صورة جديدة ترسلها الأسرة.
            </p>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(270px,1fr))",
              gap: 18,
            }}
          >
            {pendingPhotos.map(
              (student) => {
                const busy =
                  actionStudentId ===
                  student.id;

                return (
                  <article
                    key={
                      student.id
                    }
                    style={{
                      background:
                        "#ffffff",
                      border:
                        "1px solid #dcebe4",
                      borderRadius: 26,
                      padding: 20,
                      boxShadow:
                        "0 10px 30px rgba(30,100,70,.07)",
                    }}
                  >
                    <div
                      style={{
                        textAlign:
                          "center",
                      }}
                    >
                      <img
                        src={
                          student.photoUrl
                        }
                        alt={`صورة ${student.studentName}`}
                        style={{
                          width: 150,
                          height: 150,
                          objectFit:
                            "cover",
                          borderRadius:
                            "50%",
                          border:
                            "5px solid #eef6f2",
                          boxShadow:
                            "0 8px 20px rgba(0,0,0,.08)",
                        }}
                      />

                      <h2
                        style={{
                          margin:
                            "15px 0 6px",
                          color:
                            "#174d3b",
                          fontSize: 22,
                        }}
                      >
                        {
                          student.studentName
                        }
                      </h2>

                      <p
                        style={{
                          margin: 0,
                          color:
                            "#64748b",
                        }}
                      >
                        {student.classroom ||
                          "الصف الثاني"}
                      </p>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: 10,
                        marginTop: 20,
                      }}
                    >
                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          approvePhoto(
                            student
                          )
                        }
                        style={{
                          border:
                            "none",
                          borderRadius:
                            15,
                          padding: 13,
                          background:
                            "#168a63",
                          color:
                            "#ffffff",
                          fontWeight: 900,
                          cursor:
                            busy
                              ? "default"
                              : "pointer",
                          opacity:
                            busy
                              ? 0.6
                              : 1,
                        }}
                      >
                        {busy
                          ? "⏳"
                          : "✅ اعتماد"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          rejectPhoto(
                            student
                          )
                        }
                        style={{
                          border:
                            "1px solid #f3caca",
                          borderRadius:
                            15,
                          padding: 13,
                          background:
                            "#fff1f1",
                          color:
                            "#b33f3f",
                          fontWeight: 900,
                          cursor:
                            busy
                              ? "default"
                              : "pointer",
                          opacity:
                            busy
                              ? 0.6
                              : 1,
                        }}
                      >
                        {busy
                          ? "⏳"
                          : "❌ رفض"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}