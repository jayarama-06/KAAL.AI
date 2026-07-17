# Contributing

Thanks for contributing to KAAL.AI.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Quality checks

Run these before opening a PR:

```bash
npm run lint
npm run typecheck
npm run build
npm run test -- --run
```

## Pull requests

- Keep changes focused and reviewable.
- Document behavior changes in the PR description.
- Update docs when setup, scripts, or architecture are affected.
