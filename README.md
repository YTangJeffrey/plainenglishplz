# Plain English, Please

Monorepo for the "Plain English, Please" prototype. The project now has a secure backend that proxies all OpenAI calls and a Vite-powered React frontend.

## Packages
- `web/` – React + Vite single-page app for capturing or uploading artwork labels and chatting with the museum guide.
- `server/` – Express API that handles OpenAI vision + chat requests and stores lightweight in-memory sessions.

## Prerequisites
- Node.js 18+
- An OpenAI API key with access to GPT-4o or GPT-4o-mini.

## Setup
1. Install dependencies (from the repo root):
   ```bash
   npm install
   ```
2. Configure environment files:
   - Frontend: copy `web/.env.example` to `web/.env.local` (already set to `http://localhost:4000` by default).
   - Backend: copy `server/.env.example` to `server/.env` and set `OPENAI_API_KEY`.
3. Run both apps together:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000 (health check at `/health`).

## Useful Scripts
- `npm run dev:web` – start only the Vite dev server.
- `npm run dev:server` – start only the Express API (with automatic reload via `tsx`).
- `npm run build` – build both packages (server output in `server/dist`, web output in `web/dist`).
- `npm run typecheck` – run TypeScript in both workspaces.

## Deployment Notes
- Do **not** expose your OpenAI key in the browser bundle. The backend already keeps it server-side; deploy the API and point the frontend at the deployed URL with `VITE_API_BASE_URL`.
- The server stores sessions in memory for rapid prototyping. Use a persistent store (Redis, database) before deploying to production or scaling beyond a single instance.
- Add auth and rate limiting before sharing broadly in a museum environment.
