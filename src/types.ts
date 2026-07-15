export type Mode = "flashcards" | "quiz";

export interface Card {
  id: string;
  question: string;
  answer: string;
  options: string[] | null;
}

export interface StudySet {
  title: string;
  mode: Mode;
  cards: Card[];
}

export type RequestStatus = "idle" | "loading" | "error" | "success";
