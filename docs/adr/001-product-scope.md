# ADR-001: Product Scope and Safety Boundaries for MVP

- **ADR ID:** 001
- **Title:** Freeze MVP scope as a Structured Intake Assistant (not diagnostic/triage tool)
- **Status:** Accepted
- **Date:** 2026-02-24
- **Decision Type:** Product scope / safety boundary / delivery control

---

## Context

The project is an open-source med/health workflow MVP intended to help patients prepare a structured summary before a primary care visit.

Because the product operates in a health-related domain, uncontrolled feature expansion can quickly create safety, compliance, and delivery risks. In particular, there is high risk of accidental drift into:

- diagnosis generation
- treatment recommendations
- triage / urgency advice
- emergency decision support
- pseudo-clinical reasoning outputs

There is also delivery risk from overbuilding B2B/EMR features too early.

The project needs a strict scope definition to support:

- safe MVP behavior
- reliable small PR execution
- clear acceptance criteria
- lower hallucination/scope-creep risk during AI-assisted development

---

## Decision

The MVP is frozen as:

> **Structured Intake Assistant for Primary Care**  
> A patient-facing web tool that collects structured intake information and generates a doctor-facing summary PDF.

### The MVP will do

- structured patient intake questioning
- symptom/timeline/history organization
- factual summary generation
- PDF export for clinician use
- deterministic baseline operation (without AI)
- optional AI-assisted questioning/normalization under explicit consent

### The MVP will not do

- diagnosis
- treatment recommendations
- triage / urgency advice
- disease ranking / probability estimation
- emergency decision support
- pediatric workflows
- pregnancy workflows
- EMR integration / B2B workflows (MVP phase)

---

## Consequences (Expected)

### Positive consequences

- Lower safety and wording risk
- Lower legal/compliance ambiguity for MVP positioning
- Better delivery focus (~1 month / 20 items)
- Easier acceptance criteria and testing
- Clearer architecture boundaries (AI used only where needed)
- Stronger deterministic fallback story

### Negative consequences / tradeoffs

- Product may appear less "smart" than AI doctor-style tools
- Some users may expect diagnosis/treatment guidance and be disappointed
- Unsupported-case gating may reduce perceived coverage
- Summary rewrite via AI may remain feature-flagged or limited in MVP

These tradeoffs are accepted to preserve safety and shipability.

---

## Non-negotiable MVP Boundary Rules

The following are binding for MVP implementation:

1. **No diagnosis**
2. **No treatment recommendations**
3. **No triage / urgency advice**
4. **No disease ranking / probable condition list**
5. **No backend persistence of medical data**
6. **Explicit consent before AI calls**
7. **Deterministic fallback mode is required**
8. **AI is not the source of truth for safety boundaries**
9. **Small PR workflow is mandatory** (`1 roadmap item = 1 issue = 1 PR`)
10. **Vertical architecture is mandatory** (`domain / data / ui`)

---

## AI Use Boundaries (MVP)

AI may be used for:

- clarifying question generation
- free-text normalization into structured data
- optional neutral rewrite (strictly bounded, safety-checked)

AI must not be used for:

- diagnosis/treatment/triage outputs
- safety boundary enforcement as sole mechanism
- domain flow control as source of truth
- schema validation
- final output structure ownership

Deterministic logic and validated schemas remain the source of truth.

---

## Supported/Unsupported Context Policy (MVP)

The product is in-scope for:

- adults (18+)
- non-pregnancy-related contexts
- non-emergency primary care intake preparation

The product must block or stop for unsupported contexts and show a neutral "not suitable" message without triage-like advice.

---

## Delivery Implications

This ADR is intended to prevent roadmap drift.

When implementing roadmap items:

- prefer the smallest change that satisfies acceptance criteria
- avoid "smart" extensions that move toward clinical reasoning
- prefer block/refuse/fallback over speculative helpfulness
- document boundary pressure as issues or future ADRs, not ad hoc code changes

---

## Alternatives Considered

### A. Build an "AI family doctor" style assistant

**Rejected** because it conflicts with safety boundaries and significantly increases risk and complexity.

### B. Build diagnostic suggestions but hide them from UI

**Rejected** because generating them still creates safety risk and boundary ambiguity.

### C. Go directly to B2B/EMR plugin MVP

**Rejected** because it increases delivery complexity and compliance burden before validating the core workflow.

### D. AI-only runtime (no deterministic fallback)

**Rejected** because it harms reliability, testability, and safe degradation.

---

## Follow-up Requirements

This ADR requires supporting artifacts and implementation decisions to align:

- Spec v1 must define:
  - supported/unsupported use matrix
  - safety wording policy
  - AI consent model
  - non-persistence/logging policy
  - summary invariants
  - output safety checkpoint

- Roadmap item #2 must deliver:
  - this ADR
  - Spec v1 (not only a brief boundary note)

---

## Change Policy

Any proposal that modifies this ADR requires:

- explicit review
- documented rationale
- updated ADR or superseding ADR
- impact note on safety, delivery, and architecture

Examples requiring a new ADR:

- adding triage-like behavior
- adding diagnosis/treatment content
- adding backend data persistence
- changing AI from optional to required for core flow
- expanding MVP to pediatrics/pregnancy/emergency workflows

---
