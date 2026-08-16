"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

const MAX_STARS = 10;

type StudentOption = {
  id: string;
  name: string;
  classroom: string;
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type StarStudentSnapshot = {
  studentId: string;
  studentName: string;
  classroom: string;
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type DiaryPost = {
  id: string;

  title: string;
  description: string;
  imageUrl: string;
  date: string;
  isPublished: boolean;

  learnedToday?: string;
  teacherMessage?: string;

  /*
   * النظام الجديد:
   * حتى 10 نجوم في اليومية الواحدة.
   */
  starStudents?: StarStudentSnapshot[];

  /*
   * الحقول القديمة تبقى
   * حتى تستمر اليوميات السابقة.
   */
  starOfDay?: string;
  starStudentId?: string;
  starStudentName?: string;
  starPersonalPhotoUrl?: string;
  starSelectedAvatarIcon?: string;
};

export default function TeacherClassDiaryPage() {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [date, setDate] =
    useState("");

  const [
    isPublished,
    setIsPublished,
  ] = useState(true);

  const [
    learnedToday,
    setLearnedToday,
  ] = useState("");

  const [
    teacherMessage,
    setTeacherMessage,
  ] = useState("");

  const [
    students,
    setStudents,
  ] = useState<StudentOption[]>([]);

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(true);

  /*
   * نجوم اليوم الجدد.
   */
  const [
    selectedStarIds,
    setSelectedStarIds,
  ] = useState<string[]>([]);

  const [
    starPickerValue,
    setStarPickerValue,
  ] = useState("");

  const [
    starSearch,
    setStarSearch,
  ] = useState("");

  const [posts, setPosts] =
    useState<DiaryPost[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const selectedStarStudents =
    useMemo(() => {
      return selectedStarIds
        .map(
          (studentId) =>
            students.find(
              (student) =>
                student.id ===
                studentId
            ) ?? null
        )
        .filter(
          (
            student
          ): student is StudentOption =>
            student !== null
        );
    }, [
      selectedStarIds,
      students,
    ]);

  const availableStudents =
    useMemo(() => {
      const normalized =
        starSearch
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          if (
            selectedStarIds.includes(
              student.id
            )
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          return (
            student.name
              .toLowerCase()
              .includes(
                normalized
              ) ||
            student.classroom
              .toLowerCase()
              .includes(
                normalized
              )
          );
        }
      );
    }, [
      students,
      selectedStarIds,
      starSearch,
    ]);

  /*
   * تحميل الطلاب.
   */
  useEffect(() => {
    async function loadStudents() {
      try {
        setStudentsLoading(true);

        const snapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );

        const loadedStudents: StudentOption[] =
          snapshot.docs.map(
            (studentDoc) => {
              const data =
                studentDoc.data();

              const approvedPhoto =
                data.personalPhotoStatus ===
                  "approved" &&
                typeof data.personalPhotoUrl ===
                  "string"
                  ? data.personalPhotoUrl
                  : "";

              return {
                id:
                  studentDoc.id,

                name:
                  typeof data.studentName ===
                  "string"
                    ? data.studentName
                    : typeof data.name ===
                        "string"
                      ? data.name
                      : `طالب ${studentDoc.id}`,

                classroom:
                  typeof data.classroom ===
                  "string"
                    ? data.classroom
                    : "",

                personalPhotoUrl:
                  approvedPhoto,

                selectedAvatarIcon:
                  typeof data.selectedAvatarIcon ===
                  "string"
                    ? data.selectedAvatarIcon
                    : "👦🏻",
              };
            }
          );

        loadedStudents.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "ar"
            )
        );

        setStudents(
          loadedStudents
        );
      } catch (error) {
        console.error(
          "تعذر تحميل الطلاب:",
          error
        );

        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    }

    void loadStudents();
  }, []);

  /*
   * تحميل اليوميات.
   */
  const loadPosts =
    async () => {
      try {
        const diaryQuery =
          query(
            collection(
              db,
              "classDiary"
            ),
            orderBy(
              "createdAt",
              "desc"
            )
          );

        const snapshot =
          await getDocs(
            diaryQuery
          );

        const items: DiaryPost[] =
          snapshot.docs.map(
            (item) => ({
              id:
                item.id,

              ...(item.data() as Omit<
                DiaryPost,
                "id"
              >),
            })
          );

        setPosts(items);
      } catch (error) {
        console.error(
          "خطأ في تحميل يوميات الفصل:",
          error
        );
      }
    };

  useEffect(() => {
    void loadPosts();
  }, []);

  /*
   * إضافة طالب إلى نجوم اليوم.
   */
  function addStarStudent(
    studentId: string
  ) {
    if (!studentId) {
      return;
    }

    if (
      selectedStarIds.includes(
        studentId
      )
    ) {
      setStarPickerValue("");
      return;
    }

    if (
      selectedStarIds.length >=
      MAX_STARS
    ) {
      setMessage(
        "🌟 تم الوصول إلى الحد الأعلى: 10 طلاب."
      );

      setStarPickerValue("");
      return;
    }

    setSelectedStarIds(
      (current) => [
        ...current,
        studentId,
      ]
    );

    setStarPickerValue("");
    setMessage("");
  }

  /*
   * إزالة طالب من نجوم اليوم.
   */
  function removeStarStudent(
    studentId: string
  ) {
    setSelectedStarIds(
      (current) =>
        current.filter(
          (id) =>
            id !== studentId
        )
    );

    setMessage("");
  }

  /*
   * رفع صورة اليومية.
   */
  const handleImageUpload =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setLoading(true);

      setMessage(
        "⏳ جاري رفع الصورة..."
      );

      try {
        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        formData.append(
          "upload_preset",
          "lughati_homework_upload"
        );

        const response =
          await fetch(
            "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error?.message ||
              "تعذر رفع الصورة"
          );
        }

        setImageUrl(
          data.secure_url
        );

        setMessage(
          "✅ تم رفع الصورة بنجاح."
        );
      } catch (error) {
        console.error(
          "خطأ في رفع الصورة:",
          error
        );

        setMessage(
          "❌ تعذر رفع الصورة."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * نشر اليومية.
   */
  const handlePublish =
    async () => {
      if (!title.trim()) {
        setMessage(
          "⚠️ اكتب عنوان اليومية أولًا."
        );

        return;
      }

      if (
        !description.trim()
      ) {
        setMessage(
          "⚠️ اكتب وصفًا قصيرًا."
        );

        return;
      }

      if (!date) {
        setMessage(
          "⚠️ اختر تاريخ اليومية."
        );

        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const starStudents:
          StarStudentSnapshot[] =
          selectedStarStudents.map(
            (student) => ({
              studentId:
                student.id,

              studentName:
                student.name,

              classroom:
                student.classroom,

              personalPhotoUrl:
                student.personalPhotoUrl,

              selectedAvatarIcon:
                student.selectedAvatarIcon ||
                "👦🏻",
            })
          );

        /*
         * أول طالب نحفظه أيضًا
         * في الحقول القديمة
         * لضمان التوافق.
         */
        const firstStar =
          starStudents[0] ??
          null;

        await addDoc(
          collection(
            db,
            "classDiary"
          ),
          {
            title:
              title.trim(),

            description:
              description.trim(),

            imageUrl:
              imageUrl.trim(),

            date,

            isPublished,

            learnedToday:
              learnedToday.trim(),

            teacherMessage:
              teacherMessage.trim(),

            /*
             * النظام الجديد.
             */
            starStudents,

            /*
             * توافق مع النظام القديم.
             */
            starOfDay:
              firstStar?.studentName ||
              "",

            starStudentId:
              firstStar?.studentId ||
              "",

            starStudentName:
              firstStar?.studentName ||
              "",

            starPersonalPhotoUrl:
              firstStar?.personalPhotoUrl ||
              "",

            starSelectedAvatarIcon:
              firstStar?.selectedAvatarIcon ||
              "👦🏻",

            createdAt:
              serverTimestamp(),
          }
        );

        setTitle("");
        setDescription("");
        setImageUrl("");
        setDate("");
        setIsPublished(true);
        setLearnedToday("");
        setTeacherMessage("");

        setSelectedStarIds(
          []
        );

        setStarPickerValue(
          ""
        );

        setStarSearch("");

        setMessage(
          "✅ تم نشر اليومية ونجوم اليوم بنجاح."
        );

        await loadPosts();
      } catch (error) {
        console.error(
          error
        );

        setMessage(
          "❌ حدث خطأ أثناء النشر."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * نشر / إخفاء.
   */
  const togglePublish =
    async (
      post: DiaryPost
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "classDiary",
            post.id
          ),
          {
            isPublished:
              !post.isPublished,
          }
        );

        await loadPosts();
      } catch (error) {
        console.error(error);
      }
    };

  /*
   * حذف اليومية.
   */
  const handleDelete =
    async (
      id: string
    ) => {
      const confirmed =
        window.confirm(
          "هل أنت متأكد من حذف هذه اليومية؟"
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "classDiary",
            id
          )
        );

        await loadPosts();
      } catch (error) {
        console.error(error);
      }
    };

  /*
   * تحويل اليومية القديمة أو الجديدة
   * إلى قائمة موحدة من النجوم.
   */
  function getPostStars(
    post: DiaryPost
  ): StarStudentSnapshot[] {
    if (
      Array.isArray(
        post.starStudents
      ) &&
      post.starStudents.length >
        0
    ) {
      return post.starStudents.slice(
        0,
        MAX_STARS
      );
    }

    const oldName =
      post.starStudentName ||
      post.starOfDay ||
      "";

    if (!oldName) {
      return [];
    }

    const liveStudent =
      post.starStudentId
        ? students.find(
            (student) =>
              student.id ===
              post.starStudentId
          )
        : null;

    return [
      {
        studentId:
          post.starStudentId ||
          "",

        studentName:
          oldName,

        classroom:
          liveStudent?.classroom ||
          "",

        personalPhotoUrl:
          post.starPersonalPhotoUrl ||
          liveStudent?.personalPhotoUrl ||
          "",

        selectedAvatarIcon:
          post.starSelectedAvatarIcon ||
          liveStudent?.selectedAvatarIcon ||
          "⭐",
      },
    ];
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* الترويسة */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-black text-emerald-600">
              لوحة المعلم
            </p>

            <h1 className="text-3xl font-black text-slate-800">
              📸 إدارة يوميات الفصل
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-500">
              انشر أجمل لحظات وأنشطة الفصل واحتفِ بنجوم اليوم.
            </p>
          </div>

          <a
            href="/teacher"
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg transition hover:bg-emerald-800"
          >
            ← العودة إلى لوحة المعلم
          </a>
        </div>

        {/* إضافة يومية */}

        <section className="mb-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-800">
              ✨ إضافة يومية جديدة
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-500">
              أضف لقطة من أنشطة الفصل مع أهم تفاصيل اليوم.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* العنوان */}

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                عنوان اليومية
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="مثال: نجوم القراءة اليوم 🌟"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-emerald-500"
              />
            </div>

            {/* التاريخ */}

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                التاريخ
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-emerald-500"
              />
            </div>

            {/* الوصف */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                وصف قصير
              </label>

              <textarea
                value={
                  description
                }
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="اكتب وصفًا بسيطًا لما حدث في الفصل..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-emerald-500"
              />
            </div>

            {/* بطاقات يوميات الفصل */}

            <div className="md:col-span-2 mt-2">
              <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                <h3 className="mb-4 text-lg font-black text-slate-800">
                  🗒️ بطاقات يوميات الفصل
                </h3>

                <div className="grid gap-4 lg:grid-cols-2">

                  {/* تعلمنا اليوم */}

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <label className="mb-2 block font-black text-blue-800">
                      📚 تعلمنا اليوم
                    </label>

                    <textarea
                      value={
                        learnedToday
                      }
                      onChange={(event) =>
                        setLearnedToday(
                          event.target.value
                        )
                      }
                      placeholder="مثال: تدربنا على القراءة الجهرية وحروف المد."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-blue-100 px-3 py-3 font-bold outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* رسالة المعلم */}

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <label className="mb-2 block font-black text-emerald-700">
                      💬 رسالة المعلم
                    </label>

                    <textarea
                      value={
                        teacherMessage
                      }
                      onChange={(event) =>
                        setTeacherMessage(
                          event.target.value
                        )
                      }
                      placeholder="مثال: استمروا يا أبطال، تقدمكم يسعدني."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-emerald-100 px-3 py-3 font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* نجوم اليوم */}

                <div className="mt-5 overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 px-5 py-4">
                    <div>
                      <h3 className="m-0 text-xl font-black text-amber-800">
                        🌟 نجوم اليوم
                      </h3>

                      <p className="mt-1 text-sm font-bold text-amber-700/70">
                        اختر الطلاب الذين ترغب في تكريمهم اليوم.
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        selectedStarStudents.length >=
                        MAX_STARS
                          ? "bg-amber-500 text-white"
                          : "bg-white text-amber-700 shadow-sm"
                      }`}
                    >
                      {
                        selectedStarStudents.length
                      }{" "}
                      / {MAX_STARS}
                    </div>
                  </div>

                  <div className="p-5">

                    {/* البحث */}

                    <div className="mb-3">
                      <input
                        value={
                          starSearch
                        }
                        onChange={(event) =>
                          setStarSearch(
                            event.target.value
                          )
                        }
                        placeholder="🔎 ابحث باسم الطالب أو الفصل..."
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* اختيار طالب */}

                    <select
                      value={
                        starPickerValue
                      }
                      disabled={
                        studentsLoading ||
                        selectedStarStudents.length >=
                          MAX_STARS
                      }
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        setStarPickerValue(
                          value
                        );

                        addStarStudent(
                          value
                        );
                      }}
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 font-black text-slate-700 outline-none focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {studentsLoading
                          ? "جارٍ تحميل الطلاب..."
                          : selectedStarStudents.length >=
                              MAX_STARS
                            ? "تم اختيار 10 طلاب 🌟"
                            : "＋ اختر طالبًا لإضافته"}
                      </option>

                      {availableStudents.map(
                        (student) => (
                          <option
                            key={
                              student.id
                            }
                            value={
                              student.id
                            }
                          >
                            {
                              student.name
                            }
                            {student.classroom
                              ? ` — ${student.classroom}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {/* الطلاب المختارون */}

                    {selectedStarStudents.length >
                    0 ? (
                      <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <strong className="text-sm font-black text-amber-800">
                            ✨ الطلاب المختارون
                          </strong>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStarIds(
                                []
                              )
                            }
                            className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-600 shadow-sm"
                          >
                            مسح الكل
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          {selectedStarStudents.map(
                            (
                              student,
                              index
                            ) => (
                              <div
                                key={
                                  student.id
                                }
                                className="relative rounded-2xl border border-amber-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                              >
                                <button
                                  type="button"
                                  aria-label={`إزالة ${student.name}`}
                                  onClick={() =>
                                    removeStarStudent(
                                      student.id
                                    )
                                  }
                                  className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-rose-50 text-xs font-black text-rose-600"
                                >
                                  ✕
                                </button>

                                <div className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 border-amber-300 bg-amber-50 text-4xl shadow-sm">
                                  {student.personalPhotoUrl ? (
                                    <img
                                      src={
                                        student.personalPhotoUrl
                                      }
                                      alt={
                                        student.name
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span>
                                      {student.selectedAvatarIcon ||
                                        "👦🏻"}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 text-xs font-black text-amber-600">
                                  ⭐ نجم{" "}
                                  {index + 1}
                                </div>

                                <div className="mt-1 truncate font-black text-slate-800">
                                  {
                                    student.name
                                  }
                                </div>

                                {student.classroom && (
                                  <div className="mt-1 text-xs font-bold text-slate-400">
                                    {
                                      student.classroom
                                    }
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-6 text-center">
                        <div className="text-4xl">
                          🌟
                        </div>

                        <p className="mt-2 font-black text-amber-700">
                          لم تختر نجوم اليوم بعد
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-400">
                          يمكنك اختيار طالب واحد أو حتى 10 طلاب.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl bg-amber-100/60 px-4 py-3 text-sm font-bold leading-7 text-amber-800">
                      🏅 ستظهر الصورة الشخصية المعتمدة لكل طالب، وإن لم توجد فستظهر الشخصية التي اختارها في الأكاديمية.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* صورة اليومية */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                📷 صورة اليومية
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageUpload
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none"
              />

              {imageUrl && (
                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-black text-emerald-700">
                    ✅ معاينة الصورة
                  </p>

                  <img
                    src={
                      imageUrl
                    }
                    alt="معاينة اليومية"
                    className="max-h-80 w-full rounded-2xl object-cover shadow"
                  />
                </div>
              )}

              <p className="mt-2 text-xs font-bold text-slate-400">
                اختر صورة من الجهاز، وسيتم رفعها تلقائيًا قبل نشر اليومية.
              </p>
            </div>
          </div>

          {/* النشر */}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  isPublished
                }
                onChange={(event) =>
                  setIsPublished(
                    event.target.checked
                  )
                }
                className="h-5 w-5 accent-emerald-600"
              />

              <span className="font-black text-emerald-800">
                نشر اليومية مباشرة
              </span>
            </label>

            <button
              type="button"
              onClick={
                handlePublish
              }
              disabled={
                loading
              }
              className="rounded-2xl bg-emerald-700 px-7 py-3 font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "⏳ جاري الحفظ..."
                : "📸 نشر اليومية"}
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-center font-black text-slate-700">
              {message}
            </div>
          )}
        </section>

        {/* اليوميات المنشورة */}

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                🗂️ اليوميات المنشورة
              </h2>

              <p className="mt-1 text-sm font-bold text-slate-500">
                يمكنك إخفاء اليومية أو حذفها عند الحاجة.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-100 px-4 py-2 font-black text-emerald-800">
              {posts.length} يومية
            </div>
          </div>

          {posts.length ===
          0 ? (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">
                📸
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-700">
                لا توجد يوميات حتى الآن
              </h3>

              <p className="mt-2 font-bold text-slate-400">
                أضف أول لقطة جميلة من يومكم الدراسي.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(
                (post) => {
                  const postStars =
                    getPostStars(
                      post
                    );

                  return (
                    <article
                      key={
                        post.id
                      }
                      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg"
                    >
                      {post.imageUrl ? (
                        <img
                          src={
                            post.imageUrl
                          }
                          alt={
                            post.title
                          }
                          className="h-56 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-56 items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-100 text-7xl">
                          📸
                        </div>
                      )}

                      <div className="p-5">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h3 className="text-lg font-black text-slate-800">
                            {
                              post.title
                            }
                          </h3>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                              post.isPublished
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {post.isPublished
                              ? "منشورة"
                              : "مخفية"}
                          </span>
                        </div>

                        <p className="mb-3 text-sm font-bold leading-7 text-slate-500">
                          {
                            post.description
                          }
                        </p>

                        <div className="space-y-3 rounded-2xl bg-slate-50 p-3 text-sm">
                          {post.learnedToday && (
                            <p className="m-0 font-bold text-slate-600">
                              📚{" "}
                              {
                                post.learnedToday
                              }
                            </p>
                          )}

                          {/* نجوم اليوم */}

                          {postStars.length >
                            0 && (
                            <div className="rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-3">
                              <div className="mb-3 flex items-center justify-between">
                                <strong className="text-amber-700">
                                  🌟 نجوم اليوم
                                </strong>

                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-700">
                                  {
                                    postStars.length
                                  }
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                {postStars.map(
                                  (
                                    star,
                                    index
                                  ) => (
                                    <div
                                      key={`${star.studentId}-${index}`}
                                      className="flex items-center gap-2 rounded-xl bg-white px-2 py-2 shadow-sm"
                                    >
                                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-amber-300 bg-amber-50 text-xl">
                                        {star.personalPhotoUrl ? (
                                          <img
                                            src={
                                              star.personalPhotoUrl
                                            }
                                            alt={
                                              star.studentName
                                            }
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span>
                                            {star.selectedAvatarIcon ||
                                              "⭐"}
                                          </span>
                                        )}
                                      </div>

                                      <span className="max-w-24 truncate text-xs font-black text-slate-700">
                                        {
                                          star.studentName
                                        }
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {post.teacherMessage && (
                            <p className="m-0 font-bold text-slate-600">
                              💬{" "}
                              {
                                post.teacherMessage
                              }
                            </p>
                          )}
                        </div>

                        <div className="my-4 text-xs font-black text-slate-400">
                          📅{" "}
                          {
                            post.date
                          }
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              togglePublish(
                                post
                              )
                            }
                            className={`flex-1 rounded-xl px-3 py-2 text-sm font-black ${
                              post.isPublished
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {post.isPublished
                              ? "🙈 إخفاء"
                              : "👁️ نشر"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                post.id
                              )
                            }
                            className="rounded-xl bg-rose-100 px-4 py-2 text-sm font-black text-rose-700"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}