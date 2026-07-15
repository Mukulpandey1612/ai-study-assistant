import { useMemo, useState } from "react";
import type { Card } from "../types";

type Phase = "answering" | "revealed" | "round-summary";

export function QuizView({ title, cards }: { title: string; cards: Card[] }) {
  const [round, setRound] = useState<Card[]>(cards);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [wrong, setWrong] = useState<Card[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  const current = round[index];
  const isCorrect = selected === current?.answer;

  const scoreLabel = useMemo(
    () => `${correctCount} / ${round.length} correct`,
    [correctCount, round.length]
  );

  function pickOption(option: string) {
    if (phase !== "answering") return;
    setSelected(option);
    setPhase("revealed");
    if (option === current.answer) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrong((w) => [...w, current]);
    }
  }

  function next() {
    if (index + 1 < round.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setPhase("answering");
    } else {
      setPhase("round-summary");
    }
  }

  function retestWrong() {
    setRound(wrong);
    setWrong([]);
    setCorrectCount(0);
    setIndex(0);
    setSelected(null);
    setPhase("answering");
    setRoundNumber((n) => n + 1);
  }

  function restartAll() {
    setRound(cards);
    setWrong([]);
    setCorrectCount(0);
    setIndex(0);
    setSelected(null);
    setPhase("answering");
    setRoundNumber(1);
  }

  if (phase === "round-summary") {
    const allCorrect = wrong.length === 0;
    return (
      <div className="deck">
        <div className="deck-head">
          <h2 className="deck-title">{title}</h2>
          <span className="chalk-label">round {roundNumber}</span>
        </div>
        <div className="quiz-summary">
          <p className="status-title">{allCorrect ? "Clean sweep." : "Round done."}</p>
          <p className="status-detail">{scoreLabel}</p>
          <div className="deck-controls">
            {!allCorrect && (
              <button className="chalk-btn" onClick={retestWrong}>
                Retest {wrong.length} wrong answer{wrong.length > 1 ? "s" : ""}
              </button>
            )}
            <button className="chalk-btn ghost" onClick={restartAll}>
              Restart full quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck">
      <div className="deck-head">
        <h2 className="deck-title">{title}</h2>
        <span className="chalk-label">
          {roundNumber > 1 ? `retest ${index + 1} / ${round.length}` : `question ${index + 1} / ${round.length}`}
        </span>
      </div>

      <div className="quiz-card">
        <span className="chalk-label small">question</span>
        <p className="quiz-question">{current.question}</p>

        <div className="quiz-options">
          {current.options?.map((opt) => {
            let cls = "quiz-option";
            if (phase === "revealed") {
              if (opt === current.answer) cls += " correct";
              else if (opt === selected) cls += " incorrect";
            } else if (opt === selected) {
              cls += " selected";
            }
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => pickOption(opt)}
                disabled={phase === "revealed"}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {phase === "revealed" && (
          <div className="quiz-feedback">
            <p>{isCorrect ? "Correct." : `Not quite — correct answer: ${current.answer}`}</p>
            <button className="chalk-btn" onClick={next}>
              {index + 1 < round.length ? "Next →" : "See results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
