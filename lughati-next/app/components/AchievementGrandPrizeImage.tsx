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
  return (
    <div
      className="achievement-prize-image"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "220px",
        borderRadius: "21px",
        background: "linear-gradient(145deg,#f5fbff,#e9f9ff 58%,#effbef)",
        border: "2px solid #a6dabc",
        padding: "10px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px rgba(21,100,76,.08)",
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="السيارة الزرقاء ذات العجلات الكبيرة وجهاز التحكم عن بُعد، الجائزة الكبرى"
          loading="lazy"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            maxHeight: "325px",
            objectFit: "contain",
            objectPosition: "center center",
            borderRadius: "15px",
          }}
        />
      ) : (
        <div style={{ textAlign: "center", color: "#155a8d", padding: 24 }}>
          <div aria-hidden="true" style={{ fontSize: 64 }}>🏎️🎮</div>
          <strong>الجائزة الكبرى</strong>
        </div>
      )}
    </div>
  );
}
