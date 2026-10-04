"use client";

import { useState, type VideoHTMLAttributes } from "react";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  kind: "audio" | "video";
  src: string;
};

// Keep remote media out of the DOM until the user explicitly requests it.
export default function DeferredMedia({ kind, src, style, ...props }: Props) {
  const [requestedSrc, setRequestedSrc] = useState<string | null>(null);
  if (requestedSrc !== src) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setRequestedSrc(src);
        }}
        style={{ ...style, minHeight: kind === "audio" ? 54 : 140,
          padding: 16, border: "1px solid #ddd", borderRadius: 12,
          background: "#f5f3ff", color: "#55349b", cursor: "pointer",
          font: "inherit" }}
      >
        {kind === "audio" ? "▶ استمع إلى التسجيل" : "▶ تشغيل الفيديو"}
      </button>
    );
  }
  const Tag = kind === "audio" ? "audio" : "video";
  return <Tag {...props} key={src} src={src} style={style} controls preload="none" autoPlay />;
}
