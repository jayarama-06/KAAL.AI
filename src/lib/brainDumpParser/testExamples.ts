// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Test Examples
// Real-world brain dump examples for testing all engines
// ═══════════════════════════════════════════════════════════════════════════

export const TEST_EXAMPLES = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. OVERWHELMED USER
  // ─────────────────────────────────────────────────────────────────────────
  overwhelmed: {
    text: `i'm so stressed can't finish the report by tomorrow also need to 
    call john about the project but i can't start the presentation until 
    the research is done feeling overwhelmed too much to do help`,
    expectedIntent: 'overwhelmed' as const,
    expectedResults: {
      itemCount: 6,
      taskCount: 3,
      worryCount: 2,
      emotionalLoad: 'overwhelmed',
      dependencyCount: 1,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PLANNING SESSION
  // ─────────────────────────────────────────────────────────────────────────
  planning: {
    text: `today need to review PR, deploy to staging, write docs
    tomorrow client meeting prep, send invoice to acme
    friday finish quarterly report`,
    expectedIntent: 'planning' as const,
    expectedResults: {
      itemCount: 6,
      taskCount: 6,
      worryCount: 0,
      emotionalLoad: 'calm',
      deadlineCount: 3,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. STUCK USER (BLOCKER DETECTION)
  // ─────────────────────────────────────────────────────────────────────────
  stuck: {
    text: `blocked on api integration waiting for backend team to deploy
    can't proceed with frontend until that's done
    also stuck on design approval need to get feedback from jane first`,
    expectedIntent: 'stuck' as const,
    expectedResults: {
      itemCount: 4,
      blockerCount: 3,
      dependencyCount: 2,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. RAMBLING BRAIN DUMP
  // ─────────────────────────────────────────────────────────────────────────
  rambling: {
    text: `wondering if i should change the color scheme maybe blue would look better
    what if we tried a different approach not sure about this
    actually need to finish the slides by tomorrow for the demo
    also thinking about refactoring the api layer someday
    quick call with sarah about the budget`,
    expectedIntent: 'rambling' as const,
    expectedResults: {
      itemCount: 5,
      taskCount: 2,
      ideaCount: 3,
      emotionalLoad: 'calm',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. TEMPORAL EXTRACTION TEST
  // ─────────────────────────────────────────────────────────────────────────
  temporal: {
    text: `dentist tomorrow at 3pm quick appointment 30 min
    urgent presentation asap today before 5pm
    report due end of week friday
    call john in 2 hours brief 10 min call
    quarterly review next monday morning`,
    expectedIntent: 'priorities' as const,
    expectedResults: {
      itemCount: 5,
      deadlineCount: 5,
      durationCount: 3,
      urgencyCount: 1,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. DUPLICATE DETECTION TEST
  // ─────────────────────────────────────────────────────────────────────────
  duplicates: {
    text: `finish the quarterly report
    complete the quarterly report
    write quarterly report
    send email to john
    email john about project
    message john`,
    expectedIntent: 'planning' as const,
    expectedResults: {
      itemCount: 6,
      duplicateClusterCount: 2,
      uniqueTaskCount: 2,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. DEPENDENCY CHAIN TEST
  // ─────────────────────────────────────────────────────────────────────────
  dependencies: {
    text: `need to call john first before i can send the invoice
    can't start presentation until research is done
    after deploying to staging then run tests
    waiting for approval from sarah to proceed with design`,
    expectedIntent: 'stuck' as const,
    expectedResults: {
      itemCount: 4,
      dependencyCount: 4,
      blockerCount: 1,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. END OF DAY REVIEW
  // ─────────────────────────────────────────────────────────────────────────
  endofday: {
    text: `quick email to sarah
    brief call with john 10 min
    finish writing the proposal but that's going to take 2 hours
    update jira tickets fast task
    review pr quick`,
    expectedIntent: 'endofday' as const,
    expectedResults: {
      itemCount: 5,
      shortTaskCount: 4, // tasks < 30 min
      longTaskCount: 1, // tasks > 60 min
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. CRISIS MODE
  // ─────────────────────────────────────────────────────────────────────────
  crisis: {
    text: `i'm drowning everything is falling apart can't breathe
    presentation in 1 hour not ready client meeting disaster
    too many things breaking down panic help`,
    expectedIntent: 'overwhelmed' as const,
    expectedResults: {
      emotionalLoad: 'crisis',
      emotionalScore: 85,
      maxTasksToShow: 1,
      worryCount: 4,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. MIXED CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────
  mixed: {
    text: `finish report by tomorrow important
    worried about the deadline feeling stressed
    what if we tried a different approach to the design
    don't forget dentist appointment at 3pm
    blocked on api integration waiting for backend
    quick call with sarah 10 min`,
    expectedIntent: 'planning' as const,
    expectedResults: {
      itemCount: 6,
      taskCount: 2,
      worryCount: 1,
      ideaCount: 1,
      reminderCount: 1,
      blockerCount: 1,
    },
  },
};

/**
 * Get all test examples
 */
export function getAllTestExamples() {
  return Object.entries(TEST_EXAMPLES);
}

/**
 * Get test example by name
 */
export function getTestExample(name: keyof typeof TEST_EXAMPLES) {
  return TEST_EXAMPLES[name];
}

/**
 * Validate test results against expected
 */
export function validateTestResults(
  name: string,
  actual: any,
  expected: any
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(expected).forEach(([key, expectedValue]) => {
    const actualValue = actual[key];
    if (actualValue !== expectedValue) {
      errors.push(
        `${name}.${key}: expected ${expectedValue}, got ${actualValue}`
      );
    }
  });

  return {
    passed: errors.length === 0,
    errors,
  };
}
