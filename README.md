# Study Assistant

Turn free-form notes or a topic into an interactive flashcard deck or quiz — powered by Gemini, rendered as real UI, not a chat log.

Built for the Flam Frontend Internship take-home assignment.

---

## What This Project Does

Most "AI study tool" demos just dump model output into a chat box. This one doesn't — the model is forced to return structured JSON, which the app parses into fully interactive components:

1. You paste notes or name a topic
2. You pick a mode: **Flashcards** or **Quiz**
3. Gemini generates a structured study set (title + question/answer cards)
4. The backend validates and repairs that JSON before it ever reaches the browser
5. You flip through cards or take the quiz, get scored, and retest whatever you got wrong

The core engineering challenge here isn't calling an LLM — it's making the UI reliable when the model doesn't cooperate: malformed JSON, wrong shape, empty output, slow responses, rate limits, and stale network responses are all handled explicitly rather than assumed away.

---

## Key Features

* **Structured AI Output, Not a Chatbot**
  Gemini is constrained with `responseMimeType: "application/json"` and a fixed schema; the model's raw text never touches the screen.

* **Server-Side Response Validation**
  The backend independently re-validates every field of the model's response — malformed cards are dropped individually instead of failing the whole set, quiz options are auto-repaired if the model forgets to include the correct answer.

* **Stale-Response Guarding**
  A request-id counter + `AbortController` ensures that if you regenerate before a response lands, an older response can never overwrite a newer one.

* **Flashcard Mode**
  3D flip animation, keyboard navigation (arrows + space), progress indicator.

* **Quiz Mode**
  Multiple choice with instant feedback, scoring, and a **retest wrong answers** loop that narrows the round to only what you missed.

* **Full Failure-State Coverage**
  Explicit loading / error / empty states for every request — timeouts, rate limits, and network failures all render a retry-capable error UI instead of crashing or hanging.

* **Mobile Responsive**
  Usable down to small phone viewport widths.

---

## Tech Stack

### Frontend
* React 19 (hooks, functional components)
* TypeScript
* Vite
* Plain CSS with design-token variables (no framework)

### Backend
* Node.js + Express
* Acts as a thin proxy so the Gemini API key never reaches the browser

### AI
* Google Gemini (`@google/generative-ai`)
* Model: `gemini-flash-lite-latest` 

<!-- ### Deployment
* Frontend: static build via `vite build` (deployable to Vercel/Netlify)
* Backend: any Node host (Render, Railway, Fly.io, etc.) -->

---

## Project Structure
```text
study-assistant/
├── server/
│   ├── index.js              
│   ├── .env.example
│   └── package.json
│
├── src/
│   ├── App.tsx               
│   ├── main.tsx
│   ├── index.css             
│   ├── types.ts              
│   │
│   ├── hooks/
│   │   └── useGenerateStudySet.ts   
│   │
│   └── components/
│       ├── InputPanel.tsx     
│       ├── StatusStates.tsx    
│       ├── FlashcardDeck.tsx   
│       └── QuizView.tsx        
│
├── .env.example
├── index.html
├── vite.config.ts
└── package.json
```

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Mukulpandey1612/ai-study-assistant.git
```

### 2. Get a Gemini API key

Free tier available at [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Set up the backend

```bash
cd server
npm install
npm run dev
```


### 4. Set up the frontend

```bash
npm install
npm run dev
```

---

## How Bad AI Output Is Handled

This was the primary evaluation criterion for the assignment, so it's documented explicitly:

| Failure mode | Handling |
|---|---|
| Malformed JSON | `responseMimeType: "application/json"` at the SDK level + fence-stripping fallback parser + try/catch returning a clean, retryable error |
| Wrong shape | `validateStudySet()` checks every field; malformed individual cards are dropped rather than failing the whole set |
| Missing quiz options | Auto-repaired — deduped, correct answer guaranteed present, padded to 4 |
| Empty response | Treated as a failed request if zero usable cards remain after validation |
| Slow response | 25s server-side timeout via `AbortController`, returns a clear timeout error |
| Failed request / rate limit | Renders the `ErrorState` component with a retry button — never a crash or infinite spinner |
| Stale response race | Request-id counter + `AbortController` ensures an older response can never overwrite a newer one |

---

## Author

Built by Mukul Pandey