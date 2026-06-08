import React from 'react';
import '../../assets/styles/ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = "Confirm Delete", message = "Are you sure you want to delete this item?", confirmText = "Delete", isDanger = true }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-modal-title">{title}</h2>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className={`confirm-modal-btn confirm ${isDanger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
