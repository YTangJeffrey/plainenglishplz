import { randomUUID } from 'crypto';
import type { AudienceTone, ChatEntry, SessionData } from '../types.js';

const sessions = new Map<string, SessionData>();

const createId = () => (typeof randomUUID === 'function' ? randomUUID() : Math.random().toString(36).slice(2, 12));

export const createSession = (tone: AudienceTone, labelText: string, explanation: string): SessionData => {
  const id = createId();
  const session: SessionData = {
    id,
    tone,
    labelText,
    explanation,
    history: [],
  };

  sessions.set(id, session);
  return session;
};

export const getSession = (sessionId: string) => sessions.get(sessionId) ?? null;

export const appendToSession = (sessionId: string, entries: ChatEntry[]) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  session.history.push(...entries);
};

export const resetSessionStore = () => sessions.clear();
