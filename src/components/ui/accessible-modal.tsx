import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { AccessibleButton } from './accessible-button';
import { trapFocus, handleEscapeKey } from '../../utils/accessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

/**
 * Accessible Modal Component
 * - Traps focus within modal
 * - Closes on Escape key
 * - Proper ARIA labels
 * - Prevents body scroll
 * - Announces to screen readers
 */
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    if (!isOpen) return;

    // Store current active element to restore focus later
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Trap focus
    const cleanupFocus = modalRef.current ? trapFocus(modalRef.current) : () => {};

    // Handle escape key
    const cleanupEscape = handleEscapeKey(onClose);

    // Announce modal opening to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `${title} dialog opened`;
    document.body.appendChild(announcement);

    return () => {
      // Restore body scroll
      document.body.style.overflow = '';

      // Cleanup focus trap
      cleanupFocus();

      // Cleanup escape handler
      cleanupEscape();

      // Restore focus to previous element
      previousActiveElement.current?.focus();

      // Remove announcement
      document.body.removeChild(announcement);
    };
  }, [isOpen, onClose, title]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
      onClick={handleOverlayClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        style={{
          animation: 'fadeIn 200ms ease-out'
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={`relative bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden ${className}`}
        style={{
          fontFamily: 'Inter, sans-serif',
          animation: 'modalSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex-1">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-[#111827]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-sm text-[#6B7280]"
              >
                {description}
              </p>
            )}
          </div>
          
          {showCloseButton && (
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
              className="ml-4"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </AccessibleButton>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-5">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Modal Footer Component
 * For consistent button layouts in modals
 */
interface ModalFooterProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

export function ModalFooter({ 
  children, 
  align = 'right',
  className = '' 
}: ModalFooterProps) {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div 
      className={`flex items-center gap-3 pt-5 mt-5 border-t border-gray-100 ${alignments[align]} ${className}`}
      role="group"
      aria-label="Dialog actions"
    >
      {children}
    </div>
  );
}
