/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAAL Task Intelligence                                      ║
 * ║                                                              ║
 * ║  Deeply analyses any task and:                               ║
 * ║    1. Identifies what TYPE of task it is                     ║
 * ║    2. Deconstructs it into concrete, achievable subtasks     ║
 * ║    3. Identifies the ONE thing to start with right now       ║
 * ║    4. For learning/exam tasks → builds a full study plan     ║
 * ║    5. Suggests specific resources (videos, books, tools)     ║
 * ║                                                              ║
 * ║  Philosophy: Big tasks feel impossible because the brain     ║
 * ║  tries to hold the whole thing at once. The agent's job      ║
 * ║  is to reduce every task to the next physical action.        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'exam_prep' | 'learning' | 'writing' | 'code' | 'project'
  | 'meeting_prep' | 'administrative' | 'creative' | 'research' | 'health' | 'communication' | 'generic';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  order: number;
  isStartHere: boolean;  // The single best first action
  startHereReason?: string;
  phaseLabel?: string;   // e.g. "Phase 1: Foundation"
  tip?: string;          // ADHD-specific tip for this step
}

export interface Resource {
  type: 'video' | 'article' | 'book' | 'practice' | 'tool' | 'course';
  title: string;
  source: string;
  url?: string;
  why: string;  // Why KAAL is recommending this
  priority: 'essential' | 'recommended' | 'optional';
  timeMinutes?: number;
}

export interface StudySession {
  day: number;         // Day 1, 2, 3...
  date?: string;       // ISO date if exam date known
  topic: string;
  subtopics: string[];
  estimatedHours: number;
  difficulty: Difficulty;
  resources: Resource[];
  focusType: 'introduction' | 'deep_practice' | 'review' | 'mock_test';
}

export interface StudyPlan {
  subject: string;
  totalDays: number;
  hoursPerDay: number;
  daysUntilExam: number;
  sessions: StudySession[];
  quickReviewTopics: string[];   // Topics to scan 1 day before
  examDayTips: string[];
  estimatedReadiness: number;    // 0-100 if plan is followed
}

export interface TaskAnalysis {
  originalTitle: string;
  type: TaskType;
  complexity: 'simple' | 'moderate' | 'complex' | 'massive';
  estimatedTotalMinutes: number;
  whyHard: string;               // Why this task feels daunting
  subtasks: SubTask[];
  startHereTask: SubTask;        // The single first action
  startHereContext: string;      // Full explanation of why to start here
  studyPlan?: StudyPlan;         // Only for exam_prep / learning
  resources: Resource[];
  timeboxSuggestion: string;     // e.g. "25 min Pomodoro to start"
  adhdTip: string;               // Specific ADHD executive function tip
}

// ─── Curriculum knowledge base ────────────────────────────────────────────────

interface SubjectTopics {
  topics: { name: string; days: number; difficulty: Difficulty; keywords: string[] }[];
  resources: Resource[];
}

const SUBJECT_KB: Record<string, SubjectTopics> = {
  'data structures': {
    topics: [
      { name: 'Arrays & Strings',      days: 1,   difficulty: 'easy',   keywords: ['array', 'string', 'index', 'slice'] },
      { name: 'Linked Lists',          days: 1,   difficulty: 'medium', keywords: ['linked', 'node', 'pointer', 'list'] },
      { name: 'Stacks & Queues',       days: 0.5, difficulty: 'easy',   keywords: ['stack', 'queue', 'LIFO', 'FIFO'] },
      { name: 'Trees & Binary Trees',  days: 1.5, difficulty: 'medium', keywords: ['tree', 'binary', 'root', 'leaf'] },
      { name: 'Binary Search Trees',   days: 1,   difficulty: 'medium', keywords: ['BST', 'search tree', 'balance'] },
      { name: 'Hash Tables',           days: 1,   difficulty: 'medium', keywords: ['hash', 'map', 'dictionary', 'collision'] },
      { name: 'Heaps & Priority Queue',days: 0.5, difficulty: 'medium', keywords: ['heap', 'priority', 'min heap', 'max heap'] },
      { name: 'Graphs',                days: 1.5, difficulty: 'hard',   keywords: ['graph', 'vertex', 'edge', 'directed'] },
      { name: 'BFS & DFS',             days: 1,   difficulty: 'hard',   keywords: ['BFS', 'DFS', 'breadth', 'depth', 'traversal'] },
      { name: 'Sorting Algorithms',    days: 1,   difficulty: 'medium', keywords: ['sort', 'merge', 'quick', 'bubble', 'heap sort'] },
      { name: 'Dynamic Programming',   days: 2,   difficulty: 'hard',   keywords: ['DP', 'dynamic', 'memoization', 'tabulation'] },
    ],
    resources: [
      { type: 'video', title: 'Data Structures Easy to Advanced – Full Tutorial', source: 'freeCodeCamp / YouTube', url: 'https://youtube.com/watch?v=RBSGKlAvoiM', why: 'Best single-video overview for exam prep', priority: 'essential', timeMinutes: 480 },
      { type: 'practice', title: 'LeetCode — Data Structures Study Plan', source: 'LeetCode', url: 'https://leetcode.com/study-plan/data-structure/', why: 'Practice problems organised by topic — do 3-5 per topic', priority: 'essential' },
      { type: 'article', title: 'Visualgo — Algorithm Visualizer', source: 'visualgo.net', url: 'https://visualgo.net', why: 'Seeing algorithms visually cements understanding better than code alone', priority: 'recommended' },
      { type: 'book', title: 'Cracking the Coding Interview', source: 'Gayle L. McDowell', why: 'Chapter-by-chapter DS review with worked problems', priority: 'recommended' },
      { type: 'video', title: 'NeetCode 150 — Structured DS Practice', source: 'NeetCode / YouTube', url: 'https://neetcode.io', why: 'Structured video explanations for every major DS pattern', priority: 'recommended' },
    ],
  },
  'algorithms': {
    topics: [
      { name: 'Big-O Notation & Complexity',   days: 0.5, difficulty: 'easy',   keywords: ['big O', 'complexity', 'time', 'space'] },
      { name: 'Divide and Conquer',             days: 1,   difficulty: 'medium', keywords: ['divide', 'conquer', 'merge sort', 'binary search'] },
      { name: 'Greedy Algorithms',              days: 1,   difficulty: 'medium', keywords: ['greedy', 'optimal', 'activity selection'] },
      { name: 'Dynamic Programming',            days: 2,   difficulty: 'hard',   keywords: ['DP', 'dynamic', 'knapsack', 'LCS', 'memoization'] },
      { name: 'Graph Algorithms',               days: 1.5, difficulty: 'hard',   keywords: ['Dijkstra', 'Bellman', 'Kruskal', 'Prim', 'Floyd'] },
      { name: 'Backtracking',                   days: 1,   difficulty: 'hard',   keywords: ['backtrack', 'N-queens', 'maze', 'permutation'] },
      { name: 'String Algorithms',              days: 0.5, difficulty: 'medium', keywords: ['KMP', 'Rabin-Karp', 'trie', 'substring'] },
    ],
    resources: [
      { type: 'course', title: 'Algorithms Specialization — Stanford', source: 'Coursera', url: 'https://coursera.org/specializations/algorithms', why: 'Most rigorous algorithm course available online', priority: 'essential' },
      { type: 'book', title: 'Introduction to Algorithms (CLRS)', source: 'MIT Press', why: 'The definitive reference — use for specific chapters, not cover-to-cover', priority: 'recommended' },
      { type: 'practice', title: 'HackerRank Algorithm Practice', source: 'HackerRank', url: 'https://hackerrank.com/domains/algorithms', why: 'Graded problem sets with hints', priority: 'recommended' },
    ],
  },
  'calculus': {
    topics: [
      { name: 'Limits & Continuity',     days: 1,   difficulty: 'medium', keywords: ['limit', 'continuity', 'L\'Hopital'] },
      { name: 'Derivatives',             days: 1.5, difficulty: 'medium', keywords: ['derivative', 'chain rule', 'product rule', 'quotient'] },
      { name: 'Applications of Derivatives', days: 1, difficulty: 'medium', keywords: ['optimization', 'related rates', 'curve sketching'] },
      { name: 'Integrals',               days: 1.5, difficulty: 'hard',   keywords: ['integral', 'antiderivative', 'Riemann', 'fundamental theorem'] },
      { name: 'Techniques of Integration', days: 1, difficulty: 'hard',   keywords: ['u-substitution', 'parts', 'partial fractions', 'trig'] },
      { name: 'Series & Sequences',      days: 1,   difficulty: 'hard',   keywords: ['series', 'Taylor', 'Maclaurin', 'convergence'] },
    ],
    resources: [
      { type: 'video', title: '3Blue1Brown — Essence of Calculus', source: 'YouTube', url: 'https://youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr', why: 'Builds deep intuition before grinding problems — watch before studying', priority: 'essential', timeMinutes: 240 },
      { type: 'practice', title: 'Khan Academy Calculus', source: 'khanacademy.org', url: 'https://khanacademy.org/math/calculus-1', why: 'Best free structured practice with immediate feedback', priority: 'essential' },
      { type: 'tool', title: 'Wolfram Alpha Step-by-step', source: 'wolframalpha.com', why: 'See full solution steps for any problem you\'re stuck on', priority: 'recommended' },
    ],
  },
  'machine learning': {
    topics: [
      { name: 'Linear & Logistic Regression', days: 1.5, difficulty: 'medium', keywords: ['regression', 'classification', 'gradient descent'] },
      { name: 'Decision Trees & Random Forests', days: 1, difficulty: 'medium', keywords: ['decision tree', 'random forest', 'ensemble'] },
      { name: 'Neural Networks Basics',        days: 2,   difficulty: 'hard',   keywords: ['neural', 'perceptron', 'backprop', 'activation'] },
      { name: 'CNNs & Computer Vision',        days: 1.5, difficulty: 'hard',   keywords: ['CNN', 'convolution', 'image', 'pooling'] },
      { name: 'Evaluation & Metrics',          days: 0.5, difficulty: 'easy',   keywords: ['accuracy', 'precision', 'recall', 'F1', 'ROC'] },
      { name: 'Feature Engineering',           days: 1,   difficulty: 'medium', keywords: ['feature', 'normalization', 'encoding', 'selection'] },
    ],
    resources: [
      { type: 'course', title: 'Machine Learning Specialization — Andrew Ng', source: 'Coursera', url: 'https://coursera.org/specializations/machine-learning-introduction', why: 'The most trusted ML foundations course in the world', priority: 'essential' },
      { type: 'practice', title: 'Kaggle — ML Practice Competitions', source: 'kaggle.com', url: 'https://kaggle.com/competitions', why: 'Apply concepts on real datasets', priority: 'recommended' },
      { type: 'tool', title: 'Scikit-learn Documentation', source: 'scikit-learn.org', why: 'The reference for practical ML implementation', priority: 'essential' },
    ],
  },
  'operating systems': {
    topics: [
      { name: 'Processes & Threads',      days: 1,   difficulty: 'medium', keywords: ['process', 'thread', 'PCB', 'context switch'] },
      { name: 'CPU Scheduling',           days: 1,   difficulty: 'medium', keywords: ['scheduling', 'FCFS', 'SJF', 'round robin', 'priority'] },
      { name: 'Memory Management',        days: 1.5, difficulty: 'hard',   keywords: ['paging', 'segmentation', 'virtual memory', 'page fault'] },
      { name: 'Deadlocks',                days: 1,   difficulty: 'medium', keywords: ['deadlock', 'Banker\'s algorithm', 'mutual exclusion'] },
      { name: 'File Systems',             days: 0.5, difficulty: 'easy',   keywords: ['file system', 'inode', 'FAT', 'directory'] },
      { name: 'I/O & Disk Scheduling',    days: 0.5, difficulty: 'medium', keywords: ['I/O', 'disk', 'SCAN', 'SSTF', 'buffering'] },
    ],
    resources: [
      { type: 'book', title: 'Operating Systems: Three Easy Pieces', source: 'ostep.org', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', why: 'Free, excellent, chapter-by-chapter matches exam topics perfectly', priority: 'essential' },
      { type: 'video', title: 'Gate Smashers — OS Playlist', source: 'YouTube', why: 'Exam-focused explanations with worked examples', priority: 'recommended' },
    ],
  },
  'default': {
    topics: [],
    resources: [
      { type: 'article', title: 'Search for topic on Wikipedia', source: 'Wikipedia', why: 'Quick structured overview before diving deeper', priority: 'essential' },
      { type: 'video', title: 'Search on YouTube for "[topic] explained"', source: 'YouTube', why: 'Visual explanations first, then text', priority: 'recommended' },
      { type: 'practice', title: 'Anki — Flashcard practice', source: 'apps.ankiweb.net', url: 'https://apps.ankiweb.net', why: 'Spaced repetition locks in facts before an exam', priority: 'recommended' },
    ],
  },
};

// ─── Task pattern templates ───────────────────────────────────────────────────

type TaskTemplate = { subtasks: Omit<SubTask, 'id'>[]; whyHard: string; adhdTip: string; timeboxSuggestion: string };

const TASK_TEMPLATES: Record<TaskType, (title: string) => TaskTemplate> = {
  exam_prep: (title) => ({
    whyHard: "Exam prep feels like an infinite task because the topic has no clear end. The secret: work topic by topic, not hour by hour.",
    adhdTip: "Use the Pomodoro method specifically here — 25 min per sub-topic, 5 min review. Time pressure activates focus for ADHD brains.",
    timeboxSuggestion: "Start with a 25-min Pomodoro on the first topic only",
    subtasks: [
      { title: `Map what you need to study`, description: `List every topic/chapter that could be on the exam. Don't study yet — just map.`, estimatedMinutes: 15, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'You can\'t plan a journey without a map. 15 minutes here saves hours of inefficient studying.', tip: 'Just write topic names, nothing else — resist the urge to study yet', phaseLabel: 'Phase 1: Scope' },
      { title: `Rate your confidence per topic (1-5)`, description: `Go through your list and rate each topic 1-5. 1 = no idea, 5 = confident.`, estimatedMinutes: 10, difficulty: 'easy', order: 2, isStartHere: false, tip: 'Be honest — rating yourself high when you\'re not costs exam marks', phaseLabel: 'Phase 1: Scope' },
      { title: `Build a study schedule (KAAL can generate this)`, description: `Allocate days/sessions per topic, starting with your weakest (rated 1-2) first.`, estimatedMinutes: 15, difficulty: 'easy', order: 3, isStartHere: false, phaseLabel: 'Phase 2: Plan' },
      { title: `First study session — lowest confidence topic`, description: `Start with your hardest topic while your mind is fresh. One topic at a time.`, estimatedMinutes: 50, difficulty: 'hard', order: 4, isStartHere: false, tip: 'Set a timer. When it rings, stop and do a quick quiz on what you just learned', phaseLabel: 'Phase 2: Study' },
      { title: `Make flashcards / summary notes per topic`, description: `As you finish each topic, write 5-10 key facts as flashcards or bullet notes.`, estimatedMinutes: 20, difficulty: 'medium', order: 5, isStartHere: false, phaseLabel: 'Phase 2: Study' },
      { title: `Practice problems / past papers`, description: `After covering all topics, do past exam questions under timed conditions.`, estimatedMinutes: 90, difficulty: 'hard', order: 6, isStartHere: false, phaseLabel: 'Phase 3: Practice' },
      { title: `Final review — flashcards only`, description: `1 day before the exam, only review your flashcards and notes. No new material.`, estimatedMinutes: 45, difficulty: 'easy', order: 7, isStartHere: false, phaseLabel: 'Phase 4: Review' },
    ],
  }),
  learning: (title) => ({
    whyHard: "Learning without a clear end state feels endless. The fix: define what 'done' looks like before you start.",
    adhdTip: "Alternate between reading/watching (15min) and doing/practising (15min). Active recall consolidates far better than passive review.",
    timeboxSuggestion: "Start with a 20-min exploration session — no pressure to understand, just get familiar",
    subtasks: [
      { title: `Define what success looks like`, description: `Write one sentence: "I'll know I've learned this when I can ___"`, estimatedMinutes: 10, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Without a clear destination, learning feels infinite. One sentence changes this.', phaseLabel: 'Phase 1: Define' },
      { title: `Find 2-3 good resources (KAAL can suggest)`, description: `Don't start consuming yet — just identify the best source per format (video, text, practice).`, estimatedMinutes: 15, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Phase 1: Define' },
      { title: `First pass — 20 min exploration`, description: `Skim one resource. Goal: understand the shape of the topic, not master it.`, estimatedMinutes: 20, difficulty: 'easy', order: 3, isStartHere: false, tip: 'Read/watch at 1.5x. Write questions that come up, not notes', phaseLabel: 'Phase 2: Explore' },
      { title: `Deep dive — core concept`, description: `Pick the most important concept and understand it fully before moving on.`, estimatedMinutes: 45, difficulty: 'medium', order: 4, isStartHere: false, phaseLabel: 'Phase 2: Explore' },
      { title: `Apply what you learned`, description: `Do one exercise, project, or teach-back. Application = retention.`, estimatedMinutes: 30, difficulty: 'medium', order: 5, isStartHere: false, phaseLabel: 'Phase 3: Apply' },
      { title: `Identify gaps and go deeper`, description: `What questions came up? What don't you understand? Targeted study is 3x more efficient.`, estimatedMinutes: 25, difficulty: 'medium', order: 6, isStartHere: false, phaseLabel: 'Phase 3: Apply' },
    ],
  }),
  writing: (title) => ({
    whyHard: "Writing feels like one giant task, but it's actually 5 separate tasks: thinking, structuring, drafting, editing, polishing. Mixing them causes paralysis.",
    adhdTip: "Never edit while drafting. The inner critic that edits is the enemy of the creative brain that drafts. Separate these completely.",
    timeboxSuggestion: "Start with just a 15-min free-write — no editing, no quality bar",
    subtasks: [
      { title: `Write your core argument in one sentence`, description: `What's the single most important thing you want the reader to take away? Just one sentence.`, estimatedMinutes: 10, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'All good writing comes from a clear central idea. Without this, you\'ll circle forever.', tip: 'Write 5 bad versions, then pick the best one', phaseLabel: 'Phase 1: Think' },
      { title: `Rough outline (bullet points only)`, description: `List the 4-6 points that support your core argument. No sentences — just labels.`, estimatedMinutes: 15, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Phase 1: Think' },
      { title: `Research / gather evidence (time-boxed)`, description: `Set a timer — 30 min max. Collect what you need. Stop when the timer rings even if not done.`, estimatedMinutes: 30, difficulty: 'medium', order: 3, isStartHere: false, tip: 'Research rabbit holes are the #1 procrastination trigger — hard stop at 30 min', phaseLabel: 'Phase 2: Gather' },
      { title: `Ugly first draft — write without stopping`, description: `Write the whole thing badly. No editing, no Googling, no re-reading. Just words on page.`, estimatedMinutes: 45, difficulty: 'hard', order: 4, isStartHere: false, tip: 'Literally write "[fix this later]" when you\'re stuck and keep going', phaseLabel: 'Phase 3: Draft' },
      { title: `Structural edit — does the argument flow?`, description: `Read it once. Move sections, cut what doesn\'t serve the core argument. No sentence-level edits yet.`, estimatedMinutes: 20, difficulty: 'medium', order: 5, isStartHere: false, phaseLabel: 'Phase 4: Edit' },
      { title: `Line edit — clarity and cut`, description: `Now fix sentences. Cut every word that doesn\'t add meaning. Read aloud.`, estimatedMinutes: 25, difficulty: 'medium', order: 6, isStartHere: false, phaseLabel: 'Phase 4: Edit' },
      { title: `Final polish and proofread`, description: `Grammar, formatting, citations if needed. This is the last 10%, not the first.`, estimatedMinutes: 15, difficulty: 'easy', order: 7, isStartHere: false, phaseLabel: 'Phase 5: Polish' },
    ],
  }),
  code: (title) => ({
    whyHard: "Coding tasks feel large because the solution is unknown until you build it. The trick: solve a smaller version first.",
    adhdTip: "Write a comment outline of your approach BEFORE writing any code. Your brain can solve the problem in English before it can in Python/JS.",
    timeboxSuggestion: "Spend the first 10 min writing pseudocode in plain English",
    subtasks: [
      { title: `Understand and restate the problem`, description: `Write what the program needs to DO in plain English. Input → Output. No code yet.`, estimatedMinutes: 10, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Most coding bugs come from misunderstanding the problem. Restating it catches this early.', tip: 'Draw a diagram or write an example manually first', phaseLabel: 'Phase 1: Understand' },
      { title: `Write the solution in pseudocode`, description: `Step-by-step logic in plain English. Ignore syntax.`, estimatedMinutes: 15, difficulty: 'medium', order: 2, isStartHere: false, phaseLabel: 'Phase 1: Understand' },
      { title: `Scaffold the project / file structure`, description: `Create files, blank functions, import statements. Make it run (even if it does nothing).`, estimatedMinutes: 15, difficulty: 'easy', order: 3, isStartHere: false, phaseLabel: 'Phase 2: Build' },
      { title: `Implement the simplest working version`, description: `Make it work for one basic case — ignore edge cases for now.`, estimatedMinutes: 45, difficulty: 'hard', order: 4, isStartHere: false, tip: 'Commit early. A working-but-limited version beats a perfect-but-unfinished one', phaseLabel: 'Phase 2: Build' },
      { title: `Write tests for your happy path`, description: `Write 2-3 tests for the expected behaviour. This shows you what\'s still broken.`, estimatedMinutes: 20, difficulty: 'medium', order: 5, isStartHere: false, phaseLabel: 'Phase 3: Test' },
      { title: `Handle edge cases and error states`, description: `What happens with bad input, empty data, or unexpected conditions?`, estimatedMinutes: 25, difficulty: 'hard', order: 6, isStartHere: false, phaseLabel: 'Phase 3: Test' },
      { title: `Refactor and document`, description: `Clean up variable names, extract functions, add comments. Only after it works.`, estimatedMinutes: 20, difficulty: 'medium', order: 7, isStartHere: false, phaseLabel: 'Phase 4: Polish' },
    ],
  }),
  project: (title) => ({
    whyHard: "Projects feel overwhelming because they're multi-phase with unknown dependencies. The fix: plan phases before tasks.",
    adhdTip: "Projects have activation energy problems. The fix: make the kickoff action so small it's embarrassing — one sentence, one file, one email.",
    timeboxSuggestion: "Spend 20 min on a project brief — one page, five questions",
    subtasks: [
      { title: `Write a 5-sentence project brief`, description: `What: Goal. Why: Why it matters. Who: Stakeholders. When: Deadline. How: High-level approach.`, estimatedMinutes: 15, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Without shared clarity on what done looks like, projects drift. 15 min here saves days.', phaseLabel: 'Phase 1: Define' },
      { title: `List all deliverables`, description: `Everything that needs to exist at the end. Be specific — "report" is not specific, "10-page analysis PDF" is.`, estimatedMinutes: 15, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Phase 1: Define' },
      { title: `Identify blockers and dependencies`, description: `What are you waiting on? Who do you need input from? Surface these early.`, estimatedMinutes: 10, difficulty: 'medium', order: 3, isStartHere: false, phaseLabel: 'Phase 1: Define' },
      { title: `Break into weekly milestones`, description: `Work backwards from the deadline. What must be done by when?`, estimatedMinutes: 20, difficulty: 'medium', order: 4, isStartHere: false, phaseLabel: 'Phase 2: Plan' },
      { title: `First milestone: get to 10%`, description: `Create the first tangible artifact. A draft, a prototype, a framework — something you can point at.`, estimatedMinutes: 60, difficulty: 'hard', order: 5, isStartHere: false, tip: '10% tangible progress feels dramatically different from 0% perfect planning', phaseLabel: 'Phase 3: Execute' },
      { title: `Regular 15-min check-ins`, description: `Set a recurring task to review progress against milestones. Catch drift early.`, estimatedMinutes: 15, difficulty: 'easy', order: 6, isStartHere: false, phaseLabel: 'Phase 4: Track' },
    ],
  }),
  research: (title) => ({
    whyHard: "Research has no natural stopping point, which makes it both endless and paralysing for executive-function-challenged brains.",
    adhdTip: "Set a hard time limit BEFORE you start. Write it down. Research until the timer rings — then stop, synthesise, and decide if more is needed.",
    timeboxSuggestion: "Do a 30-min scoped research sprint — just this topic, just this long",
    subtasks: [
      { title: `Define the research question precisely`, description: `Write the exact question you're trying to answer. Not a topic — a question.`, estimatedMinutes: 10, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Research without a question collects information. Research with a question finds answers.', phaseLabel: 'Phase 1: Scope' },
      { title: `Find 3 high-quality sources`, description: `Academic papers, authoritative books, or expert articles. Stop at 3 for now.`, estimatedMinutes: 20, difficulty: 'medium', order: 2, isStartHere: false, phaseLabel: 'Phase 2: Gather' },
      { title: `Extract key facts / quotes`, description: `From each source, pull the 3-5 most relevant pieces of information. Cite as you go.`, estimatedMinutes: 30, difficulty: 'medium', order: 3, isStartHere: false, phaseLabel: 'Phase 2: Gather' },
      { title: `Synthesise — what does the evidence say?`, description: `Write 3-5 bullet points answering your original research question from the evidence.`, estimatedMinutes: 20, difficulty: 'hard', order: 4, isStartHere: false, phaseLabel: 'Phase 3: Analyse' },
      { title: `Identify gaps and decide if more research is needed`, description: `Are there unanswered parts of your question? Is more research worth the cost?`, estimatedMinutes: 10, difficulty: 'medium', order: 5, isStartHere: false, phaseLabel: 'Phase 3: Analyse' },
    ],
  }),
  meeting_prep: (title) => ({
    whyHard: "Meetings feel like one big thing but they're actually multiple mini-deliverables: context, agenda, talking points, decisions needed.",
    adhdTip: "Use the 3-question framework: What do I need to SAY? What do I need to ASK? What do I need to DECIDE?",
    timeboxSuggestion: "Start with 10 minutes on the 3-question framework",
    subtasks: [
      { title: `State the meeting outcome in one sentence`, description: `What should be different / decided after this meeting?`, estimatedMinutes: 5, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Most meetings fail because no one agrees on what success looks like. Define it first.', phaseLabel: 'Prep' },
      { title: `List what you need to SAY`, description: `Updates, context, progress, blockers you need to surface.`, estimatedMinutes: 10, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Prep' },
      { title: `List what you need to ASK`, description: `Questions you need answers to from other attendees.`, estimatedMinutes: 10, difficulty: 'easy', order: 3, isStartHere: false, phaseLabel: 'Prep' },
      { title: `List decisions that need to be made`, description: `What choices need to be locked in during this meeting?`, estimatedMinutes: 5, difficulty: 'easy', order: 4, isStartHere: false, phaseLabel: 'Prep' },
      { title: `Review any materials / docs`, description: `Skim relevant documents so you\'re not reading in the meeting.`, estimatedMinutes: 15, difficulty: 'easy', order: 5, isStartHere: false, phaseLabel: 'Prep' },
    ],
  }),
  administrative: (title) => ({
    whyHard: "Admin tasks are annoying because they feel unimportant but have real deadlines and consequences when missed.",
    adhdTip: "Batch admin tasks together. The context-switching cost of one admin task is high — do 3-4 at once during a low-energy window.",
    timeboxSuggestion: "Set 30 min for admin, knock out as many as possible in one batch",
    subtasks: [
      { title: `Identify exactly what is needed`, description: `List every field, document, or action required. Be specific.`, estimatedMinutes: 5, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Admin feels vague until you itemise it. A list of 4 specific things is manageable.', phaseLabel: 'Do' },
      { title: `Gather all required information/documents`, description: `Collect everything you need before you start the actual task.`, estimatedMinutes: 10, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Do' },
      { title: `Complete the task`, description: `With everything ready, execute without interruption.`, estimatedMinutes: 20, difficulty: 'easy', order: 3, isStartHere: false, phaseLabel: 'Do' },
      { title: `Verify and file`, description: `Confirm submission, save confirmations, update any tracking systems.`, estimatedMinutes: 5, difficulty: 'easy', order: 4, isStartHere: false, phaseLabel: 'Do' },
    ],
  }),
  creative: (title) => ({
    whyHard: "Creative work has no external structure, so the brain must supply all of it — which is exhausting for executive function.",
    adhdTip: "Constraints unlock creativity. Instead of a blank canvas, use: 5 minutes, 3 options, only this tool. Limits are liberating.",
    timeboxSuggestion: "Start with a 10-min no-judgement idea generation sprint",
    subtasks: [
      { title: `10-min ideation — generate 10 rough ideas`, description: `Write 10 ideas without judging any of them. Quantity, not quality. They can be terrible.`, estimatedMinutes: 10, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Getting junk ideas out of your head makes space for good ones. Don\'t start with quality.', phaseLabel: 'Ideate' },
      { title: `Pick the most interesting direction`, description: `From your 10 ideas, choose the one that sparks the most energy — not the most practical.`, estimatedMinutes: 5, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Ideate' },
      { title: `Create a rough prototype`, description: `The ugliest possible version of the idea — proof of concept only.`, estimatedMinutes: 30, difficulty: 'medium', order: 3, isStartHere: false, tip: 'Done badly is better than not started for creative work', phaseLabel: 'Create' },
      { title: `Step away, then review`, description: `Give it at least an hour of distance. Then evaluate with fresh eyes.`, estimatedMinutes: 10, difficulty: 'easy', order: 4, isStartHere: false, phaseLabel: 'Refine' },
      { title: `Iterate toward finished`, description: `Based on your review, make one focused improvement at a time.`, estimatedMinutes: 45, difficulty: 'medium', order: 5, isStartHere: false, phaseLabel: 'Refine' },
    ],
  }),
  communication: (title) => ({
    whyHard: "Communication tasks get delayed because of the emotional weight of crafting the right message under social pressure.",
    adhdTip: "Write a bullet-point draft FIRST. Prose comes from bullets, not from a blank page. You just need to know what to say, not how to say it.",
    timeboxSuggestion: "Spend 5 min on bullet points, then write from those",
    subtasks: [
      { title: `Write what you want to communicate in bullets`, description: `3-5 bullet points — what do you actually need to say?`, estimatedMinutes: 5, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Starting from blank prose is hard. Starting from bullets you\'ve already written is easy.', phaseLabel: 'Draft' },
      { title: `Draft from the bullets`, description: `Turn your bullets into a real message. Don\'t aim for perfect — aim for clear.`, estimatedMinutes: 10, difficulty: 'medium', order: 2, isStartHere: false, phaseLabel: 'Draft' },
      { title: `Read it as the recipient`, description: `Is anything unclear or likely to be misread? Fix those parts only.`, estimatedMinutes: 5, difficulty: 'easy', order: 3, isStartHere: false, phaseLabel: 'Review' },
      { title: `Send`, description: `The fastest improvement to communication is actually sending it.`, estimatedMinutes: 1, difficulty: 'easy', order: 4, isStartHere: false, phaseLabel: 'Send' },
    ],
  }),
  health: (title) => ({
    whyHard: "Health tasks have delayed rewards, which makes the executive function system de-prioritise them in favour of immediate-return tasks.",
    adhdTip: "Pair health tasks with existing habits. Don't create a new routine — attach the health action to something you already do.",
    timeboxSuggestion: "Start now — health tasks rarely get better by waiting",
    subtasks: [
      { title: `Define the specific action`, description: `Not 'exercise' — but '20-min walk around the block right now'. Specificity activates follow-through.`, estimatedMinutes: 2, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Vague intentions fail. Specific actions happen.', phaseLabel: 'Do' },
      { title: `Remove the friction`, description: `Lay out gear, open the app, set the environment. Make the start cost zero.`, estimatedMinutes: 5, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Do' },
      { title: `Start — just the first 2 minutes`, description: `Commit to 2 minutes only. You will almost certainly continue.`, estimatedMinutes: 2, difficulty: 'easy', order: 3, isStartHere: false, phaseLabel: 'Do' },
    ],
  }),
  generic: (title) => ({
    whyHard: "This task feels large because it's not fully defined yet. Breaking it into parts reveals it's smaller than it appears.",
    adhdTip: "For any uncertain task: write what you know, write what you don't know, then start on what you know.",
    timeboxSuggestion: "Start with a 10-min clarification and planning session",
    subtasks: [
      { title: `Define done — what does success look like?`, description: `Write one sentence describing the finished state.`, estimatedMinutes: 5, difficulty: 'easy', order: 1, isStartHere: true, startHereReason: 'Without knowing what done looks like, you\'ll work indefinitely.', phaseLabel: 'Define' },
      { title: `List the main parts`, description: `Break the task into 3-6 distinct components. Don\'t think about order yet.`, estimatedMinutes: 10, difficulty: 'easy', order: 2, isStartHere: false, phaseLabel: 'Define' },
      { title: `Sequence and estimate`, description: `Put the parts in order and estimate time for each.`, estimatedMinutes: 10, difficulty: 'medium', order: 3, isStartHere: false, phaseLabel: 'Plan' },
      { title: `Start on Part 1`, description: `Just the first part. Nothing else exists right now.`, estimatedMinutes: 30, difficulty: 'medium', order: 4, isStartHere: false, phaseLabel: 'Execute' },
    ],
  }),
};

// ─── Task Intelligence class ──────────────────────────────────────────────────

class TaskIntelligence {

  // ── Detect task type ──────────────────────────────────────────────────────

  detectType(title: string): TaskType {
    const t = title.toLowerCase();
    if (/\b(exam|test|quiz|midterm|final|assessment|certification)\b/.test(t)) return 'exam_prep';
    if (/\b(learn|study|understand|master|course|tutorial|lesson)\b/.test(t)) return 'learning';
    if (/\b(write|draft|essay|report|article|paper|blog|doc|document|proposal)\b/.test(t)) return 'writing';
    if (/\b(code|build|implement|develop|fix|debug|refactor|deploy|ship|feature|bug)\b/.test(t)) return 'code';
    if (/\b(project|launch|campaign|initiative|rollout)\b/.test(t)) return 'project';
    if (/\b(meet|meeting|presentation|demo|pitch|interview|call|sync)\b/.test(t)) return 'meeting_prep';
    if (/\b(research|investigate|analyse|analyze|explore|survey|audit)\b/.test(t)) return 'research';
    if (/\b(email|message|reply|respond|contact|reach out|follow up)\b/.test(t)) return 'communication';
    if (/\b(form|file|submit|apply|register|renew|pay|invoice|expense)\b/.test(t)) return 'administrative';
    if (/\b(design|create|craft|illustrate|draw|record|produce|make)\b/.test(t)) return 'creative';
    if (/\b(exercise|workout|meditate|sleep|eat|health|doctor|appointment)\b/.test(t)) return 'health';
    return 'generic';
  }

  // ── Detect subject from learning/exam tasks ───────────────────────────────

  detectSubject(title: string): string {
    const t = title.toLowerCase();
    const subjects = Object.keys(SUBJECT_KB).filter(k => k !== 'default');
    for (const subject of subjects) {
      if (t.includes(subject)) return subject;
    }
    // Check topic keywords
    for (const [subject, info] of Object.entries(SUBJECT_KB)) {
      if (subject === 'default') continue;
      for (const topic of info.topics) {
        if (topic.keywords.some(kw => t.includes(kw))) return subject;
      }
    }
    // Extract subject after common patterns
    const patterns = [
      /(?:exam|test|study)\s+(?:for|on|about)?\s+([a-z\s]+)/,
      /([a-z\s]+)\s+(?:exam|test|quiz|midterm|course)/,
      /learn\s+([a-z\s]+)/,
    ];
    for (const rx of patterns) {
      const m = t.match(rx);
      if (m?.[1]) return m[1].trim();
    }
    return 'general';
  }

  // ── Parse exam date ───────────────────────────────────────────────────────

  parseExamDate(text: string): { date: Date | null; daysUntil: number } {
    const t = text.toLowerCase();
    const now = new Date();

    // "on Monday", "this Friday", "next week"
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < dayNames.length; i++) {
      if (t.includes(dayNames[i])) {
        const d = new Date(now);
        const diff = (i - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        return { date: d, daysUntil: diff };
      }
    }
    if (/tomorrow/.test(t)) return { date: new Date(now.getTime() + 86400000), daysUntil: 1 };
    if (/next week/.test(t)) return { date: new Date(now.getTime() + 7 * 86400000), daysUntil: 7 };
    if (/in (\d+) days?/.test(t)) {
      const m = t.match(/in (\d+) days?/);
      const days = m ? Number(m[1]) : 7;
      return { date: new Date(now.getTime() + days * 86400000), daysUntil: days };
    }
    // ISO date pattern
    const isoM = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoM) {
      const d = new Date(isoM[1]);
      const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      return { date: d, daysUntil: Math.max(1, days) };
    }
    return { date: null, daysUntil: 7 }; // Default: assume 1 week
  }

  // ── Generate study plan ───────────────────────────────────────────────────

  generateStudyPlan(subject: string, daysUntilExam: number, hoursPerDay: number = 2): StudyPlan {
    const kb = SUBJECT_KB[subject] || SUBJECT_KB['default'];
    const topics = [...(kb.topics.length ? kb.topics : [
      { name: `Core concepts of ${subject}`, days: 2, difficulty: 'medium' as Difficulty, keywords: [] },
      { name: `Practice problems`, days: 1.5, difficulty: 'hard' as Difficulty, keywords: [] },
      { name: `Review and mock test`, days: 0.5, difficulty: 'easy' as Difficulty, keywords: [] },
    ])];

    // Scale topics to available days (leave 1 day for review)
    const studyDays = Math.max(1, daysUntilExam - 1);
    const totalTopicDays = topics.reduce((s, t) => s + t.days, 0);
    const scale = studyDays / Math.max(totalTopicDays, 1);

    const sessions: StudySession[] = [];
    let currentDay = 1;

    for (const topic of topics) {
      const scaledDays = Math.max(1, Math.round(topic.days * scale));
      for (let d = 0; d < scaledDays && currentDay <= studyDays; d++) {
        const today = new Date();
        today.setDate(today.getDate() + currentDay - 1);

        sessions.push({
          day: currentDay,
          date: today.toISOString().split('T')[0],
          topic: topic.name,
          subtopics: [],
          estimatedHours: hoursPerDay,
          difficulty: topic.difficulty,
          resources: kb.resources.filter(r => r.priority === 'essential').slice(0, 2),
          focusType: d === 0 ? 'introduction' : d === scaledDays - 1 ? 'deep_practice' : 'deep_practice',
        });
        currentDay++;
      }
    }

    // Add review day
    if (daysUntilExam >= 2) {
      const reviewDay = new Date();
      reviewDay.setDate(reviewDay.getDate() + daysUntilExam - 1);
      sessions.push({
        day: daysUntilExam,
        date: reviewDay.toISOString().split('T')[0],
        topic: 'Final Review & Mock Test',
        subtopics: ['Quick-scan all topics', 'Do 1 timed mock test', 'Review mistakes only'],
        estimatedHours: Math.min(hoursPerDay, 3),
        difficulty: 'medium',
        resources: kb.resources.filter(r => r.type === 'practice').slice(0, 1),
        focusType: 'mock_test',
      });
    }

    const estimatedReadiness = Math.min(95, 60 + (daysUntilExam * 5));

    return {
      subject,
      totalDays: sessions.length,
      hoursPerDay,
      daysUntilExam,
      sessions,
      quickReviewTopics: topics.filter(t => t.difficulty !== 'hard').map(t => t.name).slice(0, 5),
      examDayTips: [
        'Review only your notes and flashcards — no new material',
        'Sleep 7+ hours the night before (memory consolidation happens during sleep)',
        'Eat a proper breakfast — glucose fuels working memory',
        'Arrive early to avoid cortisol spike from rushing',
        'In the exam: skip hard questions first, come back with fresh eyes',
      ],
      estimatedReadiness,
    };
  }

  // ── Full task analysis ────────────────────────────────────────────────────

  analyzeTask(title: string, context: { dueDate?: string; tags?: string[] } = {}): TaskAnalysis {
    const type = this.detectType(title);
    const template = TASK_TEMPLATES[type](title);
    const subtasks = template.subtasks.map((s, i) => ({ ...s, id: `sub-${Date.now()}-${i}` }));
    const startHereTask = subtasks.find(s => s.isStartHere) ?? subtasks[0];

    let studyPlan: StudyPlan | undefined;
    let resources: Resource[] = [];

    if (type === 'exam_prep' || type === 'learning') {
      const subject = this.detectSubject(title);
      const { daysUntil } = this.parseExamDate(title + ' ' + (context.dueDate || ''));
      studyPlan = this.generateStudyPlan(subject, daysUntil);
      const kb = SUBJECT_KB[subject] || SUBJECT_KB['default'];
      resources = kb.resources;
    } else {
      // Generic resources based on type
      resources = this._genericResources(type);
    }

    const totalMinutes = subtasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    const complexity =
      totalMinutes > 300 ? 'massive' :
      totalMinutes > 120 ? 'complex' :
      totalMinutes > 45  ? 'moderate' : 'simple';

    return {
      originalTitle: title,
      type,
      complexity,
      estimatedTotalMinutes: totalMinutes,
      whyHard: template.whyHard,
      subtasks,
      startHereTask,
      startHereContext: startHereTask.startHereReason ?? template.adhdTip,
      studyPlan,
      resources,
      timeboxSuggestion: template.timeboxSuggestion,
      adhdTip: template.adhdTip,
    };
  }

  private _genericResources(type: TaskType): Resource[] {
    const map: Partial<Record<TaskType, Resource[]>> = {
      writing: [
        { type: 'tool', title: 'Hemingway Editor', source: 'hemingwayapp.com', url: 'https://hemingwayapp.com', why: 'Instantly highlights over-complex sentences', priority: 'recommended' },
        { type: 'article', title: 'Writing well — Paul Graham', source: 'paulgraham.com', url: 'http://paulgraham.com/writing44.html', why: 'Short, memorable rules for clear writing', priority: 'recommended' },
      ],
      code: [
        { type: 'tool', title: 'MDN Web Docs', source: 'developer.mozilla.org', why: 'The most reliable reference for web technologies', priority: 'essential' },
        { type: 'tool', title: 'Stack Overflow', source: 'stackoverflow.com', why: 'Find solutions to specific error messages fast', priority: 'recommended' },
      ],
      research: [
        { type: 'tool', title: 'Google Scholar', source: 'scholar.google.com', url: 'https://scholar.google.com', why: 'Peer-reviewed sources for credible research', priority: 'essential' },
        { type: 'tool', title: 'Zotero — Reference Manager', source: 'zotero.org', url: 'https://zotero.org', why: 'Track and cite sources automatically', priority: 'recommended' },
      ],
    };
    return map[type] ?? [];
  }

  // ── Quick helpers ─────────────────────────────────────────────────────────

  isLearningTask(title: string): boolean {
    const type = this.detectType(title);
    return type === 'exam_prep' || type === 'learning';
  }

  needsDeconstruction(estimatedMinutes: number, title: string): boolean {
    const type = this.detectType(title);
    return estimatedMinutes > 60 || ['project', 'writing', 'code', 'exam_prep', 'research'].includes(type);
  }
}

export const taskIntelligence = new TaskIntelligence();
