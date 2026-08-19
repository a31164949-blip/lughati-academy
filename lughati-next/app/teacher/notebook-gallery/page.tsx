"use client";

import { useEffect, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

const NOTEBOOK_CATEGORIES = [
  {
    id: "handwriting",
    label: "خط جميل",
    icon: "✍️",
  },
  {
    id: "design",
    label: "تنسيق مميز",
    icon: "🎨",
  },
  {
    id: "care",
    label: "عناية بالدفتر",
    icon: "📒",
  },
  {
    id: "progress",
    label: "تطور ملحوظ",
    icon: "🌱",
  },
];

type NotebookItem = {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  note: string;
  imageUrl: string;
  badge: string;
  isPublished: boolean;
};

type StudentOption = {
  id: string;
  name: string;
  classroom: string;
};

async function fetchStudents() {
  const snapshot = await getDocs(
    collection(db, "students")
  );

  const loadedStudents: StudentOption[] =
    snapshot.docs.map((studentDoc) => {
      const data = studentDoc.data();

      return {
        id: studentDoc.id,

        name:
          typeof data.studentName === "string"
            ? data.studentName
            : typeof data.name === "string"
              ? data.name
              : `طالب ${studentDoc.id}`,

        classroom:
          typeof data.classroom === "string"
            ? data.classroom
            : "",
      };
    });

  loadedStudents.sort((a, b) =>
    a.name.localeCompare(b.name, "ar")
  );

  return loadedStudents;
}

async function fetchNotebookItems() {
  const notebookQuery = query(
    collection(db, "notebookGallery"),
    orderBy("publishedAt", "desc")
  );

  const snapshot =
    await getDocs(notebookQuery);

  const loadedItems: NotebookItem[] =
    snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,

        studentId:
          typeof data.studentId === "string"
            ? data.studentId
            : "",

        studentName:
          typeof data.studentName === "string"
            ? data.studentName
            : "طالب",

        category:
          typeof data.category === "string"
            ? data.category
            : "",

        note:
          typeof data.note === "string"
            ? data.note
            : "",

        imageUrl:
          typeof data.imageUrl === "string"
            ? data.imageUrl
            : "",

        badge:
          typeof data.badge === "string"
            ? data.badge
            : "دفتر أنيق ✨",

        isPublished:
          data.isPublished !== false,
      };
    });

  return loadedItems;
}

export default function NotebookGalleryTeacherPage() {
  const [studentId, setStudentId] =
    useState("");

  const [studentName, setStudentName] =
    useState("");

  const [students, setStudents] =
    useState<StudentOption[]>([]);

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(true);

  const [category, setCategory] =
    useState("");

  const [note, setNote] =
    useState("");

  const [publishing, setPublishing] =
    useState(false);

  const [
    publishMessage,
    setPublishMessage,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [items, setItems] =
    useState<NotebookItem[]>([]);

  const [
    itemsLoading,
    setItemsLoading,
  ] = useState(true);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialStudents() {
      try {
        const loadedStudents =
          await fetchStudents();

        if (active) {
          setStudents(
            loadedStudents
          );
        }
      } catch (error) {
        console.error(
          "تعذر تحميل الطلاب:",
          error
        );

        if (active) {
          setStudents([]);
        }
      } finally {
        if (active) {
          setStudentsLoading(false);
        }
      }
    }

    void loadInitialStudents();

    return () => {
      active = false;
    };
  }, []);

  async function loadNotebookItems() {
    try {
      setItemsLoading(true);

      const loadedItems =
        await fetchNotebookItems();

      setItems(loadedItems);
    } catch (error) {
      console.error(
        "تعذر تحميل جماليات الدفاتر:",
        error
      );

      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialNotebookItems() {
      try {
        const loadedItems =
          await fetchNotebookItems();

        if (active) {
          setItems(
            loadedItems
          );
        }
      } catch (error) {
        console.error(
          "تعذر تحميل جماليات الدفاتر:",
          error
        );

        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setItemsLoading(false);
        }
      }
    }

    void loadInitialNotebookItems();

    return () => {
      active = false;
    };
  }, []);

  async function togglePublished(
    item: NotebookItem
  ) {
    try {
      setUpdatingId(item.id);

      const newValue =
        !item.isPublished;

      await updateDoc(
        doc(
          db,
          "notebookGallery",
          item.id
        ),
        {
          isPublished:
            newValue,
        }
      );

      setItems((current) =>
        current.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? {
                  ...currentItem,
                  isPublished:
                    newValue,
                }
              : currentItem
        )
      );
    } catch (error) {
      console.error(error);

      window.alert(
        "تعذر تغيير حالة العمل."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteNotebookItem(
    item: NotebookItem
  ) {
    const confirmed =
      window.confirm(
        `هل تريد حذف عمل ${item.studentName} نهائيًا؟\n\nلا يمكن التراجع عن الحذف.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(item.id);

      await deleteDoc(
        doc(
          db,
          "notebookGallery",
          item.id
        )
      );

      setItems((current) =>
        current.filter(
          (currentItem) =>
            currentItem.id !==
            item.id
        )
      );

      window.alert(
        "✅ تم حذف العمل."
      );
    } catch (error) {
      console.error(error);

      window.alert(
        "تعذر حذف العمل."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function uploadImageToCloudinary(
    file: File
  ) {
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

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `فشل رفع الصورة: ${errorText}`
      );
    }

    const data =
      await response.json();

    return data.secure_url as string;
  }

  async function handlePublish() {
    if (
      !studentId ||
      !studentName.trim() ||
      !category ||
      !selectedFile
    ) {
      setPublishMessage(
        "اختر الطالب والتصنيف والصورة أولًا."
      );

      return;
    }

    try {
      setPublishing(true);
      setPublishMessage("");

      const imageUrl =
        await uploadImageToCloudinary(
          selectedFile
        );

      const entryId =
        `notebook-${Date.now()}`;

      await setDoc(
        doc(
          db,
          "notebookGallery",
          entryId
        ),
        {
          studentId,

          studentName:
            studentName.trim(),

          category,

          note:
            note.trim(),

          imageUrl,

          badge:
            "دفتر أنيق ✨",

          isPublished:
            true,

          publishedAt:
            serverTimestamp(),
        }
      );

      setPublishMessage(
        "✅ تم النشر في جماليات الدفاتر ✨"
      );

      await loadNotebookItems();

      setStudentId("");
      setStudentName("");
      setCategory("");
      setNote("");
      setSelectedFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl("");
    } catch (error) {
      console.error(error);

      setPublishMessage(
        "تعذر النشر، حاول مرة أخرى."
      );
    } finally {
      setPublishing(false);
    }
  }

  const publishDisabled =
    publishing ||
    !studentId ||
    !studentName.trim() ||
    !category ||
    !selectedFile;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "32px 18px 70px",
        background:
          "linear-gradient(180deg, #fffdf7 0%, #f4fbf8 50%, #fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#174c3b",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section
          style={{
            background:
              "white",
            borderRadius: 28,
            padding:
              "30px 22px",
            textAlign:
              "center",
            boxShadow:
              "0 12px 35px rgba(22, 138, 99, 0.10)",
            border:
              "1px solid #e5eee9",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 55,
            }}
          >
            ✨📒
          </div>

          <h1
            style={{
              margin:
                "10px 0",
              fontSize: 34,
              color:
                "#936b12",
            }}
          >
            جماليات الدفاتر
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "#637a71",
              lineHeight: 1.9,
            }}
          >
            مساحة المعلم لتكريم جمال الخط،
            وحسن التنظيم، والعناية بالدفتر،
            والتطور الملحوظ.
          </p>
        </section>

        <section
          style={{
            background:
              "white",
            borderRadius: 28,
            padding: 24,
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🌟 إضافة عمل جديد
          </h2>

          <label
            style={{
              fontWeight: 800,
            }}
          >
            👨‍🎓 اختر الطالب
          </label>

          <select
            value={studentId}
            disabled={
              studentsLoading
            }
            onChange={(
              event
            ) => {
              const selectedId =
                event.target.value;

              setStudentId(
                selectedId
              );

              const selectedStudent =
                students.find(
                  (student) =>
                    student.id ===
                    selectedId
                );

              setStudentName(
                selectedStudent?.name ||
                  ""
              );
            }}
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              marginTop: 8,
              marginBottom: 22,
              padding: 15,
              borderRadius: 14,
              border:
                "1px solid #d8e6df",
              fontSize: 16,
              background:
                "#ffffff",
              color:
                "#174c3b",
              fontWeight: 800,
            }}
          >
            <option value="">
              {studentsLoading
                ? "جارٍ تحميل الطلاب..."
                : "اختر الطالب"}
            </option>

            {students.map(
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

          {studentId &&
            studentName && (
              <div
                style={{
                  marginTop:
                    -12,
                  marginBottom:
                    22,
                  padding:
                    "12px 14px",
                  borderRadius:
                    14,
                  background:
                    "#eef9f4",
                  color:
                    "#168a63",
                  fontWeight:
                    800,
                }}
              >
                ✅ الطالب المختار:{" "}
                {studentName}
              </div>
            )}

          <div
            style={{
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            اختر جمال التميز
          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 22,
            }}
          >
            {NOTEBOOK_CATEGORIES.map(
              (item) => (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    setCategory(
                      item.id
                    )
                  }
                  style={{
                    padding:
                      "16px 10px",
                    borderRadius:
                      16,

                    border:
                      category ===
                      item.id
                        ? "2px solid #168a63"
                        : "1px solid #e7d7a5",

                    background:
                      category ===
                      item.id
                        ? "#eaf8f2"
                        : "#fffdf7",

                    fontWeight:
                      800,

                    fontSize:
                      15,

                    cursor:
                      "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        27,
                      marginBottom:
                        6,
                    }}
                  >
                    {item.icon}
                  </div>

                  {item.label}
                </button>
              )
            )}
          </div>

          <label
            style={{
              fontWeight: 800,
            }}
          >
            كلمة من المعلم
          </label>

          <textarea
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            placeholder="مثال: تطور رائع في جمال الخط وترتيب الدفتر 👏"
            rows={4}
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              marginTop: 8,
              padding: 15,
              borderRadius: 14,
              border:
                "1px solid #d8e6df",
              fontSize: 16,
              resize:
                "vertical",
            }}
          />

          <div
            style={{
              marginTop: 22,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              📷 صورة الدفتر
            </div>

            <label
              style={{
                display:
                  "block",
                border:
                  "2px dashed #c9ded4",
                borderRadius: 18,
                padding: 22,
                textAlign:
                  "center",
                background:
                  "#f8fcfa",
                cursor:
                  "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  marginBottom:
                    8,
                }}
              >
                📸
              </div>

              <div
                style={{
                  fontWeight:
                    900,
                  color:
                    "#168a63",
                }}
              >
                اضغط لاختيار صورة الدفتر
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color:
                    "#7a8d85",
                }}
              >
                JPG أو PNG
              </div>

              <input
                type="file"
                accept="image/*"
                style={{
                  display:
                    "none",
                }}
                onChange={(
                  e
                ) => {
                  const file =
                    e.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  setSelectedFile(
                    file
                  );

                  if (
                    previewUrl
                  ) {
                    URL.revokeObjectURL(
                      previewUrl
                    );
                  }

                  setPreviewUrl(
                    URL.createObjectURL(
                      file
                    )
                  );
                }}
              />
            </label>

            {previewUrl && (
              <div
                style={{
                  marginTop: 18,
                  padding: 12,
                  borderRadius:
                    20,
                  background:
                    "#fffaf0",
                  border:
                    "1px solid #ead7a3",
                }}
              >
                <div
                  style={{
                    fontWeight:
                      900,
                    marginBottom:
                      10,
                    color:
                      "#936b12",
                  }}
                >
                  ✨ معاينة قبل النشر
                </div>

                <img
                  src={
                    previewUrl
                  }
                  alt="معاينة صورة الدفتر"
                  style={{
                    width:
                      "100%",
                    maxHeight:
                      430,
                    objectFit:
                      "contain",
                    borderRadius:
                      16,
                    background:
                      "white",
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={
              handlePublish
            }
            disabled={
              publishDisabled
            }
            style={{
              width: "100%",
              marginTop: 24,
              padding:
                "16px 18px",
              border:
                "none",
              borderRadius:
                16,

              background:
                publishDisabled
                  ? "#b9c9c2"
                  : "linear-gradient(135deg, #168a63, #0f7654)",

              color:
                "white",

              fontSize:
                18,

              fontWeight:
                900,

              cursor:
                publishDisabled
                  ? "not-allowed"
                  : "pointer",

              boxShadow:
                publishDisabled
                  ? "none"
                  : "0 10px 24px rgba(22,138,99,.22)",
            }}
          >
            {publishing
              ? "جارٍ النشر... ⏳"
              : "✨ نشر في جماليات الدفاتر"}
          </button>

          {publishMessage && (
            <div
              style={{
                marginTop: 14,
                textAlign:
                  "center",
                fontWeight:
                  800,

                color:
                  publishMessage.includes(
                    "تم"
                  )
                    ? "#168a63"
                    : "#a33a3a",
              }}
            >
              {publishMessage}
            </div>
          )}
        </section>

        <section
          style={{
            marginTop: 24,
            background:
              "white",
            borderRadius: 28,
            padding: 24,
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            📚 الأعمال المنشورة
          </h2>

          {itemsLoading ? (
            <div
              style={{
                textAlign:
                  "center",
                padding: 28,
                color:
                  "#6f8179",
              }}
            >
              ⏳ جاري تحميل الأعمال...
            </div>
          ) : items.length ===
            0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding: 28,
                color:
                  "#6f8179",
              }}
            >
              لا توجد أعمال في جماليات الدفاتر.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {items.map(
                (item) => {
                  const categoryInfo =
                    NOTEBOOK_CATEGORIES.find(
                      (
                        categoryItem
                      ) =>
                        categoryItem.id ===
                        item.category
                    );

                  return (
                    <article
                      key={
                        item.id
                      }
                      style={{
                        border:
                          "1px solid #e9dfbd",
                        borderRadius:
                          22,
                        overflow:
                          "hidden",
                        background:
                          "#fffdf8",
                      }}
                    >
                      {item.imageUrl && (
                        <img
                          src={
                            item.imageUrl
                          }
                          alt={
                            item.studentName
                          }
                          style={{
                            width:
                              "100%",
                            height:
                              220,
                            objectFit:
                              "cover",
                            display:
                              "block",
                          }}
                        />
                      )}

                      <div
                        style={{
                          padding:
                            16,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: 8,
                            marginBottom:
                              10,
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  19,
                                color:
                                  "#174c3b",
                              }}
                            >
                              {item.studentName}
                            </strong>

                            {item.studentId && (
                              <small
                                style={{
                                  color:
                                    "#84958d",
                                }}
                              >
                                مرتبط بحساب الطالب ✅
                              </small>
                            )}
                          </div>

                          <span
                            style={{
                              padding:
                                "5px 9px",
                              borderRadius:
                                999,

                              background:
                                item.isPublished
                                  ? "#e5f8ee"
                                  : "#f1f1f1",

                              color:
                                item.isPublished
                                  ? "#168a63"
                                  : "#777",

                              fontSize:
                                12,

                              fontWeight:
                                800,
                            }}
                          >
                            {item.isPublished
                              ? "منشور"
                              : "مخفي"}
                          </span>
                        </div>

                        <div
                          style={{
                            color:
                              "#936b12",
                            fontWeight:
                              800,
                            marginBottom:
                              8,
                          }}
                        >
                          {categoryInfo?.icon ||
                            "✨"}{" "}
                          {categoryInfo?.label ||
                            item.category}
                        </div>

                        {item.note && (
                          <p
                            style={{
                              color:
                                "#667a72",
                              lineHeight:
                                1.7,
                            }}
                          >
                            {item.note}
                          </p>
                        )}

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "1fr 1fr",
                            gap: 9,
                            marginTop:
                              14,
                          }}
                        >
                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              item.id
                            }
                            onClick={() =>
                              togglePublished(
                                item
                              )
                            }
                            style={{
                              border:
                                "1px solid #e0c984",
                              background:
                                "#fff8df",
                              color:
                                "#896300",
                              borderRadius:
                                13,
                              padding:
                                11,
                              fontWeight:
                                800,
                              cursor:
                                "pointer",
                            }}
                          >
                            {item.isPublished
                              ? "🙈 إخفاء"
                              : "👁️ إعادة النشر"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              item.id
                            }
                            onClick={() =>
                              deleteNotebookItem(
                                item
                              )
                            }
                            style={{
                              border:
                                "1px solid #f1c3c3",
                              background:
                                "#fff1f1",
                              color:
                                "#b43c3c",
                              borderRadius:
                                13,
                              padding:
                                11,
                              fontWeight:
                                800,
                              cursor:
                                "pointer",
                            }}
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