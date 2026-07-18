"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  published: boolean;
  pinned: boolean;
  createdAt?: Timestamp | null;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [published, setPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "announcements"),
      (snapshot) => {
        const items = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            title: data.title ?? "",
            message: data.message ?? "",
            priority: data.priority ?? "normal",
            published: data.published ?? false,
            pinned: data.pinned ?? false,
            createdAt: data.createdAt ?? null,
          } as Announcement;
        });

        items.sort((a, b) => {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }

  const firstDate = a.createdAt?.toMillis() ?? 0;
  const secondDate = b.createdAt?.toMillis() ?? 0;

  return secondDate - firstDate;
});

        setAnnouncements(items);
        setStatusMessage("");
      },
      (error) => {
        console.error(error);
        setStatusMessage(
          "تعذر قراءة الإعلانات. سنراجع صلاحيات Firestore في الخطوة التالية."
        );
      }
    );

    return unsubscribe;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      setStatusMessage("فضلاً اكتب عنوان الإعلان ونصه.");
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      if (editingId) {
  await updateDoc(doc(db, "announcements", editingId), {
    title: title.trim(),
    message: message.trim(),
    priority,
    published,
  });

  setEditingId(null);
  setStatusMessage("تم تحديث الإعلان بنجاح ✅");
} else {
  await addDoc(collection(db, "announcements"), {
    title: title.trim(),
    message: message.trim(),
    priority,
    published,
    createdAt: serverTimestamp(),
  });

  setStatusMessage("تم حفظ الإعلان بنجاح ✅");
}

      setTitle("");
      setMessage("");
      setPriority("normal");
      setPublished(true);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      setStatusMessage("تعذر حفظ الإعلان. سنراجع صلاحيات Firestore.");
    } finally {
      setIsSaving(false);
    }
  }


function startEditing(item: Announcement) {
  setEditingId(item.id);
  setTitle(item.title);
  setMessage(item.message);
  setPriority(item.priority);
  setPublished(item.published);
  setStatusMessage("أنت الآن تعدّل الإعلان المحدد.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}


  async function togglePublished(item: Announcement) {
    try {
      await updateDoc(doc(db, "announcements", item.id), {
        published: !item.published,
      });
    } catch (error) {
      console.error(error);
      setStatusMessage("تعذر تغيير حالة الإعلان.");
    }
  }
  async function togglePinned(item: Announcement) {
  try {
    await updateDoc(doc(db, "announcements", item.id), {
      pinned: !item.pinned,
    });

    setStatusMessage(
      item.pinned
        ? "تم إلغاء تثبيت الإعلان."
        : "تم تثبيت الإعلان في الأعلى 📌"
    );
  } catch (error) {
    console.error(error);
    setStatusMessage("تعذر تغيير حالة التثبيتت");
  }
}
    
async function removeAnnouncement(id: string) {
    const confirmed = window.confirm("هل تريد حذف هذا الإعلان نهائيًا؟");

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "announcements", id));
      setStatusMessage("تم حذف الإعلان.");
    } catch (error) {
      console.error(error);
      setStatusMessage("تعذر حذف الإعلان.");
    }
  }

  function priorityLabel(value: Priority) {
    if (value === "urgent") return "🔴 عاجل";
    if (value === "important") return "🟡 مهم";
    return "🟢 عادي";
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-sky-50 px-4 py-8 text-slate-900"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-emerald-700">لوحة المعلم</p>
            <h1 className="mt-1 text-3xl font-black md:text-4xl">
              📢 إدارة الإعلانات
            </h1>
            <p className="mt-2 text-slate-600">
              أضف الإعلانات التي ستظهر للطلاب في أكاديمية لغتي.
            </p>
          </div>

          <Link
            href="/teacher"
            className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-bold text-emerald-700 shadow-sm"
          >
            العودة إلى لوحة المعلم
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-5 text-2xl font-black">إعلان جديد</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block font-bold">عنوان الإعلان</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="مثال: تحديث واجبات اليوم"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold">نص الإعلان</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="اكتب تفاصيل الإعلان هنا..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold">أهمية الإعلان</label>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as Priority)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <option value="normal">🟢 عادي</option>
                  <option value="important">🟡 مهم</option>
                  <option value="urgent">🔴 عاجل</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-emerald-50 p-4">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(event) => setPublished(event.target.checked)}
                  className="h-5 w-5"
                />
                <span className="font-bold">نشر الإعلان مباشرة</span>
              </label>

              <button
  type="submit"
  disabled={isSaving}
  className="w-full rounded-2xl bg-emerald-600 px-5 py-4 ..."
>
  {isSaving
    ? "⏳ جارٍ الحفظ..."
    : editingId
      ? "✏️ تحديث الإعلان"
      : "💾 حفظ الإعلان"}

              </button>
              {editingId && (
  <button
    type="button"
    onClick={() => {
      setEditingId(null);
      setTitle("");
      setMessage("");
      setPriority("normal");
      setPublished(true);
      setStatusMessage("");
    }}
    className="mt-3 w-full rounded-2xl bg-gray-200 px-5 py-4 font-bold text-gray-700"
  >
    ❌ إلغاء التعديل
  </button>
)}
            </form>

            {statusMessage && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                {statusMessage}
              </p>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">الإعلانات الحالية</h2>
              <span className="rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-700">
                {announcements.length} إعلان
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
                لا توجد إعلانات حتى الآن.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-bold">
                          {priorityLabel(item.priority)}
                        </span>
                        {item.pinned && (
  <div className="mb-2">
    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
      📌 إعلان مثبت
    </span>
  </div>
)}
                        <h3 className="mt-2 text-xl font-black">
                          {item.title}
                        </h3>
                        <p className="mt-2 leading-8 text-slate-600">
                          {item.message}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${
                          item.published
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.published ? "منشور" : "مخفي"}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => togglePublished(item)}
                        className="rounded-xl bg-sky-50 px-4 py-2 font-bold text-sky-700"
                      >
                        {item.published ? "👁️ إخفاء" : "🚀 نشر"}
                      </button>
                      <button
  type="button"
  onClick={() => togglePinned(item)}
  className="rounded-xl bg-amber-50 px-4 py-2 font-bold text-amber-700"
>
  {item.pinned ? "📌 إلغاء التثبيت" : "📌 تثبيت"}
</button>
<button
  type="button"
  onClick={() => startEditing(item)}
  className="rounded-xl bg-amber-50 px-4 py-2 font-bold text-amber-700"
>
  ✏️ تعديل
</button>
                      <button
                        type="button"
                        onClick={() => removeAnnouncement(item.id)}
                        className="rounded-xl bg-red-50 px-4 py-2 font-bold text-red-700"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
);
}