interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps) => (
  <div className="error-banner" role="alert">
    <span>{message}</span>
    {onDismiss && (
      <button type="button" className="ghost-button" onClick={onDismiss}>
        Dismiss
      </button>
    )}
  </div>
);
