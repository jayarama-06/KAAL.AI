# 🎯 KAAL - Executive Function AI Assistant

<div align="center">

![KAAL Logo](https://img.shields.io/badge/KAAL-Productivity%20OS-111827?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE.md)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

**A proactive AI life operating system for people with ADHD and executive dysfunction**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Analytics](#-analytics-stack) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

KAAL is a comprehensive productivity platform designed specifically for individuals with ADHD and executive function challenges. It combines intelligent task ranking, proactive nudge notifications, energy tracking, and AI-powered coaching to create an adaptive executive function support system.

### 🎯 Core Philosophy

- **Proactive, not reactive**: AI coach that intervenes before you get stuck
- **Context-aware intelligence**: Adapts to your energy, cognitive mode, and behavioral patterns
- **Gentle but persistent**: ADHD-friendly nudges that escalate appropriately
- **Privacy-first**: All AI processing runs locally with zero-cost algorithms

---

## ✨ Features

### 🧠 KAAL Agent - Intelligent Brain Dump Processor

Transform messy thoughts into organized action items:
- **8-engine system**: Segmentation, classification, dependency detection, deduplication
- **Smart scheduling**: Energy-aware task scheduling with emotional load detection
- **Time-aware parsing**: Understands "tonight", "later today", "soon", with timezone support
- **Runs 100% locally**: No API calls, zero cost, instant processing

### 📊 TinyML Energy Prediction

On-device neural network training for energy forecasting:
- **ml5.js powered**: Trains on your browser using TensorFlow.js
- **80-88% accuracy**: After 40+ energy check-ins
- **Privacy-first**: All training happens locally
- **Smart predictions**: Forecasts energy levels by time of day

### 🎯 Zero-Cost Algorithm Intelligence

10 core features running entirely client-side:
- **Task Ranking**: Auto-scores and ranks tasks by priority
- **Energy Matching**: Matches tasks to your current energy level
- **Smart Rescheduling**: Auto-reschedules missed tasks
- **Burnout Detection**: Identifies overwork patterns
- **Streak Tracking**: Maintains productivity streaks
- **Auto-tagging**: Categorizes tasks automatically
- **Risk Scoring**: Flags at-risk tasks
- **Productivity Scoring**: Calculates daily productivity
- **Focus Analytics**: Tracks deep work patterns
- **Task Calibration**: Learns from your time estimates

### 🔔 Comprehensive Nudge System

1,351 persona-aware notification templates:
- **17 categories**: Energy, focus, breaks, task management, motivation
- **4 personas**: Supportive coach, tough love, neutral guide, enthusiastic friend
- **5 intensity levels**: Gentle → Urgent
- **Context-aware**: Adapts to time of day, energy, and work patterns
- **Local-first**: Generated client-side, no API costs

### 📈 Energy Hub

Track and visualize your energy patterns:
- **3-level system**: Low, medium, high energy tracking
- **Visual analytics**: Charts and graphs powered by Recharts
- **Pattern detection**: Identifies peak performance windows
- **Smart insights**: Suggests optimal work times

### 🎨 Beautiful UI/UX

Glassmorphism design with accessibility first:
- **Glassmorphism aesthetic**: Modern, translucent interfaces
- **Typography**: Inter + Playfair Display
- **Dark mode**: Eye-friendly color scheme
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: WCAG 2.1 AA compliant

### 🔗 Integrations

- **Google Calendar**: Sync tasks and events
- **Supabase**: Real-time database and authentication
- **Analytics**: GA4, Clarity, Mixpanel, Sentry (optional)

---

## 🏗️ Tech Stack

### **Frontend**
- **React 18.3.1**: UI framework with hooks
- **TypeScript 5.7.2**: Type-safe development
- **React Router**: Client-side routing
- **Tailwind CSS v4**: Utility-first styling
- **Recharts**: Data visualization
- **Lucide Icons**: Beautiful icon set

### **Backend**
- **Supabase**: PostgreSQL database, authentication, real-time subscriptions
- **Edge Functions**: Serverless API endpoints

### **AI & ML**
- **ml5.js**: On-device neural networks
- **TensorFlow.js**: Machine learning in browser
- **Client-side algorithms**: Zero-cost intelligence

### **Analytics (Optional)**
- **Google Analytics 4**: User behavior tracking
- **Microsoft Clarity**: Session recordings & heatmaps
- **Mixpanel**: Product analytics & funnels
- **Sentry**: Error tracking & performance monitoring

### **Build Tools**
- **Vite**: Lightning-fast build tool
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- Supabase account (free tier works)
- Optional: Analytics platform accounts

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/kaal.git
cd kaal
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Environment Setup**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
# Required
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional - Analytics
VITE_GA4_MEASUREMENT_ID=your-ga4-id
VITE_CLARITY_PROJECT_ID=your-clarity-id
VITE_MIXPANEL_TOKEN=your-mixpanel-token
VITE_SENTRY_DSN=your-sentry-dsn
```

### **4. Database Setup**

Run Supabase migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run SQL files from `/supabase/migrations/` in Supabase SQL editor.

### **5. Start Development Server**

```bash
npm run dev
```

Open http://localhost:5173

### **6. Build for Production**

```bash
npm run build
```

---

## 📊 Analytics Stack

KAAL includes a comprehensive **quadruple analytics stack** (all optional):

### **1. Google Analytics 4**
- User behavior and engagement metrics
- Conversion tracking
- Real-time analytics

### **2. Microsoft Clarity**
- Session recordings
- Heatmaps (click, scroll)
- Rage click detection

### **3. Mixpanel**
- Product analytics
- Conversion funnels
- Cohort analysis
- Session replay

### **4. Sentry**
- Error tracking
- Performance monitoring
- Crash reporting

**Setup Guide:** See `/ANALYTICS_COMPLETE.md` for full documentation

**Privacy:** All analytics are optional and can be disabled. Sensitive data is automatically masked.

---

## 📁 Project Structure

```
kaal/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── *Screen.tsx     # Page components
│   └── *.tsx           # Feature components
├── contexts/           # React contexts (Auth, Settings)
├── services/           # Business logic & API clients
│   ├── *-service.ts    # Service modules
│   └── supabase-*.ts   # Supabase integrations
├── lib/                # Utility functions & algorithms
│   ├── analytics/      # Analytics algorithms
│   ├── brainDumpParser/ # KAAL Agent engines
│   ├── rankTasks.ts    # Task ranking algorithm
│   ├── energyML.ts     # TinyML energy prediction
│   └── nudgeTemplates*.ts # Nudge templates
├── hooks/              # Custom React hooks
├── styles/             # Global styles
├── supabase/           # Supabase configuration
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions
├── docs/               # Documentation
└── public/             # Static assets
```

---

## 🎯 Core Algorithms

### **Task Ranking** (`/lib/rankTasks.ts`)
Scores tasks based on:
- Deadline urgency (exponential decay)
- Energy level match
- Priority weight
- Completion likelihood

### **Smart Rescheduling** (`/lib/smartReschedule.ts`)
Automatically reschedules:
- Overdue tasks
- Tasks with past deadlines
- Tasks blocked by dependencies

### **Energy Prediction** (`/lib/energyML.ts`)
Neural network predicts energy:
- Trains on check-in history
- Time-of-day patterns
- Day-of-week patterns
- 80-88% accuracy after 40+ data points

### **Burnout Detection** (`/lib/burnoutDetection.ts`)
Monitors for burnout signals:
- Excessive work hours
- Declining completion rates
- Increased task rescheduling
- Low energy patterns

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📦 Deployment

### **Netlify (Recommended)**

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
# Add all VITE_* variables from .env.local
```

Deploy with:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### **Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **Other Platforms**

KAAL is a static site and can be deployed to:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static hosting service

---

## 🔒 Privacy & Security

### **Data Privacy**
- ✅ All user data stored in your Supabase instance
- ✅ Analytics are optional and can be disabled
- ✅ Sensitive data automatically masked in recordings
- ✅ No third-party data sharing without consent

### **Local-First**
- ✅ AI algorithms run client-side (no API costs)
- ✅ TinyML trains on-device
- ✅ Brain dump processing happens in browser
- ✅ No external AI API calls required

### **Authentication**
- ✅ Supabase Auth with Row Level Security (RLS)
- ✅ OAuth support (Google, GitHub)
- ✅ Secure session management
- ✅ Email verification

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Code Style**

- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic
- Write tests for new features
- Follow existing code patterns

---

## 📚 Documentation

- **[Analytics Complete Guide](ANALYTICS_COMPLETE.md)** - Full analytics setup
- **[KAAL Agent Guide](KAAL_AGENT_COMPLETE.md)** - Brain dump processor
- **[TinyML Energy Prediction](TINYML_ENERGY_PREDICTION_GUIDE.md)** - ML setup
- **[Nudge System Guide](NUDGE_SYSTEM_1351_GUIDE.md)** - Notification system
- **[Algorithm Stack](ALGORITHM_STACK_GUIDE.md)** - Client-side algorithms

---

## 🐛 Troubleshooting

### **Build Errors**

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

### **Database Connection Issues**

1. Check Supabase URL and anon key in `.env.local`
2. Verify project is active in Supabase dashboard
3. Check RLS policies are correctly set

### **Analytics Not Working**

1. Verify environment variables are set
2. Check browser console for errors
3. Disable ad blockers
4. Check network tab for blocked requests

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

---

## 🙏 Acknowledgments

Built for **SAI University FOSS Club Hackathon 2026**

### **Technologies Used**
- React team for React 18
- Supabase for amazing backend
- Vercel for Next.js patterns
- ml5.js team for accessible ML
- Recharts for beautiful charts

### **Design Inspiration**
- Glassmorphism design patterns
- ADHD-friendly UX principles
- Modern productivity apps

---

## 📞 Support

- **Documentation:** Check `/docs` folder
- **Issues:** Open a GitHub issue
- **Discussions:** GitHub Discussions
- **Email:** [your-email@example.com]

---

## 🎯 Roadmap

### **Coming Soon**
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Notion integration
- [ ] Slack integration
- [ ] Team/workspace features
- [ ] Advanced AI coaching
- [ ] Voice commands

### **In Progress**
- [x] Quadruple analytics stack
- [x] TinyML energy prediction
- [x] KAAL Agent brain dump
- [x] 1,351 nudge templates

---

<div align="center">

**Made with ❤️ for people with ADHD and executive dysfunction**

⭐ **Star this repo if KAAL helps you!** ⭐

[Report Bug](https://github.com/yourusername/kaal/issues) • [Request Feature](https://github.com/yourusername/kaal/issues) • [Documentation](docs/)

</div>
