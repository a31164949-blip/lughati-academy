"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";

type Resource = { id: string; title: string; description: string; category: string; classroom: string; fileUrl: string; fileName: string; fileKind: "image" | "pdf"; createdAt: Date | null };

function categoryLabel(value: string) {
  if (value === "test") return "اختبار";
  if (value === "review") return "مراجعة وتدريب";
  return "ورقة عمل";
}

export default function FamilyLearningResources() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) return setItems([]);
        const token = await user.getIdToken();
        const response = await fetch("/api/family-learning-resources", { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? "LOAD_FAILED");
        setItems((Array.isArray(result.items) ? result.items : []).map((item: Resource & { createdAt?: number }) => ({ ...item, createdAt: typeof item.createdAt === "number" ? new Date(item.createdAt) : null })));
      } catch (error) {
        console.error("تعذر تحميل أوراق العمل:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <section style={cardStyle}>
      <div style={headingStyle}>
        <div><span style={badgeStyle}>من المعلم مباشرة</span><h2 style={{ margin: "9px 0 5px", color: "#173f34", fontSize: 22 }}>📚 أوراق العمل والاختبارات</h2><p style={{ margin: 0, color: "#64748b" }}>اطّلع على المواد المنشورة لابنك وحمّلها بسهولة.</p></div>
        <span style={folderStyle}>🗂️</span>
      </div>
      {loading ? <p style={emptyStyle}>جارٍ تحميل المواد...</p> : items.length === 0 ? <p style={emptyStyle}>لا توجد أوراق عمل أو اختبارات منشورة حاليًا.</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => <article key={item.id} style={resourceStyle}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={fileIconStyle}>{item.fileKind === "pdf" ? "📕" : "🖼️"}</span><div><strong style={{ color: "#173f34", fontSize: 17 }}>{item.title}</strong><div style={{ color: "#687d75", marginTop: 5, fontSize: 13 }}>{categoryLabel(item.category)}{item.createdAt ? ` • ${item.createdAt.toLocaleDateString("ar-SA")}` : ""}</div>{item.description && <p style={{ margin: "7px 0 0", color: "#52665f", lineHeight: 1.7 }}>{item.description}</p>}</div></div>
            <a href={item.fileUrl} target="_blank" rel="noreferrer" style={openStyle}>عرض وتحميل الملف ←</a>
          </article>)}
        </div>
      )}
    </section>
  );
}

const cardStyle = { background: "linear-gradient(135deg,#fffdf5,#f4fbf8)", border: "1px solid #eadfae", borderRadius: 24, padding: 20, marginBottom: 16, boxShadow: "0 10px 28px rgba(23,77,59,.06)" };
const headingStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 18 };
const badgeStyle = { display: "inline-block", background: "#fff1bd", color: "#805b00", borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 800 };
const folderStyle = { width: 58, height: 58, borderRadius: 17, display: "grid", placeItems: "center", background: "#fff3c6", fontSize: 29, flexShrink: 0 };
const emptyStyle = { padding: 18, borderRadius: 15, background: "rgba(255,255,255,.75)", textAlign: "center" as const, color: "#64748b" };
const resourceStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" as const, padding: 15, border: "1px solid #dbe9e3", borderRadius: 17, background: "rgba(255,255,255,.88)" };
const fileIconStyle = { width: 46, height: 46, borderRadius: 13, display: "grid", placeItems: "center", background: "#edf8f3", fontSize: 23, flexShrink: 0 };
const openStyle = { textDecoration: "none", padding: "10px 14px", borderRadius: 12, background: "#147a5b", color: "#fff", fontWeight: 800, whiteSpace: "nowrap" as const };
