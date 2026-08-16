"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "../../firebase";

type AvatarItem = {
  id: string;
  icon: string;
  name: string;
  description: string;
  requiredPoints: number;
  background: string;
};

type AvatarApiData = {
  success: boolean;
  points?: number;
  selectedAvatar?: string;
  selectedAvatarIcon?: string;
  selectedAvatarName?: string;
  message?: string;
};

const avatars: AvatarItem[] = [
  {
    id: "boy-1",
    icon: "👦🏻",
    name: "فارس الصغير",
    description:
      "بداية رحلتي في الأكاديمية",
    requiredPoints: 0,
    background:
      "linear-gradient(135deg,#dcfce7,#ffffff)",
  },
  {
    id: "boy-2",
    icon: "🧒🏻",
    name: "القارئ الصغير",
    description:
      "أحب القراءة والتعلم",
    requiredPoints: 0,
    background:
      "linear-gradient(135deg,#dbeafe,#ffffff)",
  },
  {
    id: "boy-3",
    icon: "👦🏽",
    name: "المستكشف",
    description:
      "أبحث وأتعلم وأكتشف",
    requiredPoints: 0,
    background:
      "linear-gradient(135deg,#fef3c7,#ffffff)",
  },
  {
    id: "boy-4",
    icon: "🧑🏻‍🎓",
    name: "طالب المعرفة",
    description:
      "أواصل التقدم كل يوم",
    requiredPoints: 600,
    background:
      "linear-gradient(135deg,#ede9fe,#ffffff)",
  },
  {
    id: "boy-5",
    icon: "👦🏾",
    name: "بطل النشاط",
    description:
      "أنجز مهامي وأتقدم",
    requiredPoints: 800,
    background:
      "linear-gradient(135deg,#ffedd5,#ffffff)",
  },
  {
    id: "boy-6",
    icon: "🧑🏽‍💻",
    name: "المبدع",
    description:
      "أتعلم وأصنع أفكارًا جميلة",
    requiredPoints: 1000,
    background:
      "linear-gradient(135deg,#cffafe,#ffffff)",
  },
  {
    id: "boy-7",
    icon: "🦸🏻‍♂️",
    name: "بطل لغتي",
    description:
      "واصل الإنجاز لفتح هذه الشخصية",
    requiredPoints: 1500,
    background:
      "linear-gradient(135deg,#ffe4e6,#ffffff)",
  },
  {
    id: "boy-8",
    icon: "🤴🏻",
    name: "نجم الأكاديمية",
    description:
      "إحدى الشخصيات المميزة",
    requiredPoints: 2000,
    background:
      "linear-gradient(135deg,#fef9c3,#ffffff)",
  },
];

export default function StudentAvatarPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [points, setPoints] =
    useState(0);

  const [
    selectedAvatar,
    setSelectedAvatar,
  ] = useState("boy-1");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

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

    const currentUser = user;

    async function loadStudentAvatar() {
      try {
        setLoading(true);
        setMessage("");

        const token =
          await currentUser.getIdToken();

        const response =
          await fetch(
            "/api/student-avatar",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as AvatarApiData;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل الشخصية."
          );
        }

        setPoints(
          typeof data.points ===
          "number"
            ? data.points
            : 0
        );

        setSelectedAvatar(
          typeof data.selectedAvatar ===
          "string"
            ? data.selectedAvatar
            : "boy-1"
        );
      } catch (error) {
        console.error(
          "تعذر تحميل صور الطالب:",
          error
        );

        setMessage(
          "تعذر تحميل الصور حاليًا."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStudentAvatar();
  }, [user]);

  async function chooseAvatar(
    avatar: AvatarItem
  ) {
    if (!user) {
      setMessage(
        "يرجى تسجيل الدخول من جديد."
      );
      return;
    }

    if (
      points <
      avatar.requiredPoints
    ) {
      setMessage(
        `🔒 تحتاج إلى ${avatar.requiredPoints} نقطة لفتح ${avatar.name}.`
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const token =
        await user.getIdToken();

      const response =
        await fetch(
          "/api/student-avatar",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                avatarId:
                  avatar.id,
              }),
          }
        );

      const data =
        (await response.json()) as AvatarApiData;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "تعذر حفظ الشخصية."
        );
      }

      setSelectedAvatar(
        typeof data.selectedAvatar ===
        "string"
          ? data.selectedAvatar
          : avatar.id
      );

      setMessage(
        data.message ||
          `✅ تم اختيار صورة «${avatar.name}» بنجاح.`
      );
    } catch (error) {
      console.error(
        "تعذر حفظ الصورة:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر حفظ الصورة، حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "#f4fbf7",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background:
              "#ffffff",
            padding:
              "22px 30px",
            borderRadius: 22,
            color: "#176c46",
            fontWeight: 900,
            boxShadow:
              "0 10px 30px rgba(30,100,70,.10)",
          }}
        >
          ⏳ جارٍ تجهيز صورك...
        </div>
      </main>
    );
  }

  const currentAvatar =
    avatars.find(
      (avatar) =>
        avatar.id ===
        selectedAvatar
    ) ?? avatars[0];

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#effbf5 0%,#f7fbff 55%,#fffaf0 100%)",
        padding:
          "24px 16px 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#173b31",
      }}
    >
      <div
        style={{
          maxWidth: 1050,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <Link
            href="/journey"
            style={{
              textDecoration:
                "none",
              background:
                "#ffffff",
              color: "#176c46",
              border:
                "1px solid #cfe7dd",
              borderRadius: 16,
              padding:
                "12px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى رحلتي
          </Link>

          <div
            style={{
              background:
                "#fff8d9",
              border:
                "1px solid #f1da8b",
              borderRadius:
                999,
              padding:
                "10px 16px",
              color: "#886400",
              fontWeight: 900,
            }}
          >
            🏅 نقاطي: {points}
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#147a55,#31b47f)",
            color: "#ffffff",
            borderRadius: 30,
            padding:
              "34px 20px",
            textAlign:
              "center",
            boxShadow:
              "0 16px 40px rgba(20,122,85,.18)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 60,
            }}
          >
            👦🏻
          </div>

          <h1
            style={{
              margin:
                "10px 0 8px",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            اختر شخصيتي
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: 17,
            }}
          >
            اختر الصورة التي تمثلك،
            وافتح شخصيات جديدة مع تقدمك وإنجازاتك ⭐
          </p>
        </section>

        <section
          style={{
            background:
              "#ffffff",
            borderRadius: 26,
            padding: 20,
            border:
              "1px solid #dcebe4",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius:
                  "50%",
                background:
                  "#e8f8ef",
                display: "grid",
                placeItems:
                  "center",
                fontSize: 48,
              }}
            >
              {
                currentAvatar.icon
              }
            </div>

            <div>
              <div
                style={{
                  color:
                    "#64748b",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                شخصيتي الحالية
              </div>

              <h2
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#176c46",
                }}
              >
                {
                  currentAvatar.name
                }
              </h2>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(210px,1fr))",
            gap: 16,
          }}
        >
          {avatars.map(
            (avatar) => {
              const unlocked =
                points >=
                avatar.requiredPoints;

              const selected =
                selectedAvatar ===
                avatar.id;

              return (
                <button
                  key={
                    avatar.id
                  }
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    chooseAvatar(
                      avatar
                    )
                  }
                  style={{
                    position:
                      "relative",

                    border:
                      selected
                        ? "3px solid #18a66e"
                        : unlocked
                          ? "2px solid #d8e9e1"
                          : "2px solid #e4e7e5",

                    background:
                      unlocked
                        ? avatar.background
                        : "#f1f3f2",

                    borderRadius: 24,

                    padding:
                      "22px 15px",

                    minHeight: 260,

                    cursor:
                      unlocked
                        ? "pointer"
                        : "not-allowed",

                    opacity:
                      unlocked
                        ? 1
                        : 0.7,

                    boxShadow:
                      selected
                        ? "0 12px 28px rgba(24,166,110,.18)"
                        : "0 8px 22px rgba(40,80,65,.07)",

                    textAlign:
                      "center",

                    color:
                      "#173b31",
                  }}
                >
                  {selected && (
                    <span
                      style={{
                        position:
                          "absolute",
                        top: 12,
                        right: 12,

                        background:
                          "#18a66e",

                        color:
                          "#ffffff",

                        borderRadius:
                          999,

                        padding:
                          "6px 10px",

                        fontSize: 12,

                        fontWeight: 900,
                      }}
                    >
                      ✅ مختارة
                    </span>
                  )}

                  {!unlocked && (
                    <span
                      style={{
                        position:
                          "absolute",
                        top: 12,
                        left: 12,

                        width: 38,
                        height: 38,

                        borderRadius:
                          "50%",

                        background:
                          "#ffffff",

                        display:
                          "grid",

                        placeItems:
                          "center",

                        fontSize: 20,
                      }}
                    >
                      🔒
                    </span>
                  )}

                  <div
                    style={{
                      width: 105,
                      height: 105,

                      margin:
                        "8px auto 16px",

                      borderRadius:
                        "50%",

                      background:
                        unlocked
                          ? "#ffffff"
                          : "#e4e7e5",

                      display:
                        "grid",

                      placeItems:
                        "center",

                      fontSize: 67,

                      boxShadow:
                        "0 7px 18px rgba(0,0,0,.06)",

                      filter:
                        unlocked
                          ? "none"
                          : "grayscale(1)",
                    }}
                  >
                    {
                      avatar.icon
                    }
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 8px",

                      fontSize: 20,

                      color:
                        unlocked
                          ? "#176c46"
                          : "#7b8782",
                    }}
                  >
                    {avatar.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      minHeight: 44,

                      color:
                        unlocked
                          ? "#64756d"
                          : "#929a96",

                      lineHeight: 1.7,
                    }}
                  >
                    {
                      avatar.description
                    }
                  </p>

                  <div
                    style={{
                      marginTop: 14,

                      borderRadius:
                        14,

                      padding:
                        "9px 10px",

                      background:
                        selected
                          ? "#dcfce7"
                          : unlocked
                            ? "#ffffff"
                            : "#e5e7e6",

                      color:
                        selected
                          ? "#08734b"
                          : unlocked
                            ? "#176c46"
                            : "#747d79",

                      fontWeight: 900,

                      fontSize: 14,
                    }}
                  >
                    {selected
                      ? "✅ شخصيتي الحالية"
                      : unlocked
                        ? "اختر هذه الشخصية"
                        : `🔒 تفتح عند ${avatar.requiredPoints} نقطة`}
                  </div>
                </button>
              );
            }
          )}
        </div>

        {message && (
          <div
            style={{
              marginTop: 20,

              padding:
                "15px 18px",

              borderRadius: 18,

              background:
                message.startsWith(
                  "✅"
                )
                  ? "#eaf9f1"
                  : "#fff8e5",

              color:
                message.startsWith(
                  "✅"
                )
                  ? "#176c46"
                  : "#846116",

              textAlign:
                "center",

              fontWeight: 900,

              lineHeight: 1.8,
            }}
          >
            {message}
          </div>
        )}

        <section
          style={{
            marginTop: 24,

            borderRadius: 24,

            padding: 20,

            background:
              "#eef8ff",

            border:
              "1px solid #d4e8f7",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 8px",

              color:
                "#075985",

              fontSize: 20,
            }}
          >
            📷 صورتي الشخصية
          </h2>

          <p
            style={{
              margin: 0,

              color:
                "#526a78",

              lineHeight: 1.8,
            }}
          >
            إذا رغبت الأسرة في استخدام صورة شخصية للطالب،
            فسيكون رفعها من حساب ولي الأمر، ثم تعتمد من المعلم
            قبل ظهورها في الأكاديمية.
          </p>
        </section>
      </div>
    </main>
  );
}