import type { Question } from "./types";

export function createEmptyQuestion(id: number): Question {
  return {
    id,
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    questionType: "multiple-choice",
required: true,
points: 1,
  };
}