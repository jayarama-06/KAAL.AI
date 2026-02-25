# KAAL Nudge System - Quick Reference

## 🚀 Quick Start

### Generate a nudge message (runs in browser, zero cost)

```typescript
import { selectTemplate, getAndIncrementMessageIndex } from './lib/selectNudge';

const message = selectTemplate({
  nudge_type: 'gentle',      // gentle | active | intervention | context_switch | etc.
  energy_level: 2,           // 1=low, 2=medium, 3=high
  task_title: 'Write report',
  task_estimated_minutes: 30,
  minutes_overdue: 5,
  tasks_done_today: 2,
  inactive_hours: 0,
  streak_days: 7,
  last_clicked_tone: null,   // or 'low' | 'medium' | 'high'
  message_index: getAndIncrementMessageIndex()
});

console.log(message);
// "Your session is ready. Write report is at the top. Whenever you are."
```

---

## 📋 Nudge Types

| Type | When to Use | Minutes Overdue |
|------|-------------|-----------------|
| `gentle` | Soft reminder | 0-15 min |
| `active` | Firmer nudge | 15-45 min |
| `intervention` | Serious delay | 45+ min |
| `context_switch` | Energy dropped | N/A |
| `break_reminder` | 90+ min focus | N/A |
| `reengagement_hours` | Gone 3-23 hrs | N/A |
| `reengagement_days` | Gone 2+ days | N/A |
| `celebration` | 3+ tasks done | N/A |
| `streak` | Milestone hit | N/A |

---

## 🎯 Energy Levels

| Level | Meaning | Tone |
|-------|---------|------|
| `1` | Low energy | Gentle, encouraging |
| `2` | Medium energy | Balanced, direct |
| `3` | High energy | Assertive, action-oriented |

---

## 🔔 Send Push Notification

```typescript
import { sendPushNotification } from './lib/oneSignalService';

await sendPushNotification(
  userId,
  message,     // from selectTemplate()
  'medium'     // 'low' | 'medium' | 'high'
);
```

**Rate limit**: Max 1 push per user per 3 hours (automatic)

---

## 🔥 Streak Tracking

### Update streak on check-in

```typescript
import { updateStreak } from './lib/streakTracking';

const newStreak = await updateStreak(userId);
```

### Get current streak

```typescript
import { getCurrentStreak } from './lib/streakTracking';

const streak = await getCurrentStreak(userId);
```

### Milestone notifications

Auto-fires at: **3, 7, 14, 30, 60, 90 days**

---

## 🧠 Behavioral Learning

### Get user's preferred tone

```typescript
import { getPreferredTone } from './lib/selectNudge';

const tone = await getPreferredTone(userId, supabase);
// Returns: 'low' | 'medium' | 'high' | null
```

Uses click data from `nudge_events` where `outcome = 'started'`

### Log nudge outcome

```typescript
await supabase
  .from('nudge_events')
  .update({ outcome: 'started' })  // or 'dismissed' | 'ignored'
  .eq('id', nudgeEventId);
```

---

## 🎨 Template Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `{task}` | "Write project proposal" | Full title |
| `{task_short}` | "Write project..." | First 3 words |
| `{mins}` | "30" | Est. minutes |
| `{overdue}` | "22" | Mins overdue |
| `{streak}` | "7" | Streak days |
| `{done_today}` | "4" | Tasks done |
| `{time_of_day}` | "morning" | Time period |
| `{day}` | "Tuesday" | Day of week |
| `{energy}` | "high" | Energy tier |
| `{inactive_hrs}` | "6" | Hours away |
| `{inactive_days}` | "2" | Days away |

---

## 🔧 Setup Checklist

- [ ] Run: `supabase db push` (apply migration)
- [ ] Create OneSignal account
- [ ] Add `VITE_ONESIGNAL_APP_ID` to `.env`
- [ ] Add OneSignal secrets to Supabase Edge Functions
- [ ] Deploy: `supabase functions deploy send-push-notification`
- [ ] OneSignal SDK added to `index.html`
- [ ] Show `<NotificationPermissionPrompt />` after first check-in

---

## 📊 Database Schema

### New columns in `profiles`

```sql
streak_days INTEGER DEFAULT 0
last_checkin_date DATE
onesignal_player_id TEXT
```

### New column in `nudge_events`

```sql
tone_tier TEXT CHECK (tone_tier IN ('low', 'medium', 'high'))
```

---

## 💰 Cost

**Total: $0/month**

- Template selection: Browser (free)
- OneSignal: Free tier (up to 10K subscribers)
- Supabase Edge Function: Free tier
- Database queries: Free tier

---

## 🧪 Testing

### Test in browser console

```javascript
// Generate message
import { selectTemplate } from './lib/selectNudge';
selectTemplate({
  nudge_type: 'gentle',
  energy_level: 2,
  task_title: 'Test',
  task_estimated_minutes: 30,
  minutes_overdue: 0,
  tasks_done_today: 0,
  inactive_hours: 0,
  streak_days: 0,
  last_clicked_tone: null,
  message_index: 0
});

// Test push (requires permission)
import { sendPushNotification } from './lib/oneSignalService';
await sendPushNotification('user-id', 'Test message', 'medium');
```

---

## 🎯 Common Patterns

### On energy check-in submit

```typescript
// 1. Save check-in
await supabase.from('energy_checkins').insert({ ... });

// 2. Update streak
const streak = await updateStreak(userId);

// 3. Show permission prompt if first check-in
// (handled by <NotificationPermissionPrompt />)
```

### On task overdue

```typescript
// 1. Calculate overdue amount
const minutesOverdue = ...;

// 2. Determine nudge type
const type = minutesOverdue < 15 ? 'gentle'
           : minutesOverdue < 45 ? 'active'
           : 'intervention';

// 3. Get user context
const preferredTone = await getPreferredTone(userId, supabase);
const streak = await getCurrentStreak(userId);

// 4. Generate message
const message = selectTemplate({ ... });

// 5. Send push or show in-app
await sendPushNotification(userId, message, tone);
```

### On user returns after absence

```typescript
// 1. Calculate hours away
const hoursAway = ...;

// 2. Pick type
const type = hoursAway >= 48 ? 'reengagement_days'
           : 'reengagement_hours';

// 3. Generate & send
const message = selectTemplate({ nudge_type: type, ... });
await sendPushNotification(userId, message, tone);
```

---

## 📁 File Locations

```
/lib/
  nudgeTemplates.ts           # 100+ templates
  selectNudge.ts              # Selection algorithm
  streakTracking.ts           # Streak system
  oneSignalService.ts         # Push notifications
  nudgeSystemExample.ts       # Usage examples

/components/
  NotificationPermissionPrompt.tsx

/supabase/
  functions/send-push-notification/index.ts
  migrations/add_nudge_system_columns.sql
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No templates showing | Check `nudge_type` spelling |
| Push not sending | Verify OneSignal App ID in `.env` |
| Streak not updating | Run database migration |
| Wrong tone used | Need 5+ nudges with 'started' outcome |
| Rate limited | Max 1 push per 3 hours enforced |

---

## 📚 Full Documentation

See `NUDGE_SYSTEM_SETUP.md` for complete setup guide.

---

**Questions? Check the examples in `/lib/nudgeSystemExample.ts`**
