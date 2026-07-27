type WeeklyReportCardProps = {
  completedTasks?: number;
  totalTasks?: number;
  strongestSkill?: string;
  supportSkill?: string;
  familyStep?: string;
};

export default function WeeklyReportCard({
  completedTasks = 8,
  totalTasks = 10,
  strongestSkill = "الإملاء",
  supportSkill = "الفهم القرائي",
  familyStep = "اقرؤوا معه فقرة قصيرة، ثم اطرحوا عليه سؤالين بسيطين.",
}: WeeklyReportCardProps) {
  const safeTotal = Math.max(totalTasks, 1);
  const safeCompleted = Math.min(
    Math.max(completedTasks, 0),
    safeTotal
  );

  const completionPercentage = Math.round(
    (safeCompleted / safeTotal) * 100
  );

  const reportMessage =
    completionPercentage >= 90
      ? "أسبوع متميز، وقد أظهر ابنكم التزامًا رائعًا واستمرارًا جميلًا."
      : completionPercentage >= 70
        ? "أظهر ابنكم تقدمًا جميلًا، وأكمل معظم مهامه خلال هذا الأسبوع."
        : completionPercentage >= 40
          ? "يسير ابنكم بخطوات جيدة، ويحتاج إلى متابعة قصيرة ومنتظمة."
          : "يحتاج ابنكم هذا الأسبوع إلى دعم هادئ وخطوات يومية بسيطة.";

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #f0fdf4 100%)",
        border: "1px solid #bfdbfe",
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
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#173b57",
            fontSize: "25px",
            fontWeight: 800,
          }}
        >
          📊 التقرير الأسبوعي
        </h2>

        <span
          style={{
            background: "#dbeafe",
            color: "#1d4ed8",
            borderRadius: "999px",
            padding: "7px 13px",
            fontSize: "15px",
            fontWeight: 800,
          }}
        >
          {completionPercentage}% إنجاز
        </span>
      </div>

      <p
        style={{
          margin: "0 0 18px",
          color: "#64748b",
          fontSize: "16px",
          lineHeight: 1.9,
          fontWeight: 600,
        }}
      >
        {reportMessage}
      </p>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #dbeafe",
          borderRadius: "20px",
          padding: "16px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
            color: "#334155",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          <span>✅ المهام المكتملة</span>
          <span>
            {safeCompleted} من {safeTotal}
          </span>
        </div>

        <div
          style={{
            height: "12px",
            background: "#e2e8f0",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${completionPercentage}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #38bdf8, #22c55e)",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "20px",
            padding: "16px",
          }}
        >
          <div
            style={{
              color: "#166534",
              fontSize: "15px",
              fontWeight: 800,
              marginBottom: "7px",
            }}
          >
            🌟 المهارة الأقوى
          </div>

          <div
            style={{
              color: "#14532d",
              fontSize: "19px",
              fontWeight: 900,
            }}
          >
            {strongestSkill}
          </div>
        </div>

        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "20px",
            padding: "16px",
          }}
        >
          <div
            style={{
              color: "#9a3412",
              fontSize: "15px",
              fontWeight: 800,
              marginBottom: "7px",
            }}
          >
            🎯 تحتاج دعمًا
          </div>

          <div
            style={{
              color: "#7c2d12",
              fontSize: "19px",
              fontWeight: 900,
            }}
          >
            {supportSkill}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fefce8",
          border: "1px solid #fde68a",
          borderRadius: "20px",
          padding: "17px",
        }}
      >
        <div
          style={{
            color: "#854d0e",
            fontSize: "16px",
            fontWeight: 900,
            marginBottom: "7px",
          }}
        >
          🤝 خطوة الأسرة للأسبوع القادم
        </div>

        <p
          style={{
            margin: 0,
            color: "#713f12",
            fontSize: "16px",
            lineHeight: 1.9,
            fontWeight: 700,
          }}
        >
          {familyStep}
        </p>
      </div>
    </section>
  );
}