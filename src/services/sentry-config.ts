/**
 * Sentry Configuration
 * Error tracking and performance monitoring for KAAL
 */

import * as Sentry from "@sentry/react";
import { projectId } from '../utils/supabase/info';

export function initSentry() {
  Sentry.init({
    dsn: "https://e2a93fb1c240764f6a3bcdb8affa970a@o4510941913284608.ingest.us.sentry.io/4510941915971584",
    
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    
    // Tracing
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.supabase\.co\//, // Supabase backend
      new RegExp(`^https://${projectId}\\.supabase\\.co/`), // Specific project
    ],
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% sample rate in production
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur
    
    // Enable logs to be sent to Sentry
    enableLogs: true,
    
    // Environment detection
    environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    
    // Release tracking (optional - update with your version)
    release: 'kaal@1.0.0',
    
    // Ignore common errors that aren't actionable
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Random plugins/extensions
      'ChunkLoadError',
    ],
    
    // Custom tags for better filtering
    initialScope: {
      tags: {
        app: 'kaal',
        feature: 'productivity-assistant',
      },
    },
  });
}

// Error boundary integration helper
export const SentryErrorBoundary = Sentry.ErrorBoundary;
