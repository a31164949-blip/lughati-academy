type FamilyImpactCardProps = {
  completedCount: number;
  totalCount: number;
};

const familyImpactMessages = {
  complete: {
    title: "متابعتكم أثمرت اليوم 🌟",
    message:
      "أكمل ابنكم جميع مهامه اليوم. احتفاؤكم بإنجازه يساعده على الاستمرار بثقة وحماس.",
  },
  almostComplete: {
    title: "بقيت خطوة واحدة فقط 🌱",
    message:
      "أنجز ابنكم معظم مهامه اليوم. دقائق قليلة من دعمكم ستساعده على إكمال رحلته اليومية.",
  },
  progressing: {
    title: "دعمكم يصنع تقدمًا جميلًا 🤝",
    message:
      "يسير ابنكم بخطوات جيدة، ومتابعتكم الهادئة تشجعه على إتمام بقية المهام.",
  },
  needsSupport: {
    title: "وجودكم اليوم مهم 💚",
    message:
      "ابدؤوا معه بمهمة واحدة فقط دون ضغط. التشجيع البسيط قد يصنع فرقًا كبيرًا.",
  },
};

function getFamilyImpact(
  completedCount: number,
  totalCount: number
) {
  if (totalCount === 0) {
    return familyImpactMessages.needsSupport;
  }

  const remainingCount = totalCount - completedCount;

  if (completedCount === totalCount) {
    return familyImpactMessages.complete;
  }

  if (remainingCount === 1) {
    return familyImpactMessages.almostComplete;
  }

  if (completedCount >= Math.ceil(totalCount / 2)) {
    return familyImpactMessages.progressing;
  }

  return familyImpactMessages.needsSupport;
}

export default function FamilyImpactCard({
  completedCount,
  totalCount,
}: FamilyImpactCardProps) {
  const impact = getFamilyImpact(completedCount, totalCount);

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
        border: "1px solid #bbf7d0",
        borderRadius: "28px",
        padding: "24px",
        marginBottom: "22px",
        boxShadow: "0 10px 30px rgba(23, 59, 87, 0.07)",
      }}
    >
      <h2
        style={{
          margin: "0 0 14px",
          color: "#173b57",
          fontSize: "25px",
          fontWeight: 800,
        }}
      >
        🌱 أثر دعم الأسرة
      </h2>

      <h3
        style={{
          margin: "0 0 10px",
          color: "#166534",
          fontSize: "20px",
          fontWeight: 800,
        }}
      >
        {impact.title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#276749",
          fontSize: "18px",
          lineHeight: 1.9,
          fontWeight: 600,
        }}
      >
        {impact.message}
      </p>
    </section>
  );
}