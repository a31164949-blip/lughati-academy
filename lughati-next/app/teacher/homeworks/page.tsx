"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type TargetClass = "الثاني أ" | "الثاني ب" | "الفصلان";

type Homework = {
  id: string;
  title: string;
  instructions: string;
  targetClass: TargetClass;
  dueDate: string;
  published: boolean;
  createdAt?: unknown;
};

const emptyForm = {
  title: "",
  instructions: "",
  targetClass: "الفصلان" as TargetClass,
  dueDate: "",
  published: true,
};

export default function TeacherHomeworksPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadHomeworks() {
    try {
      setLoading(true);
      setError("");

      const homeworksQuery = query(
        collection(db, "homeworks"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(homeworksQuery);

      const loadedHomeworks: Homework[] = snapshot.docs.map(
        (homeworkDocument) => {
          const data = homeworkDocument.data();

          return {
            id: homeworkDocument.id,
            title: data.title || "واجب دون عنوان",
            instructions: data.instructions || "",
            targetClass: data.targetClass || "الفصلان",
            dueDate: data.dueDate || "",
            published: data.published === true,
            createdAt: data.createdAt,
          };
        }
      );

      setHomeworks(loadedHomeworks);
    } catch (loadError) {
      console.error(loadError);
      setError("تعذر تحميل الواجبات من Firebase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHomeworks();
  }, []);

  function updateForm(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setMessage("");
    setError("");
  }

  async function saveHomework(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanInstructions = form.instructions.trim();

    if (!cleanTitle) {
      setError("اكتب عنوان الواجب أولًا.");
      return;
    }

    if (!cleanInstructions) {
      setError("اكتب تعليمات الواجب أولًا.");
      return;
    }

    if (!form.dueDate) {
      setError("حدد تاريخ استحقاق الواجب.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage(
        editingId ? "جاري حفظ التعديلات..." : "جاري إنشاء الواجب..."
      );

      const homeworkData = {
        title: cleanTitle,
        instructions: cleanInstructions,
        targetClass: form.targetClass,
        dueDate: form.dueDate,
        published: form.published,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "homeworks", editingId), homeworkData);

        setMessage("تم تعديل الواجب بنجاح ✅");
      } else {
        await addDoc(collection(db, "homeworks"), {
          ...homeworkData,
          createdAt: serverTimestamp(),
        });

        setMessage("تم إنشاء الواجب بنجاح ✅");
      }

      setForm(emptyForm);
      setEditingId("");
      await loadHomeworks();
    } catch (saveError) {
      console.error(saveError);
      setError("تعذر حفظ الواجب. تحقق من الاتصال وحاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(homework: Homework) {
    setEditingId(homework.id);

    setForm({
      title: homework.title,
      instructions: homework.instructions,
      targetClass: homework.targetClass,
      dueDate: homework.dueDate,
      published: homework.published,
    });

    setMessage("أنت الآن تعدّل الواجب المحدد.");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function togglePublished(homework: Homework) {
    try {
      setError("");
      setMessage("جاري تحديث حالة النشر...");

      await updateDoc(doc(db, "homeworks", homework.id), {
        published: !homework.published,
        updatedAt: serverTimestamp(),
      });

      setHomeworks((currentHomeworks) =>
        currentHomeworks.map((currentHomework) =>
          currentHomework.id === homework.id
            ? {
                ...currentHomework,
                published: !currentHomework.published,
              }
            : currentHomework
        )
      );

      setMessage(
        homework.published
          ? "تم إيقاف نشر الواجب."
          : "تم نشر الواجب للطلاب ✅"
      );
    } catch (publishError) {
      console.error(publishError);
      setError("تعذر تغيير حالة نشر الواجب.");
    }
  }

  async function removeHomework(homework: Homework) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف واجب: ${homework.title}؟`
    );

    if (!confirmed) return;

    try {
      setDeletingId(homework.id);
      setError("");
      setMessage("جاري حذف الواجب...");

      await deleteDoc(doc(db, "homeworks", homework.id));

      setHomeworks((currentHomeworks) =>
        currentHomeworks.filter(
          (currentHomework) => currentHomework.id !== homework.id
        )
      );

      if (editingId === homework.id) {
        resetForm();
      }

      setMessage("تم حذف الواجب بنجاح.");
    } catch (deleteError) {
      console.error(deleteError);
      setError("تعذر حذف الواجب.");
    } finally {
      setDeletingId("");
    }
  }

  const publishedCount = useMemo(
    () => homeworks.filter((homework) => homework.published).length,
    [homeworks]
  );

  const unpublishedCount = homeworks.length - publishedCount;

  function formatDueDate(dateValue: string) {
    if (!dateValue) return "غير محدد";

    const date = new Date(`${dateValue}T12:00:00`);

    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div style={styles.headerIcon}>📝</div>

        <div>
          <p style={styles.smallTitle}>لوحة المعلم</p>

          <h1 style={styles.title}>إدارة الواجبات اليومية</h1>

          <p style={styles.subtitle}>
            أنشئ واجبات الطلاب وحدد الفصل وتاريخ الاستحقاق وحالة النشر.
          </p>
        </div>
      </section>

      <section style={styles.statistics}>
        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{homeworks.length}</strong>
          <span style={styles.statLabel}>إجمالي الواجبات</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{publishedCount}</strong>
          <span style={styles.statLabel}>واجبات منشورة</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>{unpublishedCount}</strong>
          <span style={styles.statLabel}>غير منشورة</span>
        </article>
      </section>

      <section style={styles.formCard}>
        <div style={styles.formHeading}>
          <div>
            <p style={styles.sectionLabel}>
              {editingId ? "تعديل واجب" : "واجب جديد"}
            </p>

            <h2 style={styles.sectionTitle}>
              {editingId
                ? "تعديل بيانات الواجب"
                : "إنشاء واجب يومي"}
            </h2>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={styles.cancelButton}
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <form onSubmit={saveHomework} style={styles.form}>
          <label style={styles.label}>
            عنوان الواجب
            <input
              value={form.title}
              onChange={(event) =>
                updateForm("title", event.target.value)
              }
              placeholder="مثال: قراءة الدرس وحل التدريبات"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            تعليمات الواجب
            <textarea
              value={form.instructions}
              onChange={(event) =>
                updateForm("instructions", event.target.value)
              }
              placeholder="مثال: قراءة النص مرتين ثم حل تدريبات الصفحة 25"
              rows={5}
              style={{
                ...styles.input,
                ...styles.textarea,
              }}
            />
          </label>

          <div style={styles.twoColumns}>
            <label style={styles.label}>
              الفصل المستهدف
              <select
                value={form.targetClass}
                onChange={(event) =>
                  updateForm(
                    "targetClass",
                    event.target.value as TargetClass
                  )
                }
                style={styles.input}
              >
                <option value="الفصلان">الفصلان معًا</option>
                <option value="الثاني أ">الثاني أ</option>
                <option value="الثاني ب">الثاني ب</option>
              </select>
            </label>

            <label style={styles.label}>
              تاريخ الاستحقاق
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  updateForm("dueDate", event.target.value)
                }
                style={styles.input}
              />
            </label>
          </div>

          <label style={styles.publishOption}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                updateForm("published", event.target.checked)
              }
              style={styles.checkbox}
            />

            <span>
              <strong>نشر الواجب للطلاب</strong>
              <small style={styles.optionDescription}>
                يمكن إيقاف النشر أو إعادة نشره لاحقًا.
              </small>
            </span>
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : editingId
              ? "حفظ تعديلات الواجب"
              : "إنشاء الواجب"}
          </button>
        </form>

        {message && <div style={styles.successMessage}>{message}</div>}

        {error && <div style={styles.errorMessage}>{error}</div>}
      </section>

      <section style={styles.listSection}>
        <div style={styles.listHeader}>
          <div>
            <p style={styles.sectionLabel}>سجل الواجبات</p>
            <h2 style={styles.sectionTitle}>الواجبات المحفوظة</h2>
          </div>

          <button
            type="button"
            onClick={loadHomeworks}
            style={styles.refreshButton}
          >
            تحديث القائمة
          </button>
        </div>

        {loading && (
          <div style={styles.emptyState}>جاري تحميل الواجبات...</div>
        )}

        {!loading && homeworks.length === 0 && (
          <div style={styles.emptyState}>
            لا توجد واجبات محفوظة حتى الآن.
          </div>
        )}

        <div style={styles.homeworksGrid}>
          {homeworks.map((homework) => (
            <article key={homework.id} style={styles.homeworkCard}>
              <div style={styles.cardTop}>
                <div>
                  <p style={styles.targetClass}>
                    {homework.targetClass === "الفصلان"
                      ? "الثاني أ والثاني ب"
                      : homework.targetClass}
                  </p>

                  <h3 style={styles.homeworkTitle}>
                    {homework.title}
                  </h3>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    background: homework.published
                      ? "#dcfce7"
                      : "#f1f3f2",
                    color: homework.published
                      ? "#166534"
                      : "#5e6f68",
                  }}
                >
                  {homework.published ? "منشور ✅" : "غير منشور"}
                </span>
              </div>

              <div style={styles.detailsBox}>
                <p style={styles.instructions}>
                  {homework.instructions}
                </p>

                <p style={styles.dueDate}>
                  <strong>تاريخ الاستحقاق:</strong>{" "}
                  {formatDueDate(homework.dueDate)}
                </p>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => startEditing(homework)}
                  style={styles.editButton}
                >
                  تعديل
                </button>

                <button
                  type="button"
                  onClick={() => togglePublished(homework)}
                  style={{
                    ...styles.publishButton,
                    background: homework.published
                      ? "#fff5d6"
                      : "#16845f",
                    color: homework.published
                      ? "#7a5a00"
                      : "#ffffff",
                  }}
                >
                  {homework.published
                    ? "إيقاف النشر"
                    : "نشر الواجب"}
                </button>

                <button
                  type="button"
                  disabled={deletingId === homework.id}
                  onClick={() => removeHomework(homework)}
                  style={{
                    ...styles.deleteButton,
                    opacity: deletingId === homework.id ? 0.6 : 1,
                  }}
                >
                  {deletingId === homework.id
                    ? "جاري الحذف..."
                    : "حذف"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.noteCard}>
        <span style={styles.noteIcon}>💡</span>

        <div>
          <h3 style={styles.noteTitle}>الخطوة التالية</h3>

          <p style={styles.noteText}>
            بعد إنشاء واجب منشور سنربط صفحة الطالب تلقائيًا بأحدث واجب
            مناسب لفصله، بدل عرض عنوان ثابت.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px 18px 50px",
    background:
      "linear-gradient(180deg, #f3faf6 0%, #edf7f2 55%, #ffffff 100%)",
    color: "#143f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "26px",
    boxShadow: "0 12px 35px rgba(25, 104, 76, 0.08)",
  },

  headerIcon: {
    width: "78px",
    height: "78px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "23px",
    background: "#16845f",
    fontSize: "39px",
  },

  smallTitle: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(27px, 4vw, 40px)",
  },

  subtitle: {
    margin: 0,
    color: "#607a70",
    lineHeight: 1.8,
  },

  statistics: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
  },

  statCard: {
    padding: "24px",
    display: "grid",
    placeItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "22px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "39px",
    color: "#16845f",
  },

  statLabel: {
    color: "#587368",
    fontWeight: 800,
  },

  formCard: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "28px",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.08)",
  },

  formHeading: {
    marginBottom: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
  },

  sectionLabel: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  sectionTitle: {
    margin: 0,
    fontSize: "clamp(25px, 4vw, 34px)",
  },

  cancelButton: {
    padding: "12px 17px",
    borderRadius: "14px",
    border: "1px solid #d4e5dd",
    background: "#ffffff",
    color: "#45675b",
    fontWeight: 800,
    cursor: "pointer",
  },

  form: {
    display: "grid",
    gap: "18px",
  },

  label: {
    display: "grid",
    gap: "8px",
    color: "#234f40",
    fontSize: "17px",
    fontWeight: 900,
  },

  input: {
    width: "100%",
    padding: "15px",
    border: "2px solid #d5e8df",
    borderRadius: "16px",
    background: "#fbfefc",
    color: "#143f32",
    fontSize: "17px",
    outline: "none",
  },

  textarea: {
    resize: "vertical",
    lineHeight: 1.8,
    fontFamily: "Arial, sans-serif",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "16px",
  },

  publishOption: {
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    borderRadius: "17px",
    background: "#eef8f3",
    border: "1px solid #d5e9df",
    cursor: "pointer",
  },

  checkbox: {
    width: "22px",
    height: "22px",
  },

  optionDescription: {
    display: "block",
    marginTop: "5px",
    color: "#637d73",
    fontWeight: 400,
  },

  saveButton: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: "17px",
    background: "#16845f",
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 900,
    cursor: "pointer",
  },

  successMessage: {
    marginTop: "18px",
    padding: "17px",
    borderRadius: "17px",
    background: "#e8f8ef",
    color: "#17603f",
    lineHeight: 1.8,
    fontWeight: 800,
  },

  errorMessage: {
    marginTop: "18px",
    padding: "17px",
    borderRadius: "17px",
    background: "#feecec",
    color: "#983434",
    lineHeight: 1.8,
    fontWeight: 800,
  },

  listSection: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "28px",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.08)",
  },

  listHeader: {
    marginBottom: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
  },

  refreshButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: "15px",
    background: "#16845f",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  emptyState: {
    padding: "24px",
    textAlign: "center",
    borderRadius: "18px",
    background: "#f1f8f5",
    color: "#597469",
    fontWeight: 800,
  },

  homeworksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },

  homeworkCard: {
    padding: "22px",
    borderRadius: "22px",
    border: "1px solid #d7e9e0",
    background: "#fbfefc",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  targetClass: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  homeworkTitle: {
    margin: 0,
    fontSize: "25px",
  },

  statusBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: 800,
  },

  detailsBox: {
    margin: "19px 0",
    padding: "16px",
    borderRadius: "17px",
    background: "#f1f8f5",
    color: "#49685d",
  },

  instructions: {
    margin: "0 0 12px",
    lineHeight: 1.9,
    whiteSpace: "pre-wrap",
  },

  dueDate: {
    margin: 0,
    lineHeight: 1.8,
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
    gap: "10px",
  },

  editButton: {
    padding: "12px",
    border: "1px solid #bdd9cc",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#245f49",
    fontWeight: 800,
    cursor: "pointer",
  },

  publishButton: {
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  deleteButton: {
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    background: "#feecec",
    color: "#a03333",
    fontWeight: 800,
    cursor: "pointer",
  },

  noteCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef7f3",
    border: "1px solid #cfe5da",
  },

  noteIcon: {
    fontSize: "38px",
  },

  noteTitle: {
    margin: "0 0 6px",
  },

  noteText: {
    margin: 0,
    color: "#5c776c",
    lineHeight: 1.8,
  },
};