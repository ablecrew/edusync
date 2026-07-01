import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered' | 'subtle';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none',
    glass: 'glass-panel shadow-lg',
    bordered: 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800',
    subtle: 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80',
  };

  const hoverStyles = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/50 hover:border-[#08428C]/30'
    : '';

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
