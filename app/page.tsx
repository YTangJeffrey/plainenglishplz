'use client';

import { useCallback } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { ChatPanel } from '@/components/ChatPanel';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ResultPanel } from '@/components/ResultPanel';
import { ToneSelector } from '@/components/ToneSelector';
import { SessionProvider, useSession } from '@/components/SessionProvider';
import { useGuideApi } from '@/hooks/useGuideApi';
import { createId } from '@/lib/id';
import type { ChatMessage } from '@/types';

const AppContent = () => {
  const {
    tone,
    setTone,
    status,
    setStatus,
    labelResult,
    setLabelResult,
    resetSession,
    messages,
    setMessages,
    appendMessage,
    setCapturedImage,
    setError,
    sessionId,
    setSessionId,
    error: sessionError,
  } = useSession();

  const { generateExplanation, sendFollowUp, isLoading, error: apiError, clearError } = useGuideApi();

  const combinedError = sessionError ?? apiError ?? null;

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      setCapturedImage(dataUrl);
      setStatus('processing');
      setError(null);

      try {
        const { sessionId: newSessionId, result } = await generateExplanation({ imageBase64: dataUrl, tone });
        setSessionId(newSessionId);
        setLabelResult(result);

        const initialAssistantMessage: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: result.explanation,
          createdAt: Date.now(),
        };

        setMessages([initialAssistantMessage]);
        setStatus('ready');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to analyze the label.';
        setError(message);
        setStatus('error');
        setSessionId(null);
      }
    },
    [generateExplanation, setCapturedImage, setError, setLabelResult, setMessages, setSessionId, setStatus, tone],
  );

  const handleFollowUp = useCallback(
    async (question: string) => {
      if (!labelResult || !sessionId) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: question,
        createdAt: Date.now(),
      };

      appendMessage(userMessage);

      try {
        const response = await sendFollowUp({ sessionId, question });

        const assistantMessage: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: response.answer,
          createdAt: Date.now(),
        };

        appendMessage(assistantMessage);
        setLabelResult({ ...labelResult, followupSuggestions: response.followupSuggestions ?? [] });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to reach the guide right now.';
        setError(message);
      }
    },
    [appendMessage, labelResult, sendFollowUp, sessionId, setError, setLabelResult],
  );

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      if (!labelResult || status === 'processing' || isLoading) {
        return;
      }

      await handleFollowUp(suggestion);
    },
    [handleFollowUp, isLoading, labelResult, status],
  );

  const handleDismissError = useCallback(() => {
    setError(null);
    clearError();
    if (status === 'error') {
      setStatus('idle');
    }
  }, [clearError, setError, setStatus, status]);

  const resetFlow = useCallback(() => {
    resetSession();
    clearError();
    setSessionId(null);
  }, [clearError, resetSession, setSessionId]);

  const isProcessing = status === 'processing' || isLoading;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Plain English, Please</h1>
          <p className="subtitle">Snap a label, get a museum guide who speaks your language.</p>
        </div>
        <ToneSelector value={tone} onChange={setTone} disabled={isProcessing} />
      </header>

      {combinedError && <ErrorBanner message={combinedError} onDismiss={handleDismissError} />}

      <main className="app-main">
        {!labelResult && (
          <div className="capture-section">
            <CameraCapture onCapture={handleCapture} disabled={isProcessing} onError={setError} />
            <p className="helper-text">
              Hold your phone close enough to read the text or upload a photo from your camera roll. We will analyze the
              image on-device and send it to the museum guide for a quick summary.
            </p>
            {status === 'error' && (
              <button type="button" className="ghost-button" onClick={resetFlow}>
                Try again
              </button>
            )}
          </div>
        )}

        {labelResult && (
          <div className="result-layout">
            <ResultPanel result={labelResult} tone={tone} onRetake={resetFlow} onUseSuggestion={handleSuggestion} />
            <ChatPanel messages={messages} onAsk={handleFollowUp} disabled={isProcessing} />
          </div>
        )}
      </main>

      {isProcessing && <LoadingOverlay label="Asking the museum guide…" />}
    </div>
  );
};

const Page = () => (
  <SessionProvider>
    <AppContent />
  </SessionProvider>
);

export default Page;
