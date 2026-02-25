/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  KAAL Predictive Risk Engine                              ║
 * ║                                                           ║
 * ║  Forward-looking analysis — identifies problems BEFORE    ║
 * ║  they become emergencies.                                 ║
 * ║                                                           ║
 * ║  ─ Deadline risk: probability of missing a deadline       ║
 * ║    given current velocity vs. work remaining              ║
 * ║  ─ Procrastination fingerprint: which tasks show          ║
 * ║    avoidance patterns based on creation age vs. status    ║
 * ║  ─ Workload feasibility: can this week actually be done?  ║
 * ║  ─ Cascade risk: if A slips, B and C are at risk too      ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

// ─── Input type ───────────────────────────────────────────────────────────────

export interface TaskForRisk {
  id:                string;
  title:             string;
  priority:          'low' | 'medium' | 'high' | 'urgent';
  status:            string;
  dueDate?:          string | null;
  estimatedMinutes?: number;
  createdAt?:        string;
  tags?:             string[];
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface DeadlineRisk {
  taskId:        string;
  taskTitle:     string;
  riskLevel:     RiskLevel;
  riskScore:     number;      // 0–1
  reason:        string;
  daysUntilDue?: number;
  hoursNeeded?:  number;
}

export interface ProcrastinationSignal {
  taskId:    string;
  taskTitle: string;
  daysStale: number;
  urgency:   number;   // 0–1
  pattern:   'avoiding_complexity' | 'avoiding_ambiguity' | 'deadline_proximity' | 'low_motivation' | 'unknown';
  message:   string;
}

export interface WorkloadAssessment {
  feasible:              boolean;
  totalEstimatedHours:   number;
  availableHours:        number;
  overloadHours:         number;
  atRiskTaskCount:       number;
  recommendation:        string;
  confidence:            number;  // 0–1 (how many tasks have estimates)
}

export interface RiskSummary {
  overallRisk:      RiskLevel;
  deadlineRisks:    DeadlineRisk[];
  procrastinations: ProcrastinationSignal[];
  workload:         WorkloadAssessment;
  topInsight:       string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  return (new Date(dateStr).getTime() - Date.now()) / 86400000;
}

function estimateHours(task: TaskForRisk): number {
  if (task.estimatedMinutes) return task.estimatedMinutes / 60;
  // Heuristic if no estimate
  return { urgent: 3, high: 2, medium: 1.5, low: 0.75 }[task.priority];
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 0.85) return 'critical';
  if (score >= 0.65) return 'high';
  if (score >= 0.40) return 'medium';
  if (score >= 0.15) return 'low';
  return 'none';
}

// ─── Engine ───────────────────────────────────────────────────────────────────

class PredictiveRiskEngine {

  /** Full risk assessment across all active tasks */
  assess(
    tasks: TaskForRisk[],
    velocity: { tasksPerDay: number; focusHoursPerDay: number },
  ): RiskSummary {
    const pending = tasks.filter(
      t => t.status !== 'completed' && t.status !== 'archived' && t.status !== 'cancelled',
    );

    const deadlineRisks    = this.assessDeadlines(pending, velocity);
    const procrastinations = this.detectProcrastination(pending);
    const workload         = this.assessWorkload(pending, velocity);

    const maxScore = Math.max(
      ...deadlineRisks.map(r => r.riskScore),
      workload.feasible ? 0 : 0.7,
      0,
    );

    return {
      overallRisk:   toRiskLevel(maxScore),
      deadlineRisks,
      procrastinations,
      workload,
      topInsight: this.buildTopInsight(deadlineRisks, procrastinations, workload, pending),
    };
  }

  // ── Deadline scoring ─────────────────────────────────────────────────────────

  private assessDeadlines(
    tasks: TaskForRisk[],
    velocity: { tasksPerDay: number; focusHoursPerDay: number },
  ): DeadlineRisk[] {
    const risks: DeadlineRisk[] = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const days = daysUntil(task.dueDate);
      if (days > 30) continue;  // too far out

      if (days < -1) {
        // Already overdue
        risks.push({
          taskId:       task.id,
          taskTitle:    task.title,
          riskLevel:    'critical',
          riskScore:    1.0,
          reason:       `Overdue by ${Math.abs(Math.floor(days))} day${Math.abs(Math.floor(days)) !== 1 ? 's' : ''}`,
          daysUntilDue: days,
          hoursNeeded:  estimateHours(task),
        });
        continue;
      }

      const hoursNeeded    = estimateHours(task);
      const hoursAvailable = Math.max(days * velocity.focusHoursPerDay, 0.5);
      const pressureRatio  = hoursNeeded / hoursAvailable;

      const priorityBoost = task.priority === 'urgent' ? 0.15
                          : task.priority === 'high'   ? 0.08 : 0;
      const imminence     = days <= 1 ? 0.30
                          : days <= 3 ? 0.15
                          : days <= 7 ? 0.05 : 0;

      const riskScore = Math.min(pressureRatio * 0.6 + priorityBoost + imminence, 1);

      if (riskScore >= 0.15) {
        const daysLabel = days <= 1 ? 'today' : days <= 2 ? 'tomorrow' : `in ${Math.floor(days)} days`;
        risks.push({
          taskId:       task.id,
          taskTitle:    task.title,
          riskLevel:    toRiskLevel(riskScore),
          riskScore,
          reason:       `Due ${daysLabel} — needs ~${hoursNeeded.toFixed(1)}h, ${hoursAvailable.toFixed(1)}h available at current pace`,
          daysUntilDue: days,
          hoursNeeded,
        });
      }
    }

    return risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  }

  // ── Procrastination detection ────────────────────────────────────────────────

  private detectProcrastination(tasks: TaskForRisk[]): ProcrastinationSignal[] {
    const signals: ProcrastinationSignal[] = [];

    for (const task of tasks) {
      if (!task.createdAt) continue;
      const daysOld = (Date.now() - new Date(task.createdAt).getTime()) / 86400000;
      if (daysOld < 2) continue;  // too new

      const isHighPri = task.priority === 'high' || task.priority === 'urgent';
      const daysLeft  = task.dueDate ? daysUntil(task.dueDate) : Infinity;
      const procRatio = isFinite(daysLeft) ? daysOld / Math.max(daysOld + daysLeft, 1) : 0;

      // High-priority: untouched after 2 days
      if (isHighPri && daysOld >= 2 && task.status === 'pending') {
        const pattern = this.inferPattern(task);
        signals.push({
          taskId:    task.id,
          taskTitle: task.title,
          daysStale: Math.floor(daysOld),
          urgency:   0.8,
          pattern,
          message:   this.buildMessage(task.title, Math.floor(daysOld), pattern),
        });
      }
      // Medium: stale more than 5 days and deadline is approaching
      else if (daysOld >= 5 && task.status === 'pending' && procRatio > 0.65) {
        signals.push({
          taskId:    task.id,
          taskTitle: task.title,
          daysStale: Math.floor(daysOld),
          urgency:   0.5,
          pattern:   'low_motivation',
          message:   `"${task.title}" has sat untouched for ${Math.floor(daysOld)} days. Is it actually a priority, or should it be dropped?`,
        });
      }
    }

    return signals.slice(0, 3);
  }

  private inferPattern(task: TaskForRisk): ProcrastinationSignal['pattern'] {
    if (!task.estimatedMinutes || task.estimatedMinutes > 120) return 'avoiding_complexity';
    if (!task.tags || task.tags.length === 0)                  return 'avoiding_ambiguity';
    if (task.dueDate && daysUntil(task.dueDate) < 3)           return 'deadline_proximity';
    return 'unknown';
  }

  private buildMessage(title: string, days: number, pattern: ProcrastinationSignal['pattern']): string {
    switch (pattern) {
      case 'avoiding_complexity':
        return `"${title}" untouched for ${days} days. Looks like complexity avoidance — try spending just 10 min breaking it into smaller steps.`;
      case 'avoiding_ambiguity':
        return `"${title}" has sat for ${days} days — possibly because it's too vague. Defining the first action often unlocks it.`;
      case 'deadline_proximity':
        return `"${title}" is ${days} days old and now urgent. The deadline is forcing what was easy to ignore.`;
      default:
        return `"${title}" hasn't been touched in ${days} days. Start it, defer it, or delete it — ambiguity has a cost.`;
    }
  }

  // ── Workload feasibility ─────────────────────────────────────────────────────

  assessWorkload(
    tasks: TaskForRisk[],
    velocity: { tasksPerDay: number; focusHoursPerDay: number },
  ): WorkloadAssessment {
    const pending = tasks.filter(
      t => t.status !== 'completed' && t.status !== 'archived',
    );

    const withEstimates = pending.filter(t => t.estimatedMinutes);
    const confidence    = pending.length > 0 ? withEstimates.length / pending.length : 0;
    const totalHours    = pending.reduce((s, t) => s + estimateHours(t), 0);

    // Remaining productive hours this week
    const dow          = new Date().getDay();
    const daysLeft     = dow === 0 ? 5 : Math.max(5 - dow + 1, 1);
    const available    = daysLeft * velocity.focusHoursPerDay;
    const overload     = Math.max(totalHours - available, 0);
    const feasible     = overload === 0;
    const atRiskCount  = pending.filter(t => t.dueDate && daysUntil(t.dueDate) < 7).length;

    let recommendation: string;
    if (!feasible) {
      recommendation = `~${totalHours.toFixed(0)}h of work vs ${available.toFixed(0)}h available. Drop or defer ${Math.ceil(overload / 1.5)} tasks to make the week realistic.`;
    } else if (totalHours > available * 0.8) {
      recommendation = `Week is packed — ${totalHours.toFixed(0)}h of work vs ${available.toFixed(0)}h available. No buffer for interruptions.`;
    } else {
      recommendation = `Workload looks manageable — ${totalHours.toFixed(0)}h across ${available.toFixed(0)}h available.`;
    }

    return { feasible, totalEstimatedHours: totalHours, availableHours: available,
             overloadHours: overload, atRiskTaskCount: atRiskCount, recommendation, confidence };
  }

  // ── Top insight summary ──────────────────────────────────────────────────────

  private buildTopInsight(
    risks: DeadlineRisk[],
    procs: ProcrastinationSignal[],
    wl:   WorkloadAssessment,
    pending: TaskForRisk[],
  ): string {
    const critical = risks.find(r => r.riskLevel === 'critical');
    if (critical) return `"${critical.taskTitle}" is overdue — this is the top priority right now.`;

    const high = risks.find(r => r.riskLevel === 'high');
    if (high) return `"${high.taskTitle}" is at high risk of being late. ${high.reason}.`;

    if (!wl.feasible) return wl.recommendation;

    const topP = procs[0];
    if (topP) return topP.message;

    if (risks.length > 0) return `${risks.length} task${risks.length > 1 ? 's' : ''} on the risk radar this week.`;

    return `${pending.length} tasks in queue — workload is currently manageable.`;
  }
}

export const predictiveRisk = new PredictiveRiskEngine();
