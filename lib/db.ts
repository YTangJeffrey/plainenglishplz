import { Pool } from 'pg';
import type { AudienceTone, ChatMessage, CustomGuide, LabelResult } from '@/types';

const connectionString = process.env.POSTGRES_URL;
const hasDatabase = Boolean(connectionString);

let pool: Pool | null = null;
let tablesInitialized = false;
let ensurePromise: Promise<void> | null = null;

const getPool = () => {
  if (!hasDatabase) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString });
    pool.on('error', (error) => {
      console.error('[db] Unexpected Postgres error', error);
    });
  }

  return pool;
};

const ensureTables = async () => {
  const client = getPool();
  if (!client || tablesInitialized) {
    return;
  }

  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        tone TEXT NOT NULL,
        image_url TEXT,
        label_text TEXT,
        explanation TEXT,
        custom_name TEXT,
        custom_description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS custom_name TEXT;`);
    await client.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS custom_description TEXT;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    tablesInitialized = true;
  })()
    .catch((error) => {
      ensurePromise = null;
      throw error;
    })
    .finally(() => {
      ensurePromise = null;
    });

  return ensurePromise;
};

export const recordSession = async (
  sessionId: string,
  tone: AudienceTone,
  result: LabelResult,
  imageUrl: string | null,
  customGuide: CustomGuide | null,
) => {
  const client = getPool();
  if (!client) {
    return;
  }

  await ensureTables();

  await client.query(
    `INSERT INTO sessions (id, tone, image_url, label_text, explanation, custom_name, custom_description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id)
     DO UPDATE SET
       tone = EXCLUDED.tone,
       image_url = EXCLUDED.image_url,
       label_text = EXCLUDED.label_text,
       explanation = EXCLUDED.explanation,
       custom_name = EXCLUDED.custom_name,
       custom_description = EXCLUDED.custom_description,
       created_at = NOW();`,
    [sessionId, tone, imageUrl, result.labelText, result.explanation, customGuide?.name ?? null, customGuide?.description ?? null],
  );
};

export const recordInteraction = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
) => {
  const client = getPool();
  if (!client) {
    return;
  }

  await ensureTables();

  await client.query(
    `INSERT INTO interactions (session_id, role, content)
     VALUES ($1, $2, $3);`,
    [sessionId, role, content],
  );
};

export const fetchSessionWithHistory = async (sessionId: string) => {
  const client = getPool();
  if (!client) {
    return null;
  }

  await ensureTables();

  const sessionResult = await client.query(
    `SELECT tone, image_url, label_text, explanation, custom_name, custom_description FROM sessions WHERE id = $1 LIMIT 1;`,
    [sessionId],
  );

  if (sessionResult.rowCount === 0) {
    return null;
  }

  const sessionRow = sessionResult.rows[0] as {
    tone: AudienceTone;
    image_url: string | null;
    label_text: string | null;
    explanation: string | null;
    custom_name: string | null;
    custom_description: string | null;
  };

  const interactionsResult = await client.query(
    `SELECT role, content, created_at, id
     FROM interactions
     WHERE session_id = $1
     ORDER BY created_at ASC, id ASC;`,
    [sessionId],
  );

  const history: ChatMessage[] = interactionsResult.rows.map((row, index) => ({
    id: `${sessionId}-${row.id ?? index}`,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }));

  const labelResult: LabelResult = {
    labelText: sessionRow.label_text ?? '',
    explanation: sessionRow.explanation ?? '',
    followupSuggestions: [],
  };

  return {
    tone: sessionRow.tone,
    imageUrl: sessionRow.image_url ?? null,
    labelResult,
    history,
    customGuide: sessionRow.custom_name && sessionRow.custom_description
      ? { name: sessionRow.custom_name, description: sessionRow.custom_description }
      : null,
  };
};
