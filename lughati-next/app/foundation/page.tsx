"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type SkillStatus = "available" | "coming";

type FoundationSkill = {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  focus: string;
  duration: string;
  href: string;
  status: SkillStatus;
  order: number;
};

const skills: FoundationSkill[] = [
  {
    id: "harakat",
    title: "الحركات القصيرة",
    shortTitle: "الفتحة والضمة والكسرة",
    icon: "َ ُ ِ",
    description:
      "تمييز الحركات القصيرة وقراءة الحرف بالحركة المناسبة بصورة صحيحة.",
    focus: "صوت الحرف",
    duration: "4 دقائق",
    href: "/foundation/harakat",
    status: "available",
    order: 1,
  },
  {
    id: "madd",
    title: "حروف المد",
    shortTitle: "الألف والواو والياء",
    icon: "ا و ي",
    description:
      "التدرب على المقاطع الممدودة والتمييز بين المد والحركة القصيرة.",
    focus: "المدود",
    duration: "4 دقائق",
    href: "/foundation/madd",
    status: "available",
    order: 2,
  },
  {
    id: "sukoon",
    title: "السكون",
    shortTitle: "الحرف الساكن والمقطع الساكن",
    icon: "ْ",
    description:
      "التعرف على الحرف الساكن وقراءته داخل المقطع والكلمة بطريقة صحيحة.",
    focus: "المقاطع",
    duration: "4 دقائق",
    href: "/foundation/sukoon",
    status: "available",
    order: 3,
  },
  {
    id: "shadda",
    title: "الشدة",
    shortTitle: "قراءة الحرف المشدد",
    icon: "ّ",
    description:
      "فهم الشدة وقراءة الحرف المشدد ضمن كلمات مألوفة للطالب.",
    focus: "القراءة",
    duration: "4 دقائق",
    href: "/foundation/shadda",
    status: "available",
    order: 4,
  },
  {
    id: "tanween",
    title: "التنوين",
    shortTitle: "الفتح والضم والكسر",
    icon: "ً ٌ ٍ",
    description:
      "تمييز أنواع التنوين وقراءتها وكتابتها في كلمات مناسبة.",
    focus: "الإملاء",
    duration: "4 دقائق",
    href: "/foundation/tanween",
    status: "available",
    order: 5,
  },
  {
    id: "lam",
    title: "اللام الشمسية والقمرية",
    shortTitle: "أقرأها بطريقة صحيحة",
    icon: "ال",
    description:
      "التمييز بين اللام الشمسية والقمرية من خلال كلمات وصور وتدريب سريع.",
    focus: "القراءة",
    duration: "5 دقائق",
    href: "/foundation/lam",
    status: "available",
    order: 6,
  },
  {
    id: "syllables",
    title: "تحليل المقاطع",
    shortTitle: "أجزّئ الكلمة",
    icon: "🧩",
    description:
      "تحليل الكلمات إلى مقاطع صوتية بسيطة تساعد على القراءة والكتابة.",
    focus: "التحليل",
    duration: "5 دقائق",
    href: "/foundation/syllables",
    status:  "available",
    order: 7,
  },
  {
    id: "build-word",
    title: "تركيب الكلمات",
    shortTitle: "أبني الكلمة",
    icon: "🔤",
    description:
      "جمع الحروف والمقاطع لتكوين كلمات صحيحة بطريقة تفاعلية.",
    focus: "التركيب",
    duration: "5 دقائق",
    href: "/foundation/word-building",
status: "available",
    order: 8,
  },
  {
    id: "reading",
    title: "القراءة القصيرة",
    shortTitle: "أقرأ وأفهم",
    icon: "📖",
    description:
      "قراءة كلمات وجمل قصيرة ثم الإجابة عن سؤال فهم بسيط.",
    focus: "الطلاقة",
    duration: "5 دقائق",
    href: "/foundation/short-reading",
status: "available",
    order: 9,
  },
];

const availableSkills = skills.filter((skill) => skill.status === "available");

export default function FoundationPage() {
  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link href="/journey" style={styles.homeButton}>
  <span style={styles.homeButtonIcon}>←</span>
  العودة إلى رحلتي
</Link>

          <div style={styles.brandPill}>
            <span style={styles.brandIcon}>🌱</span>
            <div>
              <strong style={styles.brandTitle}>أساس لغتي</strong>
              <span style={styles.brandCaption}>أبني مهاراتي بثقة</span>
            </div>
          </div>
        </div>

        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <span style={styles.heroBadge}>🌱 مسار تأسيسي ذكي</span>

            <h1 style={styles.heroTitle}>
              أساس لغتي
              <span style={styles.heroTitleAccent}>
                معالجة الفاقد التعليمي للصف الأول الابتدائي
              </span>
            </h1>

            <p style={styles.heroDescription}>
              راجع معلوماتك، قوِّ مهاراتك، وانطلق بثقة. مهارات قصيرة ومركزة
              تساعدك على تثبيت أساس القراءة والكتابة دون حشو أو تدريبات طويلة.
            </p>

            <div style={styles.heroActions}>
              <Link href="/foundation/sukoon" style={styles.primaryAction}>
                <span>ابدأ مهمتي الحالية</span>
                <span>🚀</span>
              </Link>

              <a href="#skills" style={styles.secondaryAction}>
                استكشف المهارات
              </a>
            </div>
          </div>

          <div style={styles.heroVisual}>
            <div style={styles.heroVisualInner}>
              <div style={styles.heroPlant}>🌱</div>
              <div style={styles.heroVisualTitle}>خطوة صغيرة كل يوم</div>
              <div style={styles.heroVisualText}>
                تعلم قصير <span>•</span> تدريب <span>•</span> إتقان
              </div>

              <div style={styles.miniStats}>
                <div style={styles.miniStat}>
                  <strong>{skills.length}</strong>
                  <span>مهارات أساسية</span>
                </div>

                <div style={styles.miniStat}>
                  <strong>4–5</strong>
                  <span>دقائق للمهمة</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section id="skills" style={styles.skillsSection}>
          <div style={styles.sectionHeading}>
            <div>
              <span style={styles.sectionEyebrow}>خريطة المهارات</span>
              <h2 style={styles.sectionTitle}>رحلة تأسيسية في زاوية واحدة</h2>
              <p style={styles.sectionDescription}>
                كل مهارة لها مهمة قصيرة مستقلة. تبدأ بالمهارة التي تحتاجها،
                وعند الإتقان تنتقل إلى التالية.
              </p>
            </div>

            <div style={styles.progressSummary}>
              <span style={styles.progressSummaryLabel}>المتاح حاليًا</span>
              <strong style={styles.progressSummaryNumber}>
                {availableSkills.length} / {skills.length}
              </strong>
            </div>
          </div>

          <div style={styles.skillsGrid}>
            {skills.map((skill) => {
              const available = skill.status === "available";

              const cardContent = (
                <article
                  style={{
                    ...styles.skillCard,
                    ...(available ? styles.skillCardAvailable : {}),
                  }}
                >
                  <div style={styles.skillCardTop}>
                    <span
                      style={{
                        ...styles.skillOrder,
                        ...(available ? styles.skillOrderAvailable : {}),
                      }}
                    >
                      {skill.order}
                    </span>

                    <span
                      style={{
                        ...styles.skillStatus,
                        ...(available
                          ? styles.skillStatusAvailable
                          : styles.skillStatusComing),
                      }}
                    >
                      {available ? "متاحة الآن" : "قريبًا"}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.skillIcon,
                      ...(available ? styles.skillIconAvailable : {}),
                    }}
                  >
                    {skill.icon}
                  </div>

                  <div style={styles.skillBody}>
                    <span style={styles.skillFocus}>{skill.focus}</span>
                    <h3 style={styles.skillTitle}>{skill.title}</h3>
                    <div style={styles.skillShortTitle}>{skill.shortTitle}</div>
                    <p style={styles.skillDescription}>{skill.description}</p>
                  </div>

                  <div style={styles.skillFooter}>
                    <span style={styles.skillDuration}>⏱️ {skill.duration}</span>

                    <span
                      style={{
                        ...styles.skillAction,
                        ...(available ? styles.skillActionAvailable : {}),
                      }}
                    >
                      {available ? "ابدأ ←" : "🔒 قريبًا"}
                    </span>
                  </div>
                </article>
              );

              if (!available) {
                return (
                  <div key={skill.id} style={styles.skillWrapper}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={skill.id} href={skill.href} style={styles.skillLink}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>

        <section style={styles.methodSection}>
          <div style={styles.sectionHeadingCompact}>
            <span style={styles.sectionEyebrow}>كيف يعمل أساس لغتي؟</span>
            <h2 style={styles.sectionTitle}>رحلة قصيرة تنتهي بالإتقان</h2>
          </div>

          <div style={styles.methodGrid}>
            <MethodCard
              number="1"
              icon="👀"
              title="شاهد واكتشف"
              text="مثال واحد واضح يعرّف المهارة دون شرح طويل."
            />
            <MethodCard
              number="2"
              icon="✋"
              title="جرّب بنفسك"
              text="سؤال أو نشاط بسيط يساعدك على تطبيق ما شاهدته."
            />
            <MethodCard
              number="3"
              icon="📝"
              title="تدريب قصير"
              text="ورقة إلكترونية صغيرة تركز على المهارة فقط."
            />
            <MethodCard
              number="4"
              icon="🏆"
              title="تحقق من الإتقان"
              text="اختبار سريع يحدد هل أتقنت المهارة أم تحتاج تدريبًا إضافيًا."
            />
          </div>
        </section>

        <section style={styles.philosophyCard}>
          <div style={styles.philosophyIcon}>💡</div>

          <div>
            <span style={styles.philosophyEyebrow}>فكرة أساس لغتي</span>
            <h2 style={styles.philosophyTitle}>نراجع ما يحتاجه الطالب فقط</h2>
            <p style={styles.philosophyText}>
              الهدف ليس إعادة منهج الصف الأول، بل تثبيت المهارات المؤسسة التي
              يحتاجها الطالب ليستمر في تعلمه بثقة. لذلك تكون المهام قصيرة،
              مباشرة، وتنتقل بالطالب من التدريب إلى الإتقان.
            </p>
          </div>
        </section>

        <footer style={styles.footer}>
          <span>🌱 أساس لغتي</span>
          <span style={styles.footerDot}>•</span>
          <span>تعلم قصير، أثر أكبر</span>
        </footer>
      </div>
    </main>
  );
}

function MethodCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <article style={styles.methodCard}>
      <div style={styles.methodNumber}>{number}</div>
      <div style={styles.methodIcon}>{icon}</div>
      <h3 style={styles.methodTitle}>{title}</h3>
      <p style={styles.methodText}>{text}</p>
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #f3fbf7 0%, #fbfdfb 48%, #fffaf1 100%)",
    color: "#173e31",
    fontFamily: '"Tajawal", "Tahoma", "Arial", sans-serif',
    padding: "22px 14px 44px",
  },
  backgroundGlowOne: {
    position: "fixed",
    top: "-140px",
    right: "-100px",
    width: "340px",
    height: "340px",
    borderRadius: "50%",
    background: "rgba(35, 177, 111, 0.08)",
    filter: "blur(4px)",
    pointerEvents: "none",
  },
  backgroundGlowTwo: {
    position: "fixed",
    bottom: "-160px",
    left: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "rgba(245, 190, 74, 0.10)",
    filter: "blur(5px)",
    pointerEvents: "none",
  },
  container: {
    width: "100%",
    maxWidth: "1220px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  homeButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    color: "#166a4b",
    background: "#ffffff",
    border: "1px solid #d8e9e0",
    borderRadius: "16px",
    padding: "11px 15px",
    fontWeight: 900,
    boxShadow: "0 7px 20px rgba(25, 76, 57, 0.06)",
  },
  homeButtonIcon: { fontSize: "18px" },
  brandPill: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(232, 249, 240, 0.92)",
    border: "1px solid #cfe9dc",
    borderRadius: "18px",
    padding: "9px 13px",
  },
  brandIcon: { fontSize: "25px" },
  brandTitle: {
    display: "block",
    fontSize: "16px",
    color: "#116b4a",
  },
  brandCaption: {
    display: "block",
    marginTop: "1px",
    color: "#70847a",
    fontSize: "11px",
    fontWeight: 700,
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.65fr)",
    gap: "22px",
    background:
      "linear-gradient(135deg, #147d58 0%, #1ba66e 58%, #45c68b 100%)",
    borderRadius: "32px",
    padding: "clamp(25px, 4vw, 44px)",
    boxShadow: "0 24px 55px rgba(23, 125, 88, 0.20)",
    color: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },
  heroContent: { position: "relative", zIndex: 2 },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "999px",
    padding: "8px 13px",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "16px",
  },
  heroTitle: {
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontSize: "clamp(36px, 6vw, 62px)",
    lineHeight: 1.12,
  },
  heroTitleAccent: {
    display: "block",
    fontSize: "clamp(18px, 2.5vw, 26px)",
    color: "#dffff0",
    lineHeight: 1.6,
    fontWeight: 800,
  },
  heroDescription: {
    maxWidth: "760px",
    margin: "18px 0 0",
    color: "#f0fff8",
    fontSize: "clamp(15px, 2vw, 18px)",
    lineHeight: 1.95,
    fontWeight: 700,
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  primaryAction: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    textDecoration: "none",
    background: "#ffffff",
    color: "#126c4b",
    borderRadius: "16px",
    padding: "13px 18px",
    fontWeight: 900,
    boxShadow: "0 10px 22px rgba(7, 62, 42, 0.16)",
  },
  secondaryAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#ffffff",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "16px",
    padding: "12px 17px",
    fontWeight: 900,
  },
  heroVisual: {
    display: "grid",
    placeItems: "center",
    minHeight: "270px",
  },
  heroVisualInner: {
    width: "100%",
    maxWidth: "300px",
    borderRadius: "28px",
    padding: "24px 18px",
    textAlign: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  heroPlant: {
    fontSize: "70px",
    filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.10))",
  },
  heroVisualTitle: { marginTop: "6px", fontSize: "20px", fontWeight: 900 },
  heroVisualText: {
    display: "flex",
    justifyContent: "center",
    gap: "7px",
    flexWrap: "wrap",
    marginTop: "8px",
    color: "#eafff3",
    fontSize: "13px",
    fontWeight: 800,
  },
  miniStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: "8px",
    marginTop: "18px",
  },
  miniStat: {
    display: "grid",
    gap: "3px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "15px",
    padding: "10px",
  },
  currentMission: {
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    padding: "20px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f0fff7 62%, #fff8df 100%)",
    border: "2px solid #a8dfc2",
    borderRadius: "25px",
    boxShadow: "0 13px 32px rgba(19, 109, 73, 0.08)",
  },
  currentMissionContent: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flex: "1 1 520px",
  },
  currentMissionIcon: {
    width: "66px",
    height: "66px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #dbf8e8, #fff0b8)",
    fontSize: "32px",
    border: "1px solid #c9ead8",
  },
  currentMissionTextWrap: { minWidth: 0 },
  currentMissionEyebrow: {
    display: "block",
    color: "#9c6f00",
    fontSize: "12px",
    fontWeight: 900,
    marginBottom: "3px",
  },
  currentMissionTitle: { margin: 0, color: "#116a48", fontSize: "23px" },
  currentMissionText: {
    margin: "6px 0 0",
    color: "#63766c",
    lineHeight: 1.75,
    fontSize: "14px",
    fontWeight: 700,
  },
  currentMissionMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  durationPill: {
    background: "#ffffff",
    border: "1px solid #d5e8de",
    borderRadius: "13px",
    padding: "9px 11px",
    color: "#61746a",
    fontSize: "13px",
    fontWeight: 900,
  },
  availablePill: {
    background: "#e8f8ef",
    color: "#18774f",
    borderRadius: "13px",
    padding: "9px 11px",
    fontSize: "12px",
    fontWeight: 900,
  },
  missionButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    background: "#168a62",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "11px 15px",
    fontWeight: 900,
    boxShadow: "0 8px 18px rgba(22, 138, 98, 0.17)",
  },
  skillsSection: { marginTop: "42px" },
  sectionHeading: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  sectionHeadingCompact: { textAlign: "center", marginBottom: "18px" },
  sectionEyebrow: {
    display: "block",
    color: "#16845e",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "5px",
  },
  sectionTitle: {
    margin: 0,
    color: "#173f31",
    fontSize: "clamp(25px, 4vw, 34px)",
  },
  sectionDescription: {
    maxWidth: "720px",
    margin: "8px 0 0",
    color: "#687a70",
    fontSize: "14px",
    lineHeight: 1.8,
    fontWeight: 700,
  },
  progressSummary: {
    minWidth: "150px",
    background: "#ffffff",
    border: "1px solid #d9e9e1",
    borderRadius: "18px",
    padding: "12px 15px",
    boxShadow: "0 8px 22px rgba(28, 70, 54, 0.05)",
  },
  progressSummaryLabel: {
    display: "block",
    color: "#70837a",
    fontSize: "11px",
    fontWeight: 800,
  },
  progressSummaryNumber: {
    display: "block",
    marginTop: "3px",
    color: "#116c4b",
    fontSize: "22px",
  },
  skillsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },
  skillWrapper: { minWidth: 0 },
  skillLink: { minWidth: 0, textDecoration: "none", color: "inherit" },
  skillCard: {
    height: "100%",
    minHeight: "335px",
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid #dce9e3",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(27, 69, 53, 0.05)",
  },
  skillCardAvailable: {
    background: "linear-gradient(180deg, #ffffff 0%, #f0fff7 100%)",
    border: "2px solid #8fd4b2",
    boxShadow: "0 16px 38px rgba(24, 135, 93, 0.12)",
  },
  skillCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  skillOrder: {
    width: "31px",
    height: "31px",
    display: "grid",
    placeItems: "center",
    borderRadius: "10px",
    background: "#f0f4f2",
    color: "#66776e",
    fontSize: "12px",
    fontWeight: 900,
  },
  skillOrderAvailable: { background: "#dff6e9", color: "#116c4b" },
  skillStatus: {
    borderRadius: "999px",
    padding: "6px 9px",
    fontSize: "10px",
    fontWeight: 900,
  },
  skillStatusAvailable: { background: "#def7e8", color: "#14764f" },
  skillStatusComing: { background: "#f1f3f2", color: "#7b8982" },
  skillIcon: {
    width: "68px",
    height: "68px",
    display: "grid",
    placeItems: "center",
    marginTop: "17px",
    borderRadius: "20px",
    background: "#f4f7f5",
    border: "1px solid #e2ebe6",
    color: "#345f4d",
    fontSize: "25px",
    fontWeight: 900,
    letterSpacing: "3px",
  },
  skillIconAvailable: {
    background: "linear-gradient(135deg, #dff8eb, #fff3c9)",
    border: "1px solid #c6ead7",
    color: "#116a49",
  },
  skillBody: { marginTop: "16px" },
  skillFocus: { color: "#a57600", fontSize: "11px", fontWeight: 900 },
  skillTitle: { margin: "4px 0 0", color: "#173f31", fontSize: "21px" },
  skillShortTitle: {
    marginTop: "4px",
    color: "#537066",
    fontSize: "13px",
    fontWeight: 800,
  },
  skillDescription: {
    margin: "10px 0 0",
    color: "#718078",
    fontSize: "13px",
    lineHeight: 1.8,
    fontWeight: 700,
  },
  skillFooter: {
    marginTop: "auto",
    paddingTop: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  skillDuration: { color: "#6b7b73", fontSize: "11px", fontWeight: 900 },
  skillAction: {
    color: "#7f8c86",
    background: "#f2f5f3",
    borderRadius: "12px",
    padding: "8px 10px",
    fontSize: "11px",
    fontWeight: 900,
  },
  skillActionAvailable: {
    color: "#ffffff",
    background: "#168a62",
    boxShadow: "0 6px 14px rgba(22, 138, 98, 0.15)",
  },
  methodSection: { marginTop: "46px", padding: "30px 0 0" },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "13px",
  },
  methodCard: {
    position: "relative",
    background: "#ffffff",
    border: "1px solid #dceae3",
    borderRadius: "22px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 10px 24px rgba(27, 69, 53, 0.05)",
  },
  methodNumber: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "27px",
    height: "27px",
    display: "grid",
    placeItems: "center",
    borderRadius: "9px",
    background: "#edf8f2",
    color: "#167651",
    fontSize: "11px",
    fontWeight: 900,
  },
  methodIcon: { fontSize: "40px" },
  methodTitle: { margin: "8px 0 0", color: "#17422f", fontSize: "18px" },
  methodText: {
    margin: "7px 0 0",
    color: "#708078",
    fontSize: "13px",
    lineHeight: 1.75,
    fontWeight: 700,
  },
  philosophyCard: {
    marginTop: "34px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background:
      "linear-gradient(135deg, #fffdf8 0%, #ffffff 60%, #eefaf4 100%)",
    border: "1px solid #e5e6d9",
    borderRadius: "25px",
    padding: "22px",
    boxShadow: "0 12px 28px rgba(76, 71, 30, 0.05)",
  },
  philosophyIcon: {
    width: "66px",
    height: "66px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "20px",
    background: "#fff4c8",
    fontSize: "31px",
  },
  philosophyEyebrow: {
    display: "block",
    color: "#a07100",
    fontSize: "11px",
    fontWeight: 900,
  },
  philosophyTitle: { margin: "4px 0 0", color: "#173f31", fontSize: "21px" },
  philosophyText: {
    margin: "7px 0 0",
    color: "#697a71",
    lineHeight: 1.85,
    fontSize: "13px",
    fontWeight: 700,
  },
  footer: {
    marginTop: "28px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "9px",
    flexWrap: "wrap",
    color: "#74847c",
    fontSize: "12px",
    fontWeight: 800,
  },
  footerDot: { color: "#4bb783" },
};