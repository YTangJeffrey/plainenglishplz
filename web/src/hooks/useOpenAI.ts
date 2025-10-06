import { useCallback, useMemo, useState } from 'react';
import type { AudienceTone, LabelResult } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

interface GenerateExplanationArgs {
  imageBase64: string;
  tone: AudienceTone;
}

interface GenerateExplanationResult {
  sessionId: string;
  result: LabelResult;
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

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    const value = import.meta.env.VITE_API_BASE_URL?.trim();
    if (!value) {
      return DEFAULT_API_BASE_URL;
    }
    return value.replace(/\/$/, '');
  }, []);

  const generateExplanation = useCallback(
    async ({ imageBase64, tone }: GenerateExplanationArgs): Promise<GenerateExplanationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/api/analyze`, {
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
    [baseUrl],
  );

  const sendFollowUp = useCallback(
    async ({ sessionId, question }: FollowUpArgs): Promise<FollowUpResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/api/follow-up`, {
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
    [baseUrl],
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
