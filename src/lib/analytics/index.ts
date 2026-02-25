// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Main Export
// Complete intelligence engine stack
// ═══════════════════════════════════════════════════════════════════════════

// Types
export * from './types';

// Engine 1: Deep Work Detector
export { classifySession, computeDeepWorkRatio, getDeepWorkRatioDisplay } from './deepWorkDetector';

// Engine 2: Cognitive Load Tracker
export {
  computeCognitiveLoadEMA,
  findCLSPeakHour,
  getCLSContextLabel,
  generateCLSSparkline,
  computeCLSPercentile,
} from './cognitiveLoadTracker';

// Engine 3: Focus Scorer
export {
  computeFocusScore,
  computeDailyProductivityScore,
  getScoreLabel,
  explainFocusScore,
} from './focusScorer';

// Engine 4: Trend Detector
export {
  mannKendallTrend,
  computeAllTrends,
  getTrendDisplay,
  linearRegression,
} from './trendDetector';

// Engine 5: Peak Performance Finder
export {
  updateHeatmap,
  getPeakPerformanceData,
  generateClockFaceData,
} from './peakPerformanceFinder';

// Engine 6: Focus Consistency
export {
  computeFocusConsistency,
  computeCurrentStreak,
  getConsistencyPattern,
  predictStreakMaintenance,
} from './focusConsistency';

// Engine 7: Timeline Processor
export {
  classifyEventSignificance,
  generateDaySummary,
  findTimelinePatterns,
  getSignificanceBadge,
  groupEventsByDay,
} from './timelineProcessor';

// Engine 8: Anomaly Detector
export {
  detectDayAnomaly,
  detectBurnoutPattern,
  getAnomalyDisplay,
  getBurnoutRiskDisplay,
} from './anomalyDetector';

// Engine 9: Milestone Detector
export {
  detectMilestones,
  getMilestoneDisplay,
  shouldNotifyMilestone,
} from './milestoneDetector';

// Engine 10: Predictive Insights
export {
  generatePredictiveInsights,
  projectProductivity,
  predictTargetDate,
} from './predictiveInsights';
