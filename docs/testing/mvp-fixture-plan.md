# MVP Fixture Plan (Testing + Safety + Output Validation)

This document defines the fixture strategy for MVP development and validation.

It is designed to support roadmap items:

- #10 Domain fixtures + synthetic cases
- #15 Deterministic summary builder v1
- #19 Output safety guardrails + sanitizer
- #20 Summary preview + PDF MVP release candidate checks

This plan keeps fixtures practical, reusable, and aligned with MVP boundaries.

---

## 1. Goals

The fixture set should help the project verify:

1. deterministic intake flow behavior
2. schema validation and parsing safety
3. summary invariants (factual, no diagnosis/treatment/triage)
4. unsupported-case gating behavior
5. AI failure and unsafe-output handling
6. end-to-end MVP demo stability (through representative synthetic cases)

Fixtures are **not** meant to simulate real clinical datasets or achieve medical coverage.

---

## 2. Fixture Design Principles

### 2.1 Use synthetic, non-identifiable data only

Fixtures must be synthetic and must not include real patient data.

### 2.2 Keep fixtures focused and labeled

Each fixture should test a clear behavior or risk area, not "everything at once."

### 2.3 Prefer reusable building blocks

Where possible, split into:

- input fixture
- expected parsed state
- expected summary snapshot
- expected safety result

### 2.4 Preserve MVP boundaries

Fixtures must not normalize or validate diagnosis/treatment/triage behaviors as acceptable outputs.

---

## 3. Fixture Taxonomy (MVP)

The fixture set should be organized into the following categories.

### 3.1 Intake Flow Fixtures (`intake-flow/*`)

**Purpose:**

- validate deterministic phase transitions
- validate next-question selector behavior
- validate completion/review eligibility

**Recommended cases:**

1. **simple_common_case**
   - clear chief complaint
   - enough answers to complete flow
   - low ambiguity

2. **chaotic_free_text_case**
   - long, unstructured complaint text
   - incomplete details
   - mixed wording
   - tests normalization + fallback paths

3. **minimal_answers_case**
   - many unknown/skipped answers
   - validates question budget and review fallback

4. **back_navigation_edit_case**
   - answer changed after moving forward
   - validates state consistency and transition recalculation

5. **duplicate_answer_guard_case**
   - ensures selector does not repeat same question unintentionally

---

### 3.2 Schema Parsing Fixtures (`schemas/*`)

**Purpose:**

- validate Zod schemas and parser behavior
- test valid/invalid payload handling safely

**Recommended groups:**

- `intake-session.valid.*`
- `intake-session.invalid.*`
- `question.valid.*`
- `question.invalid.*`
- `answer.valid.*`
- `answer.invalid.*`
- `summary.valid.*`
- `summary.invalid.*`

**Required edge cases:**

- missing required keys
- wrong enum values
- malformed date-ish values
- invalid answer shape for question type
- explicit `unknown` / `not_assessed` semantics
- incompatible version metadata (for local persistence restore tests)

---

### 3.3 Unsupported Case Fixtures (`scope-gate/*`)

**Purpose:**

- validate supported/unsupported detection behavior
- ensure neutral blocking behavior (no triage wording)

**Minimum required fixtures:**

1. **under_18_case**
   - explicit age input below 18
   - expected result: unsupported

2. **pregnancy_related_case**
   - explicit pregnancy-related context selected/declared
   - expected result: unsupported

3. **emergency_like_keyword_case**
   - conservative keyword/category trigger
   - expected result: unsupported (without clinical interpretation)

4. **false_positive_guard_case** (recommended)
   - wording that should _not_ trigger unsupported gate
   - helps prevent overblocking

**Assertions:**

- gate returns unsupported status (or equivalent)
- UI message key/category is neutral
- no diagnosis/treatment/triage wording in output copy keys/snapshots

---

### 3.4 Summary Builder Fixtures (`summary-builder/*`)

**Purpose:**

- validate deterministic summary generation invariants

**Recommended cases:**

1. **well_structured_complete_case**
   - rich structured input
   - expected compact summary sections

2. **missing_info_case**
   - several unknown/not_assessed fields
   - expected explicit missing/not_assessed representation

3. **denied_symptoms_case**
   - validates denied vs unknown distinction in output

4. **long_free_text_input_case**
   - tests safe truncation/wrapping/section formatting assumptions (summary preview + PDF prep)

5. **question_for_doctor_separation_case**
   - validates strict separation between factual content and open questions

**Required assertions:**

- no diagnosis wording
- no treatment wording
- no urgency/triage wording
- preserves present/denied/unknown/not_assessed semantics
- stable section order

---

### 3.5 AI Contract Fixtures (`ai-contracts/*`)

**Purpose:**

- validate parsing, fallback behavior, and safe degradation for provider responses

**Operations to cover:**

- next question generation
- answer normalization
- optional summary rewrite (if implemented/flagged)

**Minimum cases per operation:**

1. **valid_json_valid_shape**
2. **valid_json_invalid_shape**
3. **invalid_json**
4. **empty_response**
5. **timeout_simulated**
6. **refusal_response**
7. **unsafe_content_response**

**Assertions:**

- parser returns safe fallback object on failure
- UI/domain state is not corrupted
- deterministic fallback path is triggered where expected
- no uncaught exceptions propagate to UI

---

### 3.6 Safety Guardrail / Sanitizer Fixtures (`safety-sanitizer/*`)

**Purpose:**

- validate forbidden content detection and block/rewrite policy

**Required categories:**

1. **diagnosis_like_phrasing**
2. **treatment_recommendation_phrasing**
3. **urgency_or_triage_phrasing**
4. **disease_ranking_probability_phrasing**
5. **safe_neutral_summary_phrasing** (false-positive control)
6. **patient_reported_neutral_phrasing** (false-positive control)

**Example fixture intent (not exact text requirement):**

- `"This is likely ..."` -> blocked
- `"You should take ..."` -> blocked
- `"Go to emergency ..."` -> blocked (MVP triage boundary)
- `"Patient reports..."` -> allowed

**Assertions:**

- forbidden category classification is correct
- MVP default policy = block > rewrite (unless explicitly configured otherwise)
- fallback user-facing message is neutral
- safe phrasing is not incorrectly blocked

---

### 3.7 Local Persistence Fixtures (`persistence/*`)

**Purpose:**

- validate IndexedDB restore/reset behavior and schema version compatibility handling

**Recommended cases:**

1. **current_version_valid_draft**
2. **old_version_migratable_draft** (only if migration exists)
3. **old_version_incompatible_draft**
4. **corrupt_draft_payload**
5. **empty_storage_state**

**Assertions:**

- valid draft restores successfully
- incompatible/corrupt draft does not crash app
- safe reset path is used
- user-facing message key is correct

---

### 3.8 PDF/Preview Snapshot Fixtures (`output-preview-pdf/*`) (lightweight MVP use)

**Purpose:**

- verify output structure for preview/PDF generation without overfitting to exact rendering

**Recommended approach:**

Prefer structure assertions and text-block assertions over pixel snapshots (for MVP), unless a specific rendering bug is targeted.

**Cases:**

1. **standard_summary_preview**
2. **long_summary_preview_overflow_guard**
3. **missing_info_summary_preview**
4. **questions_for_doctor_separated_preview**

**Assertions:**

- headings present in expected order
- footer disclaimer/timestamp present
- "Questions for doctor" block separate from factual sections
- no forbidden wording appears after final safety checkpoint

---

## 4. Suggested Directory Structure

Example structure (adjust to project conventions):

```text
tests/
  fixtures/
    intake-flow/
    schemas/
    scope-gate/
    summary-builder/
    ai-contracts/
    safety-sanitizer/
    persistence/
    output-preview-pdf/
```

If shared fixture helpers are needed:

```text
tests/
  fixtures/
    _shared/
      builders/
      factories/
      expected/
```

---

## 5. Fixture File Conventions

### 5.1 Naming convention

Use descriptive, stable names:

- `simple_common_case.input.json`
- `simple_common_case.expected-summary.json`
- `simple_common_case.expected-snapshot.md`
- `invalid_json.response.txt`
- `diagnosis_like_phrasing.input.txt`

Avoid vague names like:

- `test1.json`
- `sample-final.json`
- `new-case.json`

---

### 5.2 Fixture metadata header (recommended)

If using JSON/MD fixtures, include minimal metadata where useful:

- fixture id
- category
- purpose
- expected outcome
- notes (optional)

Example (conceptual):

- `id`: `scope-gate.emergency_like_keyword_case`
- `purpose`: `unsupported detection`
- `expected`: `unsupported_neutral_message`

---

## 6. Minimum MVP Fixture Set (Pragmatic Baseline)

If time is tight, this is the minimum set that still provides good coverage.

### Required minimum set (recommended)

- **Intake flow:** 4 fixtures
  - simple / chaotic / minimal / back-navigation
- **Scope gate:** 3 fixtures
  - under18 / pregnancy / emergency-like
- **Summary builder:** 4 fixtures
  - complete / missing / denied / questions-separation
- **AI contracts:** 6 fixtures
  - valid / invalid shape / invalid JSON / timeout / refusal / unsafe
- **Sanitizer:** 6 fixtures
  - diagnosis / treatment / triage / probability / safe neutral / patient-reported safe
- **Persistence:** 3 fixtures
  - valid / incompatible / corrupt
- **Preview/PDF structure:** 2 fixtures
  - standard / long text

This yields a compact but high-value MVP fixture baseline.

---

## 7. How Fixtures Map to Roadmap Items

### #10 Domain fixtures + synthetic cases

Primary deliverable for:

- intake flow fixtures
- schema fixtures
- scope-gate fixtures
- summary fixtures baseline

### #15 Deterministic summary builder v1

Use:

- summary-builder fixtures
- sanitizer false-positive controls
- output preview structure fixtures (partial)

### #19 Output safety guardrails + sanitizer

Use:

- safety-sanitizer fixtures
- ai-contract fixtures (unsafe responses)
- summary-builder fixtures for final-output checkpoint tests

### #20 PDF export v1 + doctor-friendly summary screen

Use:

- output-preview-pdf fixtures
- summary-builder fixtures
- at least one end-to-end representative synthetic case

---

## 8. Test Strategy Guidance (MVP Pragmatic)

### 8.1 Prefer invariant checks over fragile snapshots

Check:

- required sections exist
- forbidden wording absent
- semantic distinctions preserved

Instead of overrelying on:

- full string snapshots for every output
- pixel-perfect render snapshots

### 8.2 Keep provider fixtures vendor-neutral

AI fixtures should represent response categories, not vendor branding or vendor-specific wording assumptions.

### 8.3 Separate parser tests from policy tests

For example:

- parser validity (shape/JSON)
- sanitizer policy (forbidden categories)
- final output checkpoint (post-assembly safety)

This reduces debugging confusion.

---

## 9. Fixture Ownership and Review Rules

### 9.1 Treat fixture updates as behavior changes

If a fixture expected output changes, reviewers should ask:

- Was behavior intentionally changed?
- Does this affect MVP boundaries?
- Does spec/ADR need an update?

### 9.2 Avoid silent loosening of safety fixtures

Never "fix tests" by weakening forbidden-content expectations unless there is an explicit reviewed decision.

### 9.3 Keep fixture comments boundary-aware

Do not annotate fixtures with diagnostic interpretations or triage rationale.

---

## 10. Example Fixture Matrix (Compact)

| Category           | Fixture ID                            | Main Purpose                      | Must Pass Before |
| ------------------ | ------------------------------------- | --------------------------------- | ---------------- |
| intake-flow        | `simple_common_case`                  | deterministic happy path          | #15              |
| intake-flow        | `chaotic_free_text_case`              | resilience to messy input         | #15              |
| scope-gate         | `under_18_case`                       | unsupported blocking              | #4               |
| scope-gate         | `pregnancy_related_case`              | unsupported blocking              | #4               |
| scope-gate         | `emergency_like_keyword_case`         | unsupported blocking (neutral)    | #4               |
| summary-builder    | `missing_info_case`                   | unknown/not_assessed handling     | #15              |
| summary-builder    | `question_for_doctor_separation_case` | factual/open-questions separation | #15 / #20        |
| ai-contracts       | `invalid_json`                        | safe parser fallback              | #9 / #18         |
| ai-contracts       | `timeout_simulated`                   | safe degradation                  | #17 / #18        |
| ai-contracts       | `unsafe_content_response`             | guardrail path                    | #19              |
| safety-sanitizer   | `diagnosis_like_phrasing`             | forbidden-content block           | #19              |
| safety-sanitizer   | `urgency_or_triage_phrasing`          | forbidden-content block           | #19              |
| persistence        | `corrupt_draft_payload`               | safe reset/no crash               | #14              |
| output-preview-pdf | `standard_summary_preview`            | section/footer structure          | #20              |

> This table is a planning aid, not a requirement for test implementation style.

---

## 11. Future Expansion (Post-MVP)

Deferred fixture types for later phases:

- multilingual fixtures
- clinician compact mode fixtures
- JSON export / EMR mapping fixtures
- provider comparison eval fixtures
- larger false-positive/false-negative sanitizer benchmark sets

Do not add these during MVP unless needed to fix a real blocker.

---
