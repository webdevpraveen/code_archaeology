/**
 * Card Component
 * 
 * Reusable card container for displaying content in a styled box
 */

interface CardProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

/**
 * Reusable card component
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  onClick,
  isSelected = false,
  hoverable = true,
  variant = 'default',
}) => {
  return (
    <div
      className={`card card-${variant} ${hoverable ? 'hoverable' : ''} ${
        isSelected ? 'selected' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* TODO: Card header with title */}
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}

      {/* TODO: Card content */}
      <div className="card-content">
        {children}
      </div>

      {/* TODO: Card footer if needed */}
      {/* <div className="card-footer"></div> */}
    </div>
  );
};

export default Card;
