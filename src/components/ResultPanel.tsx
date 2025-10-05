import type { AudienceTone, LabelResult } from '../types';

interface ResultPanelProps {
  result: LabelResult;
  tone: AudienceTone;
  onRetake: () => void;
  onUseSuggestion: (question: string) => void;
}

export const ResultPanel = ({ result, tone, onRetake, onUseSuggestion }: ResultPanelProps) => (
  <section className="panel">
    <header className="panel-header">
      <div>
        <p className="eyebrow">Explaining for</p>
        <h2 className="panel-title">{toneLabel(tone)}</h2>
      </div>
      <button type="button" className="ghost-button" onClick={onRetake}>
        Retake photo
      </button>
    </header>

    <div className="panel-body">
      <div className="panel-card">
        <p className="eyebrow">Label text (model transcription)</p>
        <pre className="label-text">{result.labelText || 'No text detected.'}</pre>
      </div>

      <div className="panel-card">
        <p className="eyebrow">Plain-English explanation</p>
        <p className="explanation-text">{result.explanation}</p>
      </div>

      {result.followupSuggestions.length > 0 && (
        <div className="panel-card">
          <p className="eyebrow">Try asking</p>
          <div className="suggestion-list">
            {result.followupSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-chip"
                onClick={() => onUseSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);

const toneLabel = (tone: AudienceTone) => {
  switch (tone) {
    case 'kids':
      return 'Kids';
    case 'curious':
      return 'Curious Explorer';
    case 'expert':
      return 'Scholar';
    default:
      return 'General Visitor';
  }
};
