"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";

type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
};

function createEmptyQuestion(id: number): Question {
  return {
    id,
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  };
}

export default function TeacherQuizzesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classroom, setClassroom] = useState("الصف الثاني أ");
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion(1),
  ]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateQuestionText(questionId: number, value: string) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId
          ? { ...question, text: value }
          : question
      )
    );
  }

  function updateOption(
    questionId: number,
    optionIndex: number,
    value: string
  ) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) => {
        if (question.id !== questionId) return question;

        const newOptions = [...question.options];
        newOptions[optionIndex] = value;

        return {
          ...question,
          options: newOptions,
        };
      })
    );
  }

  function updateCorrectAnswer(
    questionId: number,
    optionIndex: number
  ) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId
          ? { ...question, correctAnswer: optionIndex }
          : question
      )
    );
  }

  function addQuestion() {
    const nextId =
      questions.length === 0
        ? 1
        : Math.max(...questions.map((question) => question.id)) + 1;

    setQuestions((currentQuestions) => [
      ...currentQuestions,
      createEmptyQuestion(nextId),
    ]);
  }

  function removeQuestion(questionId: number) {
    if (questions.length === 1) {
      setMessage("يجب أن يحتوي الاختبار على سؤال واحد على الأقل.");
      return;
    }

    setQuestions((currentQuestions) =>
      currentQuestions.filter(
        (question) => question.id !== questionId
      )
    );
  }

  function validateQuiz() {
    if (!title.trim()) {
      return "اكتب عنوان الاختبار.";
    }

    if (questions.length === 0) {
      return "أضف سؤالًا واحدًا على الأقل.";
    }

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];

      if (!question.text.trim()) {
        return `اكتب نص السؤال رقم ${index + 1}.`;
      }

      if (question.options.some((option) => !option.trim())) {
        return `أكمل جميع خيارات السؤال رقم ${index + 1}.`;
      }
    }

    return "";
  }

  async function saveQuiz(published: boolean) {
    setMessage("");

    const validationMessage = validateQuiz();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "quizzes"), {
        title: title.trim(),
        description: description.trim(),
        classroom,
        published,
        status: published ? "published" : "draft",

        questions: questions.map((question, index) => ({
          order: index + 1,
          text: question.text.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer,
          points: 1,
        })),

        totalQuestions: questions.length,
        totalPoints: questions.length,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage(
        published
          ? "تم نشر الاختبار بنجاح ✅"
          : "تم حفظ الاختبار كمسودة ✅"
      );

      setTitle("");
      setDescription("");
      setQuestions([createEmptyQuestion(1)]);
    } catch (error) {
      console.error("تعذر حفظ الاختبار:", error);
      setMessage(
        "تعذر حفظ الاختبار. تحقق من الاتصال بقاعدة البيانات."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.heroIcon}>📝</div>

          <div>
            <p style={styles.label}>أكاديمية لغتي الرقمية</p>
            <h1 style={styles.title}>إدارة الاختبارات</h1>
            <p style={styles.subtitle}>
              أنشئ اختبارًا قصيرًا، وحدد الإجابات الصحيحة، ثم احفظه
              كمسودة أو انشره للطلاب.
            </p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>بيانات الاختبار</h2>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>عنوان الاختبار</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: اختبار آداب التعامل"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>وصف مختصر</span>
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="اكتب تعليمات أو وصفًا مختصرًا للاختبار"
              style={styles.textarea}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>الفصل المستهدف</span>
            <select
              value={classroom}
              onChange={(event) =>
                setClassroom(event.target.value)
              }
              style={styles.input}
            >
              <option value="الصف الثاني أ">الصف الثاني أ</option>
              <option value="الصف الثاني ب">الصف الثاني ب</option>
              <option value="جميع طلاب الصف الثاني">
                جميع طلاب الصف الثاني
              </option>
            </select>
          </label>
        </div>

        <div style={styles.questionsHeader}>
          <div>
            <h2 style={styles.sectionTitle}>أسئلة الاختبار</h2>
            <p style={styles.helperText}>
              عدد الأسئلة الحالي: {questions.length}
            </p>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            style={styles.addButton}
          >
            + إضافة سؤال
          </button>
        </div>

        {questions.map((question, questionIndex) => (
          <div key={question.id} style={styles.questionCard}>
            <div style={styles.questionTop}>
              <h3 style={styles.questionTitle}>
                السؤال {questionIndex + 1}
              </h3>

              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                style={styles.deleteButton}
              >
                حذف السؤال
              </button>
            </div>

            <label style={styles.field}>
              <span style={styles.fieldLabel}>نص السؤال</span>
              <input
                value={question.text}
                onChange={(event) =>
                  updateQuestionText(
                    question.id,
                    event.target.value
                  )
                }
                placeholder="اكتب السؤال هنا"
                style={styles.input}
              />
            </label>

            <div style={styles.optionsGrid}>
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  style={{
                    ...styles.optionBox,
                    ...(question.correctAnswer === optionIndex
                      ? styles.correctOption
                      : {}),
                  }}
                >
                  <div style={styles.optionHeader}>
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={
                        question.correctAnswer === optionIndex
                      }
                      onChange={() =>
                        updateCorrectAnswer(
                          question.id,
                          optionIndex
                        )
                      }
                    />

                    <span>
                      الخيار {optionIndex + 1}
                      {question.correctAnswer === optionIndex
                        ? " — الإجابة الصحيحة ✅"
                        : ""}
                    </span>
                  </div>

                  <input
                    value={option}
                    onChange={(event) =>
                      updateOption(
                        question.id,
                        optionIndex,
                        event.target.value
                      )
                    }
                    placeholder={`اكتب الخيار ${optionIndex + 1}`}
                    style={styles.optionInput}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        {message && (
          <div style={styles.message}>{message}</div>
        )}

        <div style={styles.actions}>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuiz(false)}
            style={{
              ...styles.draftButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuiz(true)}
            style={{
              ...styles.publishButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "جارٍ النشر..." : "نشر الاختبار للطلاب"}
          </button>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f4fbf8 0%, #eef5ff 100%)",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  hero: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "24px",
    marginBottom: "20px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #d5e8df",
    boxShadow: "0 12px 35px rgba(22, 101, 52, 0.08)",
  },

  heroIcon: {
    display: "grid",
    placeItems: "center",
    width: "76px",
    height: "76px",
    flexShrink: 0,
    borderRadius: "20px",
    background: "#e8f8ef",
    fontSize: "38px",
  },

  label: {
    margin: 0,
    color: "#15835f",
    fontWeight: 800,
  },

  title: {
    margin: "7px 0",
    color: "#173f34",
    fontSize: "34px",
  },

  subtitle: {
    margin: 0,
    color: "#60736d",
    lineHeight: 1.8,
  },

  card: {
    padding: "22px",
    marginBottom: "22px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #dce9e4",
  },

  sectionTitle: {
    margin: "0 0 16px",
    color: "#173f34",
    fontSize: "24px",
  },

  field: {
    display: "grid",
    gap: "8px",
    marginBottom: "17px",
  },

  fieldLabel: {
    color: "#294f44",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbded6",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#173f34",
    fontSize: "16px",
  },

  textarea: {
    width: "100%",
    minHeight: "95px",
    boxSizing: "border-box",
    padding: "13px 14px",
    resize: "vertical",
    border: "1px solid #cbded6",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#173f34",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  questionsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  helperText: {
    margin: 0,
    color: "#64748b",
  },

  addButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "13px",
    background: "#16835f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  questionCard: {
    padding: "22px",
    marginBottom: "18px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #dce9e4",
    boxShadow: "0 8px 25px rgba(30, 80, 65, 0.06)",
  },

  questionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
  },

  questionTitle: {
    margin: 0,
    color: "#173f34",
    fontSize: "21px",
  },

  deleteButton: {
    padding: "8px 12px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fff7f7",
    color: "#b91c1c",
    fontWeight: 800,
    cursor: "pointer",
  },

  optionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
  },

  optionBox: {
    display: "grid",
    gap: "10px",
    padding: "13px",
    border: "1px solid #dbe5e1",
    borderRadius: "14px",
    background: "#f8faf9",
  },

  correctOption: {
    border: "2px solid #22a06b",
    background: "#ecfdf5",
  },

  optionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#315b4f",
    fontWeight: 800,
  },

  optionInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cadbd4",
    borderRadius: "10px",
    background: "#ffffff",
    fontSize: "15px",
  },

  message: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "13px",
    background: "#eef7f3",
    color: "#166534",
    fontWeight: 800,
    textAlign: "center",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  draftButton: {
    padding: "13px 20px",
    border: "1px solid #16835f",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#166534",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  publishButton: {
    padding: "13px 20px",
    border: "none",
    borderRadius: "13px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },
};