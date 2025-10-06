# Plain English, Please – Web

React + Vite single-page app that captures or uploads a museum label, then chats with the "museum guide" powered by the backend API.

## Features
- Browser-based webcam capture (environment-facing camera when available) with an upload fallback.
- Sends images to the backend API, which forwards them to OpenAI's `gpt-4o-mini` vision model.
- Displays extracted label text, simplified explanation, and suggested follow-up prompts tailored to selected tones.
- Chat UI keeps the conversation grounded in the original label and prior answers.

## Local Development
1. From the repo root, install deps once (`npm install`).
2. Copy the provided environment file:
   ```bash
   cp web/.env.example web/.env.local
   ```
   Adjust `VITE_API_BASE_URL` if your backend runs on a different port.
3. Start both the server and web app:
   ```bash
   npm run dev
   ```
   The frontend runs at http://localhost:5173.

## Notes
- All OpenAI requests now flow through the backend (`server/`), so no API keys live in the browser bundle.
- Prompt templates and tone settings live in `src/lib/promptTemplates.ts` for quick iteration.
- Handle retries, manual text entry, and accessibility improvements next as you harden the prototype.
