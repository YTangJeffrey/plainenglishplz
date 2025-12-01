# Plain English, Please — AI Module Guide

An overview of how the app orchestrates camera uploads, OpenAI calls, and chat sessions. Use this as a map for maintaining prompts, schemas, and data flow between modules.

## High-Level Flow
- User captures or uploads an image in the UI (`CameraCapture` in `app/page.tsx`).
- Client POSTs `imageBase64` + `tone` to `/api/guide/analyze`.
- API calls OpenAI Vision (`gpt-4o-mini`) with `initialSystemPrompt` + user prompt + image and enforces `initialResponseFormat`.
- Parsed result seeds an in-memory session (with Postgres + Blob persistence when env vars are set; production uses Postgres for durability).
- Follow-up questions POST to `/api/guide/follow-up`, which re-prompts OpenAI with prior label text, explanation, and chat history using `followUpResponseFormat`.

## Frontend Modules
- `app/page.tsx`: Main experience. Wires capture, result display, follow-ups, and session lifecycle via `SessionProvider` + `useGuideApi`.
- `components/SessionProvider.tsx`: Client-side state machine (tone, status, label result, messages, captured image, errors, sessionId) with reducer-style actions.
- `components/CameraCapture.tsx`: Handles camera streaming and file upload (HEIC→JPEG via `heic2any`), emits a base64 data URL.
- `components/ResultPanel.tsx`: Shows model transcription, explanation, and suggested follow-ups; lets the user retake.
- `components/ChatPanel.tsx`: Follow-up chat UI, scroll management, and submission handling.
- `components/ToneSelector.tsx`: Tone picker backed by `TONE_OPTIONS`.
- `components/ErrorBanner.tsx`, `components/LoadingOverlay.tsx`: Simple UI helpers.
- `hooks/useGuideApi.ts`: Client fetcher for analyze and follow-up endpoints with loading/error state and lightweight response normalization.

## API Routes
- `app/api/guide/analyze/route.ts`
  - Validates body with `analyzeRequestSchema`.
  - Builds prompts via `initialSystemPrompt` + `buildInitialUserPrompt`.
  - Calls OpenAI (vision) with `initialResponseFormat`; parses via `safeJsonParse`.
  - Creates an in-memory session, uploads image to Vercel Blob if configured, persists session + initial assistant message to Postgres when available.
- `app/api/guide/follow-up/route.ts`
  - Validates body with `followUpRequestSchema`; loads session from memory or Postgres.
  - Builds prompt with `followUpSystemPrompt` + `buildFollowUpUserPrompt` (injects label text, prior explanation, chat history, current question).
  - Calls OpenAI with `followUpResponseFormat`, returns answer + new suggestions, appends messages to session, and records them in Postgres when available.

## Shared Libraries
- `lib/prompts.ts`: Prompt templates for initial analysis and follow-ups, tone descriptors, and prompt builders.
- `lib/responseFormats.ts`: JSON schema response formats for OpenAI `response_format` (initial summary and follow-up answer).
- `lib/validators.ts`: Zod schemas for incoming requests (tone enum, base64 image data URL, sessionId/question for follow-ups).
- `lib/sessionStore.ts`: In-memory session map with fetch/append helpers; falls back to Postgres history when available.
- `lib/db.ts`: Optional Postgres persistence (session records + interaction logs); lazy table creation and pooled connections.
- `lib/blob.ts`: Optional upload of captured image data URLs to Vercel Blob, returning a public URL.
- `lib/json.ts`: Safe JSON parse wrapper for model responses.
- `lib/id.ts`: Client-safe ID generator using `crypto.randomUUID` when available.

## Types
- `types/index.ts`: Shared primitives (`AudienceTone`, `SessionStatus`, `LabelResult`, `ChatMessage`) and tone metadata (`TONE_OPTIONS`).

## Environment
- Required: `OPENAI_API_KEY` for OpenAI calls.
- Optional: `POSTGRES_URL` to enable persistence across server instances; `BLOB_READ_WRITE_TOKEN` to store captured images in Vercel Blob.
