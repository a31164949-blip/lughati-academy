"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "../../firebase";

type CrownAchievement = {
  id: string;
  mode: string;
  lessonName: string;
  king: boolean;
  kingTitle: string;
  fullMastery: boolean;
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type CrownData = {
  success: boolean;
  readingKingCount?: number;
  spellingKingCount?: number;
  masteryCount?: number;
  latestAchievement?: CrownAchievement | null;
  achievements?: CrownAchievement[];
  message?: string;
};

export default function LughatiCrownStudentPage() {
  const [
    user,
    setUser,
  ] = useState<User | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    achievements,
    setAchievements,
  ] =
    useState<CrownAchievement[]>(
      []
    );

  const [
    readingKingCount,
    setReadingKingCount,
  ] = useState(0);

  const [
    spellingKingCount,
    setSpellingKingCount,
  ] = useState(0);

  const [
    masteryCount,
    setMasteryCount,
  ] = useState(0);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
        }
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser =
      user;

    async function loadCrownData() {
      try {
        setLoading(true);
        setMessage("");

        const token =
          await currentUser.getIdToken();

        const response =
          await fetch(
            "/api/student-crown",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache:
                "no-store",
            }
          );

        const data =
          (await response.json()) as CrownData;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل تيجانك."
          );
        }

        setReadingKingCount(
          typeof data.readingKingCount ===
            "number"
            ? data.readingKingCount
            : 0
        );

        setSpellingKingCount(
          typeof data.spellingKingCount ===
            "number"
            ? data.spellingKingCount
            : 0
        );

        setMasteryCount(
          typeof data.masteryCount ===
            "number"
            ? data.masteryCount
            : 0
        );

        setAchievements(
          Array.isArray(
            data.achievements
          )
            ? data.achievements
            : []
        );
      } catch (error) {
        console.error(
          "تعذر تحميل تاج لغتي:",
          error
        );

        setMessage(
          "تعذر تحميل تيجانك حاليًا."
        );

        setAchievements([]);
      } finally {
        setLoading(false);
      }
    }

    void loadCrownData();
  }, [user]);

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

  const fullMasteryAchievements =
    useMemo(
      () =>
        achievements.filter(
          (item) =>
            item.fullMastery
        ),
      [achievements]
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
          "linear-gradient(180deg,#fff8dc 0%,#f5fbf7 45%,#ffffff 100%)",

        fontFamily:
          "Arial, sans-serif",

        color:
          "#173b31",
      }}
    >
      <div
        style={{
          maxWidth:
            1100,

          margin:
            "0 auto",
        }}
      >
        {/* العودة */}

        <div
          style={{
            marginBottom:
              18,
          }}
        >
          <Link
            href="/journey"
            style={{
              display:
                "inline-block",

              textDecoration:
                "none",

              background:
                "#ffffff",

              color:
                "#176c46",

              border:
                "1px solid #d6e9df",

              borderRadius:
                15,

              padding:
                "11px 17px",

              fontWeight:
                900,
            }}
          >
            ← العودة إلى رحلتي
          </Link>
        </div>

        {/* رأس الصفحة */}

        <section
          style={{
            textAlign:
              "center",

            borderRadius:
              32,

            padding:
              "34px 20px",

            marginBottom:
              22,

            background:
              "linear-gradient(135deg,#fff0a8,#fffdf3)",

            border:
              "3px solid #e9c343",

            boxShadow:
              "0 16px 38px rgba(163,120,10,.12)",

            position:
              "relative",

            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              position:
                "absolute",

              top:
                18,

              right:
                24,

              fontSize:
                30,

              opacity:
                0.4,
            }}
          >
            ✨
          </div>

          <div
            style={{
              position:
                "absolute",

              bottom:
                18,

              left:
                24,

              fontSize:
                28,

              opacity:
                0.35,
            }}
          >
            ⭐
          </div>

          <div
            style={{
              fontSize:
                66,
            }}
          >
            👑
          </div>

          <h1
            style={{
              margin:
                "8px 0",

              color:
                "#7b5700",

              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            تيجاني
          </h1>

          <p
            style={{
              margin:
                0,

              color:
                "#7a6b3e",

              lineHeight:
                1.9,

              fontWeight:
                700,
            }}
          >
            هنا أحتفظ بإنجازاتي في القراءة والإملاء،
            وكل تاج يحكي قصة تقدمي.
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
              14,

            marginBottom:
              22,
          }}
        >
          <CrownStatCard
            icon="📖👑"
            title="تيجان القراءة"
            value={
              readingKingCount
            }
          />

          <CrownStatCard
            icon="✍️👑"
            title="تيجان الإملاء"
            value={
              spellingKingCount
            }
          />

          <CrownStatCard
            icon="💎"
            title="الإتقان الكامل"
            value={
              masteryCount
            }
          />
        </section>

        {/* حالة التحميل */}

        {loading && (
          <section
            style={{
              background:
                "#ffffff",

              borderRadius:
                24,

              padding:
                32,

              textAlign:
                "center",

              border:
                "1px solid #e6eee9",

              fontWeight:
                900,

              color:
                "#6b7b73",
            }}
          >
            ⏳ جارٍ تجهيز سجل تيجانك...
          </section>
        )}

        {/* الخطأ */}

        {!loading &&
          message && (
            <section
              style={{
                background:
                  "#fff4f4",

                borderRadius:
                  22,

                padding:
                  22,

                textAlign:
                  "center",

                border:
                  "1px solid #f0cccc",

                color:
                  "#a13f3f",

                fontWeight:
                  900,
              }}
            >
              {
                message
              }
            </section>
          )}

        {/* لا توجد تيجان */}

        {!loading &&
          !message &&
          achievements.length ===
            0 && (
            <section
              style={{
                background:
                  "#ffffff",

                borderRadius:
                  28,

                padding:
                  "42px 20px",

                textAlign:
                  "center",

                border:
                  "1px solid #e8eadf",
              }}
            >
              <div
                style={{
                  fontSize:
                    58,
                }}
              >
                🌱
              </div>

              <h2
                style={{
                  color:
                    "#176c46",

                  margin:
                    "12px 0 8px",
                }}
              >
                رحلتي نحو أول تاج بدأت
              </h2>

              <p
                style={{
                  margin:
                    0,

                  color:
                    "#748279",

                  lineHeight:
                    1.8,
                }}
              >
                واصل التدريب، وكل محاولة تقربك من
                نجم ثم بطل ثم أمير ثم ملك.
              </p>
            </section>
          )}

        {/* تيجان القراءة */}

        {!loading &&
          readingAchievements.length >
            0 && (
            <CrownSection
              title="📖 تيجان القراءة"
              subtitle="الدروس التي حصلت فيها على لقب ملك القراءة"
              achievements={
                readingAchievements
              }
              accent="#177a55"
              background="#effaf5"
            />
          )}

        {/* تيجان الإملاء */}

        {!loading &&
          spellingAchievements.length >
            0 && (
            <CrownSection
              title="✍️ تيجان الإملاء"
              subtitle="الدروس التي حصلت فيها على لقب ملك الإملاء"
              achievements={
                spellingAchievements
              }
              accent="#9a6900"
              background="#fff8df"
            />
          )}

        {/* الإتقان الكامل */}

        {!loading &&
          fullMasteryAchievements.length >
            0 && (
            <section
              style={{
                marginTop:
                  22,

                borderRadius:
                  28,

                padding:
                  22,

                background:
                  "linear-gradient(135deg,#edf9f3,#ffffff)",

                border:
                  "2px solid #b9e5cd",

                boxShadow:
                  "0 10px 26px rgba(20,100,70,.07)",
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
                💎 دروسي المتقنة بالكامل
              </h2>

              <p
                style={{
                  margin:
                    "0 0 16px",

                  color:
                    "#687970",

                  lineHeight:
                    1.8,
                }}
              >
                أتقنت جميع صفحات هذه الدروس بلا أخطاء.
              </p>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",

                  gap:
                    12,
                }}
              >
                {fullMasteryAchievements.map(
                  (item) => (
                    <div
                      key={
                        `master-${item.id}`
                      }
                      style={{
                        background:
                          "#ffffff",

                        borderRadius:
                          18,

                        padding:
                          16,

                        border:
                          "1px solid #cce9d9",

                        display:
                          "flex",

                        gap:
                          12,

                        alignItems:
                          "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            32,
                        }}
                      >
                        💎
                      </span>

                      <div>
                        <strong
                          style={{
                            display:
                              "block",

                            color:
                              "#176c46",
                          }}
                        >
                          {
                            item.lessonName
                          }
                        </strong>

                        <small
                          style={{
                            color:
                              "#76877d",

                            fontWeight:
                              700,
                          }}
                        >
                          إتقان كامل للدرس
                        </small>
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

function CrownStatCard({
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
        background:
          "#ffffff",

        borderRadius:
          22,

        padding:
          19,

        textAlign:
          "center",

        border:
          "1px solid #ead589",

        boxShadow:
          "0 8px 22px rgba(130,100,20,.06)",
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
            7,

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
            5,

          color:
            "#7c755d",

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

function CrownSection({
  title,
  subtitle,
  achievements,
  accent,
  background,
}: {
  title: string;
  subtitle: string;
  achievements: CrownAchievement[];
  accent: string;
  background: string;
}) {
  return (
    <section
      style={{
        marginTop:
          22,

        borderRadius:
          28,

        padding:
          22,

        background,

        border:
          `2px solid ${accent}22`,

        boxShadow:
          "0 10px 28px rgba(40,80,65,.07)",
      }}
    >
      <h2
        style={{
          margin:
            "0 0 7px",

          color:
            accent,
        }}
      >
        {
          title
        }
      </h2>

      <p
        style={{
          margin:
            "0 0 17px",

          color:
            "#6c7a72",

          lineHeight:
            1.8,
        }}
      >
        {
          subtitle
        }
      </p>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(240px,1fr))",

          gap:
            14,
        }}
      >
        {achievements.map(
          (item) => (
            <article
              key={
                item.id
              }
              style={{
                background:
                  "#ffffff",

                borderRadius:
                  22,

                padding:
                  18,

                border:
                  `1px solid ${accent}35`,

                boxShadow:
                  "0 7px 18px rgba(40,70,55,.06)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    12,
                }}
              >
                <div
                  style={{
                    width:
                      60,

                    height:
                      60,

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
                      "2px solid #e7c54a",

                    fontSize:
                      34,

                    flexShrink:
                      0,
                  }}
                >
                  {item.personalPhotoUrl ? (
                    <img
                      src={
                        item.personalPhotoUrl
                      }
                      alt=""
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
                      {item.selectedAvatarIcon ||
                        "👦🏻"}
                    </span>
                  )}
                </div>

                <div>
                  <strong
                    style={{
                      display:
                        "block",

                      color:
                        accent,

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
                        5,

                      color:
                        "#596b62",

                      fontWeight:
                        800,
                    }}
                  >
                    {
                      item.lessonName
                    }
                  </div>
                </div>
              </div>

              {item.fullMastery && (
                <div
                  style={{
                    marginTop:
                      14,

                    padding:
                      "9px 11px",

                    borderRadius:
                      13,

                    background:
                      "#eef9f3",

                    color:
                      "#176c46",

                    fontWeight:
                      900,

                    textAlign:
                      "center",
                  }}
                >
                  💎 إتقان كامل
                </div>
              )}
            </article>
          )
        )}
      </div>
    </section>
  );
}