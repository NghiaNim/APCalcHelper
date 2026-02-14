# AP Calc Helper — Progress Tracker

This file tracks what has been built and what is next. Update it after every shipped feature.

## Completed

- [x] T3 scaffold (Next.js, tRPC, Prisma, NextAuth, Zod, Biome, Tailwind v4)
- [x] Cursor rules and centralized README + PROGRESS docs
- [x] Typed AP Calculus BC curriculum data + helpers
- [x] Prisma schema: StudentProfile, LearningSession, MisconceptionSignal
- [x] tRPC routers: curriculum, learning
- [x] Biome `noExplicitAny` lint rule
- [x] Landing page with section cards
- [x] Section detail page (`/learn/[sectionId]`)
- [x] Gemini TTS integration — `src/server/services/tts.ts`
- [x] KaTeX math rendering component — `src/app/_components/math-display.tsx`
- [x] Diagnostic quiz flow (3 questions, confirm-before-submit UX) — `src/app/_components/lesson-view.tsx`
- [x] Lesson page (`/learn/[sectionId]/lesson`) with visual teaching panel
- [x] System prompts for diagnostic + teaching — `src/features/ap-calculus-bc/prompts.ts`
- [x] GEMINI_API_KEY env validation
- [x] KaTeX CSS imported in layout
- [x] **AI backend rebuilt on Vercel AI SDK + Zod** — `src/server/services/ai.ts`
  - `generateObject` with `@ai-sdk/google` (gemini-2.5-flash)
  - `tutorResponseSchema` Zod schema validates AI output at generation time
  - No manual JSON parsing or type assertions
  - TTS isolated in `src/server/services/tts.ts` (graceful fallback)
  - Prompts simplified — no JSON format instructions needed

## Backlog — Week 1-2

- [ ] Voice input (Web Speech API or Whisper)
- [ ] Handwriting/image upload + vision interpretation
- [ ] Session persistence (save diagnostic results + lesson progress)
- [ ] Improved tutor persona via prompt iteration

## Backlog — Week 3

- [ ] Misconception diagnosis framework (structured reasoning probes)
- [ ] Misconception logging to DB per session
- [ ] Adaptive question difficulty based on diagnostic

## Backlog — Later

- [ ] Student onboarding profile UI
- [ ] Mental habit coaching prompts
- [ ] Testing strategy tutor module
- [ ] Analytics dashboard
- [ ] Expand beyond AP Calc BC
