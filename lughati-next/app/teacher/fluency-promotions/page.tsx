"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../../../firebase";

type PromotionRequest = {
  id: string;

  studentId: string;
  studentName: string;
  classroom: string;

  fromLevel: number;
  targetLevel: number;
  levelTitle: string;

  textId: string;
  audioUrl: string;

  durationSeconds: number;
  approvedReadings: number;
  attemptNumber: number;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | string;

  teacherNote: string;

  submittedAt: string;
  reviewedAt: string;
};

type ReviewResponse = {
  success?: boolean;
  message?: string;
  status?: string;
};

type RequestsResponse = {
  success?: boolean;

  count?: number;
  pendingCount?: number;
  approvedCount?: number;
  rejectedCount?: number;

  requests?: PromotionRequest[];

  message?: string;
};

type FilterStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

type AudioStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

const LEVEL_ICONS: Record<
  number,
  string
> = {
  1: "🌱",
  2: "⭐",
  3: "🥉",
  4: "🥈",
  5: "🥇",
  6: "🏆",
  7: "👑",
  8: "💎",
};

function formatDateTime(
  value: string
) {
  if (!value) {
    return "غير محدد";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",

        timeZone:
          "Asia/Riyadh",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function getStatusLabel(
  status: string
) {
  if (
    status ===
    "approved"
  ) {
    return "✅ معتمد";
  }

  if (
    status ===
    "rejected"
  ) {
    return "❌ مرفوض";
  }

  return "⏳ بانتظار المراجعة";
}

function getStatusStyle(
  status: string
) {
  if (
    status ===
    "approved"
  ) {
    return {
      background:
        "#ecfdf5",
      color:
        "#047857",
      border:
        "1px solid #a7f3d0",
    };
  }

  if (
    status ===
    "rejected"
  ) {
    return {
      background:
        "#fff1f2",
      color:
        "#be123c",
      border:
        "1px solid #fecdd3",
    };
  }

  return {
    background:
      "#fff7ed",
    color:
      "#b45309",
    border:
      "1px solid #fed7aa",
  };
}

export default function FluencyPromotionsPage() {
  const [
    requests,
    setRequests,
  ] =
    useState<
      PromotionRequest[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    filterStatus,
    setFilterStatus,
  ] =
    useState<FilterStatus>(
      "pending"
    );

  const [
    reviewingId,
    setReviewingId,
  ] =
    useState("");

  const [
    teacherNotes,
    setTeacherNotes,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    audioStatuses,
    setAudioStatuses,
  ] =
    useState<
      Record<
        string,
        AudioStatus
      >
    >({});

  function setAudioStatus(
    requestId: string,
    status: AudioStatus
  ) {
    setAudioStatuses(
      (current) => ({
        ...current,
        [requestId]:
          status,
      })
    );
  }

  const [
    pendingCount,
    setPendingCount,
  ] =
    useState(0);

  const [
    approvedCount,
    setApprovedCount,
  ] =
    useState(0);

  const [
    rejectedCount,
    setRejectedCount,
  ] =
    useState(0);

  async function getTeacherToken() {
    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "يجب تسجيل الدخول بحساب المعلم."
      );
    }

    return currentUser.getIdToken();
  }

  async function loadRequests() {
    try {
      setLoading(true);

      setErrorMessage("");

      const token =
        await getTeacherToken();

      const response =
        await fetch(
          "/api/fluency-promotion/review",
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache:
              "no-store",
          }
        );

      const data =
        (await response.json()) as
          RequestsResponse;

      if (
        !response.ok ||
        data.success !==
          true
      ) {
        throw new Error(
          data.message ||
            "تعذر تحميل اختبارات الترقية."
        );
      }

      const items =
        Array.isArray(
          data.requests
        )
          ? data.requests
          : [];

      setRequests(
        items
      );

      setPendingCount(
        typeof data.pendingCount ===
          "number"
          ? data.pendingCount
          : 0
      );

      setApprovedCount(
        typeof data.approvedCount ===
          "number"
          ? data.approvedCount
          : 0
      );

      setRejectedCount(
        typeof data.rejectedCount ===
          "number"
          ? data.rejectedCount
          : 0
      );

      const notes: Record<
        string,
        string
      > = {};

      items.forEach(
        (
          item
        ) => {
          notes[
            item.id
          ] =
            item.teacherNote ||
            "";
        }
      );

      setTeacherNotes(
        notes
      );

      setAudioStatuses(
        (current) => {
          const next = {
            ...current,
          };

          items.forEach(
            (item) => {
              if (
                !item.audioUrl
              ) {
                next[item.id] =
                  "error";
              } else if (
                !next[item.id]
              ) {
                next[item.id] =
                  "idle";
              }
            }
          );

          return next;
        }
      );
    } catch (error) {
      console.error(
        "تعذر تحميل اختبارات الترقية:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر تحميل اختبارات الترقية."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    let started =
      false;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (
          user
        ) => {
          if (
            !user ||
            started
          ) {
            if (
              !user
            ) {
              setLoading(
                false
              );

              setErrorMessage(
                "يجب تسجيل الدخول بحساب المعلم."
              );
            }

            return;
          }

          started =
            true;

          void loadRequests();
        }
      );

    return unsubscribe;
  }, []);

  const filteredRequests =
    useMemo(
      () => {
        if (
          filterStatus ===
          "all"
        ) {
          return requests;
        }

        return requests.filter(
          (
            item
          ) =>
            item.status ===
            filterStatus
        );
      },
      [
        requests,
        filterStatus,
      ]
    );

  async function reviewRequest(
    requestId: string,
    action:
      | "approve"
      | "reject"
  ) {
    const item =
      requests.find(
        (
          requestItem
        ) =>
          requestItem.id ===
          requestId
      );

    if (!item) {
      return;
    }

    const actionText =
      action ===
      "approve"
        ? `اعتماد ترقية ${item.studentName} إلى المستوى ${item.targetLevel}`
        : `رفض اختبار ${item.studentName}`;

    const confirmed =
      window.confirm(
        `${actionText}؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setReviewingId(
        requestId
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      const token =
        await getTeacherToken();

      const response =
        await fetch(
          "/api/fluency-promotion/review",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                requestId,

                action,

                teacherNote:
                  teacherNotes[
                    requestId
                  ] || "",
              }),
          }
        );

      const data =
        (await response.json()) as
          ReviewResponse;

      if (
        !response.ok ||
        data.success !==
          true
      ) {
        throw new Error(
          data.message ||
            "تعذر مراجعة الاختبار."
        );
      }

      setSuccessMessage(
        data.message ||
          "تم تحديث الاختبار بنجاح."
      );

      /*
        نحدث السجل محليًا مباشرة
        لتظهر النتيجة بسرعة،
        ثم نعيد جلب البيانات
        للتأكد من التطابق مع الخادم.
      */
      setRequests(
        (
          current
        ) =>
          current.map(
            (
              currentItem
            ) =>
              currentItem.id ===
              requestId
                ? {
                    ...currentItem,

                    status:
                      action ===
                      "approve"
                        ? "approved"
                        : "rejected",

                    teacherNote:
                      teacherNotes[
                        requestId
                      ] || "",
                  }
                : currentItem
          )
      );

      await loadRequests();
    } catch (error) {
      console.error(
        "تعذر مراجعة اختبار الترقية:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر مراجعة الاختبار."
      );
    } finally {
      setReviewingId(
        ""
      );
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",

        background:
          "linear-gradient(180deg,#f7fbf9 0%,#fffaf1 100%)",

        padding:
          "28px 18px 60px",

        color:
          "#17352a",
      }}
    >
      <div
        style={{
          maxWidth:
            "1100px",

          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              "14px",

            flexWrap:
              "wrap",

            marginBottom:
              "20px",
          }}
        >
          <Link
            href="/teacher"
            style={{
              textDecoration:
                "none",

              border:
                "1px solid #a7f3d0",

              background:
                "#ffffff",

              color:
                "#047857",

              borderRadius:
                "14px",

              padding:
                "11px 17px",

              fontWeight:
                900,
            }}
          >
            ← العودة إلى لوحة المعلم
          </Link>

          <button
            type="button"
            onClick={() =>
              void loadRequests()
            }
            disabled={
              loading
            }
            style={{
              border:
                "none",

              borderRadius:
                "14px",

              padding:
                "11px 17px",

              background:
                "#087f5b",

              color:
                "#ffffff",

              fontWeight:
                900,

              cursor:
                loading
                  ? "wait"
                  : "pointer",
            }}
          >
            {loading
              ? "⏳ جارٍ التحديث..."
              : "🔄 تحديث القائمة"}
          </button>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#92400e,#d97706)",

            color:
              "white",

            borderRadius:
              "30px",

            padding:
              "30px",

            marginBottom:
              "22px",

            boxShadow:
              "0 12px 30px rgba(146,64,14,.15)",
          }}
        >
          <div
            style={{
              fontSize:
                "46px",

              marginBottom:
                "8px",
            }}
          >
            🏔️🎙️
          </div>

          <h1
            style={{
              margin:
                0,

              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            مراجعة اختبارات قمة الطلاقة
          </h1>

          <p
            style={{
              margin:
                "10px 0 0",

              lineHeight:
                1.9,

              fontWeight:
                700,

              opacity:
                0.95,
            }}
          >
            استمع إلى اختبار الطالب،
            ثم اعتمد الترقية أو اطلب
            منه إعادة المحاولة.
          </p>
        </section>

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",

            gap:
              "14px",

            marginBottom:
              "20px",
          }}
        >
          <StatCard
            icon="⏳"
            label="بانتظار المراجعة"
            value={
              pendingCount
            }
          />

          <StatCard
            icon="✅"
            label="تم اعتمادها"
            value={
              approvedCount
            }
          />

          <StatCard
            icon="❌"
            label="مرفوضة"
            value={
              rejectedCount
            }
          />

          <StatCard
            icon="📚"
            label="إجمالي الاختبارات"
            value={
              requests.length
            }
          />
        </section>

        <section
          style={{
            display:
              "flex",

            gap:
              "10px",

            flexWrap:
              "wrap",

            marginBottom:
              "20px",
          }}
        >
          <FilterButton
            active={
              filterStatus ===
              "pending"
            }
            label="⏳ بانتظار المراجعة"
            onClick={() =>
              setFilterStatus(
                "pending"
              )
            }
          />

          <FilterButton
            active={
              filterStatus ===
              "approved"
            }
            label="✅ المعتمدة"
            onClick={() =>
              setFilterStatus(
                "approved"
              )
            }
          />

          <FilterButton
            active={
              filterStatus ===
              "rejected"
            }
            label="❌ المرفوضة"
            onClick={() =>
              setFilterStatus(
                "rejected"
              )
            }
          />

          <FilterButton
            active={
              filterStatus ===
              "all"
            }
            label="📋 الكل"
            onClick={() =>
              setFilterStatus(
                "all"
              )
            }
          />
        </section>

        {errorMessage && (
          <div
            style={{
              padding:
                "15px",

              marginBottom:
                "18px",

              borderRadius:
                "16px",

              background:
                "#fff1f2",

              border:
                "1px solid #fecdd3",

              color:
                "#be123c",

              fontWeight:
                800,

              textAlign:
                "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding:
                "15px",

              marginBottom:
                "18px",

              borderRadius:
                "16px",

              background:
                "#ecfdf5",

              border:
                "1px solid #a7f3d0",

              color:
                "#047857",

              fontWeight:
                900,

              textAlign:
                "center",
            }}
          >
            {successMessage}
          </div>
        )}

        {loading && (
          <div
            style={{
              background:
                "white",

              border:
                "1px solid #d9eee7",

              borderRadius:
                "24px",

              padding:
                "50px 20px",

              textAlign:
                "center",

              color:
                "#64748b",

              fontWeight:
                900,
            }}
          >
            ⏳ جارٍ تحميل اختبارات
            الترقية...
          </div>
        )}

        {!loading &&
          filteredRequests.length ===
            0 && (
            <div
              style={{
                background:
                  "white",

                border:
                  "1px solid #d9eee7",

                borderRadius:
                  "24px",

                padding:
                  "50px 20px",

                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "50px",

                  marginBottom:
                    "10px",
                }}
              >
                🏔️
              </div>

              <h2
                style={{
                  color:
                    "#087f5b",
                }}
              >
                لا توجد اختبارات في هذه
                القائمة
              </h2>

              <p
                style={{
                  color:
                    "#64748b",
                }}
              >
                ستظهر طلبات الطلاب هنا
                عند إرسال اختبارات الترقية.
              </p>
            </div>
          )}

        {!loading &&
          filteredRequests.length >
            0 && (
            <section
              style={{
                display:
                  "grid",

                gap:
                  "18px",
              }}
            >
              {filteredRequests.map(
                (
                  item
                ) => {
                  const statusStyle =
                    getStatusStyle(
                      item.status
                    );

                  const isReviewing =
                    reviewingId ===
                    item.id;

                  const audioStatus =
                    audioStatuses[
                      item.id
                    ] || "idle";

                  const audioReady =
                    audioStatus ===
                    "ready";

                  return (
                    <article
                      key={
                        item.id
                      }
                      style={{
                        background:
                          "#ffffff",

                        border:
                          item.status ===
                          "pending"
                            ? "2px solid #fde68a"
                            : "1px solid #d9eee7",

                        borderRadius:
                          "26px",

                        padding:
                          "22px",

                        boxShadow:
                          "0 9px 26px rgba(15,23,42,.06)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "flex-start",

                          gap:
                            "14px",

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                "#087f5b",

                              fontWeight:
                                900,

                              fontSize:
                                "14px",

                              marginBottom:
                                "5px",
                            }}
                          >
                            {
                              item.classroom
                            }
                          </div>

                          <h2
                            style={{
                              margin:
                                0,

                              color:
                                "#17352a",

                              fontSize:
                                "24px",
                            }}
                          >
                            {
                              item.studentName
                            }
                          </h2>
                        </div>

                        <div
                          style={{
                            ...statusStyle,

                            borderRadius:
                              "999px",

                            padding:
                              "8px 13px",

                            fontWeight:
                              900,
                          }}
                        >
                          {getStatusLabel(
                            item.status
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "18px",

                          display:
                            "grid",

                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(180px,1fr))",

                          gap:
                            "12px",
                        }}
                      >
                        <InfoBox
                          label="الترقية"
                          value={`${
                            LEVEL_ICONS[
                              item.fromLevel
                            ] ||
                            "📖"
                          } المستوى ${
                            item.fromLevel
                          } ← ${
                            LEVEL_ICONS[
                              item.targetLevel
                            ] ||
                            "⭐"
                          } المستوى ${
                            item.targetLevel
                          }`}
                        />

                        <InfoBox
                          label="المستوى المستهدف"
                          value={
                            item.levelTitle ||
                            `المستوى ${item.targetLevel}`
                          }
                        />

                        <InfoBox
                          label="القراءات المعتمدة"
                          value={`${item.approvedReadings} قراءة`}
                        />

                        <InfoBox
                          label="رقم المحاولة"
                          value={`${item.attemptNumber}`}
                        />

                        <InfoBox
                          label="مدة الاختبار"
                          value={`${item.durationSeconds} ثانية`}
                        />

                        <InfoBox
                          label="معرف النص"
                          value={
                            item.textId ||
                            "غير محدد"
                          }
                        />
                      </div>

                      <div
                        style={{
                          marginTop:
                            "18px",

                          padding:
                            "16px",

                          background:
                            "#f8fafc",

                          borderRadius:
                            "18px",

                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            marginBottom:
                              "10px",

                            color:
                              "#475569",

                            fontWeight:
                              900,
                          }}
                        >
                          🎧 تسجيل اختبار الطالب
                        </div>

                        {item.audioUrl ? (
                          <>
                            <audio
                              key={
                                item.audioUrl
                              }
                              src={
                                item.audioUrl
                              }
                              controls
                              preload="metadata"
                              playsInline
                              onLoadStart={() =>
                                setAudioStatus(
                                  item.id,
                                  "loading"
                                )
                              }
                              onLoadedMetadata={() =>
                                setAudioStatus(
                                  item.id,
                                  "ready"
                                )
                              }
                              onCanPlay={() =>
                                setAudioStatus(
                                  item.id,
                                  "ready"
                                )
                              }
                              onError={() =>
                                setAudioStatus(
                                  item.id,
                                  "error"
                                )
                              }
                              style={{
                                width:
                                  "100%",
                              }}
                            />

                            <div
                              style={{
                                marginTop:
                                  "10px",

                                display:
                                  "flex",

                                justifyContent:
                                  "space-between",

                                alignItems:
                                  "center",

                                gap:
                                  "10px",

                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight:
                                    800,

                                  fontSize:
                                    "13px",

                                  color:
                                    audioStatus ===
                                    "ready"
                                      ? "#047857"
                                      : audioStatus ===
                                          "error"
                                        ? "#be123c"
                                        : "#64748b",
                                }}
                              >
                                {audioStatus ===
                                "ready"
                                  ? "✅ التسجيل جاهز للاستماع."
                                  : audioStatus ===
                                      "error"
                                    ? "⚠️ تعذر تشغيل التسجيل داخل المشغل."
                                    : "⏳ جارٍ تجهيز بيانات التسجيل..."}
                              </div>

                              <a
                                href={
                                  item.audioUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color:
                                    "#087f5b",

                                  fontWeight:
                                    900,

                                  textDecoration:
                                    "none",

                                  border:
                                    "1px solid #a7f3d0",

                                  background:
                                    "#ffffff",

                                  borderRadius:
                                    "10px",

                                  padding:
                                    "7px 11px",

                                  fontSize:
                                    "13px",
                                }}
                              >
                                🔗 فتح التسجيل مباشرة
                              </a>
                            </div>

                            {audioStatus ===
                              "error" && (
                              <div
                                style={{
                                  marginTop:
                                    "10px",

                                  padding:
                                    "10px",

                                  borderRadius:
                                    "12px",

                                  background:
                                    "#fff1f2",

                                  border:
                                    "1px solid #fecdd3",

                                  color:
                                    "#9f1239",

                                  fontWeight:
                                    800,

                                  lineHeight:
                                    1.7,

                                  fontSize:
                                    "13px",
                                }}
                              >
                                لا تعتمد الترقية قبل التأكد من التسجيل. جرّب زر «فتح التسجيل مباشرة»، وإذا لم يعمل الرابط فالمشكلة من ملف الرفع نفسه.
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            style={{
                              color:
                                "#be123c",

                              fontWeight:
                                800,
                            }}
                          >
                            لا يوجد تسجيل صوتي.
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "14px",

                          color:
                            "#64748b",

                          fontWeight:
                            700,

                          lineHeight:
                            1.8,
                        }}
                      >
                        تاريخ الإرسال:{" "}
                        <strong>
                          {formatDateTime(
                            item.submittedAt
                          )}
                        </strong>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "18px",
                        }}
                      >
                        <label
                          htmlFor={`note-${item.id}`}
                          style={{
                            display:
                              "block",

                            marginBottom:
                              "7px",

                            color:
                              "#17352a",

                            fontWeight:
                              900,
                          }}
                        >
                          ✏️ ملاحظة للطالب
                        </label>

                        <textarea
                          id={`note-${item.id}`}
                          value={
                            teacherNotes[
                              item.id
                            ] || ""
                          }
                          disabled={
                            item.status !==
                              "pending" ||
                            isReviewing
                          }
                          onChange={(event) =>
                            setTeacherNotes(
                              (
                                current
                              ) => ({
                                ...current,

                                [item.id]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="مثال: أحسنت، ركز في المحاولة القادمة على ضبط الحركات والوقف..."
                          rows={
                            3
                          }
                          style={{
                            width:
                              "100%",

                            boxSizing:
                              "border-box",

                            border:
                              "1px solid #cbd5e1",

                            borderRadius:
                              "14px",

                            padding:
                              "12px",

                            resize:
                              "vertical",

                            fontSize:
                              "15px",

                            lineHeight:
                              1.7,

                            background:
                              item.status ===
                              "pending"
                                ? "#ffffff"
                                : "#f8fafc",
                          }}
                        />
                      </div>

                      {item.status ===
                        "pending" && (
                        <div
                          style={{
                            display:
                              "grid",

                            gridTemplateColumns:
                              "repeat(2,minmax(0,1fr))",

                            gap:
                              "12px",

                            marginTop:
                              "18px",
                          }}
                        >
                          <button
                            type="button"
                            disabled={
                              isReviewing ||
                              !audioReady
                            }
                            title={
                              audioReady
                                ? "اعتماد الترقية"
                                : "يجب أن يصبح التسجيل جاهزًا للاستماع قبل الاعتماد"
                            }
                            onClick={() =>
                              void reviewRequest(
                                item.id,
                                "approve"
                              )
                            }
                            style={{
                              border:
                                "none",

                              borderRadius:
                                "15px",

                              padding:
                                "14px",

                              background:
                                "#16a34a",

                              color:
                                "white",

                              fontWeight:
                                900,

                              fontSize:
                                "16px",

                              cursor:
                                isReviewing
                                  ? "wait"
                                  : audioReady
                                    ? "pointer"
                                    : "not-allowed",

                              opacity:
                                audioReady
                                  ? 1
                                  : 0.55,
                            }}
                          >
                            {isReviewing
                              ? "⏳ جارٍ الحفظ..."
                              : !audioReady
                                ? "🎧 استمع إلى التسجيل أولًا"
                                : `✅ اعتماد الترقية للمستوى ${item.targetLevel}`}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isReviewing
                            }
                            onClick={() =>
                              void reviewRequest(
                                item.id,
                                "reject"
                              )
                            }
                            style={{
                              border:
                                "1px solid #fecaca",

                              borderRadius:
                                "15px",

                              padding:
                                "14px",

                              background:
                                "#fff1f2",

                              color:
                                "#be123c",

                              fontWeight:
                                900,

                              fontSize:
                                "16px",

                              cursor:
                                isReviewing
                                  ? "wait"
                                  : "pointer",
                            }}
                          >
                            ❌ رفض وطلب إعادة المحاولة
                          </button>
                        </div>
                      )}

                      {item.status !==
                        "pending" && (
                        <div
                          style={{
                            marginTop:
                              "16px",

                            padding:
                              "13px",

                            borderRadius:
                              "14px",

                            ...statusStyle,

                            fontWeight:
                              800,

                            lineHeight:
                              1.8,
                          }}
                        >
                          {item.status ===
                          "approved"
                            ? `تم اعتماد ترقية الطالب إلى المستوى ${item.targetLevel}.`
                            : "تم رفض هذه المحاولة ويمكن للطالب إعادة الاختبار."}

                          {item.teacherNote && (
                            <>
                              <br />
                              ملاحظة المعلم:{" "}
                              {
                                item.teacherNote
                              }
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </section>
          )}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",

        border:
          "1px solid #d9eee7",

        borderRadius:
          "20px",

        padding:
          "18px",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            "30px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop:
            "7px",

          color:
            "#64748b",

          fontWeight:
            800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "5px",

          color:
            "#087f5b",

          fontSize:
            "30px",

          fontWeight:
            900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        border:
          active
            ? "2px solid #087f5b"
            : "1px solid #d9eee7",

        background:
          active
            ? "#ecfdf5"
            : "#ffffff",

        color:
          "#087f5b",

        borderRadius:
          "14px",

        padding:
          "10px 15px",

        fontWeight:
          900,

        cursor:
          "pointer",
      }}
    >
      {label}
    </button>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding:
          "13px",

        borderRadius:
          "15px",

        background:
          "#f8fafc",

        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          color:
            "#64748b",

          fontSize:
            "13px",

          fontWeight:
            800,

          marginBottom:
            "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color:
            "#17352a",

          fontWeight:
            900,
        }}
      >
        {value}
      </div>
    </div>
  );
}