"use client";

import Link from "next/link";
import { useState } from "react";

import {
  getStudentSubmissionWindow,
  STUDENT_SUBMISSION_CLOSE_TEXT,
  STUDENT_SUBMISSION_OPEN_TEXT,
} from "../lib/studentSubmissionWindow";

type WorkType =
  | "image"
  | "audio"
  | "video";

type UploadResult = {
  secure_url?: string;
  resource_type?: string;
  public_id?: string;
  duration?: number;
};

type CreateWorkResult = {
  success?: boolean;
  id?: string;
  code?: string;
  message?: string;
  opensAt?: string;
  closesAt?: string;
  timeZone?: string;
};

const CLOUDINARY_CLOUD_NAME =
  "ffv5igmg";

const CLOUDINARY_UPLOAD_PRESET =
  "lughati_homework_upload";

export default function UploadWorkPage() {
  const [workType, setWorkType] =
    useState<WorkType>("image");

  const [title, setTitle] =
    useState("");

  const [note, setNote] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  function getStudentData() {
    try {
      const savedStudent =
        localStorage.getItem(
          "lughatiStudent"
        );

      const studentId =
        localStorage.getItem(
          "student-id"
        );

      if (!savedStudent) {
        return {
          studentId:
            studentId || "",

          studentName:
            "طالب الأكاديمية",

          classroom:
            "",
        };
      }

      const parsed =
        JSON.parse(
          savedStudent
        );

      return {
        studentId:
          studentId ||
          parsed.studentId ||
          parsed.id ||
          "",

        studentName:
          parsed.studentName ||
          parsed.name ||
          "طالب الأكاديمية",

        classroom:
          parsed.classroom ||
          parsed.className ||
          "",
      };
    } catch {
      return {
        studentId:
          "",

        studentName:
          "طالب الأكاديمية",

        classroom:
          "",
      };
    }
  }

  function handleTypeChange(
    type: WorkType
  ) {
    setWorkType(type);

    setFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewUrl("");
    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleFileChange(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    /*
      فحص الوقت قبل السماح للطالب
      حتى باختيار ملف جديد.

      الخادم سيعيد الفحص لاحقًا
      عند الإرسال الفعلي أيضًا.
    */
    const submissionWindow =
      getStudentSubmissionWindow();

    if (!submissionWindow.isOpen) {
      event.target.value = "";

      setFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl("");

      setSuccessMessage("");

      setErrorMessage(
        submissionWindow.message
      );

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setFile(
      selectedFile
    );

    setErrorMessage("");
    setSuccessMessage("");

    if (
      selectedFile.type.startsWith(
        "image/"
      ) ||
      selectedFile.type.startsWith(
        "video/"
      ) ||
      selectedFile.type.startsWith(
        "audio/"
      )
    ) {
      const url =
        URL.createObjectURL(
          selectedFile
        );

      setPreviewUrl(
        url
      );
    }
  }

  async function uploadToCloudinary(
    selectedFile: File
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      selectedFile
    );

    formData.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );

    /*
      Cloudinary يستخدم video
      للصوت والفيديو.
    */
    const resourceType =
      workType ===
      "image"
        ? "image"
        : "video";

    const response =
      await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        {
          method:
            "POST",

          body:
            formData,
        }
      );

    const data =
      (await response.json()) as
        UploadResult;

    if (
      !response.ok ||
      !data.secure_url
    ) {
      throw new Error(
        "تعذر رفع الملف."
      );
    }

    return data;
  }

  async function submitWork() {
    /*
      أول فحص:
      من واجهة الطالب قبل البدء
      في رفع الملف إلى Cloudinary.
    */
    const submissionWindow =
      getStudentSubmissionWindow();

    if (!submissionWindow.isOpen) {
      setSuccessMessage("");

      setErrorMessage(
        submissionWindow.message
      );

      return;
    }

    if (!file) {
      setErrorMessage(
        "اختر ملفًا أولًا."
      );

      return;
    }

    if (!title.trim()) {
      setErrorMessage(
        "اكتب عنوان العمل."
      );

      return;
    }

    try {
      setUploading(true);

      setErrorMessage("");

      setSuccessMessage("");

      const student =
        getStudentData();

      if (
        !student.studentId
      ) {
        throw new Error(
          "تعذر تحديد حساب الطالب. سجّل الدخول من جديد."
        );
      }

      /*
        رفع الملف أولًا إلى Cloudinary.
      */
      const uploaded =
        await uploadToCloudinary(
          file
        );

      if (
        !uploaded.secure_url
      ) {
        throw new Error(
          "تعذر الحصول على رابط الملف المرفوع."
        );
      }

      /*
        ثاني فحص — وهو الأهم:
        الخادم يتحقق من الوقت مرة أخرى.

        حتى لو بقيت الصفحة مفتوحة
        وانتقلت الساعة إلى ما بعد 10 مساءً،
        لن يتم إنشاء العمل في Firestore.
      */
      const response =
        await fetch(
          "/api/student-works/create",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                studentId:
                  student.studentId,

                studentName:
                  student.studentName,

                classroom:
                  student.classroom,

                title:
                  title.trim(),

                note:
                  note.trim(),

                workType,

                fileUrl:
                  uploaded.secure_url,

                cloudinaryPublicId:
                  uploaded.public_id ||
                  "",

                duration:
                  typeof uploaded.duration ===
                  "number"
                    ? uploaded.duration
                    : null,
              }),
          }
        );

      const result =
        (await response.json()) as
          CreateWorkResult;

      if (
        !response.ok ||
        !result.success
      ) {
        /*
          إذا أغلق الوقت أثناء رفع الملف،
          سيعيد الخادم 403 ورسالة الأكاديمية.
        */
        if (
          result.code ===
          "STUDENT_SUBMISSION_CLOSED"
        ) {
          throw new Error(
            result.message ||
              "انتهى وقت استقبال الأعمال لهذا اليوم."
          );
        }

        throw new Error(
          result.message ||
            "تعذر إرسال العمل."
        );
      }

      setSuccessMessage(
        result.message ||
          "تم إرسال عملك للمعلم، وهو الآن بانتظار المراجعة ✅"
      );

      setTitle("");
      setNote("");
      setFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl("");
    } catch (error) {
      console.error(
        "تعذر إرسال العمل:",
        error
      );

      setSuccessMessage("");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر إرسال العمل حاليًا. حاول مرة أخرى."
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  const submissionWindow =
    getStudentSubmissionWindow();

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",

        background:
          "linear-gradient(180deg,#eefbf5 0%,#f8fbff 55%,#fffaf1 100%)",

        padding:
          "24px 16px 50px",

        color:
          "#17352a",
      }}
    >
      <div
        style={{
          maxWidth:
            "900px",

          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            marginBottom:
              "14px",

            display:
              "flex",

            justifyContent:
              "flex-start",
          }}
        >
          <Link
            href="/journey"
            style={{
              textDecoration:
                "none",

              color:
                "#047857",

              background:
                "#ffffff",

              border:
                "1px solid #a7f3d0",

              borderRadius:
                "14px",

              padding:
                "10px 16px",

              fontWeight:
                900,

              boxShadow:
                "0 5px 14px rgba(4,120,87,.08)",
            }}
          >
            ← العودة إلى رحلتي
          </Link>
        </div>

        <section
          style={{
            borderRadius:
              "30px",

            padding:
              "28px 22px",

            background:
              "linear-gradient(135deg,#0f8a61,#18a874)",

            color:
              "#ffffff",

            boxShadow:
              "0 12px 30px rgba(15,138,97,.16)",

            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              fontSize:
                "42px",

              marginBottom:
                "10px",
            }}
          >
            📤
          </div>

          <h1
            style={{
              margin:
                0,

              fontSize:
                "clamp(27px,5vw,40px)",
            }}
          >
            ارفع عملي
          </h1>

          <p
            style={{
              margin:
                "9px 0 0",

              lineHeight:
                1.8,

              color:
                "#e8fff4",

              fontWeight:
                700,
            }}
          >
            أرسل صورة أو تسجيلًا صوتيًا
            أو فيديو إلى معلمك مباشرة
            من داخل الأكاديمية.
          </p>
        </section>

        {/* حالة استقبال الأعمال */}

        <section
          style={{
            marginBottom:
              "20px",

            padding:
              "17px 18px",

            borderRadius:
              "20px",

            border:
              submissionWindow.isOpen
                ? "1px solid #a7f3d0"
                : "1px solid #fed7aa",

            background:
              submissionWindow.isOpen
                ? "#ecfdf5"
                : "#fff7ed",

            color:
              submissionWindow.isOpen
                ? "#047857"
                : "#9a3412",

            lineHeight:
              1.8,

            fontWeight:
              800,
          }}
        >
          <div
            style={{
              fontSize:
                "17px",

              fontWeight:
                900,

              marginBottom:
                "4px",
            }}
          >
            {submissionWindow.isOpen
              ? "🟢 استقبال الأعمال متاح الآن"
              : "🌙 استقبال الأعمال مغلق الآن"}
          </div>

          <div>
            وقت استقبال أعمال الطلاب يوميًا من{" "}
            <strong>
              {STUDENT_SUBMISSION_OPEN_TEXT}
            </strong>{" "}
            حتى{" "}
            <strong>
              {STUDENT_SUBMISSION_CLOSE_TEXT}
            </strong>{" "}
            بتوقيت الرياض.
          </div>
        </section>

        <section
          style={{
            background:
              "#ffffff",

            border:
              "1px solid #dcece4",

            borderRadius:
              "26px",

            padding:
              "22px",

            boxShadow:
              "0 8px 24px rgba(30,90,60,.07)",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 15px",

              color:
                "#126b49",
            }}
          >
            اختر نوع العمل
          </h2>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(150px,1fr))",

              gap:
                "12px",

              marginBottom:
                "22px",
            }}
          >
            <TypeButton
              active={
                workType ===
                "image"
              }
              icon="📷"
              label="صورة"
              disabled={
                !submissionWindow.isOpen ||
                uploading
              }
              onClick={() =>
                handleTypeChange(
                  "image"
                )
              }
            />

            <TypeButton
              active={
                workType ===
                "audio"
              }
              icon="🎙️"
              label="تسجيل صوتي"
              disabled={
                !submissionWindow.isOpen ||
                uploading
              }
              onClick={() =>
                handleTypeChange(
                  "audio"
                )
              }
            />

            <TypeButton
              active={
                workType ===
                "video"
              }
              icon="🎥"
              label="فيديو"
              disabled={
                !submissionWindow.isOpen ||
                uploading
              }
              onClick={() =>
                handleTypeChange(
                  "video"
                )
              }
            />
          </div>

          <label
            style={{
              display:
                "block",

              marginBottom:
                "8px",

              fontWeight:
                900,

              color:
                "#174c36",
            }}
          >
            عنوان العمل
          </label>

          <input
            value={
              title
            }
            disabled={
              !submissionWindow.isOpen ||
              uploading
            }
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="مثال: قراءتي لدرس صلة الرحم"
            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "13px 14px",

              borderRadius:
                "14px",

              border:
                "1px solid #cfe4d8",

              fontSize:
                "15px",

              marginBottom:
                "18px",

              outline:
                "none",

              background:
                !submissionWindow.isOpen
                  ? "#f1f5f9"
                  : "#ffffff",
            }}
          />

          <label
            style={{
              display:
                "block",

              marginBottom:
                "8px",

              fontWeight:
                900,

              color:
                "#174c36",
            }}
          >
            ملاحظة للمعلم
          </label>

          <textarea
            value={
              note
            }
            disabled={
              !submissionWindow.isOpen ||
              uploading
            }
            onChange={(event) =>
              setNote(
                event.target.value
              )
            }
            placeholder="اكتب ملاحظة قصيرة إن أردت..."
            rows={
              4
            }
            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "13px 14px",

              borderRadius:
                "14px",

              border:
                "1px solid #cfe4d8",

              fontSize:
                "15px",

              resize:
                "vertical",

              marginBottom:
                "18px",

              outline:
                "none",

              background:
                !submissionWindow.isOpen
                  ? "#f1f5f9"
                  : "#ffffff",
            }}
          />

          <label
            style={{
              display:
                "block",

              marginBottom:
                "8px",

              fontWeight:
                900,

              color:
                "#174c36",
            }}
          >
            اختر الملف
          </label>

          <input
            type="file"
            disabled={
              !submissionWindow.isOpen ||
              uploading
            }
            accept={
              workType ===
              "image"
                ? "image/*"
                : workType ===
                    "audio"
                  ? "audio/*"
                  : "video/*"
            }
            onChange={
              handleFileChange
            }
            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "14px",

              border:
                "2px dashed #a7dbc1",

              borderRadius:
                "16px",

              background:
                submissionWindow.isOpen
                  ? "#f6fffa"
                  : "#f1f5f9",

              marginBottom:
                "18px",

              cursor:
                submissionWindow.isOpen
                  ? "pointer"
                  : "not-allowed",
            }}
          />

          {previewUrl &&
            workType ===
              "image" && (
              <div
                style={{
                  marginBottom:
                    "18px",

                  overflow:
                    "hidden",

                  borderRadius:
                    "18px",

                  border:
                    "1px solid #dcece4",

                  background:
                    "#f8fafc",
                }}
              >
                <img
                  src={
                    previewUrl
                  }
                  alt="معاينة العمل"
                  style={{
                    display:
                      "block",

                    width:
                      "100%",

                    maxHeight:
                      "420px",

                    objectFit:
                      "contain",
                  }}
                />
              </div>
            )}

          {previewUrl &&
            workType ===
              "audio" && (
              <audio
                src={
                  previewUrl
                }
                controls
                style={{
                  width:
                    "100%",

                  marginBottom:
                    "18px",
                }}
              />
            )}

          {previewUrl &&
            workType ===
              "video" && (
              <video
                src={
                  previewUrl
                }
                controls
                style={{
                  width:
                    "100%",

                  maxHeight:
                    "420px",

                  borderRadius:
                    "18px",

                  background:
                    "#000",

                  marginBottom:
                    "18px",
                }}
              />
            )}

          {errorMessage && (
            <div
              style={{
                padding:
                  "13px",

                marginBottom:
                  "14px",

                borderRadius:
                  "14px",

                background:
                  "#fff1f2",

                border:
                  "1px solid #fecdd3",

                color:
                  "#be123c",

                fontWeight:
                  800,

                lineHeight:
                  1.8,
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding:
                  "14px",

                marginBottom:
                  "14px",

                borderRadius:
                  "14px",

                background:
                  "#ecfdf5",

                border:
                  "1px solid #a7f3d0",

                color:
                  "#047857",

                fontWeight:
                  900,

                lineHeight:
                  1.8,
              }}
            >
              {successMessage}
            </div>
          )}

          <button
            type="button"
            onClick={
              submitWork
            }
            disabled={
              uploading ||
              !submissionWindow.isOpen
            }
            style={{
              width:
                "100%",

              border:
                0,

              padding:
                "15px 18px",

              borderRadius:
                "16px",

              background:
                !submissionWindow.isOpen
                  ? "#cbd5e1"
                  : uploading
                    ? "#94a3b8"
                    : "#0f8a61",

              color:
                "#ffffff",

              fontWeight:
                900,

              fontSize:
                "17px",

              cursor:
                uploading ||
                !submissionWindow.isOpen
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {!submissionWindow.isOpen
              ? "🌙 استقبال الأعمال مغلق الآن"
              : uploading
                ? "⏳ جارٍ إرسال العمل..."
                : "📤 إرسال العمل للمعلم"}
          </button>
        </section>
      </div>
    </main>
  );
}

function TypeButton({
  active,
  icon,
  label,
  onClick,
  disabled = false,
}: {
  active:
    boolean;

  icon:
    string;

  label:
    string;

  onClick:
    () => void;

  disabled?:
    boolean;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      style={{
        border:
          active
            ? "2px solid #10b981"
            : "1px solid #d9e8e1",

        background:
          disabled
            ? "#f1f5f9"
            : active
              ? "#ecfdf5"
              : "#ffffff",

        color:
          disabled
            ? "#94a3b8"
            : "#174c36",

        borderRadius:
          "18px",

        padding:
          "18px 12px",

        cursor:
          disabled
            ? "not-allowed"
            : "pointer",

        fontWeight:
          900,

        fontSize:
          "16px",

        opacity:
          disabled
            ? 0.7
            : 1,
      }}
    >
      <div
        style={{
          fontSize:
            "32px",

          marginBottom:
            "7px",
        }}
      >
        {icon}
      </div>

      {label}
    </button>
  );
}