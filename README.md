# KAAL.AI

KAAL.AI is a React + TypeScript productivity assistant focused on executive-function support (task planning, focus workflows, nudges, and analytics).

## Repository Layout

This repository uses a root workspace with the app in `src/`:

```text
.
├── .github/                 # CI and collaboration templates
├── src/                     # Main Vite + React + TypeScript app
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── styles/
│   ├── supabase/
│   └── tests/
├── .env.example
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

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for Supabase-backed functionality.
Other variables in `.env.example` are optional integrations.

## Scripts

Run from repository root:

- `npm run dev` - start dev server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run build` - typecheck + production build
- `npm run test` - run tests
- `npm run test:coverage` - run tests with coverage

## CI Baseline

GitHub Actions runs install + lint + typecheck + build + test on pushes and pull requests.

## Contributing and Security

- Contribution guide: [`CONTRIBUTING.md`](/CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](/SECURITY.md)
