export function EmptyState({ message = 'No data found', action, inCard = true }) {
  const content = (
    <div className="empty-state">
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );

  return inCard ? <div className="card">{content}</div> : content;
}

export function LoadingState({ message = 'Loading...', inCard = true }) {
  const content = (
    <div className="loading-state">
      <p className="loading-state-message">{message}</p>
    </div>
  );

  return inCard ? <div className="card">{content}</div> : content;
}

export function ErrorState({ message }) {
  if (!message) return null;
  return (
    <div className="error-state">
      {message}
    </div>
  );
}

