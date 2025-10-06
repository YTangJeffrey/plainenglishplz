export type AudienceTone = 'kids' | 'general' | 'curious' | 'expert';

export interface LabelResult {
  labelText: string;
  explanation: string;
  followupSuggestions: string[];
}

export interface SessionData {
  id: string;
  tone: AudienceTone;
  labelText: string;
  explanation: string;
  history: Array<ChatEntry>;
}

export interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
