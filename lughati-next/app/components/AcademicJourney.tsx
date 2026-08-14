"use client";

import { useEffect, useMemo, useState } from "react";

type AcademicJourneyEvent = {
  id: string;
  title: string;
  icon: string;
  semester: 1 | 2;
  date: string | null;
  category: "study" | "holiday" | "national" | "exam";
};

type AcademicJourneyProps = {
  events: AcademicJourneyEvent[];
};

function parseEventDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function getDaysDifference(
  eventDate: Date,
  today: Date
) {
  const eventDay = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  );

  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Math.round(
    (eventDay.getTime() -
      currentDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getCompactCountdown(
  date: string | null,
  today: Date | null
) {
  if (!date) {
    return "التاريخ قريبًا";
  }

  const eventDate = parseEventDate(date);

  if (!today) {
    return "جارٍ التحميل...";
  }

  const days = getDaysDifference(
    eventDate,
    today
  );

  if (days === 0) {
    return "اليوم 🎉";
  }

  if (days === 1) {
    return "غدًا";
  }

  if (days === 2) {
    return "بعد يومين";
  }

  if (days > 2) {
    return `بعد ${days} يومًا`;
  }

  return "تمت ✅";
}

export default function AcademicJourney({
  events,
}: AcademicJourneyProps) {
  const [today, setToday] =
    useState<Date | null>(null);

  const [showAll, setShowAll] =
    useState(false);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const currentIndex =
    useMemo(() => {
      if (!today) {
        return 0;
      }

      const datedEvents =
        events
          .map((event, index) => ({
            index,
            date: event.date
              ? parseEventDate(
                  event.date
                )
              : null,
          }))
          .filter(
            (
              item
            ): item is {
              index: number;
              date: Date;
            } =>
              item.date !== null
          );

      const passedEvents =
        datedEvents.filter(
          (item) =>
            item.date.getTime() <=
            today.getTime()
        );

      if (
        passedEvents.length > 0
      ) {
        return passedEvents[
          passedEvents.length - 1
        ].index;
      }

      return (
        datedEvents[0]?.index ??
        0
      );
    }, [events, today]);

  const nextIndex =
    useMemo(() => {
      for (
        let index =
          currentIndex + 1;
        index < events.length;
        index++
      ) {
        if (events[index]) {
          return index;
        }
      }

      return null;
    }, [
      currentIndex,
      events,
    ]);

  const currentEvent =
    events[currentIndex] ??
    null;

  const nextEvent =
    nextIndex !== null
      ? events[nextIndex]
      : null;

  const currentWeek =
    useMemo(() => {
      if (!today) {
        return null;
      }

      const semesterStartEvent =
        events.find(
          (event) =>
            event.title.includes(
              "بداية"
            ) &&
            event.title.includes(
              "الدراسي"
            )
        );

      if (
        !semesterStartEvent?.date
      ) {
        return null;
      }

      const start =
        parseEventDate(
          semesterStartEvent.date
        );

      const todayDate =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

      const startDate =
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );

      const days =
        Math.floor(
          (todayDate.getTime() -
            startDate.getTime()) /
            (1000 *
              60 *
              60 *
              24)
        );

      if (days < 0) {
        return 0;
      }

      return (
        Math.floor(days / 7) + 1
      );
    }, [events, today]);

  return (
    <section
      dir="rtl"
      style={{
        maxWidth: "1180px",
        margin:
          "20px auto",
        padding:
          "20px",
        borderRadius: "28px",
        background:
          "linear-gradient(135deg, #f7fffa, #fffdf2)",
        border:
          "1px solid #d7eee1",
        boxShadow:
          "0 10px 28px rgba(38,105,75,0.08)",
      }}
    >
      {/* رأس مختصر */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom:
            "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: "#178157",
              marginBottom:
                "4px",
            }}
          >
            🌍 رحلة العام الدراسي
          </div>

          <h2
            style={{
              margin: 0,
              color: "#164f39",
              fontSize:
                "clamp(21px,3vw,28px)",
            }}
          >
            أين نحن الآن؟
          </h2>
        </div>

        {currentWeek !== null && (
          <div
            style={{
              background:
                "#e8f9ef",
              color: "#126b49",
              padding:
                "9px 14px",
              borderRadius:
                "999px",
              fontWeight: 900,
              fontSize:
                "14px",
            }}
          >
            {currentWeek === 0
              ? "🚀 نستعد للانطلاق"
              : `📅 الأسبوع ${currentWeek}`}
          </div>
        )}
      </div>

      {/* الحالي + القادم */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
        }}
      >
        {currentEvent && (
          <article
            style={{
              background:
                "linear-gradient(135deg, #fff9cf, #ffffff)",
              border:
                "2px solid #f1d45d",
              borderRadius:
                "22px",
              padding:
                "16px",
              display: "flex",
              alignItems:
                "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius:
                  "18px",
                background:
                  "#fff1a8",
                display: "grid",
                placeItems:
                  "center",
                fontSize:
                  "30px",
                flexShrink: 0,
              }}
            >
              {
                currentEvent.icon
              }
            </div>

            <div>
              <small
                style={{
                  color:
                    "#9a7400",
                  fontWeight:
                    900,
                }}
              >
                📍 أنت هنا الآن
              </small>

              <h3
                style={{
                  margin:
                    "4px 0",
                  fontSize:
                    "19px",
                  color:
                    "#5d4b00",
                }}
              >
                {
                  currentEvent.title
                }
              </h3>

              <span
                style={{
                  color:
                    "#776d43",
                  fontSize:
                    "14px",
                }}
              >
                {getCompactCountdown(
                  currentEvent.date,
                  today
                )}
              </span>
            </div>
          </article>
        )}

        {nextEvent && (
          <article
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #cde6da",
              borderRadius:
                "22px",
              padding:
                "16px",
              display: "flex",
              alignItems:
                "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius:
                  "18px",
                background:
                  "#e9f8ef",
                display: "grid",
                placeItems:
                  "center",
                fontSize:
                  "30px",
                flexShrink: 0,
              }}
            >
              {nextEvent.icon}
            </div>

            <div>
              <small
                style={{
                  color:
                    "#158258",
                  fontWeight:
                    900,
                }}
              >
                المحطة القادمة
              </small>

              <h3
                style={{
                  margin:
                    "4px 0",
                  fontSize:
                    "19px",
                  color:
                    "#174d38",
                }}
              >
                {
                  nextEvent.title
                }
              </h3>

              <span
                style={{
                  color:
                    "#68786f",
                  fontSize:
                    "14px",
                }}
              >
                {getCompactCountdown(
                  nextEvent.date,
                  today
                )}
              </span>
            </div>
          </article>
        )}
      </div>

      {/* خط المحطات */}

      <div
        style={{
          marginTop:
            "16px",
          display: "flex",
          alignItems:
            "center",
          gap: "6px",
          overflowX: "auto",
          paddingBottom:
            "4px",
        }}
      >
        {events.map(
          (event, index) => {
            const active =
              index ===
              currentIndex;

            const passed =
              index <
              currentIndex;

            return (
              <div
                key={event.id}
                title={
                  event.title
                }
                style={{
                  flex:
                    "1 0 44px",
                  maxWidth:
                    "90px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    height:
                      "6px",
                    borderRadius:
                      "999px",
                    background:
                      active
                        ? "#efc629"
                        : passed
                          ? "#42bd80"
                          : "#dce9e2",
                    marginBottom:
                      "7px",
                  }}
                />

                <span
                  style={{
                    fontSize:
                      "20px",
                    opacity:
                      active
                        ? 1
                        : 0.65,
                  }}
                >
                  {event.icon}
                </span>
              </div>
            );
          }
        )}
      </div>

      {/* فتح التفاصيل */}

      <div
        style={{
          marginTop:
            "13px",
          textAlign:
            "center",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowAll(
              (current) =>
                !current
            )
          }
          style={{
            border: "none",
            background:
              "#eef9f3",
            color: "#14724d",
            padding:
              "9px 15px",
            borderRadius:
              "14px",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {showAll
            ? "إخفاء الرحلة ↑"
            : "عرض الرحلة كاملة ↓"}
        </button>
      </div>

      {/* التفاصيل عند الطلب فقط */}

      {showAll && (
        <div
          style={{
            marginTop:
              "15px",
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px,1fr))",
            gap: "10px",
          }}
        >
          {events.map(
            (event, index) => (
              <article
                key={event.id}
                style={{
                  padding:
                    "13px",
                  borderRadius:
                    "18px",
                  background:
                    index ===
                    currentIndex
                      ? "#fff9d8"
                      : "#ffffff",
                  border:
                    index ===
                    currentIndex
                      ? "1px solid #e9ca44"
                      : "1px solid #e2ebe6",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "25px",
                  }}
                >
                  {event.icon}
                </div>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "6px",
                    color:
                      "#184e39",
                  }}
                >
                  {event.title}
                </strong>

                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      "5px",
                    color:
                      "#6a786f",
                  }}
                >
                  {getCompactCountdown(
                    event.date,
                    today
                  )}
                </small>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}