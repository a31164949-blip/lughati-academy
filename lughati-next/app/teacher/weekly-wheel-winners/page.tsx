"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";

type Winner = {
  id: string;
  studentName: string;
  tier: "points" | "heroes";
  prizeLabel: string;
  prizeType: string;
  prizePoints: number;
  earnedPoints: number;
};

type WheelData = {
  success: boolean;
  weekKey?: string;
  summary?: {
    totalSpins: number;
    pointsWinners: number;
    otherPrizes: number;
    pointsAwarded: number;
  };
  winners?: Winner[];
  message?: string;
};

export default function WeeklyWheelWinnersPage() {
  const [data, setData] = useState<WheelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/teacher/weekly-wheel-winners", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = (await response.json()) as WheelData;
        setData(payload);
      } catch {
        setData({ success: false, message: "تعذر تحميل النتائج." });
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const winners = data?.winners ?? [];
  const points = winners.filter((item) => item.prizePoints > 0);
  const gifts = winners.filter((item) => item.prizePoints <= 0);

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#f4fbf7", padding: "24px 16px 50px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <Link href="/teacher" style={{ color: "#147a55", fontWeight: 900, textDecoration: "none" }}>
          ← العودة إلى لوحة المعلم
        </Link>

        <section style={{ marginTop: 16, padding: 24, borderRadius: 28, background: "linear-gradient(135deg,#0f7654,#168a63)", color: "white" }}>
          <div style={{ fontSize: 40 }}>🎡</div>
          <h1 style={{ margin: "6px 0", fontSize: "clamp(27px,5vw,40px)" }}>الفائزون في عجلة الحظ</h1>
          <p style={{ margin: 0, fontWeight: 700 }}>متابعة من حصد النقاط والجوائز خلال الأسبوع الحالي 🎯</p>
        </section>

        {loading ? (
          <p style={{ textAlign: "center", padding: 30, fontWeight: 800 }}>جارٍ تحميل النتائج…</p>
        ) : !data?.success ? (
          <p style={{ textAlign: "center", padding: 30, color: "#b42318", fontWeight: 900 }}>{data?.message}</p>
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, margin: "16px 0" }}>
              {[
                ["🎡 مرات استخدام العجلة", data.summary?.totalSpins ?? 0],
                ["⭐ حصدوا نقاطًا", data.summary?.pointsWinners ?? 0],
                ["🎁 جوائز ووسام", data.summary?.otherPrizes ?? 0],
                ["🏦 نقاط موزعة", data.summary?.pointsAwarded ?? 0],
              ].map(([label, value]) => (
                <article key={String(label)} style={{ background: "white", border: "1px solid #d8eadf", borderRadius: 18, padding: 14, textAlign: "center" }}>
                  <strong style={{ display: "block", fontSize: 25, color: "#176c46" }}>{value}</strong>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#52665c" }}>{label}</span>
                </article>
              ))}
            </section>

            <WinnerSection title="⭐ حصدوا نقاطًا من العجلة" items={points} empty="لم يحصد أحد نقاطًا من العجلة هذا الأسبوع بعد." />
            <WinnerSection title="🎁 الجوائز والأوسمة" items={gifts} empty="لا توجد جوائز أو أوسمة مسجلة هذا الأسبوع بعد." />
          </>
        )}
      </div>
    </main>
  );
}

function WinnerSection({ title, items, empty }: { title: string; items: Winner[]; empty: string }) {
  return (
    <section style={{ background: "white", border: "1px solid #d8eadf", borderRadius: 24, padding: 18, marginTop: 14 }}>
      <h2 style={{ marginTop: 0, color: "#17352a" }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ color: "#6b7d74", fontWeight: 700 }}>{empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {items.map((item) => (
            <article key={item.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "12px 14px", borderRadius: 16, background: "#f8fcfa", border: "1px solid #e1eee7" }}>
              <div>
                <strong style={{ color: "#17352a" }}>{item.studentName}</strong>
                <div style={{ marginTop: 4, color: "#65766e", fontSize: 13, fontWeight: 700 }}>
                  {item.tier === "heroes" ? "عجلة 60 نقطة" : "عجلة 30 نقطة"} • وصل إلى {item.earnedPoints} نقطة
                </div>
              </div>
              <span style={{ padding: "7px 11px", borderRadius: 999, background: item.prizePoints > 0 ? "#fff6d9" : "#eef7ff", fontWeight: 900, color: "#6d5700" }}>
                {item.prizeLabel}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
