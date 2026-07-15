"use client";

import { FormEvent, useState } from "react";

const classes = [
  { value: "", label: "اختر الفصل" },
  { value: "2A", label: "الصف الثاني أ" },
  { value: "2B", label: "الصف الثاني ب" },
  { value: "2C", label: "الصف الثاني ج" },
];

export default function LoginPage() {
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentName.trim()) {
      setMessage("اكتب اسمك يا بطل.");
      return;
    }

    if (!studentClass) {
      setMessage("اختر فصلك.");
      return;
    }

    if (!/^\d{4}$/.test(studentCode)) {
      setMessage("يجب أن يتكون رمز الطالب من أربعة أرقام.");
      return;
    }

    setMessage(`أهلًا بك يا ${studentName} 🌟 تم تسجيل دخولك بنجاح.`);
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-sky-50 to-amber-50 px-5 py-10"
    >
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl md:grid-cols-2">
        <div className="flex flex-col items-center justify-center bg-emerald-600 p-8 text-center text-white">
          <div className="mb-5 text-8xl">👦🏻</div>

          <h1 className="mb-3 text-4xl font-black">مرحبًا بك يا بطل</h1>

          <p className="max-w-sm text-lg leading-8 text-emerald-50">
            أنا فارس، أدخل بياناتك لنبدأ رحلة جديدة من التعلم والقراءة
            والإبداع.
          </p>

          <div className="mt-7 rounded-2xl bg-white/15 px-5 py-3 font-bold">
            أكاديمية لغتي
            <br />
            نتعلّم… نقرأ… نبدع
          </div>
        </div>

        <div className="p-7 md:p-10">
          <h2 className="mb-2 text-3xl font-black text-slate-900">
            تسجيل دخول الطالب
          </h2>

          <p className="mb-7 leading-7 text-slate-500">
            أدخل اسمك، ثم اختر فصلك واكتب رمزك المكوّن من أربعة أرقام.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="student-name"
                className="mb-2 block font-black text-slate-700"
              >
                اسم الطالب
              </label>

              <input
                id="student-name"
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="اكتب اسمك هنا"
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-lg outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="student-class"
                className="mb-2 block font-black text-slate-700"
              >
                الفصل
              </label>

              <select
                id="student-class"
                value={studentClass}
                onChange={(event) => setStudentClass(event.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-lg outline-none transition focus:border-emerald-500"
              >
                {classes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="student-code"
                className="mb-2 block font-black text-slate-700"
              >
                رمز الطالب
              </label>

              <input
                id="student-code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={studentCode}
                onChange={(event) =>
                  setStudentCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="مثال: 2048"
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-center text-2xl font-black tracking-[0.5em] outline-none transition focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-xl font-black text-white shadow-lg transition hover:bg-emerald-700"
            >
              🚀 دخول إلى الأكاديمية
            </button>
          </form>

          {message && (
            <div className="mt-5 rounded-2xl bg-amber-100 p-4 text-center font-bold text-amber-900">
              {message}
            </div>
          )}

          <p className="mt-6 text-center text-sm leading-6 text-slate-400">
            سيكون لكل طالب من الطلاب الستين رمز خاص لا يتكرر.
          </p>
        </div