"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  onSnapshot,
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
  classroom?: string;
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

type StudentOption = {
  id: string;
  studentName: string;
  classroom: string;
  active: boolean;
  archived: boolean;
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

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState("");

  const [students, setStudents] =
    useState<StudentOption[]>([]);

  const [studentsLoading, setStudentsLoading] =
    useState(true);

  const [directMessageOpen, setDirectMessageOpen] =
    useState(false);

  const [selectedClassroom, setSelectedClassroom] =
    useState("الكل");

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [directSubject, setDirectSubject] =
    useState("");

  const [directBody, setDirectBody] =
    useState("");

  const [sendingDirectMessage, setSendingDirectMessage] =
    useState(false);

  const classrooms = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.classroom)
            .filter(Boolean)
        )
      ).sort((first, second) =>
        first.localeCompare(second, "ar")
      ),
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          selectedClassroom === "الكل" ||
          student.classroom === selectedClassroom
      ),
    [selectedClassroom, students]
  );

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

  async function loadStudents() {
    try {
      setStudentsLoading(true);

      const snapshot = await getDocs(
        collection(db, "students")
      );

      if (!active) return;

      const rows: StudentOption[] = snapshot.docs
        .map((studentDocument) => {
          const data = studentDocument.data();

          return {
            id: studentDocument.id,
            studentName:
              typeof data.studentName === "string"
                ? data.studentName
                : typeof data.name === "string"
                  ? data.name
                  : "طالب دون اسم",
            classroom:
              typeof data.classroom === "string"
                ? data.classroom
                : "غير محدد",
            active: data.active !== false,
            archived: data.archived === true,
          };
        })
        .filter(
          (student) =>
            student.active && !student.archived
        )
        .sort((first, second) =>
          first.studentName.localeCompare(
            second.studentName,
            "ar"
          )
        );

      setStudents(rows);
    } catch (error) {
      console.error(
        "تعذر تحميل قائمة الطلاب:",
        error
      );

      if (active) {
        setFeedback(
          "❌ تعذر تحميل قائمة الطلاب."
        );
      }
    } finally {
      if (active) {
        setStudentsLoading(false);
      }
    }
  }

  void loadStudents();

  return () => {
    active = false;
  };
}, []);

useEffect(() => {
  setLoading(true);

  const messagesQuery = query(
    collection(
      db,
      "studentTeacherMessages"
    ),
    orderBy(
      "createdAt",
      "desc"
    )
  );

  const unsubscribe = onSnapshot(
    messagesQuery,
    (snapshot) => {
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

      setMessages(items);
      setReplyTexts(
        (currentReplies) => {
          const nextReplies = {
            ...currentReplies,
          };

          items.forEach((item) => {
            if (
              typeof nextReplies[item.id] !==
              "string"
            ) {
              nextReplies[item.id] =
                item.teacherReply || "";
            }
          });

          return nextReplies;
        }
      );
      setLoading(false);
    },
    (error) => {
      console.error(
        "تعذر تحديث رسائل الطلاب:",
        error
      );

      setFeedback(
        "❌ تعذر تحديث رسائل الطلاب."
      );
      setLoading(false);
    }
  );

  return unsubscribe;
}, []);

  async function sendDirectMessage() {
    const student = students.find(
      (item) => item.id === selectedStudentId
    );

    const subject = directSubject.trim();
    const body = directBody.trim();

    if (!student) {
      setFeedback("⚠️ اختر الطالب أولًا.");
      return;
    }

    if (!subject) {
      setFeedback("⚠️ اكتب عنوان الرسالة.");
      return;
    }

    if (!body) {
      setFeedback("⚠️ اكتب نص الرسالة.");
      return;
    }

    try {
      setSendingDirectMessage(true);
      setFeedback("");

      await addDoc(
        collection(
          db,
          "studentTeacherMessages"
        ),
        {
          studentId: student.id,
          studentName: student.studentName,
          classroom: student.classroom,
          category: "teacher",
          categoryLabel: "✉️ رسالة من المعلم",
          message: subject,
          teacherReply: body,
          status: "replied",
          studentViewedReply: false,
          sender: "teacher",
          createdAt: serverTimestamp(),
          repliedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setFeedback(
        `✅ أُرسلت الرسالة إلى ${student.studentName}.`
      );

      setSelectedStudentId("");
      setDirectSubject("");
      setDirectBody("");
      setDirectMessageOpen(false);

      await loadMessages();
    } catch (error) {
      console.error(
        "تعذر إرسال رسالة المعلم:",
        error
      );

      setFeedback(
        "❌ تعذر إرسال الرسالة حاليًا."
      );
    } finally {
      setSendingDirectMessage(false);
    }
  }

  async function deleteMessage(
    item: StudentMessage
  ) {
    const label =
      item.category === "teacher"
        ? item.message || "رسالة المعلم"
        : item.message || "رسالة الطالب";

    const confirmed = window.confirm(
      `هل تريد حذف رسالة ${item.studentName || "الطالب"}؟\n\n${label}\n\nلن يمكن استعادة الرسالة بعد الحذف.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);
      setFeedback("");

      await deleteDoc(
        doc(
          db,
          "studentTeacherMessages",
          item.id
        )
      );

      setFeedback(
        `✅ تم حذف رسالة ${item.studentName || "الطالب"}.`
      );
    } catch (error) {
      console.error(
        "تعذر حذف الرسالة:",
        error
      );

      setFeedback(
        "❌ تعذر حذف الرسالة حاليًا."
      );
    } finally {
      setDeletingId(null);
    }
  }

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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setDirectMessageOpen(
                  (current) => !current
                )
              }
              className="rounded-2xl bg-amber-400 px-5 py-3 font-black text-amber-950 shadow-lg transition hover:bg-amber-300"
            >
              ✉️ رسالة جديدة لطالب
            </button>

            <Link
              href="/teacher"
              className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg"
            >
              ← العودة إلى لوحة المعلم
            </Link>
          </div>
        </div>

        {directMessageOpen && (
          <section className="mb-6 rounded-3xl border-2 border-amber-200 bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="m-0 text-2xl font-black text-slate-800">
                ✉️ إرسال رسالة جديدة
              </h2>
              <p className="mb-0 mt-2 font-bold text-slate-500">
                اختر الطالب واكتب رسالتك؛ وستظهر له داخل ظرف الرسائل.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-black text-slate-700">
                  الفصل
                </span>
                <select
                  value={selectedClassroom}
                  onChange={(event) => {
                    setSelectedClassroom(
                      event.target.value
                    );
                    setSelectedStudentId("");
                  }}
                  disabled={studentsLoading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-emerald-500"
                >
                  <option value="الكل">
                    جميع الفصول
                  </option>
                  {classrooms.map((classroom) => (
                    <option
                      key={classroom}
                      value={classroom}
                    >
                      {classroom}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-black text-slate-700">
                  اسم الطالب
                </span>
                <select
                  value={selectedStudentId}
                  onChange={(event) =>
                    setSelectedStudentId(
                      event.target.value
                    )
                  }
                  disabled={studentsLoading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-emerald-500"
                >
                  <option value="">
                    {studentsLoading
                      ? "جاري تحميل الطلاب..."
                      : "اختر الطالب"}
                  </option>
                  {filteredStudents.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.studentName} — {student.classroom}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block font-black text-slate-700">
                عنوان الرسالة
              </span>
              <input
                type="text"
                value={directSubject}
                onChange={(event) =>
                  setDirectSubject(
                    event.target.value
                  )
                }
                maxLength={100}
                placeholder="مثال: تذكير بقراءة درس الغد"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block font-black text-slate-700">
                نص الرسالة
              </span>
              <textarea
                value={directBody}
                onChange={(event) =>
                  setDirectBody(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={1000}
                placeholder="اكتب رسالتك للطالب هنا..."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 font-bold leading-8 outline-none focus:border-emerald-500"
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <small className="font-bold text-slate-400">
                🔒 تصل الرسالة إلى الطالب المحدد فقط.
              </small>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDirectMessageOpen(false)
                  }
                  disabled={sendingDirectMessage}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-600"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void sendDirectMessage()
                  }
                  disabled={sendingDirectMessage}
                  className="rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingDirectMessage
                    ? "⏳ جاري الإرسال..."
                    : "📨 إرسال الرسالة"}
                </button>
              </div>
            </div>
          </section>
        )}

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

                        {replied && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              item.studentViewedReply ===
                              true
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.studentViewedReply ===
                            true
                              ? "👁️ تم اطلاع الطالب"
                              : "○ لم يطّلع بعد"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* رسالة الطالب */}

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <strong className="block text-sm text-slate-500">
                        {item.category === "teacher"
                          ? "📝 عنوان رسالة المعلم"
                          : "💬 رسالة الطالب"}
                      </strong>

                      <p className="mb-0 mt-2 whitespace-pre-wrap font-bold leading-8 text-slate-800">
                        {item.message}
                      </p>
                    </div>

                    {/* الرد */}

                    <div className="mt-4">
                      <label className="mb-2 block font-black text-emerald-800">
                        {item.category === "teacher"
                          ? "👨‍🏫 نص رسالة المعلم"
                          : "👨‍🏫 رد المعلم"}
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

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={
                              deletingId ===
                                item.id ||
                              savingId ===
                                item.id
                            }
                            onClick={() =>
                              void deleteMessage(
                                item
                              )
                            }
                            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId ===
                            item.id
                              ? "⏳ جاري الحذف..."
                              : "🗑️ حذف الرسالة"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              savingId ===
                                item.id ||
                              deletingId ===
                                item.id
                            }
                            onClick={() =>
                              void saveReply(
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