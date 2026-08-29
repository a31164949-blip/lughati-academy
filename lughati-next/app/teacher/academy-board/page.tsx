"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type BoardCategory =
  | "announcement"
  | "event"
  | "competition";

type ManualSlide = {
  id: string;
  title: string;
  message: string;
  category: BoardCategory;
  icon: string;
  visible: boolean;
  startDate: string;
  endDate: string;
  createdAtMilliseconds: number;
};

type AcademyMilestone = {
  id: string;
  title: string;
  badgeTitle: string;
  studentName: string;
  pointsReached: number;
  boardVisible: boolean;
  boardStartDate: string;
  boardEndDate: string;
  createdAtMilliseconds: number;
};

type BoardSettings = {
  enabled: boolean;
  intervalSeconds: number;
  tickerEnabled: boolean;
  tickerText: string;
};

const defaultSettings: BoardSettings = {
  enabled: true,
  intervalSeconds: 6,
  tickerEnabled: true,
  tickerText:
    "🌟 كل إنجاز جديد يكتب اسمًا جديدًا في تاريخ أكاديمية لغتي",
};

const categoryOptions: {
  value: BoardCategory;
  label: string;
  icon: string;
}[] = [
  {
    value: "announcement",
    label: "إعلان",
    icon: "📣",
  },
  {
    value: "event",
    label: "فعالية",
    icon: "🎉",
  },
  {
    value: "competition",
    label: "مسابقة",
    icon: "🏁",
  },
];

function getPublicStudentName(
  fullName: string
) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

export default function TeacherAcademyBoardPage() {
  const [
    settings,
    setSettings,
  ] = useState<BoardSettings>(
    defaultSettings
  );

  const [
    milestones,
    setMilestones,
  ] = useState<AcademyMilestone[]>([]);

  const [
    manualSlides,
    setManualSlides,
  ] = useState<ManualSlide[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [slideMessage, setSlideMessage] =
    useState("");

  const [category, setCategory] =
    useState<BoardCategory>("announcement");

  const [icon, setIcon] =
    useState("📣");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [editingSlideId, setEditingSlideId] =
    useState<string | null>(null);

  const selectedCategory =
    categoryOptions.find(
      (item) =>
        item.value === category
    ) ?? categoryOptions[0];

  const visibleManualSlides =
    useMemo(
      () =>
        manualSlides.filter(
          (slide) => slide.visible
        ),
      [manualSlides]
    );

  async function loadBoardData() {
    try {
      setLoading(true);

      const [
        settingsSnapshot,
        milestoneSnapshot,
        manualSnapshot,
      ] = await Promise.all([
        getDoc(
          doc(
            db,
            "academyBoardSettings",
            "main"
          )
        ),
        getDocs(
          collection(
            db,
            "academyMilestones"
          )
        ),
        getDocs(
          collection(
            db,
            "academyBoardSlides"
          )
        ),
      ]);

      if (settingsSnapshot.exists()) {
        const data =
          settingsSnapshot.data();

        setSettings({
          enabled:
            data.enabled !== false,
          intervalSeconds:
            typeof data.intervalSeconds ===
              "number" &&
            data.intervalSeconds >= 3
              ? data.intervalSeconds
              : 6,
          tickerEnabled:
            data.tickerEnabled !== false,
          tickerText:
            typeof data.tickerText ===
              "string" &&
            data.tickerText.trim()
              ? data.tickerText
              : defaultSettings.tickerText,
        });
      }

      const loadedMilestones =
        milestoneSnapshot.docs
          .map((item) => {
            const data = item.data();

            return {
              id: item.id,
              title:
                typeof data.title ===
                "string"
                  ? data.title
                  : "إنجاز جديد",
              badgeTitle:
                typeof data.badgeTitle ===
                "string"
                  ? data.badgeTitle
                  : "",
              studentName:
                typeof data.studentName ===
                "string"
                  ? data.studentName
                  : "",
              pointsReached:
                typeof data.pointsReached ===
                "number"
                  ? data.pointsReached
                  : 0,
              boardVisible:
                data.boardVisible !== false,
              boardStartDate:
                typeof data.boardStartDate === "string"
                  ? data.boardStartDate
                  : "",
              boardEndDate:
                typeof data.boardEndDate === "string"
                  ? data.boardEndDate
                  : "",
              createdAtMilliseconds:
                data.createdAt
                  ?.toMillis?.() ||
                data.updatedAt
                  ?.toMillis?.() ||
                0,
            } satisfies AcademyMilestone;
          })
          .filter(
            (item) =>
              item.studentName.trim() !==
              ""
          )
          .sort(
            (first, second) =>
              second.createdAtMilliseconds -
              first.createdAtMilliseconds
          );

      setMilestones(loadedMilestones);

      const loadedManualSlides =
        manualSnapshot.docs
          .map((item) => {
            const data = item.data();

            const loadedCategory:
              BoardCategory =
              data.category === "event"
                ? "event"
                : data.category ===
                  "competition"
                ? "competition"
                : "announcement";

            return {
              id: item.id,
              title:
                typeof data.title ===
                "string"
                  ? data.title
                  : "",
              message:
                typeof data.message ===
                "string"
                  ? data.message
                  : "",
              category:
                loadedCategory,
              icon:
                typeof data.icon ===
                  "string" &&
                data.icon.trim()
                  ? data.icon
                  : "📣",
              visible:
                data.visible !== false,
              startDate:
                typeof data.startDate === "string"
                  ? data.startDate
                  : "",
              endDate:
                typeof data.endDate === "string"
                  ? data.endDate
                  : "",
              createdAtMilliseconds:
                data.createdAt
                  ?.toMillis?.() ||
                data.updatedAt
                  ?.toMillis?.() ||
                0,
            } satisfies ManualSlide;
          })
          .sort(
            (first, second) =>
              second.createdAtMilliseconds -
              first.createdAtMilliseconds
          );

      setManualSlides(
        loadedManualSlides
      );
    } catch (error) {
      console.error(
        "تعذر تحميل لوحة الأوائل والإعلانات:",
        error
      );

      setMessage(
        "تعذر تحميل بيانات اللوحة."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBoardData();
  }, []);

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage("");

      await setDoc(
        doc(
          db,
          "academyBoardSettings",
          "main"
        ),
        {
          ...settings,
          intervalSeconds:
            Math.max(
              3,
              Math.min(
                30,
                settings.intervalSeconds
              )
            ),
          updatedAt:
            serverTimestamp(),
        },
        { merge: true }
      );

      setMessage(
        "✅ تم حفظ إعدادات اللوحة."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ إعدادات اللوحة:",
        error
      );

      setMessage(
        "تعذر حفظ الإعدادات."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveManualSlide() {
    const cleanTitle =
      title.trim();

    const cleanMessage =
      slideMessage.trim();

    if (!cleanTitle) {
      setMessage(
        "اكتب عنوان الإعلان أو الفعالية."
      );
      return;
    }

    if (!cleanMessage) {
      setMessage(
        "اكتب وصفًا مختصرًا للشريحة."
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      setMessage(
        "تاريخ النهاية يجب أن يكون بعد تاريخ البداية."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const slideData = {
        title: cleanTitle,
        message: cleanMessage,
        category,
        icon:
          icon.trim() ||
          selectedCategory.icon,
        startDate,
        endDate,
        updatedAt:
          serverTimestamp(),
      };

      if (editingSlideId) {
        await updateDoc(
          doc(
            db,
            "academyBoardSlides",
            editingSlideId
          ),
          slideData
        );
      } else {
        await addDoc(
          collection(
            db,
            "academyBoardSlides"
          ),
          {
            ...slideData,
            visible: true,
            createdAt:
              serverTimestamp(),
          }
        );
      }

      setTitle("");
      setSlideMessage("");
      setCategory("announcement");
      setIcon("📣");
      setStartDate("");
      setEndDate("");
      setEditingSlideId(null);

      setMessage(
        editingSlideId
          ? "✅ تم تحديث الشريحة."
          : "✅ تمت إضافة الشريحة."
      );

      await loadBoardData();
    } catch (error) {
      console.error(
        "تعذر إضافة الشريحة:",
        error
      );

      setMessage(
        "تعذر إضافة الشريحة."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditingSlide(
    slide: ManualSlide
  ) {
    setEditingSlideId(slide.id);
    setTitle(slide.title);
    setSlideMessage(slide.message);
    setCategory(slide.category);
    setIcon(slide.icon);
    setStartDate(slide.startDate);
    setEndDate(slide.endDate);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditingSlide() {
    setEditingSlideId(null);
    setTitle("");
    setSlideMessage("");
    setCategory("announcement");
    setIcon("📣");
    setStartDate("");
    setEndDate("");
    setMessage("");
  }

  async function toggleMilestone(
    milestone: AcademyMilestone
  ) {
    try {
      setSaving(true);

      await updateDoc(
        doc(
          db,
          "academyMilestones",
          milestone.id
        ),
        {
          boardVisible:
            !milestone.boardVisible,
          updatedAt:
            serverTimestamp(),
        }
      );

      setMilestones((current) =>
        current.map((item) =>
          item.id === milestone.id
            ? {
                ...item,
                boardVisible:
                  !item.boardVisible,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "تعذر تغيير ظهور الإنجاز:",
        error
      );
      setMessage(
        "تعذر تحديث ظهور الإنجاز."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveMilestoneSchedule(
    milestone: AcademyMilestone,
    boardStartDate: string,
    boardEndDate: string
  ) {
    if (
      boardStartDate &&
      boardEndDate &&
      boardEndDate < boardStartDate
    ) {
      setMessage(
        "تاريخ نهاية الإنجاز يجب أن يكون بعد تاريخ البداية."
      );
      return;
    }

    try {
      setSaving(true);

      await updateDoc(
        doc(
          db,
          "academyMilestones",
          milestone.id
        ),
        {
          boardStartDate,
          boardEndDate,
          updatedAt:
            serverTimestamp(),
        }
      );

      setMilestones((current) =>
        current.map((item) =>
          item.id === milestone.id
            ? {
                ...item,
                boardStartDate,
                boardEndDate,
              }
            : item
        )
      );

      setMessage(
        "✅ تم حفظ مدة ظهور الإنجاز."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ مدة الإنجاز:",
        error
      );
      setMessage(
        "تعذر حفظ مدة ظهور الإنجاز."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSlide(
    slide: ManualSlide
  ) {
    try {
      setSaving(true);

      await updateDoc(
        doc(
          db,
          "academyBoardSlides",
          slide.id
        ),
        {
          visible: !slide.visible,
          updatedAt:
            serverTimestamp(),
        }
      );

      setManualSlides(
        (current) =>
          current.map((item) =>
            item.id === slide.id
              ? {
                  ...item,
                  visible:
                    !item.visible,
                }
              : item
          )
      );
    } catch (error) {
      console.error(
        "تعذر تغيير حالة الشريحة:",
        error
      );
      setMessage(
        "تعذر تحديث حالة الشريحة."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeSlide(
    slideId: string
  ) {
    const confirmed =
      window.confirm(
        "هل تريد حذف هذه الشريحة؟"
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      await deleteDoc(
        doc(
          db,
          "academyBoardSlides",
          slideId
        )
      );

      setManualSlides(
        (current) =>
          current.filter(
            (item) =>
              item.id !== slideId
          )
      );

      setMessage(
        "✅ تم حذف الشريحة."
      );
    } catch (error) {
      console.error(
        "تعذر حذف الشريحة:",
        error
      );

      setMessage(
        "تعذر حذف الشريحة."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f5fbf8 0%,#ffffff 40%,#f7faf9 100%)",
        padding:
          "24px 16px 48px",
        color: "#173e31",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div>
            <Link
              href="/teacher"
              style={{
                display: "inline-flex",
                marginBottom: "8px",
                color: "#16724d",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: "13px",
              }}
            >
              ← العودة إلى لوحة المعلم
            </Link>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(24px,4vw,36px)",
                color: "#123e2e",
              }}
            >
              🏆 لوحة الأوائل والإعلانات
            </h1>

            <p
              style={{
                margin:
                  "6px 0 0",
                color: "#64776f",
                fontWeight: 700,
                lineHeight: 1.7,
              }}
            >
              إدارة إنجازات الطلاب
              والإعلانات والفعاليات
              والمسابقات التي تظهر في
              اللوحة الرئيسية.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            style={{
              textDecoration: "none",
              padding:
                "11px 15px",
              borderRadius: "14px",
              border:
                "1px solid #cfe5da",
              background: "#ffffff",
              color: "#176c46",
              fontWeight: 900,
            }}
          >
            👁️ معاينة الصفحة الرئيسية
          </Link>
        </header>

        {message && (
          <div
            style={{
              marginBottom: "14px",
              padding:
                "11px 14px",
              borderRadius: "14px",
              background:
                "#eefaf3",
              border:
                "1px solid #d3ecde",
              color: "#176c46",
              fontWeight: 800,
            }}
          >
            {message}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          {[
            {
              label: "إنجازات مسجلة",
              value: milestones.length,
              icon: "🏆",
            },
            {
              label: "إعلانات وفعاليات",
              value:
                manualSlides.length,
              icon: "📣",
            },
            {
              label: "شرائح ظاهرة الآن",
              value:
                milestones.length +
                visibleManualSlides.length,
              icon: "👁️",
            },
            {
              label: "مدة الشريحة",
              value: `${settings.intervalSeconds} ث`,
              icon: "⏱️",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e0ebe6",
                borderRadius: "18px",
                padding: "15px",
                boxShadow:
                  "0 8px 22px rgba(22,80,55,.05)",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                }}
              >
                {item.icon}
              </div>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "23px",
                }}
              >
                {item.value}
              </strong>
              <span
                style={{
                  color: "#708078",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(320px,1fr))",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #dfeae5",
              borderRadius: "22px",
              padding: "18px",
              boxShadow:
                "0 10px 28px rgba(25,90,63,.06)",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 14px",
                fontSize: "18px",
              }}
            >
              ⚙️ إعدادات اللوحة
            </h2>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "10px",
                padding:
                  "10px 0",
                borderBottom:
                  "1px solid #eef2f0",
                fontWeight: 800,
              }}
            >
              <span>
                تشغيل اللوحة
              </span>
              <input
                type="checkbox"
                checked={
                  settings.enabled
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      enabled:
                        event.target
                          .checked,
                    })
                  )
                }
              />
            </label>

            <label
              style={{
                display: "block",
                marginTop: "14px",
                fontWeight: 800,
              }}
            >
              مدة عرض كل شريحة
              <input
                type="number"
                min={3}
                max={30}
                value={
                  settings.intervalSeconds
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      intervalSeconds:
                        Number(
                          event.target
                            .value
                        ) || 6,
                    })
                  )
                }
                style={{
                  width: "100%",
                  marginTop: "7px",
                  padding:
                    "11px 12px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d9e5df",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "10px",
                marginTop: "14px",
                fontWeight: 800,
              }}
            >
              <span>
                تشغيل شريط الأخبار
              </span>
              <input
                type="checkbox"
                checked={
                  settings.tickerEnabled
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      tickerEnabled:
                        event.target
                          .checked,
                    })
                  )
                }
              />
            </label>

            <label
              style={{
                display: "block",
                marginTop: "14px",
                fontWeight: 800,
              }}
            >
              نص الشريط المتحرك
              <textarea
                value={
                  settings.tickerText
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      tickerText:
                        event.target
                          .value,
                    })
                  )
                }
                rows={3}
                style={{
                  width: "100%",
                  marginTop: "7px",
                  padding:
                    "11px 12px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d9e5df",
                  resize: "vertical",
                }}
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveSettings()
              }
              style={{
                width: "100%",
                marginTop: "14px",
                padding: "12px",
                border: 0,
                borderRadius: "13px",
                background: "#16855b",
                color: "#ffffff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              💾 حفظ إعدادات اللوحة
            </button>
          </section>

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #dfeae5",
              borderRadius: "22px",
              padding: "18px",
              boxShadow:
                "0 10px 28px rgba(25,90,63,.06)",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 6px",
                fontSize: "18px",
              }}
            >
              {editingSlideId
                ? "✏️ تعديل الشريحة"
                : "📣 إضافة إعلان أو فعالية"}
            </h2>

            <p
              style={{
                margin:
                  "0 0 14px",
                color: "#718078",
                fontSize: "12px",
                lineHeight: 1.7,
              }}
            >
              أضف مسابقة جديدة أو فعالية
              أو تنبيهًا ليظهر كشريحة مستقلة
              في لوحة الأكاديمية.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3,1fr)",
                gap: "7px",
                marginBottom: "12px",
              }}
            >
              {categoryOptions.map(
                (item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setCategory(
                        item.value
                      );
                      setIcon(
                        item.icon
                      );
                    }}
                    style={{
                      padding:
                        "9px 6px",
                      borderRadius:
                        "12px",
                      border:
                        category ===
                        item.value
                          ? "2px solid #21a06d"
                          : "1px solid #dfe8e4",
                      background:
                        category ===
                        item.value
                          ? "#effaf4"
                          : "#ffffff",
                      color: "#285343",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {item.icon}{" "}
                    {item.label}
                  </button>
                )
              )}
            </div>

            <label
              style={{
                display: "block",
                fontWeight: 800,
              }}
            >
              عنوان الشريحة
              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="مثال: مسابقة القراءة السريعة"
                style={{
                  width: "100%",
                  marginTop: "7px",
                  padding:
                    "11px 12px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d9e5df",
                }}
              />
            </label>

            <label
              style={{
                display: "block",
                marginTop: "12px",
                fontWeight: 800,
              }}
            >
              التفاصيل
              <textarea
                value={slideMessage}
                onChange={(event) =>
                  setSlideMessage(
                    event.target.value
                  )
                }
                placeholder="اكتب رسالة قصيرة وواضحة..."
                rows={4}
                style={{
                  width: "100%",
                  marginTop: "7px",
                  padding:
                    "11px 12px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d9e5df",
                  resize: "vertical",
                }}
              />
            </label>

            <label
              style={{
                display: "block",
                marginTop: "12px",
                fontWeight: 800,
              }}
            >
              الأيقونة
              <input
                value={icon}
                onChange={(event) =>
                  setIcon(
                    event.target.value
                  )
                }
                maxLength={8}
                style={{
                  width: "100%",
                  marginTop: "7px",
                  padding:
                    "11px 12px",
                  borderRadius: "12px",
                  border:
                    "1px solid #d9e5df",
                }}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontWeight: 800,
                }}
              >
                تاريخ بداية العرض
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    marginTop: "7px",
                    padding: "11px 12px",
                    borderRadius: "12px",
                    border:
                      "1px solid #d9e5df",
                  }}
                />
              </label>

              <label
                style={{
                  display: "block",
                  fontWeight: 800,
                }}
              >
                تاريخ نهاية العرض
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    marginTop: "7px",
                    padding: "11px 12px",
                    borderRadius: "12px",
                    border:
                      "1px solid #d9e5df",
                  }}
                />
              </label>
            </div>

            <p
              style={{
                margin: "8px 0 0",
                color: "#7a8881",
                fontSize: "11px",
                lineHeight: 1.6,
              }}
            >
              اترك التاريخين فارغين إذا أردت
              عرض الشريحة دون مدة محددة.
            </p>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveManualSlide()
              }
              style={{
                width: "100%",
                marginTop: "14px",
                padding: "12px",
                border: 0,
                borderRadius: "13px",
                background: "#0f7f58",
                color: "#ffffff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {editingSlideId
                ? "💾 حفظ التعديلات"
                : "+ إضافة إلى اللوحة"}
            </button>

            {editingSlideId && (
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditingSlide}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "11px",
                  border:
                    "1px solid #d9e5df",
                  borderRadius: "13px",
                  background: "#ffffff",
                  color: "#52675e",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                إلغاء التعديل
              </button>
            )}
          </section>
        </div>

        <section
          style={{
            marginTop: "18px",
            background: "#ffffff",
            border:
              "1px solid #dfeae5",
            borderRadius: "22px",
            padding: "18px",
            boxShadow:
              "0 10px 28px rgba(25,90,63,.06)",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 13px",
              fontSize: "18px",
            }}
          >
            📋 الإعلانات والفعاليات
          </h2>

          {loading ? (
            <div>
              جارٍ التحميل...
            </div>
          ) : manualSlides.length ===
            0 ? (
            <div
              style={{
                color: "#718078",
                fontWeight: 700,
              }}
            >
              لا توجد شرائح إعلانية حتى
              الآن.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "9px",
              }}
            >
              {manualSlides.map(
                (slide) => {
                  const categoryInfo =
                    categoryOptions.find(
                      (item) =>
                        item.value ===
                        slide.category
                    ) ??
                    categoryOptions[0];

                  return (
                    <article
                      key={slide.id}
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "52px minmax(0,1fr) auto",
                        gap: "10px",
                        alignItems:
                          "center",
                        padding: "11px",
                        borderRadius:
                          "15px",
                        background:
                          slide.visible
                            ? "#fbfefc"
                            : "#f5f6f5",
                        border:
                          "1px solid #e3ebe7",
                        opacity:
                          slide.visible
                            ? 1
                            : 0.68,
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius:
                            "14px",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          background:
                            "#eef9f3",
                          fontSize:
                            "25px",
                        }}
                      >
                        {slide.icon}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <strong>
                          {
                            slide.title
                          }
                        </strong>
                        <div
                          style={{
                            marginTop:
                              "3px",
                            color:
                              "#718078",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            lineHeight:
                              1.6,
                          }}
                        >
                          {
                            slide.message
                          }
                        </div>
                        <span
                          style={{
                            display:
                              "inline-block",
                            marginTop:
                              "4px",
                            padding:
                              "3px 7px",
                            borderRadius:
                              "999px",
                            background:
                              "#eef7f2",
                            color:
                              "#23704f",
                            fontSize:
                              "10px",
                            fontWeight:
                              900,
                          }}
                        >
                          {
                            categoryInfo.label
                          }
                        </span>

                        {(slide.startDate ||
                          slide.endDate) && (
                          <div
                            style={{
                              marginTop: "5px",
                              color: "#60756b",
                              fontSize: "11px",
                              fontWeight: 800,
                              lineHeight: 1.6,
                            }}
                          >
                            🗓️{" "}
                            {slide.startDate
                              ? `من ${slide.startDate}`
                              : "من الآن"}
                            {" — "}
                            {slide.endDate
                              ? `إلى ${slide.endDate}`
                              : "دون تاريخ نهاية"}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "6px",
                          flexWrap:
                            "wrap",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            startEditingSlide(
                              slide
                            )
                          }
                          title="تعديل"
                          style={{
                            border: 0,
                            borderRadius:
                              "10px",
                            padding:
                              "8px 9px",
                            background:
                              "#fff7df",
                            cursor:
                              "pointer",
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={() =>
                            void toggleSlide(
                              slide
                            )
                          }
                          style={{
                            border: 0,
                            borderRadius:
                              "10px",
                            padding:
                              "8px 9px",
                            background:
                              slide.visible
                                ? "#e7f8ef"
                                : "#eef0ef",
                            cursor:
                              "pointer",
                          }}
                        >
                          {slide.visible
                            ? "👁️"
                            : "🙈"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={() =>
                            void removeSlide(
                              slide.id
                            )
                          }
                          style={{
                            border: 0,
                            borderRadius:
                              "10px",
                            padding:
                              "8px 9px",
                            background:
                              "#fff0f0",
                            color:
                              "#b42318",
                            cursor:
                              "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section
          style={{
            marginTop: "18px",
            background:
              "linear-gradient(135deg,#0b2f25,#123d31)",
            color: "#ffffff",
            borderRadius: "22px",
            padding: "18px",
            boxShadow:
              "0 12px 30px rgba(8,54,40,.15)",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 5px",
              fontSize: "18px",
            }}
          >
            🏆 الإنجازات التلقائية
          </h2>
          <p
            style={{
              margin:
                "0 0 13px",
              color: "#d1fae5",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            هذه الإنجازات تُسجل تلقائيًا
            من نظام النقاط ولا تحتاج إلى
            إدخال يدوي.
          </p>

          {milestones.length === 0 ? (
            <div
              style={{
                color: "#d1fae5",
              }}
            >
              لم يُسجل إنجاز بعد.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",
                gap: "9px",
              }}
            >
              {milestones.map(
                (milestone) => (
                  <article
                    key={milestone.id}
                    style={{
                      padding: "11px",
                      borderRadius: "15px",
                      background:
                        "rgba(255,255,255,.08)",
                      border:
                        "1px solid rgba(255,255,255,.10)",
                      opacity:
                        milestone.boardVisible
                          ? 1
                          : 0.55,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "8px",
                        alignItems:
                          "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color:
                              "#fde68a",
                            fontSize:
                              "11px",
                            fontWeight:
                              900,
                          }}
                        >
                          ✨{" "}
                          {milestone.badgeTitle ||
                            "إنجاز تاريخي"}
                        </div>
                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            fontSize:
                              "17px",
                          }}
                        >
                          {getPublicStudentName(
                            milestone.studentName
                          )}
                        </strong>
                      </div>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          void toggleMilestone(
                            milestone
                          )
                        }
                        title={
                          milestone.boardVisible
                            ? "إخفاء من اللوحة"
                            : "إظهار في اللوحة"
                        }
                        style={{
                          border: 0,
                          borderRadius:
                            "10px",
                          padding:
                            "7px 9px",
                          background:
                            milestone.boardVisible
                              ? "#d1fae5"
                              : "#e5e7eb",
                          cursor:
                            "pointer",
                        }}
                      >
                        {milestone.boardVisible
                          ? "👁️"
                          : "🙈"}
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        color: "#d1fae5",
                        fontSize: "12px",
                        lineHeight: 1.6,
                      }}
                    >
                      {milestone.title}
                    </div>

                    <div
                      style={{
                        marginTop: "7px",
                        color: "#fde68a",
                        fontWeight: 900,
                      }}
                    >
                      {milestone.pointsReached}{" "}
                      نقطة
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2,minmax(0,1fr))",
                        gap: "7px",
                        marginTop: "10px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          color: "#d1fae5",
                        }}
                      >
                        بداية العرض
                        <input
                          type="date"
                          value={
                            milestone.boardStartDate
                          }
                          onChange={(event) => {
                            const value =
                              event.target.value;
                            setMilestones(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.id ===
                                    milestone.id
                                      ? {
                                          ...item,
                                          boardStartDate:
                                            value,
                                        }
                                      : item
                                )
                            );
                          }}
                          style={{
                            width: "100%",
                            marginTop: "4px",
                            padding: "7px",
                            borderRadius:
                              "9px",
                            border: 0,
                          }}
                        />
                      </label>

                      <label
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          color: "#d1fae5",
                        }}
                      >
                        نهاية العرض
                        <input
                          type="date"
                          value={
                            milestone.boardEndDate
                          }
                          min={
                            milestone.boardStartDate ||
                            undefined
                          }
                          onChange={(event) => {
                            const value =
                              event.target.value;
                            setMilestones(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.id ===
                                    milestone.id
                                      ? {
                                          ...item,
                                          boardEndDate:
                                            value,
                                        }
                                      : item
                                )
                            );
                          }}
                          style={{
                            width: "100%",
                            marginTop: "4px",
                            padding: "7px",
                            borderRadius:
                              "9px",
                            border: 0,
                          }}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void saveMilestoneSchedule(
                          milestone,
                          milestone.boardStartDate,
                          milestone.boardEndDate
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop: "8px",
                        padding: "8px",
                        border: 0,
                        borderRadius: "10px",
                        background: "#fef3c7",
                        color: "#765b00",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      💾 حفظ مدة الظهور
                    </button>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
