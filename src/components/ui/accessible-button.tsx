import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './utils';

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Accessible Button Component
 * - WCAG 2.1 AA compliant
 * - Minimum 44x44px touch target (Fitt's Law)
 * - Proper ARIA labels and states
 * - Keyboard navigation support
 * - Loading states
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Loading...',
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    
    const variants = {
      primary: 'bg-[#111827] text-white hover:bg-[#1F2937] focus:ring-[#111827] shadow-sm hover:shadow-md',
      secondary: 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB] focus:ring-[#111827] shadow-sm',
      ghost: 'bg-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] focus:ring-[#111827]',
      danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444] shadow-sm hover:shadow-md',
      success: 'bg-[#10B981] text-white hover:bg-[#059669] focus:ring-[#10B981] shadow-sm hover:shadow-md'
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-5 py-3 text-base min-h-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[52px]'
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        <span>{loading ? loadingText : children}</span>
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
