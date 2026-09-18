"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type Status = "pending" | "approved" | "revision_requested";
type Tab = "voice" | "reader";

type VoiceItem = {
  id: string;
  studentName?: string;
  classroom?: string;
  grade?: string;
  school?: string;
  title?: string;
  fileUrl?: string;
  duration?: number;
  status?: Status;
  teacherNote?: string;
  createdAt?: { toMillis?: () => number };
};

type ReaderItem = {
  id: string;
  studentName?: string;
  studentClassroom?: string;
  audioUrl?: string;
  durationSeconds?: number;
  status?: Status;
  teacherNote?: string;
  createdAt?: number;
};

export default function TeacherNationalDayPage() {
  const [tab, setTab] = useState<Tab>("voice");
  const [filter, setFilter] = useState("all");
  const [voice, setVoice] = useState<VoiceItem[]>([]);
  const [reader, setReader] = useState<ReaderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [voiceNotes, setVoiceNotes] = useState<Record<string, string>>({});
  const [readerNotes, setReaderNotes] = useState<Record<string, string>>({});

  async function loadAll() {
    setLoading(true);

    try {
      const [voiceSnapshot, readerResponse] = await Promise.all([
        getDocs(collection(db, "nationalDaySubmissions")),
        fetch("/api/national-day/reader-of-nation", {
          cache: "no-store",
        }),
      ]);

      const voiceData = voiceSnapshot.docs.map((snap) => ({
        id: snap.id,
        ...(snap.data() as Omit<VoiceItem, "id">),
      }));

      voiceData.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) -
          (a.createdAt?.toMillis?.() || 0)
      );

      const readerResult = await readerResponse.json();

      if (!readerResponse.ok) {
        throw new Error(readerResult?.message || "تعذر تحميل قارئ الوطن.");
      }

      const readerData: ReaderItem[] = Array.isArray(readerResult?.submissions)
        ? readerResult.submissions
        : [];

      setVoice(voiceData);
      setReader(readerData);

      setVoiceNotes(
        Object.fromEntries(
          voiceData.map((item) => [item.id, item.teacherNote || ""])
        )
      );

      setReaderNotes(
        Object.fromEntries(
          readerData.map((item) => [item.id, item.teacherNote || ""])
        )
      );
    } catch (error) {
      console.error(error);
      alert("تعذر تحميل بعض مشاركات اليوم الوطني.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    setFilter("all");
  }, [tab]);

  const currentItems = tab === "voice" ? voice : reader;

  const pendingCount = currentItems.filter(
    (item) => !item.status || item.status === "pending"
  ).length;

  const shown = useMemo(() => {
    return currentItems.filter((item) => {
      if (filter === "all") return true;
      return (item.status || "pending") === filter;
    });
  }, [currentItems, filter]);

  async function reviewVoice(
    item: VoiceItem,
    status: "approved" | "revision_requested"
  ) {
    const note = (voiceNotes[item.id] || "").trim();

    if (status === "revision_requested" && !note) {
      alert("اكتب ملاحظة للطالب قبل إعادة المشاركة.");
      return;
    }

    try {
      setWorking(`voice-${item.id}`);

      await updateDoc(doc(db, "nationalDaySubmissions", item.id), {
        status,
        approved: status === "approved",
        teacherNote: note,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setVoice((items) =>
        items.map((x) =>
          x.id === item.id ? { ...x, status, teacherNote: note } : x
        )
      );
    } catch {
      alert("تعذر تحديث المشاركة.");
    } finally {
      setWorking("");
    }
  }

  async function deleteVoice(item: VoiceItem) {
    if (!confirm(`هل تريد حذف مشاركة ${item.studentName || "الطالب"}؟`)) {
      return;
    }

    try {
      setWorking(`voice-${item.id}`);

      await deleteDoc(doc(db, "nationalDaySubmissions", item.id));

      setVoice((items) => items.filter((x) => x.id !== item.id));
    } catch {
      alert("تعذر حذف المشاركة.");
    } finally {
      setWorking("");
    }
  }

  async function reviewReader(
    item: ReaderItem,
    status: "approved" | "revision_requested"
  ) {
    const note = (readerNotes[item.id] || "").trim();

    if (status === "revision_requested" && !note) {
      alert("اكتب ملاحظة للطالب قبل طلب إعادة القراءة.");
      return;
    }

    try {
      setWorking(`reader-${item.id}`);

      const response = await fetch("/api/national-day/reader-of-nation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status,
          teacherNote: note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحديث القراءة.");
      }

      setReader((items) =>
        items.map((x) =>
          x.id === item.id ? { ...x, status, teacherNote: note } : x
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تحديث القراءة.");
    } finally {
      setWorking("");
    }
  }

  async function deleteReader(item: ReaderItem) {
    if (!confirm(`هل تريد حذف قراءة ${item.studentName || "الطالب"}؟`)) {
      return;
    }

    try {
      setWorking(`reader-${item.id}`);

      const response = await fetch("/api/national-day/reader-of-nation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر حذف القراءة.");
      }

      setReader((items) => items.filter((x) => x.id !== item.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حذف القراءة.");
    } finally {
      setWorking("");
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: 22,
        background: "linear-gradient(180deg,#effcf6,#fff)",
        color: "#153f33",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={topStyle}>
          <Link href="/teacher" style={linkStyle}>
            → العودة إلى لوحة المعلم
          </Link>

          <button onClick={() => void loadAll()} style={button("#087b52")}>
            تحديث المشاركات 🔄
          </button>
        </header>

        <section style={heroStyle}>
          <div style={{ color: "#fde68a", fontWeight: 900 }}>
            🇸🇦 إدارة أسبوع الوطن
          </div>

          <h1 style={{ margin: "6px 0", fontSize: "clamp(30px,5vw,48px)" }}>
            فعاليات اليوم الوطني
          </h1>

          <p style={{ margin: 0, color: "#dcfce7" }}>
            إدارة مشاركات صوت الوطن وقارئ الوطن من مكان واحد.
          </p>
        </section>

        <div style={tabsStyle}>
          <TabButton
            active={tab === "voice"}
            icon="🎙️"
            title="صوت الوطن"
            count={voice.length}
            onClick={() => setTab("voice")}
          />

          <TabButton
            active={tab === "reader"}
            icon="📖"
            title="قارئ الوطن"
            count={reader.length}
            onClick={() => setTab("reader")}
          />
        </div>

        <div style={filtersStyle}>
          {[
            ["all", `الكل (${currentItems.length})`],
            ["pending", `بانتظار المراجعة (${pendingCount})`],
            ["approved", "المعتمدة"],
            ["revision_requested", "تحتاج إعادة"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                ...button(filter === value ? "#087b52" : "#e8f3ee"),
                color: filter === value ? "white" : "#175b45",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <Empty text="جارٍ تحميل المشاركات…" />
        ) : shown.length === 0 ? (
          <Empty text="لا توجد مشاركات في هذا القسم." />
        ) : (
          <section style={gridStyle}>
            {tab === "voice"
              ? (shown as VoiceItem[]).map((item) => (
                  <VoiceCard
                    key={item.id}
                    item={item}
                    note={voiceNotes[item.id] || ""}
                    busy={working === `voice-${item.id}`}
                    setNote={(value) =>
                      setVoiceNotes((x) => ({ ...x, [item.id]: value }))
                    }
                    review={reviewVoice}
                    remove={deleteVoice}
                  />
                ))
              : (shown as ReaderItem[]).map((item) => (
                  <ReaderCard
                    key={item.id}
                    item={item}
                    note={readerNotes[item.id] || ""}
                    busy={working === `reader-${item.id}`}
                    setNote={(value) =>
                      setReaderNotes((x) => ({ ...x, [item.id]: value }))
                    }
                    review={reviewReader}
                    remove={deleteReader}
                  />
                ))}
          </section>
        )}
      </div>
    </main>
  );
}

function VoiceCard({
  item,
  note,
  busy,
  setNote,
  review,
  remove,
}: {
  item: VoiceItem;
  note: string;
  busy: boolean;
  setNote: (value: string) => void;
  review: (
    item: VoiceItem,
    status: "approved" | "revision_requested"
  ) => Promise<void>;
  remove: (item: VoiceItem) => Promise<void>;
}) {
  return (
    <article style={cardStyle}>
      {item.fileUrl && (
        <video
          src={item.fileUrl}
          controls
          preload="metadata"
          style={{ width: "100%", height: 250, background: "#000" }}
        />
      )}

      <div style={{ padding: 20 }}>
        <StatusBadge status={item.status} />

        <h2 style={nameStyle}>{item.studentName || "طالب"}</h2>

        <p style={infoStyle}>
          {item.grade || "الصف غير محدد"} • {item.classroom || "دون فصل"}
          {item.duration ? ` • ${Math.ceil(item.duration)} ثانية` : ""}
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة المعلم عند الحاجة"
          style={textareaStyle}
        />

        <div style={actionsStyle}>
          <button
            disabled={busy}
            onClick={() => void review(item, "approved")}
            style={button("#087b52")}
          >
            اعتماد ✅
          </button>

          <button
            disabled={busy}
            onClick={() => void review(item, "revision_requested")}
            style={button("#b7791f")}
          >
            إعادة للمراجعة ↩️
          </button>

          <a
            href={item.fileUrl || "#"}
            target="_blank"
            rel="noreferrer"
            style={{ ...button("#2563eb"), textAlign: "center", textDecoration: "none" }}
          >
            فتح الفيديو 👀
          </a>

          <button
            disabled={busy}
            onClick={() => void remove(item)}
            style={button("#b91c1c")}
          >
            حذف 🗑️
          </button>
        </div>
      </div>
    </article>
  );
}

function ReaderCard({
  item,
  note,
  busy,
  setNote,
  review,
  remove,
}: {
  item: ReaderItem;
  note: string;
  busy: boolean;
  setNote: (value: string) => void;
  review: (
    item: ReaderItem,
    status: "approved" | "revision_requested"
  ) => Promise<void>;
  remove: (item: ReaderItem) => Promise<void>;
}) {
  return (
    <article style={cardStyle}>
      <div style={readerHeadStyle}>
        <div style={{ fontSize: 42 }}>📖</div>
        <strong>قارئ الوطن</strong>
      </div>

      <div style={{ padding: 20 }}>
        <StatusBadge status={item.status} />

        <h2 style={nameStyle}>{item.studentName || "طالب"}</h2>

        <p style={infoStyle}>
          الفصل: {item.studentClassroom || "غير محدد"}
          <br />
          مدة القراءة: {item.durationSeconds || 0} ثانية
          {item.createdAt ? (
            <>
              <br />
              تاريخ المشاركة: {formatDate(item.createdAt)}
            </>
          ) : null}
        </p>

        {item.audioUrl ? (
          <div style={audioBoxStyle}>
            <strong>🎧 استمع إلى قراءة الطالب</strong>
            <audio
              src={item.audioUrl}
              controls
              preload="metadata"
              style={{ width: "100%", marginTop: 10 }}
            />
          </div>
        ) : (
          <p>لا يوجد تسجيل صوتي.</p>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة المعلم للطالب عند الحاجة"
          style={textareaStyle}
        />

        <div style={actionsStyle}>
          <button
            disabled={busy}
            onClick={() => void review(item, "approved")}
            style={button("#087b52")}
          >
            ⭐ اعتماد القراءة
          </button>

          <button
            disabled={busy}
            onClick={() => void review(item, "revision_requested")}
            style={button("#b7791f")}
          >
            🔄 يحتاج إعادة
          </button>

          <a
            href={item.audioUrl || "#"}
            target="_blank"
            rel="noreferrer"
            style={{ ...button("#2563eb"), textAlign: "center", textDecoration: "none" }}
          >
            🎧 فتح التسجيل
          </a>

          <button
            disabled={busy}
            onClick={() => void remove(item)}
            style={button("#b91c1c")}
          >
            حذف 🗑️
          </button>
        </div>
      </div>
    </article>
  );
}

function TabButton({
  active,
  icon,
  title,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={tabButtonStyle(active)}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <strong>{title}</strong>
      <small>{count} مشاركة</small>
    </button>
  );
}

function StatusBadge({ status }: { status?: Status }) {
  const data =
    status === "approved"
      ? ["معتمدة", "#dcfce7", "#087b52"]
      : status === "revision_requested"
      ? ["تحتاج إعادة", "#fff7cc", "#8a5b00"]
      : ["بانتظار المراجعة", "#e8f1ff", "#1d4ed8"];

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: data[1],
        color: data[2],
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      {data[0]}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: 40,
        textAlign: "center",
        background: "white",
        borderRadius: 22,
      }}
    >
      {text}
    </div>
  );
}

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function button(background: string): React.CSSProperties {
  return {
    padding: "12px 14px",
    border: 0,
    borderRadius: 13,
    background,
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  };
}

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: 17,
    borderRadius: 20,
    border: active ? "2px solid #087b52" : "1px solid #ccebdd",
    background: active ? "#ecfdf5" : "white",
    color: "#175b45",
    cursor: "pointer",
    display: "grid",
    gap: 5,
  };
}

const topStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const linkStyle: React.CSSProperties = {
  padding: "12px 17px",
  borderRadius: 14,
  color: "#087b52",
  background: "white",
  border: "1px solid #bde1d2",
  textDecoration: "none",
  fontWeight: 900,
};

const heroStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 28,
  borderRadius: 28,
  color: "white",
  background: "linear-gradient(135deg,#064e3b,#0a8c5c)",
};

const tabsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
  marginTop: 18,
};

const filtersStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 18,
  flexWrap: "wrap",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 18,
  marginTop: 20,
};

const cardStyle: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: 24,
  background: "white",
  border: "1px solid #ccebdd",
  boxShadow: "0 10px 28px rgba(15,118,72,.08)",
};

const readerHeadStyle: React.CSSProperties = {
  padding: 20,
  textAlign: "center",
  color: "#087b52",
  background: "linear-gradient(135deg,#f0fdf4,#fffbeb)",
};

const nameStyle: React.CSSProperties = {
  margin: "12px 0 4px",
  color: "#086447",
};

const infoStyle: React.CSSProperties = {
  color: "#6b7f78",
  lineHeight: 1.9,
};

const audioBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  background: "#f0fdf4",
  color: "#087b52",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 80,
  marginTop: 13,
  padding: 12,
  borderRadius: 13,
  border: "1px solid #cddfd8",
  resize: "vertical",
  fontFamily: "inherit",
};

const actionsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 9,
  marginTop: 10,
};