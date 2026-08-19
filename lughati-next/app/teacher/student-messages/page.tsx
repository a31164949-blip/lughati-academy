"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";

type StudentMessage = {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  categoryLabel?: string;
  message: string;
  teacherReply?: string;
  status?: string;
  studentViewedReply?: boolean;

  createdAt?: {
    toDate?: () => Date;
  } | null;
};

export default function TeacherStudentMessagesPage() {
  const [messages, setMessages] =
    useState<StudentMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [replyTexts, setReplyTexts] =
    useState<Record<string, string>>({});

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState("");

  async function fetchMessages() {
  const q = query(
    collection(
      db,
      "studentTeacherMessages"
    ),
    orderBy(
      "createdAt",
      "desc"
    )
  );

  const snapshot =
    await getDocs(q);

  const items: StudentMessage[] =
    snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<
          StudentMessage,
          "id"
        >),
      })
    );

  return items;
}

function buildReplyTexts(
  items: StudentMessage[]
) {
  const initialReplies:
    Record<string, string> = {};

  items.forEach((item) => {
    initialReplies[item.id] =
      item.teacherReply || "";
  });

  return initialReplies;
}

async function loadMessages() {
  try {
    setLoading(true);
    setFeedback("");

    const items =
      await fetchMessages();

    setMessages(items);

    setReplyTexts(
      buildReplyTexts(items)
    );
  } catch (error) {
    console.error(
      "تعذر تحميل رسائل الطلاب:",
      error
    );

    setFeedback(
      "❌ تعذر تحميل رسائل الطلاب."
    );
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  let active = true;

  async function loadInitialMessages() {
    try {
      const items =
        await fetchMessages();

      if (!active) {
        return;
      }

      setMessages(items);

      setReplyTexts(
        buildReplyTexts(items)
      );
    } catch (error) {
      console.error(
        "تعذر تحميل رسائل الطلاب:",
        error
      );

      if (active) {
        setFeedback(
          "❌ تعذر تحميل رسائل الطلاب."
        );
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void loadInitialMessages();

  return () => {
    active = false;
  };
}, []);

  async function saveReply(
    item: StudentMessage
  ) {
    const reply =
      replyTexts[item.id]?.trim() ||
      "";

    if (!reply) {
      setFeedback(
        "⚠️ اكتب الرد أولًا."
      );
      return;
    }

    try {
      setSavingId(item.id);
      setFeedback("");

      await updateDoc(
        doc(
          db,
          "studentTeacherMessages",
          item.id
        ),
        {
          teacherReply: reply,
          status: "replied",
          studentViewedReply: false,
          repliedAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

      setFeedback(
        `✅ تم إرسال الرد إلى ${item.studentName || "الطالب"}.`
      );

      await loadMessages();
    } catch (error) {
      console.error(
        "تعذر حفظ رد المعلم:",
        error
      );

      setFeedback(
        "❌ تعذر حفظ الرد."
      );
    } finally {
      setSavingId(null);
    }
  }

  function formatDate(
    item: StudentMessage
  ) {
    try {
      const date =
        item.createdAt?.toDate?.();

      if (!date) {
        return "";
      }

      return new Intl.DateTimeFormat(
        "ar-SA",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      ).format(date);
    } catch {
      return "";
    }
  }

  function getCategoryLabel(
    item: StudentMessage
  ) {
    if (item.categoryLabel) {
      return item.categoryLabel;
    }

    switch (item.category) {
      case "lesson":
        return "📚 سؤال عن درس";

      case "homework":
        return "📝 استفسار عن واجب";

      case "help":
        return "🆘 أحتاج مساعدة";

      case "other":
        return "💬 رسالة أخرى";

      default:
        return "💬 رسالة";
    }
  }

  const newMessagesCount =
    messages.filter(
      (item) =>
        !item.teacherReply?.trim()
    ).length;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-blue-50 px-4 py-8"
    >
      <div className="mx-auto max-w-5xl">

        {/* رأس الصفحة */}

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-black text-emerald-600">
              لوحة المعلم
            </p>

            <h1 className="text-3xl font-black text-slate-800">
              📨 رسائل الطلاب
            </h1>

            <p className="mt-2 font-bold text-slate-500">
              تابع استفسارات الطلاب وأرسل الرد
              مباشرة داخل الأكاديمية.
            </p>
          </div>

          <Link
            href="/teacher"
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg"
          >
            ← العودة إلى لوحة المعلم
          </Link>
        </div>

        {/* الملخص */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow">
            <div className="text-sm font-black text-slate-500">
              📨 جميع الرسائل
            </div>

            <div className="mt-2 text-3xl font-black text-emerald-700">
              {messages.length}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow">
            <div className="text-sm font-black text-slate-500">
              🔔 بانتظار الرد
            </div>

            <div className="mt-2 text-3xl font-black text-amber-600">
              {newMessagesCount}
            </div>
          </div>
        </section>

        {feedback && (
          <div className="mb-5 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700">
            {feedback}
          </div>
        )}

        {/* الرسائل */}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center font-black text-slate-500 shadow">
            ⏳ جاري تحميل رسائل الطلاب...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center shadow">
            <div className="text-6xl">
              📨
            </div>

            <h2 className="mt-4 text-xl font-black text-slate-700">
              لا توجد رسائل حاليًا
            </h2>

            <p className="mt-2 font-bold text-slate-400">
              ستظهر هنا الرسائل التي يرسلها
              الطلاب من صفحة «تواصل مع معلمي».
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {messages.map(
              (item) => {
                const replied =
                  Boolean(
                    item.teacherReply?.trim()
                  );

                return (
                  <article
                    key={item.id}
                    className={`rounded-3xl border bg-white p-6 shadow-lg ${
                      replied
                        ? "border-emerald-100"
                        : "border-amber-200"
                    }`}
                  >
                    {/* بيانات الطالب */}

                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-black text-slate-800">
                          👤{" "}
                          {item.studentName ||
                            "الطالب"}
                        </div>

                        <div className="mt-1 text-xs font-bold text-slate-400">
                          {formatDate(
                            item
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                          {getCategoryLabel(
                            item
                          )}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            replied
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {replied
                            ? "✅ تم الرد"
                            : "🔔 جديدة"}
                        </span>
                      </div>
                    </div>

                    {/* رسالة الطالب */}

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <strong className="block text-sm text-slate-500">
                        💬 رسالة الطالب
                      </strong>

                      <p className="mb-0 mt-2 whitespace-pre-wrap font-bold leading-8 text-slate-800">
                        {item.message}
                      </p>
                    </div>

                    {/* الرد */}

                    <div className="mt-4">
                      <label className="mb-2 block font-black text-emerald-800">
                        👨‍🏫 رد المعلم
                      </label>

                      <textarea
                        value={
                          replyTexts[
                            item.id
                          ] || ""
                        }
                        onChange={(e) =>
                          setReplyTexts(
                            (
                              current
                            ) => ({
                              ...current,
                              [item.id]:
                                e.target
                                  .value,
                            })
                          )
                        }
                        rows={4}
                        maxLength={1000}
                        placeholder="اكتب ردك للطالب هنا..."
                        className="w-full resize-none rounded-2xl border border-emerald-100 px-4 py-3 font-bold leading-8 outline-none transition focus:border-emerald-500"
                      />

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <small className="font-bold text-slate-400">
                          سيظهر الرد للطالب داخل
                          صفحة «رسائلي السابقة».
                        </small>

                        <button
                          type="button"
                          disabled={
                            savingId ===
                            item.id
                          }
                          onClick={() =>
                            saveReply(
                              item
                            )
                          }
                          className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId ===
                          item.id
                            ? "⏳ جاري الحفظ..."
                            : replied
                              ? "✏️ تحديث الرد"
                              : "📨 إرسال الرد"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}