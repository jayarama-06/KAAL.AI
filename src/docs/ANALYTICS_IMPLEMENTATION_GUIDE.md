## KAAL Analytics Intelligence Stack — Complete Implementation Guide

**Status:** ✅ All 10 engines implemented and ready to use  
**Location:** `/lib/analytics/`  
**Database Schema:** See `/docs/ANALYTICS_DATABASE_SCHEMA.md`

---

## What's Been Built

### Complete Engine Stack (All Algorithms Implemented)

✅ **Engine 1** — Deep Work Detector (`deepWorkDetector.ts`)  
   - Session classifier (deep_work / shallow_work / admin)
   - 7-day sliding window ratio tracker
   - Auto-classification based on duration, CLS, interruptions

✅ **Engine 2** — Cognitive Load Tracker (`cognitiveLoadTracker.ts`)  
   - Exponential Moving Average (α=0.3)
   - Peak hour detection
   - Context-aware labels
   - Sparkline generation

✅ **Engine 3** — Focus Scorer (`focusScorer.ts`)  
   - 5-signal composite scoring (0-100)
   - Duration, completion, interruptions, CLS, energy sustainability
   - Daily productivity score (weighted average)
   - Score breakdown for debugging

✅ **Engine 4** — Trend Detector (`trendDetector.ts`)  
   - Mann-Kendall Trend Test
   - Linear regression for projections
   - Sparkline normalization
   - Statistical significance detection

✅ **Engine 5** — Peak Performance Finder (`peakPerformanceFinder.ts`)  
   - Circular buffer heatmap (24-hour clock face)
   - Incremental running average updates
   - 2-hour peak window detection
   - Clock face segment generation

✅ **Engine 6** — Focus Consistency (`focusConsistency.ts`)  
   - 3-component scorer: hit rate + variance + streak
   - Coefficient of Variation calculator
   - Consistency pattern visualization
   - Streak maintenance prediction

✅ **Engine 7** — Timeline Processor (`timelineProcessor.ts`)  
   - Event significance classifier (MILESTONE / HIGH / MEDIUM / LOW)
   - Day summary generator
   - Pattern insight finder
   - Event grouping by day

✅ **Engine 8** — Anomaly Detector (`anomalyDetector.ts`)  
   - Z-Score + IQR outlier detection
   - Personal baseline tracking
   - Burnout pattern recognition (multi-day signals)
   - Risk level scoring

✅ **Engine 9** — Milestone Detector (`milestoneDetector.ts`)  
   - Rule-based achievement detection
   - Streak milestones (3, 7, 14, 21, 30, 60, 90 days)
   - Personal bests (score, deep work hours)
   - Task completion checkpoints (10, 25, 50, 100, 250, 500, 1000)

✅ **Engine 10** — Predictive Insights (`predictiveInsights.ts`)  
   - Linear regression trajectory projection
   - Target date prediction
   - Best day/time recommendations
   - Productivity forecasting (7-14 days ahead)

---

## How to Use Each Engine

### Example: Computing Focus Score for a Session

```typescript
import { computeFocusScore } from '../lib/analytics';

const sessionData = {
  duration_minutes: 90,
  tasks_completed: 3,
  avg_cls_of_tasks: 8.5,
  interruptions: 0,
  energy_at_start: 3,
  energy_at_end: 3,
  session_type: 'deep_work' as const,
};

const score = computeFocusScore(sessionData);
// → 92 (Exceptional)
```

---

### Example: Detecting Trends

```typescript
import { computeAllTrends } from '../lib/analytics';

const dailyStats = await supabase
  .from('daily_stats')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: true })
  .limit(14);

const trends = computeAllTrends(dailyStats.data || []);

console.log(trends.deepWorkSessions.display);
// → "Strong improvement (+23%)"

console.log(trends.focusConsistency.direction);
// → "increasing"
```

---

### Example: Generating Predictive Insights

```typescript
import { generatePredictiveInsights } from '../lib/analytics';

const userModel = {
  avg_session_duration_mins: 75,
  peak_energy_hour: 9,
  avg_daily_tasks: 6,
  avg_productivity_score: 72,
};

const insights = generatePredictiveInsights(dailyStats.data || [], userModel);

console.log(insights);
// → [
//   "At your current pace, you'll hit the 65% deep work target in 9 days",
//   "Your highest-output day is Tuesday — schedule hard tasks for Tuesday at 9am",
//   "Keep going — you're 3 days from a 7-day streak milestone"
// ]
```

---

### Example: Detecting Anomalies

```typescript
import { detectDayAnomaly } from '../lib/analytics';

const todayScore = 92;
const last30Days = await supabase
  .from('daily_stats')
  .select('productivity_score')
  .eq('user_id', userId)
  .gte('date', thirtyDaysAgo)
  .order('date', { ascending: true });

const historicalScores = last30Days.data?.map(d => d.productivity_score || 0) || [];
const anomaly = detectDayAnomaly(todayScore, historicalScores);

console.log(anomaly.type);
// → "breakout_day" (because 92 is >2σ above user's average)
```

---

## Integration Checklist

### Phase 1: Database Setup (Required First)
- [ ] Run migration script from `ANALYTICS_DATABASE_SCHEMA.md`
- [ ] Verify tables created: `focus_sessions`, `daily_stats`, `milestones`, `hourly_heatmap`
- [ ] Set up RLS policies for each table
- [ ] Test with sample data

### Phase 2: Focus Timer Implementation
- [ ] Create UI component for focus timer (start/stop/pause)
- [ ] On timer start → insert into `focus_sessions` with `started_at`
- [ ] On timer end → compute session metrics:
  ```typescript
  import { classifySession, computeFocusScore } from '../lib/analytics';
  
  const sessionType = classifySession({
    duration_minutes: durationInMinutes,
    avg_cls_of_tasks: avgCLS,
    interruptions: interruptionCount,
    tasks_completed: tasksCompleted,
  });
  
  const focusScore = computeFocusScore({
    duration_minutes: durationInMinutes,
    tasks_completed: tasksCompleted,
    avg_cls_of_tasks: avgCLS,
    interruptions: interruptionCount,
    energy_at_start: energyStart,
    energy_at_end: energyEnd,
    session_type: sessionType,
  });
  
  await supabase
    .from('focus_sessions')
    .update({ 
      ended_at: now,
      duration_minutes: durationInMinutes,
      session_type: sessionType,
      focus_score: focusScore,
      // ... other fields
    })
    .eq('id', sessionId);
  ```
- [ ] Update hourly heatmap:
  ```typescript
  import { updateHeatmap } from '../lib/analytics';
  await updateHeatmap(userId, startHour, focusScore);
  ```

### Phase 3: Nightly Rollup Job
- [ ] Set up Supabase Edge Function or external cron (runs at 2am UTC)
- [ ] Call `compute_daily_stats()` for all active users
- [ ] After rollup, run milestone detection:
  ```typescript
  import { detectMilestones } from '../lib/analytics';
  
  const milestones = detectMilestones(todayStats, historicalStats, userModel);
  
  for (const milestone of milestones) {
    await supabase.from('milestones').insert({
      user_id: userId,
      title: milestone.title,
      description: milestone.description,
      milestone_type: milestone.type,
    });
  }
  ```

### Phase 4: Analytics UI Updates
- [ ] **Deep Work Ratio Widget** → use `computeDeepWorkRatio()`
- [ ] **Cognitive Load Widget** → use `computeCognitiveLoadEMA()`
- [ ] **Focus Score Cards** → read from `daily_stats.productivity_score`
- [ ] **Peak Performance Clock** → use `getPeakPerformanceData()`
- [ ] **Trends Card** → use `computeAllTrends()`
- [ ] **Timeline** → use `classifyEventSignificance()` + `groupEventsByDay()`
- [ ] **Insights Section** → use `generatePredictiveInsights()`

### Phase 5: Real-Time Features
- [ ] Live focus score preview during session
- [ ] Burnout risk alerts (if `detectBurnoutPattern()` returns 'high')
- [ ] Milestone notifications (when new milestone detected)

---

## File Structure

```
/lib/analytics/
├── index.ts                     # Main export (use this to import)
├── types.ts                     # TypeScript definitions
├── deepWorkDetector.ts          # Engine 1
├── cognitiveLoadTracker.ts      # Engine 2
├── focusScorer.ts               # Engine 3
├── trendDetector.ts             # Engine 4
├── peakPerformanceFinder.ts     # Engine 5
├── focusConsistency.ts          # Engine 6
├── timelineProcessor.ts         # Engine 7
├── anomalyDetector.ts           # Engine 8
├── milestoneDetector.ts         # Engine 9
└── predictiveInsights.ts        # Engine 10

/docs/
├── ANALYTICS_DATABASE_SCHEMA.md      # SQL schema + migration
└── ANALYTICS_IMPLEMENTATION_GUIDE.md # This file
```

---

## Quick Start: Add Analytics to Existing Component

```typescript
// In your Analytics.tsx component
import {
  computeDeepWorkRatio,
  computeCognitiveLoadEMA,
  computeAllTrends,
  getPeakPerformanceData,
  generatePredictiveInsights,
  detectDayAnomaly,
} from '../lib/analytics';

// Fetch data
const { data: dailyStats } = await supabase
  .from('daily_stats')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: true })
  .limit(30);

// Compute metrics
const dwRatio = computeDeepWorkRatio(dailyStats || []);
const clsEMA = computeCognitiveLoadEMA(
  dailyStats?.map(d => d.cognitive_load_avg || 0) || []
);
const trends = computeAllTrends(dailyStats || []);
const peakData = await getPeakPerformanceData(userId);
const insights = generatePredictiveInsights(dailyStats || [], userModel);

// Render
return (
  <div>
    <h3>Deep Work Ratio: {dwRatio.ratio}%</h3>
    <p>Trend: {dwRatio.trend}</p>
    
    <h3>Cognitive Load: {clsEMA}/10</h3>
    
    <h3>Peak Performance: {peakData?.peakWindowLabel}</h3>
    
    <h3>Insights</h3>
    {insights.map(insight => <p key={insight}>{insight}</p>)}
  </div>
);
```

---

## Testing Without Real Data

Use the sample data generator from `ANALYTICS_DATABASE_SCHEMA.md`:

```sql
-- Generate 30 days of realistic test data
-- Replace YOUR_USER_ID

DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID';
  v_date DATE;
  v_hour INT;
  v_score INT;
BEGIN
  FOR i IN 0..29 LOOP
    v_date := CURRENT_DATE - i;
    v_score := 60 + (RANDOM() * 30)::INT;
    
    INSERT INTO daily_stats (
      user_id, date, productivity_score, deep_work_hours, 
      shallow_work_hours, tasks_completed, avg_session_length_mins,
      deep_work_ratio, cognitive_load_avg
    ) VALUES (
      v_user_id, v_date, v_score, 
      2.0 + (RANDOM() * 3)::FLOAT,
      1.0 + (RANDOM() * 2)::FLOAT,
      4 + (RANDOM() * 4)::INT,
      60 + (RANDOM() * 30)::FLOAT,
      0.55 + (RANDOM() * 0.25)::FLOAT,
      5.0 + (RANDOM() * 3)::FLOAT
    )
    ON CONFLICT (user_id, date) DO NOTHING;
  END LOOP;
  
  -- Generate hourly heatmap data
  FOR v_hour IN 0..23 LOOP
    INSERT INTO hourly_heatmap (
      user_id, hour_slot, day_of_week, avg_focus_score, session_count
    ) VALUES (
      v_user_id, v_hour, 1, -- Monday
      60 + (RANDOM() * 30)::INT,
      (RANDOM() * 10)::INT
    )
    ON CONFLICT (user_id, hour_slot, day_of_week) DO NOTHING;
  END LOOP;
END $$;
```

---

## Performance Notes

- **All engines run in O(n) or O(n log n)** time where n = days of data
- **Incremental updates** (heatmap, rolling averages) are O(1)
- **No external API calls** — everything runs locally
- **Database indexes** ensure fast queries even with years of data
- **Materialized daily_stats** prevents expensive aggregations on every load

---

## What's Next

1. **Implement focus timer UI** (creates the foundation data)
2. **Set up nightly rollup job** (materializes analytics)
3. **Update Analytics components** to use the engines
4. **Add real-time preview** during active sessions
5. **Build notification system** for milestones and burnout warnings

The algorithms are ready. Now you just need to feed them data! 🚀
