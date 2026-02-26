# Structured Intake Assistant for Primary Care — Spec v1 (MVP)

- **Version:** 1.0
- **Status:** Active baseline specification
- **Scope:** MVP (open-source, patient-facing web tool)
- **Owner:** Project maintainer
- **Type:** Product + behavior + safety + technical boundary spec

---

## 1. Purpose

This document defines the MVP for an open-source **Structured Intake Assistant for Primary Care**.

It is the source of truth for:

- product scope and non-goals
- safety and wording boundaries
- privacy and non-persistence rules
- deterministic and AI-assisted runtime behavior
- output constraints (doctor-facing summary + PDF)
- implementation constraints for roadmap execution

This document is intentionally **pragmatic** and **MVP-focused**. It exists to reduce ambiguity, prevent scope creep, and support small incremental PR delivery.

---

## 2. Product Definition

### 2.1 What the product is

A web tool that helps a patient complete a structured pre-visit intake before a primary care appointment.

The tool:

- asks adaptive intake questions
- helps structure symptoms and timeline
- records facts in a normalized format
- generates a concise **doctor-facing summary**
- exports the summary to **PDF** for the patient to bring/share with a clinician

### 2.2 What the product is not

This tool is **not**:

- a doctor
- a diagnosis tool
- a treatment recommendation tool
- a triage / urgency advice tool
- a disease ranking / probability estimator
- a replacement for medical consultation

---

## 3. MVP Goal

The MVP goal is to improve intake quality and clinician readability by producing a structured summary that is:

- factual
- concise
- neutral
- easy to scan in **~30–60 seconds**

Primary outcome for MVP:

- the user can complete an intake and produce a doctor-friendly PDF without the system providing diagnosis/treatment/triage content.

---

## 4. Frozen Decisions (Must Not Change Without Strong Justification)

The following decisions are frozen for MVP:

- MVP = **Structured Intake Assistant for Primary Care**
- open-source web tool for **patient -> doctor-facing PDF summary**
- **no diagnosis**
- **no treatment recommendations**
- **no triage / urgency advice**
- hosted LLM via **Next.js server routes**
- **model-agnostic** runtime provider abstraction
- **deterministic fallback mode** is required
- local storage by default
- **no backend persistence of medical data** (MVP)
- vertical feature architecture (`domain / data / ui`)
- small PR workflow (`1 roadmap item = 1 issue = 1 PR`)

---

## 5. Users and Usage Context

### 5.1 Primary user (MVP)

- Adult patient preparing for a primary care visit

### 5.2 Secondary reader (MVP output consumer)

- Primary care clinician (doctor) reading a patient-generated summary

### 5.3 Intended usage moment

- Before a scheduled visit / consultation (not during an emergency context)

---

## 6. Scope (MVP)

### 6.1 In-scope (MVP)

- Patient-facing intake wizard
- Structured collection of symptoms and relevant history
- Adaptive questioning (deterministic baseline required)
- Optional AI-assisted questioning/normalization (with explicit consent)
- Doctor-facing summary preview
- PDF export
- Local draft persistence (IndexedDB)
- Output safety guardrails and sanitizer

### 6.2 Out-of-scope (MVP)

- Diagnosis suggestions or disease ranking
- Treatment plans or medication recommendations
- Urgency/triage advice
- Emergency decision support
- Pediatric workflows
- Pregnancy workflows
- EMR/EHR integration
- Accounts/authentication
- Backend medical-data storage
- Multi-clinic/B2B workflows
- Provider comparison/evaluation suite
- Multilingual support beyond basic language preservation (post-MVP)

---

## 7. Supported / Unsupported Use Matrix

### 7.1 Supported (MVP)

- Adult users (18+)
- Non-pregnancy-related intake
- Non-emergency usage
- Primary care intake preparation
- Patient-reported symptom/history collection
- Doctor-facing summary generation

### 7.2 Unsupported (MVP)

- Users under 18
- Pregnancy-related context
- Emergency / urgent contexts
- Requests for diagnosis
- Requests for treatment recommendations
- Requests for urgency advice / triage guidance

### 7.3 Required behavior for unsupported cases

When an unsupported case is detected, the system must:

- stop or block the intake flow
- show a neutral "not suitable for this case" message
- avoid diagnosis/treatment/urgency wording
- avoid severity classification
- avoid disease interpretation

The system must **not** attempt to "partially help" with triage-like advice.

---

## 8. Core User Flow (MVP)

### 8.1 End-to-end flow

1. User opens app
2. User sees global disclaimer and must acknowledge
3. User passes scope eligibility gate (supported/unsupported)
4. User starts intake wizard
5. User answers structured questions
6. User may use deterministic mode only, or optionally enable AI-assisted mode (with explicit AI consent)
7. User reviews collected data
8. System builds doctor-facing summary
9. Final output safety check runs before preview/PDF
10. User sees summary preview
11. User exports PDF

### 8.2 Failure/degradation behavior

The core flow must still work if:

- AI provider fails
- AI times out
- AI returns invalid JSON
- AI output is blocked by safety checks

In such cases, the system must continue using deterministic behavior where possible.

---

## 9. Functional Requirements

## 9.1 Global Disclaimer (Pre-start Safety Frame)

### Requirements

- A disclaimer screen/modal is shown before intake starts
- User must acknowledge via checkbox/action (e.g., "I understand")
- Intake cannot start without acknowledgment

### Disclaimer content requirements

The disclaimer must clearly state:

- this tool is not a doctor
- this tool does not diagnose conditions
- this tool does not provide treatment recommendations
- this tool does not provide urgency/triage advice
- generated content is a structured summary to support discussion with a clinician

### Copy constraints

- Neutral wording only
- No medical advice language
- No disease-specific phrasing
- No urgency ranking phrasing

---

## 9.2 Scope Eligibility Gate (Unsupported Cases)

### Purpose

Prevent use of the tool in unsupported contexts while staying within non-triage boundaries.

### Detection inputs (MVP)

Priority order (MVP-safe):

1. explicit user selections / self-declared context
2. conservative keyword/category fallback (non-diagnostic, non-triage)

### MVP unsupported gate checks

- age < 18
- pregnancy-related context
- emergency/urgent context (detected conservatively)

### Constraints

This gate is an **eligibility/scope gate**, not a triage engine.

It must not:

- rank severity
- estimate risk
- explain likely causes
- provide treatment/urgency recommendations

---

## 9.3 Intake Wizard UI Foundation

### Required UI elements

- Wizard layout
- Question card component
- Progress indicator / step indicator
- CTA controls: Next / Back / Save & Exit
- Review step entry point

### UX requirements

- Desktop-first
- Mobile usable (basic responsive support)
- Disabled/loading/error states for actions
- Recoverable interaction after refresh (if state restored)

---

## 9.4 Intake Session Domain Model (Schema-first)

### Central entity

`IntakeSession` (versioned)

### Minimum capabilities

- structured storage for:
  - chief complaint
  - symptom dimensions
  - timeline/history of present complaint
  - associated symptoms
  - systemic symptoms
  - relevant history
  - current medications
  - allergies / intolerances
  - red-flag-related facts (recorded as facts only)
- explicit support for:
  - `unknown`
  - `not_assessed`
- schema versioning for local persistence compatibility

### Data state semantics

Values must distinguish:

- user explicitly reported present
- user explicitly denied
- unknown (user does not know)
- not assessed (system did not ask yet)

---

## 9.5 Question and Answer Contracts

### Supported question types (MVP)

- single choice
- multi choice
- scale
- boolean
- free text
- date-ish / time-ish

### Requirements

- each question has a typed expected answer shape
- answer parser/validator rejects invalid answers safely
- invalid input must not corrupt stored session state
- deterministic parsing behavior for same input

---

## 9.6 Deterministic Intake Flow Engine (Required Baseline)

### Purpose

Provide a fully functional intake experience without AI.

### Required phases (MVP)

- chief complaint
- complaint details
- associated symptoms
- systemic symptoms
- history
- medications / allergies-intolerances
- review

### Requirements

- phase transitions implemented in `domain` layer
- pure logic (no UI or API concerns)
- tested transition rules and invalid transitions

### Completion rules (MVP)

The engine must define:

- global required fields
- conditional required fields
- phase exit conditions
- early review eligibility
- question budget/caps (soft/hard cap policy)

---

## 9.7 Rule-based Next Question Selector (Deterministic Baseline)

### Purpose

Choose the next best question without AI.

### Priority order (MVP baseline)

1. missing required complaint facts
2. key factual checklist items (including red-flag-related facts as facts only)
3. timeline clarifications
4. associated/systemic symptoms
5. history / medications / allergies-intolerances

### Requirements

- deterministic behavior (same input -> same next question)
- no duplicate question unless explicitly allowed
- respects already answered / unknown / not_assessed states
- covered by unit tests

---

## 9.8 Local Persistence (IndexedDB)

### Purpose

Support local-first usage without account creation.

### Requirements

- autosave intake session draft in IndexedDB
- restore/resume current draft
- delete/reset draft
- safe handling of incompatible/corrupt drafts

### MVP draft policy

- single active draft session (recommended for MVP simplicity)

### Versioning behavior

If a stored draft is incompatible:

- do not crash
- show a clear message
- reset safely (or migrate only if trivial and tested)

---

## 9.9 Summary Builder v1 (Deterministic)

### Purpose

Deliver core value without requiring AI.

### Output type

Doctor-facing structured summary built from validated structured intake state.

### Requirements

- neutral factual tone
- no diagnosis/treatment/urgency language
- includes explicit unknown/not assessed information
- separates clinician-facing facts from "Questions for doctor"

### Summary content rules

- Must reflect patient-reported content only
- Must not infer conditions
- Must not add new facts
- Must preserve distinctions (present/denied/unknown/not_assessed)

---

## 9.10 AI-Assisted Runtime (Optional per operation, consent-gated)

### AI is allowed for (MVP)

- clarifying question generation
- normalization of free text into structured fields
- optional neutral summary rewrite (feature-flagged; may be disabled by default)

### AI is not allowed for (MVP)

- flow control
- schema validation
- safety boundary enforcement
- unsupported-case gate decisions (except conservative assist if explicitly bounded; deterministic gate remains source of truth)
- summary structure definition
- PDF structure/layout decisions

---

## 9.11 AI Provider Abstraction (Model-agnostic)

### Requirements

- provider interface abstracted from UI
- provider selection configurable (env/config)
- mock provider for dev/tests
- AI operations return validated structured outputs or safe fallback objects

### Minimum provider failure scenarios to support

- timeout
- invalid JSON
- malformed shape
- refused response
- unsafe response (blocked by safety guardrail)

---

## 9.12 Server-side AI API Routes (Next.js Route Handlers)

### Requirements

- browser must not call LLM provider directly
- all provider calls go through server routes
- secrets never exposed to client bundle
- request timeouts and structured error responses implemented
- request body logging disabled/redacted at app level

### Privacy constraints

- no backend persistence of medical payloads
- no intentional storage of AI request/response bodies in logs
- any operational logging must be minimal and non-sensitive

---

## 9.13 Output Safety Guardrails + Sanitizer (Final Output Protection)

### Purpose

Prevent MVP boundary violations in generated output.

### Scope

Safety checks must run on:

- AI outputs (raw/parsed)
- final summary text before preview
- final summary text before PDF export

### Forbidden content categories

- diagnosis statements
- disease ranking/probability statements
- treatment recommendations
- urgency/triage advice

### MVP safety policy

Default policy: **block > rewrite**

Meaning:

- if unsafe fragment is detected and safe rewrite is not guaranteed, block the fragment/output
- show neutral fallback message
- do not insert clinical advice as fallback

---

## 9.14 Summary Preview + PDF Export v1

### Preview requirements

- doctor-friendly readable layout
- clear section headings
- separate "Questions for doctor" block
- visible disclaimer
- timestamp shown

### PDF requirements (MVP)

- printable export
- target format: A4 (acceptable tolerance for Letter)
- soft target: 1–2 pages (may exceed in edge cases)
- footer includes timestamp + disclaimer
- stable section order
- long text wraps safely (no hidden overflow)

### Non-goals for PDF v1

- advanced templates
- branding themes
- EMR formatting variants
- multilingual layout optimization

---

## 10. AI Consent & Mode State Model

## 10.1 Modes

- **Deterministic mode** (always available)
- **AI-assisted mode** (optional; explicit consent required)

## 10.2 Consent requirements

Before the first AI call in a session:

- user must explicitly consent to AI-assisted processing
- consent copy must clearly communicate that input may be sent to a hosted AI provider via server routes
- without consent, app remains in deterministic mode

## 10.3 Consent revocation

If user revokes AI consent during a session:

- AI-assisted operations stop
- system falls back to deterministic mode
- session remains usable

## 10.4 Failure behavior

If AI is unavailable/blocked:

- no hard block on intake
- continue deterministic flow where possible

---

## 11. Safety Wording Policy (UI + Summary + PDF + AI Output Handling)

## 11.1 Allowed style

- factual
- neutral
- patient-reported framing
- uncertainty-preserving language

Examples of acceptable framing:

- "Patient reports..."
- "Patient denies..."
- "Unknown"
- "Not assessed"

## 11.2 Forbidden style categories

The system must avoid wording that implies:

- diagnosis
- differential diagnosis
- treatment recommendation
- medication recommendation
- urgency/triage advice
- risk scoring/probability ranking

Examples of disallowed patterns (illustrative, not exhaustive):

- "This is likely..."
- "Most consistent with..."
- "You should take..."
- "Go to the ER now..." (triage wording)
- "This suggests [condition]"

## 11.3 Unsupported case messaging policy

Unsupported case messages must:

- state tool unsuitability neutrally
- avoid severity labels
- avoid disease explanation
- avoid ranking urgency

---

## 12. Data Handling & Non-Persistence Policy (MVP)

## 12.1 Local data storage

- Intake draft data is stored locally on the user's device (IndexedDB)
- No account is required

## 12.2 Backend data handling

- No backend database persistence of medical data in MVP
- No intentional storage of request/response medical payloads
- No app-level body logging of medical content

## 12.3 Error handling and logging

Allowed:

- minimal operational logs (status codes, timeouts, generic errors)
- redacted error metadata

Not allowed:

- request body dumps
- raw symptom text in logs
- raw AI response payloads in logs (unless explicitly redacted and non-sensitive)

## 12.4 Open-source/self-hosting note

Self-hosters are responsible for:

- provider configuration
- infrastructure logs
- proxy/CDN behavior
- compliance/privacy settings in their environment

MVP project docs must include a warning that local/non-persistent app behavior may differ depending on self-hosted deployment configuration.

---

## 13. Architecture Constraints (Implementation Rules)

### 13.1 Required architecture

Vertical features with strict layer separation:

- `domain/` = pure logic
- `data/` = storage/api adapters
- `ui/` = React components

### 13.2 Layering rules

- `domain` must not import UI components
- `domain` must not depend on framework concerns
- `ui` must not contain core business rules that belong in `domain`
- `data` adapts IO but does not redefine domain policy

### 13.3 Expected feature areas (MVP)

- intake
- summary
- safety
- shared utilities/components

---

## 14. Testing & Validation Requirements (MVP)

## 14.1 Unit tests (required)

- schema parsing and validation
- question/answer parsing
- flow transitions
- deterministic next-question selector
- deterministic summary builder
- sanitizer forbidden-content handling

## 14.2 Synthetic fixtures (required)

Maintain reusable synthetic cases covering:

- normal/simple intake
- chaotic/free-text intake
- short/missing-answer intake
- unsupported cases
- unsafe AI output examples (diagnosis/treatment/triage phrasing)

## 14.3 E2E coverage (minimum for RC)

At least one smoke end-to-end path before MVP release candidate:

- start -> disclaimer -> intake -> review -> summary -> PDF path
- deterministic mode path preferred as minimum baseline

(Full E2E pack can remain post-MVP.)

---

## 15. MVP Acceptance Metrics / Release Criteria

The MVP may be considered release-candidate ready when all of the following are true:

1. **End-to-end core flow works**
   - user can complete intake and generate summary + PDF

2. **Deterministic path is fully functional**
   - no AI required for core value

3. **AI-assisted path degrades safely**
   - timeout/invalid JSON/blocked output do not break the app

4. **No boundary violations in tested outputs**
   - no diagnosis/treatment/triage language in validated fixture outputs

5. **Output remains clinician-readable**
   - clear sectioned layout
   - "Questions for doctor" separated from factual content
   - no dense unstructured output as default

6. **Privacy boundaries are respected**
   - no backend persistence of medical payloads
   - no app-level body logging of medical content

---

## 16. Explicit Post-MVP Items (Not in Scope Now)

The following ideas are intentionally deferred:

- clinician compact mode
- JSON export (EMR-friendly)
- multilingual support
- provider/model eval pack
- multi-provider comparison tooling
- B2B clinic workflows / EMR plugin
- feedback loop from clinicians
- advanced PDF templates
- broad unsupported-case heuristics improvements
- full Playwright E2E matrix

---

## 17. Roadmap Traceability (High-level)

This spec is intended to guide roadmap item execution:

- **#1** repo bootstrap/rebrand aligns naming and project identity
- **#2** produces this spec + ADR-001 scope decision
- **#3–#5** establish UX/safety/wizard foundations
- **#6–#10** establish schema/contracts/fixtures
- **#11–#15** implement deterministic baseline engine and summary
- **#16–#19** add bounded AI runtime + safety guardrails
- **#20** delivers summary preview + PDF + end-to-end demo path

If implementation conflicts with this spec:

- preserve frozen decisions
- preserve boundary rules
- prefer deterministic/safe fallback behavior
- document any intentional change via ADR

---

## 18. Change Control (for future versions)

Any proposed change that affects one of the following must be reviewed before implementation:

- diagnosis/treatment/triage boundaries
- supported/unsupported matrix
- privacy/non-persistence policy
- AI consent behavior
- summary invariants
- final output safety policy
- architecture layer separation rules

Recommended mechanism:

- update spec version + add ADR if decision-level change

---
