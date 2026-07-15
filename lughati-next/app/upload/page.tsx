"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "../../firebase";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function UploadPage() {
  const [studentName, setStudentName] = useState("");
  const [classroom, setClassroom] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const fileTypeLabel = file?.type.startsWith("image/")
    ? "صورة"
    : file?.type.startsWith("audio/")
      ? "تسجيل صوتي"
      : file?.type.startsWith("video/")
        ? "فيديو"
        : "ملف";

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setMessage("");
    setIsSuccess(false);
    setProgress(0);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const isAllowed =
      selectedFile.type.startsWith("image/") ||
      selectedFile.type.startsWith("audio/") ||
      selectedFile.type.startsWith("video/");

    if (!isAllowed) {
      setFile(null);
      setMessage("اختر صورة أو تسجيلًا صوتيًا أو مقطع فيديو.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setMessage("حجم الملف كبير. الحد الأقصى المسموح به 100 ميجابايت.");
      return;
    }

    setFile(selectedFile);
  };

  const resetForm = () => {
    setStudentName("");
    setClassroom("");
    setWorkTitle("");
    setFile(null);
    setProgress(0);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!studentName.trim() || !classroom || !workTitle.trim() || !file) {
      setIsSuccess(false);
      setMessage("أكمل جميع البيانات واختر ملفًا قبل الإرسال.");
      return;
    }

    setIsUploading(true);
    setIsSuccess(false);
    setMessage("");
    setProgress(0);

    try {
      const safeFileName = file.name.replace(/[^\w.\-\u0600-\u06FF]/g, "_");
      const filePath = `student-uploads/${Date.now()}-${safeFileName}`;
      const storageReference = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageReference, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const uploadProgress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

          setProgress(Math.round(uploadProgress));
        },
        (error) => {
          console.error(error);
          setIsUploading(false);
          setIsSuccess(false);
          setMessage(
            "تعذر رفع الملف. تأكد من تفعيل Firebase Storage وصلاحيات الرفع.",
          );
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, "studentSubmissions"), {
            studentName: studentName.trim(),
            classroom,
            workTitle: workTitle.trim(),
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: downloadUrl,
            storagePath: filePath,
            status: "pending",
            createdAt: serverTimestamp(),
          });

          setIsUploading(false);
          setIsSuccess(true);
          setMessage("تم رفع عملك بنجاح، وسيشاهده المعلم بعد المراجعة ⭐");
          resetForm();
        },
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      setIsSuccess(false);
      setMessage("حدث خطأ أثناء الرفع. حاول مرة أخرى.");
    }
  };

  return (
    <main className="student-upload-page" dir="rtl">
      <header className="upload-header">
        <Link href="/" className="upload-back-link">
          → العودة إلى الرئيسية
        </Link>

        <div className="upload-heading">
          <div className="upload-heading-icon">📤</div>

          <div>
            <span>شارك إنجازك</span>
            <h1>رفع أعمال الطلاب</h1>
            <p>ارفع صورة أو تسجيلًا صوتيًا أو مقطع فيديو ليشاهده معلمك.</p>
          </div>
        </div>
      </header>

      <section className="upload-welcome">
        <div>
          <span className="upload-badge">أرنا إبداعك يا بطل ⭐</span>
          <h2>خطوات بسيطة لإرسال عملك</h2>
          <p>
            اكتب اسمك واختر فصلك، ثم أضف عنوان العمل واختر الملف واضغط إرسال.
          </p>
        </div>

        <div className="upload-mascot">🧒🏻</div>
      </section>

      <section className="upload-content">
        <form className="upload-form" onSubmit={handleUpload}>
          <div className="upload-section-title">
            <span>بيانات الطالب</span>
            <h2>عرّفنا بنفسك</h2>
          </div>

          <div className="upload-fields-grid">
            <label>
              <span>اسم الطالب</span>
              <input
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="اكتب اسمك الثلاثي"
                disabled={isUploading}
              />
            </label>

            <label>
              <span>الفصل</span>
              <select
                value={classroom}
                onChange={(event) => setClassroom(event.target.value)}
                disabled={isUploading}
              >
                <option value="">اختر الفصل</option>
                <option value="الثاني أ">الثاني أ</option>
                <option value="الثاني ب">الثاني ب</option>
              </select>
            </label>
          </div>

          <label className="upload-title-field">
            <span>عنوان العمل</span>
            <input
              type="text"
              value={workTitle}
              onChange={(event) => setWorkTitle(event.target.value)}
              placeholder="مثال: قراءتي لقصة قصيرة"
              disabled={isUploading}
            />
          </label>

          <div className="upload-section-title">
            <span>اختر نوع العمل</span>
            <h2>صورة أو صوت أو فيديو</h2>
          </div>

          <label className="file-drop-area">
            <input
              type="file"
              accept="image/*,audio/*,video/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <div className="file-drop-icon">📁</div>
            <strong>اضغط هنا لاختيار الملف</strong>
            <p>الحد الأقصى لحجم الملف: 100 ميجابايت</p>
          </label>

          {file && (
            <div className="selected-file-card">
              {previewUrl ? (
                <img src={previewUrl} alt="معاينة العمل" />
              ) : (
                <div className="selected-file-icon">
                  {file.type.startsWith("audio/")
                    ? "🎙️"
                    : file.type.startsWith("video/")
                      ? "🎬"
                      : "📄"}
                </div>
              )}

              <div>
                <span>{fileTypeLabel}</span>
                <strong>{file.name}</strong>
                <small>
                  {(file.size / 1024 / 1024).toFixed(2)} ميجابايت
                </small>
              </div>

              {!isUploading && (
                <button type="button" onClick={() => setFile(null)}>
                  حذف
                </button>
              )}
            </div>
          )}

          {isUploading && (
            <div className="upload-progress-area">
              <div className="upload-progress-heading">
                <span>جاري رفع الملف…</span>
                <strong>{progress}%</strong>
              </div>

              <div className="upload-progress-track">
                <div
                  className="upload-progress-value"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {message && (
            <div
              className={
                isSuccess
                  ? "upload-message upload-success"
                  : "upload-message upload-error"
              }
            >
              {isSuccess ? "✅" : "⚠️"} {message}
            </div>
          )}

          <button
            type="submit"
            className="upload-submit-button"
            disabled={isUploading}
          >
            {isUploading ? "جاري الرفع…" : "إرسال العمل إلى المعلم 📤"}
          </button>
        </form>

        <aside className="upload-guidelines">
          <div className="guidelines-icon">✨</div>
          <h2>قبل أن ترسل عملك</h2>

          <ul>
            <li>تأكد أن الصورة أو التسجيل واضح.</li>
            <li>اكتب اسمك وفصلك بصورة صحيحة.</li>
            <li>لا ترفع ملفات تحتوي على معلومات خاصة.</li>
            <li>سيُراجع المعلم العمل قبل عرضه.</li>
          </ul>

          <div className="review-note">
            <span>🛡️</span>
            <p>لن يظهر العمل في معرض الطلاب إلا بعد موافقة المعلم.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}