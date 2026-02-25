# 🎯 Mixpanel Analytics Integration - Complete Guide

## ✅ Status: Fully Integrated

Mixpanel is now fully integrated into your KAAL application with autocapture, session recording, and custom event tracking.

---

## 📊 **What's Mixpanel?**

Mixpanel is a powerful product analytics platform that helps you:
- **Track User Behavior:** See exactly how users interact with your app
- **Autocapture Events:** Automatically tracks clicks, form submissions, and page views
- **Session Recording:** Records 100% of user sessions for replay
- **Funnel Analysis:** Understand user journeys and drop-off points
- **Cohort Analysis:** Group users based on behavior patterns
- **Real-time Dashboards:** Monitor live user activity

---

## 🔧 **Integration Details**

### **Project Configuration:**
```javascript
Project Token: 67f26b4aa269831d610b60a4683172ff
Autocapture: Enabled
Session Recording: 100% of sessions
```

### **Where It's Integrated:**

1. **`/index.html`** - Mixpanel snippet loaded in `<head>`
2. **`/services/mixpanel-service.ts`** - TypeScript service with 30+ pre-built methods
3. **`/components/RouteTracker.tsx`** - Automatic page view tracking
4. **`/contexts/AuthContext.tsx`** - User identification on sign in

---

## 🎨 **What's Tracked Automatically (Autocapture)**

Mixpanel autocapture is **enabled**, which means it automatically tracks:

✅ **All Button Clicks**
✅ **All Link Clicks**
✅ **Form Submissions**
✅ **Page Views**
✅ **Session Duration**
✅ **Scroll Depth**
✅ **Rage Clicks** (user frustration)
✅ **Dead Clicks** (clicks on non-interactive elements)

**No code required** - these events are captured automatically!

---

## 📹 **Session Recording**

**Recording Rate:** 100% of sessions

### **What Gets Recorded:**
- ✅ Mouse movements and clicks
- ✅ Page scrolling
- ✅ Form interactions
- ✅ Navigation between pages
- ✅ Console errors (automatically captured)

### **Privacy:**
- 🔒 Sensitive data is automatically masked (passwords, credit cards)
- 🔒 You can add custom masking for specific elements

---

## 🎯 **Custom Event Tracking**

The Mixpanel service (`/services/mixpanel-service.ts`) provides 30+ pre-built methods for tracking KAAL-specific events:

### **Authentication Events:**
```typescript
import { mixpanel } from '../services/mixpanel-service';

// Track sign up
mixpanel.trackSignUp('email');
mixpanel.trackSignUp('google');

// Track sign in
mixpanel.trackSignIn('email');

// Track sign out
mixpanel.trackSignOut();
```

### **Task Events:**
```typescript
// Track task created
mixpanel.trackTaskCreated({
  priority: 'high',
  estimatedMinutes: 30,
  hasDeadline: true,
});

// Track task completed
mixpanel.trackTaskCompleted({
  priority: 'high',
  timeSpent: 25,
  wasOnTime: true,
});

// Track task deleted
mixpanel.trackTaskDeleted('no longer needed');
```

### **Focus Session Events:**
```typescript
// Track focus session started
mixpanel.trackFocusSessionStarted(25); // 25 minutes

// Track focus session completed
mixpanel.trackFocusSessionCompleted({
  plannedDuration: 25,
  actualDuration: 23,
  wasCompleted: true,
  distractions: 2,
});
```

### **Energy Check-in Events:**
```typescript
// Track energy check-in
mixpanel.trackEnergyCheckIn({
  energyLevel: 4,
  mood: 'focused',
  mentalClarity: 5,
  location: 'office',
});
```

### **Brain Dump Events:**
```typescript
// Track brain dump processed
mixpanel.trackBrainDumpProcessed({
  itemCount: 15,
  tasksCreated: 8,
  worriesDetected: 3,
  ideasDetected: 2,
  blockersDetected: 2,
});
```

### **AI Recommendation Events:**
```typescript
// Track AI recommendation viewed
mixpanel.trackAIRecommendationViewed('task');

// Track AI recommendation accepted
mixpanel.trackAIRecommendationAccepted('schedule');
```

### **Calendar Events:**
```typescript
// Track calendar connected
mixpanel.trackCalendarConnected('google');

// Track event created
mixpanel.trackEventCreated({
  eventType: 'meeting',
  duration: 60,
});
```

### **General Events:**
```typescript
// Track any custom event
mixpanel.track('Custom Event Name', {
  customProperty: 'value',
  anotherProperty: 123,
});
```

---

## 👤 **User Identification**

Users are automatically identified when they sign in through the `AuthContext`:

```typescript
// Automatically happens in AuthContext
mixpanel.identifyUser(userId, {
  email: 'user@example.com',
  name: 'John Doe',
  signupDate: '2024-01-01',
  plan: 'free',
});
```

### **User Properties:**
```typescript
// Set properties that can change
mixpanel.setUserPropertiesOnce({
  first_seen: new Date().toISOString(),
  signup_source: 'website',
});

// Increment counters
mixpanel.incrementUserProperty('tasks_completed', 1);
mixpanel.incrementUserProperty('focus_sessions', 1);
```

### **Reset on Sign Out:**
```typescript
// Automatically called when user signs out
mixpanel.resetUser();
```

---

## 📊 **What You'll See in Mixpanel Dashboard**

### **1. Insights (Events)**
View all tracked events in real-time:
- Page views
- Task operations (create, complete, delete)
- Focus sessions
- Energy check-ins
- Brain dump processing
- AI interactions

### **2. Funnels**
Create conversion funnels like:
```
Sign Up → First Task → Complete Task → Second Focus Session
```

### **3. Retention**
See how many users come back:
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)

### **4. Users**
View individual user profiles with:
- All events they've triggered
- Properties (email, name, task count)
- Session replays

### **5. Session Replay**
Watch recordings of user sessions to:
- Identify UX issues
- See where users get stuck
- Understand user behavior

---

## 🚀 **How to Use in Your Code**

### **Import the Service:**
```typescript
import { mixpanel } from '../services/mixpanel-service';
```

### **Example: Track Task Creation**
```typescript
// In your TaskCreationModal component
const handleCreateTask = async (taskData) => {
  // Create the task
  const newTask = await createTask(taskData);
  
  // Track in Mixpanel
  mixpanel.trackTaskCreated({
    priority: taskData.priority,
    estimatedMinutes: taskData.estimatedMinutes,
    hasDeadline: !!taskData.deadline,
  });
  
  // Also increment user property
  mixpanel.incrementUserProperty('tasks_created');
};
```

### **Example: Track Feature Usage**
```typescript
// In any component
const handleFeatureUsed = () => {
  mixpanel.trackFeatureUsed('kaal_agent', {
    items_processed: 10,
    success: true,
  });
};
```

---

## 🔒 **Privacy & GDPR Compliance**

### **Opt-In/Opt-Out:**
```typescript
// User opts in to tracking
mixpanel.optInTracking();

// User opts out
mixpanel.optOutTracking();

// Check status
if (mixpanel.hasOptedInTracking()) {
  // User has opted in
}
```

### **Data Retention:**
- Session recordings: 30 days
- Event data: Unlimited (free plan)
- User profiles: Unlimited

### **Sensitive Data:**
Mixpanel automatically masks:
- Password fields
- Credit card numbers
- Phone numbers
- Email addresses (in recordings)

---

## 📈 **Key Metrics to Track**

### **1. Activation:**
- % of users who complete first task
- Time to first task
- % who complete onboarding

### **2. Engagement:**
- Average tasks per user
- Average focus session duration
- Energy check-in frequency

### **3. Retention:**
- Day 1, Day 7, Day 30 retention
- Weekly active users
- Churn rate

### **4. Feature Usage:**
- Most used features
- Least used features
- Feature adoption rate

---

## 🎯 **Recommended Mixpanel Reports**

### **1. Sign Up Funnel**
```
Landing Page → Sign Up Started → Email Verified → First Task Created
```

### **2. Task Completion Rate**
```
Task Created → Task Started → Task Completed
```

### **3. Focus Session Quality**
```
Focus Session Started → Session Completed → Break Taken
```

### **4. AI Engagement**
```
AI Recommendation Viewed → Recommendation Accepted → Action Taken
```

---

## 🧪 **Testing Your Integration**

### **1. Verify Installation**
Open browser console and run:
```javascript
console.log(window.mixpanel);
// Should see Mixpanel object
```

### **2. Test Custom Event**
```javascript
window.mixpanel.track('Test Event', { foo: 'bar' });
```

### **3. Check Dashboard**
- Go to Mixpanel dashboard
- Navigate to "Events" → "Live View"
- You should see your test event appear in real-time

---

## 🆚 **Mixpanel vs GA4 vs Clarity**

| Feature | Mixpanel | Google Analytics | Microsoft Clarity |
|---------|----------|------------------|-------------------|
| **Event Tracking** | ✅ Advanced | ✅ Basic | ❌ |
| **Session Recording** | ✅ Yes | ❌ No | ✅ Yes |
| **Funnel Analysis** | ✅ Advanced | ✅ Basic | ❌ |
| **User Profiles** | ✅ Yes | ⚠️ Limited | ❌ |
| **Real-time** | ✅ Yes | ⚠️ Delayed | ✅ Yes |
| **Heatmaps** | ❌ No | ❌ No | ✅ Yes |
| **Autocapture** | ✅ Yes | ⚠️ Limited | ✅ Yes |
| **Custom Events** | ✅ Unlimited | ✅ Limited | ⚠️ Limited |

**Recommendation:** Use all three together!
- **Mixpanel:** Product analytics, funnels, user behavior
- **GA4:** Traffic sources, SEO, acquisition
- **Clarity:** UX issues, heatmaps, session replays

---

## 🔥 **Pro Tips**

### **1. Event Naming Convention**
Use consistent naming:
```typescript
// Good
mixpanel.track('Task Created');
mixpanel.track('Task Completed');
mixpanel.track('Task Deleted');

// Bad
mixpanel.track('task_created');
mixpanel.track('TaskComplete');
mixpanel.track('Delete Task');
```

### **2. Add Context to Events**
```typescript
// Good - provides context
mixpanel.trackTaskCompleted({
  priority: 'high',
  timeSpent: 25,
  wasOnTime: true,
  source: 'dashboard',
});

// Bad - no context
mixpanel.track('Task Completed');
```

### **3. Track Time-to-Complete**
```typescript
// Start timing
mixpanel.timeEvent('Task Completion');

// Later... (automatically includes duration)
mixpanel.track('Task Completion');
```

### **4. Use Super Properties**
Set properties that apply to all events:
```typescript
mixpanel.register({
  app_version: '2.0.0',
  environment: 'production',
});
```

---

## 📚 **Additional Resources**

- **Mixpanel Docs:** https://docs.mixpanel.com/
- **JavaScript SDK:** https://github.com/mixpanel/mixpanel-js
- **Best Practices:** https://mixpanel.com/blog/analytics-best-practices/

---

## 🎉 **You're All Set!**

Mixpanel is now tracking:
- ✅ All page views (automatic via RouteTracker)
- ✅ User sign ins/sign ups (automatic via AuthContext)
- ✅ Session recordings (100% of sessions)
- ✅ Autocapture events (clicks, forms, etc.)
- ✅ 30+ custom events via mixpanel service

**Next Steps:**
1. Sign in to KAAL and create some tasks
2. Check Mixpanel dashboard to see events appear
3. Add custom tracking to your specific features using the examples above

---

## 🐛 **Troubleshooting**

### **Events not appearing?**
1. Check browser console for errors
2. Verify Mixpanel is loaded: `console.log(window.mixpanel)`
3. Check ad blockers aren't blocking Mixpanel
4. Ensure you're viewing the correct project (token: 67f26b4aa269831d610b60a4683172ff)

### **Session recordings not working?**
1. Check recording is enabled (100% in config)
2. Verify user has not opted out
3. Check browser supports recording (modern browsers only)

### **User identification not working?**
1. Check AuthContext is properly identifying users
2. Verify `mixpanel.identify()` is being called
3. Check user properties are being set

---

**Need help?** Check the Mixpanel documentation or review `/services/mixpanel-service.ts` for implementation details.
