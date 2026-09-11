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
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../../firebase";

const NOTEBOOK_CATEGORIES = [
  {
    id: "handwriting",
    label: "خط جميل",
    icon: "✍️",
  },
  {
    id: "formatting",
    label: "تنسيق مميز",
    icon: "🎨",
  },
  {
    id: "care",
    label: "عناية بالدفتر",
    icon: "📒",
  },
  {
    id: "improvement",
    label: "تطور ملحوظ",
    icon: "🌱",
  },
];

function mapNotebookCategory(value: unknown) {
  const normalized =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  const categoryMap: Record<string, string> = {
    handwriting: "handwriting",
    "خط جميل": "handwriting",
    design: "formatting",
    formatting: "formatting",
    "تنسيق مميز": "formatting",
    care: "care",
    "عناية بالدفتر": "care",
    progress: "improvement",
    improvement: "improvement",
    "تطور ملحوظ": "improvement",
  };

  return categoryMap[normalized] || "";
}

function getNotebookCategoryLabel(value: unknown) {
  const categoryId = mapNotebookCategory(value);

  return (
    NOTEBOOK_CATEGORIES.find(
      (category) => category.id === categoryId
    )?.label || "غير محدد"
  );
}

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

type NotebookNomination = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  imageUrl: string;
  note: string;
  status: string;
  rewardPoints: number;
  analysis: {
    suggestedCategory: string;
    strengths: string[];
    improvementNote: string;
    confidence: number;
  } | null;
};

function getSelectedNominationCategory(
  nomination: NotebookNomination,
  manualSelections: Record<string, string>
) {
  return mapNotebookCategory(
    manualSelections[nomination.id] ||
      nomination.analysis?.suggestedCategory
  );
}

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
          mapNotebookCategory(data.category),

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

async function fetchPendingNotebookNominations() {
  const nominationsQuery = query(
    collection(
      db,
      "notebookNominations"
    ),
    where(
      "status",
      "==",
      "pending"
    )
  );

  const snapshot =
    await getDocs(
      nominationsQuery
    );

  const loadedItems:
    NotebookNomination[] =
      snapshot.docs.map(
        (documentSnapshot) => {
          const data =
            documentSnapshot.data();

          return {
            id:
              documentSnapshot.id,

            studentId:
              typeof data.studentId ===
              "string"
                ? data.studentId
                : "",

            studentName:
              typeof data.studentName ===
              "string"
                ? data.studentName
                : "طالب",

            classroom:
              typeof data.classroom ===
              "string"
                ? data.classroom
                : "",

            imageUrl:
              typeof data.imageUrl ===
              "string"
                ? data.imageUrl
                : "",

            note:
              typeof data.note ===
              "string"
                ? data.note
                : "",

            status:
              typeof data.status ===
              "string"
                ? data.status
                : "pending",

            rewardPoints:
              typeof data.rewardPoints ===
              "number"
                ? data.rewardPoints
                : 5,

            analysis:
              data.analysis &&
              typeof data.analysis === "object"
                ? {
                    suggestedCategory:
                      typeof data.analysis.suggestedCategory === "string"
                        ? data.analysis.suggestedCategory
                        : "",
                    strengths: Array.isArray(data.analysis.strengths)
                      ? data.analysis.strengths.filter(
                          (item: unknown): item is string => typeof item === "string"
                        )
                      : [],
                    improvementNote:
                      typeof data.analysis.improvementNote === "string"
                        ? data.analysis.improvementNote
                        : "",
                    confidence:
                      typeof data.analysis.confidence === "number"
                        ? data.analysis.confidence
                        : 0,
                  }
                : null,
          };
        }
      );

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

  const [
    nominations,
    setNominations,
  ] =
    useState<
      NotebookNomination[]
    >([]);

  const [
    nominationsLoading,
    setNominationsLoading,
  ] =
    useState(true);

  const [
    approvingId,
    setApprovingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    rejectionOpen,
    setRejectionOpen,
  ] = useState<Record<string, boolean>>({});

  const [
    rejectionReasons,
    setRejectionReasons,
  ] = useState<Record<string, string>>({});

  const [
    nominationCategories,
    setNominationCategories,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    nominationNotes,
    setNominationNotes,
  ] =
    useState<
      Record<string, string>
    >({});

  useEffect(() => {
    let active = true;

    async function loadNominations() {
      try {
        setNominationsLoading(
          true
        );

        const loaded =
          await fetchPendingNotebookNominations();

        if (active) {
          setNominations(
            loaded
          );
        }
      } catch (error) {
        console.error(
          "تعذر تحميل ترشيحات الدفاتر:",
          error
        );

        if (active) {
          setNominations(
            []
          );
        }
      } finally {
        if (active) {
          setNominationsLoading(
            false
          );
        }
      }
    }

    void loadNominations();

    return () => {
      active = false;
    };
  }, []);

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

  async function approveNotebookNomination(
    nomination: NotebookNomination
  ) {
    const selectedCategory = getSelectedNominationCategory(
      nomination,
      nominationCategories
    );

    if (!selectedCategory) {
      window.alert(
        "اختر تصنيف التميز أولًا."
      );
      return;
    }

    try {
      setApprovingId(
        nomination.id
      );

      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "يرجى تسجيل دخول المعلم مرة أخرى."
        );
      }

      const idToken =
        await currentUser.getIdToken(
          true
        );

      const response =
        await fetch(
          "/api/notebook-excellence/approve",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${idToken}`,
            },

            body:
              JSON.stringify({
                nominationId:
                  nomination.id,

                category:
                  selectedCategory,

                teacherNote:
                  nominationNotes[
                    nomination.id
                  ] || "",
              }),
          }
        );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (responseText) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          throw new Error(
            "وصل رد غير متوقع من الخادم."
          );
        }
      }

      if (
        !response.ok ||
        data.success !== true
      ) {
        throw new Error(
          data.message ||
            "تعذر اعتماد الدفتر."
        );
      }

      setNominations(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              nomination.id
          )
      );

      setNominationCategories(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            nomination.id
          ];

          return next;
        }
      );

      setNominationNotes(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            nomination.id
          ];

          return next;
        }
      );

      await loadNotebookItems();

      window.alert(
        data.message ||
          "✅ تم اعتماد الدفتر ومنح 5 نقاط."
      );
    } catch (error) {
      console.error(
        "تعذر اعتماد ترشيح الدفتر:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "تعذر اعتماد الدفتر."
      );
    } finally {
      setApprovingId(
        null
      );
    }
  }

  async function rejectNotebookNomination(
    nomination: NotebookNomination
  ) {
    const confirmed = window.confirm(
      "هل تريد رفض هذا الترشيح؟ يمكن للطالب إرسال محاولة جديدة لاحقًا."
    );

    if (!confirmed) {
      return;
    }

    try {
      setApprovingId(nomination.id);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "يرجى تسجيل دخول المعلم مرة أخرى."
        );
      }

      const idToken = await currentUser.getIdToken(true);
      const response = await fetch(
        "/api/notebook-excellence/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            action: "reject",
            nominationId: nomination.id,
            rejectionReason:
              rejectionReasons[nomination.id] || "",
          }),
        }
      );

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message || "تعذر رفض الترشيح."
        );
      }

      setNominations((current) =>
        current.filter(
          (item) => item.id !== nomination.id
        )
      );

      setRejectionOpen((current) => {
        const next = { ...current };
        delete next[nomination.id];
        return next;
      });

      setRejectionReasons((current) => {
        const next = { ...current };
        delete next[nomination.id];
        return next;
      });

      window.alert(
        data.message || "تم رفض الترشيح."
      );
    } catch (error) {
      console.error(
        "تعذر رفض ترشيح الدفتر:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "تعذر رفض الترشيح."
      );
    } finally {
      setApprovingId(null);
    }
  }

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

          category:
            mapNotebookCategory(category),

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
            marginBottom: 24,
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
              gap: 12,
              flexWrap:
                "wrap",
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              📥 ترشيحات الطلاب بانتظار الاعتماد
            </h2>

            <span
              style={{
                padding:
                  "7px 12px",
                borderRadius:
                  999,
                background:
                  "#fff8df",
                color:
                  "#896300",
                fontWeight:
                  900,
              }}
            >
              {nominations.length} ترشيح
            </span>
          </div>

          {nominationsLoading ? (
            <div
              style={{
                textAlign:
                  "center",
                padding: 26,
                color:
                  "#6f8179",
              }}
            >
              ⏳ جارٍ تحميل الترشيحات...
            </div>
          ) : nominations.length ===
            0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding: 26,
                color:
                  "#6f8179",
                border:
                  "1px dashed #d9e5df",
                borderRadius:
                  18,
                background:
                  "#fbfdfc",
              }}
            >
              🎉 لا توجد ترشيحات معلقة حاليًا.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap: 18,
              }}
            >
              {nominations.map(
                (nomination) => (
                  <article
                    key={
                      nomination.id
                    }
                    style={{
                      border:
                        "1px solid #ead7a3",
                      borderRadius:
                        22,
                      overflow:
                        "hidden",
                      background:
                        "#fffdf8",
                    }}
                  >
                    {nomination.imageUrl && (
                      <img
                        src={
                          nomination.imageUrl
                        }
                        alt={
                          nomination.studentName
                        }
                        style={{
                          width:
                            "100%",
                          maxHeight:
                            420,
                          objectFit:
                            "contain",
                          display:
                            "block",
                          background:
                            "#f8faf9",
                        }}
                      />
                    )}

                    <div
                      style={{
                        padding:
                          18,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 12,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                20,
                              color:
                                "#174c3b",
                            }}
                          >
                            {
                              nomination.studentName
                            }
                          </strong>

                          <div
                            style={{
                              marginTop:
                                5,
                              color:
                                "#74867e",
                              fontWeight:
                                700,
                            }}
                          >
                            {nomination.classroom ||
                              "الفصل غير محدد"}
                          </div>
                        </div>

                        <span
                          style={{
                            padding:
                              "7px 11px",
                            borderRadius:
                              999,
                            background:
                              "#eef9f4",
                            color:
                              "#168a63",
                            fontWeight:
                              900,
                            fontSize:
                              13,
                          }}
                        >
                          ⭐ عند الاعتماد: +{nomination.rewardPoints} نقاط
                        </span>
                      </div>

                      {nomination.note && (
                        <div
                          style={{
                            marginTop:
                              14,
                            padding:
                              "12px 14px",
                            borderRadius:
                              14,
                            background:
                              "#f8faf9",
                            color:
                              "#5f746b",
                            lineHeight:
                              1.8,
                          }}
                        >
                          ✍️ ملاحظة الطالب:{" "}
                          {nomination.note}
                        </div>
                      )}

                      {nomination.analysis && (
                        <div
                          style={{
                            marginTop: 14,
                            padding: "14px 16px",
                            borderRadius: 14,
                            background: "#f1f8ff",
                            border: "1px solid #cfe3f5",
                            color: "#24516f",
                            lineHeight: 1.8,
                          }}
                        >
                          <strong>اقتراح التقييم الإلكتروني</strong>
                          <div>
                            التصنيف المقترح: {getNotebookCategoryLabel(nomination.analysis.suggestedCategory)}
                          </div>
                          {nomination.analysis.strengths.length > 0 && (
                            <div>
                              نقاط القوة: {nomination.analysis.strengths.join("، ")}
                            </div>
                          )}
                          {nomination.analysis.improvementNote && (
                            <div>
                              ملاحظة التطوير: {nomination.analysis.improvementNote}
                            </div>
                          )}
                          <div>
                            درجة الثقة: {Math.round(nomination.analysis.confidence * 100)}%
                          </div>
                          <small>
                            هذا اقتراح مساعد فقط، وقرار التصنيف والاعتماد للمعلم.
                          </small>
                        </div>
                      )}

                      <div
                        style={{
                          marginTop:
                            18,
                          fontWeight:
                            900,
                        }}
                      >
                        اختر تصنيف التميز
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(130px, 1fr))",
                          gap: 10,
                          marginTop:
                            10,
                        }}
                      >
                        {NOTEBOOK_CATEGORIES.map(
                          (
                            categoryItem
                          ) => {
                            const selected =
                              getSelectedNominationCategory(
                                nomination,
                                nominationCategories
                              ) === categoryItem.id;

                            return (
                              <button
                                key={
                                  categoryItem.id
                                }
                                type="button"
                                onClick={() =>
                                  setNominationCategories(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      [nomination.id]:
                                        categoryItem.id,
                                    })
                                  )
                                }
                                style={{
                                  padding:
                                    "13px 9px",
                                  borderRadius:
                                    14,
                                  border:
                                    selected
                                      ? "2px solid #168a63"
                                      : "1px solid #e7d7a5",
                                  background:
                                    selected
                                      ? "#eaf8f2"
                                      : "#fffdf7",
                                  fontWeight:
                                    800,
                                  cursor:
                                    "pointer",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      24,
                                    marginBottom:
                                      5,
                                  }}
                                >
                                  {
                                    categoryItem.icon
                                  }
                                </div>

                                {
                                  categoryItem.label
                                }

                                {selected && (
                                  <div
                                    style={{
                                      marginTop: 6,
                                      color: "#168a63",
                                      fontSize: 12,
                                      fontWeight: 900,
                                    }}
                                  >
                                    ✓ محدد
                                  </div>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <textarea
                        value={
                          nominationNotes[
                            nomination.id
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          setNominationNotes(
                            (
                              current
                            ) => ({
                              ...current,
                              [nomination.id]:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="كلمة من المعلم - اختيارية"
                        rows={3}
                        style={{
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          marginTop:
                            14,
                          padding:
                            13,
                          borderRadius:
                            14,
                          border:
                            "1px solid #d8e6df",
                          resize:
                            "vertical",
                          fontFamily:
                            "inherit",
                          fontSize:
                            15,
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          approveNotebookNomination(
                            nomination
                          )
                        }
                        disabled={
                          approvingId ===
                            nomination.id ||
                          !getSelectedNominationCategory(
                            nomination,
                            nominationCategories
                          )
                        }
                        style={{
                          width:
                            "100%",
                          marginTop:
                            14,
                          padding:
                            "14px 16px",
                          border:
                            "none",
                          borderRadius:
                            15,
                          background:
                            approvingId ===
                              nomination.id ||
                            !getSelectedNominationCategory(
                              nomination,
                              nominationCategories
                            )
                              ? "#b9c9c2"
                              : "linear-gradient(135deg, #168a63, #0f7654)",
                          color:
                            "white",
                          fontWeight:
                            900,
                          fontSize:
                            17,
                          cursor:
                            approvingId ===
                              nomination.id ||
                            !getSelectedNominationCategory(
                              nomination,
                              nominationCategories
                            )
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {approvingId ===
                        nomination.id
                          ? "جارٍ الاعتماد... ⏳"
                          : "✅ اعتماد التميز + 5 نقاط"}
                      </button>

                      {!rejectionOpen[nomination.id] && (
                        <button
                          type="button"
                          onClick={() =>
                            setRejectionOpen((current) => ({
                              ...current,
                              [nomination.id]: true,
                            }))
                          }
                          disabled={approvingId === nomination.id}
                          style={{
                            width: "100%",
                            marginTop: 10,
                            padding: "12px 16px",
                            border: "1px solid #e2a5a5",
                            borderRadius: 15,
                            background: "#fff4f4",
                            color: "#b42318",
                            fontWeight: 900,
                            fontSize: 16,
                            cursor:
                              approvingId === nomination.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          رفض الترشيح
                        </button>
                      )}

                      {rejectionOpen[nomination.id] && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 14,
                            borderRadius: 15,
                            background: "#fff7f7",
                            border: "1px solid #f0caca",
                          }}
                        >
                          <label
                            htmlFor={`rejection-${nomination.id}`}
                            style={{
                              display: "block",
                              color: "#8f211b",
                              fontWeight: 900,
                            }}
                          >
                            سبب مختصر للرفض (اختياري)
                          </label>
                          <input
                            id={`rejection-${nomination.id}`}
                            value={
                              rejectionReasons[nomination.id] || ""
                            }
                            onChange={(event) =>
                              setRejectionReasons((current) => ({
                                ...current,
                                [nomination.id]: event.target.value,
                              }))
                            }
                            maxLength={240}
                            placeholder="مثال: نحتاج صورة لصفحة الدفتر نفسها."
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              marginTop: 8,
                              padding: "11px 12px",
                              borderRadius: 12,
                              border: "1px solid #e2bcbc",
                              fontFamily: "inherit",
                              fontSize: 15,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 10,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                rejectNotebookNomination(nomination)
                              }
                              disabled={approvingId === nomination.id}
                              style={{
                                flex: 1,
                                padding: "11px 12px",
                                border: "none",
                                borderRadius: 12,
                                background: "#c0392b",
                                color: "#fff",
                                fontWeight: 900,
                                cursor:
                                  approvingId === nomination.id
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              {approvingId === nomination.id
                                ? "جارٍ الرفض..."
                                : "تأكيد الرفض"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRejectionOpen((current) => ({
                                  ...current,
                                  [nomination.id]: false,
                                }))
                              }
                              disabled={approvingId === nomination.id}
                              style={{
                                padding: "11px 14px",
                                border: "1px solid #d8d8d8",
                                borderRadius: 12,
                                background: "#fff",
                                color: "#5f6663",
                                fontWeight: 800,
                              }}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
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