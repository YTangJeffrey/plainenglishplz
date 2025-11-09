# Plain English, Please (Next.js)

A Next.js 14 app that captures museum labels, lets OpenAI’s vision model read them, and returns plain-English explanations with conversational follow-ups.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your `OPENAI_API_KEY`. For local Blob/Postgres testing also add:
   - `BLOB_READ_WRITE_TOKEN` (from `vercel blob tokens create`)
   - `POSTGRES_URL` pointing at your local Postgres instance
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser, allow the camera, or upload a label photo to test the flow (HEIC files are converted to JPEG client-side).

## Project Structure
- `app/` – Next.js App Router pages and API routes.
  - `page.tsx` renders the main experience with a client-side session provider.
  - `api/guide/analyze` and `api/guide/follow-up` proxy requests to OpenAI while keeping the API key server-side.
- `components/` – Reusable UI pieces such as camera capture, tone selector, result & chat panels.
- `hooks/` – Client-side hooks for talking to the guide API.
- `lib/` – Shared helpers (prompt templates, session store, JSON parsers, OpenAI response schemas).
- `types/` – Shared TypeScript types and tone metadata.

## Scripts
- `npm run dev` – Start the Next.js dev server.
- `npm run build` – Build the production bundle.
- `npm run start` – Run the production server locally.
- `npm run lint` – Check linting rules.
- `npm run typecheck` – Run TypeScript without emitting files.

## Deployment Notes
- Provide `OPENAI_API_KEY` to your hosting platform as a secret/env variable. The API routes run on the server, so the key never ships to the browser.
- If you want Blob uploads and Postgres logging in production, provision Vercel Blob + Vercel Postgres and set `BLOB_READ_WRITE_TOKEN` / `POSTGRES_URL` accordingly.
- The session store keeps data in-memory per server instance; swap it for a shared store (Redis, database) before scaling horizontally.
- For Vercel, simply import the project, set the environment variable, and deploy—the API routes work out of the box.
