import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { guideRouter } from './routes/guide.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : undefined,
    credentials: false,
  }),
);

app.use(express.json({ limit: '8mb' }));
app.use('/api', guideRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unexpected error', err);
  res.status(500).json({ error: 'Something went wrong while talking to the museum guide.' });
});

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`Museum guide API running on port ${port}`);
});
