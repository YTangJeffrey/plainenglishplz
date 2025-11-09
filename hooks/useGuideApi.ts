'use client';

import { useCallback, useState } from 'react';
import type { AudienceTone, LabelResult } from '@/types';

interface GenerateExplanationArgs {
  imageBase64: string;
  tone: AudienceTone;
}

interface GenerateExplanationResult {
  sessionId: string;
  result: LabelResult;
  imageUrl?: string | null;
}

interface FollowUpArgs {
  sessionId: string;
  question: string;
}

interface FollowUpResult {
  answer: string;
  followupSuggestions: string[];
}

const parseError = async (response: Response) => {
  try {
    const payload = await response.json();
    if (payload?.error) {
      if (typeof payload.error === 'string') {
        return payload.error;
      }

      if (payload.error?.message) {
        return payload.error.message;
      }
    }
  } catch (error) {
    console.error('Failed to parse error response', error);
  }

  return response.statusText || 'Request failed';
};

export const useGuideApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateExplanation = useCallback(
    async ({ imageBase64, tone }: GenerateExplanationArgs): Promise<GenerateExplanationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/guide/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, tone }),
        });

        if (!response.ok) {
          const message = await parseError(response);
          throw new Error(message);
        }

        const payload = (await response.json()) as GenerateExplanationResult;

        if (!payload.sessionId || !payload.result) {
          throw new Error('Unexpected response from guide API.');
        }

        return payload;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error contacting the guide.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sendFollowUp = useCallback(
    async ({ sessionId, question }: FollowUpArgs): Promise<FollowUpResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/guide/follow-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, question }),
        });

        if (!response.ok) {
          const message = await parseError(response);
          throw new Error(message);
        }

        const payload = (await response.json()) as FollowUpResult;
        return {
          answer: payload.answer?.trim() ?? '',
          followupSuggestions: (payload.followupSuggestions ?? []).filter(Boolean),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error contacting the guide.';
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
