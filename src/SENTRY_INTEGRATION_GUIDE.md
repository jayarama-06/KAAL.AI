# Sentry Integration Guide for KAAL

## ✅ Installation Complete

Sentry has been integrated into KAAL for error tracking and performance monitoring!

## 📦 What Was Installed

### 1. **Sentry Configuration** (`/services/sentry-config.ts`)
- DSN configured for your Sentry project
- Browser tracing integration for performance monitoring
- Session replay for debugging user sessions
- Custom error filtering and tagging

### 2. **Main Entry Point** (`/main.tsx`)
- Sentry initializes before React app starts
- Ensures all errors are captured from the very beginning

### 3. **Error Boundary** (`/App.tsx`)
- Enhanced existing ErrorBoundary with Sentry integration
- Automatically sends errors to Sentry
- Includes React component stack traces

### 4. **Test Component** (`/components/SentryErrorTestButton.tsx`)
- Helper component for testing Sentry integration
- Only visible in development (localhost)

---

## 🚀 Next Steps

### 1. Install the Sentry Package

Run this in your terminal:

```bash
npm install --save @sentry/react
```

### 2. Test the Integration

Add the test button to any screen (e.g., SettingsScreen):

```tsx
import { SentryErrorTestButton } from './SentryErrorTestButton';

// Inside your component's return:
<SentryErrorTestButton />
```

Then click the buttons to:
- **Test Sentry Error** - Throws an error to test error tracking
- **Test Sentry Log** - Sends a log message to test logging

### 3. Check Your Sentry Dashboard

1. Go to: https://sentry.io
2. Select your KAAL project
3. You should see the test errors/logs appear within seconds

### 4. Remove Test Button from Production

The test button automatically hides in production, but you can remove the import once testing is complete.

---

## 🎯 What Gets Tracked

### Automatic Tracking:
- ✅ Unhandled JavaScript errors
- ✅ React component crashes
- ✅ Network errors (failed API calls)
- ✅ Performance metrics (page loads, navigation)
- ✅ User sessions (with replay on errors)

### Filtered Out:
- ❌ Browser extension errors
- ❌ Random plugin errors
- ❌ Common network noise

---

## 🔧 Configuration Options

### Adjust Sample Rates

Edit `/services/sentry-config.ts`:

```typescript
// Development - capture everything
tracesSampleRate: 1.0,        // 100% performance traces
replaysSessionSampleRate: 1.0, // 100% session replays

// Production - reduce cost
tracesSampleRate: 0.1,         // 10% performance traces
replaysSessionSampleRate: 0.1, // 10% session replays
replaysOnErrorSampleRate: 1.0, // Always capture errors
```

### Update Release Version

```typescript
release: 'kaal@1.0.0', // Update this for each deployment
```

---

## 📊 Monitoring Strategy

### Key Metrics to Watch:
1. **Error Rate** - Track crash frequency
2. **Session Replays** - Watch user sessions before crashes
3. **Performance** - Monitor slow page loads
4. **User Impact** - See how many users are affected

### Set Up Alerts:
1. Go to Sentry → Alerts
2. Create alerts for:
   - Error rate spikes
   - New error types
   - Performance degradation

---

## 🐛 Manual Error Tracking

You can manually track errors anywhere in your code:

```typescript
import * as Sentry from '@sentry/react';

// Capture an exception
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'task-creation' },
    extra: { taskData: task },
  });
}

// Log a message
Sentry.captureMessage('User completed onboarding', 'info');

// Track custom metrics
Sentry.metrics.count('task_completed', 1);

// Add context
Sentry.setUser({ id: userId, email: userEmail });
Sentry.setTag('feature', 'energy-hub');
```

---

## 🔒 Privacy & PII

### Current Setting:
- `sendDefaultPii: true` - Sends IP addresses for better debugging

### To Disable PII:
```typescript
sendDefaultPii: false, // No personal data
```

### Scrub Sensitive Data:
```typescript
beforeSend(event) {
  // Remove sensitive fields
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
  }
  return event;
}
```

---

## 📱 Integration with KAAL Features

### Supabase Errors
Already configured! Sentry tracks:
- Database query failures
- Auth errors
- Real-time subscription issues

### AI Features
Add tracking to:
- KAAL Agent parsing failures
- TinyML prediction errors
- Nudge generation issues

Example:
```typescript
// In kaal-agent.ts
try {
  const result = await parseInput(text);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'kaal-agent' },
    extra: { inputText: text },
  });
  throw error;
}
```

---

## 🎨 Source Maps (Optional)

To see readable stack traces in Sentry, upload source maps:

1. Install Sentry CLI:
```bash
npm install --save-dev @sentry/vite-plugin
```

2. Update `vite.config.ts`:
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default {
  plugins: [
    sentryVitePlugin({
      org: "your-org",
      project: "kaal",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
};
```

---

## 📞 Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- KAAL Team: Check `/CONTRIBUTING.md` for team contacts

---

## ✨ Summary

**Sentry is now tracking:**
- 🐛 All JavaScript errors
- ⚛️ React component crashes  
- 📊 Performance metrics
- 🎥 Session replays on errors
- 🔍 User impact and trends

**Next:** Run `npm install @sentry/react` and test with the error button! 🚀
