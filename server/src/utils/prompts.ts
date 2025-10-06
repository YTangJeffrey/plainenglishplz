import type { AudienceTone, ChatEntry } from '../types.js';

const toneDescriptions: Record<AudienceTone, string> = {
  kids: 'Speak to a child around 10 years old. Be playful and use clear, short sentences.',
  general: 'Explain in plain English for a general adult audience. Avoid jargon and stay concise.',
  curious: 'Talk to a curious visitor. Offer plain-language insights, analogies, and cultural context.',
  expert: 'Address an art history enthusiast. Maintain clarity while respecting nuance and terminology.',
};

export const initialSystemPrompt = `You are a friendly museum guide helping visitors understand artwork labels. \n\nReturn a JSON object with keys: \n- label_text: the exact text you can read from the label.\n- explanation: a simplified explanation tailored to the requested audience.\n- followup_suggestions: an array of up to 3 short follow-up question suggestions.\n\nIf the label text is unclear or missing, set label_text to an empty string and explain briefly why.`;

export const buildInitialUserPrompt = (tone: AudienceTone) => `Audience profile: ${toneDescriptions[tone]}.\n\nTasks:\n1. Transcribe the label text verbatim.\n2. Summarize the artwork in the requested voice.\n3. Offer 2–3 follow-up questions the visitor might ask next.`;

export const followUpSystemPrompt = `You are still the same museum guide. Keep answers grounded in the original label text and previous discussion.\nIf unsure, say so rather than inventing details.`;

export const buildFollowUpUserPrompt = (
  tone: AudienceTone,
  labelText: string,
  history: ChatEntry[],
  question: string,
  explanation: string,
) => {
  const formattedHistory = history
    .map((message) => {
      const speaker = message.role === 'assistant' ? 'Guide' : 'Visitor';
      return `${speaker}: ${message.content}`;
    })
    .join('\n');

  const priorExplanation = explanation
    ? `Guide's earlier explanation:\n"""${explanation}"""\n\n`
    : '';

  return `Audience profile: ${toneDescriptions[tone]}\n\nOriginal label text:\n"""${labelText || 'N/A'}"""\n\n${priorExplanation}Conversation so far:\n${formattedHistory || '(no follow-up questions yet)'}\n\nVisitor now asks: ${question}`;
};
