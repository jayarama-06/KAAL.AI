/**
 * Microsoft Clarity Integration Service
 * User behavior analytics and session replay for KAAL
 * 
 * Clarity is already loaded via the script in index.html.
 * This service provides TypeScript-safe methods for custom tracking.
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

declare global {
  interface Window {
    clarity?: {
      (command: 'start', projectId: string): void;
      (command: 'identify', userId: string, sessionId?: string, pageId?: string, friendlyName?: string): void;
      (command: 'set', key: string, value: string | number | boolean): void;
      (command: 'upgrade', reason: string): void;
      (command: 'consent'): void;
      (command: 'event', eventName: string): void;
      q?: any[];
    };
  }
}

// ─── Configuration ────────────────────────────────────────────────────────────

const CLARITY_PROJECT_ID = 'vmha9lsejv';

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Check if Clarity is loaded and available
 */
export function isClarityAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.clarity === 'function';
}

/**
 * Identify the current user for session tracking
 * Call this after user logs in to link sessions to user accounts
 * 
 * @param userId - Unique user ID (e.g., Supabase user ID)
 * @param customData - Optional additional user data
 */
export function identifyUser(userId: string, customData?: {
  email?: string;
  name?: string;
  plan?: string;
  [key: string]: any;
}) {
  if (!isClarityAvailable()) return;

  try {
    // Identify user in Clarity
    window.clarity!('identify', userId, undefined, undefined, customData?.name || userId);

    // Set custom session variables
    if (customData) {
      Object.entries(customData).forEach(([key, value]) => {
        if (value !== undefined) {
          setCustomTag(key, String(value));
        }
      });
    }

    console.log('[Clarity] User identified:', userId);
  } catch (error) {
    console.error('[Clarity] Failed to identify user:', error);
  }
}

/**
 * Set a custom tag/variable for the current session
 * Useful for filtering sessions in Clarity dashboard
 * 
 * @param key - Tag name (e.g., "subscription_plan", "user_role")
 * @param value - Tag value
 */
export function setCustomTag(key: string, value: string | number | boolean) {
  if (!isClarityAvailable()) return;

  try {
    window.clarity!('set', key, value);
  } catch (error) {
    console.error('[Clarity] Failed to set custom tag:', error);
  }
}

/**
 * Track a custom event in Clarity
 * Use this to mark important user actions
 * 
 * @param eventName - Name of the event (e.g., "task_created", "focus_session_started")
 */
export function trackEvent(eventName: string) {
  if (!isClarityAvailable()) return;

  try {
    window.clarity!('event', eventName);
    console.log('[Clarity] Event tracked:', eventName);
  } catch (error) {
    console.error('[Clarity] Failed to track event:', error);
  }
}

/**
 * Upgrade the current session to be recorded 100% (bypasses sampling)
 * Use this when you detect important behavior or errors
 * 
 * @param reason - Why this session should be upgraded (for internal tracking)
 */
export function upgradeSession(reason: string) {
  if (!isClarityAvailable()) return;

  try {
    window.clarity!('upgrade', reason);
    console.log('[Clarity] Session upgraded:', reason);
  } catch (error) {
    console.error('[Clarity] Failed to upgrade session:', error);
  }
}

/**
 * Mark that the user has given consent for tracking
 * Call this after user accepts cookie/privacy policy
 */
export function grantConsent() {
  if (!isClarityAvailable()) return;

  try {
    window.clarity!('consent');
    console.log('[Clarity] Consent granted');
  } catch (error) {
    console.error('[Clarity] Failed to grant consent:', error);
  }
}

// ─── Feature-Specific Tracking Helpers ────────────────────────────────────────

/**
 * Track KAAL-specific user actions
 */
export const ClarityTracking = {
  // Task Management
  taskCreated: () => trackEvent('task_created'),
  taskCompleted: () => trackEvent('task_completed'),
  taskDeleted: () => trackEvent('task_deleted'),
  
  // Focus Sessions
  focusSessionStarted: () => trackEvent('focus_session_started'),
  focusSessionCompleted: () => trackEvent('focus_session_completed'),
  focusSessionAbandoned: () => trackEvent('focus_session_abandoned'),
  
  // KAAL Agent
  brainDumpProcessed: () => trackEvent('brain_dump_processed'),
  kaalAgentUsed: () => trackEvent('kaal_agent_used'),
  
  // Energy Tracking
  energyCheckIn: () => trackEvent('energy_check_in'),
  energyMLPrediction: () => trackEvent('energy_ml_prediction'),
  
  // Calendar Integration
  calendarConnected: () => trackEvent('calendar_connected'),
  eventCreated: () => trackEvent('calendar_event_created'),
  
  // User Behavior
  onboardingCompleted: () => trackEvent('onboarding_completed'),
  settingsChanged: () => trackEvent('settings_changed'),
  premiumUpgrade: () => trackEvent('premium_upgrade'),
  
  // Errors & Issues
  errorEncountered: (errorType: string) => {
    trackEvent(`error_${errorType}`);
    upgradeSession(`error_${errorType}`); // Upgrade session to capture full context
  },
  
  // Engagement
  weeklyGoalSet: () => trackEvent('weekly_goal_set'),
  achievementUnlocked: () => trackEvent('achievement_unlocked'),
};

// ─── Session Context ──────────────────────────────────────────────────────────

/**
 * Set contextual information about the current session
 * Call this when important state changes
 */
export function setSessionContext(context: {
  screen?: string;
  feature?: string;
  userRole?: string;
  subscriptionPlan?: string;
  hasCalendarConnected?: boolean;
  taskCount?: number;
  energyLevel?: string;
}) {
  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined) {
      setCustomTag(key, String(value));
    }
  });
}

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Initialize Clarity tracking with KAAL-specific setup
 * Call this early in your app lifecycle
 */
export function initClarity() {
  if (!isClarityAvailable()) {
    console.warn('[Clarity] Not available - script may not have loaded yet');
    return;
  }

  console.log('[Clarity] Initialized with project ID:', CLARITY_PROJECT_ID);

  // Set default session tags
  setCustomTag('app_name', 'KAAL');
  setCustomTag('app_version', '1.0.0');
  setCustomTag('environment', window.location.hostname === 'localhost' ? 'development' : 'production');
}

// ─── Automatic Initialization ─────────────────────────────────────────────────

// Auto-initialize when the script loads
if (typeof window !== 'undefined') {
  // Wait for Clarity to be available
  const checkInterval = setInterval(() => {
    if (isClarityAvailable()) {
      initClarity();
      clearInterval(checkInterval);
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => clearInterval(checkInterval), 10000);
}
