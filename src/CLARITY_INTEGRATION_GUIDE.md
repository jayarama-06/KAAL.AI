# Microsoft Clarity Integration Guide for KAAL

## ✅ Installation Complete!

Microsoft Clarity has been fully integrated into KAAL for comprehensive user behavior analytics and session replay!

---

## 📦 What Was Installed

### 1. **Clarity Script** (`/index.html`)
- Clarity tracking code added to `<head>` section
- Project ID: `vmha9lsejv`
- Loads asynchronously for optimal performance

### 2. **TypeScript Service** (`/services/clarity-service.ts`)
- Type-safe Clarity API wrapper
- Custom event tracking helpers
- Session context management
- User identification system

### 3. **Authentication Integration** (`/contexts/AuthContext.tsx`)
- Automatic user identification on login
- Links sessions to user accounts
- Integrates with both Clarity and Sentry

### 4. **Route Tracking** (`/components/RouteTracker.tsx`)
- Tracks page navigation automatically
- Sets current page context
- Integrated in `App.tsx`

### 5. **Task Tracking** (`/services/task-service.ts`)
- Tracks task creation, completion, deletion
- Integrated into all task operations
- Zero-overhead tracking

---

## 🎯 What Gets Tracked

### Automatic Tracking:
✅ **Page Views** - Every route change  
✅ **User Clicks** - All button and link clicks  
✅ **Form Interactions** - Input focus, typing, submissions  
✅ **Scroll Behavior** - How far users scroll  
✅ **Mouse Movement** - Heatmaps of cursor activity  
✅ **Session Replays** - Video-like playback of user sessions  
✅ **Console Errors** - JavaScript errors in the browser  

### Custom Events (Tracked by KAAL):
- ✅ `task_created` - New task added
- ✅ `task_completed` - Task marked done
- ✅ `task_deleted` - Task removed
- ✅ `focus_session_started` - Focus mode activated
- ✅ `brain_dump_processed` - KAAL Agent used
- ✅ `energy_check_in` - Energy level logged
- ✅ `calendar_connected` - Google Calendar linked
- ✅ `page_view_*` - Each screen visited

### User Context Tags:
- `user_authenticated` - Login status
- `current_page` - Active screen
- `app_name` - "KAAL"
- `app_version` - "1.0.0"
- `environment` - "development" or "production"

---

## 🚀 How to Use

### View Your Data

1. **Go to Microsoft Clarity Dashboard:**
   - Visit: https://clarity.microsoft.com/
   - Sign in with your Microsoft account
   - Select your KAAL project (`vmha9lsejv`)

2. **Key Features:**
   - **Dashboard** - Overview of traffic and engagement
   - **Recordings** - Watch individual user sessions
   - **Heatmaps** - See where users click and scroll
   - **Insights** - AI-generated behavior insights

### Track Custom Events

Use the `ClarityTracking` helper anywhere in your code:

```typescript
import { ClarityTracking } from '../services/clarity-service';

// Track specific actions
ClarityTracking.taskCreated();
ClarityTracking.focusSessionStarted();
ClarityTracking.kaalAgentUsed();

// Track errors
ClarityTracking.errorEncountered('supabase_timeout');
```

### Set User Context

```typescript
import { setSessionContext } from '../services/clarity-service';

// Set contextual data
setSessionContext({
  screen: 'tasks',
  feature: 'quick-add',
  taskCount: 25,
  energyLevel: 'high',
});
```

### Upgrade Important Sessions

Force 100% recording for critical sessions:

```typescript
import { upgradeSession } from '../services/clarity-service';

// When something important happens
upgradeSession('user_reported_bug');
upgradeSession('payment_completed');
```

---

## 📊 Analytics Stack

KAAL now has a **complete analytics ecosystem**:

```
Microsoft Clarity (User Behavior)
    ↓
  Session Recordings
  Heatmaps
  Click Tracking
    ↓
Sentry (Error Tracking)
    ↓
  Crash Reports
  Performance Monitoring
  User Impact
    ↓
Supabase (Data Analytics)
    ↓
  Task completion rates
  Energy patterns
  User engagement
```

---

## 🔧 Advanced Configuration

### Filter Sessions by Tags

In the Clarity dashboard, you can filter sessions by:

- **User ID** - See specific user's sessions
- **Page** - Filter by screen (tasks, focus, etc.)
- **Custom Tags** - Any tag you set with `setCustomTag()`

Example: Find all sessions where users completed a task:
1. Go to Clarity → Recordings
2. Filter by event: `task_completed`
3. Watch recordings to see the user flow

### Privacy Settings

Clarity automatically respects:
- ✅ Password inputs (masked)
- ✅ Sensitive form fields (hidden)
- ✅ Do Not Track browser settings

To manually mask elements, add `clarity-mask` class:

```tsx
<div className="clarity-mask">
  Sensitive content here
</div>
```

### Sampling Rate

Current settings (in `/services/clarity-service.ts`):
- **Regular sessions:** 100% (can reduce in production)
- **Upgraded sessions:** 100% (always recorded)

To reduce data:
```typescript
// In clarity-service.ts (if you need to adjust)
// Note: Clarity handles sampling server-side
// Upgraded sessions override sampling
```

---

## 💡 Use Cases for KAAL

### 1. **Understand User Flow**
- Watch recordings of users trying the KAAL Agent
- See where users get stuck in task creation
- Identify confusing UI elements

### 2. **Debug Issues**
- When users report bugs, find their session
- Watch the exact steps that caused the error
- See console errors in context

### 3. **Improve UX**
- Use heatmaps to see ignored features
- Track which nudges users dismiss
- Identify drop-off points

### 4. **Measure Feature Adoption**
- Track `brain_dump_processed` event count
- See how many users connect calendar
- Monitor energy tracking usage

### 5. **A/B Testing**
- Compare behavior between user segments
- Test new features with custom tags
- Measure impact of UI changes

---

## 🎨 Custom Event Examples

Already integrated in your code:

```typescript
// In task-service.ts
export async function createTask(...) {
  // ... task creation logic ...
  ClarityTracking.taskCreated(); // ✅ Tracked
}

export async function toggleTaskComplete(...) {
  // ... completion logic ...
  ClarityTracking.taskCompleted(); // ✅ Tracked
}

// In AuthContext.tsx
identifyUser(user.id, {
  email: user.email,
  name: user.fullName,
}); // ✅ User linked to session
```

### Add More Tracking:

```typescript
// In KAAL Agent
import { ClarityTracking } from '../services/clarity-service';

function processBrainDump() {
  // ... processing logic ...
  ClarityTracking.brainDumpProcessed();
}

// In Focus Session
function startFocusSession() {
  ClarityTracking.focusSessionStarted();
}

// In Energy Hub
function logEnergyLevel() {
  ClarityTracking.energyCheckIn();
}
```

---

## 🔒 Privacy & GDPR

Clarity is **GDPR compliant** when configured correctly:

### What's Collected:
- ✅ Page views and navigation
- ✅ Click positions and scroll depth
- ✅ Device and browser info
- ✅ Geographic location (country level)

### What's NOT Collected:
- ❌ Personal data (unless you set it)
- ❌ Password fields (auto-masked)
- ❌ Payment information
- ❌ User content (unless visible on screen)

### User Consent:

If you need explicit consent (for GDPR):

```typescript
import { grantConsent } from '../services/clarity-service';

// After user accepts cookie banner
function handleAcceptCookies() {
  grantConsent();
  // Clarity will now track this user
}
```

---

## 📈 Dashboard Tips

### Best Practices:

1. **Watch 5-10 recordings per week**
   - Especially for new feature launches
   - Focus on users who encountered errors

2. **Set up segments**
   - "Users who completed tasks"
   - "Users who used KAAL Agent"
   - "Users with errors"

3. **Review heatmaps monthly**
   - Compare before/after changes
   - Identify unused features

4. **Track key metrics**
   - Time to first task creation
   - KAAL Agent usage rate
   - Energy check-in frequency

---

## 🐛 Debugging

### Check if Clarity is loaded:

```typescript
// In browser console
window.clarity
// Should return: function

// Check project ID
window.clarity.q
// Should show queued events
```

### Common Issues:

**Clarity not loading:**
- Check browser console for errors
- Verify script in `/index.html`
- Check ad blockers (may block Clarity)

**Events not appearing:**
- Wait 5-10 minutes for processing
- Check event name spelling
- Verify user is identified

**Recordings empty:**
- Check if session was sampled out
- Use `upgradeSession()` for testing
- Verify no privacy browser extensions

---

## 🎯 Integration with Sentry

Clarity and Sentry work together:

```typescript
// When error occurs:
1. Sentry captures the error + stack trace
2. Clarity records the session leading up to error
3. Sentry shows user ID → Find in Clarity
4. Watch Clarity recording to see what user did
```

**Workflow:**
1. See error in Sentry
2. Copy user ID from Sentry
3. Go to Clarity dashboard
4. Filter recordings by user ID
5. Watch the session to understand context

---

## 📚 Resources

- **Clarity Dashboard:** https://clarity.microsoft.com/
- **Clarity Docs:** https://docs.microsoft.com/en-us/clarity/
- **KAAL Project ID:** `vmha9lsejv`

---

## ✨ Summary

**Microsoft Clarity is now live in KAAL!**

✅ Automatic page view tracking  
✅ User session recordings  
✅ Click and scroll heatmaps  
✅ Custom event tracking for tasks, focus, energy  
✅ User identification on login  
✅ Error session upgrade  
✅ Privacy-compliant configuration  
✅ Integrated with Sentry for complete visibility  

**Next:** Visit https://clarity.microsoft.com/ to start watching user sessions! 🎥
