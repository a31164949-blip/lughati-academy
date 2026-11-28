import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./ReadingWorld.module.css";

export const metadata: Metadata = {
  title: "عالم القراءة | أكاديمية لغتي الرقمية",
  description: "ثلاثة مسارات للقراءة في أكاديمية لغتي الرقمية.",
};

const paths = [
  { title: "قراءة المنهج", icon: "📘", label: "تقييم المعلم", tone: "blue",
    text: "اقرأ درس اليوم حسب الخطة، وأرسل تسجيلك ليقيّم المعلم قراءتك.",
    action: "اقرأ درس اليوم", href: "/curriculum-reading" },
  { title: "رحلة القراءة", icon: "🎙️", label: "تدريب ونقاط", tone: "green",
    text: "اقرأ نصف دقيقة، وطوّر مستواك، واجمع النقاط حتى تصل إلى هديتك.",
    action: "سجّل قراءتك", href: "/reading-journey" },
  { title: "تحدي القراءة", icon: "🏅", label: "مستويات وأوسمة", tone: "gold",
    text: "اختبر مستواك، وتدرّج حتى تبلغ الطلاقة، وتنال وسام التميّز والتكريم.",
    action: "اختبر مستواك", href: "/reading-journey/fluency-levels" },
] as const;

export default function ReadingWorldPage() {
  return (
    <main className={styles.world} dir="rtl">
      <div className={styles.shell}>
        <Link className={styles.back} href="/journey" prefetch={false}>
          <span aria-hidden>↩</span> العودة إلى رحلتي
        </Link>
        <header className={styles.hero}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>أكاديمية لغتي الرقمية</span>
            <h1>عالم القراءة</h1>
            <p>صفحةٌ جديدة، ومغامرةٌ تبدأ بكلمة.</p>
            <p className={styles.hint}>اختر مسارك وابدأ القراءة اليوم.</p>
          </div>
          <Image
            className={styles.illustration}
            src="/reading-world-reader.svg"
            width={560} height={360}
            alt="طفل يقرأ كتابًا تحت شجرة"
            unoptimized
          />
        </header>
        <section className={styles.paths} aria-labelledby="reading-paths">
          <h2 id="reading-paths">اختر مسار القراءة</h2>
          <div className={styles.grid}>
            {paths.map((path) => (
              <article key={path.href} className={styles.card} data-tone={path.tone}>
                <div className={styles.cardTop}>
                  <span className={styles.icon} aria-hidden>{path.icon}</span>
                  <span className={styles.label}>{path.label}</span>
                </div>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
                <Link className={styles.action} href={path.href} prefetch={false}>
                  {path.action} <span aria-hidden>←</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
