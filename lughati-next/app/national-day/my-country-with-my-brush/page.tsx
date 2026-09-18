"use client";

import Link from "next/link";
import { ChangeEvent, useRef, useState } from "react";

export default function MyCountryWithMyBrushPage() {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadedImagePublicId, setUploadedImagePublicId] =
    useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  function chooseImage() {
    if (isSending || hasSubmitted) return;
    inputRef.current?.click();
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isSending || hasSubmitted) return;

    if (!file.type.startsWith("image/")) {
      alert("اختر صورة لعملك الفني.");
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));

    // صورة جديدة = نلغي بيانات أي رفع سابق
    setUploadedImageUrl("");
    setUploadedImagePublicId("");
    setSendMessage("");
  }

  function removeImage() {
    if (isSending || hasSubmitted) return;

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    setImageUrl(null);
    setImageFile(null);
    setUploadedImageUrl("");
    setUploadedImagePublicId("");
    setSendMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function uploadImageToCloudinary(image: File) {
    const formData = new FormData();

    formData.append("file", image);

    formData.append(
      "upload_preset",
      "lughati_homework_upload"
    );

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      console.error(
        "CLOUDINARY NATIONAL DAY ART ERROR:",
        errorData
      );

      throw new Error("فشل رفع صورة العمل الفني");
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
        "لم يرجع Cloudinary رابط الصورة"
      );
    }

    return {
      secureUrl,
      publicId,
    };
  }

  async function sendArtwork() {
    if (
      !imageFile ||
      !title.trim() ||
      isSending ||
      hasSubmitted
    ) {
      return;
    }

    try {
      setIsSending(true);

      setSendMessage(
        "⏳ جارٍ تجهيز وإرسال إبداعك..."
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

      if (studentId === "student-demo") {
        setSendMessage(
          "⚠️ الحساب التجريبي لا يمكنه إرسال مشاركة فعلية."
        );
        return;
      }

      let cloudImageUrl = uploadedImageUrl;
      let cloudImagePublicId = uploadedImagePublicId;

      /*
       * إذا سبق رفع الصورة وحدث فشل في Firestore
       * نستخدم نفس الرابط ولا نرفعها مرة أخرى.
       */
      if (!cloudImageUrl) {
        setSendMessage(
          "☁️ جارٍ رفع صورة لوحتك..."
        );

        const uploaded =
          await uploadImageToCloudinary(imageFile);

        cloudImageUrl = uploaded.secureUrl;
        cloudImagePublicId = uploaded.publicId;

        setUploadedImageUrl(cloudImageUrl);
        setUploadedImagePublicId(
          cloudImagePublicId
        );
      }

      setSendMessage(
        "🎨 تم رفع الصورة.. جارٍ إرسال إبداعك للمعلم."
      );

      const response = await fetch(
        "/api/national-day/my-country-with-my-brush",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            studentName,
            studentClassroom,
            title: title.trim(),
            imageUrl: cloudImageUrl,
            imagePublicId: cloudImagePublicId,
          }),
        }
      );

      const result = (await response.json()) as {
        success?: boolean;
        code?: string;
        status?: string;
        message?: string;
      };

      if (!response.ok) {
        if (
          result.code === "ALREADY_SUBMITTED" ||
          result.code === "ALREADY_APPROVED"
        ) {
          setHasSubmitted(true);

          setSendMessage(
            result.message ||
              "🎨 سبق أن أرسلت مشاركتك في وطني بريشتي."
          );

          return;
        }

        setSendMessage(
          result.message ||
            "❌ تعذر إرسال العمل الفني للمعلم."
        );

        return;
      }

      setHasSubmitted(true);

      setSendMessage(
        result.message ||
          "🎉 وصل إبداعك بنجاح، ومشاركتك الآن بانتظار مراجعة المعلم."
      );
    } catch (error) {
      console.error(
        "NATIONAL DAY ART SEND ERROR:",
        error
      );

      setSendMessage(
        uploadedImageUrl
          ? "⚠️ تعذر حفظ المشاركة. اضغط «أرسل إبداعي للمعلم» مرة أخرى، ولن نرفع الصورة من جديد."
          : "⚠️ تعذر إرسال الصورة. تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main dir="rtl" className="page">
      <div className="shell">
        <Link href="/national-day" className="back">
          ← العودة إلى فعاليات اليوم الوطني
        </Link>

        <section className="hero">
          <div className="palette">🎨</div>

          <span className="badge">
            فعاليات اليوم الوطني
          </span>

          <h1>وطني بريشتي</h1>

          <p>
            أطلق خيالك، وارسم لوحة تعبّر فيها عن حبك
            لوطنك، ثم شاركنا إبداعك.
          </p>

          <div className="steps">
            <span>① اختر فكرتك</span>
            <span>② ارسم</span>
            <span>③ صوّر لوحتك</span>
            <span>④ شارك إبداعك</span>
          </div>
        </section>

        <section className="ideasCard">
          <div className="sectionTitle">
            <span>✨</span>

            <div>
              <h2>ماذا يمكنني أن أرسم؟</h2>
              <p>
                اختر فكرتك أو ابتكر فكرة وطنية من خيالك.
              </p>
            </div>
          </div>

          <div className="ideas">
            <div className="idea">
              <div className="ideaIcon">🕋</div>
              <strong>معالم وطني</strong>
              <span>
                ارسم معلمًا تحبه من المملكة.
              </span>
            </div>

            <div className="idea">
              <div className="ideaIcon">🇸🇦</div>
              <strong>راية الوطن</strong>
              <span>
                عبّر بطريقتك عن حبك للوطن.
              </span>
            </div>

            <div className="idea">
              <div className="ideaIcon">✨</div>
              <strong>وطني في المستقبل</strong>
              <span>
                تخيّل وطنك وارسم رؤيتك الجميلة.
              </span>
            </div>
          </div>

          <div className="note">
            💡 لا يشترط أن تكون الرسمة مثالية؛ نريد أن
            نشاهد فكرتك وإبداعك أنت.
          </div>
        </section>

        <section className="workCard">
          <div className="workHeader">
            <div className="workIcon">🖼️</div>

            <div>
              <h2>شارك لوحتك</h2>
              <p>
                صوّر عملك بوضوح ثم أضفه هنا.
              </p>
            </div>
          </div>

          {!hasSubmitted && (
            <>
              <label className="fieldLabel">
                ماذا تسمي لوحتك؟
              </label>

              <input
                className="titleInput"
                type="text"
                value={title}
                maxLength={50}
                placeholder="مثال: وطني في قلبي"
                disabled={isSending}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
              />

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hiddenInput"
                onChange={handleImage}
              />

              {!imageUrl && (
                <button
                  type="button"
                  className="uploadArea"
                  onClick={chooseImage}
                  disabled={isSending}
                >
                  <span className="camera">📷</span>

                  <strong>أضف صورة لوحتك</strong>

                  <small>
                    اضغط هنا لاختيار الصورة
                  </small>
                </button>
              )}

              {imageUrl && (
                <div className="preview">
                  <div className="previewTop">
                    <span>✨ معاينة إبداعك</span>

                    <button
                      type="button"
                      onClick={removeImage}
                      className="removeButton"
                      disabled={isSending}
                    >
                      حذف الصورة
                    </button>
                  </div>

                  <div className="imageFrame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="معاينة العمل الفني"
                    />
                  </div>

                  {title.trim() && (
                    <div className="artTitle">
                      🎨 {title.trim()}
                    </div>
                  )}

                  <div className="ready">
                    ✓ لوحتك جاهزة للمشاركة
                  </div>

                  <button
                    type="button"
                    className="sendButton"
                    onClick={sendArtwork}
                    disabled={
                      !imageFile ||
                      !title.trim() ||
                      isSending
                    }
                  >
                    {isSending
                      ? "⏳ جارٍ إرسال إبداعك..."
                      : "🎨 أرسل إبداعي للمعلم"}
                  </button>
                </div>
              )}
            </>
          )}

          {hasSubmitted && (
            <div className="submittedCard">
              <div className="submittedIcon">
                🎨
              </div>

              <h3>وصل إبداعك</h3>

              <p>
                أحسنت يا فنان الوطن 🌟
              </p>

              <p className="submittedSmall">
                عملك الآن بانتظار مراجعة المعلم.
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

        <section className="artistCard">
          <div>🏅</div>

          <div>
            <strong>هل ستكون فنان الوطن؟</strong>

            <p>
              الأعمال المميزة التي يعتمدها المعلم تحصل
              على شارة «فنان الوطن».
            </p>
          </div>
        </section>

        <footer>
          أكاديمية لغتي الرقمية • تعلم • اقرأ • أبدع
        </footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px 16px 50px;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(218, 177, 65, 0.13),
              transparent 25%
            ),
            radial-gradient(
              circle at 92% 88%,
              rgba(0, 128, 79, 0.11),
              transparent 28%
            ),
            linear-gradient(180deg, #f7fcf9, #ffffff);
          color: #24483b;
          font-family: Tahoma, Arial, sans-serif;
        }

        .shell {
          max-width: 900px;
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
          position: relative;
          overflow: hidden;
          text-align: center;
          padding: 38px 25px;
          border-radius: 30px;
          color: white;
          background:
            linear-gradient(135deg, #065f46, #07915f);
          box-shadow:
            0 18px 45px rgba(6, 95, 70, 0.16);
        }

        .hero::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          left: -90px;
          bottom: -130px;
          background: rgba(255, 225, 115, 0.12);
        }

        .palette {
          font-size: 62px;
          margin-bottom: 7px;
        }

        .badge {
          display: inline-block;
          padding: 7px 15px;
          border-radius: 999px;
          color: #fff2b5;
          background: rgba(255, 255, 255, 0.14);
          font-weight: 800;
        }

        .hero h1 {
          margin: 13px 0 8px;
          font-size: clamp(32px, 6vw, 49px);
        }

        .hero p {
          max-width: 630px;
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
          margin-top: 21px;
        }

        .steps span {
          padding: 8px 15px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.13);
          font-weight: 700;
        }

        .ideasCard,
        .workCard {
          margin-top: 20px;
          padding: 28px;
          border: 1px solid #d8ebe2;
          border-radius: 28px;
          background: white;
          box-shadow:
            0 12px 35px rgba(7, 90, 60, 0.07);
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .sectionTitle > span {
          font-size: 34px;
        }

        .sectionTitle h2,
        .workHeader h2 {
          margin: 0;
          color: #087b52;
        }

        .sectionTitle p,
        .workHeader p {
          margin: 6px 0 0;
          color: #718078;
        }

        .ideas {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 22px;
        }

        .idea {
          display: grid;
          gap: 7px;
          padding: 20px 14px;
          text-align: center;
          border-radius: 20px;
          border: 1px solid #e4eee9;
          background: #f9fcfa;
        }

        .ideaIcon {
          font-size: 35px;
        }

        .idea strong {
          color: #087b52;
          font-size: 16px;
        }

        .idea span {
          color: #718078;
          font-size: 13px;
          line-height: 1.7;
        }

        .note {
          margin-top: 18px;
          padding: 13px 16px;
          border-radius: 15px;
          color: #775900;
          background: #fff8da;
          text-align: center;
          line-height: 1.8;
        }

        .workHeader {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 25px;
        }

        .workIcon {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border-radius: 17px;
          background: #edf9f3;
          font-size: 29px;
        }

        .fieldLabel {
          display: block;
          margin-bottom: 9px;
          color: #315b4c;
          font-weight: 900;
        }

        .titleInput {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid #cfe3d9;
          border-radius: 15px;
          outline: none;
          color: #24483b;
          background: #fbfdfc;
          font-family: inherit;
          font-size: 16px;
        }

        .titleInput:focus {
          border-color: #0b9162;
          box-shadow:
            0 0 0 3px rgba(11, 145, 98, 0.08);
        }

        .hiddenInput {
          display: none;
        }

        button {
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: 900;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .uploadArea {
          display: grid;
          justify-items: center;
          gap: 8px;
          width: 100%;
          margin-top: 18px;
          padding: 35px 20px;
          border: 2px dashed #b9dacb;
          border-radius: 22px;
          color: #087b52;
          background: #f7fcf9;
        }

        .uploadArea:hover {
          background: #f0faf5;
          border-color: #78b99d;
        }

        .camera {
          font-size: 45px;
        }

        .uploadArea strong {
          font-size: 18px;
        }

        .uploadArea small {
          color: #718078;
          font-weight: 600;
        }

        .preview {
          display: grid;
          gap: 15px;
          margin-top: 20px;
        }

        .previewTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #087b52;
          font-weight: 900;
        }

        .removeButton {
          padding: 8px 13px;
          border-radius: 11px;
          color: #a23d38;
          background: #fff0ef;
        }

        .imageFrame {
          overflow: hidden;
          padding: 9px;
          border-radius: 22px;
          border: 1px solid #d8ebe2;
          background: #f6faf8;
        }

        .imageFrame img {
          display: block;
          width: 100%;
          max-height: 550px;
          object-fit: contain;
          border-radius: 15px;
          background: white;
        }

        .artTitle {
          text-align: center;
          color: #087b52;
          font-size: 20px;
          font-weight: 900;
        }

        .ready {
          padding: 12px;
          border-radius: 14px;
          color: #087b52;
          background: #edf9f3;
          border: 1px solid #cdebdc;
          text-align: center;
          font-weight: 900;
        }

        .sendButton {
          width: 100%;
          padding: 15px 20px;
          border-radius: 16px;
          color: white;
          background:
            linear-gradient(135deg, #087b52, #0b9b67);
          font-size: 17px;
          box-shadow:
            0 8px 20px rgba(8, 123, 82, 0.16);
        }

        .sendMessage {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 15px;
          color: #6b5700;
          background: #fff8da;
          border: 1px solid #f4e3a1;
          text-align: center;
          font-weight: 800;
          line-height: 1.8;
        }

        .successMessage {
          color: #087b52;
          background: #edf9f3;
          border-color: #cdebdc;
        }

        .submittedCard {
          padding: 28px 20px;
          border-radius: 22px;
          text-align: center;
          background:
            linear-gradient(135deg, #f0fff7, #fffaf0);
          border: 1px solid #cdebdc;
        }

        .submittedIcon {
          font-size: 50px;
        }

        .submittedCard h3 {
          margin: 9px 0;
          color: #087b52;
          font-size: 25px;
        }

        .submittedCard p {
          margin: 6px 0;
          color: #24483b;
          font-weight: 800;
        }

        .submittedSmall {
          color: #667a72 !important;
          font-size: 14px;
          font-weight: 600 !important;
        }

        .artistCard {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          padding: 20px 24px;
          border-radius: 22px;
          border: 1px solid #ead178;
          background:
            linear-gradient(135deg, #fffdf1, #fff8d8);
        }

        .artistCard > div:first-child {
          font-size: 40px;
        }

        .artistCard strong {
          color: #8a6500;
          font-size: 18px;
        }

        .artistCard p {
          margin: 5px 0 0;
          color: #71623a;
          line-height: 1.7;
        }

        footer {
          margin-top: 24px;
          text-align: center;
          color: #a07818;
          font-size: 13px;
        }

        @media (max-width: 650px) {
          .ideas {
            grid-template-columns: 1fr;
          }

          .ideasCard,
          .workCard {
            padding: 20px 15px;
          }

          .steps span {
            padding: 7px 11px;
            font-size: 13px;
          }

          .previewTop {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}