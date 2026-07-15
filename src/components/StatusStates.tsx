export function LoadingState() {
  return (
    <div className="status-block" role="status" aria-live="polite">
      <div className="chalk-spinner" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>Working it out on the board…</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="status-block error" role="alert">
      <p className="status-title">That didn't come out right.</p>
      <p className="status-detail">{message}</p>
      <button className="chalk-btn ghost" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="status-block empty">
      <p className="status-title">Nothing on the board yet.</p>
      <p className="status-detail">Paste some notes above and pick flashcards or quiz to get started.</p>
    </div>
  );
}
