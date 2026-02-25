// ═══════════════════════════════════════════════════════════════════════════
// KAAL No-API Algorithm Stack
// Complete zero-cost intelligence system
// ═══════════════════════════════════════════════════════════════════════════

# The KAAL No-API Intelligence Stack

## 🎯 Philosophy

**Every feature runs at zero marginal cost per user.**

This is KAAL's competitive advantage — while competitors burn API budgets on every interaction, KAAL uses deterministic algorithms that get smarter with user data stored in YOUR database.

---

## 📊 Master Summary

| Feature | Approach | Cost | Improves with data? |
|---------|----------|------|---------------------|
| **Task ranking** | match_score formula | $0 | ✅ Yes — fatigue adapts per session |
| **Nudge messages** | 100+ template library | $0 | ✅ Yes — tone learning from clicks |
| **CLS auto-score** | Keyword dictionary | $0 | ⚠️ Accurate from day 1 |
| **Energy prediction** | SQL time-series averages | $0 | ✅ Yes — improves with 30+ check-ins |
| **Time estimation** | Personal calibration factor | $0 | ✅ Yes — improves with each task |
| **Deadline risk** | Buffer formula | $0 | ✅ Yes — uses calibration factor |
| **Weekly summary** | Template + variable injection | $0 | ✅ Yes — trend labels improve |
| **Task categorization** | Keyword map | $0 | ⚠️ Deterministic |
| **Burnout detection** | Statistical anomaly thresholds | $0 | ✅ Yes — baselines improve over time |
| **Re-scheduling** | Constraint-based slot finder | $0 | ✅ Yes — uses energy pattern data |
| **Productivity score** | 5-signal weighted formula | $0 | ✅ Yes — accuracy signal improves |
| **Push notifications** | Template + OneSignal free tier | $0 | ✅ Yes — tone preference learning |
| **Streak tracking** | Date comparison in Supabase | $0 | ⚠️ Simple counter |

**14 of 14 features** = Zero API cost  
**10 of 14 features** = Get smarter with user data

---

## 🚀 Implementation Guide

### 1. Auto-Scoring CLS (Cognitive Load Score)

**File**: `/lib/autoScoreCLS.ts`

**Usage**:
```typescript
import { autoScoreCLS, getCLSLabel, getCLSColor } from './lib/autoScoreCLS';

const score = autoScoreCLS('Write quarterly report');
// Returns: 7

const label = getCLSLabel(score);
// Returns: "Demanding"

const color = getCLSColor(score);
// Returns: "#F97316" (orange)
```

**When to use**:
- Call on every keystroke in task title input
- Show live CLS preview as user types
- Store score in `tasks.cognitive_load_score` column

**Keywords**:
- High load: write, build, design, research, analyze, implement, debug
- Low load: email, reply, check, schedule, send, log, admin
- Modifiers: urgent (+2), simple (-2), complex (+2)

---

### 2. Energy Pattern Prediction

**File**: `/lib/energyPatterns.ts`

**Usage**:
```typescript
import { 
  getEnergyByHour, 
  identifyPeakHours,
  predictEnergyForHour,
  getPeakHoursSummary 
} from './lib/energyPatterns';

// Get hourly energy pattern
const pattern = await getEnergyByHour(userId);
// Returns: [{ hour_of_day: 9, avg_energy: 2.8, sample_size: 12 }, ...]

// Find peak hours
const peaks = await identifyPeakHours(userId);
// Returns: { morning_peak: 9, afternoon_peak: 14, best_overall_hour: 9 }

// Predict energy for specific hour
const predicted = await predictEnergyForHour(userId, 9);
// Returns: 3 (high energy)

// Get summary for dashboard
const summary = await getPeakHoursSummary(userId);
// Returns: "You are historically sharpest at 9AM on Tuesdays"
```

**When to use**:
- Dashboard "Your peak hours" card
- Pre-fill check-in with predicted energy
- Schedule morning nudge at user's peak hour
- Smart re-scheduling (see #8)

**Requirements**:
- Run SQL migration: `add_algorithm_system_columns.sql`
- Creates functions: `get_energy_by_hour()`, `get_energy_by_day()`
- Needs 10+ check-ins for accurate predictions

---

### 3. Task Time Calibration

**File**: `/lib/taskCalibration.ts`

**Usage**:
```typescript
import { 
  getCalibrationFactor,
  adjustEstimate,
  getCalibrationMessage,
  recordActualTime 
} from './lib/taskCalibration';

// Get user's calibration factor
const factor = await getCalibrationFactor(userId);
// Returns: 1.4 (user takes 40% longer than estimated)

// When user enters estimate, show adjusted prediction
const estimate = 30; // user's input
const adjusted = adjustEstimate(estimate, factor);
// Returns: 42

const message = getCalibrationMessage(estimate, factor);
// Returns: "Based on your history, this will likely take ~42 min"

// When task completes, record actual time
await recordActualTime(taskId, startedAt, completedAt);
```

**When to use**:
- Show adjusted estimate as user types
- Calculate deadline risk (see #4)
- Analytics page: accuracy over time

**Database columns**:
- `tasks.actual_minutes` — calculated from start/complete timestamps
- `tasks.started_at` — set when user clicks Start

---

### 4. Deadline Risk Scoring

**File**: `/lib/riskScore.ts`

**Usage**:
```typescript
import { 
  computeDeadlineRisk,
  getRiskAssessment,
  getRiskBadge,
  sortTasksByRisk 
} from './lib/riskScore';

const userState = {
  energy_level: 2, // current energy
  calibration_factor: 1.4 // from taskCalibration
};

// Get risk level
const risk = computeDeadlineRisk(task, userState);
// Returns: 'critical' | 'high' | 'medium' | 'low'

// Get full assessment
const assessment = getRiskAssessment(task, userState);
// Returns: { 
//   risk_level: 'high',
//   hours_left: 2.5,
//   hours_needed: 1.8,
//   buffer_hours: 0.7,
//   message: 'Tight deadline',
//   color: '#F97316',
//   emoji: '⚡'
// }

// Get badge for UI (null for low-risk tasks)
const badge = getRiskBadge(task, userState);
// Returns: { text: 'Tight deadline', color: '#F97316', emoji: '⚡' }

// Sort tasks by urgency
const sorted = sortTasksByRisk(tasks, userState);
```

**When to use**:
- Task cards: show risk badge only for high/critical
- Task ranking: boost critical tasks
- Nudge messages: different tone for critical tasks

**Formula**:
```
hours_left = (deadline - now) / 3600000
hours_needed = (estimated_mins * calibration_factor) / 60
energy_multiplier = low=1.5, medium=1.0, high=0.8
adjusted_hours_needed = hours_needed * energy_multiplier
buffer = hours_left - adjusted_hours_needed

if buffer < 0: critical
if buffer < 1: high
if buffer < 3: medium
else: low
```

---

### 5. Auto-Tagging System

**File**: `/lib/autoTag.ts`

**Usage**:
```typescript
import { 
  autoTag,
  getCategoryEmoji,
  getCategoryColor,
  getCategoryBoost,
  recommendCognitiveMode 
} from './lib/autoTag';

// Auto-tag task
const category = autoTag('Send client email');
// Returns: 'Work'

const emoji = getCategoryEmoji(category);
// Returns: '💼'

const color = getCategoryColor(category);
// Returns: '#667EEA'

// Boost task rank if category matches cognitive mode
const boost = getCategoryBoost('Creative', 'deep_focus');
// Returns: 2 (boost score by 2 points)

// Recommend mode based on pending tasks
const mode = recommendCognitiveMode(tasks);
// Returns: 'deep_focus' | 'admin' | 'learning' | 'mixed'
```

**When to use**:
- Store in `tasks.auto_category` on creation
- Task filters/grouping
- Boost task ranking based on mode match
- Analytics: category distribution pie chart

**Categories**:
- **Work**: email, meeting, report, presentation, project
- **Learning**: read, study, course, research, practice
- **Creative**: write, design, build, create, brainstorm
- **Health**: workout, gym, doctor, yoga, meditate
- **Admin**: pay, invoice, form, schedule, book
- **Personal**: family, shop, clean, cook, travel

---

### 6. Burnout Detection

**File**: `/lib/burnoutDetection.ts`

**Usage**:
```typescript
import { 
  detectBurnoutSignals,
  getBurnoutAssessment,
  applyBurnoutAdjustment,
  filterTasksForBurnout 
} from './lib/burnoutDetection';

// Detect signals (run once per day)
const signals = await detectBurnoutSignals(userId);
// Returns: {
//   energy_declining: true,
//   task_completion_dropping: false,
//   deferrals_spiking: true,
//   check_in_gaps_growing: false
// }

// Get full assessment
const assessment = await getBurnoutAssessment(userId);
// Returns: {
//   signals: {...},
//   score: 2,
//   level: 'watch',
//   message: 'KAAL noticed your pace has shifted',
//   recommendation: 'Consider taking it easy today'
// }

// Adjust CLS for task ranking
const adjustedCLS = applyBurnoutAdjustment(8, 'concern');
// Returns: 6 (reduced by 2 points)

// Filter tasks in intervention mode
const safeTasks = filterTasksForBurnout(tasks, 'intervention');
// Returns: only tasks with CLS <= 4
```

**When to use**:
- Background job: run daily at midnight
- Dashboard: show burnout message if score >= 2
- Task ranking: reduce CLS when burnout detected
- Nudges: gentler tone when score >= 3

**Signals**:
1. **Energy declining**: Last 7 days avg < previous 7 days avg by 0.5+
2. **Completion dropping**: Completion rate down >20%
3. **Deferrals spiking**: Last 3 days >2x weekly average
4. **Gaps growing**: Avg hours between check-ins >1.5x last week

**Action thresholds**:
- Score 0-1: No action
- Score 2: Show "Take it easy" message
- Score 3: Auto-reduce CLS by 2, send gentle nudge
- Score 4: Intervention mode, show only admin tasks

---

### 7. Smart Re-scheduling

**File**: `/lib/smartReschedule.ts`

**Usage**:
```typescript
import { 
  suggestRescheduleTime,
  getMultipleRescheduleOptions,
  batchReschedule,
  shouldReschedule 
} from './lib/smartReschedule';

// Get next optimal time slot for a task
const energyPattern = await getEnergyByHour(userId);
const suggestion = suggestRescheduleTime(task, energyPattern);
// Returns: {
//   suggested_time: Date,
//   reason: '2:00 PM today — your peak hour for deep work (predicted energy: 2.8)',
//   confidence: 'high',
//   predicted_energy: 2.8
// }

// Get multiple options
const options = getMultipleRescheduleOptions(task, energyPattern);
// Returns: [suggestion1, suggestion2, suggestion3]

// Batch reschedule without overlap
const schedule = batchReschedule(tasks, energyPattern);
// Returns: Map<taskId, RescheduleOption>

// Check if reschedule is recommended
const shouldMove = shouldReschedule(task, currentEnergy, energyPattern);
// Returns: true (better time exists in next 6 hours)
```

**When to use**:
- Defer button: suggest new time instead of just removing
- Overdue tasks: auto-suggest reschedule
- Morning review: optimize today's schedule
- Energy mismatch: "This task needs higher energy. Move to 9am?"

**Algorithm**:
```
For each task:
  required_energy = CLS >= 7 ? 2.5 : CLS >= 4 ? 1.5 : 1.0
  
  For each hour in next 48:
    predicted_energy = energyPattern[hour].avg_energy
    
    if predicted_energy >= required_energy:
      if task fits before deadline:
        return this hour
```

---

### 8. Daily Productivity Score

**File**: `/lib/productivityScore.ts`

**Usage**:
```typescript
import { 
  getDailyScore,
  getWeeklyAverage,
  calculateTrend 
} from './lib/productivityScore';

// Get today's score
const score = await getDailyScore(userId);
// Returns: {
//   total_score: 72,
//   breakdown: {
//     completion_score: 24,  // max 30
//     energy_score: 14,      // max 20
//     accuracy_score: 12,    // max 20
//     checkin_score: 10,     // max 15
//     deep_work_score: 12    // max 15
//   },
//   grade: 'B',
//   insight: 'Your tasks took longer than expected today. Try adding 20% buffer next time.',
//   trend: 'improving'
// }

// Get weekly average
const weeklyAvg = await getWeeklyAverage(userId);
// Returns: 68

// Calculate trend
const trend = await calculateTrend(userId);
// Returns: 'improving' | 'stable' | 'declining'
```

**When to use**:
- Dashboard: daily score widget
- Analytics: weekly score graph
- End-of-day summary notification
- Weekly email digest

**Scoring formula**:
- **Completion (30 pts)**: tasks_done / tasks_created * 30
- **Energy (20 pts)**: 20 - |morning_energy - evening_energy| * 8
- **Accuracy (20 pts)**: (1 - |actual - estimated| / estimated) * 20
- **Check-in (15 pts)**: min(checkins_today * 5, 15)
- **Deep work (15 pts)**: (high_cls_done / tasks_done) * 15

**Grades**:
- 90+: A+
- 80-89: A
- 70-79: B
- 60-69: C
- 50-59: D
- <50: F

---

## 🗄️ Database Setup

### Run Migrations

```bash
supabase db push
```

Or manually run:
1. `/supabase/migrations/add_nudge_system_columns.sql` (streak tracking, tone learning)
2. `/supabase/migrations/add_algorithm_system_columns.sql` (CLS, calibration, energy patterns)

### New Columns

**tasks**:
- `actual_minutes` INTEGER
- `started_at` TIMESTAMP WITH TIME ZONE
- `cognitive_load_score` INTEGER (1-10)
- `auto_category` TEXT

**profiles**:
- `streak_days` INTEGER
- `last_checkin_date` DATE
- `onesignal_player_id` TEXT

**nudge_events**:
- `tone_tier` TEXT ('low'|'medium'|'high')

### New Functions

- `get_energy_by_hour(user_id)` — returns hourly energy averages
- `get_energy_by_day(user_id)` — returns daily energy averages
- `get_calibration_factor(user_id)` — returns time estimation accuracy

---

## 💡 Integration Examples

### Dashboard Load

```typescript
// Fetch all intelligence data on dashboard mount
const userId = getCurrentUserId();

// Streak
const streak = await getCurrentStreak(userId);

// Energy patterns
const peaks = await identifyPeakHours(userId);
const summary = await getPeakHoursSummary(userId);

// Calibration
const calibration = await getCalibrationFactor(userId);

// Burnout
const burnout = await getBurnoutAssessment(userId);

// Daily score
const score = await getDailyScore(userId);

// Display all in dashboard widgets
```

### Task Creation

```typescript
// Auto-score and tag as user types
const handleTitleChange = (title: string) => {
  setTitle(title);
  
  // Auto-score CLS
  const cls = autoScoreCLS(title);
  setCLS(cls);
  
  // Auto-tag category
  const category = autoTag(title);
  setCategory(category);
  
  // Show calibration hint if estimate entered
  if (estimatedMinutes) {
    const calibration = await getCalibrationFactor(userId);
    const message = getCalibrationMessage(estimatedMinutes, calibration);
    setCalibrationHint(message);
  }
};
```

### Task Ranking (Smart Queue)

```typescript
// Rank tasks using all intelligence
const userState = {
  energy_level: currentEnergy,
  calibration_factor: await getCalibrationFactor(userId)
};

// Get burnout level
const burnout = await getBurnoutAssessment(userId);

// Rank tasks
const ranked = tasks
  .map(task => {
    let score = 0;
    
    // Base score from match_score formula
    score += calculateMatchScore(task, userState);
    
    // Category boost if mode matches
    const category = task.auto_category || autoTag(task.title);
    score += getCategoryBoost(category, cognitiveMode);
    
    // Deadline risk boost
    const risk = computeDeadlineRisk(task, userState);
    if (risk === 'critical') score += 10;
    if (risk === 'high') score += 5;
    
    // Apply burnout adjustment
    task.cognitive_load_score = applyBurnoutAdjustment(
      task.cognitive_load_score,
      burnout.level
    );
    
    return { ...task, score };
  })
  .sort((a, b) => b.score - a.score);

// Filter for burnout intervention if needed
const finalTasks = filterTasksForBurnout(ranked, burnout.level);
```

### End of Day Summary

```typescript
// Generate summary at 9pm daily
const score = await getDailyScore(userId);
const trend = await calculateTrend(userId);

const summary = {
  score: score.total_score,
  grade: score.grade,
  insight: score.insight,
  trend_label: trend === 'improving' ? '📈 Improving' 
             : trend === 'declining' ? '📉 Slowing down'
             : '➡️ Consistent',
  breakdown: score.breakdown
};

// Send as push notification
await sendPushNotification(userId, 
  `Daily score: ${score.grade} (${score.total_score}/100). ${score.insight}`,
  'medium'
);
```

---

## 🎯 Strategic Insight

### Why This Stack is Defensible

**10 of 13 features improve with user data.**

This means:
1. The longer a user uses KAAL, the smarter it gets
2. The intelligence lives in YOUR database, not OpenAI's
3. A competitor can copy your UI but can't copy your users' data
4. Users become more locked-in over time (high switching cost)

### Cost Comparison

**Traditional approach** (using Claude/GPT for everything):
- CLS scoring: $0.001 per task
- Energy prediction: $0.002 per query
- Nudge generation: $0.003 per message
- Weekly summary: $0.01 per user
- Task re-scheduling: $0.005 per suggestion

**For 1,000 active users**:
- 10 tasks/day = $10/day = $300/month
- 5 check-ins/day = $10/day = $300/month
- 3 nudges/day = $9/day = $270/month
- 1 weekly summary = $40/month
- **Total: ~$910/month**

**KAAL approach**: **$0/month**

---

## 🚀 Performance Tips

1. **Cache energy patterns** — refresh every 12 hours, not on every page load
2. **Batch database queries** — fetch all intelligence data in parallel
3. **Use indexes** — migrations include optimized indexes
4. **Lazy load scores** — calculate daily score only when Analytics screen opens
5. **Background jobs** — run burnout detection and weekly summaries via cron

---

## 📚 File Reference

```
/lib/
  autoScoreCLS.ts           # CLS keyword scoring
  energyPatterns.ts         # SQL-based energy prediction
  taskCalibration.ts        # Time estimation learning
  riskScore.ts              # Deadline risk formula
  autoTag.ts                # Category keyword mapping
  burnoutDetection.ts       # Statistical anomaly detection
  smartReschedule.ts        # Constraint-based scheduling
  productivityScore.ts      # 5-signal composite score
  
  nudgeTemplates.ts         # 100+ notification templates
  selectNudge.ts            # Template selection engine
  streakTracking.ts         # Daily check-in streaks
  oneSignalService.ts       # Push notification delivery

/supabase/migrations/
  add_nudge_system_columns.sql
  add_algorithm_system_columns.sql
```

---

**Built for KAAL — Zero-Cost Intelligence That Learns**
