import { randomUUID } from 'crypto';
import type { AudienceTone, ChatMessage, LabelResult } from '../types';
import { fetchSessionWithHistory } from './db';

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

export const getSession = async (sessionId: string): Promise<SessionData | null> => {
  const inMemory = sessions.get(sessionId);
  if (inMemory) {
    return inMemory;
  }

  const persisted = await fetchSessionWithHistory(sessionId);
  if (!persisted) {
    return null;
  }

  const session: SessionData = {
    id: sessionId,
    tone: persisted.tone,
    labelResult: persisted.labelResult,
    history: persisted.history.length > 0
      ? persisted.history
      : [
          {
            id: `${sessionId}-assistant-initial`,
            role: 'assistant',
            content: persisted.labelResult.explanation,
            createdAt: Date.now(),
          },
        ],
  };

  sessions.set(sessionId, session);
  return session;
};

export const appendToSession = (sessionId: string, entries: ChatMessage[]) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  session.history.push(...entries);
};
