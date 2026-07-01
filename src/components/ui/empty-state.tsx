import React, { isValidElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './button';

export type EmptyStateIcon =
  | LucideIcon
  | React.ComponentType<{ className?: string }>
  | React.ReactNode;

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
 *  - a Lucide/React forwardRef component (object with $$typeof + render)
 *  - a regular function/class component
 *  - a pre-built JSX element / string / number
 */
function renderIcon(icon: EmptyStateIcon | undefined): React.ReactNode {
  if (icon == null || icon === false) return null;

  // 1) Already a rendered React element (e.g. <Icon />, <span>...</span>)
  if (isValidElement(icon)) return icon;

  // 2) Function component (regular)
  if (typeof icon === 'function') {
    const Icon = icon as React.ComponentType<{ className?: string }>;
    return <Icon className="w-8 h-8" />;
  }

  // 3) forwardRef / memo component — objects with a $$typeof marker (Lucide icons!)
  if (
    typeof icon === 'object' &&
    icon !== null &&
    '$$typeof' in (icon as any)
  ) {
    const Icon = icon as unknown as React.ComponentType<{ className?: string }>;
    return <Icon className="w-8 h-8" />;
  }

  // 4) Fallback — a string, number, fragment, array of nodes
  return icon as React.ReactNode;
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