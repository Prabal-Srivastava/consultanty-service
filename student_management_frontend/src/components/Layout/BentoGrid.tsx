import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
    >
      {children}
    </div>
  );
};

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

const BentoGridItem: React.FC<BentoGridItemProps> = ({ 
  children, 
  className = '', 
  colSpan = 1, 
  rowSpan = 1 
}) => {
  const gridColumn = colSpan > 1 ? `col-span-${colSpan}` : 'col-span-1';
  const gridRow = rowSpan > 1 ? `row-span-${rowSpan}` : 'row-span-1';
  
  return (
    <div 
      className={`${gridColumn} ${gridRow} rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
};

export { BentoGrid, BentoGridItem };