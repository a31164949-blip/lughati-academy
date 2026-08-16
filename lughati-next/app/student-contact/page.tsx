"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import {
  auth,
  db,
} from "../../firebase";

type StudentMessage = {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  message: string;
  teacherReply?: string;
  status?: string;
  createdAt?: {
    toDate?: () => Date;
  } | null;
};

const categories = [
  {
    value: "lesson",
    icon: "📚",
    label: "سؤال عن درس",
  },
  {
    value: "homework",
    icon: "📝",
    label: "استفسار عن واجب",
  },
  {
    value: "help",
    icon: "🆘",
    label: "أحتاج مساعدة",
  },
  {
    value: "other",
    icon: "💬",
    label: "رسالة أخرى",
  },
];

export default function StudentContactPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [studentId, setStudentId] =
    useState("");

  const [studentName, setStudentName] =
    useState("");

  const [category, setCategory] =
    useState("lesson");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<StudentMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [feedback, setFeedback] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (!currentUser) {
            setLoading(false);
            return;
          }

          const tokenResult =
  await currentUser.getIdTokenResult(true);

const claimedStudentId =
  typeof tokenResult.claims.studentDocId === "string"
    ? tokenResult.claims.studentDocId
    : "";

const name =
  localStorage.getItem("studentName") || "الطالب";

if (!claimedStudentId) {
  console.error(
    "لا يوجد studentDocId داخل توكن الطالب."
  );

  setFeedback(
    "⚠️ تعذر التعرف على حساب الطالب. سجّل الخروج ثم ادخل مرة أخرى."
  );

  setLoading(false);
  return;
}

setStudentId(claimedStudentId);
setStudentName(name);

await loadMessages(claimedStudentId);
        }
      );

    return unsubscribe;
  }, []);

  async function loadMessages(
    currentStudentId: string
  ) {
    try {
      setLoading(true);

      const q = query(
        collection(
          db,
          "studentTeacherMessages"
        ),
        where(
          "studentId",
          "==",
          currentStudentId
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

      const snapshot =
        await getDocs(q);

      const items =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...(item.data() as Omit<
              StudentMessage,
              "id"
            >),
          })
        );

      setMessages(items);
    } catch (error) {
      console.error(
        "تعذر تحميل الرسائل:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!user) {
      setFeedback(
        "⚠️ يرجى تسجيل الدخول من جديد."
      );
      return;
    }

    if (!studentId) {
      setFeedback(
        "⚠️ تعذر التعرف على حساب الطالب."
      );
      return;
    }

    if (!message.trim()) {
      setFeedback(
        "⚠️ اكتب رسالتك أولًا."
      );
      return;
    }

    try {
      setSending(true);
      setFeedback("");

      const selectedCategory =
        categories.find(
          (item) =>
            item.value ===
            category
        );

      await addDoc(
        collection(
          db,
          "studentTeacherMessages"
        ),
        {
          studentId,
          studentName,
          category,
          categoryLabel:
            selectedCategory?.label ||
            "رسالة",
          message: message.trim(),
          teacherReply: "",
          status: "new",
          studentViewedReply: false,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

      setMessage("");

      setFeedback(
        "✅ تم إرسال رسالتك إلى المعلم بنجاح."
      );

      await loadMessages(
        studentId
      );
    } catch (error) {
      console.error(
        "تعذر إرسال الرسالة:",
        error
      );

      setFeedback(
        "❌ تعذر إرسال الرسالة حاليًا."
      );
    } finally {
      setSending(false);
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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-blue-50 px-4 py-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              💬 تواصل آمن داخل الأكاديمية
            </span>

            <h1 className="mt-3 text-3xl font-black text-slate-800">
              تواصل مع معلمي
            </h1>

            <p className="mt-2 font-bold leading-7 text-slate-500">
              اكتب استفسارك أو طلب المساعدة،
              وسيصل مباشرة إلى معلمك.
            </p>
          </div>

          <Link
            href="/journey"
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg"
          >
            ← العودة إلى رحلتي
          </Link>
        </div>

        <section className="mb-7 rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
          <div className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3">
            <p className="m-0 text-sm font-black text-emerald-800">
              👤 المرسل:{" "}
              {studentName ||
                "الطالب"}
            </p>
          </div>

          <h2 className="mb-4 text-xl font-black text-slate-800">
            ما نوع رسالتك؟
          </h2>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(
              (item) => {
                const active =
                  category ===
                  item.value;

                return (
                  <button
                    key={
                      item.value
                    }
                    type="button"
                    onClick={() =>
                      setCategory(
                        item.value
                      )
                    }
                    className={`rounded-2xl border px-4 py-4 text-center font-black transition ${
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <span className="block text-2xl">
                      {
                        item.icon
                      }
                    </span>

                    <span className="mt-2 block">
                      {
                        item.label
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <label className="mb-2 block font-black text-slate-700">
            رسالتك
          </label>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            rows={6}
            maxLength={800}
            placeholder="اكتب رسالتك هنا بطريقة واضحة ومختصرة..."
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-4 font-bold leading-8 outline-none transition focus:border-emerald-500"
          />

          <div className="mt-2 text-left text-xs font-bold text-slate-400">
            {message.length} / 800
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 text-sm font-bold text-slate-400">
              🔒 الرسائل تبقى داخل الأكاديمية.
            </p>

            <button
              type="button"
              onClick={
                handleSend
              }
              disabled={
                sending
              }
              className="rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending
                ? "⏳ جاري الإرسال..."
                : "📨 إرسال للمعلم"}
            </button>
          </div>

          {feedback && (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 font-black text-slate-700">
              {feedback}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-slate-800">
              📨 رسائلي السابقة
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-500">
              ستجد رد المعلم هنا
              عند وصوله.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black text-slate-500 shadow">
              ⏳ جاري تحميل الرسائل...
            </div>
          ) : messages.length ===
            0 ? (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-9 text-center shadow-sm">
              <div className="text-5xl">
                💬
              </div>

              <h3 className="mt-3 font-black text-slate-700">
                لا توجد رسائل حتى الآن
              </h3>

              <p className="mt-2 font-bold text-slate-400">
                يمكنك إرسال أول
                استفسار إلى معلمك
                من النموذج أعلاه.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {messages.map(
                (item) => (
                  <article
                    key={
                      item.id
                    }
                    className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                        {categories.find(
                          (
                            categoryItem
                          ) =>
                            categoryItem.value ===
                            item.category
                        )?.label ||
                          "رسالة"}
                      </span>

                      <small className="font-bold text-slate-400">
                        {formatDate(
                          item
                        )}
                      </small>
                    </div>

                    <p className="m-0 whitespace-pre-wrap font-bold leading-8 text-slate-700">
                      {
                        item.message
                      }
                    </p>

                    <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                      <strong className="block text-emerald-800">
                        👨‍🏫 رد المعلم
                      </strong>

                      <p className="mb-0 mt-2 whitespace-pre-wrap font-bold leading-7 text-slate-600">
                        {item.teacherReply?.trim()
                          ? item.teacherReply
                          : "لم يصل الرد بعد."}
                      </p>
                    </div>
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