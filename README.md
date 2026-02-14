# AP Calculus BC Interactive Tutor

An AI tutor with the tacit knowledge of an excellent teacher. The first product teaches AP Calculus BC through voice and screen interactions, real-time feedback, and visual reasoning support.

## Product Principles

- Not a chatbot: the core interaction is live guided teaching via voice + screen.
- Diagnose reasoning gaps, not just right/wrong answers.
- Ask conceptual questions and adapt difficulty over time.
- Explain graphs and derivations step-by-step with visual + verbal support.
- Keep the implementation simple and iterative.

## Engineering Rules

- Keep architecture simple. Prefer small modules and direct data flow.
- Avoid duplication. Reuse types, schemas, and helpers.
- Use strong typing everywhere. Never use `any`.
- Follow T3 best practices: Next.js App Router + tRPC + Prisma + Zod + NextAuth.
- Keep one product doc in `README.md` and one progress tracker in `PROGRESS.md`.
- Prefer clear domain boundaries; avoid unnecessary abstraction.

## Architecture

- **Frontend**: Next.js App Router, Tailwind v4, KaTeX for math rendering.
- **API layer**: tRPC routers with Zod input validation.
- **Auth**: NextAuth + Prisma adapter (Discord provider).
- **DB**: PostgreSQL via Prisma (hosted on Supabase).
- **AI backend**: Vercel AI SDK (`ai` + `@ai-sdk/google`) with `generateObject` for structured output validated by Zod schemas. No manual JSON parsing — the SDK enforces the response schema at generation time.
- **TTS**: Gemini 2.5 Flash Preview TTS via `@google/genai` (isolated in `src/server/services/tts.ts`). Returns nullable audio — graceful degradation if unavailable.
- **Runtime env validation**: `src/env.js` with Zod schemas via `@t3-oss/env-nextjs`.

### AI Service Stack

```
System prompt (per phase)
        ↓
Vercel AI SDK generateObject()
  ├── model: @ai-sdk/google → gemini-2.5-flash
  ├── schema: tutorResponseSchema (Zod)
  └── messages: conversation history
        ↓
Zod-validated TutorResponse
  { spokenText, displayMath[], isQuestion, diagnosticComplete, misconceptionNotes[] }
        ↓
TTS (optional, @google/genai → gemini-2.5-flash-preview-tts)
        ↓
Client receives: TutorResponse + audioBase64 | null
```

Key files:
- `src/server/services/ai.ts` — Vercel AI SDK chat with Zod-validated structured output
- `src/server/services/tts.ts` — Gemini TTS with graceful fallback
- `src/server/api/routers/tutor.ts` — tRPC endpoint combining chat + TTS
- `src/features/ap-calculus-bc/prompts.ts` — system prompts (no JSON format instructions needed — Zod handles schema)

## Core Feature Specs

### 1. Syllabus Navigation

Student picks "today I want to learn [topic]" from a pre-built AP Calc BC unit list. No adaptive sequencing yet — just a menu.

**Success**: Student can choose a section in under 30 seconds.

### 2. Diagnostic Quiz

When a student enters a lesson, the AI asks 3 targeted conceptual questions to assess understanding. Student answers on screen in text, sees a confirmation ("Is this what you meant?"), can edit, then submits. After diagnostic, the AI summarizes strengths and gaps and the lesson begins.

**Success**: Diagnostic completes in under 3 minutes; AI accurately identifies at least one reasoning gap per session.

### 3. Voice Conversation Loop

Student speaks (or types) → AI processes → AI responds via TTS + visual panel. The AI sounds like a tutor, not an assistant. Prompt engineering is critical.

**Success**: Median tutor response latency under 3 seconds; student satisfaction >= 4/5.

### 4. Visual Teaching Panel

AI generates step-by-step explanations with LaTeX-rendered math. The screen shows what a whiteboard would show; the voice explains it.

**Success**: Math renders correctly; step-by-step reveal matches narration flow.

### 5. Handwriting / Image Upload

Student uploads photo from iPad. AI interprets handwritten math, identifies errors, responds verbally + visually.

**Success**: >= 80% of uploads processed with usable extracted context.

### 6. Misconception Diagnosis (Differentiator)

When a student gets something wrong, the AI probes *why*. Example: student differentiates sin(x^2) wrong → AI asks "walk me through your chain rule thinking" → identifies if student forgot vs. misapplied the rule. Log these misconceptions as a data asset.

**Success**: For reviewed sessions, tutors agree with diagnosis quality >= 70%.

### 7. Adaptive Question Generation

AI produces difficulty-adjusted examples with explanation and hints.

**Success**: Student correction rate improves between first and second attempt for same concept.

## Development Commands

- `bun install` — install dependencies
- `bun run dev` — start dev server
- `bun run typecheck` — type check
- `bun run check` — Biome lint/format
- `bun run db:push` — push Prisma schema to DB
- `bun run db:generate` — run Prisma migrations
