import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ size = 'md', text }) => {
  const sizeClass = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3.5">
      <div className={`animate-spin rounded-full border-slate-200 border-t-[#08428C] dark:border-slate-800 dark:border-t-blue-500 ${sizeClass[size]}`} />
      {text && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{text}</p>}
    </div>
  );
};
