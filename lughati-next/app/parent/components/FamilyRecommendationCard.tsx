type FamilyRecommendationCardProps = {
  completedCount: number;
  totalCount: number;
};

const recommendationMessages = {
  complete:
    "🎉 احتفلوا بإنجازه اليوم، واطلبوا منه أن يخبركم بأكثر مهمة استمتع بها.",
  almostComplete:
    "🎤 استمعوا إلى قراءة ابنكم لمدة خمس دقائق، وشجعوه بهدوء على إكمال النشاط المتبقي.",
  progressing:
    "📚 اقرأوا معه فقرة قصيرة، ثم اسألوه عن الفكرة التي فهمها منها.",
  needsSupport:
    "💚 اختاروا مهمة واحدة فقط، وابدؤوا بها معه دون ضغط أو لوم.",
};

function getRecommendation(
  completedCount: number,
  totalCount: number
) {
  const remainingCount = totalCount - completedCount;

  if (totalCount === 0) {
    return recommendationMessages.needsSupport;
  }

  if (completedCount === totalCount) {
    return recommendationMessages.complete;
  }

  if (remainingCount === 1) {
    return recommendationMessages.almostComplete;
  }

  if (completedCount >= Math.ceil(totalCount / 2)) {
    return recommendationMessages.progressing;
  }

  return recommendationMessages.needsSupport;
}

export default function FamilyRecommendationCard({
  completedCount,
  totalCount,
}: FamilyRecommendationCardProps) {
  const recommendation = getRecommendation(
    completedCount,
    totalCount
  );

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #fffbea, #fffbeb)",
        border: "1px solid #fde68a",
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
        💡 توصية اليوم للأسرة
      </h2>

      <p
        style={{
          margin: 0,
          color: "#7c5a12",
          fontSize: "18px",
          lineHeight: 1.9,
          fontWeight: 600,
        }}
      >
        {recommendation}
      </p>
    </section>
  );
}