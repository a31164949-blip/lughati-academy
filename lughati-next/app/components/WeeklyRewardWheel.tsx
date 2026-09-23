"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

type Tier = "points" | "heroes";
type SpinResult = {
  prizeLabel?: string;
  prizeType?: string;
  prizePoints?: number;
};
type WheelState = {
  success: boolean;
  active: boolean;
  statusMessage: string;
  earnedPoints: number;
  targets: { points: number; heroes: number };
  spins: { points: SpinResult | null; heroes: SpinResult | null };
  message?: string;
};

export default function WeeklyRewardWheel() {
  const [data, setData] = useState<WheelState | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState<Tier | null>(null);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState("");

  async function load() {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch("/api/student-journey/weekly-wheel", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = (await response.json()) as WheelState;
    if (response.ok) setData(body);
    else setMessage(body.message || "تعذر تحميل العجلة.");
    setLoading(false);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) void load();
      else setLoading(false);
    });
  }, []);

  const nextTarget = useMemo(() => {
    if (!data) return 30;
    if (data.earnedPoints < data.targets.points) return data.targets.points;
    return data.targets.heroes;
  }, [data]);

  async function spin(tier: Tier) {
    const user = auth.currentUser;
    if (!user || spinning) return;
    setSpinning(tier);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/student-journey/weekly-wheel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "تعذر تشغيل العجلة.");
      setRotation((current) => current + 1440 + Math.floor(Math.random() * 300));
      await new Promise((resolve) => setTimeout(resolve, 1700));
      setMessage(
        body.result?.prizeType === "physical-gift"
          ? "🎉 مبروك! ربحت هدية عينية من معلّمك. ستظهر للمعلم لتجهيزها."
          : `🎉 مبروك! جائزتك: ${body.result?.prizeLabel || "مفاجأة جميلة"}`
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تشغيل العجلة.");
    } finally {
      setSpinning(null);
    }
  }

  if (loading) {
    return <div style={cardStyle}>⏳ جارٍ تجهيز مكافأتك الأسبوعية...</div>;
  }
  if (!data) {
    return <div style={cardStyle}>🎁 {message || "تعذر تحميل المكافأة الأسبوعية."}</div>;
  }

  const progress = Math.min(100, Math.round((data.earnedPoints / nextTarget) * 100));
  const pointsUnlocked = data.earnedPoints >= data.targets.points;
  const heroesUnlocked = data.earnedPoints >= data.targets.heroes;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 36 }}>🎁</div>
          <h3 style={{ margin: "4px 0 6px", color: "#7b5c00" }}>عجلة هديتك الأسبوعية</h3>
          <p style={{ margin: 0, color: "#6e623a", lineHeight: 1.8 }}>
            أكمل إنجازاتك واجمع النقاط، ثم افتح عجلتك واربح جائزتك.
          </p>
        </div>
        <div style={{ textAlign: "center", minWidth: 116, padding: "10px 14px", borderRadius: 18, background: "#fff" }}>
          <strong style={{ display: "block", fontSize: 25, color: "#176c46" }}>{data.earnedPoints}</strong>
          <span style={{ color: "#6b7280", fontWeight: 800 }}>نقطة إنجاز</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#715d24", fontWeight: 800 }}>
          <span>{data.earnedPoints >= 60 ? "اكتملت أهداف الأسبوع 🌟" : `هدفك التالي: ${nextTarget} نقطة`}</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: 14, marginTop: 7, borderRadius: 999, background: "#f2e7bc", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, borderRadius: 999, background: "linear-gradient(90deg,#15905d,#f1bd2c)", transition: "width .5s ease" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 16 }}>
        <WheelTierCard
          title="عجلة النقاط"
          target={data.targets.points}
          detail="جوائز من 2 إلى 10 نقاط"
          unlocked={pointsUnlocked}
          active={data.active}
          spun={data.spins.points}
          spinning={spinning === "points"}
          rotation={rotation}
          onSpin={() => void spin("points")}
        />
        <WheelTierCard
          title="عجلة الأبطال"
          target={data.targets.heroes}
          detail="نقاط، وسام، أو هدية عينية من المعلّم"
          unlocked={heroesUnlocked}
          active={data.active}
          spun={data.spins.heroes}
          spinning={spinning === "heroes"}
          rotation={rotation}
          onSpin={() => void spin("heroes")}
        />
      </div>

      <p style={{ margin: "14px 0 0", padding: "10px 12px", borderRadius: 14, background: data.active ? "#eaf8f1" : "#fff3df", color: data.active ? "#176c46" : "#8a5a00", fontWeight: 800, lineHeight: 1.7 }}>
        🗓️ {data.statusMessage}
      </p>
      <p style={{ margin: "8px 0 0", color: "#7b6b46", fontSize: 13 }}>
        نقاط الجوائز لا تدخل في عدّاد فتح العجلة التالية، ولكل عجلة محاولة واحدة أسبوعيًا.
      </p>
      {message && <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "#fff7d6", color: "#7b5c00", fontWeight: 900 }}>{message}</div>}
    </div>
  );
}

function WheelTierCard({
  title,
  target,
  detail,
  unlocked,
  active,
  spun,
  spinning,
  rotation,
  onSpin,
}: {
  title: string;
  target: number;
  detail: string;
  unlocked: boolean;
  active: boolean;
  spun: SpinResult | null;
  spinning: boolean;
  rotation: number;
  onSpin: () => void;
}) {
  const disabled = !unlocked || !active || Boolean(spun) || spinning;
  return (
    <div style={{ padding: 15, borderRadius: 20, background: "#fff", border: unlocked ? "2px solid #e6bd3f" : "2px solid #e7dfc8", textAlign: "center" }}>
      <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 10px" }}>
        <div style={{ position: "absolute", zIndex: 2, top: -5, left: "50%", transform: "translateX(-50%)", color: "#9a6400" }}>▼</div>
        <div style={{ width: 90, height: 90, borderRadius: "50%", border: "5px solid #fff", boxShadow: "0 4px 14px rgba(76,55,0,.18)", background: "conic-gradient(#15905d 0 60deg,#f6c945 60deg 120deg,#ef7f5a 120deg 180deg,#4a90e2 180deg 240deg,#9b6bd3 240deg 300deg,#15905d 300deg)", transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 1.7s cubic-bezier(.17,.67,.16,1)" : "none" }} />
      </div>
      <strong style={{ display: "block", color: "#176c46", fontSize: 18 }}>{title} — {target} نقطة</strong>
      <span style={{ display: "block", minHeight: 42, margin: "7px 0", color: "#6b7280", lineHeight: 1.6 }}>{detail}</span>
      {spun ? (
        <div style={{ padding: "10px 8px", borderRadius: 13, background: "#eaf8f1", color: "#176c46", fontWeight: 900 }}>✅ جائزتك: {spun.prizeLabel}</div>
      ) : (
        <button type="button" onClick={onSpin} disabled={disabled} style={{ width: "100%", border: 0, borderRadius: 13, padding: "11px 10px", background: disabled ? "#d9d6c9" : "#178b5a", color: "#fff", fontWeight: 900, cursor: disabled ? "not-allowed" : "pointer" }}>
          {spinning ? "العجلة تدور... ✨" : !active ? "العجلة مغلقة" : unlocked ? "أدر العجلة الآن 🎡" : `تفتح عند ${target} نقطة 🔒`}
        </button>
      )}
    </div>
  );
}

const cardStyle = {
  border: "2px solid #efd269",
  background: "linear-gradient(135deg,#fff8d9,#fffdf4)",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 10px 25px rgba(130,90,20,.08)",
  color: "#17352a",
} as const;
