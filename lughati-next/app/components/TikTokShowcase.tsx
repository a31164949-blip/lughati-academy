const TIKTOK_ACCOUNT_URL = "https://www.tiktok.com/@ebrah261e";

export default function TikTokShowcase() {
  return (
    <section
      dir="rtl"
      aria-labelledby="tiktok-section-title"
      style={{
        maxWidth: "1180px",
        margin: "14px auto 18px",
        padding: "clamp(18px, 3vw, 26px)",
        borderRadius: "24px",
        border: "1px solid #d4eade",
        background: "linear-gradient(135deg, #ffffff 0%, #eef9f4 62%, #fff8df 100%)",
        boxShadow: "0 12px 28px rgba(24, 75, 57, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "18px",
          flexWrap: "wrap",
          padding: "clamp(18px, 3vw, 24px)",
          borderRadius: "18px",
          background: "#09090b",
          color: "#ffffff",
          boxShadow: "inset 3px 0 0 #25F4EE, inset -3px 0 0 #FE2C55",
        }}
      >
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          <span style={{ color: "#25F4EE", fontSize: "13px", fontWeight: 900 }}>
            🎬 أكاديمية لغتي على تيك توك
          </span>
          <h2
            id="tiktok-section-title"
            style={{ margin: "6px 0", color: "#ffffff", fontSize: "clamp(22px, 3.5vw, 30px)", lineHeight: 1.35 }}
          >
            قناتنا على تيك توك
          </h2>
          <p style={{ margin: 0, color: "#e5e7eb", fontSize: "15px", lineHeight: 1.8 }}>
            شاهد مقاطع الأكاديمية وأنشطتها التعليمية على قناتنا في تيك توك.
          </p>
        </div>

        <a
          href={TIKTOK_ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flex: "0 1 260px",
            minHeight: "48px",
            padding: "11px 16px",
            borderRadius: "14px",
            background: "#09090b",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 900,
            textAlign: "center",
            border: "1px solid #25F4EE",
            boxShadow: "3px 3px 0 #FE2C55, -3px -3px 0 #25F4EE",
          }}
        >
          شاهد المقاطع على تيك توك ↗
        </a>
      </div>

    </section>
  );
}
