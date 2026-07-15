import { useEffect, useState } from "react";
import type { Card } from "../types";

export function FlashcardDeck({ title, cards }: { title: string; cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), cards.length - 1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  return (
    <div className="deck">
      <div className="deck-head">
        <h2 className="deck-title">{title}</h2>
        <span className="chalk-label">
          card {index + 1} / {cards.length}
        </span>
      </div>

      <div
        className={`flash-card ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Showing answer, click to flip back" : "Showing question, click to flip"}
        onKeyDown={(e) => {
          if (e.key === "Enter") setFlipped((f) => !f);
        }}
      >
        <div className="flash-card-inner">
          <div className="flash-face front">
            <span className="chalk-label small">question</span>
            <p>{card.question}</p>
          </div>
          <div className="flash-face back">
            <span className="chalk-label small">answer</span>
            <p>{card.answer}</p>
          </div>
        </div>
      </div>

      <div className="deck-controls">
        <button className="chalk-btn ghost" onClick={() => go(-1)} disabled={index === 0}>
          ← prev
        </button>
        <button className="chalk-btn ghost" onClick={() => setFlipped((f) => !f)}>
          flip (space)
        </button>
        <button className="chalk-btn ghost" onClick={() => go(1)} disabled={index === cards.length - 1}>
          next →
        </button>
      </div>
    </div>
  );
}
