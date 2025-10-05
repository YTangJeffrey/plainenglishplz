# Plain English, Please

A Vite + React prototype that captures a museum label, lets OpenAI's vision model read it, and returns a plain-language explanation with follow-up Q&A.

## Features
- Browser-based webcam capture optimised for mobile (environment-facing camera where available).
- Optional photo upload if you already snapped the label elsewhere.
- Sends the captured image directly to OpenAI's `gpt-4o-mini` vision model and requests structured JSON.
- Displays the extracted label text, simplified explanation, and quick follow-up suggestions tailored to the selected audience tone.
- Lightweight chat experience that remembers the original label context for additional questions.

## Getting Started
1. Install dependencies (choose a package manager):
   ```bash
   npm install
   # or
   pnpm install
   ```
2. Copy the environment template and paste your temporary OpenAI key (local use only):
   ```bash
   cp .env.example .env.local
   # edit .env.local and set VITE_OPENAI_API_KEY
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the provided localhost URL, allow camera access, and test the flow.

## Notes
- This prototype calls OpenAI directly from the browser. Do **not** deploy with an exposed API key—replace the direct call with a thin server-side proxy before sharing widely.
- The app requests `getUserMedia` with the environment-facing camera when available. Desktop browsers will default to the built-in webcam.
- Vision responses can be inaccurate in low-light or with stylised fonts; keep a manual input fallback on the roadmap.
- Prompt templates and tones live in `src/lib/promptTemplates.ts` so you can iterate quickly.
