export type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  classroom: string;
  published: boolean;
  status: "draft" | "published";
  questions: Question[];
  totalQuestions: number;
  totalPoints: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};