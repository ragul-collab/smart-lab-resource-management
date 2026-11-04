export default function Modal({ isOpen, onClose, title, footer, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="btn-text"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
