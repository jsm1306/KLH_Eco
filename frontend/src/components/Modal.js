import React from 'react';
import '../index.css';

const Modal = ({ title, children, onClose, footer, closeOnBackdrop = true }) => {
  const handleBackdrop = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose && onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="modal-card">
        {title && <div className="modal-header"><h3>{title}</h3><button className="modal-close" onClick={onClose}>✕</button></div>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
