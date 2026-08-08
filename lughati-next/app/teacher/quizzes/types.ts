export type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  questionType?: "multiple-choice" | "essay" | "yes-no" | "short-text";
required?: boolean;
points?: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  classroom: string;
  audience?: "student" | "family";
contentKind?: "quiz" | "diagnostic-form" | "case-study-form";
  published: boolean;
  status: "draft" | "published";
  questions: Question[];
  totalQuestions: number;
  totalPoints: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};