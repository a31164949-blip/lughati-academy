"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../../firebase";

type CrownMode =
  | "reading"
  | "spelling";

type CrownAchievement = {
  id: string;

  studentId: string;
  studentName: string;
  classroom: string;

  mode: CrownMode;

  lessonName: string;

  king: boolean;
  kingTitle: string;

  fullMastery: boolean;

  personalPhotoUrl: string;
  selectedAvatarIcon: string;

  kingAchievedAt?: unknown;
  updatedAt?: unknown;
};

type StudentChampion = {
  studentId: string;
  studentName: string;
  classroom: string;

  personalPhotoUrl: string;
  selectedAvatarIcon: string;

  readingCrowns: number;
  spellingCrowns: number;
  totalCrowns: number;
};

function getTime(
  value: unknown
) {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (
      value as {
        toMillis?: unknown;
      }
    ).toMillis === "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  return 0;
}

export default function CrownHallOfFamePage() {
  const [
    achievements,
    setAchievements,
  ] =
    useState<CrownAchievement[]>(
      []
    );

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
    activeTab,
    setActiveTab,
  ] =
    useState<
      "all" | CrownMode
    >("all");

  useEffect(() => {
    async function loadAchievements() {
      try {
        setLoading(true);
        setErrorMessage("");

        const snapshot =
          await getDocs(
            collection(
              db,
              "lughatiCrownAchievements"
            )
          );

        const loaded: CrownAchievement[] =
          snapshot.docs
            .map(
              (document) => {
                const data =
                  document.data();

                const mode: CrownMode =
                  data.mode ===
                  "spelling"
                    ? "spelling"
                    : "reading";

                return {
                  id:
                    document.id,

                  studentId:
                    typeof data.studentId ===
                    "string"
                      ? data.studentId
                      : "",

                  studentName:
                    typeof data.studentName ===
                    "string"
                      ? data.studentName
                      : "طالب",

                  classroom:
                    typeof data.classroom ===
                    "string"
                      ? data.classroom
                      : "",

                  mode,

                  lessonName:
                    typeof data.lessonName ===
                    "string"
                      ? data.lessonName
                      : "درس",

                  king:
                    data.king ===
                    true,

                  kingTitle:
                    typeof data.kingTitle ===
                    "string"
                      ? data.kingTitle
                      : mode ===
                          "reading"
                        ? "👑 ملك القراءة"
                        : "👑 ملك الإملاء",

                  fullMastery:
                    data.fullMastery ===
                    true,

                  personalPhotoUrl:
                    typeof data.personalPhotoUrl ===
                    "string"
                      ? data.personalPhotoUrl
                      : "",

                  selectedAvatarIcon:
                    typeof data.selectedAvatarIcon ===
                    "string"
                      ? data.selectedAvatarIcon
                      : "👦🏻",

                  kingAchievedAt:
                    data.kingAchievedAt,

                  updatedAt:
                    data.updatedAt,
                };
              }
            )
            .filter(
              (item) =>
                item.king
            );

        loaded.sort(
          (a, b) =>
            Math.max(
              getTime(
                b.kingAchievedAt
              ),
              getTime(
                b.updatedAt
              )
            ) -
            Math.max(
              getTime(
                a.kingAchievedAt
              ),
              getTime(
                a.updatedAt
              )
            )
        );

        setAchievements(
          loaded
        );
      } catch (error) {
        console.error(
          "تعذر تحميل سجل المتوجين:",
          error
        );

        setAchievements(
          []
        );

        setErrorMessage(
          "تعذر تحميل سجل المتوجين حاليًا."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAchievements();
  }, []);

  const readingAchievements =
    useMemo(
      () =>
        achievements.filter(
          (item) =>
            item.mode ===
            "reading"
        ),
      [achievements]
    );

  const spellingAchievements =
    useMemo(
      () =>
        achievements.filter(
          (item) =>
            item.mode ===
            "spelling"
        ),
      [achievements]
    );

  const fullMasteryCount =
    useMemo(
      () =>
        achievements.filter(
          (item) =>
            item.fullMastery
        ).length,
      [achievements]
    );

  /*
   * نجمع تيجان كل طالب.
   */
  const champions =
    useMemo(() => {
      const map =
        new Map<
          string,
          StudentChampion
        >();

      achievements.forEach(
        (achievement) => {
          const key =
            achievement.studentId ||
            achievement.studentName;

          const current =
            map.get(key) ?? {
              studentId:
                achievement.studentId,

              studentName:
                achievement.studentName,

              classroom:
                achievement.classroom,

              personalPhotoUrl:
                achievement.personalPhotoUrl,

              selectedAvatarIcon:
                achievement.selectedAvatarIcon ||
                "👦🏻",

              readingCrowns:
                0,

              spellingCrowns:
                0,

              totalCrowns:
                0,
            };

          if (
            achievement.mode ===
            "reading"
          ) {
            current.readingCrowns +=
              1;
          }

          if (
            achievement.mode ===
            "spelling"
          ) {
            current.spellingCrowns +=
              1;
          }

          current.totalCrowns +=
            1;

          /*
           * نأخذ أحدث هوية محفوظة.
           */
          if (
            achievement.personalPhotoUrl
          ) {
            current.personalPhotoUrl =
              achievement.personalPhotoUrl;
          }

          if (
            achievement.selectedAvatarIcon
          ) {
            current.selectedAvatarIcon =
              achievement.selectedAvatarIcon;
          }

          map.set(
            key,
            current
          );
        }
      );

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.totalCrowns -
          a.totalCrowns
      );
    }, [achievements]);

  const topChampion =
    champions[0] ?? null;

  const visibleAchievements =
    activeTab === "all"
      ? achievements
      : achievements.filter(
          (item) =>
            item.mode ===
            activeTab
        );

  return (
    <main
      dir="rtl"
      style={{
        minHeight:
          "100vh",

        padding:
          "28px 16px 70px",

        background:
          "linear-gradient(180deg,#fff8dd 0%,#f3fbf7 48%,#ffffff 100%)",

        fontFamily:
          "Arial, sans-serif",

        color:
          "#173b31",
      }}
    >
      <div
        style={{
          maxWidth:
            1180,

          margin:
            "0 auto",
        }}
      >
        {/* العودة */}

        <div
          style={{
            display:
              "flex",

            gap:
              10,

            flexWrap:
              "wrap",

            marginBottom:
              18,
          }}
        >
          <Link
            href="/teacher/lughati-crown"
            style={
              backButtonStyle
            }
          >
            ← العودة إلى تاج لغتي
          </Link>

          <Link
            href="/teacher"
            style={
              backButtonStyle
            }
          >
            🏠 لوحة المعلم
          </Link>
        </div>

        {/* رأس الصفحة */}

        <section
          style={{
            textAlign:
              "center",

            padding:
              "36px 20px",

            borderRadius:
              32,

            background:
              "linear-gradient(135deg,#fff0a8,#fffdf2)",

            border:
              "3px solid #e7bf3c",

            boxShadow:
              "0 16px 40px rgba(150,110,10,.13)",

            marginBottom:
              22,

            position:
              "relative",

            overflow:
              "hidden",
          }}
        >
          <span
            style={{
              position:
                "absolute",

              right:
                28,

              top:
                20,

              fontSize:
                31,

              opacity:
                0.4,
            }}
          >
            ✨
          </span>

          <span
            style={{
              position:
                "absolute",

              left:
                28,

              bottom:
                20,

              fontSize:
                28,

              opacity:
                0.35,
            }}
          >
            ⭐
          </span>

          <div
            style={{
              fontSize:
                68,
            }}
          >
            👑
          </div>

          <h1
            style={{
              margin:
                "8px 0",

              color:
                "#795500",

              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            سجل المتوجين
          </h1>

          <p
            style={{
              margin:
                0,

              color:
                "#796b40",

              lineHeight:
                1.9,

              fontWeight:
                700,
            }}
          >
            هنا نحتفي بملوك القراءة والإملاء في أكاديمية لغتي.
          </p>
        </section>

        {/* الإحصاءات */}

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",

            gap:
              13,

            marginBottom:
              22,
          }}
        >
          <StatCard
            icon="📖👑"
            title="تيجان القراءة"
            value={
              readingAchievements.length
            }
          />

          <StatCard
            icon="✍️👑"
            title="تيجان الإملاء"
            value={
              spellingAchievements.length
            }
          />

          <StatCard
            icon="💎"
            title="الإتقان الكامل"
            value={
              fullMasteryCount
            }
          />

          <StatCard
            icon="🏆"
            title="طلاب متوجون"
            value={
              champions.length
            }
          />
        </section>

        {/* أكثر طالب جمع تيجان */}

        {!loading &&
          topChampion && (
            <section
              style={{
                marginBottom:
                  22,

                padding:
                  22,

                borderRadius:
                  27,

                background:
                  "linear-gradient(135deg,#fff6ca,#ffffff)",

                border:
                  "2px solid #e7c754",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap:
                  16,

                flexWrap:
                  "wrap",

                boxShadow:
                  "0 10px 28px rgba(145,110,20,.08)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    15,
                }}
              >
                <StudentAvatar
                  photoUrl={
                    topChampion.personalPhotoUrl
                  }
                  icon={
                    topChampion.selectedAvatarIcon
                  }
                  name={
                    topChampion.studentName
                  }
                  size={74}
                />

                <div>
                  <div
                    style={{
                      color:
                        "#947000",

                      fontWeight:
                        900,

                      marginBottom:
                        5,
                    }}
                  >
                    🏆 الأكثر جمعًا للتيجان
                  </div>

                  <strong
                    style={{
                      display:
                        "block",

                      fontSize:
                        22,

                      color:
                        "#173b31",
                    }}
                  >
                    {
                      topChampion.studentName
                    }
                  </strong>

                  {topChampion.classroom && (
                    <span
                      style={{
                        display:
                          "block",

                        marginTop:
                          4,

                        color:
                          "#7d847c",

                        fontWeight:
                          700,
                      }}
                    >
                      {
                        topChampion.classroom
                      }
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  padding:
                    "10px 17px",

                  borderRadius:
                    999,

                  background:
                    "#8a6500",

                  color:
                    "#ffffff",

                  fontWeight:
                    900,

                  fontSize:
                    18,
                }}
              >
                👑{" "}
                {
                  topChampion.totalCrowns
                }{" "}
                تاج
              </div>
            </section>
          )}

        {/* التبويبات */}

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",

            gap:
              10,

            marginBottom:
              20,
          }}
        >
          <TabButton
            active={
              activeTab === "all"
            }
            onClick={() =>
              setActiveTab(
                "all"
              )
            }
          >
            👑 الجميع
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "reading"
            }
            onClick={() =>
              setActiveTab(
                "reading"
              )
            }
          >
            📖 القراءة
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "spelling"
            }
            onClick={() =>
              setActiveTab(
                "spelling"
              )
            }
          >
            ✍️ الإملاء
          </TabButton>
        </section>

        {/* التحميل */}

        {loading && (
          <section
            style={
              statusCardStyle
            }
          >
            ⏳ جارٍ تحميل سجل المتوجين...
          </section>
        )}

        {/* الخطأ */}

        {!loading &&
          errorMessage && (
            <section
              style={{
                ...statusCardStyle,

                background:
                  "#fff2f2",

                color:
                  "#a43d3d",

                border:
                  "1px solid #efcccc",
              }}
            >
              {
                errorMessage
              }
            </section>
          )}

        {/* لا توجد تيجان */}

        {!loading &&
          !errorMessage &&
          visibleAchievements.length ===
            0 && (
            <section
              style={
                statusCardStyle
              }
            >
              <div
                style={{
                  fontSize:
                    53,

                  marginBottom:
                    10,
                }}
              >
                🌱
              </div>

              <strong>
                لا توجد تتويجات في هذا القسم حتى الآن.
              </strong>
            </section>
          )}

        {/* سجل التتويجات */}

        {!loading &&
          !errorMessage &&
          visibleAchievements.length >
            0 && (
            <section
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit,minmax(270px,1fr))",

                gap:
                  16,
              }}
            >
              {visibleAchievements.map(
                (item) => (
                  <article
                    key={
                      item.id
                    }
                    style={{
                      background:
                        "#ffffff",

                      borderRadius:
                        24,

                      padding:
                        19,

                      border:
                        item.mode ===
                        "reading"
                          ? "2px solid #c7e9d8"
                          : "2px solid #ecd994",

                      boxShadow:
                        "0 9px 24px rgba(35,75,60,.07)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          13,
                      }}
                    >
                      <StudentAvatar
                        photoUrl={
                          item.personalPhotoUrl
                        }
                        icon={
                          item.selectedAvatarIcon
                        }
                        name={
                          item.studentName
                        }
                      />

                      <div
                        style={{
                          minWidth:
                            0,
                        }}
                      >
                        <strong
                          style={{
                            display:
                              "block",

                            color:
                              "#173b31",

                            fontSize:
                              19,
                          }}
                        >
                          {
                            item.studentName
                          }
                        </strong>

                        {item.classroom && (
                          <span
                            style={{
                              display:
                                "block",

                              marginTop:
                                3,

                              color:
                                "#7b887f",

                              fontSize:
                                13,

                              fontWeight:
                                700,
                            }}
                          >
                            {
                              item.classroom
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop:
                          15,

                        padding:
                          "13px 14px",

                        borderRadius:
                          17,

                        background:
                          item.mode ===
                          "reading"
                            ? "#effaf5"
                            : "#fff9e8",
                      }}
                    >
                      <strong
                        style={{
                          display:
                            "block",

                          color:
                            item.mode ===
                            "reading"
                              ? "#14734f"
                              : "#906700",

                          fontSize:
                            18,
                        }}
                      >
                        {
                          item.kingTitle
                        }
                      </strong>

                      <div
                        style={{
                          marginTop:
                            7,

                          color:
                            "#5f7067",

                          fontWeight:
                            800,
                        }}
                      >
                        📚 في درس:{" "}
                        {
                          item.lessonName
                        }
                      </div>
                    </div>

                    {item.fullMastery && (
                      <div
                        style={{
                          marginTop:
                            11,

                          padding:
                            "9px 11px",

                          borderRadius:
                            13,

                          background:
                            "#eaf8f1",

                          color:
                            "#176c46",

                          fontWeight:
                            900,

                          textAlign:
                            "center",
                        }}
                      >
                        💎 إتقان كامل للدرس
                      </div>
                    )}
                  </article>
                )
              )}
            </section>
          )}

        {/* ترتيب الطلاب */}

        {!loading &&
          champions.length >
            0 && (
            <section
              style={{
                marginTop:
                  26,

                padding:
                  22,

                borderRadius:
                  28,

                background:
                  "#ffffff",

                border:
                  "1px solid #e1ebe6",

                boxShadow:
                  "0 10px 28px rgba(40,80,65,.07)",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 7px",

                  color:
                    "#176c46",
                }}
              >
                🏅 حصيلة التيجان
              </h2>

              <p
                style={{
                  margin:
                    "0 0 17px",

                  color:
                    "#687970",
                }}
              >
                عرض مختصر لعدد التيجان التي جمعها كل طالب.
              </p>

              <div
                style={{
                  display:
                    "grid",

                  gap:
                    10,
                }}
              >
                {champions.map(
                  (
                    champion,
                    index
                  ) => (
                    <div
                      key={
                        champion.studentId ||
                        champion.studentName
                      }
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        gap:
                          12,

                        padding:
                          13,

                        borderRadius:
                          18,

                        background:
                          index === 0
                            ? "#fff9df"
                            : "#f8fbf9",

                        border:
                          index === 0
                            ? "1px solid #ead077"
                            : "1px solid #e2ebe6",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            11,
                        }}
                      >
                        <span
                          style={{
                            width:
                              29,

                            fontWeight:
                              900,

                            color:
                              "#8a6500",

                            textAlign:
                              "center",
                          }}
                        >
                          {index +
                            1}
                        </span>

                        <StudentAvatar
                          photoUrl={
                            champion.personalPhotoUrl
                          }
                          icon={
                            champion.selectedAvatarIcon
                          }
                          name={
                            champion.studentName
                          }
                          size={
                            48
                          }
                        />

                        <div>
                          <strong>
                            {
                              champion.studentName
                            }
                          </strong>

                          {champion.classroom && (
                            <small
                              style={{
                                display:
                                  "block",

                                marginTop:
                                  3,

                                color:
                                  "#7a8981",
                              }}
                            >
                              {
                                champion.classroom
                              }
                            </small>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            7,

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={
                            countBadgeStyle
                          }
                        >
                          📖{" "}
                          {
                            champion.readingCrowns
                          }
                        </span>

                        <span
                          style={
                            countBadgeStyle
                          }
                        >
                          ✍️{" "}
                          {
                            champion.spellingCrowns
                          }
                        </span>

                        <span
                          style={{
                            ...countBadgeStyle,

                            background:
                              "#fff3bc",

                            color:
                              "#806000",
                          }}
                        >
                          👑{" "}
                          {
                            champion.totalCrowns
                          }
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}

function StudentAvatar({
  photoUrl,
  icon,
  name,
  size = 60,
}: {
  photoUrl: string;
  icon: string;
  name: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width:
          size,

        height:
          size,

        borderRadius:
          "50%",

        display:
          "grid",

        placeItems:
          "center",

        overflow:
          "hidden",

        background:
          "#fff8d9",

        border:
          "2px solid #e6c343",

        fontSize:
          Math.round(
            size * 0.55
          ),

        flexShrink:
          0,
      }}
    >
      {photoUrl ? (
        <img
          src={
            photoUrl
          }
          alt={
            name
          }
          style={{
            width:
              "100%",

            height:
              "100%",

            objectFit:
              "cover",
          }}
        />
      ) : (
        <span>
          {icon ||
            "👦🏻"}
        </span>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding:
          18,

        borderRadius:
          22,

        background:
          "#ffffff",

        border:
          "1px solid #ead58a",

        boxShadow:
          "0 8px 22px rgba(130,100,15,.06)",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            34,
        }}
      >
        {
          icon
        }
      </div>

      <strong
        style={{
          display:
            "block",

          marginTop:
            6,

          color:
            "#805d00",

          fontSize:
            27,
        }}
      >
        {
          value
        }
      </strong>

      <span
        style={{
          display:
            "block",

          marginTop:
            4,

          color:
            "#746e5c",

          fontWeight:
            800,
        }}
      >
        {
          title
        }
      </span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        padding:
          "14px 9px",

        borderRadius:
          17,

        border:
          active
            ? "2px solid #a57a00"
            : "1px solid #ddd",

        background:
          active
            ? "#fff3bf"
            : "#ffffff",

        color:
          active
            ? "#795900"
            : "#52635a",

        fontWeight:
          900,

        fontSize:
          16,

        cursor:
          "pointer",
      }}
    >
      {
        children
      }
    </button>
  );
}

const backButtonStyle = {
  textDecoration:
    "none",

  background:
    "#ffffff",

  color:
    "#176c46",

  border:
    "1px solid #d2e7dc",

  borderRadius:
    "15px",

  padding:
    "11px 16px",

  fontWeight:
    900,
};

const statusCardStyle = {
  padding:
    "30px 20px",

  borderRadius:
    24,

  background:
    "#ffffff",

  border:
    "1px solid #e2ebe6",

  textAlign:
    "center" as const,

  color:
    "#66776e",

  fontWeight:
    900,
};

const countBadgeStyle = {
  padding:
    "6px 10px",

  borderRadius:
    999,

  background:
    "#edf8f2",

  color:
    "#176c46",

  fontWeight:
    900,

  fontSize:
    13,
};