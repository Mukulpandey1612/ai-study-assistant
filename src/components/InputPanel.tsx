import { useState } from "react";
import type { Mode } from "../types";

interface Props {
  onSubmit: (text: string, mode: Mode) => void;
  disabled: boolean;
  initialText?: string;
  initialMode?: Mode;
}

const PLACEHOLDER = `Paste your notes, or just name a topic — e.g.

"The French Revolution: causes, key dates, major figures"

or paste a full paragraph of notes and I'll turn it into cards.`;

export function InputPanel({ onSubmit, disabled, initialText = "", initialMode = "flashcards" }: Props) {
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState<Mode>(initialMode);

  const trimmedLen = text.trim().length;
  const tooShort = trimmedLen > 0 && trimmedLen < 10;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trimmedLen < 10 || disabled) return;
    onSubmit(text.trim(), mode);
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-head">
        <span className="chalk-label">01 — study material</span>
        <div className="mode-toggle" role="radiogroup" aria-label="Study mode">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "flashcards"}
            className={mode === "flashcards" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("flashcards")}
          >
            Flashcards
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "quiz"}
            className={mode === "quiz" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("quiz")}
          >
            Quiz
          </button>
        </div>
      </div>

      <textarea
        className="notes-input"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={7}
        maxLength={6000}
      />

      <div className="panel-foot">
        <span className={tooShort ? "char-count warn" : "char-count"}>
          {tooShort ? "a little more detail helps" : `${trimmedLen} / 6000`}
        </span>
        <button className="chalk-btn" type="submit" disabled={disabled || trimmedLen < 10}>
          {disabled ? "generating…" : `Make ${mode === "quiz" ? "quiz" : "flashcards"}`}
        </button>
      </div>
    </form>
  );
}
