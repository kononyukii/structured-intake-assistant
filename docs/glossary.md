# Glossary — Structured Intake Assistant for Primary Care (MVP)

This glossary standardizes terminology used across the spec, roadmap, issues, PRs, and code comments.

Use these definitions consistently to avoid scope drift and wording ambiguity.

---

## A

### AI-assisted mode

An optional runtime mode in which selected operations (such as clarifying question generation or answer normalization) may use a hosted LLM through server routes.

AI-assisted mode:

- requires explicit user consent before first AI call
- is not required for the core MVP flow
- must degrade safely to deterministic mode

### AI provider

A runtime adapter implementation that communicates with a specific hosted model/vendor behind a model-agnostic interface.

---

## C

### Chief complaint

The patient's main reason for seeking care, expressed in their own words and/or normalized into a structured field.

### Clinician-facing / doctor-facing summary

A structured summary generated from the intake session for a clinician to read before or during a consultation.

It is:

- factual
- neutral
- patient-reported

It is not:

- a diagnosis
- a treatment plan
- triage advice

### Consent (AI consent)

Explicit user permission required before any AI-assisted processing is used in a session.

This is distinct from the general disclaimer acknowledgment.

---

## D

### Deterministic mode

A non-AI mode where intake flow, question selection, validation, and summary generation work using rules, schemas, and templates.

Deterministic mode is the required reliability baseline for MVP.

### Deterministic fallback

The behavior of continuing or recovering core functionality using deterministic logic when AI is unavailable, invalid, unsafe, or not consented.

### Domain layer

The `domain/` layer in the architecture. It contains pure business logic and rules.

It should not depend on:

- UI components
- framework-specific rendering logic
- external API implementation details

---

## E

### Eligibility / scope gate

A pre-intake check that determines whether the user’s context is supported by MVP boundaries.

This is **not** a triage engine.

It may detect unsupported contexts (e.g., age < 18, pregnancy-related, emergency-like context) and stop the flow with neutral messaging.

### Emergency / urgent context (unsupported)

A context that falls outside MVP support and triggers the eligibility/scope gate.

In MVP, the system does not provide triage/urgency advice in response to this detection.

---

## F

### Final output safety checkpoint

A required safety check/sanitization step that runs on the final summary before:

- preview rendering
- PDF export

It exists to prevent diagnosis/treatment/triage language from reaching final output.

### Forbidden content categories

Types of content that must not appear in MVP outputs:

- diagnosis
- disease ranking/probability
- treatment recommendations
- urgency/triage advice

---

## I

### Intake

The structured process of collecting patient-reported information before a consultation.

### Intake session

The versioned central data object representing a user’s in-progress or completed intake, including structured answers and metadata needed for summary generation.

### Invalid transition

A disallowed phase change in the deterministic intake flow engine (e.g., skipping required logic without allowed review path).

---

## M

### Model-agnostic runtime

A runtime design where the application logic depends on an abstract provider interface rather than a specific AI vendor/model.

### MockProvider

A test/development implementation of the AI provider interface used to simulate:

- success responses
- invalid JSON
- timeouts
- malformed outputs
- blocked/unsafe outputs

---

## N

### Non-persistence (backend)

MVP policy that medical payloads are not intentionally stored on the backend (no backend database persistence of medical data).

This does **not automatically guarantee** zero retention in all self-hosted environments unless infrastructure logging/proxy behavior is also configured appropriately.

### Not assessed

A field/state value indicating the system did not collect or evaluate this item in the current intake flow.

This is different from:

- `unknown` (user does not know)
- `denied` (user explicitly says no)

---

## O

### Open questions (for doctor)

A dedicated summary section listing unresolved questions or clarifications that the patient may discuss with a clinician.

This section must remain separate from factual clinical intake content.

### Out-of-scope (MVP)

Any feature, user type, context, or output behavior that is intentionally excluded from MVP implementation.

---

## P

### Patient-reported fact

A fact stated by the patient (or selected by the patient) during intake.

This term emphasizes that the summary reflects reported information and is not clinical judgment.

### PDF export v1

The MVP printable export of the doctor-facing summary.

Expected characteristics:

- clear section layout
- timestamp
- disclaimer footer
- clinician-readable formatting

---

## R

### Red flag (internal term)

An internal/product-development term for important symptom-related facts that should be explicitly tracked as structured factual states (e.g., present/denied/unknown/not_assessed).

Important:

- In patient-facing UI, a more neutral term may be preferred to avoid triage implications.
- Tracking red-flag-related facts does not imply triage advice.

### Review step

The intake wizard phase where the user can inspect and confirm collected information before summary generation.

---

## S

### Sanitizer (output sanitizer)

A rule-based component that blocks or safely rewrites forbidden content patterns in AI output and final summary text.

MVP default policy should favor **block > rewrite** when safety is uncertain.

### Schema-first

An implementation approach where data structures and contracts are defined and validated (e.g., with Zod) before downstream UI/AI logic depends on them.

### Scope creep

The gradual expansion of product behavior beyond agreed MVP boundaries, often without explicit decisions or ADRs.

### Summary builder (deterministic)

A rule/template-based component that creates the doctor-facing summary from structured intake state without requiring AI.

### Summary rewrite (AI, optional)

An optional AI-assisted operation that may rephrase summary text while preserving facts and boundaries.

If enabled, it must:

- preserve meaning
- introduce no new facts
- pass output safety checks

### Supported case (MVP)

A user/context combination that fits MVP boundaries and may proceed through the intake flow.

---

## T

### Triage / urgency advice

Any output that advises urgency level, emergency action, or care escalation priority.

This is explicitly forbidden in MVP.

### Timeline

The structured representation of symptom timing/history (e.g., onset, duration, progression), as reported by the patient.

---

## U

### Unknown

A field/state value indicating the user does not know the answer.

This is different from:

- `not_assessed` (not asked/collected yet)
- `denied` (explicitly no)
- empty/missing (invalid or incomplete data state)

### Unsupported case

A user/context that falls outside MVP boundaries and must be blocked/stopped by the eligibility/scope gate.

---

## V

### Vertical feature architecture

An architecture style where code is organized by feature (e.g., intake, summary, safety), and each feature maintains clear internal layering:

- `domain/`
- `data/`
- `ui/`

---

## W

### Wording policy (safety wording policy)

A set of rules restricting language used in UI, summaries, and AI-handled outputs to avoid diagnosis/treatment/triage implications.

---

## Recommended Term Usage (Style Guide)

Prefer:

- "Structured Intake Assistant"
- "doctor-facing summary"
- "patient-reported"
- "unsupported case"
- "eligibility/scope gate"
- "AI-assisted mode" / "deterministic mode"

Avoid (for MVP docs/UI positioning):

- "AI doctor"
- "diagnostic assistant"
- "triage assistant"
- "medical advice"
- "treatment recommendations"

---
