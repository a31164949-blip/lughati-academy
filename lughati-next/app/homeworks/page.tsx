"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

type Homework = {
  id: string;
  homeworkType?: "standard" | "creative" | "madrasati";
  title?: string;
  instructions?: string;
  classroom?: string;
  targetClass?: string;
  className?: string;
  dueDate?: unknown;
  published?: boolean;
  resourceUrl?: string;
attachmentName?: string;
  createdAt?: unknown;
};

type StudentData = {
  id: string;
  name: string;
  classroom: string;
  loggedIn: boolean;
};

function formatDate(value: unknown): string {
  if (!value) return "غير محدد";

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      const date = (value as { toDate: () => Date }).toDate();

      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    }

    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      }
    }
  } catch {
    return "غير محدد";
  }

  return "غير محدد";
}

function getDateTime(value: unknown): number {
  if (!value) return 0;

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

function getClassroom(homework: Homework): string {
  const classroom =
    homework.classroom || homework.targetClass || homework.className || "";

  if (
    classroom === "both" ||
    classroom === "all" ||
    classroom === "الفصلان معًا"
  ) {
    return "الثاني أ والثاني ب";
  }

  return classroom || "جميع الطلاب";
}

export default function HomeworksPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [readingStatusByHomework, setReadingStatusByHomework] =
  useState<Record<string, "pending" | "approved" | "rejected">>({});

const [solutionStatusByHomework, setSolutionStatusByHomework] =
  useState<Record<string, "pending" | "approved" | "rejected">>({});
const [completionMethodByHomework, setCompletionMethodByHomework] =
  useState<Record<string, string>>({});
const [loading, setLoading] = useState(true);
  const [loadingCompletions, setLoadingCompletions] =
  useState(false);
  const [savingId, setSavingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messageByHomework, setMessageByHomework] = useState<
    Record<string, string>
  >({});
const [showCompletionDialog, setShowCompletionDialog] = useState(false);
const [readingOnlyMode, setReadingOnlyMode] = useState(false);
const [selectedCompletionMethod, setSelectedCompletionMethod] = useState("");
const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
const [solutionUrl, setSolutionUrl] = useState("");
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState("");
const [isUploadingImage, setIsUploadingImage] = useState(false);
const [imageUploadError, setImageUploadError] = useState("");
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
const [isRecordingAudio, setIsRecordingAudio] = useState(false);
const [recordingSeconds, setRecordingSeconds] = useState(0);
const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
const [isUploadingAudio, setIsUploadingAudio] = useState(false);
const [audioUploadError, setAudioUploadError] = useState("");
const [teacherNoteByHomework, setTeacherNoteByHomework] =
  useState<Record<string, string>>({});
  useState<Record<string, "pending" | "approved" | "rejected">>({});
  
const [student, setStudent] =
  useState<StudentData>({
    id: "",
    name: "",
    classroom: "",
    loggedIn: false,
  });

const [studentLoaded, setStudentLoaded] =
  useState(false);

useEffect(() => {
  try {
    const savedStudent =
      window.localStorage.getItem(
        "lughatiStudent"
      );

    const savedLogin =
      window.localStorage.getItem(
        "lughatiStudentLoggedIn"
      ) === "true";

    if (!savedStudent) {
      setStudent({
        id: "",
        name: "",
        classroom: "",
        loggedIn: false,
      });

      return;
    }

    const parsedStudent =
      JSON.parse(savedStudent);

    setStudent({
      id: String(
        parsedStudent.id ??
          parsedStudent.studentId ??
          ""
      ),

      name: String(
        parsedStudent.name ??
          parsedStudent.studentName ??
          ""
      ),

      classroom: String(
        parsedStudent.classroom ??
          ""
      ),

      loggedIn:
        savedLogin ||
        parsedStudent.loggedIn ===
          true,
    });
  } catch (error) {
    console.error(
      "تعذر قراءة بيانات الطالب:",
      error
    );

    setStudent({
      id: "",
      name: "",
      classroom: "",
      loggedIn: false,
    });
  } finally {
    setStudentLoaded(true);
  }
}, []);
  useEffect(() => {
    if (!studentLoaded) {
      return;
    }

    const targetClasses =
      student.classroom
        ? ["الفصلان", student.classroom]
        : ["الفصلان"];

    const homeworksQuery = query(
      collection(db, "homeworks"),
      where("published", "==", true),
      where(
        "targetClass",
        "in",
        targetClasses
      ),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      homeworksQuery,
      (snapshot) => {
        const items = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Homework, "id">),
        }));

        setHomeworks(items);
        setLoading(false);
        setErrorMessage("");
      },
      (error) => {
        console.error(error);
        setLoading(false);
        setErrorMessage("تعذر تحميل الواجبات حاليًا.");
      }
    );

    return unsubscribe;
  }, [student.classroom, studentLoaded]);

useEffect(() => {
  if (!studentLoaded) {
    return;
  }

  if (!student.id) {
    setCompletedIds(new Set());
    setReadingStatusByHomework({});
    setSolutionStatusByHomework({});
    setTeacherNoteByHomework({});
    setCompletionMethodByHomework({});
    setLoadingCompletions(false);
    return;
  }

  if (loading) {
    return;
  }

  const homeworkIds = homeworks
    .map((homework) => homework.id)
    .filter(Boolean)
    .slice(0, 10);

  /*
   * مهم:
   * Firestore لا يسمح باستخدام
   * where("in", []) مع قائمة فارغة.
   */
  if (homeworkIds.length === 0) {
    setCompletedIds(new Set());
    setReadingStatusByHomework({});
    setSolutionStatusByHomework({});
    setTeacherNoteByHomework({});
    setCompletionMethodByHomework({});
    setLoadingCompletions(false);
    return;
  }

  setLoadingCompletions(true);

  /*
   * بدل قراءة جميع إنجازات الطالب
   * منذ بداية الأكاديمية،
   * نقرأ فقط سجلات الواجبات
   * الظاهرة حاليًا في الصفحة.
   */
  const completionsQuery = query(
    collection(
      db,
      "homeworkCompletions"
    ),
    where(
      "studentId",
      "==",
      student.id
    ),
    where(
      "homeworkId",
      "in",
      homeworkIds
    )
  );

  const unsubscribe = onSnapshot(
    completionsQuery,

    (snapshot) => {
      const ids =
        new Set<string>();

      const readingStatuses: Record<
        string,
        "pending" | "approved" | "rejected"
      > = {};

      const solutionStatuses: Record<
        string,
        "pending" | "approved" | "rejected"
      > = {};

      const teacherNotes: Record<
        string,
        string
      > = {};

      const completionMethods: Record<
        string,
        string
      > = {};

      snapshot.docs.forEach(
        (completionDocument) => {
          const data =
            completionDocument.data();

          const homeworkId =
            typeof data.homeworkId ===
            "string"
              ? data.homeworkId
              : "";

          if (!homeworkId) {
            return;
          }

          teacherNotes[
            homeworkId
          ] =
            typeof data.teacherNote ===
            "string"
              ? data.teacherNote
              : "";

          completionMethods[
            homeworkId
          ] =
            typeof data.completionMethod ===
            "string"
              ? data.completionMethod
              : "";

          const hasSolution =
            typeof data.solutionUrl ===
              "string" &&
            data.solutionUrl.trim() !==
              "";

          if (hasSolution) {
            solutionStatuses[
              homeworkId
            ] =
              data.solutionStatus ===
                "approved" ||
              data.solutionStatus ===
                "rejected"
                ? data.solutionStatus
                : "pending";
          }

          const hasReadingAudio =
            typeof data.readingAudioUrl ===
              "string" &&
            data.readingAudioUrl.trim() !==
              "";

          if (hasReadingAudio) {
            readingStatuses[
              homeworkId
            ] =
              data.readingStatus ===
                "approved" ||
              data.readingStatus ===
                "rejected"
                ? data.readingStatus
                : "pending";
          }

          if (
            data.status ===
            "completed"
          ) {
            ids.add(
              homeworkId
            );
          }
        }
      );

      setCompletedIds(
        ids
      );

      setReadingStatusByHomework(
        readingStatuses
      );

      setSolutionStatusByHomework(
        solutionStatuses
      );

      setTeacherNoteByHomework(
        teacherNotes
      );

      setCompletionMethodByHomework(
        completionMethods
      );

      setLoadingCompletions(
        false
      );
    },

    (error) => {
      console.error(
        "تعذر تحميل إنجازات الطالب:",
        error
      );

      setLoadingCompletions(
        false
      );
    }
  );

  return unsubscribe;
}, [
  student.id,
  studentLoaded,
  loading,
  homeworks,
]);
  const publishedHomeworks = useMemo(() => {
    return homeworks
      .filter((homework) => homework.published === true)
      .sort(
        (first, second) =>
          getDateTime(first.dueDate) - getDateTime(second.dueDate)
      );
  }, [homeworks]);
async function uploadImageToCloudinary(file: File) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "lughati_homework_upload");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("فشل رفع الصورة");
  }

  const data = await response.json();

  return data.secure_url as string;
}
async function uploadCreativeFileToCloudinary(file: File) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "lughati_homework_upload");

  const uploadEndpoint =
  file.type === "application/pdf"
    ? "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload"
    : "https://api.cloudinary.com/v1_1/ffv5igmg/raw/upload";
    
      const response = await fetch(uploadEndpoint, {
  method: "POST",
  body: formData,
});


  if (!response.ok) {
    throw new Error("فشل رفع الملف الإبداعي");
  }

  const data = await response.json();

  return data.secure_url as string;
}
async function uploadAudioToCloudinary(audioFile: Blob) {
  const formData = new FormData();

  formData.append(
    "file",
    audioFile,
    `reading-${Date.now()}.webm`
  );

  formData.append(
    "upload_preset",
    "lughati_homework_upload"
  );

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/ffv5igmg/video/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error(errorData);
    throw new Error("فشل رفع التسجيل الصوتي");
  }

  const data = await response.json();

  return data.secure_url as string;
}
  async function markHomeworkCompleted(
  homework: Homework,
  completionMethod: string,
  finalSolutionUrl: string = solutionUrl,
  finalReadingAudioUrl: string = ""
) {
    if (!student.loggedIn || !student.id || !student.name) {
      setMessageByHomework((current) => ({
        ...current,
        [homework.id]:
          "سجّل دخولك باسمك أولًا حتى يُحفظ إنجازك يا بطل.",
      }));
      return;
    }
if (
  homework.homeworkType === "madrasati" &&
  !finalSolutionUrl.trim()
) {
  setMessageByHomework((current) => ({
    ...current,
    [homework.id]: "📸 ارفع صورة إثبات الحل من منصة مدرستي أولًا.",
  }));
  return;
}
    if (
  completedIds.has(homework.id) &&
  solutionStatusByHomework[homework.id] !== "rejected"
) {
      setMessageByHomework((current) => ({
        ...current,
        [homework.id]: "سبق أن سجلت إنجاز هذا الواجب ✅",
      }));
      return;
    }

    try {
      setSavingId(homework.id);

      const completionId = `${student.id}_${homework.id}`;

      await setDoc(
        doc(db, "homeworkCompletions", completionId),
        {
          homeworkId: homework.id,
          homeworkTitle: homework.title || "واجب لغتي",
          studentId: student.id,
          completionMethod: completionMethod,
          solutionUrl: finalSolutionUrl.trim(),
          solutionStatus:
  finalSolutionUrl.trim() !== ""
    ? ("pending" as const)
    : undefined,
solutionReviewedAt: null,
solutionRejectedAt: null,
          teacherReviewed: false,
needsRevision: false,
teacherNote: "",
returnedAt: null,
          readingAudioUrl: finalReadingAudioUrl.trim(),
readingDurationSeconds:
  finalReadingAudioUrl.trim() !== "" ? recordingSeconds : 0,
readingReviewed: false,
...(finalReadingAudioUrl.trim() !== ""
  ? { readingStatus: "pending" as const }
  : {}),
          studentName: student.name,
          classroom: student.classroom || "غير محدد",
          status: "completed",
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCompletedIds((current) => {
        const next = new Set(current);
        next.add(homework.id);
        return next;
      });

      setMessageByHomework((current) => ({
        ...current,
        [homework.id]: `أحسنت يا ${student.name} 🌟 سجّل فارس إنجازك بنجاح.`,
      }));
    } catch (error) {
      console.error(error);

      setMessageByHomework((current) => ({
        ...current,
        [homework.id]:
          "تعذر تسجيل الإنجاز الآن. حاول مرة أخرى بعد قليل.",
      }));
    } finally {
      setSavingId("");
    }
  }
  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];

  setImageUploadError("");

  if (!file) {
    setSelectedImage(null);
    setImagePreview("");
    return;
  }

  if (!file.type.startsWith("image/")) {
    setImageUploadError("اختر ملف صورة فقط.");
    event.target.value = "";
    return;
  }

  const maxImageSize = 5 * 1024 * 1024;

  if (file.size > maxImageSize) {
    setImageUploadError("حجم الصورة كبير. الحد الأقصى 5 ميجابايت.");
    event.target.value = "";
    return;
  }

  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }

  setSelectedImage(file);
  setImagePreview(URL.createObjectURL(file));
}
function handleCreativeFileSelection(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  setImageUploadError("");

  if (!file) {
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    setImageUploadError("اختر ملف PDF أو Word فقط.");
    event.target.value = "";
    return;
  }

  const maxFileSize = 10 * 1024 * 1024;

  if (file.size > maxFileSize) {
    setImageUploadError("حجم الملف كبير. الحد الأقصى 10 ميجابايت.");
    event.target.value = "";
    return;
  }

  setSelectedImage(file);

  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }

  setImagePreview("");
}
async function startAudioRecording() {
  try {
    setAudioUploadError("");
    setAudioBlob(null);
    setRecordingSeconds(0);

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl("");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioUploadError("هذا المتصفح لا يدعم التسجيل الصوتي.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    const recordingInterval = window.setInterval(() => {
      setRecordingSeconds((current) => {
        if (current >= 59) {
          return 60;
        }

        return current + 1;
      });
    }, 1000);

    recorder.onstop = () => {
      window.clearInterval(recordingInterval);

      const recordedBlob = new Blob(audioChunks, {
        type: recorder.mimeType || "audio/webm",
      });

      const previewUrl = URL.createObjectURL(recordedBlob);

      setAudioBlob(recordedBlob);
      setAudioPreviewUrl(previewUrl);
      setIsRecordingAudio(false);
      setAudioRecorder(null);

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setAudioRecorder(recorder);
    setIsRecordingAudio(true);

    window.setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, 60000);
  } catch (error) {
    console.error(error);
    setIsRecordingAudio(false);
    setAudioRecorder(null);
    setAudioUploadError(
      "تعذر تشغيل الميكروفون. اسمح للمتصفح باستخدامه ثم حاول مرة أخرى."
    );
  }
}

function stopAudioRecording() {
  if (audioRecorder && audioRecorder.state === "recording") {
    audioRecorder.stop();
  }
}

  if (!studentLoaded) {
    return null;
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effcf6 0%, #f7fbff 55%, #fffdf5 100%)",
        padding: "28px 20px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#10233f",
      }}
    >
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <header
          style={{
            background:
              "linear-gradient(135deg, #087f5b 0%, #0ca678 100%)",
            borderRadius: "32px",
            padding: "34px",
            color: "white",
            boxShadow: "0 16px 40px rgba(8, 127, 91, 0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "18px" }}>
                أكاديمية لغتي الرقمية
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px, 6vw, 54px)",
                }}
              >
                واجباتي اليومية 📝
              </h1>

              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: "19px",
                  lineHeight: 1.8,
                }}
              >
                اقرأ تعليمات الواجب بعناية، ثم أخبر فارس عند
                الانتهاء.
              </p>
            </div>

            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "26px",
                background: "rgba(255,255,255,0.18)",
                display: "grid",
                placeItems: "center",
                fontSize: "48px",
              }}
            >
              📚
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
            margin: "28px 0 20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                color: "#087f5b",
                fontWeight: 700,
              }}
            >
              رحلة الإنجاز
            </p>

            <h2 style={{ margin: 0, fontSize: "30px" }}>
              الواجبات المنشورة
            </h2>
          </div>

          <Link
            href="/journey"
            style={{
              textDecoration: "none",
              color: "#087f5b",
              background: "white",
              border: "1px solid #b7ead6",
              borderRadius: "16px",
              padding: "13px 20px",
              fontWeight: 700,
            }}
          >
            العودة إلى البداية ←
          </Link>
        </div>

        {!student.loggedIn && (
          <section
            style={{
              background: "#fff9db",
              border: "1px solid #ffe066",
              borderRadius: "20px",
              padding: "18px",
              marginBottom: "20px",
              textAlign: "center",
              lineHeight: 1.8,
            }}
          >
            <strong>لم تُسجّل الدخول بعد.</strong>{" "}
            <Link href="/login" style={{ color: "#087f5b" }}>
              سجّل دخولك باسمك ليحفظ فارس إنجازاتك.
            </Link>
          </section>
        )}

        {student.loggedIn && student.name && (
          <section
            style={{
              background: "white",
              border: "1px solid #d8eee5",
              borderRadius: "20px",
              padding: "16px 20px",
              marginBottom: "20px",
              color: "#087f5b",
              fontWeight: 700,
            }}
          >
            أهلًا يا {student.name} 👋 فارس يتابع إنجازك اليوم.
          </section>
        )}

        {loading && (
          <section
            style={{
              background: "white",
              padding: "50px 24px",
              borderRadius: "26px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "45px" }}>⏳</div>
            <h3>جارٍ تحميل الواجبات...</h3>
          </section>
        )}

        {!loading && errorMessage && (
          <section
            style={{
              background: "#fff5f5",
              border: "1px solid #ffc9c9",
              padding: "35px 24px",
              borderRadius: "24px",
              textAlign: "center",
              color: "#c92a2a",
            }}
          >
            <h3 style={{ margin: 0 }}>{errorMessage}</h3>
          </section>
        )}

        {!loading &&
          !errorMessage &&
          publishedHomeworks.length === 0 && (
            <section
              style={{
                background: "white",
                padding: "55px 24px",
                borderRadius: "26px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "58px" }}>🌟</div>

              <h3 style={{ fontSize: "28px", margin: "14px 0 8px" }}>
                لا توجد واجبات منشورة حاليًا
              </h3>

              <p style={{ color: "#667085", fontSize: "18px" }}>
                استمتع بوقتك، وسنخبرك عند نشر واجب جديد.
              </p>
            </section>
          )}

        {!loading &&
          !errorMessage &&
          publishedHomeworks.length > 0 && (
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "22px",
              }}
            >
              {publishedHomeworks.map((homework, index) => {
                const isCompleted = completedIds.has(homework.id);
                const isSaving = savingId === homework.id;

                return (
                  <article
                    key={homework.id}
                    style={{
                      background: "white",
                      border: isCompleted
                        ? "2px solid #20c997"
                        : "1px solid #d8eee5",
                      borderRadius: "26px",
                      padding: "26px",
                      boxShadow:
                        "0 12px 30px rgba(16, 35, 63, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "18px",
                      }}
                    >
                      <span
                        style={{
                          background: "#d3f9e8",
                          color: "#087f5b",
                          borderRadius: "999px",
                          padding: "8px 14px",
                          fontWeight: 700,
                        }}
                      >
                        واجب رقم {index + 1}
                      </span>

                      <span
                        style={{
                          background: isCompleted
                            ? "#d3f9e8"
                            : "#fff4d6",
                          borderRadius: "14px",
                          padding: "8px 12px",
                        }}
                      >
                        {isCompleted ? "✅" : "⭐"}
                      </span>
                    </div>
{homework.homeworkType === "creative" && (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "10px",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "#fff4d6",
      color: "#8a5a00",
      fontWeight: 800,
      fontSize: "15px",
    }}
  >
    🎨 مهمة إبداعية
  </div>
)}
{homework.homeworkType === "madrasati" && (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "10px",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "#eef6ff",
      color: "#1d4ed8",
      fontWeight: 800,
      fontSize: "15px",
    }}
  >
    🌉 جسر مدرستي
  </div>
)}
                    <h3
                      style={{
                        margin: "0 0 12px",
                        fontSize: "27px",
                        lineHeight: 1.5,
                      }}
                    >
                      {homework.title || "واجب لغتي"}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 22px",
                        color: "#53657d",
                        fontSize: "18px",
                        lineHeight: 1.9,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {homework.instructions ||
                        "يرجى تنفيذ الواجب وفق تعليمات المعلم."}
                    </p>

                    <div
                      style={{
                        background: "#f3faf7",
                        borderRadius: "18px",
                        padding: "16px",
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#087f5b" }}>
                          👥 الفصل:
                        </strong>{" "}
                        {getClassroom(homework)}
                      </div>

                      <div>
                        <strong style={{ color: "#087f5b" }}>
                          📅 تاريخ الاستحقاق:
                        </strong>{" "}
                        {formatDate(homework.dueDate)}
                      </div>
                    </div>
{homework.resourceUrl && (
  <a
    href={homework.resourceUrl}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "block",
      width: "100%",
      marginTop: "18px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
      fontWeight: 800,
      textAlign: "center",
      textDecoration: "none",
    }}
  >
    {homework.homeworkType === "madrasati"
  ? "🌉 فتح واجب جسر مدرستي"
  : `🔗 فتح المرفق${homework.attachmentName ? ` — ${homework.attachmentName}` : ""}`}
  </a>
)}
                    <button
                      type="button"
                      onClick={() => {
  setSelectedHomework(homework);
  setReadingOnlyMode(false);

  if (homework.homeworkType === "madrasati") {
    setSelectedCompletionMethod("📸 إثبات مدرستي");
  } else {
    setSelectedCompletionMethod("");
  }

  setSolutionUrl("");
  setShowCompletionDialog(true);
}}
                      disabled={
                        isSaving ||
                        loadingCompletions ||
                        isCompleted
                      }
                      style={{
                        width: "100%",
                        marginTop: "20px",
                        border: "none",
                        borderRadius: "17px",
                        padding: "16px",
                        fontSize: "19px",
                        fontWeight: 700,
                        cursor: isCompleted
                          ? "default"
                          : "pointer",
                        background: isCompleted
                          ? "#d3f9e8"
                          : "#087f5b",
                        color: isCompleted ? "#087f5b" : "white",
                        opacity: isSaving ? 0.7 : 1,
                      }}
                    >
                    {isSaving
  ? "جار تسجيل الإنجاز..."
  : isCompleted
  ? homework.homeworkType === "madrasati"
    ? "✅ تم إنجاز واجب مدرستي"
    : "✅ تم إنجاز الواجب"
  : homework.homeworkType === "madrasati"
    ? "✅ أتممت واجب جسر مدرستي"
    : "✅ أتممت حل الواجب"}
                    </button>
                    {isCompleted && !readingStatusByHomework[homework.id] && (
  <button
    type="button"
    onClick={() => {
      setSelectedHomework(homework);
      setSelectedCompletionMethod("");
      setSolutionUrl("");
      setAudioBlob(null);
      setRecordingSeconds(0);

      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl("");
      }

      setShowCompletionDialog(true);
    }}
    style={{
      width: "100%",
      marginTop: "14px",
      border: "none",
      borderRadius: "16px",
      padding: "14px",
      background: "#e8f8f2",
      color: "#087f5b",
      fontSize: "17px",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    🎙️ سجّل قراءتك الآن
  </button>
)}
{readingStatusByHomework[homework.id] === "pending" && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px",
      textAlign: "center",
      background: "#fff8e1",
      color: "#8a6500",
      borderRadius: "16px",
      fontWeight: 700,
      lineHeight: 1.7,
    }}
  >
    ⏳ تم إرسال قراءتك للمعلم وهي بانتظار المراجعة
  </div>
)}

{readingStatusByHomework[homework.id] === "approved" && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px",
      textAlign: "center",
      background: "#e8f8ee",
      color: "#087f5b",
      borderRadius: "16px",
      fontWeight: 700,
      lineHeight: 1.7,
    }}
  >
    ✅ أحسنت! تم اعتماد قراءتك من المعلم
  </div>
)}
{readingStatusByHomework[homework.id] === "rejected" && (
<div
  style={{
    marginTop: "14px",
    padding: "14px",
    textAlign: "center",
    background: "#fff0f0",
    color: "#c92a2a",
    borderRadius: "16px",
    fontWeight: 700,
    lineHeight: 1.7,
  }}
>
  <div style={{ marginBottom: "12px" }}>
    ❌ لم تُعتمد قراءتك. أعد القراءة وسجّل مرة أخرى.
  </div>

  <button
    type="button"
    onClick={() => {
      setSelectedHomework(homework);
      setReadingOnlyMode(true);
      setSelectedCompletionMethod("");
      setSolutionUrl("");
      setAudioBlob(null);
      setRecordingSeconds(0);

      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl("");
      }

      setShowCompletionDialog(true);
    }}
  
    >
  🎙️ إعادة تسجيل القراءة
</button>
</div>

            )}     
            {solutionStatusByHomework[homework.id] === "pending" && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px",
      textAlign: "center",
      background: "#fff8e1",
      color: "#8a6500",
      borderRadius: "16px",
      fontWeight: 700,
      lineHeight: 1.7,
    }}
  >
    ⏳ تم إرسال صورة حلك للمعلم وهي بانتظار المراجعة
  </div>
)}
{solutionStatusByHomework[homework.id] === "approved" && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px",
      textAlign: "center",
      background: "#e8f8ee",
      color: "#087f5b",
      borderRadius: "16px",
      fontWeight: 700,
      lineHeight: 1.7,
    }}
  >
    ✅ أحسنت! تم اعتماد صورة حلك من المعلم
  </div>
)}
{solutionStatusByHomework[homework.id] === "rejected" && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px",
      textAlign: "center",
      background: "#fff0f0",
      color: "#c92a2a",
      borderRadius: "16px",
      fontWeight: 700,
      lineHeight: 1.7,
    }}
  >
    <div style={{ marginBottom: "12px" }}>
  {completionMethodByHomework[homework.id] === "📄 ملف إبداعي"
    ? "❌ لم يُعتمد الملف الإبداعي. أعد رفع الملف بعد التعديل."
    : completionMethodByHomework[homework.id] === "🔗 رابط إبداعي"
      ? "❌ لم يُعتمد الرابط الإبداعي. عدّل الرابط ثم أرسله مجددًا."
      : completionMethodByHomework[homework.id] === "🎙️ تسجيل صوتي"
        ? "❌ لم يُعتمد التسجيل الصوتي. أعد تسجيله وإرساله."
        : completionMethodByHomework[homework.id] === "📸 صورة إبداعية"
          ? "❌ لم تُعتمد الصورة الإبداعية. أعد رفع صورة أوضح."
          : "❌ لم تُعتمد صورة الحل. أعد رفع صورة أوضح."}
</div>
{teacherNoteByHomework[homework.id] && (
  <div
    style={{
      marginBottom: "12px",
      padding: "10px 12px",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#991b1b",
      fontWeight: 700,
      lineHeight: 1.7,
    }}
  >
    ✏️ ملاحظة معلمك: {teacherNoteByHomework[homework.id]}
  </div>
)}
    <button
      type="button"
      onClick={() => {
        setSelectedHomework(homework);
        setSelectedCompletionMethod("");
        setSolutionUrl("");
        setSelectedImage(null);
        setImagePreview("");
        setShowCompletionDialog(true);
      }}
      style={{
        border: "none",
        borderRadius: "14px",
        padding: "12px 18px",
        background: "#dc2626",
        color: "#ffffff",
        fontWeight: 800,
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      {completionMethodByHomework[homework.id] === "📄 ملف إبداعي"
  ? "📄 إعادة رفع الملف الإبداعي"
  : completionMethodByHomework[homework.id] === "🔗 رابط إبداعي"
    ? "🔗 إعادة إرسال الرابط الإبداعي"
    : completionMethodByHomework[homework.id] === "🎙️ تسجيل صوتي"
      ? "🎙️ إعادة تسجيل الصوت"
      : completionMethodByHomework[homework.id] === "📸 صورة إبداعية"
        ? "📸 إعادة رفع الصورة الإبداعية"
        : "📸 إعادة رفع صورة الحل"}
    </button>
  </div>
)}
                   {messageByHomework[homework.id] && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "14px",
                          textAlign: "center",
                          background: "#e6fcf5",
                          color: "#087f5b",
                          borderRadius: "16px",
                          fontWeight: 700,
                          lineHeight: 1.7,
                        }}
                      >
                        {messageByHomework[homework.id]}
                      </div>
                    )}

                    {!messageByHomework[homework.id] && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "14px",
                          textAlign: "center",
                          background: "#f3faf7",
                          color: "#087f5b",
                          borderRadius: "16px",
                          fontWeight: 700,
                        }}
                      >
                        {isCompleted
                          ? "أحسنت يا بطل، سجّل فارس إنجازك 🌟"
                          : "أنت قادر على الإنجاز يا بطل 💪"}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
      </div>
      {showCompletionDialog && selectedHomework && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 9999,
    }}
    onClick={() => {
      setShowCompletionDialog(false);
      setSelectedHomework(null);
      setSelectedCompletionMethod("");
setSolutionUrl("");
    }}
  >
    <div
      dir="rtl"
      onClick={(event) => event.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "520px",
        background: "#ffffff",
        borderRadius: "24px",
        padding: "24px",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
        border: "2px solid #d1fae5",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: "42px",
          marginBottom: "8px",
        }}
      >
        👦🏻
      </div>

      <h2
        style={{
          margin: "0 0 8px",
          textAlign: "center",
          color: "#065f46",
          fontSize: "26px",
        }}
      >
        {readingOnlyMode
  ? "🎙️ تسجيل قراءتي"
  : selectedHomework?.homeworkType === "creative"
  ? "🎨 حان وقت الإبداع يا بطل!"
  : "كيف أنجزت هذا الواجب؟"}
      </h2>

      <p
        style={{
          margin: "0 0 20px",
          textAlign: "center",
          color: "#64748b",
          lineHeight: 1.8,
        }}
      >
        {readingOnlyMode
  ? "اقرأ لمدة دقيقة، ثم أرسل تسجيلك إلى معلمك للمراجعة."
  : selectedHomework?.homeworkType === "creative"
  ? "أطلق خيالك ✨ اختر الطريقة التي تعبّر بها عن فكرتك، ثم أرسل إبداعك إلى معلمك."
  : "أحسنت يا بطل! اختر طريقة إنجازك، ثم أرسلها إلى معلمك للمراجعة."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        
  {(
  selectedHomework?.homeworkType === "madrasati"
    ? [
      "📸 إثبات مدرستي",
      ]
    : selectedHomework?.homeworkType === "creative"
    ? [
        "📸 صورة إبداعي",
        "🎙️ تسجيل صوتي",
        "🔗 رابط إبداعي",
        "📄 ملف إبداعي",
      ]
    : [
        "📖 في الكتاب",
        "📒 في الدفتر",
        "💻 حل إلكتروني",
        "📸 أرفقت صورة",
        "📄 أرفقت ملفاً",
      ]
).map((method) => {
        
          const isSelected = selectedCompletionMethod === method;

          return (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedCompletionMethod(method)}
              style={{
                padding: "14px 10px",
                borderRadius: "16px",
                border: isSelected
                  ? "2px solid #059669"
                  : "1px solid #d1d5db",
                background: isSelected ? "#d1fae5" : "#ffffff",
                color: "#065f46",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {method}
            </button>
          );
        })}
      </div>
<div
  style={{
    marginTop: "18px",
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: "16px",
  }}
>
  <label
    htmlFor="solutionUrl"
    style={{
      display: "block",
      marginBottom: "8px",
      fontWeight: 800,
      color: "#065f46",
      fontSize: "16px",
    }}
  >
    رابط صورة أو ملف الحل 🔗
  </label>
  <div
  style={{
    marginBottom: "14px",
    padding: "14px",
    border: "1px dashed #94a3b8",
    borderRadius: "14px",
    background: "#ffffff",
  }}
>
  {(
    selectedHomework?.homeworkType !== "madrasati" &&
  readingOnlyMode ||
  (
    selectedCompletionMethod &&
    (
      selectedHomework?.homeworkType !== "creative" ||
      selectedCompletionMethod === "🎙️ تسجيل صوتي"
    )
  )
) && (
  <div
    style={{
      marginBottom: "14px",
      padding: "14px",
      border: "1px dashed #94a3b8",
      borderRadius: "14px",
      background: "#ffffff",
      textAlign: "center",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px",
        color: "#065f46",
        fontSize: "18px",
      }}
    >
      🎙️ تسجيل القراءة اليومية — اختياري
    </h3>

    <p
      style={{
        margin: "0 0 12px",
        color: "#64748b",
        fontSize: "14px",
      }}
    >
      يمكنك إرفاق قراءة صوتية لمدة تصل إلى دقيقة مع أي طريقة لإنجاز الواجب.
    </p>

    <div
      style={{
        marginBottom: "12px",
        fontSize: "24px",
        fontWeight: 900,
        color: isRecordingAudio ? "#b91c1c" : "#065f46",
      }}
    >
      {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:
      {String(recordingSeconds % 60).padStart(2, "0")}
    </div>
{!isRecordingAudio && !audioPreviewUrl && (
      <button
        type="button"
        onClick={startAudioRecording}
        style={{
          width: "100%",
          border: "none",
          borderRadius: "12px",
          padding: "13px",
          background: "#087f5b",
          color: "white",
          fontWeight: 900,
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        🎙️ ابدأ القراءة
      </button>
    )}

    {isRecordingAudio && (
      <button
        type="button"
        onClick={stopAudioRecording}
        style={{
          width: "100%",
          border: "none",
          borderRadius: "12px",
          padding: "13px",
          background: "#b91c1c",
          color: "white",
          fontWeight: 900,
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        ⏹️ إيقاف التسجيل
      </button>
    )}

    {audioPreviewUrl && (
      <div style={{ marginTop: "14px" }}>
        <audio
          src={audioPreviewUrl}
          controls
          style={{ width: "100%" }}
        />

        <button
          type="button"
          onClick={() => {
            URL.revokeObjectURL(audioPreviewUrl);
            setAudioBlob(null);
            setAudioPreviewUrl("");
            setRecordingSeconds(0);
            setAudioUploadError("");
          }}
          style={{
            marginTop: "10px",
            border: "none",
            borderRadius: "10px",
            padding: "9px 14px",
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          حذف التسجيل وإعادته
        </button>
      </div>
    )}

    {audioUploadError && (
      <p
        style={{
          margin: "10px 0 0",
          color: "#b91c1c",
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        {audioUploadError}
      </p>
    )}
  </div>
)}

    <label
    htmlFor="solutionImage"
    style={{
      display:
  selectedHomework?.homeworkType === "madrasati"
    ? "block"
    : selectedHomework?.homeworkType === "creative" &&
      selectedCompletionMethod !== "📸 صورة إبداعي"
    ? "none"
    : "block",
      marginBottom: "10px",
      fontWeight: 800,
      color: "#065f46",
      cursor: "pointer",
    }}
  >
  {selectedHomework?.homeworkType === "madrasati"
  ? "📸 ارفع صورة إثبات الحل من منصة مدرستي"
  : "📷 اختر صورة الحل من الجهاز"}
  </label>

  <input
    id="solutionImage"
    type="file"
    accept="image/*"
    onChange={handleImageSelection}
    style={{
      display:
  selectedHomework?.homeworkType === "madrasati"
    ? "block"
    : selectedHomework?.homeworkType === "creative" &&
      selectedCompletionMethod !== "📸 صورة إبداعي"
    ? "none"
    : "block",
      width: "100%",
      fontSize: "14px",
    }}
  />
  <input
  id="creativeFile"
  type="file"
  accept=".pdf,.doc,.docx"
  onChange={handleCreativeFileSelection}
  style={{
    display:
      selectedHomework?.homeworkType === "creative" &&
      selectedCompletionMethod === "📄 ملف إبداعي"
        ? "block"
        : "none",
    width: "100%",
    fontSize: "14px",
    marginTop: "10px",
  }}
/>

  {imageUploadError && (
    <p
      style={{
        display:
  selectedHomework?.homeworkType === "creative" &&
  selectedCompletionMethod !== "📸 صورة لإبداعي"
    ? "none"
    : "block",
        margin: "10px 0 0",
        color: "#b91c1c",
        fontWeight: 700,
        fontSize: "13px",
      }}
    >
      {imageUploadError}
    </p>
  )}

  {imagePreview && (
    <div
      style={{
        display:
  selectedHomework?.homeworkType === "creative" &&
  selectedCompletionMethod !== "📸 صورة لإبداعي"
    ? "none"
    : "block",
        marginTop: "14px",
        textAlign: "center",
      }}
    >
      <img
        src={imagePreview}
        alt="معاينة صورة الحل"
        style={{
          width: "100%",
          maxHeight: "260px",
          objectFit: "contain",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
        }}
      />

      <button
        type="button"
        onClick={() => {
          URL.revokeObjectURL(imagePreview);
          setSelectedImage(null);
          setImagePreview("");
          setImageUploadError("");
        }}
        style={{
          marginTop: "10px",
          border: "none",
          borderRadius: "10px",
          padding: "9px 14px",
          background: "#fee2e2",
          color: "#991b1b",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        حذف الصورة واختيار غيرها
      </button>
    </div>
  )}
</div>
  <input
    id="solutionUrl"
    type="url"
    value={solutionUrl}
    onChange={(event) => setSolutionUrl(event.target.value)}
    placeholder="الصق رابط الحل هنا — اختياري"
    dir="ltr"
    style={{
      display:
  selectedHomework?.homeworkType === "creative" &&
  selectedCompletionMethod !== "🔗 رابط لإبداعي"
    ? "none"
    : "block",
      width: "100%",
      padding: "13px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      fontSize: "15px",
      outline: "none",
      boxSizing: "border-box",
      background: "#ffffff",
    }}
  />

  <p
    style={{
      display:
  selectedHomework?.homeworkType === "creative" &&
  selectedCompletionMethod !== "🔗 رابط لإبداعي"
    ? "none"
    : "block",
      margin: "8px 0 0",
      color: "#64748b",
      fontSize: "13px",
      lineHeight: 1.6,
    }}
  >
    يمكنك إرفاق رابط صورة أو ملف للحل، ويستطيع المعلم عرضه بعد الإرسال.
  </p>
</div>
      <button
        type="button"
        disabled={
  (!selectedCompletionMethod && !audioBlob) ||
  isUploadingImage ||
  isUploadingAudio ||
  isRecordingAudio
}
        onClick={async () => {
          if ((!selectedCompletionMethod && !audioBlob) || !selectedHomework) {
  return;
}

          let finalSolutionUrl = solutionUrl.trim();
          let finalReadingAudioUrl = "";

try {
  setImageUploadError("");

  if (
  (
  selectedCompletionMethod.includes("الكتاب") ||
selectedCompletionMethod.includes("الدفتر") ||
selectedCompletionMethod === "📸 أرفقت صورة" ||
selectedCompletionMethod === "📸 صورة لإبداعي" ||
selectedCompletionMethod === "📄 ملف إبداعي"
  ) &&
  !selectedImage
) {
    setImageUploadError("📷 أرفق صورة الحل قبل تأكيد الإنجاز.");
    return;
  }

  if (selectedImage) {
  setIsUploadingImage(true);

  if (selectedCompletionMethod === "📄 ملف إبداعي") {
    finalSolutionUrl =
      await uploadCreativeFileToCloudinary(selectedImage);
  } else {
    finalSolutionUrl =
      await uploadImageToCloudinary(selectedImage);
  }
}
  
  if (audioBlob) {
  setIsUploadingAudio(true);
  finalReadingAudioUrl = await uploadAudioToCloudinary(audioBlob);
}

  const isReadingOnly =
  completedIds.has(selectedHomework.id) &&
  !selectedCompletionMethod &&
  finalReadingAudioUrl.trim() !== "";

if (isReadingOnly) {
  const completionId = `${student.id}_${selectedHomework.id}`;

  await setDoc(
    doc(db, "homeworkCompletions", completionId),
    {
      readingAudioUrl: finalReadingAudioUrl.trim(),
      readingDurationSeconds: recordingSeconds,
      readingReviewed: false,
      readingStatus: "pending",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
} else {
  await markHomeworkCompleted(
    selectedHomework,
    selectedCompletionMethod,
    finalSolutionUrl,
    finalReadingAudioUrl
  );
}

  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }

  setSelectedImage(null);
  setImagePreview("");
  setSolutionUrl("");
  if (audioPreviewUrl) {
  URL.revokeObjectURL(audioPreviewUrl);
}

setAudioBlob(null);
setAudioPreviewUrl("");
setRecordingSeconds(0);
setAudioUploadError("");
} catch (error) {
  console.error(error);
  setImageUploadError(
    "تعذر رفع صورة الحل. تحقق من الاتصال ثم حاول مرة أخرى."
  );
} finally {
  setIsUploadingImage(false);
  setIsUploadingAudio(false);
}

          setShowCompletionDialog(false);
          setSelectedHomework(null);
          setSelectedCompletionMethod("");
        }}
        style={{
          width: "100%",
          marginTop: "18px",
          padding: "15px",
          border: "none",
          borderRadius: "17px",
          background: selectedCompletionMethod ? "#087f5b" : "#cbd5e1",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "18px",
          cursor: selectedCompletionMethod ? "pointer" : "not-allowed",
          position: "sticky",
bottom: "12px",
zIndex: 20,
boxShadow: "0 -4px 14px rgba(0,0,0,0.08)",
        }}
      >
        {isUploadingImage || isUploadingAudio
  ? "جاري رفع المرفقات... ⏳"
  : isRecordingAudio
    ? "أوقف التسجيل أولًا"
    : "✅ تأكيد الإنجاز"}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowCompletionDialog(false);
          setSelectedHomework(null);
          setSelectedCompletionMethod("");
        }}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "12px",
          border: "none",
          background: "transparent",
          color: "#64748b",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        إلغاء
      </button>
    </div>
  </div>
  )}
    </main>
  );
}