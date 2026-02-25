# KAAL Local Nudge System - Setup Guide

## 🎯 Overview

This is a **fully local, zero-cost nudge message engine** that replaces all API calls for notification generation. Everything runs in the browser with no network requests for message generation.

### What's Included

- **100+ witty notification templates** organized by type and energy level
- **Smart selection algorithm** that learns user preferences
- **Streak tracking system** for daily check-ins
- **OneSignal web push integration** (free tier, no cost)
- **Behavioral learning** - adapts to which tone gets users to act

---

## 📦 Installation Steps

### 1. Database Migrations

Run the SQL migration to add required columns:

```bash
# Apply the migration
supabase db push
```

Or manually run `/supabase/migrations/add_nudge_system_columns.sql` in your Supabase SQL editor.

This adds:
- `profiles.streak_days` - consecutive check-in streak
- `profiles.last_checkin_date` - date of last check-in
- `profiles.onesignal_player_id` - push notification subscription ID
- `nudge_events.tone_tier` - tracks which tone was used

---

### 2. OneSignal Setup (Free Web Push)

#### Create OneSignal Account
1. Go to [onesignal.com](https://onesignal.com) and create a free account
2. Click **New App/Website**
3. Select **Web Push** as the platform
4. Follow the setup wizard

#### Configure Your App
1. In OneSignal dashboard, go to **Settings** → **Keys & IDs**
2. Copy your **App ID**
3. Go to **Settings** → **Keys & IDs** → **REST API Key**
4. Copy your **REST API Key**

#### Add Environment Variables
Add to your `.env` file:

```bash
VITE_ONESIGNAL_APP_ID=your-app-id-here
```

Add to your Supabase Edge Function secrets:

```bash
supabase secrets set ONESIGNAL_APP_ID=your-app-id-here
supabase secrets set ONESIGNAL_REST_API_KEY=your-rest-api-key-here
```

#### Add OneSignal SDK to index.html

Add this script before the closing `</head>` tag in `/index.html`:

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
```

---

### 3. Deploy Edge Function

Deploy the push notification Edge Function:

```bash
supabase functions deploy send-push-notification
```

---

### 4. Initialize OneSignal in Your App

The system is already integrated. The initialization happens automatically when:
1. User completes their first energy check-in
2. `NotificationPermissionPrompt` component appears
3. User clicks "Yes, keep me on track"

---

## 🚀 How It Works

### Template Selection

```typescript
import { selectTemplate, getAndIncrementMessageIndex } from './lib/selectNudge';

const message = selectTemplate({
  nudge_type: 'gentle',        // gentle | active | intervention | etc.
  energy_level: 2,             // 1=low, 2=medium, 3=high
  task_title: 'Write report',
  task_estimated_minutes: 30,
  minutes_overdue: 5,
  tasks_done_today: 2,
  inactive_hours: 4,
  streak_days: 7,
  last_clicked_tone: 'medium', // learned from user behavior
  message_index: getAndIncrementMessageIndex()
});

// Returns: "Your session is ready. Write report is at the top. Whenever you are."
```

### Streak Tracking

```typescript
import { updateStreak, getCurrentStreak } from './lib/streakTracking';

// When user submits energy check-in:
const newStreak = await updateStreak(userId);

// Automatically fires milestone notifications at 3, 7, 14, 30 days
```

### Sending Push Notifications

```typescript
import { sendPushNotification } from './lib/oneSignalService';
import { selectTemplate } from './lib/selectNudge';

// Generate message locally
const message = selectTemplate({
  nudge_type: 'active',
  energy_level: 2,
  task_title: 'Finish presentation',
  task_estimated_minutes: 45,
  minutes_overdue: 20,
  // ... other context
});

// Send via OneSignal (uses Edge Function)
await sendPushNotification(userId, message, 'medium');
```

---

## 🧠 Behavioral Learning

The system learns which tone works for each user:

1. Every nudge logs its `tone_tier` ('low', 'medium', 'high')
2. When user clicks notification and starts task, `outcome = 'started'`
3. System queries which tone gets most 'started' outcomes
4. Future nudges use that tone automatically

**No ML required** - just click tracking.

---

## 🔔 When Nudges Fire

### Automatic Triggers

1. **Gentle** - Task overdue 0-15 min, no active work
2. **Active** - Task overdue 15-45 min
3. **Intervention** - Task overdue 45+ min
4. **Re-engagement (Hours)** - User inactive 4+ hours
5. **Re-engagement (Days)** - User inactive 2+ days
6. **Celebration** - User completes 3+ tasks today
7. **Streak Milestone** - Streak reaches 3, 7, 14, 30 days
8. **Break Reminder** - User in focus session 90+ min
9. **Context Switch** - Energy level drops significantly

### Rate Limiting

- **Max 1 push per user per 3 hours**
- Enforced in Edge Function
- Prevents notification fatigue

---

## 📊 Template Categories

### By Type
- **Gentle** (30 templates) - Soft nudges for slight delays
- **Active** (25 templates) - Firmer nudges for moderate delays
- **Intervention** (11 templates) - Direct nudges for serious delays
- **Context Switch** (8 templates) - When energy state changes
- **Break Reminder** (8 templates) - After 90+ min focus
- **Re-engagement Hours** (17 templates) - Been away 3-23 hours
- **Re-engagement Days** (15 templates) - Been away 2+ days
- **Celebration** (10 templates) - Completed 3+ tasks
- **Streak** (8 templates) - Daily streak milestones

### By Energy Tier
Each applicable type has 3 energy tiers:
- **Low** - Gentle, encouraging, low pressure
- **Medium** - Balanced, direct but supportive
- **High** - Assertive, take-action oriented

---

## 🎨 Variable Placeholders

Templates support these dynamic variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `{task}` | "Write project proposal" | Full task title |
| `{task_short}` | "Write project..." | First 3 words + "..." |
| `{mins}` | "30" | Estimated minutes |
| `{overdue}` | "22" | Minutes overdue |
| `{streak}` | "7" | Current streak days |
| `{done_today}` | "4" | Tasks completed today |
| `{time_of_day}` | "morning" | morning/afternoon/evening |
| `{day}` | "Tuesday" | Day of week |
| `{energy}` | "high" | Current energy tier |
| `{inactive_hrs}` | "6" | Hours since last visit |
| `{inactive_days}` | "2" | Days since last visit |

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Template selection | **$0** (runs in browser) |
| OneSignal (up to 10K subscribers) | **$0** (free tier) |
| Supabase Edge Function | **$0** (included in free tier) |
| Database queries | **$0** (within free tier limits) |
| **Total Monthly Cost** | **$0** |

---

## 🔒 Privacy

- All message generation happens **locally in the browser**
- No external API calls for nudge text
- No user data sent to third parties (except OneSignal for delivery)
- OneSignal only receives: player_id, message, timestamp
- Full GDPR compliant

---

## 🧪 Testing

### Test Template Selection

```typescript
import { selectTemplate } from './lib/selectNudge';

const testContext = {
  nudge_type: 'gentle',
  energy_level: 2,
  task_title: 'Test Task',
  task_estimated_minutes: 30,
  minutes_overdue: 0,
  tasks_done_today: 2,
  inactive_hours: 0,
  streak_days: 5,
  last_clicked_tone: null,
  message_index: 0
};

console.log(selectTemplate(testContext));
```

### Test Streak Tracking

```typescript
import { updateStreak, getCurrentStreak } from './lib/streakTracking';

const streak = await updateStreak('user-id');
console.log('New streak:', streak);
```

### Test Push Notification

1. Enable notifications in KAAL
2. Open browser console
3. Run:
```javascript
await sendPushNotification('your-user-id', 'Test message', 'medium');
```

---

## 🎯 Integration Checklist

- [ ] Run database migration
- [ ] Create OneSignal account
- [ ] Add `VITE_ONESIGNAL_APP_ID` to `.env`
- [ ] Add OneSignal secrets to Supabase
- [ ] Add OneSignal SDK script to `index.html`
- [ ] Deploy `send-push-notification` Edge Function
- [ ] Test notification permission flow
- [ ] Test streak tracking on check-in
- [ ] Test push notification delivery
- [ ] Verify behavioral learning (after a few nudges)

---

## 📚 File Structure

```
/lib/
  nudgeTemplates.ts         - 100+ notification templates
  selectNudge.ts            - Selection algorithm + variable injection
  streakTracking.ts         - Daily streak system
  oneSignalService.ts       - OneSignal web push integration

/components/
  NotificationPermissionPrompt.tsx  - Permission request UI

/supabase/
  functions/
    send-push-notification/
      index.ts              - Edge Function for push delivery
  migrations/
    add_nudge_system_columns.sql    - Database schema updates
```

---

## 🐛 Troubleshooting

### Notifications not appearing
1. Check browser notification permission
2. Verify OneSignal App ID in `.env`
3. Check browser console for errors
4. Ensure `onesignal_player_id` is saved in profile

### Streak not incrementing
1. Verify database migration ran
2. Check `last_checkin_date` column exists
3. Ensure `updateStreak()` is called on check-in submission

### Push notification fails
1. Check Edge Function logs: `supabase functions logs send-push-notification`
2. Verify OneSignal REST API key is set
3. Check rate limit (max 1 per 3 hours)
4. Ensure user has `onesignal_player_id`

### Wrong tone being used
1. Check `tone_tier` is being logged in `nudge_events`
2. Verify at least 5+ nudges with 'started' outcome exist
3. Query should look back 30 days for behavioral data

---

## 🚀 Future Enhancements

- [ ] Add more template categories (deadline approaching, energy boost, etc.)
- [ ] A/B test different tones for same user
- [ ] Smart send time optimization (learn best times per user)
- [ ] Rich notification media (images, action buttons)
- [ ] Multi-language template support
- [ ] Template performance analytics

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review OneSignal documentation: [documentation.onesignal.com](https://documentation.onesignal.com)
3. Check Supabase Edge Function logs
4. Verify database schema matches migration

---

**Built with ❤️ for KAAL - Your Executive Function AI Assistant**
