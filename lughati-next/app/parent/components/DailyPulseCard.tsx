type DailyPulseCardProps = {
  completedCount: number;
  totalCount: number;
};

const pulseMessages = {
  complete:
    "🎉 أحسنتم، أكمل ابنكم جميع مهام اليوم. استمروا في الاحتفاء بإنجازه.",
  almostComplete:
    "🌱 أحسنتم، أنجز ابنكم معظم مهام اليوم، ولم يتبقَّ سوى نشاط واحد لإكمال رحلته اليومية.",
  progressing:
    "⭐ يسير ابنكم بخطوات جميلة، وتشجيعكم الآن يساعده على إكمال بقية المهام.",
  needsSupport:
    "🤝 يحتاج ابنكم إلى دعم بسيط اليوم. دقائق قليلة من التشجيع قد تصنع فرقًا كبيرًا.",
};

function getPulseMessage(completedCount: number, totalCount: number) {
  const remainingCount = totalCount - completedCount;

  if (completedCount === totalCount) {
    return pulseMessages.complete;
  }

  if (remainingCount === 1) {
    return pulseMessages.almostComplete;
  }

  if (completedCount >= Math.ceil(totalCount / 2)) {
    return pulseMessages.progressing;
  }

  return pulseMessages.needsSupport;
}

export default function DailyPulseCard({
  completedCount,
  totalCount,
}: DailyPulseCardProps) {
  const message = getPulseMessage(completedCount, totalCount);

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
        border: "1px solid #bbf7d0",
        borderRadius: "28px",
        padding: "24px",
        marginBottom: "22px",
        boxShadow: "0 10px 30px rgba(23, 59, 87, 0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "30px" }}>💚</span>

        <h2
          style={{
            margin: 0,
            color: "#173b57",
            fontSize: "25px",
            fontWeight: 800,
          }}
        >
          نبض اليوم
        </h2>
      </div>

      <p
        style={{
          margin: 0,
          color: "#276749",
          fontSize: "18px",
          lineHeight: 1.9,
          fontWeight: 600,
        }}
      >
        {message}
      </p>
    </section>
  );
}