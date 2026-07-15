import { useGenerateStudySet } from "./hooks/useGenerateStudySet";
import { InputPanel } from "./components/InputPanel";
import { LoadingState, ErrorState, EmptyState } from "./components/StatusStates";
import { FlashcardDeck } from "./components/FlashcardDeck";
import { QuizView } from "./components/QuizView";
import type { Mode } from "./types";

function App() {
  const { status, data, error, generate, reset } = useGenerateStudySet();

  function handleSubmit(text: string, mode: Mode) {
    generate(text, mode);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="chalk-label">study assistant</span>
        <h1>Turn notes into something you can actually test yourself on.</h1>
      </header>

      <InputPanel onSubmit={handleSubmit} disabled={status === "loading"} />

      <section className="result-area">
        {status === "idle" && <EmptyState />}
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState message={error ?? "Something went wrong."} onRetry={reset} />}
        {status === "success" && data && (
          <>
            {data.mode === "flashcards" ? (
              <FlashcardDeck title={data.title} cards={data.cards} />
            ) : (
              <QuizView title={data.title} cards={data.cards} />
            )}
            <button className="chalk-btn ghost new-set-btn" onClick={reset}>
              start a new set
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default App;
