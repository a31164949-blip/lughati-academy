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
import { auth, db } from "../../../firebase";

type Status = "pending" | "approved" | "revision_requested";
type Tab = "voice" | "reader" | "art" | "celebrate" | "family";

type FamilyTeam = {
  id: string;
  studentId?: string;
  name?: string;
  teamName?: string;
  classroom?: string;
  completedStageCount?: number;
  gameScoreTotal?: number;
  totalDuration?: number;
  rewardTotal?: number;
  speedBonusGranted?: boolean;
  status?: Status;
};

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

type ArtItem = {
  id: string;
  studentName?: string;
  studentClassroom?: string;
  title?: string;
  imageUrl?: string;
  imagePublicId?: string;
  status?: Status;
  teacherNote?: string;
  createdAt?: number;
};

type CelebrateItem = {
  id: string;
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  title?: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  mediaPublicId?: string;
  parentPublishingConsent?: boolean;
  publishingConsentAt?: number;
  featuredForGallery?: boolean;
  featuredForTikTok?: boolean;
  status?: Status;
  teacherNote?: string;
  createdAt?: number;
  reviewedAt?: number;
};

export default function TeacherNationalDayPage() {
  const [tab, setTab] = useState<Tab>("voice");
  const [filter, setFilter] = useState("all");
  const [voice, setVoice] = useState<VoiceItem[]>([]);
  const [reader, setReader] = useState<ReaderItem[]>([]);
  const [art, setArt] = useState<ArtItem[]>([]);
  const [celebrate, setCelebrate] = useState<CelebrateItem[]>([]);
  const [familyTeams, setFamilyTeams] = useState<FamilyTeam[]>([]);
  const [familyAwardGranted, setFamilyAwardGranted] = useState(false);
  const [familyMessage, setFamilyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [voiceNotes, setVoiceNotes] = useState<Record<string, string>>({});
  const [readerNotes, setReaderNotes] = useState<Record<string, string>>({});
  const [artNotes, setArtNotes] = useState<Record<string, string>>({});
  const [celebrateNotes, setCelebrateNotes] = useState<Record<string, string>>({});

  async function loadAll() {
    setLoading(true);

    try {
      const teacherToken = await auth.currentUser?.getIdToken();
      const [voiceSnapshot, readerResponse, artResponse, celebrateResponse, familyResponse] = await Promise.all([
        getDocs(collection(db, "nationalDaySubmissions")),
        fetch("/api/national-day/reader-of-nation", {
          cache: "no-store",
        }),
        fetch("/api/national-day/my-country-with-my-brush", {
          cache: "no-store",
        }),
        fetch("/api/national-day/we-celebrate", {
          cache: "no-store",
        }),
        fetch("/api/national-day/family-word-challenge?view=leaderboard", {
          cache: "no-store",
          headers: teacherToken ? { Authorization: `Bearer ${teacherToken}` } : {},
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

      const artResult = await artResponse.json();

      if (!artResponse.ok) {
        throw new Error(artResult?.message || "تعذر تحميل وطني بريشتي.");
      }

      const artData: ArtItem[] = Array.isArray(artResult?.submissions)
        ? artResult.submissions
        : [];

      const celebrateResult = await celebrateResponse.json();

      if (!celebrateResponse.ok) {
        throw new Error(celebrateResult?.message || "تعذر تحميل مشاركات نحن نحتفل.");
      }

      const celebrateData: CelebrateItem[] = Array.isArray(celebrateResult?.submissions)
        ? celebrateResult.submissions
        : [];

      setVoice(voiceData);
      setReader(readerData);
      setArt(artData);
      setCelebrate(celebrateData);

      if (familyResponse.ok) {
        const familyResult = await familyResponse.json();
        setFamilyTeams(Array.isArray(familyResult?.teams) ? familyResult.teams : []);
        setFamilyAwardGranted(familyResult?.awardGranted === true);
      }

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

      setArtNotes(
        Object.fromEntries(
          artData.map((item) => [item.id, item.teacherNote || ""])
        )
      );

      setCelebrateNotes(
        Object.fromEntries(
          celebrateData.map((item) => [item.id, item.teacherNote || ""])
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

  const currentItems =
    tab === "voice" ? voice : tab === "reader" ? reader : tab === "art" ? art : tab === "celebrate" ? celebrate : familyTeams;

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

  async function reviewArt(
    item: ArtItem,
    status: "approved" | "revision_requested"
  ) {
    const note = (artNotes[item.id] || "").trim();

    if (status === "revision_requested" && !note) {
      alert("اكتب ملاحظة للطالب قبل طلب إعادة العمل.");
      return;
    }

    try {
      setWorking(`art-${item.id}`);

      const response = await fetch("/api/national-day/my-country-with-my-brush", {
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
        throw new Error(result?.message || "تعذر تحديث العمل الفني.");
      }

      setArt((items) =>
        items.map((x) =>
          x.id === item.id ? { ...x, status, teacherNote: note } : x
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تحديث العمل الفني.");
    } finally {
      setWorking("");
    }
  }

  async function deleteArt(item: ArtItem) {
    if (!confirm(`هل تريد حذف عمل ${item.studentName || "الطالب"}؟`)) {
      return;
    }

    try {
      setWorking(`art-${item.id}`);

      const response = await fetch("/api/national-day/my-country-with-my-brush", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر حذف العمل الفني.");
      }

      setArt((items) => items.filter((x) => x.id !== item.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حذف العمل الفني.");
    } finally {
      setWorking("");
    }
  }

  async function patchCelebrate(item: CelebrateItem, payload: Record<string, unknown>) {
    const response = await fetch("/api/national-day/we-celebrate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, ...payload }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || "تعذر تحديث المشاركة.");
  }

  async function reviewCelebrate(
    item: CelebrateItem,
    status: "approved" | "revision_requested"
  ) {
    const note = (celebrateNotes[item.id] || "").trim();
    if (status === "revision_requested" && !note) {
      alert("اكتب ملاحظة للطالب قبل طلب إعادة المشاركة.");
      return;
    }
    try {
      setWorking(`celebrate-${item.id}`);
      await patchCelebrate(item, { status, teacherNote: note });
      setCelebrate((items) =>
        items.map((x) => x.id === item.id ? { ...x, status, teacherNote: note } : x)
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تحديث المشاركة.");
    } finally { setWorking(""); }
  }

  async function featureCelebrate(
    item: CelebrateItem,
    field: "featuredForGallery" | "featuredForTikTok"
  ) {
    if (!item.parentPublishingConsent) {
      alert("لا توجد موافقة من ولي الأمر على النشر العام.");
      return;
    }
    const nextValue = !item[field];
    try {
      setWorking(`celebrate-${item.id}`);
      await patchCelebrate(item, { [field]: nextValue });
      setCelebrate((items) =>
        items.map((x) => x.id === item.id ? { ...x, [field]: nextValue } : x)
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تحديث ترشيح المشاركة.");
    } finally { setWorking(""); }
  }

  async function deleteCelebrate(item: CelebrateItem) {
    if (!confirm(`هل تريد حذف مشاركة ${item.studentName || "الطالب"}؟`)) return;
    try {
      setWorking(`celebrate-${item.id}`);
      const response = await fetch("/api/national-day/we-celebrate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "تعذر حذف المشاركة.");
      setCelebrate((items) => items.filter((x) => x.id !== item.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر حذف المشاركة.");
    } finally { setWorking(""); }
  }

async function downloadCelebrate(item: CelebrateItem) {
  if (!item.mediaUrl) return;

  try {
    setWorking(`celebrate-${item.id}`);

    const response = await fetch(item.mediaUrl, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`تعذر تنزيل الملف (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;

    const extension =
      item.mediaType === "video"
        ? "mp4"
        : blob.type.includes("png")
          ? "png"
          : "jpg";

    anchor.download = `${item.title || "national-day"}.${extension}`;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  } catch (error) {
    console.error("Download failed:", error);
    alert("تعذر تنزيل الملف. جرّب مرة أخرى.");
  } finally {
    setWorking("");
  }
}

  async function awardFastestFamily() {
    if (!confirm("هل تريد اعتماد أسرع أسرة ومنحها 10 نقاط؟ لا يمكن منح الجائزة مرتين.")) return;
    try {
      setWorking("family-award");
      setFamilyMessage("");
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("سجّل الدخول بحساب المعلم أولًا.");
      const response = await fetch("/api/national-day/family-word-challenge", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "تعذر اعتماد الجائزة.");
      setFamilyAwardGranted(true);
      setFamilyMessage(result.message || "تم اعتماد الجائزة.");
      await loadAll();
    } catch (error) {
      setFamilyMessage(error instanceof Error ? error.message : "تعذر اعتماد الجائزة.");
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
            إدارة مشاركات صوت الوطن وقارئ الوطن ووطني بريشتي ونحن نحتفل من مكان واحد.
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
          <TabButton
            active={tab === "art"}
            icon="🎨"
            title="وطني بريشتي"
            count={art.length}
            onClick={() => setTab("art")}
          />

          <TabButton
            active={tab === "celebrate"}
            icon="✨"
            title="نحن نحتفل"
            count={celebrate.length}
            onClick={() => setTab("celebrate")}
          />
          <TabButton
            active={tab === "family"}
            icon="👨‍👩‍👧‍👦"
            title="التحدي العائلي"
            count={familyTeams.length}
            onClick={() => setTab("family")}
          />
        </div>

        {tab !== "family" && <>
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
              : tab === "reader"
              ? (shown as ReaderItem[]).map((item) => (
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
                ))
              : tab === "art"
              ? (shown as ArtItem[]).map((item) => (
                  <ArtCard
                    key={item.id}
                    item={item}
                    note={artNotes[item.id] || ""}
                    busy={working === `art-${item.id}`}
                    setNote={(value) =>
                      setArtNotes((x) => ({ ...x, [item.id]: value }))
                    }
                    review={reviewArt}
                    remove={deleteArt}
                  />
                ))
              : (shown as CelebrateItem[]).map((item) => (
                  <CelebrateCard
                    key={item.id}
                    item={item}
                    note={celebrateNotes[item.id] || ""}
                    busy={working === `celebrate-${item.id}`}
                    setNote={(value) =>
                      setCelebrateNotes((x) => ({ ...x, [item.id]: value }))
                    }
                    review={reviewCelebrate}
                    feature={featureCelebrate}
                    download={downloadCelebrate}
                    remove={deleteCelebrate}
                  />
                ))}
          </section>
        )}
        </>}

        {tab === "family" && (
          <section style={{ display: "grid", gap: 14 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ marginTop: 0 }}>🏆 ترتيب الأسر</h2>
              <p>يُرتب من أكمل المراحل الأربع حسب الزمن الأقل، وعند التعادل يُقدّم مجموع نقاط اللعبة الأعلى.</p>
              <button
                onClick={() => void awardFastestFamily()}
                disabled={familyAwardGranted || working === "family-award"}
                style={{ ...button(familyAwardGranted ? "#94a3b8" : "#b8860b"), opacity: working === "family-award" ? 0.7 : 1 }}
              >
                {familyAwardGranted ? "تم اعتماد جائزة أسرع أسرة ✅" : working === "family-award" ? "جارٍ الاعتماد…" : "اعتماد أسرع أسرة ومنح 10 نقاط ⭐"}
              </button>
              {familyMessage && <p style={{ fontWeight: 900, color: "#087b52" }}>{familyMessage}</p>}
            </div>
            {familyTeams.length === 0 ? <Empty text="لا توجد نتائج عائلية حتى الآن." /> : familyTeams.map((team, rank) => (
              <article key={team.id} style={{ ...cardStyle, padding: 18, display: "grid", gridTemplateColumns: "70px 1fr", gap: 16, alignItems: "center" }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", display: "grid", placeItems: "center", background: rank === 0 ? "#facc15" : "#e8f3ee", fontSize: 22, fontWeight: 900 }}>{rank + 1}</div>
                <div>
                  <h3 style={{ margin: "0 0 6px" }}>{team.teamName || team.name || "أسرة الطالب"} {team.speedBonusGranted ? "⭐" : ""}</h3>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>الطالب: {team.name || "—"}</span>
                    <span>الفصل: {team.classroom || "—"}</span>
                    <b>المراحل: {team.completedStageCount || 0}/4</b>
                    <b>نقاط اللعبة: {team.gameScoreTotal || 0}</b>
                    <b>الزمن: {team.totalDuration ? `${Math.floor(team.totalDuration / 60)} د ${team.totalDuration % 60} ث` : "—"}</b>
                  </div>
                </div>
              </article>
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

function ArtCard({
  item,
  note,
  busy,
  setNote,
  review,
  remove,
}: {
  item: ArtItem;
  note: string;
  busy: boolean;
  setNote: (value: string) => void;
  review: (
    item: ArtItem,
    status: "approved" | "revision_requested"
  ) => Promise<void>;
  remove: (item: ArtItem) => Promise<void>;
}) {
  return (
    <article style={cardStyle}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.title || "عمل فني وطني"}
          style={{
            width: "100%",
            height: 320,
            objectFit: "contain",
            background: "#f8faf9",
            display: "block",
          }}
        />
      ) : (
        <div style={readerHeadStyle}>
          <div style={{ fontSize: 42 }}>🎨</div>
          <strong>وطني بريشتي</strong>
        </div>
      )}

      <div style={{ padding: 20 }}>
        <StatusBadge status={item.status} />

        <h2 style={nameStyle}>{item.studentName || "طالب"}</h2>

        <p style={{ ...infoStyle, fontWeight: 900, color: "#087b52" }}>
          🎨 {item.title || "لوحة بلا عنوان"}
        </p>

        <p style={infoStyle}>
          الفصل: {item.studentClassroom || "غير محدد"}
          {item.createdAt ? (
            <>
              <br />
              تاريخ المشاركة: {formatDate(item.createdAt)}
            </>
          ) : null}
        </p>

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
            ⭐ اعتماد العمل
          </button>

          <button
            disabled={busy}
            onClick={() => void review(item, "revision_requested")}
            style={button("#b7791f")}
          >
            🔄 يحتاج إعادة
          </button>

          <a
            href={item.imageUrl || "#"}
            target="_blank"
            rel="noreferrer"
            style={{
              ...button("#2563eb"),
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            🖼️ فتح الصورة
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

function CelebrateCard({
  item, note, busy, setNote, review, feature, download, remove,
}: {
  item: CelebrateItem;
  note: string;
  busy: boolean;
  setNote: (value: string) => void;
  review: (item: CelebrateItem, status: "approved" | "revision_requested") => Promise<void>;
  feature: (item: CelebrateItem, field: "featuredForGallery" | "featuredForTikTok") => Promise<void>;
  download: (item: CelebrateItem) => Promise<void>;
  remove: (item: CelebrateItem) => Promise<void>;
}) {
  const consent = item.parentPublishingConsent === true;
  return (
    <article style={cardStyle}>
      {item.mediaUrl ? (
        item.mediaType === "video" ? (
          <video src={item.mediaUrl} controls playsInline preload="metadata" style={{ width: "100%", height: 320, objectFit: "contain", background: "#0b1712" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.mediaUrl} alt={item.title || "مشاركة وطنية"} style={{ width: "100%", height: 320, objectFit: "contain", background: "#f8faf9", display: "block" }} />
        )
      ) : (
        <div style={readerHeadStyle}><div style={{ fontSize: 42 }}>✨</div><strong>نحن نحتفل</strong></div>
      )}

      <div style={{ padding: 20 }}>
        <StatusBadge status={item.status} />
        <h2 style={nameStyle}>{item.studentName || "طالب"}</h2>
        <p style={{ ...infoStyle, fontWeight: 900, color: "#087b52" }}>
          {item.mediaType === "video" ? "🎥" : "📸"} {item.title || "مشاركة بلا عنوان"}
        </p>
        <p style={infoStyle}>
          الفصل: {item.studentClassroom || "غير محدد"}
          {item.createdAt ? <><br />تاريخ المشاركة: {formatDate(item.createdAt)}</> : null}
        </p>

        <div style={{ marginTop: 12, padding: 12, borderRadius: 14, fontWeight: 900, lineHeight: 1.8, background: consent ? "#eaf8f1" : "#fff6da", color: consent ? "#087b52" : "#765f2d" }}>
          {consent
            ? "✓ ولي الأمر موافق على إمكانية النشر في معرض الأكاديمية وركن TikTok."
            : "🔒 غير مصرح بالنشر العام؛ يمكن مراجعة المشاركة واعتمادها داخل الأكاديمية فقط."}
        </div>

        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة المعلم للطالب عند الحاجة" style={textareaStyle} />

        <div style={actionsStyle}>
          <button disabled={busy} onClick={() => void review(item, "approved")} style={button("#087b52")}>⭐ اعتماد المشاركة</button>
          <button disabled={busy} onClick={() => void review(item, "revision_requested")} style={button("#b7791f")}>🔄 يحتاج إعادة</button>
          <button disabled={busy || !item.mediaUrl} onClick={() => void download(item)} style={button("#2563eb")}>⬇️ تنزيل الملف</button>
          <a href={item.mediaUrl || "#"} target="_blank" rel="noreferrer" style={{ ...button("#475569"), textAlign: "center", textDecoration: "none" }}>👀 فتح الملف</a>
          <button disabled={busy || !consent} onClick={() => void feature(item, "featuredForGallery")} style={{ ...button(item.featuredForGallery ? "#0f766e" : "#7c3aed"), opacity: !consent ? 0.45 : 1 }}>
            {item.featuredForGallery ? "✓ مرشحة للمعرض" : "🖼️ ترشيح للمعرض"}
          </button>
          <button disabled={busy || !consent} onClick={() => void feature(item, "featuredForTikTok")} style={{ ...button(item.featuredForTikTok ? "#0f766e" : "#111827"), opacity: !consent ? 0.45 : 1 }}>
            {item.featuredForTikTok ? "✓ مرشحة لـ TikTok" : "🎬 ترشيح لـ TikTok"}
          </button>
          <button disabled={busy} onClick={() => void remove(item)} style={{ ...button("#b91c1c"), gridColumn: "1 / -1" }}>حذف 🗑️</button>
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
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
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