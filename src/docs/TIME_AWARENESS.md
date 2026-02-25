# KAAL Agent - Time/Context Awareness Features

## Overview
The KAAL Agent is now **fully time-aware AND timezone-aware**, meaning it understands current time context when parsing deadlines, scheduling tasks, and interpreting relative time references — all while respecting the user's timezone and handling DST transitions automatically.

---

## ✅ What Changed

### 1. **Context-Aware Temporal Parsing**
The temporal extractor now receives the **current hour** and **user timezone** and adjusts deadline interpretation based on time of day:

#### New Patterns Supported:
- **"tonight"** → 9pm today (or skipped if past 11pm)
- **"later today" / "later"** → 2 hours from now (capped at 9pm)
- **"soon" / "shortly"** → 1 hour from now
- **"before bed" / "before sleeping"** → 10pm (or skipped if already past)
- **"today" / "eod"** → 6pm if before 6pm, otherwise 9pm

#### Improved Relative References:
- **"this morning"** at 3pm → interprets as **tomorrow morning** (9am)
- **"this afternoon"** at 8pm → interprets as **tomorrow afternoon** (2pm)
- **"this evening"** at 11pm → interprets as **tomorrow evening** (6pm)

### 2. **Sleep Schedule Boundaries**
The schedule builder now respects human sleep patterns:
- ❌ Won't schedule tasks **before 6am**
- ❌ Won't schedule tasks **after 10pm**
- ✅ If it's past 10pm, returns empty schedule (no blocks available)

### 3. **Comprehensive Timezone Support**
A complete timezone service that handles:
- ✅ **Auto-detection** using `Intl.DateTimeFormat().resolvedOptions().timeZone`
- ✅ **DST awareness** — automatically handles daylight saving transitions
- ✅ **Timezone conversions** — accurate time calculations across timezones
- ✅ **LocalStorage persistence** — remembers user's timezone preference
- ✅ **17 common timezone presets** (US, Europe, Asia, Australia, etc.)
- ✅ **Friendly display names** — e.g., "Los Angeles (PST, UTC-8)"

### 4. **Context-Aware UI Indicators**
Two indicators now appear above the "Organize + Create Tasks" button:
```
🕐 2:45 PM  ·  🌍 Los Angeles
```
Showing current time and detected timezone with hover tooltip for full timezone name.

### 5. **Console Logging for Debugging**
Temporal matches are logged to console with timezone info:
```javascript
[Temporal] Parsing in timezone: America/Los_Angeles, current hour: 15
[Temporal] Matched pattern "\btonight\b" at 15:00 → 2/24/2026, 9:00:00 PM
```

---

## 🌍 Timezone Features

### Automatic Detection
On first use, KAAL detects your timezone using browser APIs:
- **Detects**: `America/Los_Angeles`, `Europe/London`, `Asia/Tokyo`, etc.
- **Saves**: Preference stored in localStorage as `kaal_user_timezone`
- **Fallback**: Defaults to UTC if detection fails

### DST Handling
The system automatically handles daylight saving time:
- ✅ "this afternoon" at 2am on DST switch day works correctly
- ✅ Deadlines don't shift unexpectedly during DST transitions  
- ✅ Energy patterns adjust to new local hours

### Timezone Service API
```typescript
// Get current time in user's timezone
getCurrentTimeInTimezone(timezone: string): Date

// Get current hour (0-23) in user's timezone  
getCurrentHourInTimezone(timezone: string): number

// Check if DST is active
isDSTActive(timezone: string, date?: Date): boolean

// Get friendly display name
getTimezoneFriendlyName(timezone: string): string
// → "Los Angeles (PST, UTC-8)"

// Get timezone abbreviation
getTimezoneAbbreviation(timezone: string): string
// → "PST" or "PDT" depending on DST

// Save/load user preference
saveTimezonePreference(timezone: string): void
loadTimezonePreference(): string
```

---

## 🧪 Testing Scenarios

### Scenario 1: Morning (9am)
**Input:** "Write report this afternoon, call John tonight"
- **"this afternoon"** → Today at 3pm ✅ (afternoon hasn't passed)
- **"tonight"** → Today at 9pm ✅

### Scenario 2: Evening (6pm)
**Input:** "Write report this afternoon, call John tonight"
- **"this afternoon"** → Tomorrow at 2pm ✅ (afternoon has passed)
- **"tonight"** → Today at 9pm ✅

### Scenario 3: Late Night (11pm)
**Input:** "Write report later today, call John tonight"
- **"later today"** → No valid time (would be past 9pm cap)
- **"tonight"** → Skipped (too late, past 11pm)

### Scenario 4: End of Day Context
**Input:** "Finish task today"
- At **2pm** → Deadline set to **6pm** (reasonable EOD)
- At **7pm** → Deadline set to **9pm** (late EOD extension)

---

## 🔬 Technical Details

### Temporal Extractor Function Signature
```typescript
export function extractTemporalSignals(
  text: string, 
  currentHour: number = new Date().getHours(),
  timezone: string = loadTimezonePreference()
): TemporalSignals
```

### Time Context Helpers (Internal)
```typescript
const isMorning = currentHour >= 5 && currentHour < 12;
const isAfternoon = currentHour >= 12 && currentHour < 17;
const isEvening = currentHour >= 17 && currentHour < 22;
const isLateNight = currentHour >= 22 || currentHour < 5;
```

### Schedule Builder Sleep Boundaries
```typescript
const START_HOUR = Math.max(startFromHour, 6);  // Never before 6am
const END_HOUR = 22;  // Never after 10pm
```

---

## 💡 Example Brain Dumps

### Example 1: Overwhelmed at 3pm
```
"I need to finish the slides tonight, 
call Sarah later, 
review budget before bed, 
and prep for tomorrow morning meeting"
```

**Agent Response:**
- ✅ "finish slides" → Deadline: **Tonight 9pm**
- ✅ "call Sarah" → Deadline: **Later today 5pm**
- ✅ "review budget" → Deadline: **Before bed 10pm**
- ✅ "prep for meeting" → Scheduled: **Tomorrow morning** (recognized as future)

### Example 2: Planning at 8pm
```
"Quick 10-min email this evening,
write proposal later,
plan sprint this afternoon"
```

**Agent Response:**
- ✅ "email" → **10 min task, this evening** (still valid at 8pm)
- ✅ "write proposal" → **Later = 10pm** (capped, won't go past bedtime)
- ✅ "plan sprint" → **Tomorrow afternoon** (afternoon already passed today)

---

## 🚀 Benefits

1. **No More Confusing Deadlines**: "tonight" at 11pm won't create invalid deadlines
2. **Smart Rescheduling**: Past time-of-day references auto-adjust to next day
3. **Sleep-Friendly**: Won't schedule deep work at 2am unless explicitly stated
4. **Urgency Adjustment**: Tasks due "soon" get boosted urgency scores automatically
5. **Energy Alignment**: Morning tasks scheduled in morning energy windows

---

## 🔮 Future Enhancements (Potential)

- [ ] Learn user's personal sleep schedule from energy check-ins
- [ ] Understand business hours context ("before COB" = 5pm on weekdays)
- [ ] Weekend vs weekday awareness
- [ ] Time zone support for distributed teams
- [ ] "After lunch" relative to user's typical lunch time

---

**Status**: ✅ **FULLY IMPLEMENTED** (February 24, 2026)