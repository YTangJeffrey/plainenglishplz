'use client';

import type { LabelResult } from '@/types';

interface ResultPanelProps {
  result: LabelResult;
  showTranscript: boolean;
  onToggleTranscript: (show: boolean) => void;
}

export const ResultPanel = ({ result, showTranscript, onToggleTranscript }: ResultPanelProps) => {
  const heading = 'Art label in plain English';

  return (
    <section className="outline-card result-panel">
      <div className="result-header">
        <h2 className="result-title">{heading}</h2>
        <p className="result-date">{formatDate(new Date())}</p>
      </div>
      <p className="explanation-text">{result.explanation}</p>

      <button
        type="button"
        className="link-button left-align"
        onClick={() => onToggleTranscript(!showTranscript)}
      >
        {showTranscript ? 'Hide original script' : 'Show original script'}
      </button>

      {showTranscript && (
        <pre className="label-text">{result.labelText || 'No text detected.'}</pre>
      )}
    </section>
  );
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
