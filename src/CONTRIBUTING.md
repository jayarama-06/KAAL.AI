# 🤝 Contributing to KAAL

Thank you for your interest in contributing to KAAL! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Testing](#-testing)
- [Documentation](#-documentation)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment, trolling, or discriminatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Supabase** account (for backend testing)
- **Google Gemini** API key (for AI features)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/KAAL.git
cd KAAL
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/aama47735-source/KAAL.git
```

4. **Install dependencies**:
```bash
npm install
```

5. **Set up environment** (see [README.md](README.md))

6. **Run development server**:
```bash
npm run dev
```

---

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# OR bug fix branch
git checkout -b fix/bug-description
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run type checking
npx tsc --noEmit

# Run tests
npm test

# Build to verify
npm run build
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "type: description"
```

See [Commit Guidelines](#-commit-guidelines) below.

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create Pull Request
```

---

## 💻 Coding Standards

### TypeScript

**Use TypeScript features:**
```typescript
// ✅ Good: Explicit types
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

function createTask(task: Task): void {
  // ...
}

// ❌ Bad: Any types
function createTask(task: any) {
  // ...
}
```

**Prefer interfaces over types:**
```typescript
// ✅ Good
interface UserProfile {
  name: string;
  email: string;
}

// ❌ Avoid (unless necessary)
type UserProfile = {
  name: string;
  email: string;
}
```

### React

**Use functional components with hooks:**
```typescript
// ✅ Good
import { useState, useEffect } from 'react';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    // fetch tasks
  }, []);

  return <div>{/* ... */}</div>;
}

// ❌ Bad: Class components
class TaskList extends React.Component {
  // ...
}
```

**Extract reusable logic to custom hooks:**
```typescript
// ✅ Good: Custom hook
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const fetchTasks = async () => {
    // ...
  };
  
  return { tasks, fetchTasks };
}

// Usage in component
function TaskScreen() {
  const { tasks, fetchTasks } = useTasks();
  // ...
}
```

### File Organization

**Component structure:**
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from './ui/button';

// 2. Types/Interfaces
interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

// 3. Component
export function TaskItem({ task, onComplete }: TaskItemProps) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false);
  
  // 3b. Event handlers
  const handleClick = () => {
    onComplete(task.id);
  };
  
  // 3c. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`TaskScreen.tsx`)
- **Functions**: camelCase (`fetchTasks`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase (`UserProfile`)
- **Files**: kebab-case for utilities (`task-service.ts`)

### Styling

**Use Tailwind CSS classes:**
```tsx
// ✅ Good: Tailwind utilities
<div className="flex items-center gap-4 p-6 bg-white rounded-3xl">
  <h2 className="text-2xl font-bold">Title</h2>
</div>

// ❌ Bad: Inline styles
<div style={{ display: 'flex', padding: '24px', ... }}>
  <h2 style={{ fontSize: '24px' }}>Title</h2>
</div>
```

**Use design tokens from globals.css:**
```tsx
// ✅ Good: Use existing design system
<h1 className="text-4xl">  {/* Uses preset from globals.css */}
  KAAL
</h1>

// ❌ Bad: Override existing styles
<h1 className="text-[40px] font-extrabold leading-tight">
  KAAL
</h1>
```

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(tasks): add task priority sorting"

# Bug fix
git commit -m "fix(auth): resolve login redirect issue"

# Documentation
git commit -m "docs(readme): update installation steps"

# Refactor
git commit -m "refactor(nudge-engine): simplify nudge scheduling logic"

# With body
git commit -m "feat(analytics): add weekly insights chart

- Add Recharts line chart component
- Implement data aggregation hook
- Style with glass morphism design"
```

---

## 🔀 Pull Request Process

### Before Submitting

1. **Update your branch** with latest main:
```bash
git checkout main
git pull upstream main
git checkout your-branch
git rebase main
```

2. **Run tests**:
```bash
npm test
npm run build
```

3. **Review your changes**:
```bash
git diff main...your-branch
```

### PR Title Format

Use same format as commits:
```
feat(tasks): add bulk task deletion
fix(nudge-overlay): correct z-index layering
docs(deployment): add Netlify instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Build passes

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass:
   - TypeScript compilation
   - ESLint
   - Tests
   - Build

2. **Code review** by maintainer:
   - Code quality
   - Follows guidelines
   - No breaking changes

3. **Address feedback**:
   - Make requested changes
   - Push to same branch
   - Re-request review

4. **Merge**:
   - Squash and merge (default)
   - Delete branch after merge

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tasks.test.ts

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { rankTasks } from '../lib/rankTasks';

describe('rankTasks', () => {
  it('should prioritize overdue tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', due_date: '2026-02-20' },
      { id: '2', title: 'Task 2', due_date: '2026-02-25' },
    ];
    
    const ranked = rankTasks(tasks, {
      currentEnergy: 2,
      currentMode: 'deep_focus',
      tasksDoneToday: 3,
    });
    
    expect(ranked[0].id).toBe('1');
  });
});
```

### Manual Testing

Before submitting PR, test:
- [ ] Authentication flow
- [ ] Task CRUD operations
- [ ] Focus session start/stop
- [ ] Nudge notifications
- [ ] Analytics charts
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

---

## 📚 Documentation

### Code Comments

```typescript
/**
 * Ranks tasks based on deadline urgency, energy match, and user patterns.
 * 
 * @param tasks - Array of tasks to rank
 * @param context - User context (energy, cognitive mode, etc.)
 * @returns Array of tasks with scores, sorted by rank
 */
export function rankTasks(
  tasks: Task[],
  context: UserContext
): RankedTask[] {
  // Implementation...
}
```

### README Updates

If your PR adds a feature, update:
- `README.md` - Feature list
- `DEPLOYMENT.md` - If deployment process changes
- Inline code comments

### API Documentation

Document new services:
```typescript
/**
 * Service for managing AI-powered nudge notifications
 * 
 * @example
 * ```typescript
 * const nudge = await nudgeService.generateNudge({
 *   taskTitle: 'Review emails',
 *   nudgeType: 'gentle',
 *   energyLevel: 2
 * });
 * ```
 */
export class NudgeService {
  // ...
}
```

---

## 🐛 Reporting Bugs

### Before Reporting

1. Search existing issues
2. Verify it's reproducible
3. Check if fixed in latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. macOS, Windows]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 1.0.0]

**Additional context**
Any other relevant information.
```

---

## 💡 Feature Requests

Use GitHub Discussions or Issues with:
- **Problem**: What problem does this solve?
- **Solution**: Proposed implementation
- **Alternatives**: Other solutions considered
- **Impact**: Who benefits from this feature?

---

## 📞 Getting Help

- **Documentation**: Check [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub Discussions**: Ask questions
- **GitHub Issues**: Report bugs
- **Email**: jayaram.a-29@soai.saiuniversity.edu.in

---

## 🎉 Recognition

All contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Thanked in the community

---

<div align="center">

**Thank you for contributing to KAAL! 🚀**

Your contributions help people with ADHD and executive dysfunction work better.

</div>
