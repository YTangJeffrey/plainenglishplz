import { useCallback, useState } from 'react';
import { buildFollowUpUserPrompt, buildInitialUserPrompt, followUpSystemPrompt, initialSystemPrompt } from '../lib/promptTemplates';
import { safeJsonParse } from '../lib/json';
import type { AudienceTone, ChatMessage, LabelResult } from '../types';

const CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

type InitialResponsePayload = {
  label_text: string;
  explanation: string;
  followup_suggestions?: string[];
};

type FollowUpResponsePayload = {
  answer: string;
  followup_suggestions?: string[];
};

const extractContent = (raw: unknown): string => {
  if (!raw) {
    return '';
  }

  if (typeof raw === 'string') {
    return raw;
  }

  if (Array.isArray(raw)) {
    const textPart = raw.find((part) => typeof part === 'object' && part !== null && 'text' in part);
    if (textPart && typeof textPart === 'object' && textPart && 'text' in textPart) {
      return String((textPart as { text?: string }).text ?? '');
    }
  }

  return '';
};

const buildSchema = (name: string, properties: Record<string, unknown>, required: string[]) => ({
  type: 'json_schema' as const,
  json_schema: {
    name,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties,
      required,
    },
    strict: true,
  },
});

const initialResponseFormat = buildSchema(
  'ArtworkLabelSummary',
  {
    label_text: { type: 'string' },
    explanation: { type: 'string' },
    followup_suggestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
      maxItems: 3,
    },
  },
  ['label_text', 'explanation', 'followup_suggestions'],
);

const followUpResponseFormat = buildSchema(
  'ArtworkFollowUpAnswer',
  {
    answer: { type: 'string' },
    followup_suggestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
      maxItems: 3,
    },
  },
  ['answer', 'followup_suggestions'],
);

interface GenerateExplanationArgs {
  imageBase64: string;
  tone: AudienceTone;
}

interface FollowUpArgs {
  tone: AudienceTone;
  labelText: string;
  history: ChatMessage[];
  question: string;
  explanation: string;
}

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateExplanation = useCallback(
    async ({ imageBase64, tone }: GenerateExplanationArgs): Promise<LabelResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('Missing VITE_OPENAI_API_KEY. Add it to your .env.local file.');
        }

        const response = await fetch(CHAT_COMPLETIONS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: 'system',
                content: initialSystemPrompt,
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: buildInitialUserPrompt(tone) },
                  { type: 'image_url', image_url: { url: imageBase64 } },
                ],
              },
            ],
            response_format: initialResponseFormat,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'OpenAI request failed');
        }

        const rawContent = payload?.choices?.[0]?.message?.content;
        const parsed = safeJsonParse<InitialResponsePayload>(extractContent(rawContent));

        if (!parsed) {
          throw new Error('Unable to parse model response');
        }

        return {
          labelText: parsed.label_text?.trim() ?? '',
          explanation: parsed.explanation?.trim() ?? '',
          followupSuggestions: (parsed.followup_suggestions ?? []).filter(Boolean),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error calling OpenAI';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sendFollowUp = useCallback(
    async ({ tone, labelText, history, question, explanation }: FollowUpArgs) => {
      setIsLoading(true);
      setError(null);

      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('Missing VITE_OPENAI_API_KEY. Add it to your .env.local file.');
        }

        const response = await fetch(CHAT_COMPLETIONS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: followUpSystemPrompt },
              { role: 'user', content: buildFollowUpUserPrompt(tone, labelText, history, question, explanation) },
            ],
            response_format: followUpResponseFormat,
            temperature: 0.8,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'OpenAI follow-up request failed');
        }

        const rawContent = payload?.choices?.[0]?.message?.content;
        const parsed = safeJsonParse<FollowUpResponsePayload>(extractContent(rawContent));

        if (!parsed) {
          throw new Error('Unable to parse follow-up response');
        }

        return {
          answer: parsed.answer?.trim() ?? '',
          followupSuggestions: (parsed.followup_suggestions ?? []).filter(Boolean),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error calling OpenAI';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = () => setError(null);

  return {
    generateExplanation,
    sendFollowUp,
    isLoading,
    error,
    clearError,
  };
};
