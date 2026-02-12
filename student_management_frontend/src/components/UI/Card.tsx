import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bordered?: boolean;
  shadow?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  bordered = true,
  shadow = true,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const borderClass = bordered ? 'border border-gray-200' : '';
  const shadowClass = shadow ? 'shadow-sm' : '';
  
  const classes = [
    'bg-white rounded-lg',
    borderClass,
    shadowClass,
    paddingClasses[padding],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {header && <div className="mb-4">{header}</div>}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div>}
    </div>
  );
};

export default Card;