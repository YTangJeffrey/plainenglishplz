export type AudienceTone = 'kids' | 'general' | 'curious' | 'expert' | 'custom';

export const TONE_OPTIONS: Array<{
  id: AudienceTone;
  label: string;
  helper: string;
}> = [
  { id: 'kids', label: 'For Kids', helper: 'Playful, simple, vivid' },
  { id: 'general', label: 'General Visitor', helper: 'Friendly, avoids jargon' },
  { id: 'curious', label: 'Curious Explorer', helper: 'Add context and interesting facts' },
  { id: 'expert', label: 'Scholar', helper: 'Respect nuance and terminology' },
  { id: 'custom', label: 'Custom', helper: 'Bring your own guide style' },
];

export type SessionStatus = 'idle' | 'processing' | 'ready' | 'error';

export interface LabelResult {
  labelText: string;
  explanation: string;
  followupSuggestions: string[];
}

export interface CustomGuide {
  name: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}
