# KAAL AI Nudging & Coaching System

## Overview
The AI Nudging System provides proactive coaching, distraction detection, and break suggestions during focus sessions.

## Components Created

### 1. **NudgeNotification**
Small notification cards that appear in corners of the screen.

**Types:**
- `coach` - AI coaching tips (KAAL Coach)
- `distraction` - Distraction warnings
- `suggestion` - Helpful suggestions
- `reminder` - Time-based reminders

**Props:**
```typescript
{
  type: "coach" | "distraction" | "suggestion" | "reminder";
  title: string;
  message: string;
  position?: "bottom-left" | "top-right" | "top-left" | "bottom-right";
  onClose: () => void;
  delay?: number; // animation delay in seconds
}
```

### 2. **BreakSuggestionModal**
Full-screen modal that suggests breaks after extended focus sessions.

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onStartBreak?: () => void;
  focusDuration?: number; // in minutes
}
```

### 3. **NudgeSystem** (Main Controller)
Manages all nudges and their timing.

**Props:**
```typescript
{
  isActive?: boolean; // Enable/disable system
  sessionDuration?: number; // Current session length (triggers break modal at 90min)
}
```

## Integration

### Already Integrated:
✅ **PremiumHomeDashboard** - Shows demo nudges on mount
✅ **FocusSessionScreen** - Active during focus sessions

### Usage in Other Components:

```tsx
import { NudgeSystem } from "./NudgeSystem";

function MyComponent() {
  return (
    <div>
      <NudgeSystem isActive={true} sessionDuration={45} />
      {/* Your content */}
    </div>
  );
}
```

## Triggering Custom Nudges

The system exposes a global method for triggering nudges from anywhere:

```typescript
// From any component or script
window.triggerKaalNudge?.({
  type: "coach",
  title: "KAAL Coach",
  message: "Great focus! You've completed 3 tasks this hour.",
  position: "bottom-left",
  delay: 0,
  duration: 5000 // auto-dismiss after 5 seconds
});
```

### Examples:

**Distraction Detection:**
```typescript
window.triggerKaalNudge?.({
  type: "distraction",
  title: "Context Switch Detected",
  message: "You've switched apps 5 times in the last 10 minutes.",
  position: "top-right",
  duration: 6000
});
```

**Productivity Tip:**
```typescript
window.triggerKaalNudge?.({
  type: "suggestion",
  title: "Peak Performance Window",
  message: "Your focus score is highest between 9-11 AM.",
  position: "bottom-left",
  duration: 8000
});
```

**Task Reminder:**
```typescript
window.triggerKaalNudge?.({
  type: "reminder",
  title: "Meeting in 15 minutes",
  message: "Design Review with Product Team",
  position: "top-right",
  duration: 10000
});
```

## Demo Behavior

When integrated into **PremiumHomeDashboard**:
1. **After 1 second**: "KAAL Coach" nudge appears (bottom-left)
   - "Your productivity peaks at 10 AM. Consider tackling 'Project Phoenix' now."
2. **After 2.5 seconds**: "Distraction Detected" nudge appears (top-right)
   - "Context switching is high."

When integrated into **FocusSessionScreen**:
- Same nudges appear during active focus sessions
- Break modal appears after 90 minutes of continuous focus

## Customization

### Auto-dismiss Duration
Set `duration: 0` for nudges that require manual dismissal:
```typescript
duration: 0 // Won't auto-dismiss
duration: 5000 // Auto-dismiss after 5 seconds
```

### Position
Choose where nudges appear:
- `"bottom-left"` - Best for coaching tips
- `"top-right"` - Best for warnings/alerts
- `"bottom-right"` - Best for reminders
- `"top-left"` - Alternative position

## Styling

All components use:
- Glass morphism design with blur effects
- Consistent with KAAL's premium aesthetic
- Smooth animations (Motion/React)
- Pulsing indicators for active states
- Auto-adapts to theme colors

## Future Enhancements

**Potential additions:**
1. **AI Integration**: Connect to actual AI model for smart nudges
2. **User Preferences**: Allow users to configure nudge frequency
3. **Analytics Integration**: Trigger nudges based on productivity metrics
4. **Sound Effects**: Optional audio for certain nudge types
5. **Snooze Functionality**: Let users delay nudges
6. **Priority System**: Important nudges appear above others
7. **Nudge History**: Log of past nudges for review

## Files Created

```
/components/NudgeNotification.tsx      - Individual notification component
/components/BreakSuggestionModal.tsx   - Break suggestion modal
/components/NudgeSystem.tsx            - Main system controller
```

## Testing

Visit the following routes to see nudges in action:
- `/dashboard` - Demo nudges on home screen
- `/focus` - Nudges during focus session

## Notes

- Nudges automatically stack if multiple are active
- Each nudge has a unique ID to prevent duplicates
- System is disabled when `isActive={false}`
- Break modal only triggers when `sessionDuration >= 90`
- All nudges are dismissible via close button
