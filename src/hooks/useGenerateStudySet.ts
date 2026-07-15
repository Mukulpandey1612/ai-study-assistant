import { useCallback, useRef, useState } from "react";
import type { Mode, RequestStatus, StudySet } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

interface State {
  status: RequestStatus;
  data: StudySet | null;
  error: string | null;
}

/**
 * Wraps the /api/generate call.
 *
 * Two failure modes this guards against, both explicitly required by the brief:
 *  1. A slow/failed request should never crash the UI — every path resolves
 *     to a typed state (idle/loading/error/success).
 *  2. A slow *older* request resolving after a newer one must never overwrite
 *     the newer result. We tag every request with an incrementing id and only
 *     commit a response if it's still the latest one in flight, and we abort
 *     the previous in-flight request when a new one starts.
 */
export function useGenerateStudySet() {
  const [state, setState] = useState<State>({ status: "idle", data: null, error: null });
  const latestRequestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (text: string, mode: Mode) => {
    const requestId = ++latestRequestId.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading", data: null, error: null });

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
        signal: controller.signal,
      });

      const body = await res.json().catch(() => null);

      // A response for an older request arrived after a newer one started — drop it.
      if (requestId !== latestRequestId.current) return;

      if (!res.ok || !body) {
        setState({
          status: "error",
          data: null,
          error: body?.error || `Request failed (${res.status}). Please retry.`,
        });
        return;
      }

      setState({ status: "success", data: body as StudySet, error: null });
    } catch (err) {
      if (requestId !== latestRequestId.current) return; // superseded, ignore
      if (err instanceof DOMException && err.name === "AbortError") return; // intentionally cancelled

      setState({
        status: "error",
        data: null,
        error: "Couldn't reach the server. Check your connection and retry.",
      });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    latestRequestId.current++;
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, generate, reset };
}
