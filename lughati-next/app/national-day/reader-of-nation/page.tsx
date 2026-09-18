"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export default function ReaderOfNationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [uploadedAudioUrl, setUploadedAudioUrl] = useState("");
  const [uploadedAudioPublicId, setUploadedAudioPublicId] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (hasSubmitted) {
      setSendMessage(
        "📖 سبق أن أرسلت مشاركتك في قارئ الوطن. شكرًا لمشاركتك 🌟"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      chunksRef.current = [];

      setSendMessage("");
      setAudioBlob(null);
      setUploadedAudioUrl("");
      setUploadedAudioPublicId("");

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();

      setSeconds(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((value) => {
          const next = value + 1;

          if (next >= 120) {
            if (
              recorderRef.current &&
              recorderRef.current.state !== "inactive"
            ) {
              recorderRef.current.stop();
            }

            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            setIsRecording(false);

            return 120;
          }

          return next;
        });
      }, 1000);
    } catch (error) {
      console.error(error);

      alert(
        "تعذر تشغيل الميكروفون. تأكد من السماح للمتصفح باستخدامه."
      );
    }
  };

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.stop();
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetRecording = () => {
    if (isSending || hasSubmitted) return;

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setAudioBlob(null);
    setSeconds(0);
    setSendMessage("");
    setUploadedAudioUrl("");
    setUploadedAudioPublicId("");
  };

  async function uploadAudioToCloudinary(audioFile: Blob) {
    const formData = new FormData();

    formData.append(
      "file",
      audioFile,
      `reader-of-nation-${Date.now()}.webm`
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

      console.error(
        "CLOUDINARY READER OF NATION ERROR:",
        errorData
      );

      throw new Error("فشل رفع التسجيل الصوتي");
    }

    const data = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
    };

    const secureUrl =
      typeof data.secure_url === "string"
        ? data.secure_url
        : "";

    const publicId =
      typeof data.public_id === "string"
        ? data.public_id
        : "";

    if (!secureUrl) {
      throw new Error(
        "لم يرجع Cloudinary رابط التسجيل"
      );
    }

    return {
      secureUrl,
      publicId,
    };
  }

  async function sendReading() {
    if (!audioBlob || isSending || hasSubmitted) {
      return;
    }

    try {
      setIsSending(true);
      setSendMessage(
        "⏳ جارٍ تجهيز وإرسال مشاركتك..."
      );

      const studentId =
        localStorage.getItem("student-id") || "";

      const studentName =
        localStorage.getItem("student-name") || "";

      const studentClassroom =
        localStorage.getItem("student-classroom") || "";

      if (!studentId || !studentName) {
        setSendMessage(
          "⚠️ تعذر التعرف على بيانات الطالب. يرجى الدخول إلى حساب الطالب ثم المحاولة مرة أخرى."
        );
        return;
      }

      let cloudAudioUrl = uploadedAudioUrl;
      let cloudAudioPublicId =
        uploadedAudioPublicId;

      if (!cloudAudioUrl) {
        setSendMessage(
          "☁️ جارٍ رفع التسجيل الصوتي..."
        );

        const uploaded =
          await uploadAudioToCloudinary(audioBlob);

        cloudAudioUrl = uploaded.secureUrl;
        cloudAudioPublicId = uploaded.publicId;

        setUploadedAudioUrl(
          cloudAudioUrl
        );

        setUploadedAudioPublicId(
          cloudAudioPublicId
        );
      }

      setSendMessage(
        "📤 تم رفع الصوت.. جارٍ إرسال المشاركة للمعلم."
      );

      const response = await fetch(
        "/api/national-day/reader-of-nation",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            studentId,
            studentName,
            studentClassroom,
            audioUrl: cloudAudioUrl,
            audioPublicId:
              cloudAudioPublicId,
            durationSeconds: seconds,
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
        if (
          result.code ===
          "ALREADY_SUBMITTED"
        ) {
          setHasSubmitted(true);

          setSendMessage(
            result.message ||
              "📖 سبق أن شاركت في قارئ الوطن. وصلت مشاركتك للمعلم بالفعل 🌟"
          );

          return;
        }

        setSendMessage(
          result.message ||
            "❌ تعذر إرسال المشاركة للمعلم."
        );

        return;
      }

      setHasSubmitted(true);

      setSendMessage(
        result.message ||
          "🎉 وصلت قراءتك بنجاح. أحسنت يا قارئ الوطن، ومشاركتك الآن بانتظار مراجعة المعلم ⭐"
      );
    } catch (error) {
      console.error(
        "READER OF NATION SEND ERROR:",
        error
      );

      setSendMessage(
        uploadedAudioUrl
          ? "⚠️ تعذر حفظ المشاركة. اضغط «إرسال قراءتي للمعلم» مرة أخرى، ولن نرفع التسجيل من جديد."
          : "⚠️ تعذر إرسال التسجيل. تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main dir="rtl" className="page">
      <div className="shell">
        <Link
          href="/national-day"
          className="back"
        >
          ← العودة إلى فعاليات اليوم الوطني
        </Link>

        <section className="hero">
          <div className="book">
            📖
          </div>

          <span className="badge">
            فعاليات اليوم الوطني
          </span>

          <h1>
            قارئ الوطن
          </h1>

          <p>
            اقرأ النص بهدوء ووضوح، ثم سجّل
            قراءتك واستمع إليها قبل إرسالها.
          </p>

          <div className="steps">
            <span>
              ① اقرأ
            </span>

            <span>
              ② سجّل
            </span>

            <span>
              ③ استمع
            </span>

            <span>
              ④ أرسل
            </span>
          </div>
        </section>

        <section className="readingCard">
          <div className="readingHeader">
            <span>
              📚 النص القرائي
            </span>

            <span className="level">
              مناسب للصف الثاني
            </span>
          </div>

          <h2>
            وطني المملكة العربية السعودية
          </h2>

          <div className="text">
            <p>
              وَطَنِي أَرْضٌ أُحِبُّهَا
              وَأَفْتَخِرُ بِهَا.
            </p>

            <p>
              فِيهِ مَكَّةُ الْمُكَرَّمَةُ
              وَالْمَدِينَةُ الْمُنَوَّرَةُ،
              وَفِيهِ نَعِيشُ بِأَمْنٍ وَخَيْرٍ.
            </p>

            <p>
              أُحِبُّ وَطَنِي، وَأُحَافِظُ عَلَى
              نَظَافَتِهِ، وَأَجْتَهِدُ فِي
              دِرَاسَتِي لِأَكُونَ ابْنًا
              نَافِعًا لِوَطَنِي.
            </p>

            <strong>
              دَامَ وَطَنِي عَزِيزًا شَامِخًا.
            </strong>
          </div>

          <div className="tip">
            💡 اقرأ النص مرةً للتدريب قبل بدء
            التسجيل.
          </div>
        </section>

        <section className="recordCard">
          <h2>
            🎙️ سجّل قراءتك
          </h2>

          {!isRecording &&
            !audioUrl &&
            !hasSubmitted && (
              <>
                <p>
                  عندما تصبح جاهزًا اضغط الزر
                  وابدأ القراءة.
                </p>

                <button
                  type="button"
                  className="recordButton"
                  onClick={startRecording}
                >
                  🎙️ ابدأ التسجيل
                </button>
              </>
            )}

          {isRecording && (
            <div className="recording">
              <div className="pulse">
                ●
              </div>

              <strong>
                جاري التسجيل...
              </strong>

              <span>
                {seconds} ثانية
              </span>

              <button
                type="button"
                className="stopButton"
                onClick={stopRecording}
              >
                ⏹ إيقاف التسجيل
              </button>
            </div>
          )}

          {audioUrl &&
            !isRecording &&
            !hasSubmitted && (
              <div className="preview">
                <div className="success">
                  ✓ أحسنت.. استمع إلى قراءتك
                </div>

                <audio
                  controls
                  src={audioUrl}
                />

                <div className="readyToSend">
                  ✓ التسجيل جاهز للإرسال
                </div>

                <button
                  type="button"
                  className="sendButton"
                  onClick={sendReading}
                  disabled={
                    isSending ||
                    !audioBlob
                  }
                >
                  {isSending
                    ? "⏳ جارٍ إرسال القراءة..."
                    : "📤 أرسل قراءتي للمعلم"}
                </button>

                <button
                  type="button"
                  className="againButton"
                  onClick={resetRecording}
                  disabled={isSending}
                >
                  🔄 تسجيل قراءة جديدة
                </button>
              </div>
            )}

          {hasSubmitted && (
            <div className="submittedCard">
              <div className="submittedIcon">
                🏆
              </div>

              <h3>
                وصلت مشاركتك
              </h3>

              <p>
                أحسنت يا قارئ الوطن 🌟
              </p>

              <p className="submittedSmall">
                قراءتك الآن بانتظار مراجعة
                المعلم.
              </p>
            </div>
          )}

          {sendMessage && (
            <div
              className={
                hasSubmitted
                  ? "sendMessage successMessage"
                  : "sendMessage"
              }
            >
              {sendMessage}
            </div>
          )}
        </section>

        <footer>
          أكاديمية لغتي الرقمية • تعلم • اقرأ •
          أبدع
        </footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px 16px 50px;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(218, 177, 65, 0.12),
              transparent 24%
            ),
            radial-gradient(
              circle at 92% 88%,
              rgba(0, 128, 79, 0.11),
              transparent 28%
            ),
            linear-gradient(
              180deg,
              #f7fcf9,
              #ffffff
            );
          color: #24483b;
          font-family: Tahoma, Arial, sans-serif;
        }

        .shell {
          max-width: 850px;
          margin: auto;
        }

        .back {
          display: inline-block;
          margin-bottom: 18px;
          color: #087b52;
          text-decoration: none;
          font-weight: 800;
        }

        .hero {
          text-align: center;
          padding: 35px 25px;
          border-radius: 30px;
          color: white;
          background:
            linear-gradient(
              135deg,
              #065f46,
              #07915f
            );
          box-shadow:
            0 18px 45px
            rgba(6, 95, 70, 0.16);
        }

        .book {
          font-size: 58px;
          margin-bottom: 8px;
        }

        .badge {
          display: inline-block;
          padding: 7px 15px;
          border-radius: 999px;
          color: #fff2b5;
          background:
            rgba(255, 255, 255, 0.14);
          font-weight: 800;
        }

        .hero h1 {
          margin: 13px 0 8px;
          font-size:
            clamp(32px, 6vw, 48px);
        }

        .hero p {
          max-width: 600px;
          margin: auto;
          color: #e2f8ed;
          line-height: 1.9;
          font-size: 17px;
        }

        .steps {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .steps span {
          padding: 8px 15px;
          border-radius: 999px;
          background:
            rgba(255, 255, 255, 0.13);
          font-weight: 700;
        }

        .readingCard,
        .recordCard {
          margin-top: 20px;
          padding: 28px;
          border:
            1px solid #d8ebe2;
          border-radius: 28px;
          background: white;
          box-shadow:
            0 12px 35px
            rgba(7, 90, 60, 0.07);
        }

        .readingHeader {
          display: flex;
          justify-content:
            space-between;
          gap: 10px;
          align-items: center;
          font-weight: 800;
          color: #087b52;
        }

        .level {
          padding: 6px 11px;
          border-radius: 999px;
          color: #956b00;
          background: #fff4c8;
          font-size: 12px;
        }

        .readingCard h2 {
          text-align: center;
          margin: 25px 0;
          color: #066b49;
          font-size: 27px;
        }

        .text {
          padding: 25px;
          border-radius: 22px;
          background: #f7fbf9;
          border:
            1px solid #e2eee8;
          text-align: center;
          font-size:
            clamp(20px, 3vw, 25px);
          line-height: 2.15;
          color: #263f36;
        }

        .text p {
          margin: 0 0 15px;
        }

        .text strong {
          color: #087b52;
        }

        .tip {
          margin-top: 18px;
          padding: 13px 16px;
          border-radius: 15px;
          color: #775900;
          background: #fff8da;
          text-align: center;
        }

        .recordCard {
          text-align: center;
        }

        .recordCard h2 {
          color: #087b52;
          margin-top: 0;
        }

        .recordCard p {
          color: #667a72;
        }

        button {
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: 900;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .recordButton {
          margin-top: 10px;
          padding: 15px 30px;
          border-radius: 17px;
          color: white;
          background: #087b52;
          font-size: 18px;
        }

        .recording {
          display: grid;
          gap: 12px;
          justify-items: center;
        }

        .pulse {
          color: #d83d3d;
          font-size: 35px;
          animation:
            pulse 1s infinite;
        }

        @keyframes pulse {
          50% {
            opacity: 0.25;
            transform: scale(0.8);
          }
        }

        .stopButton {
          padding: 13px 25px;
          border-radius: 15px;
          color: white;
          background: #bd3d37;
          font-size: 16px;
        }

        .preview {
          display: grid;
          gap: 15px;
        }

        .success {
          color: #087b52;
          font-weight: 900;
          font-size: 18px;
        }

        audio {
          width: 100%;
        }

        .readyToSend {
          padding: 12px;
          border-radius: 14px;
          color: #087b52;
          background: #edf9f3;
          border:
            1px solid #cdebdc;
          font-weight: 900;
          font-size: 14px;
        }

        .sendButton {
          width: 100%;
          padding: 15px 20px;
          border-radius: 16px;
          color: white;
          background:
            linear-gradient(
              135deg,
              #087b52,
              #0b9b67
            );
          font-size: 17px;
          box-shadow:
            0 8px 20px
            rgba(8, 123, 82, 0.16);
        }

        .againButton {
          padding: 13px 20px;
          border-radius: 15px;
          color: #087b52;
          background: #e9f7f0;
          font-size: 15px;
        }

        .sendMessage {
          margin-top: 16px;
          padding: 14px;
          border-radius: 14px;
          color: #6b5700;
          background: #fff8da;
          border:
            1px solid #f4e3a1;
          font-weight: 800;
          line-height: 1.8;
        }

        .successMessage {
          color: #087b52;
          background: #edf9f3;
          border-color: #cdebdc;
        }

        .submittedCard {
          padding: 25px 18px;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              #f0fff7,
              #fffaf0
            );
          border:
            1px solid #cdebdc;
        }

        .submittedIcon {
          font-size: 48px;
        }

        .submittedCard h3 {
          margin: 8px 0;
          color: #087b52;
          font-size: 24px;
        }

        .submittedCard p {
          margin: 5px 0;
          color: #24483b;
          font-weight: 800;
        }

        .submittedSmall {
          font-size: 14px;
          font-weight: 600 !important;
          color: #667a72 !important;
        }

        footer {
          margin-top: 24px;
          text-align: center;
          color: #a07818;
          font-size: 13px;
        }

        @media (max-width: 600px) {
          .readingCard,
          .recordCard {
            padding: 20px 15px;
          }

          .text {
            padding: 18px 13px;
          }

          .readingHeader {
            align-items: flex-start;
          }

          .steps span {
            padding: 7px 11px;
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}