# Changelog

All notable changes to KAAL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-23

### 🎉 Initial Release - SAI University FOSS Club Hackathon 2026

First production-ready release of KAAL, an executive function AI assistant for people with ADHD and executive dysfunction.

### ✨ Added

#### Core Features
- **Proactive AI Intelligence Layer**
  - Client-side task ranking algorithm (`/lib/rankTasks.ts`)
  - Background nudge engine with 5 nudge types (`/lib/nudgeEngine.ts`)
  - Gemini-powered AI nudge generation (Edge Function)
  - "KAAL Pick" badges for top-ranked tasks
  - **AI Brain Dump with robust messy input parsing** ✨
  - **Handles text without commas, spaces, or proper grammar** ✨
  - **Automatic spelling correction (20+ common typos)** ✨
  - **Aggressive extraction guarantees ≥1 task always created** ✨

- **Task Management**
  - Full CRUD operations with Supabase sync
  - Smart categories (Focus, Work, Personal, Meeting, Break)
  - Priority levels and estimated time tracking
  - Energy requirement matching
  - Real-time updates via Supabase Realtime

- **Focus Sessions**
  - Pomodoro timer with customizable durations
  - Distraction tracking and logging
  - Session history and analytics
  - Break reminders after 90 minutes

- **Energy & Cognitive Tracking**
  - 3-level energy system (low, medium, high)
  - 4 cognitive modes (Deep Focus, Shallow, Creative, Administrative)
  - Energy logging with timestamp tracking
  - Task-energy match scoring

- **Analytics Dashboard**
  - Focus Trend chart (Deep Work vs Shallow Work)
  - Interruption Sources visualization
  - Peak Performance time analysis
  - Weekly Insights with AI recommendations
  - Recharts integration for data visualization

#### UI/UX
- **Glass Morphism Design System**
  - `#F8F9FA` light gray background
  - `rgba(255,255,255,0.8)` frosted glass cards
  - `rounded-3xl` corners with `blur(24px) saturate(180%)`
  - `h-24` sticky navigation headers

- **Typography**
  - Playfair Display for serif titles
  - Inter for body text
  - Section labels: `text-sm font-bold uppercase tracking-widest`

- **Micro-Interactions**
  - Motion animations for page transitions
  - Underline-style tab navigation
  - Toast notifications for important events
  - Nudge overlay with slide-in animations

- **Accessibility**
  - WCAG 2.1 AA compliance
  - Keyboard navigation support
  - Skip navigation links
  - Screen reader optimizations

#### Screens (19 Total)
- **Core Screens** (9)
  - Landing Page
  - Sign In / Sign Up
  - Premium Home Dashboard
  - Tasks
  - Focus Sessions
  - Analytics
  - Energy Hub
  - Profile
  - Settings

- **Additional Screens** (10)
  - Calendar
  - Timeline
  - Backlog
  - Reminders
  - Inbox
  - Meetings
  - Daily Checkout
  - Integrations
  - Help
  - Workspace Directory

#### Database
- **19 Tables** with comprehensive schema:
  - User management: `user_profiles`, `user_settings`
  - Task system: `tasks`, `task_stats`, `backlog_items`
  - Time tracking: `focus_sessions`, `pomodoros`, `daily_logs`, `weekly_reviews`
  - Energy system: `energy_logs`, `cognitive_modes`
  - Distractions: `distractions`
  - Calendar: `calendar_events`, `reminders`
  - AI system: `ai_chat_history`, `nudge_events`, `behavioral_baselines`, `context_snapshots`, `ai_interventions`

- **Features**:
  - Row Level Security (RLS) on all tables
  - Automatic camelCase ↔ snake_case transformation
  - Optimized indexes for common queries
  - Triggers for timestamp management
  - Profile sync from auth metadata

#### Backend
- **Supabase Integration**
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication (Email/Password)
  - Edge Functions for AI proxy
  - Row Level Security policies

- **Edge Functions**
  - `generate-nudge`: Gemini AI nudge generation
  - `gemini-proxy`: (Optional) Chat API proxy
  - Server-side API key management
  - CORS configuration
  - Error handling with fallback messages

#### AI Integration
- **Google Gemini API** (gemini-2.0-flash-exp)
  - Centralized server-side proxy
  - Message validation and cleaning
  - **Grammar enforcement with comma validation** ✨
  - **Auto-fix for contractions and punctuation** ✨
  - **3-stage validation pipeline (clean → validate → fix/fallback)** ✨
  - Emoji and markdown removal
  - Fallback messages for offline/errors

#### Developer Experience
- **TypeScript** 5.7.2 with strict mode
- **React Router** v7 (Data Mode)
- **Tailwind CSS** v4
- **Vite** 6.0.7 build tool
- **Vitest** for testing
- **ESLint** for code quality

### 🔧 Technical Details

#### Performance Optimizations
- Lazy-loaded routes
- Optimistic UI updates
- Debounced API calls
- Memoized components
- Efficient re-renders with React.memo

#### Security
- Environment variable isolation
- Supabase RLS policies
- API key stored server-side only
- HTTPS enforcement
- Input validation

### 📚 Documentation
- Comprehensive README with setup instructions
- DEPLOYMENT guide for Vercel/Netlify
- CONTRIBUTING guidelines
- Inline code documentation
- Database schema diagrams

### 🎨 Design Assets
- Landing page with feature showcase
- Authentication screens (Sign In/Up)
- Dashboard with task cards
- Analytics with charts
- Profile management
- Settings panel

### 🧪 Testing
- Unit tests for core libraries
- Integration tests for services
- Manual testing checklist
- Browser compatibility testing

---

## [Unreleased]

### Planned Features
- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Google Calendar two-way sync
- [ ] Slack integration
- [ ] Notion integration
- [ ] Team collaboration features
- [ ] Advanced habit tracking
- [ ] Goal setting & OKRs
- [ ] Browser extension
- [ ] Export reports (PDF, CSV)
- [ ] API for third-party integrations

### Known Issues
- None reported in v1.0.0

---

## Version History

- **[1.0.0]** - 2026-02-23 - Initial release (Hackathon submission)

---

<div align="center">

**Built with ❤️ for the SAI University FOSS Club Hackathon 2026**

</div>