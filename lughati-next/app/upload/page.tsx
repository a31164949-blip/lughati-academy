import Link from "next/link";

export default function UploadPage() {
  const formUrl = "https://forms.gle/KtB82NMFYPbfz3Ua6";

  return (
    <main className="student-upload-page" dir="rtl">
      <section className="upload-header">
        <Link href="/" className="upload-back-link">
          العودة إلى الرئيسية ←
        </Link>

        <div className="upload-heading">
          <div className="upload-heading-icon">📤</div>

          <div>
            <span>شارك إنجازك</span>
            <h1>رفع أعمال الطلاب</h1>
            <p>
              أرسل صورة أو تسجيلًا صوتيًا أو مقطع فيديو ليشاهده معلمك.
            </p>
          </div>
        </div>
      </section>

      <section className="upload-welcome">
        <div>
          <span className="upload-badge">أرنا إبداعك يا بطل ⭐</span>
          <h2>خطوات بسيطة لإرسال عملك</h2>
          <p>
            اضغط الزر التالي، ثم اكتب بياناتك وارفع الملف من خلال النموذج
            الآمن.
          </p>
        </div>

        <div className="upload-mascot">👦🏻</div>
      </section>

      <section className="upload-content">
        <div className="upload-form">
          <div className="upload-section-title">
            <span>نموذج رفع الأعمال</span>
            <h2>أرسل عملك إلى المعلم</h2>
          </div>

          <div className="file-drop-area">
            <div>
              <div className="file-drop-icon">📁</div>
              <strong>رفع صورة أو صوت أو فيديو أو PDF</strong>
              <p>سيتم فتح نموذج Google Forms في صفحة جديدة.</p>
            </div>
          </div>

          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="upload-submit-button"
          >
            افتح نموذج رفع العمل
          </a>
        </div>

        <aside className="upload-guidelines">
          <div className="guidelines-icon">✨</div>
          <h2>قبل أن ترسل عملك</h2>

          <ul>
            <li>اكتب اسمك وفصلك بصورة صحيحة.</li>
            <li>تأكد أن الصورة أو التسجيل واضح.</li>
            <li>لا ترفع ملفات تحتوي على معلومات خاصة.</li>
            <li>سيراجع المعلم العمل قبل عرضه.</li>
          </ul>

          <div className="review-note">
            <span>🛡️</span>
            <p>
              لن يظهر العمل في معرض الطلاب إلا بعد موافقة المعلم.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}