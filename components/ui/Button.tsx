/**
 * Button Component
 * 
 * Reusable button component with multiple variants and states
 */

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Reusable button component with variants
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  className = '',
  icon,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${
        loading ? 'loading' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* TODO: Loading spinner if loading */}
      {loading && <span className="btn-spinner">⟳</span>}

      {/* TODO: Icon if provided */}
      {icon && <span className="btn-icon">{icon}</span>}

      {/* TODO: Button text */}
      {children && <span className="btn-text">{children}</span>}
    </button>
  );
};

export default Button;
