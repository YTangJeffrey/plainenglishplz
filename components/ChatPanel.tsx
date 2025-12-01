'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onAsk: (question: string) => Promise<void> | void;
  disabled?: boolean;
  suggestions?: string[];
  onUseSuggestion?: (question: string) => void;
}

// ChatPanel component for displaying chat history and input form, if awaits assistant response, show placeholder
export const ChatPanel = ({ messages, onAsk, disabled = false, suggestions = [], onUseSuggestion }: ChatPanelProps) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAwaitingAssistant, setIsAwaitingAssistant] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLength = useRef(messages.length);
  const lastAssistantId = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (isAwaitingAssistant) {
      console.log('[ChatPanel] Placeholder shown: awaiting assistant response');
    } else {
      console.log('[ChatPanel] Placeholder hidden');
    }
  }, [isAwaitingAssistant]);

  useEffect(() => {
    const hasNewMessage = messages.length > prevMessagesLength.current;
    const lastAssistantMessage = (() => {
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i].role === 'assistant') {
          return messages[i];
        }
      }
      return null;
    })();

    if (hasNewMessage) {
      console.log('[ChatPanel] New message detected', {
        prevLength: prevMessagesLength.current,
        nextLength: messages.length,
        lastRole: messages[messages.length - 1]?.role,
      });
    }

    const assistantId = lastAssistantMessage?.id ?? null;
    const assistantChanged = assistantId && assistantId !== lastAssistantId.current;

    if (assistantChanged) {
      console.log('[ChatPanel] Assistant reply received', { assistantId });
      lastAssistantId.current = assistantId;
      if (isAwaitingAssistant) {
        console.log('[ChatPanel] Hiding placeholder after assistant reply');
        setIsAwaitingAssistant(false);
      }
    }

    prevMessagesLength.current = messages.length;
  }, [isAwaitingAssistant, messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      setIsRequestPending(true);
      setIsAwaitingAssistant(true);
      console.log('[ChatPanel] Sending follow-up from form', { question: trimmed });
      await onAsk(trimmed);
      setQuestion('');
    } catch (error) {
      console.error('Failed to send follow-up question', error);
      setIsAwaitingAssistant(false);
    } finally {
      setIsSubmitting(false);
      setIsRequestPending(false);
    }
  };

  // Render chat panel UI
  return (
    <section className="outline-card chat-panel">
      <header className="panel-header">
        <h2 className="panel-title">Ask a Follow-up</h2>
      </header>

      {suggestions.length > 0 && (
        <div className="suggestion-stack">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="pill-button"
                onClick={async () => {
                  if (disabled || isRequestPending) return;
                  try {
                    setIsRequestPending(true);
                    setIsAwaitingAssistant(true);
                    console.log('[ChatPanel] Sending follow-up from suggestion', { suggestion });
                    await onUseSuggestion?.(suggestion);
                  } catch (err) {
                    setIsAwaitingAssistant(false);
                  } finally {
                    setIsRequestPending(false);
                  }
                }}
                disabled={disabled || isRequestPending}
              >
                {suggestion}
              </button>
            ))}
        </div>
      )}

      <div className="chat-history">
          <ul className="chat-list">
            {messages.map((message) => (
              <li key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
                <p className="chat-text">{message.content}</p>
              </li>
            ))}
            {isAwaitingAssistant && (
              <li className="chat-bubble chat-bubble-assistant chat-bubble-placeholder">
                <p className="chat-text">Guide is writing…</p>
              </li>
            )}
          </ul>
        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="What would you like to ask?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled || isRequestPending}
        />
        <button
          type="submit"
          className="outline-button"
          disabled={disabled || isRequestPending}
        >
          {isSubmitting ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  );
};
