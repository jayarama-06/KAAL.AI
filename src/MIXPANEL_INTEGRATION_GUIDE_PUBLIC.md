# 🎯 Mixpanel Analytics Integration Guide

**Complete guide for Mixpanel product analytics in KAAL**

---

## 📊 What is Mixpanel?

Mixpanel is a powerful product analytics platform that helps you:
- **Track User Behavior:** See exactly how users interact with your app
- **Autocapture Events:** Automatically tracks clicks, form submissions, and page views
- **Session Recording:** Records user sessions for replay and analysis
- **Funnel Analysis:** Understand user journeys and drop-off points
- **Cohort Analysis:** Group users based on behavior patterns
- **Real-time Dashboards:** Monitor live user activity

---

## 🔧 Setup Instructions

### **Step 1: Create a Mixpanel Project**

1. Go to https://mixpanel.com/
2. Sign up or log in
3. Create a new project
4. Go to **Project Settings** → **Project Token**
5. Copy your project token

### **Step 2: Add Token to Environment**

Add to your `.env.local` file:

```bash
VITE_MIXPANEL_TOKEN=your-mixpanel-token-here
```

### **Step 3: Update Configuration**

Update `/index.html` with your token:

```javascript
mixpanel.init('YOUR_TOKEN_HERE', {
  autocapture: true,
  record_sessions_percent: 100,
})
```

---

## 🏗️ Integration Architecture

Mixpanel is integrated at multiple levels:

### **1. Script Loading** (`/index.html`)
- Mixpanel stub loaded immediately
- Full library loaded asynchronously
- Autocapture enabled automatically

### **2. Service Layer** (`/services/mixpanel-service.ts`)
- Type-safe TypeScript wrapper
- 30+ pre-built tracking methods
- Intelligent loading with retry logic
- Graceful error handling

### **3. Route Tracking** (`/components/RouteTracker.tsx`)
- Automatic page view tracking
- Triggered on every route change
- Integrated with other analytics platforms

### **4. User Identification** (`/contexts/AuthContext.tsx`)
- Automatic user identification on sign-in
- User properties set automatically
- Synchronized with other platforms

---

## 🎨 Features

### **Autocapture (Enabled by Default)**

Mixpanel automatically tracks:
- ✅ All button clicks
- ✅ All link clicks
- ✅ Form submissions
- ✅ Page scrolling
- ✅ Session duration
- ✅ Rage clicks (user frustration indicator)
- ✅ Dead clicks (clicks on non-interactive elements)

**No code required!** These events are captured automatically.

### **Session Recording (100% of Sessions)**

Records:
- ✅ Mouse movements and clicks
- ✅ Page scrolling
- ✅ Form interactions
- ✅ Navigation between pages
- ✅ Console errors

**Privacy:** Sensitive data is automatically masked (passwords, credit cards, etc.)

---

## 🎯 Usage Guide

### **Import the Service**

```typescript
import { mixpanel } from '../services/mixpanel-service';
```

### **Track Custom Events**

```typescript
// Simple event
mixpanel.track('Button Clicked', {
  buttonName: 'Submit Task',
  page: 'Dashboard',
});

// Complex event
mixpanel.trackTaskCreated({
  priority: 'high',
  estimatedMinutes: 30,
  hasDeadline: true,
});
```

### **Identify Users**

```typescript
// Identify user (usually done automatically in AuthContext)
mixpanel.identifyUser(userId, {
  email: 'user@example.com',
  name: 'John Doe',
  signupDate: '2024-01-01',
  plan: 'free',
});
```

### **Set User Properties**

```typescript
// Properties that can change
mixpanel.identifyUser(userId, {
  tasksCompleted: 50,
  currentStreak: 7,
});

// Properties set only once (won't override)
mixpanel.setUserPropertiesOnce({
  firstSeen: new Date().toISOString(),
  signupSource: 'website',
});

// Increment counters
mixpanel.incrementUserProperty('tasks_completed', 1);
```

---

## 📋 Pre-built Tracking Methods

### **Authentication Events**

```typescript
// Track sign up
mixpanel.trackSignUp('email');
mixpanel.trackSignUp('google');

// Track sign in
mixpanel.trackSignIn('email');
mixpanel.trackSignIn('google');

// Track sign out
mixpanel.trackSignOut();
```

### **Task Events**

```typescript
// Task created
mixpanel.trackTaskCreated({
  priority: 'high',
  estimatedMinutes: 30,
  hasDeadline: true,
});

// Task completed
mixpanel.trackTaskCompleted({
  priority: 'high',
  timeSpent: 25,
  wasOnTime: true,
});

// Task deleted
mixpanel.trackTaskDeleted('no longer needed');
```

### **Focus Session Events**

```typescript
// Session started
mixpanel.trackFocusSessionStarted(25); // 25 minutes

// Session completed
mixpanel.trackFocusSessionCompleted({
  plannedDuration: 25,
  actualDuration: 23,
  wasCompleted: true,
  distractions: 2,
});
```

### **Energy Hub Events**

```typescript
// Energy check-in
mixpanel.trackEnergyCheckIn({
  energyLevel: 4,
  mood: 'focused',
  mentalClarity: 5,
  location: 'office',
});
```

### **Brain Dump Events**

```typescript
// Brain dump processed
mixpanel.trackBrainDumpProcessed({
  itemCount: 15,
  tasksCreated: 8,
  worriesDetected: 3,
  ideasDetected: 2,
  blockersDetected: 2,
});
```

### **AI Feature Events**

```typescript
// AI recommendation viewed
mixpanel.trackAIRecommendationViewed('task');

// AI recommendation accepted
mixpanel.trackAIRecommendationAccepted('schedule');
```

### **Calendar Events**

```typescript
// Calendar connected
mixpanel.trackCalendarConnected('google');

// Calendar event created
mixpanel.trackEventCreated({
  eventType: 'meeting',
  duration: 60,
});
```

### **General Events**

```typescript
// Feature usage
mixpanel.trackFeatureUsed('kaal_agent', {
  items_processed: 10,
  success: true,
});

// Milestone achieved
mixpanel.trackMilestone({
  name: '100_tasks_completed',
  value: 100,
  category: 'tasks',
});

// Streak maintained
mixpanel.trackStreakMaintained(30); // 30 days
```

---

## ⏱️ Event Timing

Track how long actions take:

```typescript
// Start timing
mixpanel.timeEvent('Task Completion');

// ... user performs action ...

// Complete timing (duration automatically included)
mixpanel.track('Task Completion', {
  taskId: '123',
  priority: 'high',
});
```

---

## 🔒 Privacy & GDPR Compliance

### **Opt In/Out**

```typescript
// User opts in to tracking
mixpanel.optInTracking();

// User opts out
mixpanel.optOutTracking();

// Check status
if (mixpanel.hasOptedInTracking()) {
  // User has opted in
}

if (mixpanel.hasOptedOutTracking()) {
  // User has opted out
}
```

### **Reset User**

```typescript
// Clear user data (on sign out)
mixpanel.resetUser();
```

---

## 📊 Mixpanel Dashboard

### **Live View**
Monitor real-time user activity:
- Events → Live View
- See events as they happen
- Filter by user, event type, properties

### **Insights**
Analyze event trends:
- Events → Insights
- Create custom reports
- Segment by user properties
- Compare time periods

### **Funnels**
Track conversion paths:
- Funnels → Create Funnel
- Define steps (e.g., Sign Up → First Task → Complete Task)
- See drop-off rates
- Optimize conversion

### **Retention**
Measure user retention:
- Retention → Cohorts
- See Day 1, 7, 30 retention
- Group by cohorts
- Compare retention across segments

### **Users**
View individual profiles:
- Users → Profiles
- See all events per user
- View user properties
- Watch session replays

### **Session Replay**
Watch user sessions:
- Session Replay → Recordings
- Filter by user, date, errors
- See exactly what users did
- Identify UX issues

---

## 🎯 Best Practices

### **1. Consistent Event Naming**

```typescript
// ✅ Good - Title Case, descriptive
mixpanel.track('Task Created');
mixpanel.track('Task Completed');
mixpanel.track('Task Deleted');

// ❌ Bad - inconsistent
mixpanel.track('task_created');
mixpanel.track('TaskComplete');
mixpanel.track('Delete Task');
```

### **2. Add Rich Context**

```typescript
// ✅ Good - includes relevant properties
mixpanel.trackTaskCompleted({
  priority: 'high',
  timeSpent: 25,
  wasOnTime: true,
  source: 'dashboard',
  dayOfWeek: 'Monday',
});

// ❌ Bad - no context
mixpanel.track('Task Completed');
```

### **3. Use Super Properties**

Set properties that apply to all events:

```typescript
// Set once, applies to all events
mixpanel.register({
  app_version: '2.0.0',
  environment: 'production',
});
```

### **4. Track User Journey**

```typescript
// Sign up
mixpanel.trackSignUp('email');

// First action
mixpanel.track('First Task Created');

// Milestone
mixpanel.trackMilestone({
  name: 'completed_onboarding',
  value: 1,
  category: 'onboarding',
});
```

---

## 🧪 Testing

### **Verify Installation**

Open browser console:

```javascript
console.log(window.mixpanel);
// Should see Mixpanel object with methods
```

### **Test Event**

```javascript
window.mixpanel.track('Test Event', {
  foo: 'bar',
  timestamp: new Date().toISOString(),
});
```

### **Check Dashboard**

1. Go to Mixpanel dashboard
2. Navigate to **Events** → **Live View**
3. You should see your test event appear within seconds

---

## 🐛 Troubleshooting

### **"Mixpanel not loaded" Warning**

**Solution:** The service has intelligent retry logic. It will try for 10 seconds. If it still fails:
1. Check ad blocker isn't blocking Mixpanel
2. Verify script is in `<head>` of index.html
3. Check network tab in DevTools
4. Clear cache and hard refresh

### **Events Not Appearing**

1. Check browser console for errors
2. Verify project token is correct
3. Ensure you're viewing correct project in dashboard
4. Check "Live View" for real-time events
5. Verify network requests to Mixpanel servers

### **Session Recordings Not Working**

1. Ensure modern browser (Chrome, Firefox, Edge)
2. Check recording is enabled (100% in config)
3. Verify user hasn't opted out
4. Check CSP headers aren't blocking recordings

---

## 📚 Additional Resources

- **Mixpanel Docs:** https://docs.mixpanel.com/
- **JavaScript SDK:** https://github.com/mixpanel/mixpanel-js
- **Best Practices:** https://mixpanel.com/blog/analytics-best-practices/
- **Service File:** `/services/mixpanel-service.ts`

---

## ✅ Checklist

- [ ] Mixpanel account created
- [ ] Project token added to environment
- [ ] Token updated in `/index.html`
- [ ] Page views tracking verified
- [ ] User identification working
- [ ] Custom events firing
- [ ] Session recordings available
- [ ] Dashboard accessible
- [ ] Privacy compliance implemented

---

## 🎉 Summary

Mixpanel provides:
- ✅ Automatic event capture (autocapture)
- ✅ 100% session recording
- ✅ Advanced funnels and cohorts
- ✅ Real-time user behavior tracking
- ✅ Individual user profiles
- ✅ Type-safe TypeScript API
- ✅ 30+ pre-built tracking methods

**Start analyzing user behavior and optimizing your product!** 🚀📊

---

**Need Help?** Check `/ANALYTICS_COMPLETE.md` for the full analytics stack guide.
