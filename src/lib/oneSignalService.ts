// ═══════════════════════════════════════════════════════════════════════════
// OneSignal Web Push Service
// Integrates OneSignal for production push notifications
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

/**
 * Initialize OneSignal
 * Call this once on app mount
 */
export async function initializeOneSignal(): Promise<void> {
  if (!ONESIGNAL_APP_ID) {
    console.warn('OneSignal App ID not configured');
    return;
  }

  if (typeof window === 'undefined' || !window.OneSignalDeferred) {
    console.warn('OneSignal SDK not loaded');
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });
  });
}

/**
 * Request notification permission and register with OneSignal
 * Returns the OneSignal player ID (subscription ID)
 */
export async function requestNotificationPermission(
  userId: string
): Promise<string | null> {
  if (!window.OneSignalDeferred) {
    console.error('OneSignal not initialized');
    return null;
  }

  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      // Check if already subscribed
      const isPushSupported = await OneSignal.Notifications.isPushSupported();
      if (!isPushSupported) {
        console.warn('Push notifications not supported');
        resolve(null);
        return;
      }

      // Request permission
      const permission = await OneSignal.Notifications.requestPermission();
      if (!permission) {
        console.log('Notification permission denied');
        resolve(null);
        return;
      }

      // Get the subscription ID (player ID)
      const subscriptionId = await OneSignal.User.PushSubscription.id;

      if (subscriptionId) {
        // Save to profile
        await saveOneSignalPlayerId(userId, subscriptionId);
        resolve(subscriptionId);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Save OneSignal player ID to user profile
 */
async function saveOneSignalPlayerId(
  userId: string,
  playerId: string
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ onesignal_player_id: playerId })
    .eq('id', userId);
}

/**
 * Get user's OneSignal player ID from profile
 */
export async function getOneSignalPlayerId(
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('onesignal_player_id')
    .eq('id', userId)
    .single();

  return data?.onesignal_player_id || null;
}

/**
 * Check if user has granted notification permission
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!window.OneSignalDeferred) return false;

  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      const permission = await OneSignal.Notifications.permission;
      resolve(permission === true);
    });
  });
}

/**
 * Send a push notification via Supabase Edge Function
 * This calls the OneSignal API server-side
 */
export async function sendPushNotification(
  userId: string,
  message: string,
  toneTier: 'low' | 'medium' | 'high'
): Promise<boolean> {
  // Check rate limit (max 1 push per 3 hours)
  const canSend = await checkRateLimit(userId);
  if (!canSend) {
    console.log('Rate limit exceeded, skipping push notification');
    return false;
  }

  const playerId = await getOneSignalPlayerId(userId);
  if (!playerId) {
    console.log('User not subscribed to push notifications');
    return false;
  }

  try {
    // Call Supabase Edge Function to send push
    const { data, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          player_id: playerId,
          title: 'KAAL',
          message: message,
          url: window.location.origin,
        },
      }
    );

    if (error) {
      console.error('Error sending push notification:', error);
      return false;
    }

    // Log the nudge event
    await logNudgeEvent(userId, message, toneTier);

    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Check rate limit for push notifications
 * Max 1 push per 3 hours per user
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('nudge_events')
    .select('id')
    .eq('user_id', userId)
    .gte('sent_at', threeHoursAgo.toISOString())
    .limit(1);

  if (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow on error
  }

  return !data || data.length === 0;
}

/**
 * Log nudge event to database
 */
async function logNudgeEvent(
  userId: string,
  message: string,
  toneTier: 'low' | 'medium' | 'high'
): Promise<void> {
  await supabase.from('nudge_events').insert({
    user_id: userId,
    nudge_text: message,
    tone_tier: toneTier,
    sent_at: new Date().toISOString(),
    nudge_type: 'push',
  });
}

/**
 * Check if user dismissed the permission prompt recently
 * Don't ask again for 7 days if dismissed
 */
export function shouldShowPermissionPrompt(): boolean {
  const lastDismissed = localStorage.getItem('kaal_permission_dismissed');
  if (!lastDismissed) return true;

  const dismissedTime = parseInt(lastDismissed, 10);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return dismissedTime < sevenDaysAgo;
}

/**
 * Mark permission prompt as dismissed
 */
export function dismissPermissionPrompt(): void {
  localStorage.setItem('kaal_permission_dismissed', String(Date.now()));
}

// Type declarations for OneSignal
declare global {
  interface Window {
    OneSignalDeferred: Array<(OneSignal: any) => void>;
  }
}