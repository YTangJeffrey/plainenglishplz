export type AudienceTone = 'kids' | 'general' | 'curious' | 'cynic';

export const TONE_OPTIONS: Array<{
  id: AudienceTone;
  label: string;
  helper: string;
}> = [
  { id: 'kids', label: 'For Kids', helper: 'Playful, simple, vivid' },
  { id: 'general', label: 'General', helper: 'Friendly, avoid jargon' },
  { id: 'curious', label: 'Curious Explorer', helper: 'Add context and interesting facts' },
  { id: 'cynic', label: 'Cynic', helper: 'Sarcastic and humurous' },
];

export type SessionStatus = 'idle' | 'capturing' | 'processing' | 'ready' | 'error';

export interface LabelResult {
  labelText: string;
  explanation: string;
  followupSuggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}
