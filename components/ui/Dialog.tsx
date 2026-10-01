/**
 * Dialog Component
 * 
 * Modal dialog box for important interactions
 */

interface DialogProps {
  isOpen: boolean;
  title?: string;
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

/**
 * Modal dialog component
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* TODO: Backdrop overlay */}
      <div className="dialog-backdrop" onClick={onClose} />

      {/* TODO: Dialog container */}
      <div className="dialog-container">
        <div className={`dialog ${isDangerous ? 'dangerous' : ''}`}>
          {/* TODO: Dialog header */}
          <div className="dialog-header">
            {title && (
              <h2 className="dialog-title">{title}</h2>
            )}
            {/* Close button */}
            <button
              className="dialog-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* TODO: Dialog content */}
          <div className="dialog-content">
            {children}
          </div>

          {/* TODO: Dialog footer with actions */}
          <div className="dialog-footer">
            <button
              className="dialog-btn cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                className={`dialog-btn confirm-btn ${
                  isDangerous ? 'dangerous' : ''
                }`}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? '⟳' : confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dialog;
