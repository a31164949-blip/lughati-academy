import Link from "next/link";

const BLOG_URL = "https://exquisite-moxie-f87356.netlify.app/";

export default function AcademyBlogCard({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href={BLOG_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="زيارة مدونة أكاديمية لغتي في تبويب جديد"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(12px,2vw,22px)",
        padding: compact ? "17px 20px" : "20px 24px",
        margin: compact ? "12px 0 18px" : "16px auto 20px",
        maxWidth: compact ? undefined : "1180px",
        borderRadius: "23px",
        textDecoration: "none",
        color: "#16593e",
        background: "linear-gradient(125deg,#f0fdf5,#fff9e5 68%,#ffffff)",
        border: "2px solid #9ed7b2",
        boxShadow: "0 8px 22px rgba(23,108,70,.09)",
        direction: "rtl",
      }}
    >
      <span aria-hidden="true" style={{
        display: "grid", placeItems: "center", flexShrink: 0,
        width: compact ? "58px" : "66px", height: compact ? "58px" : "66px",
        borderRadius: "19px", background: "#d7f7e1", fontSize: "36px",
      }}>📚</span>
      <span style={{ display: "grid", gap: "4px", minWidth: 0, flex: 1 }}>
        <strong style={{ fontSize: "clamp(18px,2.5vw,23px)", lineHeight: 1.4 }}>
          مدونة أكاديمية لغتي
        </strong>
        <span style={{ fontSize: "clamp(12px,1.6vw,15px)", lineHeight: 1.7, color: "#536c5d" }}>
          يومياتنا، أنشطة القراءة والتأسيس، صور الإنجازات ومجلة مهارات لغتي
        </span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#14784c" }}>
          اضغط لزيارة المدونة في تبويب جديد
        </span>
      </span>
      <span aria-hidden="true" style={{ fontSize: "23px", color: "#127449" }}>↗</span>
    </Link>
  );
}
