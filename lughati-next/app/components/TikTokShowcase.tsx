"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

const TIKTOK_ACCOUNT_URL = "https://www.tiktok.com/@ebrah261e";
const TIKTOK_CACHE_KEY = "academy-home-tiktok-showcase-v1";
const TIKTOK_CACHE_DURATION_MS = 10 * 60 * 1000;
const MAX_PUBLIC_ITEMS = 6;

const defaultCoverStyle = {
  display: "grid",
  placeItems: "center",
  height: "100%",
  padding: "16px",
  background:
    "linear-gradient(135deg, #0f6546 0%, #16845b 48%, #f4c95d 100%)",
  color: "#ffffff",
  textAlign: "center" as const,
};

type TikTokItem = {
  id: string;
  title: string;
  tiktokUrl: string;
  coverImageUrl: string;
  description: string;
  classroom: string;
  studentDisplayName: string;
};

type CacheEntry = {
  cachedAt: number;
  items: TikTokItem[];
};

function readCachedItems() {
  try {
    const raw = sessionStorage.getItem(TIKTOK_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEntry;
    if (
      typeof parsed.cachedAt !== "number" ||
      Date.now() - parsed.cachedAt >= TIKTOK_CACHE_DURATION_MS ||
      !Array.isArray(parsed.items)
    ) {
      sessionStorage.removeItem(TIKTOK_CACHE_KEY);
      return null;
    }

    return parsed.items;
  } catch {
    return null;
  }
}

function writeCachedItems(items: TikTokItem[]) {
  try {
    sessionStorage.setItem(
      TIKTOK_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), items })
    );
  } catch {
    // التخزين المؤقت اختياري ولا يمنع عرض الركن.
  }
}

function normalizeItem(id: string, data: Record<string, unknown>): TikTokItem | null {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const tiktokUrl = typeof data.tiktokUrl === "string" ? data.tiktokUrl.trim() : "";

  if (!title || !tiktokUrl) return null;

  return {
    id,
    title,
    tiktokUrl,
    coverImageUrl:
      typeof data.coverImageUrl === "string" ? data.coverImageUrl.trim() : "",
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    classroom:
      typeof data.classroom === "string" ? data.classroom.trim() : "",
    studentDisplayName:
      typeof data.studentDisplayName === "string"
        ? data.studentDisplayName.trim().split(/\s+/)[0] || ""
        : "",
  };
}

export default function TikTokShowcase() {
  const [items, setItems] = useState<TikTokItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      const cachedItems = readCachedItems();
      if (cachedItems) {
        setItems(cachedItems);
        setLoading(false);
        return;
      }

      try {
        const showcaseQuery = query(
          collection(db, "tiktokShowcase"),
          where("published", "==", true),
          orderBy("displayOrder", "asc"),
          limit(MAX_PUBLIC_ITEMS)
        );
        const snapshot = await getDocs(showcaseQuery);
        const loadedItems = snapshot.docs
          .map((documentSnapshot) =>
            normalizeItem(
              documentSnapshot.id,
              documentSnapshot.data() as Record<string, unknown>
            )
          )
          .filter((item): item is TikTokItem => item !== null);

        if (!active) return;
        setItems(loadedItems);
        writeCachedItems(loadedItems);
      } catch (error) {
        console.error("تعذر تحميل مختارات TikTok:", error);
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadItems();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      dir="rtl"
      aria-labelledby="tiktok-section-title"
      style={{
        maxWidth: "1180px",
        margin: "14px auto 18px",
        padding: "clamp(18px, 3vw, 26px)",
        borderRadius: "24px",
        border: "1px solid #d4eade",
        background: "linear-gradient(135deg, #ffffff 0%, #eef9f4 62%, #fff8df 100%)",
        boxShadow: "0 12px 28px rgba(24, 75, 57, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "18px",
          flexWrap: "wrap",
          padding: "clamp(18px, 3vw, 24px)",
          borderRadius: "18px",
          background: "#09090b",
          color: "#ffffff",
          boxShadow: "inset 3px 0 0 #25F4EE, inset -3px 0 0 #FE2C55",
        }}
      >
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          <span style={{ color: "#25F4EE", fontSize: "13px", fontWeight: 900 }}>
            🎬 أكاديمية لغتي على تيك توك
          </span>
          <h2
            id="tiktok-section-title"
            style={{ margin: "6px 0", color: "#ffffff", fontSize: "clamp(22px, 3.5vw, 30px)", lineHeight: 1.35 }}
          >
            شاهد، تعلّم، وتحدَّ نفسك
          </h2>
          <p style={{ margin: 0, color: "#e5e7eb", fontSize: "15px", lineHeight: 1.8 }}>
            مختارات طلابية يعتمدها المعلم بعناية، مع محتوى لغوي قصير من الحساب الرسمي.
          </p>
        </div>

        <a
          href={TIKTOK_ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flex: "0 1 260px",
            minHeight: "48px",
            padding: "11px 16px",
            borderRadius: "14px",
            background: "#09090b",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 900,
            textAlign: "center",
            border: "1px solid #25F4EE",
            boxShadow: "3px 3px 0 #FE2C55, -3px -3px 0 #25F4EE",
          }}
        >
          تابعنا على تيك توك ↗
        </a>
      </div>

      {loading ? (
        <p style={{ margin: "18px 0 0", color: "#64756d", fontWeight: 800 }}>
          جارٍ تحميل المختارات...
        </p>
      ) : items.length > 0 ? (
        <div
          className="tiktok-showcase-grid"
          style={{
            display: "grid",
            gap: "14px",
            marginTop: "18px",
          }}
        >
          {items.map((item) => (
            <article
              key={item.id}
              className="tiktok-showcase-card"
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                overflow: "hidden",
                border: "1px solid #dbece3",
                borderRadius: "17px",
                background: "#ffffff",
                color: "#174c3b",
                boxShadow: "0 8px 18px rgba(24, 75, 57, 0.07)",
              }}
            >
              <div className="tiktok-showcase-cover" style={{ background: "linear-gradient(135deg, #dff8ed, #fff3c4)", overflow: "hidden" }}>
                {item.coverImageUrl ? (
                  <img src={item.coverImageUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={defaultCoverStyle}>
                    <div>
                      <div style={{ fontSize: "38px", lineHeight: 1 }}>🎬</div>
                      <strong style={{ display: "block", marginTop: "9px", fontSize: "14px" }}>
                        أكاديمية لغتي
                      </strong>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: "13px" }}>
                <strong style={{ display: "block", lineHeight: 1.6 }}>{item.title}</strong>
                {item.description && <p style={{ margin: "6px 0 0", color: "#64756d", fontSize: "13px", lineHeight: 1.7 }}>{item.description}</p>}
                {(item.classroom || item.studentDisplayName) && (
                  <span style={{ display: "block", marginTop: "9px", color: "#0f8a67", fontSize: "12px", fontWeight: 800 }}>
                    {[item.classroom, item.studentDisplayName].filter(Boolean).join(" • ")}
                  </span>
                )}
                <a
                  href={item.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "42px",
                    marginTop: "13px",
                    padding: "9px 12px",
                    borderRadius: "12px",
                    background: "#0f8a67",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                  }}
                >
                  شاهد المقطع ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p style={{ margin: "18px 0 0", color: "#64756d", fontWeight: 800 }}>
          ستظهر هنا مختارات الطلاب بعد اعتمادها ونشرها من المعلم.
        </p>
      )}
    </section>
  );
}
