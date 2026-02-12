import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  borderRadius = '0.375rem'
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${className}`}
      style={style}
    />
  );
};

export default Skeleton;