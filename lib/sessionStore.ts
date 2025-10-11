import { randomUUID } from 'crypto';
import type { AudienceTone, ChatMessage, LabelResult } from '../types';

interface SessionData {
  id: string;
  tone: AudienceTone;
  labelResult: LabelResult;
  history: ChatMessage[];
}

const sessions = new Map<string, SessionData>();

const createId = () => (typeof randomUUID === 'function' ? randomUUID() : Math.random().toString(36).slice(2, 12));

export const createSession = (tone: AudienceTone, result: LabelResult): SessionData => {
  const id = createId();
  const session: SessionData = {
    id,
    tone,
    labelResult: result,
    history: [
      {
        id: `${id}-assistant-initial`,
        role: 'assistant',
        content: result.explanation,
        createdAt: Date.now(),
      },
    ],
  };

  sessions.set(id, session);
  return session;
};

export const getSession = (sessionId: string) => sessions.get(sessionId) ?? null;

export const appendToSession = (sessionId: string, entries: ChatMessage[]) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  session.history.push(...entries);
};
