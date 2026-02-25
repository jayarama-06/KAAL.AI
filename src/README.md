# 🎯 KAAL - Executive Function AI Assistant

<div align="center">

![KAAL Logo](https://img.shields.io/badge/KAAL-Productivity%20OS-111827?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE.md)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

**A proactive AI life operating system for people with ADHD and executive dysfunction**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation)

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
- **React 18.3.1** - UI framework with hooks
- **TypeScript 5.7.2** - Type-safe development
- **React Router v7** - Client-side routing (Data Mode)
- **Tailwind CSS v4** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide Icons** - Beautiful icon set
- **Motion (Framer Motion)** - Smooth animations

### **Backend**
- **Supabase** - PostgreSQL database, authentication, real-time subscriptions
- **Row Level Security (RLS)** - Database-level security
- **Edge Functions** - Serverless API endpoints

### **AI & ML**
- **ml5.js** - On-device neural networks
- **TensorFlow.js** - Machine learning in browser
- **Client-side algorithms** - Zero-cost intelligence

### **Analytics (Optional)**
- **Google Analytics 4** - User behavior tracking
- **Microsoft Clarity** - Session recordings & heatmaps
- **Mixpanel** - Product analytics & funnels
- **Sentry** - Error tracking & performance monitoring

### **Build Tools**
- **Vite** - Lightning-fast build tool
- **TypeScript** - Type checking
- **ESLint** - Code linting
- **Vitest** - Unit testing

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- Supabase account (free tier works)

### **1. Clone & Install**

```bash
git clone https://github.com/yourusername/kaal.git
cd kaal
npm install
```

### **2. Environment Setup**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

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

### **3. Database Setup**

Run migrations in Supabase SQL Editor:

```bash
# Install Supabase CLI (optional)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

Or manually run SQL files from `/supabase/migrations/` in order.

### **4. Start Development**

```bash
npm run dev
```

Open http://localhost:5173

### **5. Build for Production**

```bash
npm run build
```

---

## 📚 Documentation

### **Core Documentation**
- **[KAAL Agent Guide](KAAL_AGENT_COMPLETE.md)** - Brain dump processor
- **[TinyML Energy Prediction](TINYML_ENERGY_PREDICTION_GUIDE.md)** - ML setup
- **[Nudge System Guide](NUDGE_SYSTEM_1351_GUIDE.md)** - Notification system
- **[Algorithm Stack](ALGORITHM_STACK_GUIDE.md)** - Client-side algorithms
- **[KAAL Architecture](KAAL_ARCHITECTURE.md)** - System design

### **Setup Guides**
- **[Setup Guide](SETUP_GUIDE.md)** - Production deployment
- **[Analytics Complete](ANALYTICS_COMPLETE.md)** - Analytics setup
- **[Mixpanel Guide](MIXPANEL_INTEGRATION_GUIDE_PUBLIC.md)** - Mixpanel integration

### **Security**
- **[Git Push Security Checklist](GIT_PUSH_SECURITY_CHECKLIST.md)** - Pre-push checks
- **[Quick Push Checklist](QUICK_PUSH_CHECKLIST.md)** - Fast reference

### **Contributing**
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Changelog](CHANGELOG.md)** - Version history

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
├── lib/                # Utility functions & algorithms
│   ├── analytics/      # Analytics algorithms
│   ├── brainDumpParser/ # KAAL Agent engines
│   └── *.ts            # Core algorithms
├── hooks/              # Custom React hooks
├── styles/             # Global styles
├── supabase/           # Supabase configuration
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions
└── docs/               # Documentation
```

---

## 🎯 Core Algorithms

All algorithms run **100% client-side** with zero API costs:

- **Task Ranking** - Scores tasks by urgency, energy match, and priority
- **Energy Prediction** - Neural network forecasts energy levels
- **Smart Rescheduling** - Auto-reschedules overdue tasks
- **Burnout Detection** - Monitors workload and stress patterns
- **Streak Tracking** - Maintains productivity streaks
- **Risk Scoring** - Flags tasks likely to be missed
- **Brain Dump Parser** - Transforms messy text into structured tasks

See `/lib/` for implementations.

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
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

### **Vercel**

```bash
npm install -g vercel
vercel --prod
```

### **Other Platforms**

KAAL is a static site. Upload `dist/` to:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static hosting

**Environment Variables**: Add all `VITE_*` variables to your hosting platform.

---

## 🔒 Privacy & Security

### **Data Privacy**
- ✅ All user data stored in your Supabase instance
- ✅ AI algorithms run client-side (no external API calls)
- ✅ TinyML trains on-device
- ✅ Analytics are optional and can be disabled

### **Authentication**
- ✅ Supabase Auth with Row Level Security (RLS)
- ✅ OAuth support (Google, GitHub)
- ✅ Secure session management
- ✅ Email verification

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### **Quick Start**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 🐛 Troubleshooting

### **Build Errors**

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

### **Database Issues**

1. Check Supabase URL and anon key in `.env.local`
2. Verify RLS policies are set
3. Run migrations in order

### **Analytics Not Working**

1. Verify tokens in `.env.local` and `/index.html`
2. Disable ad blockers
3. Check browser console for errors

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

---

## 🙏 Acknowledgments

Built for **SAI University FOSS Club Hackathon 2026**

### **Technologies**
- React team for React 18
- Supabase for backend platform
- ml5.js team for accessible ML
- Recharts for data visualization

---

## 📞 Support

- **Documentation**: Check `/docs` folder
- **Issues**: Open a GitHub issue
- **Discussions**: GitHub Discussions

---

## 🎯 Roadmap

### **Coming Soon**
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Notion integration
- [ ] Slack integration
- [ ] Team/workspace features

### **Completed**
- [x] Quadruple analytics stack
- [x] TinyML energy prediction
- [x] KAAL Agent brain dump
- [x] 1,351 nudge templates
- [x] Zero-cost algorithm intelligence

---

<div align="center">

**Made with ❤️ for people with ADHD and executive dysfunction**

⭐ **Star this repo if KAAL helps you!** ⭐

[Report Bug](https://github.com/yourusername/kaal/issues) • [Request Feature](https://github.com/yourusername/kaal/issues)

</div>
