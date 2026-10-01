/**
 * Input Component
 * 
 * Reusable text input field component
 */

interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Reusable input field component
 */
export const Input: React.FC<InputProps> = ({
  value = '',
  onChange,
  onFocus,
  onBlur,
  placeholder = '',
  disabled = false,
  readOnly = false,
  type = 'text',
  label,
  error,
  icon,
  className = '',
}) => {
  return (
    <div className={`input-wrapper ${error ? 'error' : ''} ${className}`}>
      {/* TODO: Label */}
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}

      {/* TODO: Input container with icon */}
      <div className="input-container">
        {/* Icon if provided */}
        {icon && <span className="input-icon">{icon}</span>}

        {/* Input field */}
        <input
          type={type}
          className="input-field"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
        />

        {/* TODO: Clear button for search inputs */}
        {type === 'search' && value && (
          <button
            className="input-clear"
            onClick={() => onChange?.('')}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* TODO: Error message */}
      {error && (
        <div className="input-error">
          {error}
        </div>
      )}

      {/* TODO: Helper text */}
      {/* <div className="input-hint">Helper text</div> */}
    </div>
  );
};

export default Input;
