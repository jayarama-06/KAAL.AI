# KAAL Nudge Template Generator

## Instructions

Due to the size of the complete 1,351-template library (150+ KB), here's how to complete the implementation:

### Option 1: Manual Template Entry

Copy all templates from the specification document into `/lib/nudgeTemplates.ts` following this structure:

```typescript
export const templates: Templates = {
  gentle_low: [
    t('Universal', 'Template text here...'),
    t('Student', 'Template text here...'),
    // ... all 50 templates
  ],
  gentle_medium: [
    // ... all 50 templates
  ],
  // ... continue for all 17 categories
};
```

### Option 2: Import from JSON

1. Convert the template specification to JSON format
2. Create `/lib/nudgeTemplates.json` with all 1,351 templates
3. Import in TypeScript:

```typescript
import templateData from './nudgeTemplates.json';
export const templates: Templates = templateData;
```

### Template Categories (17 total):

1. **gentle_low** - 50 templates (3 Student, 2 Dev, 1 KW, 44 Universal)
2. **gentle_medium** - 50 templates (0 Student, 3 Dev, 0 KW, 47 Universal)
3. **gentle_high** - 50 templates (0 Student, 1 Dev, 0 KW, 49 Universal)
4. **active_low** - 50 templates (1 Student, 2 Dev, 1 KW, 46 Universal)
5. **active_medium** - 50 templates (1 Student, 3 Dev, 2 KW, 44 Universal)
6. **active_high** - 50 templates (1 Student, 1 Dev, 4 KW, 44 Universal)
7. **intervention_low** - 50 templates (1 Student, 3 Dev, 0 KW, 46 Universal)
8. **intervention_medium** - 50 templates (0 Student, 4 Dev, 1 KW, 45 Universal)
9. **intervention_high** - 50 templates (0 Student, 1 Dev, 1 KW, 48 Universal)
10. **context_switch** - 150 templates (0 Student, 3 Dev, 12 KW, 135 Universal)
11. **break_reminder** - 150 templates (2 Student, 3 Dev, 15 KW, 130 Universal)
12. **reengagement_hours_low** - 50 templates (all Universal)
13. **reengagement_hours_medium** - 50 templates (0 Student, 1 Dev, 0 KW, 49 Universal)
14. **reengagement_hours_high** - 50 templates (0 Student, 1 Dev, 1 KW, 48 Universal)
15. **reengagement_days** - 151 templates (2 Student, 4 Dev, 2 KW, 143 Universal)
16. **celebration** - 150 templates (2 Student, 5 Dev, 7 KW, 136 Universal)
17. **streak** - 150 templates (2 Student, 7 Dev, 7 KW, 134 Universal)

**Total**: 1,351 templates across all categories

### Persona Distribution:

- 🎓 **Student**: 15 templates (1.1%)
- 💻 **Developer**: 38 templates (2.8%)
- 🧠 **Knowledge Worker**: 54 templates (4.0%)
- ⚡ **Universal**: 1,244 templates (92.1%)

### Variables Supported:

All templates support these dynamic placeholders:
- `{task}` - Full task title
- `{task_short}` - First 3 words of task + "..."
- `{mins}` - Estimated minutes
- `{overdue}` - Minutes overdue
- `{streak}` - Current streak days
- `{done_today}` - Tasks completed today
- `{time_of_day}` - morning/afternoon/evening
- `{day}` - Day of week
- `{inactive_hrs}` - Hours since last visit
- `{inactive_days}` - Days since last visit

### Next Steps:

1. **Complete the template file** using either Option 1 or 2 above
2. **Update selectNudge.ts** to use the new persona-aware system
3. **Test the system** with all 17 categories
4. **Verify persona matching** works correctly

---

## Alternative: Compressed Storage

For production, consider storing templates in a compressed format or lazy-loading categories as needed to reduce initial bundle size.
