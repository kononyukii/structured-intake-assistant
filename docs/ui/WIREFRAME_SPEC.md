# Wireframe Spec — Structured Intake Assistant for Primary Care (v3)

- **Version:** 3.0
- **Status:** Active (UI baseline)
- **Scope:** MVP wireframe-to-implementation reference
- **Owner:** Project maintainer
- **Source wireframes:** `docs/ui/assets/wireframes-v3.png`

> This document describes the UI/UX baseline based on wireframes v3.
> It must stay consistent with the project safety boundaries: **no diagnosis**, **no treatment**, **no triage/urgency advice**, **no disease ranking**.

---

## Goals

Build a privacy-first, local-first intake wizard for primary care that outputs a doctor-friendly summary and supports print/export.

Primary UX outcome (MVP):

- A patient can complete an intake and produce a **scannable doctor summary** (target: **~30–60s scan**) and print/export it.
- The system never provides diagnosis/treatment/triage content.

---

## Non-negotiables (must be reflected in UI copy)

- No diagnosis.
- No treatment recommendations.
- No triage / urgency advice.
- No disease ranking.
- Privacy-first: no account, local-only drafts by default.
- AI (if present) is OPTIONAL and requires explicit consent before any call.

---

## Information Architecture

User journey (v3-aligned):

Home → Safety Disclaimer Gate → Drafts → Intake Wizard → Review → Doctor Summary → Print/Export

Optional (if AI assist enabled):
Review → AI Consent → Generate summary (optional) → Doctor Summary / Export

---

## Routes (Next.js App Router)

- `/` — Home
- `/disclaimer` — Safety Disclaimer Gate (blocks access until accepted)
- `/drafts` — Drafts list (local)
- `/intake/[draftId]` — Intake Wizard shell + step routing (Step 1–6)
- `/review/[draftId]` — Review (desktop: doctor-summary-style preview; mobile: section outline)
- `/summary/[draftId]` — Doctor Summary (read-only, scannable, print-friendly)
- `/consent/[draftId]` — AI Consent (optional; only if AI assist is enabled)
- `/settings` — Settings / Privacy (local data management + AI consent management)

---

## Global UI patterns

### App shell

- Top bar: product name + simple navigation (Drafts / Settings).
- Subtle “local-first” reassurance in UI where appropriate.
- Footer note (key screens): “Data stays on this device.”

### Local/autosave indicator

- Wizard and Drafts display: **“Autosaved locally”**.
- Optional toast: “Saved locally”.

### Steps / progress

6 steps (must not imply medical conclusions):

1. Chief Complaint
2. Symptoms
3. History
4. Medications & Allergies
5. Lifestyle
6. Review

Mobile may use “Step X of 6” instead of a full stepper.

### Print/Export

- MVP export via `window.print()` on `/summary/[draftId]`.
- Avoid claims like “securely sent” or “we never store X” unless implemented and true.

---

## Component inventory (shadcn-first)

- Page layout: `Page`, `PageHeader`, `PageBody`, `PageFooter` (wrappers)
- Form: `Field` (Label + Control + Helper/Error), `FormActions` (Back/Next/Save & Exit)
- UI: Button, Input, Textarea, Select, Checkbox, RadioGroup, Card, Badge/Chip, Alert, Dialog, Accordion, Toast
- Custom: `DraftListItem`, `EmptyState`, `SummarySection`, `SummaryGrid`, `KebabMenu`
- Optional: compact `Stepper` (desktop), “Step X of 6” (mobile)

---

## Data model (MVP)

### Draft

- `id: string`
- `title: string` (derived from chief complaint or user rename)
- `status: "in_progress" | "ready"`
- `updatedAt: number`
- `intake: IntakeForm` (partial allowed)

### IntakeForm (partial allowed)

- `chiefComplaint: { main: string; startedAt?: string; notes?: string }`
- `symptoms: { duration?: string; severity?: number; triggers?: string[]; relievingFactors?: string }`
- `history: { conditions?: string; surgeries?: string }`
- `medsAllergies: { medications?: string; allergies?: string }`
- `lifestyle: { smoking?: string; alcohol?: string; occupation?: string }`
- `notes?: string`

---

## Screen specs (Desktop + Mobile)

### 1) Home (`/`)

Blocks:

- Title + short description
- Trust chips: “No account”, “Local-only storage”, “No tracking”
- Primary CTA: “Get Started”
- Secondary CTA: “Continue” (only if drafts exist)
- Footer note: “Data stays on this device.”

Acceptance:

- “Get Started” → `/disclaimer` (unless already accepted).
- “Continue” → `/drafts` (safer than auto-resume).

---

### 2) Disclaimer Gate (`/disclaimer`)

Blocks:

- Title: “Safety Disclaimer”
- Safety bullets (must include non-negotiables):
  - No diagnosis
  - No treatment recommendations
  - No triage / urgency advice
- Emergency line: “If this is an emergency, contact local emergency services.”
- Checkbox: “I understand and agree”
- Buttons:
  - Primary: “Continue” (disabled until checked)
  - Secondary: “Exit”

Acceptance:

- Gate blocks intake-related routes when not accepted.
- Acceptance persisted locally.

---

### 3) Drafts (`/drafts`)

Blocks:

- Header: “Drafts”
- Indicator: “Autosaved locally”
- Search input
- Primary CTA: “+ Draft” / “+ New Draft”
- List item:
  - Title, updatedAt
  - Status badge (“In Progress” / “Ready”)
  - Row click = open draft
  - Overflow menu: Rename / Delete
- Empty state

Acceptance:

- Delete uses confirm dialog.
- New draft creates local record and routes to `/intake/[draftId]`.

---

### 4) Intake Wizard (`/intake/[draftId]`)

Template blocks:

- Header:
  - Back chevron (to Drafts)
  - “Intake Wizard”
  - “Autosaved locally”
- Step title + helper text (inside a clean Card)
- Actions:
  - Desktop: Back / Next / Save & Exit
  - Mobile: sticky bottom actions (primary Next)

Step 2 (Symptoms) reference fields:

- When did it start?
  - quick chips (e.g., “1 day”, “2–7 days”, “1–4 weeks”, “Other”)
  - optional date/relative input
- Severity: slider 0–10 + visible value (e.g., “7/10”)
- What makes it worse?: chips (Morning / Stress / Movement / Food / Other)
- Relieving factors: textarea

Acceptance:

- Autosave on change (debounced).
- Save & Exit routes to `/drafts`.
- No medical interpretation text.

---

### 5) Review (`/review/[draftId]`)

v3 behavior:

- Desktop: doctor-summary-style preview layout.
- Mobile: section outline list + actions.

Desktop blocks:

- Title: “Review”
- Summary card header: “Doctor Summary”
- Badge/subtitle: “For doctor review only”
- “Patient Summary” bullets at top
- Structured sections in 1–2 columns:
  - Chief Complaint
  - Symptoms
  - Medical History
  - Medications
  - Allergies
  - Lifestyle
  - Notes
- Edit affordance per section (“Edit” or click header → jump to step)
- Actions:
  - “Mark as Ready” (optional but recommended)
  - “Print / Export PDF” → `/summary/[draftId]`

Mobile blocks:

- Title: “Review & Confirm”
- Tappable section list (tap → edit):
  - Chief Complaint, Symptoms, History, Medications & Allergies, Lifestyle, Notes
- Actions:
  - “View Doctor Summary” → `/summary/[draftId]`
  - “Export / Print” → prints via `/summary/[draftId]`

Acceptance:

- “Mark as Ready” sets `draft.status = "ready"`.
- Review does not add medical conclusions.

---

### 6) Doctor Summary (`/summary/[draftId]`)

Blocks:

- Title: “Doctor Summary”
- Badge: “For doctor review only”
- Scannable structure:
  - “Patient Summary” bullets at top
  - Structured sections below
- Buttons: “Print / Export PDF” (MVP: triggers print)

Print layout requirements:

- Readable typography, stable section order
- App chrome removed in print
- Avoid dense unstructured paragraphs by default

Acceptance:

- Contains only patient-provided data + neutral structure.
- Readable/scannable in ~30–60s.

---

## AI Consent (optional, consent-first)

Route: `/consent/[draftId]` (only if AI assist is enabled)

Blocks:

- Title: “Start Draft Summary with AI”
- Explicit explanation:
  - AI is optional
  - user can continue without AI
  - no diagnosis/treatment/triage
- Actions:
  - Primary: “Generate summary” (requires explicit consent)
  - Secondary: “Continue without AI” (routes back to Review)

Privacy reminder (optional; only if implemented):

- “Before exporting, review for personal identifiers.”
- Only show toggles that actually affect output (e.g., “Hide full name”, “Hide address”, etc.)

Acceptance:

- If declined, user is not blocked.
- Never claim secure transmission/storage unless implemented and accurate.

---

## States & edge cases

- No drafts → empty state on `/drafts`.
- Partial draft → wizard allows incomplete sections; summary shows “Not provided”.
- Missing `draftId` → not found state.
- Storage failure → non-blocking alert with guidance.
- Accessibility:
  - Focus visible, keyboard navigation.
  - Chips are accessible (`aria-pressed`).
  - Errors announced (aria-live optional).

---
