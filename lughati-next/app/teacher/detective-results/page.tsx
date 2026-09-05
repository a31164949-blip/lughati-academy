"use client";

import Link from "next/link";
import { useState } from "react";

type FinalizeSummary = {
  totalParticipants: number;
  totalPointsAwarded: number;
  byGrade: Array<{
    grade: string;
    count: number;
    first?: {
      name: string;
      durationSeconds: number;
      points: number;
    };
    second?: {
      name: string;
      durationSeconds: number;
      points: number;
    };
    third?: {
      name: string;
      durationSeconds: number;
      points: number;
    };
  }>;
};

type CurrentResult = {
  id: string;
  participantType: "student" | "visitor";
  name: string;
  grade: string;
  durationSeconds: number;
  rank: number;
};

type CurrentResultsResponse = {
  totalParticipants: number;
  byGrade: Array<{
    grade: string;
    count: number;
    results: CurrentResult[];
  }>;
};

function formatTime(
  totalSeconds: number
) {
  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

const gradeNames: Record<
  string,
  string
> = {
  "2": "الصف الثاني",
  "3": "الصف الثالث",
  "4": "الصف الرابع",
  "5": "الصف الخامس",
  "6": "الصف السادس",
};

export default function DetectiveResultsPage() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [summary, setSummary] =
    useState<FinalizeSummary | null>(
      null
    );

  const [
    currentResults,
    setCurrentResults,
  ] =
    useState<CurrentResultsResponse | null>(
      null
    );

  const [
    currentLoading,
    setCurrentLoading,
  ] = useState(false);

  const [
    currentError,
    setCurrentError,
  ] = useState("");

  async function loadCurrentResults() {
    if (currentLoading) {
      return;
    }

    try {
      setCurrentLoading(true);
      setCurrentError("");

      const response =
        await fetch(
          "/api/detective-results-current",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        (await response.json()) as {
          error?: string;
          totalParticipants?: number;
          byGrade?: CurrentResultsResponse["byGrade"];
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر تحميل النتائج الحالية."
        );
      }

      setCurrentResults({
        totalParticipants:
          data.totalParticipants ?? 0,
        byGrade:
          data.byGrade ?? [],
      });
    } catch (caughtError) {
      console.error(
        "تعذر تحميل نتائج تحدي المحقق الحالية:",
        caughtError
      );

      setCurrentError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تحميل النتائج الحالية."
      );
    } finally {
      setCurrentLoading(false);
    }
  }

  async function finalizeResults() {
    if (loading) {
      return;
    }

    const confirmed =
      window.confirm(
        "هل تريد اعتماد النتائج النهائية وتوزيع النقاط؟\n\nيُنفّذ الاعتماد مرة واحدة فقط بعد انتهاء يوم التحدي."
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/detective-finalize",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          alreadyFinalized?: boolean;
          message?: string;
          error?: string;
          details?: string;
          summary?: FinalizeSummary;
        };

      if (!response.ok) {
        const fullError = [
          data.error ||
            "تعذر اعتماد النتائج.",
          data.details
            ? `التفاصيل: ${data.details}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        throw new Error(fullError);
      }

      setSummary(
        data.summary ?? null
      );

      setMessage(
        data.message ||
          (data.alreadyFinalized
            ? "النتائج معتمدة مسبقًا."
            : "تم اعتماد النتائج بنجاح.")
      );
    } catch (caughtError) {
      console.error(
        "تعذر اعتماد نتائج تحدي المحقق:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر اعتماد النتائج."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={styles.page}
    >
      <div style={styles.shell}>
        <div style={styles.topBar}>
          <Link
            href="/teacher"
            style={styles.backButton}
          >
            ← لوحة المعلم
          </Link>

          <span style={styles.badge}>
            🕵️ تحدّي المحقّق
          </span>
        </div>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>
            🏆
          </div>

          <div>
            <p style={styles.eyebrow}>
              النتائج الرسمية
            </p>

            <h1 style={styles.title}>
              اعتماد نتائج تحدّي
              المحقّق
            </h1>

            <p style={styles.description}>
              تُرتّب النتائج داخل كل
              صف حسب أسرع وقت صحيح،
              ثم تُضاف النقاط إلى حساب
              الطالب أو رصيد الزائر مرة واحدة فقط.
            </p>
          </div>
        </section>

        <section
          style={styles.rulesCard}
        >
          <h2 style={styles.sectionTitle}>
            نظام النقاط
          </h2>

          <div style={styles.pointsGrid}>
            <div style={styles.pointCard}>
              <strong>🥇 5</strong>
              <span>المركز الأول</span>
            </div>

            <div style={styles.pointCard}>
              <strong>🥈 3</strong>
              <span>المركز الثاني</span>
            </div>

            <div style={styles.pointCard}>
              <strong>🥉 2</strong>
              <span>المركز الثالث</span>
            </div>

            <div style={styles.pointCard}>
              <strong>⭐ 1</strong>
              <span>
                بقية الحلول الصحيحة
              </span>
            </div>
          </div>

          <div style={styles.infoBox}>
            💡 هذه الصفحة لا تقرأ
            Firestore عند فتحها. زر عرض
            النتائج الحالية ينفّذ قراءة عند
            الطلب فقط، ولا توجد متابعة مباشرة
            أو onSnapshot.
          </div>
        </section>

        <section
          style={styles.currentCard}
        >
          <div style={styles.currentHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                النتائج الحالية
              </h2>

              <p style={styles.actionText}>
                عرض مؤقت للترتيب أثناء التحدي
                دون اعتماد النقاط.
              </p>
            </div>

            {currentResults && (
              <span style={styles.totalBadge}>
                {currentResults.totalParticipants}{" "}
                مشارك
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={loadCurrentResults}
            disabled={currentLoading}
            style={{
              ...styles.currentButton,
              opacity: currentLoading
                ? 0.65
                : 1,
              cursor: currentLoading
                ? "wait"
                : "pointer",
            }}
          >
            {currentLoading
              ? "جارٍ تحميل النتائج... ⏳"
              : currentResults
              ? "🔄 تحديث النتائج الحالية"
              : "🔍 عرض النتائج الحالية"}
          </button>

          {currentError && (
            <div style={styles.errorMessage}>
              ⚠️ {currentError}
            </div>
          )}

          {currentResults && (
            <div style={styles.currentGradeList}>
              {currentResults.byGrade.map(
                (grade) => (
                  <article
                    key={grade.grade}
                    style={styles.gradeCard}
                  >
                    <div style={styles.gradeHead}>
                      <strong>
                        {gradeNames[grade.grade] ??
                          `الصف ${grade.grade}`}
                      </strong>

                      <span>
                        {grade.count} مشارك
                      </span>
                    </div>

                    {grade.results.length === 0 ? (
                      <div style={styles.empty}>
                        لا توجد نتائج لهذا الصف.
                      </div>
                    ) : (
                      <div style={styles.currentRows}>
                        {grade.results.map(
                          (result) => (
                            <div
                              key={result.id}
                              style={styles.currentRow}
                            >
                              <strong
                                style={styles.rankBadge}
                              >
                                #{result.rank}
                              </strong>

                              <div
                                style={
                                  styles.participantCell
                                }
                              >
                                <strong>
                                  {result.name}
                                </strong>

                                <span
                                  style={
                                    styles.participantType
                                  }
                                >
                                  {result.participantType ===
                                  "student"
                                    ? "🎓 طالب الأكاديمية"
                                    : "👤 زائر"}
                                </span>
                              </div>

                              <span>
                                ⏱️{" "}
                                {formatTime(
                                  result.durationSeconds
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <section
          style={styles.actionCard}
        >
          <h2 style={styles.sectionTitle}>
            اعتماد النتائج
          </h2>

          <p style={styles.actionText}>
            لا تضغط الزر إلا بعد انتهاء
            يوم التحدي. بعد الاعتماد لن
            تُمنح النقاط مرة ثانية حتى لو
            ضغطت الزر مجددًا.
          </p>

          <button
            type="button"
            onClick={
              finalizeResults
            }
            disabled={loading}
            style={{
              ...styles.finalizeButton,
              opacity: loading
                ? 0.65
                : 1,
              cursor: loading
                ? "wait"
                : "pointer",
            }}
          >
            {loading
              ? "جارٍ اعتماد النتائج... ⏳"
              : "🏆 اعتماد النتائج النهائية"}
          </button>

          {message && (
            <div
              style={
                styles.successMessage
              }
            >
              ✅ {message}
            </div>
          )}

          {error && (
            <div
              style={
                styles.errorMessage
              }
            >
              ⚠️ {error}
            </div>
          )}
        </section>

        {summary && (
          <section
            style={styles.resultsCard}
          >
            <div
              style={
                styles.summaryHeader
              }
            >
              <div>
                <p
                  style={
                    styles.eyebrow
                  }
                >
                  ملخص الاعتماد
                </p>

                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  أسرع المحققين
                </h2>
              </div>

              <div
                style={
                  styles.totalBadge
                }
              >
                {summary.totalParticipants}{" "}
                مشارك
              </div>
            </div>

            <div
              style={
                styles.summaryStats
              }
            >
              <div
                style={
                  styles.summaryStat
                }
              >
                <span>
                  المشاركون
                </span>
                <strong>
                  {
                    summary.totalParticipants
                  }
                </strong>
              </div>

              <div
                style={
                  styles.summaryStat
                }
              >
                <span>
                  النقاط الموزعة
                </span>
                <strong>
                  {
                    summary.totalPointsAwarded
                  }
                </strong>
              </div>
            </div>

            <div
              style={
                styles.gradeList
              }
            >
              {summary.byGrade.map(
                (grade) => (
                  <article
                    key={
                      grade.grade
                    }
                    style={
                      styles.gradeCard
                    }
                  >
                    <div
                      style={
                        styles.gradeHead
                      }
                    >
                      <strong>
                        {gradeNames[
                          grade.grade
                        ] ??
                          `الصف ${grade.grade}`}
                      </strong>

                      <span>
                        {grade.count}{" "}
                        مشارك
                      </span>
                    </div>

                    {grade.count ===
                    0 ? (
                      <div
                        style={
                          styles.empty
                        }
                      >
                        لا توجد نتائج
                        لهذا الصف.
                      </div>
                    ) : (
                      <div
                        style={
                          styles.podium
                        }
                      >
                        {grade.first && (
                          <div
                            style={
                              styles.winnerRow
                            }
                          >
                            <span
                              style={
                                styles.medal
                              }
                            >
                              🥇
                            </span>

                            <strong>
                              {
                                grade.first
                                  .name
                              }
                            </strong>

                            <span>
                              ⏱️{" "}
                              {formatTime(
                                grade.first
                                  .durationSeconds
                              )}
                            </span>

                            <span
                              style={
                                styles.pointsPill
                              }
                            >
                              +
                              {
                                grade.first
                                  .points
                              }{" "}
                              نقطة
                            </span>
                          </div>
                        )}

                        {grade.second && (
                          <div
                            style={
                              styles.winnerRow
                            }
                          >
                            <span
                              style={
                                styles.medal
                              }
                            >
                              🥈
                            </span>

                            <strong>
                              {
                                grade.second
                                  .name
                              }
                            </strong>

                            <span>
                              ⏱️{" "}
                              {formatTime(
                                grade.second
                                  .durationSeconds
                              )}
                            </span>

                            <span
                              style={
                                styles.pointsPill
                              }
                            >
                              +
                              {
                                grade.second
                                  .points
                              }{" "}
                              نقطة
                            </span>
                          </div>
                        )}

                        {grade.third && (
                          <div
                            style={
                              styles.winnerRow
                            }
                          >
                            <span
                              style={
                                styles.medal
                              }
                            >
                              🥉
                            </span>

                            <strong>
                              {
                                grade.third
                                  .name
                              }
                            </strong>

                            <span>
                              ⏱️{" "}
                              {formatTime(
                                grade.third
                                  .durationSeconds
                              )}
                            </span>

                            <span
                              style={
                                styles.pointsPill
                              }
                            >
                              +
                              {
                                grade.third
                                  .points
                              }{" "}
                              نقطة
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "24px 14px 70px",
    color: "#0f172a",
    fontFamily:
      "Arial, sans-serif",
  },

  shell: {
    maxWidth: 980,
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  backButton: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border:
      "1px solid #dbe3ed",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 900,
  },

  badge: {
    background: "#102a43",
    color: "#fff",
    padding: "9px 13px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  },

  hero: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: 26,
    borderRadius: 26,
    color: "#fff",
    background:
      "linear-gradient(135deg,#102a43,#08121f 60%,#7c5614)",
    boxShadow:
      "0 20px 48px rgba(15,23,42,.14)",
    marginBottom: 18,
  },

  heroIcon: {
    width: 82,
    height: 82,
    flex: "0 0 82px",
    borderRadius: 22,
    display: "grid",
    placeItems: "center",
    fontSize: 44,
    background:
      "rgba(255,255,255,.1)",
    border:
      "1px solid rgba(255,255,255,.14)",
  },

  eyebrow: {
    margin: "0 0 6px",
    fontWeight: 900,
    color: "#e7b84b",
    fontSize: 13,
  },

  title: {
    margin: 0,
    fontSize:
      "clamp(28px,5vw,44px)",
  },

  description: {
    margin: "9px 0 0",
    color: "#d8e2ec",
    lineHeight: 1.8,
  },

  rulesCard: {
    background: "#fff",
    padding: 22,
    borderRadius: 22,
    border:
      "1px solid #e1e7ef",
    marginBottom: 18,
  },

  sectionTitle: {
    margin: "0 0 15px",
    fontSize: 24,
  },

  pointsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(150px,1fr))",
    gap: 12,
  },

  pointCard: {
    display: "grid",
    gap: 6,
    textAlign: "center",
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
  },

  infoBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    background: "#eff6ff",
    border:
      "1px solid #bfdbfe",
    color: "#1e3a8a",
    lineHeight: 1.8,
    fontWeight: 700,
  },

  currentCard: {
    background: "#fff",
    padding: 22,
    borderRadius: 22,
    border:
      "1px solid #e1e7ef",
    marginBottom: 18,
  },

  currentHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 12,
  },

  currentButton: {
    width: "100%",
    border: 0,
    borderRadius: 16,
    padding: "15px 18px",
    fontSize: 17,
    fontWeight: 900,
    color: "#fff",
    background:
      "linear-gradient(135deg,#12395b,#0f2740)",
    boxShadow:
      "0 12px 26px rgba(15,39,64,.14)",
  },

  currentGradeList: {
    display: "grid",
    gap: 13,
    marginTop: 18,
  },

  currentRows: {
    display: "grid",
    gap: 8,
  },

  currentRow: {
    display: "grid",
    gridTemplateColumns:
      "48px minmax(140px,1fr) auto",
    gap: 10,
    alignItems: "center",
    padding: "11px 12px",
    borderRadius: 13,
    background: "#f8fafc",
    border:
      "1px solid #edf2f7",
  },

  rankBadge: {
    width: 38,
    height: 38,
    display: "grid",
    placeItems: "center",
    borderRadius: 999,
    background: "#e7b84b",
    color: "#241600",
  },

  participantCell: {
    display: "grid",
    gap: 3,
  },

  participantType: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },

  actionCard: {
    background: "#fff",
    padding: 22,
    borderRadius: 22,
    border:
      "1px solid #e1e7ef",
    marginBottom: 18,
  },

  actionText: {
    color: "#64748b",
    lineHeight: 1.8,
  },

  finalizeButton: {
    width: "100%",
    border: 0,
    borderRadius: 16,
    padding: "15px 18px",
    fontSize: 17,
    fontWeight: 900,
    color: "#241600",
    background:
      "linear-gradient(135deg,#e5aa29,#f8d86d)",
    boxShadow:
      "0 12px 26px rgba(226,170,45,.18)",
  },

  successMessage: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    background: "#ecfdf5",
    border:
      "1px solid #a7f3d0",
    color: "#166534",
    fontWeight: 800,
  },

  errorMessage: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    background: "#fff1f2",
    border:
      "1px solid #fecdd3",
    color: "#be123c",
    fontWeight: 800,
  },

  resultsCard: {
    background: "#fff",
    padding: 22,
    borderRadius: 22,
    border:
      "1px solid #e1e7ef",
  },

  summaryHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 12,
  },

  totalBadge: {
    padding: "8px 12px",
    background: "#f1f5f9",
    borderRadius: 999,
    fontWeight: 900,
  },

  summaryStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: 12,
    marginBottom: 18,
  },

  summaryStat: {
    display: "grid",
    gap: 7,
    padding: 15,
    borderRadius: 15,
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
  },

  gradeList: {
    display: "grid",
    gap: 13,
  },

  gradeCard: {
    border:
      "1px solid #e2e8f0",
    borderRadius: 17,
    padding: 16,
  },

  gradeHead: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: 10,
    marginBottom: 12,
  },

  podium: {
    display: "grid",
    gap: 9,
  },

  winnerRow: {
    display: "grid",
    gridTemplateColumns:
      "44px minmax(100px,1fr) auto auto",
    gap: 10,
    alignItems: "center",
    background: "#f8fafc",
    borderRadius: 13,
    padding: "10px 12px",
  },

  medal: {
    fontSize: 24,
  },

  pointsPill: {
    background: "#ecfdf5",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
  },

  empty: {
    color: "#94a3b8",
    padding: 10,
  },
};
