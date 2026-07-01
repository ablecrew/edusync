import React, { useEffect, useId, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label rendered above the field. */
  label?: string;
  /** Helper text shown below the field (muted). */
  hint?: string;
  /** Error message shown below the field (overrides `hint`, adds red styling). */
  error?: string;
  /** Marks the field with a red asterisk next to the label. */
  required?: boolean;
  /** Show a "used / max" character counter (uses `maxLength` if provided). */
  showCount?: boolean;
  /** Auto-grow the textarea to fit its content (no manual resize needed). */
  autoResize?: boolean;
  /** Control resize handle behaviour. Defaults to `vertical`. */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Wrapper element className (the label + textarea + hint block). */
  wrapperClassName?: string;
}

/**
 * A polished textarea matching the Input component's look & feel.
 *
 * ```tsx
 * <Textarea label="Eligibility Notes" placeholder="Family background…" />
 * <Textarea label="Bio" maxLength={280} showCount autoResize />
 * <Textarea label="Reason" error="Required" required />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      required,
      showCount,
      autoResize = false,
      resize = 'vertical',
      wrapperClassName,
      className,
      id,
      rows = 4,
      maxLength,
      value,
      defaultValue,
      onChange,
      disabled,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || `ta-${generatedId}`;
    const hintId = `${textareaId}-hint`;

    // Merge external ref with our internal ref (needed for auto-resize)
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    // Auto-grow effect
    const resizeToFit = () => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
      if (autoResize) resizeToFit();
      // re-run when the value prop changes externally
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      if (autoResize) resizeToFit();
    };

    const currentLength =
      typeof value === 'string'
        ? value.length
        : typeof defaultValue === 'string'
        ? defaultValue.length
        : internalRef.current?.value.length ?? 0;

    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        {label && (
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={textareaId}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
            >
              {label}
              {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            {showCount && maxLength && (
              <span
                className={cn(
                  'text-[11px] font-mono tabular-nums',
                  currentLength >= maxLength
                    ? 'text-rose-500 font-semibold'
                    : currentLength >= maxLength * 0.9
                    ? 'text-amber-500'
                    : 'text-slate-400'
                )}
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          id={textareaId}
          ref={setRefs}
          rows={autoResize ? undefined : rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? hintId : undefined}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-xl transition-colors min-h-[80px]',
            'bg-white dark:bg-slate-900',
            'border text-slate-900 dark:text-white placeholder:text-slate-400',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-700 focus:ring-[#08428C]/30 focus:border-[#08428C]',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50',
            autoResize && 'overflow-hidden',
            resizeClass,
            className
          )}
          {...rest}
        />

        {/* footer row: hint/error on left, count (if no label) on right */}
        {(hint || error || (showCount && maxLength && !label)) && (
          <div className="flex items-start justify-between gap-3">
            <p
              id={hintId}
              className={cn(
                'text-[11px] leading-tight',
                error ? 'text-rose-500 font-medium' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {error || hint}
            </p>
            {showCount && maxLength && !label && (
              <span
                className={cn(
                  'text-[11px] font-mono tabular-nums shrink-0',
                  currentLength >= maxLength
                    ? 'text-rose-500 font-semibold'
                    : 'text-slate-400'
                )}
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';