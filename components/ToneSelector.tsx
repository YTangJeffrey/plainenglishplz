'use client';

import { TONE_OPTIONS, type AudienceTone } from '@/types';

interface ToneSelectorProps {
  value: AudienceTone;
  onChange: (tone: AudienceTone) => void;
  disabled?: boolean;
  customGuideName?: string;
  customGuideDescription?: string;
  onCustomGuideChange?: (name: string, description: string) => void;
}

export const ToneSelector = ({
  value,
  onChange,
  disabled = false,
  customGuideName = '',
  customGuideDescription = '',
  onCustomGuideChange,
}: ToneSelectorProps) => (
  <div className="tone-selector" role="radiogroup" aria-label="Choose audience tone">
    {TONE_OPTIONS.map((option) => (
      <div key={option.id} className={`tone-chip${option.id === value ? ' tone-chip-active' : ''}`}>
        <button
          type="button"
          role="radio"
          aria-checked={option.id === value}
          className="tone-chip-header"
          onClick={() => onChange(option.id)}
          disabled={disabled}
        >
          <span className="tone-label">{option.label}</span>
          <span className="tone-helper">{option.helper}</span>
        </button>
        {option.id === 'custom' && value === 'custom' && (
          <div className="tone-custom-fields">
            <label className="tone-field">
              <span>Name</span>
              <input
                type="text"
                value={customGuideName}
                onChange={(e) => onCustomGuideChange?.(e.target.value, customGuideDescription)}
                disabled={disabled}
              />
            </label>
            <label className="tone-field">
              <span>Description</span>
              <textarea
                value={customGuideDescription}
                onChange={(e) => onCustomGuideChange?.(customGuideName, e.target.value)}
                disabled={disabled}
                rows={3}
              />
            </label>
          </div>
        )}
      </div>
    ))}
  </div>
);
