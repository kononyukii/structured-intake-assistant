---
trigger: always_on
---

## Structured Intake Assistant AI Contract (Next.js + Tailwind v4 + shadcn)

You are contributing to **Structured Intake Assistant for Primary Care**, a production-style **Next.js App Router** project focused on structured intake support.

### Product scope

- Product goal: collect and organize patient-provided intake information before a primary care visit.
- Intended output (MVP direction): structured doctor-facing summary/PDF.
- Local-first by default for MVP.
- Out of scope for this product positioning: diagnosis, treatment recommendations, and triage decisions.

### Non-negotiable constraints

1. **Do not refactor unrelated code.** Touch only files required for the task.
2. **Do not change project configuration** (tsconfig/eslint/next config) unless explicitly asked.
3. **Do not add dependencies** unless explicitly asked.
4. **Keep changes PR-sized** (small and incremental).
5. **Do not invent new APIs.** Prefer existing utilities/components and follow existing patterns. If unsure, inspect the codebase first.

### Skill sources (must follow)

- Apply these skill packs as the primary guidelines:
  - `next-best-practices`
  - `vercel-composition-patterns`
  - `tailwind-design-system`
  - `tailwind-v4-shadcn`
  - `tailwind-patterns`
  - `frontend-design`
  - `web-design-guidelines`
- If any suggestion conflicts with the project rules or existing codebase, follow **project rules + existing patterns** first.

### Architecture

- Next.js **App Router** only.
- **Server Components by default**. Add `"use client"` only if required.
- Do not change top-level folder structure.
- Layering:
  - `/app` → routes/layouts/pages only
  - `/features` → feature logic + UI
  - `/entities` → domain models + business logic
  - `/shared` → reusable UI + utils
- **Data access only via repository layer.**
- **No direct IndexedDB usage in UI components.**
- Validation via **Zod**.
- Async data via **TanStack Query**.
- Client/UI state via **Zustand only when needed**.

### UI / Tailwind / shadcn

- Use **shadcn/ui** components as the base.
- Use Tailwind v4 **design tokens** (avoid random magic values).
- **Do not introduce new colors/spacing scales.** Reuse existing tokens and shadcn variants.
- Prefer `cn()` for class composition.
- For screen-level UI, add **empty state** and **loading state**.
- Accessibility required: labels, keyboard support, focus states, `aria-*` where needed.

### Design & UX guardrails (from `frontend-design` + `web-design-guidelines`)

- Maintain clear visual hierarchy: one primary action per screen, consistent headings and spacing.
- Prefer readable layouts: centered container, sensible max-width, consistent vertical rhythm.
- Forms must be user-friendly: label + hint (if needed) + error message; avoid “silent failures”.
- Interactive states are required: hover/focus/disabled (and loading where relevant).
- Avoid clutter: use cards/sections, whitespace, and consistent alignment.
- Respect `prefers-reduced-motion` and keep animations subtle.

### Privacy & Safety

- Privacy-first: **no analytics, no tracking, no cloud sync** unless explicitly asked.
- Keep neutral intake-support wording. Do not frame the app as an "AI doctor".
- No diagnosis, no treatment recommendations, and no triage claims.

### Code quality

- TypeScript strict. **No `any`**.
- Functional components only.
- Keep components small; extract reusable logic when it repeats.

### Output

- PR title and description MUST be in English.
- Provide only the required code changes.
- Mention key edge cases briefly.
- Suggest a commit message.
- Always include in your response:
  1. Scope (what you will change)
  2. Files to edit/create
  3. Acceptance checklist
  4. Suggested commit message

### Mandatory Context (Read First)

Before starting any task, you **must** read the following documents to ensure alignment with product and safety boundaries:

1. `docs/spec-v1.md`: Full MVP spec and invariants.
2. `docs/adr/001-product-scope.md`: Frozen product scope and safety boundaries.
3. `docs/glossary.md`: Standardized terminology.

These documents are the **source of truth** for all feature, safety, and architectural decisions.
