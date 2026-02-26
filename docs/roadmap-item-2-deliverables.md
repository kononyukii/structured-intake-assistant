# Roadmap Item #2 Deliverables — Spec v1 + ADR-001 (Product Scope)

## Roadmap Reference

**Item #2:** MVP boundary document + ADR-001 (product scope)

This document defines the exact outputs and acceptance criteria for Roadmap Item #2 so implementation can stay small, testable, and aligned.

---

## 1. Goal of Item #2

Create the decision and specification foundation that prevents scope creep and clarifies MVP behavior before implementation of safety, intake flow, AI runtime, and output generation.

Item #2 is complete when the project has a **usable, implementation-driving spec**, not just a short scope note.

---

## 2. Required Deliverables (Files)

The following files must exist and be reviewable:

1. `docs/spec-v1.md`
   - Full MVP spec (not a draft stub)
   - Must define product boundaries, safety wording rules, AI consent behavior, privacy/non-persistence policy, summary invariants, and release criteria

2. `docs/adr/001-product-scope.md`
   - Accepted ADR freezing MVP scope and safety boundaries

3. `docs/glossary.md`
   - Shared terminology definitions to reduce ambiguity across issues/PRs/code comments

4. _(Optional but recommended for maintainability)_
   - `docs/roadmap-item-2-deliverables.md` (this file)
   - Keeps acceptance intent explicit for future contributors

---

## 3. What `spec-v1.md` Must Include (Minimum Required Sections)

The spec must include all of the following sections (names may vary slightly if meaning is preserved):

- Product definition (what it is / what it is not)
- MVP goal
- Frozen decisions
- In-scope / out-of-scope
- Supported / unsupported use matrix
- Core user flow
- Functional requirements:
  - disclaimer flow
  - scope gate
  - intake wizard
  - deterministic engine
  - local persistence
  - summary builder
  - AI provider abstraction
  - server-side AI routes
  - output safety guardrails
  - summary preview + PDF export
- AI consent & mode model
- Safety wording policy
- Data handling & non-persistence policy
- Architecture constraints (vertical feature layering)
- Testing/validation requirements
- MVP acceptance metrics / release criteria
- Explicit post-MVP list

---

## 4. Acceptance Criteria (Rewritten, Testable)

Roadmap Item #2 is accepted only if all of the following are true:

### AC-1: MVP boundaries are explicit and enforceable

The documentation clearly defines:

- what the product does
- what it does not do
- no diagnosis / no treatment / no triage
- supported vs unsupported contexts (including adult/non-emergency/non-pregnancy MVP boundaries)

### AC-2: Safety wording policy is documented

The docs include explicit language constraints for:

- UI copy
- summary output
- PDF output
- AI-handled outputs

Including:

- forbidden content categories
- neutral/factual wording expectations
- unsupported-case message constraints

### AC-3: AI strategy boundaries are documented

The docs clearly separate:

- what AI may do
- what AI may not do
- deterministic fallback requirement
- explicit consent before AI calls
- server-side-only provider access (no client secret leakage)

### AC-4: Privacy/non-persistence policy is documented

The docs state:

- local storage by default
- no backend persistence of medical data (MVP)
- no intentional app-level logging of medical payload bodies
- self-hosting caveat for infrastructure/proxy logging responsibility

### AC-5: Summary output invariants are documented

The docs define:

- doctor-facing factual summary only
- no diagnosis/treatment/triage language
- patient-reported framing
- distinction between present/denied/unknown/not_assessed
- separate "Questions for doctor" section

### AC-6: The outputs are implementation-ready (not just conceptual)

The documentation is specific enough that roadmap items #3–#20 can reference it directly without re-running discovery.

---

## 5. Non-goals of Item #2

Item #2 does **not** need to include:

- UI mockups
- final copywriting polish for every screen
- final Zod schemas
- final question sets
- provider-specific API details
- final PDF implementation approach
- full test fixtures

Those belong to later roadmap items.

---

## 6. Review Checklist (for Maintainer / PR Review)

Use this checklist when reviewing the PR for item #2.

### Scope & Safety

- [ ] "No diagnosis / no treatment / no triage" appears in both spec and ADR
- [ ] Supported/unsupported cases are explicit
- [ ] Unsupported-case behavior avoids triage wording
- [ ] Spec does not drift into B2B/EMR scope

### AI Boundaries

- [ ] AI usage is bounded to clarifying/normalization/(optional rewrite)
- [ ] Deterministic fallback is required, not optional
- [ ] AI consent is separate and explicit
- [ ] Server-side routes are the only runtime path to hosted models

### Privacy & Data Handling

- [ ] Local storage by default is documented
- [ ] No backend persistence of medical data is documented
- [ ] App-level body logging prohibition is documented
- [ ] Self-hosting caveat is documented

### Output Integrity

- [ ] Summary is clearly defined as doctor-facing and factual
- [ ] "Questions for doctor" is separated from factual sections
- [ ] Forbidden content categories are explicit
- [ ] Final output safety checkpoint is specified

### Delivery Readiness

- [ ] Docs are practical enough to guide #3–#20
- [ ] No major discovery questions are reintroduced
- [ ] No alternative product direction is silently applied

---

## 7. Suggested PR Scope (to keep Item #2 small)

Keep the PR limited to:

- docs creation
- internal links (if any)
- minimal README link to docs (optional)

Avoid in Item #2:

- code changes
- schema implementation
- UI implementation
- provider integration
- test setup changes

This preserves the "1 item = 1 PR" discipline.

---

## 8. Suggested Commit / PR Naming (Optional)

### PR title examples

- `docs: add Spec v1 and ADR-001 for MVP scope`
- `docs: freeze MVP scope with spec v1 + adr-001`

### PR description structure (What / Why / How)

- **What:** Adds Spec v1, ADR-001, and glossary for MVP boundaries
- **Why:** Prevent scope creep and clarify safety/AI/privacy constraints before implementation
- **How:** Introduced docs under `docs/` with explicit MVP scope, wording policy, and output invariants

---

## 9. Handoff to Next Roadmap Items

After Item #2 is accepted, the next items should treat the docs as source of truth:

- #3 disclaimer flow must follow Safety Wording Policy
- #4 scope gate must follow Supported/Unsupported Use Matrix
- #6–#9 schema/contracts must follow spec terminology and output invariants
- #15 summary builder must follow Summary invariants
- #17–#19 AI runtime and guardrails must follow AI boundaries + non-persistence policy
- #20 summary/PDF must follow final output safety checkpoint and PDF v1 expectations

---
