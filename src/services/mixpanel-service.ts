/**
 * Mixpanel Analytics Service for KAAL
 * 
 * Provides type-safe event tracking with autocapture and session recording.
 * 
 * Features:
 * - Autocapture: Automatically tracks clicks, page views, and form submissions
 * - Session Recording: Records 100% of sessions for replay
 * - User Identification: Links events to specific users
 * - Custom Events: Track KAAL-specific interactions
 * 
 * Setup:
 * - Project Token: 67f26b4aa269831d610b60a4683172ff
 * - Autocapture: Enabled
 * - Session Recording: 100% of sessions
 */

// TypeScript declarations for Mixpanel
declare global {
  interface Window {
    mixpanel?: {
      init: (token: string, config?: any) => void;
      track: (eventName: string, properties?: Record<string, any>) => void;
      identify: (userId: string) => void;
      people: {
        set: (properties: Record<string, any>) => void;
        set_once: (properties: Record<string, any>) => void;
        increment: (property: string, value?: number) => void;
        append: (property: string, value: any) => void;
        union: (property: string, values: any[]) => void;
      };
      register: (properties: Record<string, any>) => void;
      register_once: (properties: Record<string, any>) => void;
      reset: () => void;
      get_distinct_id: () => string;
      alias: (alias: string, original?: string) => void;
      track_links: (selector: string, eventName: string, properties?: Record<string, any>) => void;
      track_forms: (selector: string, eventName: string, properties?: Record<string, any>) => void;
      time_event: (eventName: string) => void;
      opt_in_tracking: () => void;
      opt_out_tracking: () => void;
      has_opted_in_tracking: () => boolean;
      has_opted_out_tracking: () => boolean;
    };
  }
}

class MixpanelService {
  private isInitialized: boolean = false;
  private isProduction: boolean = false;
  private initCheckAttempts: number = 0;
  private maxInitCheckAttempts: number = 10; // Try for 10 seconds max

  constructor() {
    // Auto-detect environment
    this.isProduction = window.location.hostname !== 'localhost' && 
                        !window.location.hostname.includes('127.0.0.1');
    
    // Check immediately
    this.checkInitialization();
    
    // Also check on window load as fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        if (!this.isInitialized) {
          this.checkInitialization();
        }
      });
    }
  }

  /**
   * Check if Mixpanel is loaded and initialized
   */
  private checkInitialization() {
    if (typeof window !== 'undefined' && window.mixpanel) {
      this.isInitialized = true;
      if (!this.isProduction) {
        console.log('✅ Mixpanel Analytics initialized');
      }
      return; // Exit early if initialized
    }
    
    this.initCheckAttempts++;
    
    // Only retry up to max attempts and don't spam console
    if (this.initCheckAttempts < this.maxInitCheckAttempts) {
      // Retry after a short delay (silently)
      setTimeout(() => this.checkInitialization(), 1000);
    } else if (!this.isProduction && this.initCheckAttempts === this.maxInitCheckAttempts) {
      // Only warn once after all attempts failed
      console.warn('⚠️ Mixpanel failed to load after 10 attempts. Analytics will be disabled.');
    }
  }

  /**
   * Check if Mixpanel is available
   */
  private isMixpanelAvailable(): boolean {
    // Lazy check - in case it loads after initial checks
    if (!this.isInitialized && typeof window !== 'undefined' && window.mixpanel) {
      this.isInitialized = true;
      if (!this.isProduction) {
        console.log('✅ Mixpanel Analytics initialized (lazy load)');
      }
    }
    return this.isInitialized && typeof window !== 'undefined' && !!window.mixpanel;
  }

  /**
   * Log events (dev mode helper)
   */
  private log(eventName: string, properties?: Record<string, any>) {
    if (!this.isProduction) {
      console.log(`[Mixpanel] ${eventName}`, properties);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER IDENTIFICATION & PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Identify user and set user properties
   */
  identifyUser(userId: string, properties?: {
    email?: string;
    name?: string;
    signupDate?: string;
    plan?: string;
    [key: string]: any;
  }) {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.identify(userId);
      
      if (properties) {
        // Set properties that can change
        window.mixpanel!.people.set(properties);
      }

      this.log('User Identified', { userId, ...properties });
    } catch (error) {
      console.error('Mixpanel identify error:', error);
    }
  }

  /**
   * Set user properties (once - won't override existing)
   */
  setUserPropertiesOnce(properties: Record<string, any>) {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.people.set_once(properties);
      this.log('User Properties Set (once)', properties);
    } catch (error) {
      console.error('Mixpanel set_once error:', error);
    }
  }

  /**
   * Increment a user property (e.g., tasks_completed)
   */
  incrementUserProperty(property: string, value: number = 1) {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.people.increment(property, value);
      this.log('User Property Incremented', { property, value });
    } catch (error) {
      console.error('Mixpanel increment error:', error);
    }
  }

  /**
   * Reset user (sign out)
   */
  resetUser() {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.reset();
      this.log('User Reset (Sign Out)');
    } catch (error) {
      console.error('Mixpanel reset error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOM EVENT TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.track(eventName, properties);
      this.log(eventName, properties);
    } catch (error) {
      console.error('Mixpanel track error:', error);
    }
  }

  /**
   * Start timing an event (call track() later to complete)
   */
  timeEvent(eventName: string) {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.time_event(eventName);
      this.log('Event Timer Started', { eventName });
    } catch (error) {
      console.error('Mixpanel time_event error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KAAL-SPECIFIC EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Authentication ────────────────────────────────────────────────────────

  trackSignUp(method: 'email' | 'google' | 'github') {
    this.track('Sign Up', {
      method,
      timestamp: new Date().toISOString(),
    });
  }

  trackSignIn(method: 'email' | 'google' | 'github') {
    this.track('Sign In', {
      method,
      timestamp: new Date().toISOString(),
    });
  }

  trackSignOut() {
    this.track('Sign Out', {
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  trackTaskCreated(taskData: {
    priority?: string;
    estimatedMinutes?: number;
    hasDeadline: boolean;
  }) {
    this.track('Task Created', {
      ...taskData,
      timestamp: new Date().toISOString(),
    });
    this.incrementUserProperty('tasks_created');
  }

  trackTaskCompleted(taskData: {
    priority?: string;
    timeSpent?: number;
    wasOnTime: boolean;
  }) {
    this.track('Task Completed', {
      ...taskData,
      timestamp: new Date().toISOString(),
    });
    this.incrementUserProperty('tasks_completed');
  }

  trackTaskDeleted(reason?: string) {
    this.track('Task Deleted', {
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Focus Sessions ────────────────────────────────────────────────────────

  trackFocusSessionStarted(duration: number) {
    this.track('Focus Session Started', {
      plannedDuration: duration,
      timestamp: new Date().toISOString(),
    });
    this.timeEvent('Focus Session Completed'); // Start timer
  }

  trackFocusSessionCompleted(data: {
    plannedDuration: number;
    actualDuration: number;
    wasCompleted: boolean;
    distractions?: number;
  }) {
    this.track('Focus Session Completed', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.incrementUserProperty('focus_sessions_completed');
  }

  // ─── Energy Check-ins ──────────────────────────────────────────────────────

  trackEnergyCheckIn(data: {
    energyLevel: number;
    mood?: string;
    mentalClarity?: number;
    location?: string;
  }) {
    this.track('Energy Check-In', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.incrementUserProperty('energy_checkins');
  }

  // ─── Brain Dump ────────────────────────────────────────────────────────────

  trackBrainDumpProcessed(data: {
    itemCount: number;
    tasksCreated: number;
    worriesDetected: number;
    ideasDetected: number;
    blockersDetected: number;
  }) {
    this.track('Brain Dump Processed', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.incrementUserProperty('brain_dumps_processed');
  }

  // ─── AI Features ───────────────────────────────────────────────────────────

  trackAIRecommendationViewed(type: 'task' | 'energy' | 'schedule') {
    this.track('AI Recommendation Viewed', {
      type,
      timestamp: new Date().toISOString(),
    });
  }

  trackAIRecommendationAccepted(type: 'task' | 'energy' | 'schedule') {
    this.track('AI Recommendation Accepted', {
      type,
      timestamp: new Date().toISOString(),
    });
    this.incrementUserProperty('ai_recommendations_accepted');
  }

  // ─── Calendar Integration ──────────────────────────────────────────────────

  trackCalendarConnected(provider: 'google' | 'outlook' | 'apple') {
    this.track('Calendar Connected', {
      provider,
      timestamp: new Date().toISOString(),
    });
  }

  trackEventCreated(data: {
    eventType: 'meeting' | 'focus' | 'break';
    duration: number;
  }) {
    this.track('Calendar Event Created', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Integrations ──────────────────────────────────────────────────────────

  trackIntegrationConnected(integration: string) {
    this.track('Integration Connected', {
      integration,
      timestamp: new Date().toISOString(),
    });
  }

  trackIntegrationDisconnected(integration: string) {
    this.track('Integration Disconnected', {
      integration,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  trackPageView(pageName: string, path: string) {
    this.track('Page View', {
      pageName,
      path,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  trackSettingChanged(setting: string, value: any) {
    this.track('Setting Changed', {
      setting,
      value,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Errors ────────────────────────────────────────────────────────────────

  trackError(error: {
    message: string;
    stack?: string;
    componentStack?: string;
    page?: string;
  }) {
    this.track('Error Occurred', {
      ...error,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Achievements & Milestones ─────────────────────────────────────────────

  trackMilestone(milestone: {
    name: string;
    value: number;
    category: 'tasks' | 'focus' | 'energy' | 'streak';
  }) {
    this.track('Milestone Achieved', {
      ...milestone,
      timestamp: new Date().toISOString(),
    });
  }

  trackStreakMaintained(days: number) {
    this.track('Streak Maintained', {
      days,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── User Behavior ─────────────────────────────────────────────────────────

  trackFeatureUsed(featureName: string, metadata?: Record<string, any>) {
    this.track('Feature Used', {
      feature: featureName,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  trackSearchPerformed(query: string, resultsCount: number) {
    this.track('Search Performed', {
      query,
      resultsCount,
      timestamp: new Date().toISOString(),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVACY & COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════

  optInTracking() {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.opt_in_tracking();
      this.log('User Opted In to Tracking');
    } catch (error) {
      console.error('Mixpanel opt_in error:', error);
    }
  }

  optOutTracking() {
    if (!this.isMixpanelAvailable()) return;

    try {
      window.mixpanel!.opt_out_tracking();
      this.log('User Opted Out of Tracking');
    } catch (error) {
      console.error('Mixpanel opt_out error:', error);
    }
  }

  hasOptedInTracking(): boolean {
    if (!this.isMixpanelAvailable()) return false;

    try {
      return window.mixpanel!.has_opted_in_tracking();
    } catch (error) {
      console.error('Mixpanel has_opted_in error:', error);
      return false;
    }
  }

  hasOptedOutTracking(): boolean {
    if (!this.isMixpanelAvailable()) return false;

    try {
      return window.mixpanel!.has_opted_out_tracking();
    } catch (error) {
      console.error('Mixpanel has_opted_out error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mixpanel = new MixpanelService();

// Export for type-safe usage
export default mixpanel;