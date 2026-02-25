// ═══════════════════════════════════════════════════════════════════════════
// KAAL Local Nudge Template Library
// 100+ templates organized by type and energy tier
// Zero API cost, runs entirely in browser
// ═══════════════════════════════════════════════════════════════════════════

export interface Templates {
  gentle: {
    low: string[];
    medium: string[];
    high: string[];
  };
  active: {
    low: string[];
    medium: string[];
    high: string[];
  };
  intervention: {
    low: string[];
    medium: string[];
    high: string[];
  };
  context_switch: string[];
  break_reminder: string[];
  reengagement_hours: {
    low: string[];
    medium: string[];
    high: string[];
  };
  reengagement_days: string[];
  celebration: string[];
  streak: string[];
}

export const templates: Templates = {
  // ─────────────────────────────────────────────
  // GENTLE (task overdue 0-15 min, no active work)
  // ─────────────────────────────────────────────
  gentle: {
    low: [
      'No pressure — but {task_short} is still waiting when you are ready.',
      'You marked yourself as low energy. That is fine. Even 10 minutes on {task_short} counts.',
      'Small steps still move things forward. {task_short} is at the top of your list.',
      'Running on low? {task_short} does not need your best — it just needs a start.',
      'Even tired minds can make progress. {task_short} is still here.',
      'Low energy days happen. A gentle start on {task_short} is better than zero.',
      'Your list has not changed. {task_short} is still patiently at the top.',
      'One small move: open the tab for {task_short}. That is all.',
      'You said low energy. KAAL says — that is enough to start {task_short}.',
      'Momentum does not need fuel. It just needs a push. {task_short} first.',
    ],
    medium: [
      '{task_short} is up next. You have {mins} minutes estimated — that is very doable.',
      'Your session is ready. {task_short} is at the top. Whenever you are.',
      'KAAL has {task_short} ranked highest for your current state. Ready when you are.',
      'Nothing urgent — just a nudge. {task_short} is waiting.',
      '{task_short} has been sitting at the top for a while now. Small nudge.',
      'Steady energy, good task match. {task_short} makes sense right now.',
      'This {time_of_day} feels right for {task_short}. Just saying.',
      'You have got {mins} minutes of work ahead on {task_short}. Not bad.',
      'KAAL thinks {task_short} fits your current state well. Worth a try.',
      'A gentle tap on the shoulder: {task_short} is still at the top.',
    ],
    high: [
      'Your energy is high right now. {task_short} deserves it.',
      'Peak state, top task. {task_short} is waiting for exactly this moment.',
      'High energy and {task_short} at the top. This is the ideal match.',
      'Do not waste this — {task_short} needs the version of you that exists right now.',
      'KAAL rarely sees this alignment. High energy + {task_short}. Go.',
      '{task_short} is a {mins}-minute task. Your energy is high. The math is obvious.',
      'You are in the zone. {task_short} is the move.',
      'This {time_of_day} energy will not last forever. {task_short} now.',
      'High energy is a limited resource. {task_short} is the best use of it.',
      'You said high energy. KAAL says — do not let {task_short} wait any longer.',
    ],
  },

  // ─────────────────────────────────────────────
  // ACTIVE (task overdue 15-45 min)
  // ─────────────────────────────────────────────
  active: {
    low: [
      '{task_short} is {overdue} minutes behind. Even a slow start is still a start.',
      'Running late on {task_short}. Low energy is not an excuse — it is a reason to start small.',
      '{task_short} has been waiting {overdue} minutes. You do not have to sprint. Just begin.',
      'Low energy + {overdue} minutes late. The longer you wait, the harder it gets. Start now.',
      'KAAL is not judging — but {task_short} is {overdue} minutes overdue. One step.',
    ],
    medium: [
      '{task_short} is {overdue} minutes overdue. Time to move.',
      'You are falling behind on {task_short}. {overdue} minutes gone. Start now.',
      'KAAL has been watching {task_short} slide. {overdue} minutes late. Fix it.',
      '{overdue} minutes overdue on {task_short}. This is the active nudge. Open it.',
      'Your schedule slipped by {overdue} minutes. {task_short} needs you now.',
      'Not a gentle tap anymore — {task_short} is {overdue} minutes late.',
      'The gap between planned and actual is {overdue} minutes. Close it with {task_short}.',
      'KAAL recommends immediate action on {task_short}. {overdue} minutes behind.',
      '{task_short} has been delayed {overdue} minutes. Every minute you wait adds pressure.',
      'Steady state, real deadline. {task_short} is {overdue} minutes overdue. Go.',
    ],
    high: [
      'You are {overdue} minutes late on {task_short} with high energy. That is a waste. Fix it.',
      'High energy and {overdue} minutes behind on {task_short}. No excuses. Start.',
      '{task_short} has been waiting {overdue} minutes. Your energy is at its peak. Unacceptable to wait.',
      'KAAL is not subtle anymore. {task_short}. {overdue} minutes late. High energy. Go now.',
      'You have exactly the energy {task_short} needs. You are {overdue} minutes behind. Move.',
    ],
  },

  // ─────────────────────────────────────────────
  // INTERVENTION (task overdue 45+ min)
  // ─────────────────────────────────────────────
  intervention: {
    low: [
      '{task_short} is {overdue} minutes overdue. Even low energy can handle 10 minutes. Start or reschedule.',
      'You are {overdue} minutes behind on {task_short}. Low energy is real but this cannot wait. Decide now.',
      'KAAL needs a decision: start {task_short} or reschedule it. {overdue} minutes have already gone.',
    ],
    medium: [
      '{task_short} is {overdue} minutes overdue. KAAL needs you to act — start it or move it.',
      '{overdue} minutes behind on {task_short}. This is not a nudge anymore. It is a decision point.',
      'KAAL intervention: {task_short} has slipped {overdue} minutes. Start now or reschedule.',
      'Your day is off track by {overdue} minutes on {task_short} alone. Time to course-correct.',
      '{task_short} is {overdue} minutes late. Every minute of inaction compounds. Choose.',
    ],
    high: [
      '{overdue} minutes late. High energy. {task_short} still undone. This is not acceptable. Act.',
      'KAAL does not understand — you have high energy and {task_short} is {overdue} minutes overdue.',
      'High energy, {overdue} minutes wasted. {task_short} needs you to make a decision right now.',
    ],
  },

  // ─────────────────────────────────────────────
  // CONTEXT SWITCH (energy just dropped)
  // ─────────────────────────────────────────────
  context_switch: [
    'Your energy just shifted. KAAL has found a better task for where you are now.',
    'Energy drop detected. Switching to a lighter task makes more sense than forcing it.',
    'KAAL noticed your energy changed. Here is a better match for how you feel right now.',
    'Forcing deep work on low energy is a fast track to nothing. KAAL has a better option.',
    'Your state changed. KAAL changed the plan. Here is what fits better right now.',
    'Energy shifted. Your task list just got re-ranked. New top pick ready.',
    'Working against your energy is inefficient. KAAL found a task that fits this state.',
    'Low energy does not mean no work. It means different work. KAAL has a suggestion.',
  ],

  // ─────────────────────────────────────────────
  // BREAK REMINDER (90+ min in session)
  // ─────────────────────────────────────────────
  break_reminder: [
    'You have been at this for over 90 minutes. A 10-minute break will make the next hour better.',
    'Cognitive fatigue is real. 90 minutes in — step away for 10. KAAL will be here.',
    'Your brain has been running for 90+ minutes. Rest is not laziness. It is strategy.',
    '90 minutes of focus deserves a break. Take 10. Come back sharper.',
    'KAAL insists: 90 minutes is long enough. Rest now so the next block counts.',
    'You have been working hard. 90 minutes in. A short break is the highest-leverage thing right now.',
    'Science says cognitive output drops after 90 minutes. KAAL agrees. Take a break.',
    'Long session detected. Breaks are not optional — they are part of the system. Take one.',
  ],

  // ─────────────────────────────────────────────
  // RE-ENGAGEMENT — HOURS (user gone 3–23 hours)
  // ─────────────────────────────────────────────
  reengagement_hours: {
    low: [
      'You left {inactive_hrs} hours ago. Your tasks have not moved. A check-in takes 10 seconds.',
      'Low energy earlier — hopefully things have shifted. Come back and tell KAAL.',
      'It has been {inactive_hrs} hours. How are you feeling now? A quick check-in is all it takes.',
      'KAAL has been keeping your tasks warm for {inactive_hrs} hours. Ready when you are.',
      'No pressure — but {inactive_hrs} hours is a long gap. Your list is waiting.',
    ],
    medium: [
      'You have been gone {inactive_hrs} hours. {task_short} is still at the top of your list.',
      '{inactive_hrs} hours since your last session. Your tasks did not do themselves.',
      'KAAL noticed you left. {inactive_hrs} hours ago. Your session is ready to resume.',
      'Life happens. But {inactive_hrs} hours is enough of a break. Come back.',
      'Your tasks are exactly where you left them. {inactive_hrs} hours ago. Time to continue.',
      '{inactive_hrs} hours offline. {task_short} is still first in the queue.',
      'KAAL held your session for {inactive_hrs} hours. Still fresh. Come finish it.',
      'You were on a roll. Then {inactive_hrs} hours happened. Pick it back up.',
    ],
    high: [
      '{inactive_hrs} hours is a long pause for someone with a full task list. Come back.',
      'KAAL does not know what happened in the last {inactive_hrs} hours. But your tasks do not care. Come back.',
      'You had high energy earlier. {inactive_hrs} hours later — still have it? Prove it.',
      '{inactive_hrs} hours away. {task_short} is waiting. Your streak is still alive.',
    ],
  },

  // ─────────────────────────────────────────────
  // RE-ENGAGEMENT — DAYS (user gone 2+ days)
  // ─────────────────────────────────────────────
  reengagement_days: [
    '{inactive_days} days away. KAAL has been rearranging your tasks in your absence.',
    'It has been {inactive_days} days. Your tasks formed a committee. They want you back.',
    '{inactive_days} days is a long time. Your list is patient but your deadlines are not.',
    'KAAL missed you. Your tasks did not miss you — they are annoyed. Come back.',
    '{inactive_days} days offline. Some of your tasks may have grown feelings about it.',
    'The good news: your tasks are still here after {inactive_days} days. The bad news: same.',
    '{inactive_days} days gone. The tasks waited. KAAL waited. Now it is your turn.',
    'Absence noted: {inactive_days} days. KAAL is not judging. Just flagging.',
    'Your task list is a snapshot of {inactive_days} days ago. A lot can change. Come update it.',
    'It has been {inactive_days} days. Your to-do list has started filing complaints.',
    'KAAL fact: tasks completed while you are away = 0. Days since you left = {inactive_days}.',
    '{inactive_days} days. Whatever pulled you away, KAAL is here when you come back.',
    'Gentle reminder: your goals do not take days off. You have been gone {inactive_days}.',
    'Even the most organized plans need the person behind them. {inactive_days} days, come back.',
    'Your {inactive_days}-day break is noted. Your tasks are unmoved and unimpressed.',
  ],

  // ─────────────────────────────────────────────
  // CELEBRATION (user completed 3+ tasks or hit a milestone)
  // ─────────────────────────────────────────────
  celebration: [
    '{done_today} tasks done today. That is a real day. KAAL noticed.',
    'You cleared {done_today} tasks today. Most people manage half that. Good session.',
    '{done_today} tasks completed. KAAL is quietly impressed.',
    'Solid {time_of_day}: {done_today} tasks done. The momentum is real.',
    'You showed up on a {day} and cleared {done_today} tasks. Not nothing.',
    '{done_today} down. KAAL has the next batch ready when you are.',
    'A {done_today}-task {time_of_day}. KAAL logs this as a good day.',
    'Progress report: {done_today} tasks done. The score is in your favor.',
    'KAAL summary: you were productive today. {done_today} tasks say so.',
    'You did not have to show up today. But you did. And cleared {done_today} tasks.',
  ],

  // ─────────────────────────────────────────────
  // STREAK (user has check-in streak 3+ days)
  // ─────────────────────────────────────────────
  streak: [
    '{streak} days in a row. KAAL is starting to understand how you work.',
    'Day {streak} of your streak. Consistency is the part most people skip.',
    '{streak}-day check-in streak. The system is getting smarter about you.',
    'You have shown up {streak} days straight. KAAL has noticed the pattern.',
    '{streak} days of data. KAAL is more useful today than it was on day 1.',
    'Streak: {streak} days. This is how KAAL learns to work for you.',
    '{streak} consecutive days. The longer the streak, the better KAAL gets.',
    'Day {streak}. Most people stop before this. You have not.',
  ],
};
