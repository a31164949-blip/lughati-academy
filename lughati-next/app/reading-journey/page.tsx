"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

export default function ReadingJourneyPage() {
    const [isRecording, setIsRecording] = useState(false);
const [recordingSeconds, setRecordingSeconds] = useState(0);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
const [isUploadingAudio, setIsUploadingAudio] = useState(false);
const [sendMessage, setSendMessage] = useState("");
const [isSavingReading, setIsSavingReading] = useState(false);
const [weeklyProgress, setWeeklyProgress] = useState(0);
const [totalApprovedDays, setTotalApprovedDays] = useState(0);
const [approvedDates, setApprovedDates] = useState<string[]>([]);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
useEffect(() => {
  async function loadReadingProgress() {
    try {
      const studentId = localStorage.getItem("student-id");

      if (!studentId) return;

      const progressRef = doc(
        db,
        "reading-progress",
        studentId
      );

      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const data = progressSnap.data();

        setWeeklyProgress(data.weeklyProgress || 0);
        setTotalApprovedDays(data.totalApprovedDays || 0);
        setApprovedDates(data.approvedDates || []);
      }
    } catch (error) {
      console.error("فشل تحميل تقدم القراءة:", error);
    }
  }

  loadReadingProgress();
}, []);
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    setAudioBlob(null);
    setAudioPreviewUrl("");
    setRecordingSeconds(0);
    setIsRecording(true);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      const previewUrl = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioPreviewUrl(previewUrl);
      setIsRecording(false);

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();

    timerRef.current = setInterval(() => {
  setRecordingSeconds((current) => {
    const next = current + 1;

    if (next >= 60) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      return 60;
    }

    return next;
  });
}, 1000);
  } catch (error) {
    console.error(error);
    alert("تعذر تشغيل الميكروفون. تأكد من السماح للموقع باستخدامه.");
  }
}
function stopRecording() {
  if (
    mediaRecorderRef.current &&
    mediaRecorderRef.current.state !== "inactive"
  ) {
    mediaRecorderRef.current.stop();
  }

  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  setIsRecording(false);
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
    "lughati_reading_upload"
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

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f7fbf9",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #087f5b, #12a879)",
            color: "white",
            borderRadius: "28px",
            padding: "28px",
            marginBottom: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "46px", marginBottom: "8px" }}>🎙️📚</div>

          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 900,
            }}
          >
            رحلة القراءة
          </h1>

          <p
            style={{
              marginTop: "12px",
              marginBottom: 0,
              fontSize: "18px",
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            اقرأ كل يوم لمدة دقيقة، وسجّل صوتك، ثم أرسل قراءتك إلى معلمك
            للمراجعة.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid #d9eee7",
            }}
          >
            <div style={{ fontSize: "30px" }}>🔥</div>
            <h3>سلسلة القراءة</h3>
            <p style={{ color: "#687b72" }}>
  {weeklyProgress >= 5
    ? "🎉 اكتملت 5 أيام!"
    : `+50 نقطة بعد ${5 - weeklyProgress} أيام`}
</p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid #d9eee7",
            }}
          >
            <div style={{ fontSize: "30px" }}>⭐</div>
            <h3>تقدم هذا الأسبوع</h3>
            <p>{weeklyProgress} / 5 أيام</p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid #d9eee7",
            }}
          >
            <div style={{ fontSize: "30px" }}>🎁</div>
            <h3>المكافأة القادمة</h3>
            <p style={{ color: "#687b72" }}>+50 نقطة بعد 5 أيام</p>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid #d9eee7",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#087f5b",
              fontSize: "26px",
            }}
          >
            🎤 قراءة اليوم
          </h2>

          <p
            style={{
              color: "#687b72",
              lineHeight: 1.8,
              fontSize: "17px",
            }}
          >
            عندما تكون جاهزًا، سنضع هنا زر بدء التسجيل مع مؤقت دقيقة واحدة،
            والاستماع إلى التسجيل قبل إرساله للمعلم.
          </p>

          <div
  style={{
    textAlign: "center",
    fontSize: "34px",
    fontWeight: 900,
    color: isRecording ? "#b91c1c" : "#087f5b",
    margin: "18px 0",
  }}
>
  ⏱️ {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:
  {String(recordingSeconds % 60).padStart(2, "0")}
</div>

{!isRecording && (
  <button
    type="button"
    onClick={startRecording}
    style={{
      width: "100%",
      border: "none",
      borderRadius: "16px",
      padding: "16px",
      fontSize: "18px",
      fontWeight: 900,
      background: "#087f5b",
      color: "white",
      cursor: "pointer",
      marginTop: "12px",
    }}
  >
    🎙️ ابدأ القراءة
  </button>
)}

{isRecording && (
  <button
    type="button"
    onClick={stopRecording}
    style={{
      width: "100%",
      border: "none",
      borderRadius: "16px",
      padding: "16px",
      fontSize: "18px",
      fontWeight: 900,
      background: "#dc2626",
      color: "white",
      cursor: "pointer",
      marginTop: "12px",
    }}
  >
    ⏹️ إيقاف التسجيل
  </button>
)}

{audioPreviewUrl && !isRecording && (
  <div
    style={{
      marginTop: "18px",
      padding: "18px",
      background: "#f0fdf4",
      borderRadius: "16px",
      border: "1px solid #bbf7d0",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontWeight: 900,
        color: "#087f5b",
        marginBottom: "12px",
      }}
    >
      ✅ تم تسجيل قراءتك
    </div>

    <audio
      controls
      src={audioPreviewUrl}
      style={{ width: "100%" }}
    />

    <button
      type="button"
      onClick={() => {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl("");
        setAudioBlob(null);
        setRecordingSeconds(0);
      }}
      style={{
        width: "100%",
        marginTop: "12px",
        border: "1px solid #fecaca",
        borderRadius: "14px",
        padding: "12px",
        background: "#fff1f2",
        color: "#b91c1c",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      🔄 إعادة التسجيل
    </button>
  </div>
)}
        </div>
        <button
  type="button"
  disabled={isUploadingAudio || !audioBlob}
  onClick={async () => {
    if (!audioBlob) return;

    try {
      setIsUploadingAudio(true);
      setSendMessage("");

      const audioUrl = await uploadAudioToCloudinary(audioBlob);

      setIsSavingReading(true);

      const studentId =
        localStorage.getItem("student-id") || "student-demo";

      const studentName =
        localStorage.getItem("student-name") || "طالب";

      const studentClassroom =
        localStorage.getItem("student-classroom") || "";

      const response = await fetch(
        "/api/reading-submission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            studentName,
            studentClassroom,
            audioUrl,
            durationSeconds: recordingSeconds,
          }),
        }
      );

      const result =
        (await response.json()) as {
          success?: boolean;
          code?: string;
          message?: string;
        };

      if (!response.ok) {
        setSendMessage(
          result.message ||
            "❌ تعذر إرسال القراءة للمعلم."
        );
        return;
      }

      setSendMessage(
        result.message ||
          "⏳ تم إرسال قراءتك للمعلم، وهي الآن بانتظار المراجعة."
      );
    } catch (error) {
      console.error(error);
      setSendMessage("❌ تعذر رفع التسجيل أو إرساله. حاول مرة أخرى.");
    } finally {
  setIsUploadingAudio(false);
  setIsSavingReading(false);
}
  }}
  style={{
    width: "100%",
    marginTop: "12px",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    background: isUploadingAudio ? "#94a3b8" : "#087f5b",
    color: "white",
    fontWeight: 900,
    fontSize: "17px",
    cursor: isUploadingAudio ? "not-allowed" : "pointer",
  }}
>
  {isUploadingAudio
    ? "⏳ جارٍ رفع القراءة..."
    : "📤 أرسل قراءتي للمعلم"}
</button>
{sendMessage && (
  <div
    style={{
      marginTop: "12px",
      padding: "12px",
      borderRadius: "12px",
      background: "#f8fafc",
      fontWeight: 800,
      textAlign: "center",
    }}
  >
    {sendMessage}
  </div>
)}

        <div style={{ marginTop: "22px", textAlign: "center" }}>
          <Link
            href="/journey"
            style={{
              color: "#087f5b",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            ← العودة إلى محطاتي
          </Link>
        </div>
      </div>
    </main>
  );
}