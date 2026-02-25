/**
 * Google Analytics (GA4) Service
 * Provides TypeScript-safe methods for tracking events in Google Analytics
 * 
 * Measurement ID: G-Q23JVQV845
 */

// Type definitions for Google Analytics gtag function
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Check if Google Analytics is loaded and available
 */
export function isGALoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Send a custom event to Google Analytics
 * @param eventName - Name of the event (e.g., 'task_completed', 'focus_started')
 * @param eventParams - Optional parameters for the event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (!isGALoaded()) {
    console.warn('[GA] gtag not loaded, event not sent:', eventName);
    return;
  }

  try {
    window.gtag('event', eventName, eventParams);
    console.log('[GA] Event tracked:', eventName, eventParams);
  } catch (error) {
    console.error('[GA] Error tracking event:', error);
  }
}

/**
 * Track a page view manually (usually handled automatically by GA)
 * @param pagePath - The path of the page (e.g., '/dashboard')
 * @param pageTitle - Optional title of the page
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isGALoaded()) return;

  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
    console.log('[GA] Page view tracked:', pagePath);
  } catch (error) {
    console.error('[GA] Error tracking page view:', error);
  }
}

/**
 * Set user ID for tracking across sessions
 * @param userId - Unique user identifier
 */
export function setUserId(userId: string): void {
  if (!isGALoaded()) return;

  try {
    window.gtag('config', 'G-Q23JVQV845', {
      user_id: userId,
    });
    console.log('[GA] User ID set:', userId);
  } catch (error) {
    console.error('[GA] Error setting user ID:', error);
  }
}

/**
 * Set user properties (e.g., subscription tier, preferences)
 * @param properties - Object with user properties
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (!isGALoaded()) return;

  try {
    window.gtag('set', 'user_properties', properties);
    console.log('[GA] User properties set:', properties);
  } catch (error) {
    console.error('[GA] Error setting user properties:', error);
  }
}

/**
 * Track timing metrics (e.g., page load time, API response time)
 * @param category - Category of timing (e.g., 'JS Dependencies', 'API Call')
 * @param variable - Variable being measured (e.g., 'load', 'response')
 * @param value - Time in milliseconds
 * @param label - Optional label for more context
 */
export function trackTiming(
  category: string,
  variable: string,
  value: number,
  label?: string
): void {
  if (!isGALoaded()) return;

  try {
    window.gtag('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
      event_label: label,
    });
    console.log('[GA] Timing tracked:', { category, variable, value, label });
  } catch (error) {
    console.error('[GA] Error tracking timing:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ⚡ Pre-defined Event Tracking Methods (KAAL-specific)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track task creation
 */
export function trackTaskCreated(taskId: string, properties?: Record<string, any>): void {
  trackEvent('task_created', {
    task_id: taskId,
    ...properties,
  });
}

/**
 * Track task completion
 */
export function trackTaskCompleted(taskId: string, completionTime?: number): void {
  trackEvent('task_completed', {
    task_id: taskId,
    completion_time: completionTime,
  });
}

/**
 * Track task deletion
 */
export function trackTaskDeleted(taskId: string): void {
  trackEvent('task_deleted', {
    task_id: taskId,
  });
}

/**
 * Track focus session start
 */
export function trackFocusSessionStarted(duration?: number, taskCount?: number): void {
  trackEvent('focus_session_started', {
    planned_duration: duration,
    task_count: taskCount,
  });
}

/**
 * Track focus session completion
 */
export function trackFocusSessionCompleted(
  actualDuration: number,
  tasksCompleted: number,
  interrupted?: boolean
): void {
  trackEvent('focus_session_completed', {
    actual_duration: actualDuration,
    tasks_completed: tasksCompleted,
    was_interrupted: interrupted,
  });
}

/**
 * Track brain dump / KAAL Agent usage
 */
export function trackBrainDumpProcessed(itemCount: number, categories: string[]): void {
  trackEvent('brain_dump_processed', {
    item_count: itemCount,
    categories: categories.join(','),
  });
}

/**
 * Track energy check-in
 */
export function trackEnergyCheckIn(energyLevel: number, mood?: string): void {
  trackEvent('energy_check_in', {
    energy_level: energyLevel,
    mood: mood,
  });
}

/**
 * Track calendar integration connection
 */
export function trackCalendarConnected(provider: string): void {
  trackEvent('calendar_connected', {
    provider: provider,
  });
}

/**
 * Track AI recommendation interaction
 */
export function trackAIRecommendation(
  recommendationType: string,
  accepted: boolean
): void {
  trackEvent('ai_recommendation', {
    type: recommendationType,
    accepted: accepted,
  });
}

/**
 * Track settings changes
 */
export function trackSettingsChanged(settingName: string, newValue: any): void {
  trackEvent('settings_changed', {
    setting_name: settingName,
    new_value: String(newValue),
  });
}

/**
 * Track error occurrences (non-fatal)
 */
export function trackError(errorType: string, errorMessage?: string): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    fatal: false,
  });
}

/**
 * Track search queries
 */
export function trackSearch(query: string, resultsCount?: number): void {
  trackEvent('search', {
    search_term: query,
    results_count: resultsCount,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(featureName: string, context?: string): void {
  trackEvent('feature_used', {
    feature_name: featureName,
    context: context,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Convenience Export
// ═══════════════════════════════════════════════════════════════════════════

export const GoogleAnalytics = {
  // Core methods
  trackEvent,
  trackPageView,
  setUserId,
  setUserProperties,
  trackTiming,
  
  // KAAL-specific events
  tasks: {
    created: trackTaskCreated,
    completed: trackTaskCompleted,
    deleted: trackTaskDeleted,
  },
  
  focus: {
    started: trackFocusSessionStarted,
    completed: trackFocusSessionCompleted,
  },
  
  agent: {
    brainDumpProcessed: trackBrainDumpProcessed,
  },
  
  energy: {
    checkIn: trackEnergyCheckIn,
  },
  
  integrations: {
    calendarConnected: trackCalendarConnected,
  },
  
  ai: {
    recommendation: trackAIRecommendation,
  },
  
  settings: {
    changed: trackSettingsChanged,
  },
  
  errors: {
    track: trackError,
  },
  
  search: trackSearch,
  feature: trackFeatureUsed,
};

export default GoogleAnalytics;
