type WeeklyStarsCardProps = {
  readingStars?: number;
  spellingStars?: number;
  comprehensionStars?: number;
  badgesCount?: number;
  streakDays?: number;
};

type StarRowProps = {
  icon: string;
  label: string;
  value: number;
  maximum?: number;
};

function StarRow({
  icon,
  label,
  value,
  maximum = 5,
}: StarRowProps) {
  const safeValue = Math.max(0, Math.min(value, maximum));
  const filledStars = "⭐".repeat(safeValue);
  const emptyStars = "☆".repeat(maximum - safeValue);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "12px",
        padding: "13px 0",
        borderBottom: "1px solid #e0e7ff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#334155",
          fontSize: "17px",
          fontWeight: 700,
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      <div
        aria-label={`${value} من ${maximum} نجوم`}
        style={{
          direction: "ltr",
          whiteSpace: "nowrap",
          fontSize: "20px",
          letterSpacing: "2px",
        }}
      >
        <span>{filledStars}</span>
        <span style={{ color: "#94a3b8" }}>{emptyStars}</span>
      </div>
    </div>
  );
}

export default function WeeklyStarsCard({
  readingStars = 4,
  spellingStars = 5,
  comprehensionStars = 3,
  badgesCount = 2,
  streakDays = 5,
}: WeeklyStarsCardProps) {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #fffdf4, #f5f3ff)",
        border: "1px solid #ddd6fe",
        borderRadius: "28px",
        padding: "24px",
        marginBottom: "22px",
        boxShadow: "0 10px 30px rgba(23, 59, 87, 0.07)",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          color: "#173b57",
          fontSize: "25px",
          fontWeight: 800,
        }}
      >
        ⭐ نجوم هذا الأسبوع
      </h2>

      <p
        style={{
          margin: "0 0 10px",
          color: "#64748b",
          fontSize: "16px",
          lineHeight: 1.8,
          fontWeight: 600,
        }}
      >
        ملخص سريع لتقدم ابنكم خلال هذا الأسبوع.
      </p>

      <div>
        <StarRow
          icon="📚"
          label="القراءة"
          value={readingStars}
        />

        <StarRow
          icon="✍️"
          label="الإملاء"
          value={spellingStars}
        />

        <StarRow
          icon="📖"
          label="الفهم القرائي"
          value={comprehensionStars}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginTop: "18px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fde68a",
            borderRadius: "20px",
            padding: "16px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "26px", marginBottom: "6px" }}>
            🏆
          </div>

          <div
            style={{
              color: "#92400e",
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            {badgesCount}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            أوسمة
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderRadius: "20px",
            padding: "16px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "26px", marginBottom: "6px" }}>
            🔥
          </div>

          <div
            style={{
              color: "#c2410c",
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            {streakDays}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            أيام متتالية
          </div>
        </div>
      </div>

      <p
        style={{
          margin: "18px 0 0",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "14px",
          color: "#6d28d9",
          fontSize: "16px",
          lineHeight: 1.8,
          textAlign: "center",
          fontWeight: 800,
        }}
      >
        🌟 كل يوم جديد فرصة لإضافة نجمة جديدة.
      </p>
    </section>
  );
}