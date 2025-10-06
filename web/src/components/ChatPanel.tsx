import { FormEvent, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onAsk: (question: string) => Promise<void> | void;
  disabled?: boolean;
}

export const ChatPanel = ({ messages, onAsk, disabled = false }: ChatPanelProps) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onAsk(trimmed);
      setQuestion('');
    } catch (error) {
      console.error('Failed to send follow-up question', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel chat-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Ask a follow-up</p>
          <h2 className="panel-title">Continue the tour</h2>
        </div>
      </header>

      <div className="chat-history">
        {messages.length === 0 ? (
          <p className="chat-empty">Ask anything you are curious about. The guide remembers this artwork.</p>
        ) : (
          <ul className="chat-list">
            {messages.map((message) => (
              <li key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
                <span className="chat-role">{message.role === 'assistant' ? 'Guide' : 'You'}</span>
                <p className="chat-text">{message.content}</p>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="What would you like to know?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled || isSubmitting}
        />
        <button
          type="submit"
          className="primary-button"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  );
};
