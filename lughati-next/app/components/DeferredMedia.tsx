"use client";

import { auth } from "../../firebase";
import { useState, type VideoHTMLAttributes } from "react";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  kind: "audio" | "video";
  src: string;
};

// Keep remote media out of the DOM until the user explicitly requests it.
export default function DeferredMedia({ kind, src, style, ...props }: Props) {
  const [requestedSrc, setRequestedSrc] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState(src);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (requestedSrc !== src) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async (event) => {
          event.stopPropagation();
          setBusy(true);
          setError("");
          try {
            let resolved = src;
            if (src.startsWith("/api/media/video?")) {
              const user = auth.currentUser;
              const token = user ? await user.getIdToken() : "";
              const response = await fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
              const data = await response.json();
              if (!response.ok || !data.url) throw new Error(data.message || "تعذر تشغيل الفيديو.");
              resolved = data.url;
            }
            setPlaybackUrl(resolved);
            setRequestedSrc(src);
          } catch (error) {
            setError(error instanceof Error ? error.message : "تعذر تشغيل الفيديو.");
          } finally { setBusy(false); }
        }}
        style={{ ...style, minHeight: kind === "audio" ? 54 : 140,
          padding: 16, border: "1px solid #ddd", borderRadius: 12,
          background: "#f5f3ff", color: "#55349b", cursor: "pointer",
          font: "inherit" }}
      >
        {busy ? "جارٍ تجهيز الفيديو…" : error ? `${error} اضغط للمحاولة مجددًا` : kind === "audio" ? "▶ استمع إلى التسجيل" : "▶ تشغيل الفيديو"}
      </button>
    );
  }
  const Tag = kind === "audio" ? "audio" : "video";
  return <Tag {...props} key={src} src={playbackUrl} style={style} controls preload="none" autoPlay />;
}
