import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from './utils';

interface BaseInputProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseInputProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Accessible Input Component
 * - Proper label association
 * - Error/success states
 * - ARIA labels and descriptions
 * - Focus states
 * - Help text support
 */
export const AccessibleInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      required,
      leftIcon,
      rightIcon,
      className,
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const successId = `${inputId}-success`;

    const hasError = !!error;
    const hasSuccess = !!success && !error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#111827] mb-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            required={required}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={
              [
                hint ? hintId : '',
                error ? errorId : '',
                success ? successId : ''
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            className={cn(
              'w-full px-4 py-3 rounded-xl border transition-all duration-200',
              'font-sans text-base text-[#111827] placeholder-[#9CA3AF]',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              leftIcon && 'pl-10',
              (rightIcon || hasError || hasSuccess) && 'pr-10',
              hasError && 'border-red-300 focus:border-red-500 focus:ring-red-200',
              hasSuccess && 'border-green-300 focus:border-green-500 focus:ring-green-200',
              !hasError && !hasSuccess && 'border-gray-200 focus:border-[#111827] focus:ring-gray-100',
              className
            )}
            style={{ fontFamily: 'Inter, sans-serif' }}
            {...props}
          />

          {(rightIcon || hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {hasError && <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />}
              {hasSuccess && <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />}
              {!hasError && !hasSuccess && rightIcon}
            </div>
          )}
        </div>

        {hint && !error && !success && (
          <p
            id={hintId}
            className="mt-2 text-sm text-[#6B7280]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
            role="alert"
            aria-live="polite"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {success && !error && (
          <p
            id={successId}
            className="mt-2 text-sm text-green-600 flex items-center gap-1"
            role="status"
            aria-live="polite"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

/**
 * Accessible TextArea Component
 */
export const AccessibleTextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      success,
      hint,
      required,
      className,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const successId = `${inputId}-success`;

    const hasError = !!error;
    const hasSuccess = !!success && !error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#111827] mb-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={
            [
              hint ? hintId : '',
              error ? errorId : '',
              success ? successId : ''
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={cn(
            'w-full px-4 py-3 rounded-xl border transition-all duration-200',
            'font-sans text-base text-[#111827] placeholder-[#9CA3AF]',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
            'resize-y',
            hasError && 'border-red-300 focus:border-red-500 focus:ring-red-200',
            hasSuccess && 'border-green-300 focus:border-green-500 focus:ring-green-200',
            !hasError && !hasSuccess && 'border-gray-200 focus:border-[#111827] focus:ring-gray-100',
            className
          )}
          style={{ fontFamily: 'Inter, sans-serif' }}
          {...props}
        />

        {hint && !error && !success && (
          <p
            id={hintId}
            className="mt-2 text-sm text-[#6B7280]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
            role="alert"
            aria-live="polite"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {success && !error && (
          <p
            id={successId}
            className="mt-2 text-sm text-green-600 flex items-center gap-1"
            role="status"
            aria-live="polite"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

AccessibleTextArea.displayName = 'AccessibleTextArea';
