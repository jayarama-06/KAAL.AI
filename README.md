# KAAL.AI

KAAL.AI is a React + TypeScript productivity assistant focused on executive-function support (task planning, focus workflows, nudges, and analytics).

## Repository Layout

This repository uses an npm workspace with the app in `src/`.

```text
.
├── .github/                 # CI workflows + issue/PR templates
├── src/                     # Main Vite + React + TypeScript app
│   ├── components/          # UI and screen components
│   ├── contexts/            # React context providers
│   ├── hooks/               # Reusable stateful logic
│   ├── lib/                 # Pure business logic/helpers
│   ├── services/            # Data + integration service layer
│   ├── supabase/            # Supabase functions/migrations
│   └── tests/               # Vitest tests
├── .env.example             # Environment variable template
└── package.json             # Workspace-level scripts
```

## Prerequisites

- Node.js 18.18+ (Node 20 recommended)
- npm 10+

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

### Required

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Optional integrations

- `VITE_GEMINI_API_KEY`
- `VITE_GA4_MEASUREMENT_ID`
- `VITE_CLARITY_PROJECT_ID`
- `VITE_MIXPANEL_TOKEN`
- `VITE_SENTRY_DSN`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_ONESIGNAL_APP_ID`

## Scripts

Run from repository root:

- `npm run dev` - start dev server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run build` - create production build
- `npm run test -- --run` - run tests once
- `npm run test:coverage` - run tests with coverage

## CI Baseline

GitHub Actions runs install + lint + typecheck + build + test on pushes and pull requests.

## Local Validation

Before opening a PR:

```bash
npm run lint
npm run typecheck
npm run build
npm run test -- --run
```

## Contributing and Security

- Contribution guide: [`CONTRIBUTING.md`](/CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](/SECURITY.md)
