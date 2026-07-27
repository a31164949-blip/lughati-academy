type CelebrationCardProps = {
  completedTasks?: number;
  totalTasks?: number;
};

export default function CelebrationCard({
  completedTasks = 8,
  totalTasks = 10,
}: CelebrationCardProps) {
  const percentage = Math.round(
    (completedTasks / Math.max(totalTasks, 1)) * 100
  );

  const completed = percentage >= 100;

  return (
    <section
      style={{
        borderRadius: "28px",
        padding: "24px",
        marginBottom: "22px",
        textAlign: "center",
        background: completed
          ? "linear-gradient(135deg,#fff7cc,#fff1a8,#ffe27a)"
          : "linear-gradient(135deg,#eef7ff,#ffffff,#f5fff8)",
        border: completed
          ? "2px solid #facc15"
          : "1px solid #bfdbfe",
        boxShadow: "0 10px 30px rgba(0,0,0,.07)",
      }}
    >
      {completed ? (
        <>
          <div style={{ fontSize: 48 }}>🎉✨🏆✨🎉</div>

          <h2
            style={{
              margin: "12px 0",
              color: "#854d0e",
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            أحسنت!
          </h2>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.9,
              color: "#713f12",
              fontWeight: 700,
            }}
          >
            أنهيت جميع مهامك لهذا الأسبوع.
            <br />
            فارس فخور بك 🌟
          </p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 42 }}>🌟</div>

          <h2
            style={{
              margin: "10px 0",
              color: "#1d4ed8",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            اقتربت من الإنجاز الكامل
          </h2>

          <p
            style={{
              fontSize: 19,
              lineHeight: 1.9,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            بقي {(totalTasks - completedTasks)} مهمة فقط
            <br />
            لتصبح بطل هذا الأسبوع.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "inline-block",
              background: "#22c55e",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            🚀 هيا نكمل معًا
          </div>
        </>
      )}
    </section>
  );
}