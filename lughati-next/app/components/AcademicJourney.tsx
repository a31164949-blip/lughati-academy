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

function getCategoryLabel(
  category: AcademicJourneyEvent["category"]
) {
  if (category === "study") return "📚 محطة دراسية";
  if (category === "holiday") return "🎉 إجازة";
  if (category === "national") return "🇸🇦 مناسبة وطنية";
  return "✏️ اختبارات";
}

function parseEventDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function getDaysDifference(eventDate: Date, today: Date) {
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
    (eventDay.getTime() - currentDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getCountdownText(date: string | null, today: Date | null) {
  if (!date) {
    return "سيُضاف التاريخ الرسمي قريبًا";
  }

  const eventDate = parseEventDate(date);

  const formattedDate = new Intl.DateTimeFormat(
    "ar-SA-u-ca-gregory",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(eventDate);

  if (!today) {
    return `📅 ${formattedDate}`;
  }

  const days = getDaysDifference(eventDate, today);

  if (days === 0) {
    return `🎉 موعد المحطة اليوم — ${formattedDate}`;
  }

  if (days === 1) {
    return `⏳ بقي يوم واحد — ${formattedDate}`;
  }

  if (days === 2) {
    return `⏳ بقي يومان — ${formattedDate}`;
  }

  if (days > 2 && days <= 10) {
    return `⏳ بقي ${days} أيام — ${formattedDate}`;
  }

  if (days > 10) {
    return `⏳ بقي ${days} يومًا — ${formattedDate}`;
  }

  return `✅ مضت المحطة — ${formattedDate}`;
}

export default function AcademicJourney({
  events,
}: AcademicJourneyProps) {
  const [today, setToday] = useState<Date | null>(null);
const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
  setToday(new Date());
  setIsMounted(true);
}, []);

  const currentIndex = useMemo(() => {
    if (!today) return 0;

    const datedEvents = events
      .map((event, index) => ({
        index,
        date: event.date ? parseEventDate(event.date) : null,
      }))
      .filter(
        (
          item
        ): item is {
          index: number;
          date: Date;
        } => item.date !== null
      );

    const passedEvents = datedEvents.filter(
      (item) => item.date.getTime() <= today.getTime()
    );

    if (passedEvents.length > 0) {
      return passedEvents[passedEvents.length - 1].index;
    }

    return datedEvents[0]?.index ?? 0;
  }, [events, today]);

  return (
    <section className="academicJourney">
      <div className="academicJourney__header">
        <span className="academicJourney__label">
          🌍 رحلة العام الدراسي
        </span>

        <h2>محطات جميلة نعيشها معًا طوال العام</h2>

        <p>
          تابع رحلتنا خطوة بخطوة، وتعرّف على المحطة الحالية
          وما ينتظرنا بعدها.
        </p>
      </div>

      <div className="academicJourney__scroll">
        <div className="academicJourney__track">
          {events.map((event, index) => {
            const isCurrent = index === currentIndex;

            return (
              <article
                className={`academicJourney__item ${
                  isCurrent
                    ? "academicJourney__item--current"
                    : ""
                }`}
                key={event.id}
              >
                <div className="academicJourney__icon">
                  {event.icon}
                </div>

                <div className="academicJourney__card">
                  <span className="academicJourney__number">
                    {isCurrent
                      ? "📍 أنت هنا الآن"
                      : `المحطة ${index + 1}`}
                  </span>

                  <h3>{event.title}</h3>

                  <p>
  {isMounted
    ? getCountdownText(event.date, today)
    : "جارٍ تحميل موعد المحطة..."}
</p>

                  <span
                    className={`academicJourney__category academicJourney__category--${event.category}`}
                  >
                    {getCategoryLabel(event.category)}
                  </span>
                </div>

                {index < events.length - 1 && (
                  <div className="academicJourney__line" />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}