# Structured Intake Assistant for Primary Care

Open-source web tool to help structure patient intake details before a primary care visit. The MVP direction is patient input that becomes a doctor-facing structured summary/PDF, with local browser storage by default.

## What It Does Not Do

- Does not provide diagnosis.
- Does not provide treatment recommendations.
- Does not perform triage or emergency decision-making.

## Bootstrap Status

This repository is in bootstrap/rebrand stage from a previous project base.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- TailwindCSS

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
