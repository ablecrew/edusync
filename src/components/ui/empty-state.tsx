import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './button';

/** Accepts a Lucide component OR any pre-rendered ReactNode (e.g. <Icon />, emoji, <img />). */
export type EmptyStateIcon = LucideIcon | React.ReactNode;

export interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Renders whatever the caller passed:
 *  - if it's a function/class component → render <Icon className="w-8 h-8" />
 *  - if it's already a ReactNode → render as-is
 *  - if nothing was passed → render nothing
 */
function renderIcon(icon: EmptyStateIcon | undefined): React.ReactNode {
  if (icon == null || icon === false) return null;
  // Function or class component (LucideIcon, custom SVG component, etc.)
  if (typeof icon === 'function') {
    const Icon = icon as React.ComponentType<{ className?: string }>;
    return <Icon className="w-8 h-8" />;
  }
  // Anything else React can render (JSX element, string, number, fragment...)
  return icon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  const iconNode = renderIcon(icon);

  return (
    <div
      className={
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 min-h-[300px] ' +
        (className ?? '')
      }
    >
      {iconNode && (
        <div className="p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-900/30 text-[#08428C] dark:text-blue-400 mb-4 shadow-xs flex items-center justify-center">
          {iconNode}
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};