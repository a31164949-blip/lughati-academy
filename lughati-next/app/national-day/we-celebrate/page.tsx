"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ParticipationType = "image" | "video" | null;

type ReviewStatus =
  | "pending"
  | "approved"
  | "revision_requested";

type Submission = {
  id: string;
  studentId: string;
  studentName: string;
  studentClassroom?: string;
  title: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  mediaPublicId?: string;
  parentPublishingConsent?: boolean;
  status: ReviewStatus;
  teacherNote?: string;
};

const API_URL = "/api/national-day/we-celebrate";

const CLOUD_NAME = "ffv5igmg";
const IMAGE_PRESET = "lughati_homework_upload";
const VIDEO_PRESET = "lughati_reading_upload";

export default function WeCelebratePage() {
  const [participationType, setParticipationType] =
    useState<ParticipationType>(null);

  const [title, setTitle] = useState("");

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [studentId, setStudentId] =
    useState("");

  const [studentName, setStudentName] =
    useState("");

  const [
    studentClassroom,
    setStudentClassroom,
  ] = useState("");

  const [
    parentConsent,
    setParentConsent,
  ] = useState(false);

  const [submission, setSubmission] =
    useState<Submission | null>(null);

  const [
    loadingStatus,
    setLoadingStatus,
  ] = useState(true);

  const [isSending, setIsSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id =
      window.localStorage.getItem(
        "student-id"
      ) || "";

    const name =
      window.localStorage.getItem(
        "student-name"
      ) || "";

    const classroom =
      window.localStorage.getItem(
        "student-classroom"
      ) || "";

    setStudentId(id);
    setStudentName(name);
    setStudentClassroom(classroom);

    if (!id) {
      setLoadingStatus(false);
      return;
    }

    void loadSubmission(id);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadSubmission(
    id: string
  ) {
    try {
      setLoadingStatus(true);

      const response = await fetch(
        `${API_URL}?studentId=${encodeURIComponent(
          id
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok && data?.success) {
        const current =
          (data.submission ||
            null) as Submission | null;

        setSubmission(current);

        if (
          current?.status ===
          "revision_requested"
        ) {
          setParticipationType(
            current.mediaType
          );

          setTitle(current.title || "");

          setParentConsent(
            current.parentPublishingConsent ===
              true
          );
        }
      }
    } catch (error) {
      console.error(
        "LOAD WE CELEBRATE STATUS ERROR:",
        error
      );
    } finally {
      setLoadingStatus(false);
    }
  }

  function chooseType(
    type: "image" | "video"
  ) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setParticipationType(type);
    setSelectedFile(null);
    setPreviewUrl("");
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function chooseFile() {
    fileInputRef.current?.click();
  }

  function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      !participationType
    ) {
      return;
    }

    if (
      participationType === "image" &&
      !file.type.startsWith("image/")
    ) {
      alert("اختر صورة للمشاركة.");
      return;
    }

    if (
      participationType === "video" &&
      !file.type.startsWith("video/")
    ) {
      alert(
        "اختر مقطع فيديو للمشاركة."
      );
      return;
    }

    if (
      participationType === "image"
    ) {
      const maxImageSize =
        12 * 1024 * 1024;

      if (file.size > maxImageSize) {
        alert(
          "حجم الصورة كبير. اختر صورة أقل من 12 ميجابايت."
        );
        return;
      }
    }

    if (
      participationType === "video"
    ) {
      const maxVideoSize =
        60 * 1024 * 1024;

      if (file.size > maxVideoSize) {
        alert(
          "حجم الفيديو كبير. اختر مقطعًا أقصر أو أقل من 60 ميجابايت."
        );
        return;
      }
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );

    setMessage("");
  }

  function removeFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadToCloudinary(
    file: File
  ) {
    if (!participationType) {
      throw new Error(
        "اختر نوع المشاركة أولًا."
      );
    }

    const isVideo =
      participationType === "video";

    const resourceType =
      isVideo ? "video" : "image";

    const preset = isVideo
      ? VIDEO_PRESET
      : IMAGE_PRESET;

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "upload_preset",
      preset
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.secure_url
    ) {
      throw new Error(
        data?.error?.message ||
          "تعذر رفع الملف. حاول مرة أخرى."
      );
    }

    return {
      mediaUrl: String(
        data.secure_url
      ),

      mediaPublicId: String(
        data.public_id || ""
      ),
    };
  }

  async function sendSubmission() {
    if (isSending) return;

    if (
      !studentId ||
      !studentName
    ) {
      setMessage(
        "تعذر التعرف على حساب الطالب. ادخل إلى الأكاديمية بحساب الطالب ثم حاول مرة أخرى."
      );
      return;
    }

    if (
      studentId === "student-demo"
    ) {
      setMessage(
        "الحساب التجريبي لا يمكنه إرسال مشاركة فعلية."
      );
      return;
    }

    if (!participationType) {
      setMessage(
        "اختر صورة أو فيديو للمشاركة."
      );
      return;
    }

    if (!title.trim()) {
      setMessage(
        "اكتب عنوانًا لمشاركتك أولًا."
      );
      return;
    }

    if (!selectedFile) {
      setMessage(
        participationType === "image"
          ? "اختر الصورة أولًا."
          : "اختر مقطع الفيديو أولًا."
      );
      return;
    }

    try {
      setIsSending(true);

      setMessage(
        participationType === "video"
          ? "⏳ جارٍ رفع الفيديو... قد يستغرق ذلك قليلًا."
          : "⏳ جارٍ رفع الصورة..."
      );

      const uploaded =
        await uploadToCloudinary(
          selectedFile
        );

      setMessage(
        "⏳ تم رفع الملف، جارٍ إرسال المشاركة للمعلم..."
      );

      const response = await fetch(
        API_URL,
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

            title: title.trim(),

            mediaType:
              participationType,

            mediaUrl:
              uploaded.mediaUrl,

            mediaPublicId:
              uploaded.mediaPublicId,

            parentPublishingConsent:
              parentConsent,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          data?.status ===
            "pending" ||
          data?.status ===
            "approved"
        ) {
          await loadSubmission(
            studentId
          );
        }

        throw new Error(
          data?.message ||
            "تعذر إرسال المشاركة."
        );
      }

      setMessage(
        data?.message ||
          "🇸🇦 وصلت مشاركتك بنجاح، وهي الآن بانتظار مراجعة المعلم."
      );

      removeFile();

      await loadSubmission(
        studentId
      );
    } catch (error) {
      console.error(
        "SEND WE CELEBRATE ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر إرسال المشاركة. حاول مرة أخرى."
      );
    } finally {
      setIsSending(false);
    }
  }

  const locked =
    submission?.status ===
      "pending" ||
    submission?.status ===
      "approved";

  return (
    <main
      dir="rtl"
      className="page"
    >
      <div className="shell">
        <Link
          href="/national-day"
          className="back"
        >
          ← العودة إلى فعاليات اليوم
          الوطني
        </Link>

        <section className="hero">
          <div className="heroGlow heroGlowOne" />
          <div className="heroGlow heroGlowTwo" />

          <div className="heroContent">
            <div className="heroIcon">
              🇸🇦
            </div>

            <span className="heroBadge">
              فعاليات أسبوع الوطن
            </span>

            <h1>نحن نحتفل</h1>

            <p>
              شاركنا فرحتك بالوطن
              بصورة جميلة أو مقطع فيديو
              قصير، واجعل احتفالك جزءًا
              من احتفال أكاديمية لغتي 💚
            </p>

            <div className="heroTags">
              <span>📸 صورة</span>
              <span>
                🎥 فيديو قصير
              </span>
              <span>
                ✨ إبداعك أنت
              </span>
            </div>
          </div>
        </section>

        {loadingStatus && (
          <section className="statusCard">
            <div className="statusIcon">
              ⏳
            </div>

            <h2>
              جارٍ التحقق من
              مشاركتك...
            </h2>
          </section>
        )}

        {!loadingStatus &&
          submission?.status ===
            "pending" && (
            <section className="statusCard pending">
              <div className="statusIcon">
                ⏳
              </div>

              <span className="statusBadge">
                تم الاستلام
              </span>

              <h2>
                وصلت مشاركتك 🇸🇦
              </h2>

              <p>
                أحسنت يا{" "}
                {studentName ||
                  "بطل"}
                ، مشاركتك الآن
                بانتظار مراجعة
                المعلم.
              </p>

              <div className="submissionInfo">
                {submission.mediaType ===
                "video"
                  ? "🎥"
                  : "📸"}{" "}
                {submission.title}
              </div>

              <ConsentSummary
                consent={
                  submission.parentPublishingConsent ===
                  true
                }
              />
            </section>
          )}

        {!loadingStatus &&
          submission?.status ===
            "approved" && (
            <section className="statusCard approved">
              <div className="statusIcon">
                🎖️
              </div>

              <span className="statusBadge gold">
                نجم الاحتفال الوطني
              </span>

              <h2>
                تم اعتماد مشاركتك
              </h2>

              <p>
                مبارك يا{" "}
                {studentName ||
                  "بطل"}{" "}
                🌟 مشاركتك الوطنية
                مميزة وتم اعتمادها.
              </p>

              <div className="submissionInfo">
                {submission.mediaType ===
                "video"
                  ? "🎥"
                  : "📸"}{" "}
                {submission.title}
              </div>

              <ConsentSummary
                consent={
                  submission.parentPublishingConsent ===
                  true
                }
              />
            </section>
          )}

        {!loadingStatus &&
          submission?.status ===
            "revision_requested" && (
            <section className="revisionCard">
              <div className="statusIcon">
                🔄
              </div>

              <h2>
                لديك ملاحظة من
                المعلم
              </h2>

              <p>
                عدّل مشاركتك ثم
                أرسل صورة أو فيديو
                جديدًا.
              </p>

              {submission.teacherNote && (
                <div className="teacherNote">
                  ✍️{" "}
                  {
                    submission.teacherNote
                  }
                </div>
              )}
            </section>
          )}

        {!loadingStatus &&
          !locked && (
            <>
              <section className="introCard">
                <div className="sectionHeading">
                  <div className="headingIcon">
                    ✨
                  </div>

                  <div>
                    <h2>
                      كيف تريد أن
                      تشارك؟
                    </h2>

                    <p>
                      اختر نوع مشاركتك
                      ثم أضف عملك.
                    </p>
                  </div>
                </div>

                <div className="typeGrid">
                  <button
                    type="button"
                    className={`typeCard ${
                      participationType ===
                      "image"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      chooseType(
                        "image"
                      )
                    }
                  >
                    <div className="typeIcon">
                      📸
                    </div>

                    <strong>
                      أشارك بصورة
                    </strong>

                    <span>
                      صورة لاحتفالك،
                      ركنك الوطني، زيك
                      الوطني أو أي
                      مشاركة جميلة.
                    </span>

                    <div className="selectLabel">
                      {participationType ===
                      "image"
                        ? "✓ تم الاختيار"
                        : "اختر الصورة"}
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`typeCard ${
                      participationType ===
                      "video"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      chooseType(
                        "video"
                      )
                    }
                  >
                    <div className="typeIcon">
                      🎥
                    </div>

                    <strong>
                      أشارك بفيديو
                    </strong>

                    <span>
                      كلمة للوطن أو لقطة
                      قصيرة من احتفالك
                      وفرحتك باليوم
                      الوطني.
                    </span>

                    <div className="selectLabel">
                      {participationType ===
                      "video"
                        ? "✓ تم الاختيار"
                        : "اختر الفيديو"}
                    </div>
                  </button>
                </div>
              </section>

              {participationType && (
                <section className="participationCard">
                  <div className="participationHeader">
                    <div className="participationIcon">
                      {participationType ===
                      "image"
                        ? "📸"
                        : "🎥"}
                    </div>

                    <div>
                      <h2>
                        {participationType ===
                        "image"
                          ? "مشاركتي بالصورة"
                          : "مشاركتي بالفيديو"}
                      </h2>

                      <p>
                        {participationType ===
                        "image"
                          ? "اختر صورة واضحة تعبّر عن فرحتك بالوطن."
                          : "اختر فيديو قصيرًا وواضحًا لمشاركتك الوطنية."}
                      </p>
                    </div>
                  </div>

                  <label className="fieldLabel">
                    عنوان مشاركتي
                  </label>

                  <input
                    type="text"
                    className="titleInput"
                    value={title}
                    maxLength={60}
                    placeholder={
                      participationType ===
                      "image"
                        ? "مثال: فرحتي بالوطن"
                        : "مثال: كلمتي لوطني"
                    }
                    onChange={(
                      event
                    ) =>
                      setTitle(
                        event.target
                          .value
                      )
                    }
                  />

                  <input
                    ref={
                      fileInputRef
                    }
                    className="hiddenInput"
                    type="file"
                    accept={
                      participationType ===
                      "image"
                        ? "image/*"
                        : "video/*"
                    }
                    onChange={
                      handleFile
                    }
                  />

                  {!previewUrl && (
                    <button
                      type="button"
                      className="uploadArea"
                      onClick={
                        chooseFile
                      }
                    >
                      <span className="uploadIcon">
                        {participationType ===
                        "image"
                          ? "📷"
                          : "🎬"}
                      </span>

                      <strong>
                        {participationType ===
                        "image"
                          ? "أضف صورتك"
                          : "أضف مقطع الفيديو"}
                      </strong>

                      <small>
                        اضغط هنا
                        لاختيار الملف
                      </small>
                    </button>
                  )}

                  {previewUrl &&
                    selectedFile && (
                      <div className="previewCard">
                        <div className="previewTop">
                          <span>
                            ✨ معاينة
                            مشاركتك
                          </span>

                          <button
                            type="button"
                            className="removeButton"
                            onClick={
                              removeFile
                            }
                            disabled={
                              isSending
                            }
                          >
                            حذف
                          </button>
                        </div>

                        <div className="mediaFrame">
                          {participationType ===
                          "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                previewUrl
                              }
                              alt="معاينة المشاركة الوطنية"
                            />
                          ) : (
                            <video
                              src={
                                previewUrl
                              }
                              controls
                              playsInline
                              preload="metadata"
                            />
                          )}
                        </div>

                        {title.trim() && (
                          <div className="participationTitle">
                            🇸🇦{" "}
                            {title.trim()}
                          </div>
                        )}

                        <div className="ready">
                          ✓ مشاركتك
                          جاهزة
                        </div>

                        <div className="consentBox">
                          <div className="consentTitle">
                            👨‍👩‍👧 موافقة
                            ولي الأمر على
                            النشر
                          </div>

                          <p>
                            المشاركة في
                            الفعالية لا
                            تتطلب الموافقة
                            على النشر. هذا
                            الخيار يخص فقط
                            إمكانية نشر
                            العمل بعد
                            اعتماده في
                            معرض الأكاديمية
                            أو ركن TikTok.
                          </p>

                          <label className="consentChoice">
                            <input
                              type="checkbox"
                              checked={
                                parentConsent
                              }
                              onChange={(
                                event
                              ) =>
                                setParentConsent(
                                  event
                                    .target
                                    .checked
                                )
                              }
                            />

                            <span>
                              أوافق بصفتي
                              ولي أمر الطالب
                              على إمكانية
                              نشر هذه
                              المشاركة في
                              معرض أكاديمية
                              لغتي وركن
                              TikTok التابع
                              للأكاديمية بعد
                              اعتماد المعلم.
                            </span>
                          </label>

                          <div
                            className={`consentState ${
                              parentConsent
                                ? "yes"
                                : "no"
                            }`}
                          >
                            {parentConsent
                              ? "✓ تم تسجيل موافقة ولي الأمر على إمكانية النشر."
                              : "🔒 لا توجد موافقة على النشر العام، وستصل المشاركة للمعلم للمراجعة فقط."}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="sendButton"
                          disabled={
                            isSending
                          }
                          onClick={
                            sendSubmission
                          }
                        >
                          {isSending
                            ? "⏳ جارٍ إرسال المشاركة..."
                            : "🇸🇦 أرسل مشاركتي للمعلم"}
                        </button>

                        {message && (
                          <div className="message">
                            {
                              message
                            }
                          </div>
                        )}
                      </div>
                    )}
                </section>
              )}
            </>
          )}

        <section className="ideasCard">
          <div className="ideasTitle">
            💡 أفكار لمشاركتي
          </div>

          <div className="ideasGrid">
            <div>
              <span>🎤</span>

              <strong>
                كلمة للوطن
              </strong>

              <small>
                قل عبارة قصيرة تعبّر
                فيها عن حبك لوطنك.
              </small>
            </div>

            <div>
              <span>🏡</span>

              <strong>
                احتفالنا
              </strong>

              <small>
                شارك لقطة جميلة من
                احتفالك أو احتفال
                أسرتك.
              </small>
            </div>

            <div>
              <span>💚</span>

              <strong>
                ركني الوطني
              </strong>

              <small>
                صوّر ركنًا أو عملاً
                وطنيًا أعددته
                للمناسبة.
              </small>
            </div>
          </div>
        </section>

        <section className="starCard">
          <div className="starIcon">
            🎖️
          </div>

          <div>
            <strong>
              هل ستكون نجم الاحتفال
              الوطني؟
            </strong>

            <p>
              المشاركات الجميلة التي
              يعتمدها المعلم تحصل على
              شارة «نجم الاحتفال
              الوطني».
            </p>
          </div>
        </section>

        <footer>
          أكاديمية لغتي الرقمية • تعلم
          • اقرأ • أبدع
        </footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px 16px 50px;
          color: #24483b;
          font-family: Tahoma, Arial,
            sans-serif;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(218, 177, 65, 0.14),
              transparent 24%
            ),
            radial-gradient(
              circle at 92% 88%,
              rgba(0, 128, 79, 0.12),
              transparent 28%
            ),
            linear-gradient(
              180deg,
              #f4fcf8,
              #ffffff
            );
        }

        .shell {
          max-width: 920px;
          margin: auto;
        }

        .back {
          display: inline-block;
          margin-bottom: 18px;
          color: #087b52;
          text-decoration: none;
          font-weight: 900;
        }

        .hero {
          position: relative;
          overflow: hidden;
          padding: 42px 25px;
          border-radius: 32px;
          color: white;
          text-align: center;
          background: linear-gradient(
            135deg,
            #064e3b,
            #087b52 55%,
            #0b9965
          );
          border: 1px solid
            rgba(225, 188, 74, 0.65);
          box-shadow: 0 20px 48px
            rgba(6, 78, 59, 0.2);
        }

        .heroGlow {
          position: absolute;
          border-radius: 50%;
          background: rgba(
            255,
            229,
            128,
            0.1
          );
        }

        .heroGlowOne {
          width: 240px;
          height: 240px;
          right: -110px;
          top: -140px;
        }

        .heroGlowTwo {
          width: 210px;
          height: 210px;
          left: -90px;
          bottom: -140px;
        }

        .heroContent {
          position: relative;
          z-index: 1;
        }

        .heroIcon {
          font-size: 62px;
          line-height: 1;
          margin-bottom: 10px;
        }

        .heroBadge {
          display: inline-block;
          padding: 7px 16px;
          border-radius: 999px;
          color: #fff2b5;
          background: rgba(
            255,
            255,
            255,
            0.13
          );
          border: 1px solid
            rgba(255, 255, 255, 0.18);
          font-weight: 900;
        }

        .hero h1 {
          margin: 13px 0 8px;
          font-size: clamp(
            34px,
            6vw,
            52px
          );
        }

        .hero p {
          max-width: 680px;
          margin: auto;
          color: #e0f8ec;
          font-size: 17px;
          line-height: 1.9;
        }

        .heroTags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
          margin-top: 22px;
        }

        .heroTags span {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(
            255,
            255,
            255,
            0.13
          );
          font-weight: 800;
        }

        .introCard,
        .participationCard,
        .ideasCard,
        .statusCard,
        .revisionCard {
          margin-top: 20px;
          padding: 28px;
          border-radius: 28px;
          background: white;
          border: 1px solid #d6ebe1;
          box-shadow: 0 12px 34px
            rgba(7, 90, 60, 0.07);
        }

        .statusCard,
        .revisionCard {
          text-align: center;
        }

        .statusCard.pending {
          background: linear-gradient(
            135deg,
            #fffef5,
            #f4fbf7
          );
        }

        .statusCard.approved {
          background: linear-gradient(
            135deg,
            #f0fbf5,
            #fff9dc
          );
          border-color: #e4c456;
        }

        .revisionCard {
          background: #fffaf0;
          border-color: #efd79c;
        }

        .statusIcon {
          font-size: 52px;
          margin-bottom: 8px;
        }

        .statusBadge {
          display: inline-block;
          padding: 7px 14px;
          border-radius: 999px;
          background: #e8f7ef;
          color: #087b52;
          font-weight: 900;
        }

        .statusBadge.gold {
          background: #fff0a8;
          color: #8a6200;
        }

        .statusCard h2,
        .revisionCard h2 {
          color: #087b52;
          margin: 13px 0 7px;
        }

        .statusCard p,
        .revisionCard p {
          color: #657b74;
          line-height: 1.8;
        }

        .submissionInfo {
          display: inline-block;
          margin-top: 7px;
          padding: 9px 15px;
          border-radius: 14px;
          background: #f4faf7;
          color: #315b4c;
          font-weight: 900;
        }

        .teacherNote {
          margin-top: 15px;
          padding: 14px;
          border-radius: 15px;
          background: white;
          border: 1px solid #ecd08b;
          color: #795c16;
          font-weight: 800;
        }

        .sectionHeading,
        .participationHeader {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .headingIcon,
        .participationIcon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: #edf9f3;
          font-size: 29px;
        }

        .sectionHeading h2,
        .participationHeader h2 {
          margin: 0;
          color: #087b52;
        }

        .sectionHeading p,
        .participationHeader p {
          margin: 5px 0 0;
          color: #718078;
          line-height: 1.7;
        }

        .typeGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 15px;
          margin-top: 23px;
        }

        .typeCard {
          display: grid;
          justify-items: center;
          gap: 9px;
          padding: 25px 17px;
          border-radius: 23px;
          border: 2px solid #e0eee7;
          color: #315b4c;
          background: #fafdfb;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s ease;
        }

        .typeCard:hover {
          transform: translateY(-2px);
          border-color: #9acdb6;
        }

        .typeCard.selected {
          border-color: #0b9162;
          background: #effaf5;
          box-shadow: 0 0 0 3px
            rgba(11, 145, 98, 0.07);
        }

        .typeIcon {
          font-size: 47px;
        }

        .typeCard strong {
          color: #087b52;
          font-size: 19px;
        }

        .typeCard span {
          max-width: 290px;
          color: #718078;
          line-height: 1.7;
          text-align: center;
          font-size: 13px;
        }

        .selectLabel {
          margin-top: 4px;
          padding: 7px 13px;
          border-radius: 999px;
          color: #087b52;
          background: #e8f7ef;
          font-size: 12px;
          font-weight: 900;
        }

        .participationHeader {
          margin-bottom: 24px;
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
          box-shadow: 0 0 0 3px
            rgba(11, 145, 98, 0.08);
        }

        .hiddenInput {
          display: none;
        }

        .uploadArea {
          display: grid;
          justify-items: center;
          gap: 8px;
          width: 100%;
          margin-top: 18px;
          padding: 36px 20px;
          border: 2px dashed #b9dacb;
          border-radius: 22px;
          color: #087b52;
          background: #f7fcf9;
          cursor: pointer;
          font-family: inherit;
          font-weight: 900;
        }

        .uploadArea:hover {
          border-color: #78b99d;
          background: #f0faf5;
        }

        .uploadIcon {
          font-size: 47px;
        }

        .uploadArea strong {
          font-size: 18px;
        }

        .uploadArea small {
          color: #718078;
          font-weight: 600;
        }

        .previewCard {
          display: grid;
          gap: 15px;
          margin-top: 20px;
        }

        .previewTop {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 12px;
          color: #087b52;
          font-weight: 900;
        }

        .removeButton {
          padding: 8px 14px;
          border: none;
          border-radius: 11px;
          color: #a23d38;
          background: #fff0ef;
          cursor: pointer;
          font-family: inherit;
          font-weight: 900;
        }

        .mediaFrame {
          overflow: hidden;
          padding: 9px;
          border-radius: 22px;
          border: 1px solid #d8ebe2;
          background: #f6faf8;
        }

        .mediaFrame img,
        .mediaFrame video {
          display: block;
          width: 100%;
          max-height: 560px;
          border-radius: 15px;
          background: #0e1713;
          object-fit: contain;
        }

        .participationTitle {
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

        .consentBox {
          padding: 18px;
          border-radius: 20px;
          background: #fffdf5;
          border: 1px solid #eadba0;
        }

        .consentTitle {
          color: #806000;
          font-size: 17px;
          font-weight: 900;
        }

        .consentBox p {
          color: #756a49;
          line-height: 1.8;
          font-size: 13px;
        }

        .consentChoice {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 14px;
          border-radius: 15px;
          background: white;
          border: 1px solid #eadfb9;
          cursor: pointer;
          line-height: 1.8;
          font-weight: 800;
        }

        .consentChoice input {
          flex: 0 0 auto;
          width: 20px;
          height: 20px;
          margin-top: 4px;
          accent-color: #087b52;
        }

        .consentState {
          margin-top: 11px;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.7;
        }

        .consentState.yes {
          color: #087b52;
          background: #eaf8f1;
        }

        .consentState.no {
          color: #765f2d;
          background: #fff6da;
        }

        .sendButton {
          width: 100%;
          padding: 15px 20px;
          border: none;
          border-radius: 16px;
          color: white;
          background: linear-gradient(
            135deg,
            #087b52,
            #0b9b67
          );
          font-family: inherit;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
        }

        .sendButton:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .message {
          padding: 12px;
          border-radius: 14px;
          background: #f5faf7;
          border: 1px solid #d4e8de;
          color: #315b4c;
          text-align: center;
          line-height: 1.8;
          font-weight: 800;
        }

        .consentSummary {
          margin: 14px auto 0;
          max-width: 620px;
          padding: 11px 14px;
          border-radius: 13px;
          line-height: 1.7;
          font-size: 13px;
          font-weight: 800;
        }

        .consentSummary.yes {
          color: #087b52;
          background: #eaf8f1;
        }

        .consentSummary.no {
          color: #765f2d;
          background: #fff6da;
        }

        .ideasTitle {
          color: #087b52;
          font-size: 21px;
          font-weight: 900;
          text-align: center;
        }

        .ideasGrid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 13px;
          margin-top: 19px;
        }

        .ideasGrid > div {
          display: grid;
          justify-items: center;
          gap: 7px;
          padding: 19px 13px;
          border-radius: 19px;
          background: #f9fcfa;
          border: 1px solid #e3eee9;
          text-align: center;
        }

        .ideasGrid span {
          font-size: 32px;
        }

        .ideasGrid strong {
          color: #087b52;
        }

        .ideasGrid small {
          color: #718078;
          line-height: 1.7;
        }

        .starCard {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          padding: 21px 24px;
          border-radius: 22px;
          border: 1px solid #ead178;
          background: linear-gradient(
            135deg,
            #fffdf1,
            #fff8d8
          );
        }

        .starIcon {
          font-size: 42px;
        }

        .starCard strong {
          color: #8a6500;
          font-size: 18px;
        }

        .starCard p {
          margin: 5px 0 0;
          color: #71623a;
          line-height: 1.7;
        }

        footer {
          margin-top: 25px;
          text-align: center;
          color: #a07818;
          font-size: 13px;
        }

        @media (max-width: 650px) {
          .page {
            padding: 18px 12px 40px;
          }

          .hero {
            padding: 34px 17px;
          }

          .introCard,
          .participationCard,
          .ideasCard,
          .statusCard,
          .revisionCard {
            padding: 20px 15px;
          }

          .typeGrid,
          .ideasGrid {
            grid-template-columns: 1fr;
          }

          .heroTags span {
            font-size: 13px;
          }

          .participationHeader,
          .sectionHeading {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

function ConsentSummary({
  consent,
}: {
  consent: boolean;
}) {
  return (
    <div
      className={`consentSummary ${
        consent ? "yes" : "no"
      }`}
    >
      {consent
        ? "✓ توجد موافقة من ولي الأمر على إمكانية نشر المشاركة في معرض الأكاديمية وركن TikTok بعد اعتماد المعلم."
        : "🔒 لا توجد موافقة على النشر العام. المشاركة مخصصة للمراجعة داخل الأكاديمية فقط."}
    </div>
  );
}