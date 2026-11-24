"use client";
import { useEffect, useState } from "react";

export default function AchievementGrandPrizeImage() {
  const [imageUrl, setImageUrl] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/achievement-prize")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (active && typeof data?.imageUrl === "string" && data.imageUrl.startsWith("https://res.cloudinary.com/ffv5igmg/image/upload/"))
          setImageUrl(data.imageUrl);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return <div style={{ width: "min(100%,200px)", minHeight: "135px", flex: "0 1 200px", borderRadius: "15px", background: "#e9f7ff", display: "grid", placeItems: "center", overflow: "hidden", border: "1px solid #b9e2f2" }}>
    {imageUrl ?
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="السيارة الزرقاء ذات العجلات الكبيرة وجهاز التحكم عن بُعد، الجائزة الكبرى" loading="lazy" style={{ width: "100%", height: "100%", maxHeight: "175px", objectFit: "contain" }} /> :
      <div style={{ padding: "18px", textAlign: "center", color: "#155a8d" }}><span aria-hidden="true" style={{ fontSize: 50 }}>🏎️🎮</span><div style={{ fontSize: 12, fontWeight: 800 }}>الجائزة الكبرى</div></div>}
  </div>;
}
