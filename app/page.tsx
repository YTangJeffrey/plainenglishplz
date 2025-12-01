'use client';

import Image from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CameraCapture, type CameraCaptureHandle } from '@/components/CameraCapture';
import { ChatPanel } from '@/components/ChatPanel';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ResultPanel } from '@/components/ResultPanel';
import { ToneSelector } from '@/components/ToneSelector';
import { SessionProvider, useSession } from '@/components/SessionProvider';
import { useGuideApi } from '@/hooks/useGuideApi';
import { createId } from '@/lib/id';
import type { AudienceTone, ChatMessage, CustomGuide } from '@/types';

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
    showTranscript,
    setShowTranscript,
    customGuide,
    setCustomGuide,
  } = useSession();

  const {
    generateExplanation,
    sendFollowUp,
    isAnalyzing,
    isFollowingUp,
    error: apiError,
    clearError,
  } = useGuideApi();
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const uploadCameraRef = useRef<CameraCaptureHandle | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const combinedError = sessionError ?? apiError ?? null;
  const toneLabelText = useMemo(() => toneLabel(tone, customGuide?.name), [tone, customGuide?.name]);
  const todayDisplay = useMemo(() => formatDate(new Date()), []);
  const avatarSrc = useMemo(() => avatarForTone(tone), [tone]);

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      if (tone === 'custom' && (!customGuide?.name?.trim() || !customGuide?.description?.trim())) {
        setError('Please enter a custom guide name and description.');
        setStatus('idle');
        setIsCameraModalOpen(false);
        return;
      }

      setCapturedImage(dataUrl);
      setStatus('processing');
      setError(null);
      setIsCameraModalOpen(false);

      try {
        const { sessionId: newSessionId, result } = await generateExplanation({
          imageBase64: dataUrl,
          tone,
          customGuide: tone === 'custom' ? customGuide : null,
        });
        setSessionId(newSessionId);
        setLabelResult(result);

        setMessages([]);
        setStatus('ready');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to analyze the label.';
        setError(message);
        setStatus('error');
        setSessionId(null);
      }
    },
    [customGuide, generateExplanation, setCapturedImage, setError, setLabelResult, setMessages, setSessionId, setStatus, tone],
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
        const response = await sendFollowUp({
          sessionId,
          question,
          customGuide: tone === 'custom' ? customGuide : null,
        });

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
    [appendMessage, customGuide, labelResult, sendFollowUp, sessionId, setError, setLabelResult, tone],
  );

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      if (!labelResult || status === 'processing' || isAnalyzing || isFollowingUp) {
        return;
      }

      await handleFollowUp(suggestion);
    },
    [handleFollowUp, isAnalyzing, isFollowingUp, labelResult, status],
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
    setIsCameraModalOpen(false);
  }, [clearError, resetSession, setSessionId]);

  const isProcessing = status === 'processing' || isAnalyzing;

  return (
    <div className="app-shell narrow">
      <header className="hero-header">
        <Image src={avatarSrc} alt="Guide avatar" width={120} height={120} className="hero-avatar" />
        <div className="hero-tone">
          <span className="tone-name">{toneLabelText}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setIsToneModalOpen(true)}
            disabled={isProcessing}
            aria-label="Change guide"
          >
            <img src="/assets/icon_edit.svg" alt="" aria-hidden="true" />
          </button>
        </div>
      </header>

      {combinedError && <ErrorBanner message={combinedError} onDismiss={handleDismissError} />}

      <main className="app-main">
        <section className="intro-card outline-card">
          <div className="intro-container">
            <h1 className="intro-title">Plain English Please</h1>
            <p className="intro-date">{todayDisplay}</p>
            <p className="intro-copy">Snap a label, get a museum guide who speaks your language.</p>
          </div>

          <div className="capture-box">
            {!isProcessing ? (
              <div className="inline-buttons stretch">
                <button
                  className="outline-button"
                  onClick={() => {
                    setStatus('idle');
                    setIsCameraModalOpen(true);
                  }}
                  type="button"
                >
                  Scan Label
                </button>
                <button
                  className="outline-button"
                  onClick={() => uploadCameraRef.current?.triggerUpload()}
                  type="button"
                >
                  Upload Art Label
                </button>
              </div>
            ) : (
              <div className="capture-loading">
                <div className="spinner small" />
                <span>Processing label…</span>
              </div>
            )}
          </div>

          <div className="visually-hidden">
            <CameraCapture
              ref={uploadCameraRef}
              onCapture={handleCapture}
              disabled={isProcessing}
              onError={setError}
              showControls={false}
              useExternalTriggers
            />
          </div>
        </section>

        {labelResult && (
          <div className="post-capture">
            <ResultPanel
              result={labelResult}
              showTranscript={showTranscript}
              onToggleTranscript={setShowTranscript}
            />
            <ChatPanel
              messages={messages}
              onAsk={handleFollowUp}
              suggestions={labelResult.followupSuggestions}
              onUseSuggestion={handleSuggestion}
              disabled={isProcessing}
            />
          </div>
        )}
      </main>

      {isToneModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h2 className="modal-title">Choose Your Guide</h2>
              <button
                type="button"
                className="link-button"
                onClick={() => setIsToneModalOpen(false)}
                aria-label="Close tone selector"
              >
                Close
              </button>
            </header>
            <ToneSelector
              value={tone}
              onChange={(nextTone) => {
                setTone(nextTone);
                if (nextTone !== 'custom') {
                  setCustomGuide(null);
                  setIsToneModalOpen(false);
                } else if (!customGuide) {
                  setCustomGuide({ name: '', description: '' });
                }
              }}
              disabled={isProcessing}
              customGuideName={customGuide?.name ?? ''}
              customGuideDescription={customGuide?.description ?? ''}
              onCustomGuideChange={(name, description) => setCustomGuide({ name, description })}
            />
          </div>
        </div>
      )}

      {isCameraModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal medium">
            <header className="modal-header">
              <h2 className="modal-title">Scan Label</h2>
              <button
                type="button"
                className="link-button"
                onClick={() => setIsCameraModalOpen(false)}
                aria-label="Close camera"
              >
                Close
              </button>
            </header>
            <CameraCapture
              onCapture={handleCapture}
              disabled={isProcessing}
              onError={setError}
              autoStart
              useExternalTriggers
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Page = () => (
  <SessionProvider>
    <AppContent />
  </SessionProvider>
);

export default Page;

const toneLabel = (tone: AudienceTone, customName?: string) => {
  switch (tone) {
    case 'kids':
      return 'Kids';
    case 'curious':
      return 'Curious Explorer';
    case 'expert':
      return 'Scholar';
    case 'custom':
      return customName?.trim() || 'Custom Guide';
    default:
      return 'General Visitor';
  }
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const avatarForTone = (tone: AudienceTone) => {
  switch (tone) {
    case 'kids':
      return '/assets/kid.svg';
    case 'curious':
      return '/assets/custom.svg';
    case 'expert':
      return '/assets/scholar.svg';
    case 'custom':
      return '/assets/custom.svg';
    default:
      return '/assets/custom.svg';
  }
};
