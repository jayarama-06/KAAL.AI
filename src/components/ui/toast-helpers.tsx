import { toast } from 'sonner@2.0.3';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

/**
 * Enhanced Toast Notification Helpers
 * Provides consistent, accessible toast notifications throughout the app
 * Includes proper ARIA labels and semantic icons
 */

export const toastHelpers = {
  /**
   * Success toast with checkmark icon
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
      icon: <CheckCircle2 className="w-5 h-5" aria-hidden="true" />,
      className: 'toast-success',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    });
  },

  /**
   * Error toast with X icon
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
      icon: <XCircle className="w-5 h-5" aria-hidden="true" />,
      className: 'toast-error',
      ariaProps: {
        role: 'alert',
        'aria-live': 'assertive'
      }
    });
  },

  /**
   * Warning toast with alert icon
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
      icon: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
      className: 'toast-warning',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    });
  },

  /**
   * Info toast with info icon
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
      icon: <Info className="w-5 h-5" aria-hidden="true" />,
      className: 'toast-info',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    });
  },

  /**
   * Loading toast with spinner
   */
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
      icon: <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />,
      className: 'toast-loading',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite',
        'aria-busy': 'true'
      }
    });
  },

  /**
   * Promise toast - automatically handles loading/success/error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: 4000
    });
  },

  /**
   * Custom action toast with button
   */
  action: (
    message: string,
    actionLabel: string,
    onAction: () => void,
    description?: string
  ) => {
    toast(message, {
      description,
      duration: 8000,
      action: {
        label: actionLabel,
        onClick: onAction
      },
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    });
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  }
};

/**
 * Specific app toasts for common actions
 */

export const appToasts = {
  // Task actions
  taskCreated: () => toastHelpers.success('Task created', 'Your task has been added successfully'),
  taskUpdated: () => toastHelpers.success('Task updated', 'Your changes have been saved'),
  taskDeleted: () => toastHelpers.success('Task deleted', 'The task has been removed'),
  taskCompleted: () => toastHelpers.success('Task completed', 'Great job! Keep up the momentum'),

  // Session actions
  sessionStarted: () => toastHelpers.success('Focus session started', 'Stay focused and crush your goals'),
  sessionCompleted: (duration: number) => 
    toastHelpers.success('Session completed', `You focused for ${duration} minutes. Excellent work!`),
  sessionPaused: () => toastHelpers.info('Session paused', 'Take a quick break'),

  // Auth actions
  signInSuccess: (name?: string) => 
    toastHelpers.success(`Welcome back${name ? `, ${name}` : ''}!`, 'Ready to be productive?'),
  signOutSuccess: () => toastHelpers.info('Signed out', 'See you next time!'),
  
  // Profile actions
  profileUpdated: () => toastHelpers.success('Profile updated', 'Your changes have been saved'),
  
  // Settings actions
  settingsSaved: () => toastHelpers.success('Settings saved', 'Your preferences have been updated'),

  // Error states
  networkError: () => 
    toastHelpers.error('Connection error', 'Please check your internet connection'),
  genericError: () => 
    toastHelpers.error('Something went wrong', 'Please try again later'),
  permissionError: () => 
    toastHelpers.error('Permission denied', 'You don\'t have permission to perform this action'),

  // Sync states
  syncSuccess: () => toastHelpers.success('Synced', 'Your data is up to date'),
  syncInProgress: () => toastHelpers.loading('Syncing...', 'Please wait'),
};
