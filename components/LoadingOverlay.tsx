'use client';

interface LoadingOverlayProps {
  label?: string;
}

export const LoadingOverlay = ({ label = 'Thinking…' }: LoadingOverlayProps) => (
  <div className="loading-overlay" role="status" aria-live="polite">
    <div className="spinner" />
    <p>{label}</p>
  </div>
);
