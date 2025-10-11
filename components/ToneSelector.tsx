'use client';

import { TONE_OPTIONS, type AudienceTone } from '@/types';

interface ToneSelectorProps {
  value: AudienceTone;
  onChange: (tone: AudienceTone) => void;
  disabled?: boolean;
}

export const ToneSelector = ({ value, onChange, disabled = false }: ToneSelectorProps) => (
  <div className="tone-selector" role="radiogroup" aria-label="Choose audience tone">
    {TONE_OPTIONS.map((option) => (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={option.id === value}
        className={`tone-chip${option.id === value ? ' tone-chip-active' : ''}`}
        onClick={() => onChange(option.id)}
        disabled={disabled}
      >
        <span className="tone-label">{option.label}</span>
        <span className="tone-helper">{option.helper}</span>
      </button>
    ))}
  </div>
);
