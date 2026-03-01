# Structured Intake Assistant for Primary Care

Open-source web tool that turns **patient pre-visit intake** into a **structured, doctor-friendly summary/PDF**.

> Scope: **primary care intake** (adult, non-emergency).  
> Storage: **local-first** by default.

## What it does

- Guides the patient through an adaptive intake flow (chief complaint → details → history).
- Produces a structured, clinician-readable summary (30–60s scan).
- Exports a printable PDF for the doctor.

## What it does NOT do (non-negotiable)

- No diagnosis.
- No treatment recommendations.
- No triage / urgency advice.
- No disease ranking.

## Privacy & Safety

- **Privacy-first (by design)**: No analytics/tracking and no cloud sync in the MVP scope. Patient data is intended to stay on the user’s device by default (local browser storage; IndexedDB in MVP).
- **No account**: No registration or login required.
- **Local-first**: Drafts are saved on your device and are not persisted on the backend in the MVP.
- **AI consent**: AI calls (if enabled) happen via server routes; explicit consent is required before any data is sent.
- **Support-only**: This is an information-structuring tool, not a clinical decision-making tool.
- **Safety**: Deterministic fallback mode is a requirement so core flows remain usable even without AI.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- TanStack Query
- Zod
- IndexedDB
- Vitest
- Playwright
- GitHub Actions

## Internal Documentation

These documents are the **source of truth** for all feature, safety, and architectural decisions:

- [Spec v1 (MVP)](./docs/spec-v1.md) — Full MVP spec and invariants.
- [ADR-001: Scope & Boundaries](./docs/adr/001-product-scope.md) — Frozen product scope and safety boundaries.
- [Glossary](./docs/glossary.md) — Standardized terminology.

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start development server        |
| `npm run build`        | Build for production            |
| `npm run start`        | Start production server         |
| `npm run lint`         | Run ESLint checks               |
| `npm run format`       | Fix formatting with Prettier    |
| `npm run format:check` | Check formatting without fixing |

## Disclaimer

This project is an **information-structuring tool**. It does not provide medical diagnosis, treatment, or emergency guidance.
