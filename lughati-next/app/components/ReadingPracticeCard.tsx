"use client";

import { useState } from "react";

const VIDEO = "/reading-practice/mahaseel-teacher-v1.mp4";

export default function ReadingPracticeCard() {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <section dir="rtl" aria-labelledby="reading-practice-title" style={{
      padding: "18px 20px", borderRadius: 22, border: "1px solid #cce5d7",
      background: "linear-gradient(120deg,#f0fbf5,#fffaf0)",
      boxShadow: "0 5px 18px rgba(23,108,70,.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <h2 id="reading-practice-title" style={{ margin: "0 0 5px", color: "#176c46", fontSize: 21 }}>
            🌱 أقرأ وأتدرّب
          </h2>
          <strong style={{ color: "#805f12", fontSize: 18 }}>مَحَاصِيلُ مِنْ بِلَادِي</strong>
          <p style={{ margin: "5px 0 0", color: "#576c60", lineHeight: 1.8, fontSize: 14 }}>
            استمع إلى معلمك، ثم ردّد واقرأ بنفسك.
            <span style={{ display: "block", fontSize: 12 }}>بصوت الأستاذ إبراهيم أحمد · دقيقة و١٤ ثانية</span>
          </p>
        </div>
        <button type="button" aria-expanded={open} aria-controls="reading-practice-player"
          onClick={() => { setOpen(value => !value); setFailed(false); }}
          style={{ padding: "11px 17px", minHeight: 44, borderRadius: 13, border: "1px solid #176c46", background: open ? "#fff" : "#176c46", color: open ? "#176c46" : "#fff", font: "inherit", fontWeight: 800, cursor: "pointer" }}>
          {open ? "إغلاق المقطع" : "▶ شاهد وتدرّب"}
        </button>
      </div>
      <div id="reading-practice-player" hidden={!open}>
        {open && (
          <div style={{ marginTop: 14, maxWidth: 800, marginInline: "auto" }}>
            <video controls playsInline preload="none" src={VIDEO}
              aria-label="تدريب قراءة كلمات محاصيل من بلادي بصوت المعلم إبراهيم أحمد"
              onError={() => setFailed(true)}
              style={{ display: "block", width: "100%", aspectRatio: "16 / 9", borderRadius: 15, background: "#123f35" }}>
              يمكن تحميل المقطع من الرابط أدناه.
            </video>
            {failed && <p role="alert" style={{ color: "#9a3412" }}>تعذّر تشغيل المقطع. جرّب فتحه من الرابط أدناه.</p>}
            <a href={VIDEO} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 9, color: "#176c46", fontWeight: 700, fontSize: 13 }}>فتح المقطع في صفحة مستقلة ↗</a>
          </div>
        )}
      </div>
    </section>
  );
}
