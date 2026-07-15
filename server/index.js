import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Study Assistant API is running 🚀"
  });
});


const PORT = process.env.PORT || 8787;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "[warn] GEMINI_API_KEY is not set. Add it to server/.env — see server/.env.example."
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// The exact shape we ask the model for. Kept in one place so the prompt
// and the server-side shape check can't drift apart.
const SCHEMA_DESCRIPTION = `
Return ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:

{
  "title": string,               // short title for this study set, derived from the input
  "cards": [
    {
      "question": string,        // the front of the card / quiz question
      "answer": string,          // the correct answer, 1-2 sentences max
      "options": string[] | null // exactly 4 short strings for quiz mode (one must equal "answer" verbatim), null for flashcard mode
    }
  ]
}

Rules:
- Produce between 5 and 10 cards.
- Never leave "question" or "answer" empty.
- Keep answers concise (under 30 words).
- If mode is "quiz", every card MUST include exactly 4 "options" and "answer" must be one of them, verbatim.
- If mode is "flashcards", "options" must be null.
`.trim();

function buildPrompt(sourceText, mode) {
  return `You are generating a ${mode === "quiz" ? "quiz" : "flashcard deck"} for a student from the study material below.

${SCHEMA_DESCRIPTION}

Study material:
"""
${sourceText}
"""`;
}

// Defensive shape check. We do NOT trust the model to have followed the
// schema just because we asked nicely — this is what actually protects
// the frontend from malformed/partial/wrong-shape JSON.
function validateStudySet(raw, mode) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Response was not a JSON object.");
  }
  if (typeof raw.title !== "string" || !raw.title.trim()) {
    throw new Error("Missing or empty 'title'.");
  }
  if (!Array.isArray(raw.cards) || raw.cards.length === 0) {
    throw new Error("Missing or empty 'cards' array.");
  }
  if (raw.cards.length > 20) {
    throw new Error("Too many cards returned.");
  }

  const cleanCards = [];
  for (const [i, card] of raw.cards.entries()) {
    if (!card || typeof card !== "object") continue;
    const question = typeof card.question === "string" ? card.question.trim() : "";
    const answer = typeof card.answer === "string" ? card.answer.trim() : "";
    if (!question || !answer) continue; // skip malformed card rather than fail the whole set

    let options = null;
    if (mode === "quiz") {
      if (!Array.isArray(card.options)) continue;
      const cleanOpts = card.options
        .filter((o) => typeof o === "string" && o.trim())
        .map((o) => o.trim());
      // De-dupe and ensure the answer is present among options
      const uniqueOpts = Array.from(new Set(cleanOpts));
      if (!uniqueOpts.includes(answer)) {
        uniqueOpts[0] = answer; // repair rather than discard
      }
      while (uniqueOpts.length < 4) uniqueOpts.push("None of the above");
      options = uniqueOpts.slice(0, 4).sort(() => Math.random() - 0.5);
    }

    cleanCards.push({ id: `c${i}`, question, answer, options });
  }

  if (cleanCards.length === 0) {
    throw new Error("No usable cards after validation.");
  }

  return { title: raw.title.trim(), cards: cleanCards };
}

// Strip common wrapping the model adds despite instructions (```json fences etc.)
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model output.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

app.post("/api/generate", async (req, res) => {
  const { text, mode } = req.body || {};

  if (!genAI) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }
  if (typeof text !== "string" || text.trim().length < 10) {
    return res.status(400).json({ error: "Please provide at least a sentence of study material." });
  }
  if (mode !== "flashcards" && mode !== "quiz") {
    return res.status(400).json({ error: "Invalid mode." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // guard against a hung request

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(buildPrompt(text.trim().slice(0, 6000), mode));
    clearTimeout(timeout);

    const rawText = result.response.text();
    let parsed;
    try {
      parsed = extractJson(rawText);
    } catch {
      return res.status(502).json({ error: "The model returned malformed JSON. Please retry." });
    }

    let studySet;
    try {
      studySet = validateStudySet(parsed, mode);
    } catch (err) {
      return res.status(502).json({ error: `The model's response didn't match the expected shape: ${err.message}` });
    }

    return res.json({ ...studySet, mode });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "The model took too long to respond. Please retry." });
    }
    console.error(err);
    return res.status(502).json({ error: "The model call failed. Please retry." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Study assistant backend listening on http://localhost:${PORT}`);
});
