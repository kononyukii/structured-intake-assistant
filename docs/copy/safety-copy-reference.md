# Safety Copy Reference (MVP)

This document provides safe, reusable copy for user-facing MVP screens and messages.

It is designed to align with:

- `docs/spec-v1.md`
- `docs/adr/001-product-scope.md`

This copy reference is intentionally conservative and avoids wording that could imply:

- diagnosis
- treatment recommendations
- triage / urgency advice
- disease probability/ranking

---

## 1. Copy Principles (MVP)

### 1.1 Tone

Use copy that is:

- neutral
- factual
- calm
- respectful
- easy to understand

### 1.2 Avoid

Do **not** use wording that:

- interprets symptoms clinically
- suggests likely conditions
- recommends medications/treatments
- assigns urgency levels
- sounds like emergency decision support

### 1.3 Preferred framing

Prefer language like:

- "This tool helps organize information for a doctor."
- "This tool may not be suitable for this situation."
- "Please discuss this summary with a qualified clinician."

Avoid language like:

- "You may have..."
- "This is likely..."
- "You should take..."
- "Go to the ER now..." (triage phrasing)
- "This tool can tell you what condition you have"

---

## 2. Global Disclaimer (Before Intake Start)

## 2.1 Recommended Title Variants

### Variant A (recommended default)

**Before you start**

### Variant B

**Please read before using this tool**

### Variant C

**Important information before intake**

---

## 2.2 Recommended Body Copy (Primary)

This tool helps you prepare a structured summary of your symptoms and history to discuss with a doctor.

It does **not**:

- diagnose medical conditions
- recommend treatment
- provide urgency or triage advice

This tool is intended to help organize information before a primary care visit. It does not replace a doctor or medical consultation.

---

## 2.3 Shorter Body Copy (Compact UI)

This tool helps organize your health information for a doctor visit.

It does **not** provide diagnosis, treatment recommendations, or urgency/triage advice, and it does not replace a doctor.

---

## 2.4 Acknowledgment Checkbox Labels

### Recommended

- [ ] **I understand this tool does not provide diagnosis, treatment, or triage advice.**
- [ ] **I understand this tool is for preparing information to discuss with a doctor.**

### Compact alternative

- [ ] **I understand and want to continue**

> If using the compact checkbox label, keep the full disclaimer text visible above it.

---

## 2.5 Primary CTA Labels

- **Start intake**
- **Continue**
- **Begin**

Avoid:

- "Get diagnosis"
- "Check condition"
- "Find what's wrong"

---

## 3. AI Consent Copy (Separate from Disclaimer)

> This is a separate consent for AI-assisted processing.
> Do not merge this concept silently into the general disclaimer.

## 3.1 AI Consent Title Variants

### Variant A (recommended)

**Enable AI-assisted features (optional)**

### Variant B

**Optional AI assistance**

---

## 3.2 AI Consent Body Copy (Primary)

This app can optionally use AI-assisted features to help with things like clarifying questions and organizing free-text answers.

If you enable this option, some information you enter may be sent to a hosted AI provider through secure server routes.

You can continue in deterministic mode without AI assistance.

---

## 3.3 AI Consent Body Copy (Compact)

AI assistance is optional. If enabled, some input may be sent to a hosted AI provider through server routes. You can continue without AI.

---

## 3.4 AI Consent Checkbox Labels

- [ ] **I agree to optional AI-assisted processing for this session**
- [ ] **I understand some input may be sent to a hosted AI provider if AI mode is enabled**

---

## 3.5 AI Consent CTA / Controls

- **Enable AI assistance**
- **Continue without AI**
- **Disable AI assistance** (for revocation)
- **Switch to deterministic mode**

Avoid:

- "Use smart medical AI"
- "Get better diagnosis with AI"
- "AI doctor mode"

---

## 4. Unsupported Case Messaging (Scope Gate)

> This section is for **eligibility/scope gate** copy only.
> It must not become triage guidance.

## 4.1 Generic Unsupported Message (Recommended Base)

### Title

**This tool is not suitable for this case**

### Body

This MVP version is limited to adult, non-emergency, primary care intake preparation and does not support all situations.

Please use an appropriate healthcare service for your situation.

### Actions

- **Back**
- **Close**
- **Start over**

---

## 4.2 Under-18 (Age) Unsupported Message

### Title

**This tool is not available for this case**

### Body

This MVP version is designed only for adults (18+). It is not intended for pediatric use.

Please use an appropriate healthcare service for this situation.

---

## 4.3 Pregnancy-related Unsupported Message

### Title

**This tool is not suitable for this case**

### Body

This MVP version does not support pregnancy-related intake.

Please use an appropriate healthcare service for this situation.

---

## 4.4 Emergency/Urgent Context Unsupported Message (Neutral, non-triage)

### Title

**This tool is not suitable for this situation**

### Body

This tool is not designed for emergency or urgent situations and cannot provide urgency or triage advice.

Please use an appropriate healthcare service for your situation.

> Keep this wording neutral.
> Do not add severity labels, symptom interpretation, or ranked urgency instructions.

---

## 4.5 What NOT to say (Unsupported Screens)

Do not use:

- "You may be having a serious condition"
- "This sounds dangerous"
- "Go to the ER immediately"
- "Call emergency services now"
- "Based on your symptoms..."
- "This may indicate..."

Even if the intent is safety, this becomes triage/clinical interpretation in MVP terms.

---

## 5. Intake Wizard Copy Fragments (Neutral)

## 5.1 Intro to Intake Wizard

### Option A (recommended)

**We’ll help you organize your symptoms and history into a summary you can discuss with a doctor.**

### Option B

**Answer a few questions to build a structured summary for your doctor visit.**

---

## 5.2 Progress/Assistive Copy

- **You can go back and change answers later.**
- **You can save and continue later on this device.**
- **If you are unsure, choose "Unknown" when available.**

---

## 5.3 "Unknown" / "Not assessed" Helper Text

- **Unknown** = you do not know the answer
- **Not assessed** = this was not asked in this session

(Only show this where helpful; avoid clutter.)

---

## 6. Review Step Copy

## 6.1 Review Screen Header

- **Review your information**
- **Review before summary**
- **Check your answers**

## 6.2 Review Screen Description

Please review your answers before generating the summary. You can go back to edit any section.

---

## 6.3 Generate Summary CTA

- **Generate summary**
- **Create doctor summary**
- **Continue to summary**

Avoid:

- "Get diagnosis summary"
- "Analyze my condition"

---

## 7. Summary Screen Copy (Doctor-facing Output Preview)

## 7.1 Summary Screen Header

- **Doctor-facing summary**
- **Structured summary for your doctor**
- **Summary preview**

## 7.2 Summary Screen Description

This summary is based on the information you entered. It is intended to support discussion with a clinician and does not provide diagnosis, treatment, or urgency advice.

---

## 7.3 "Questions for doctor" Block Intro (Patient-facing context)

- **These are questions or points you may want to discuss with your doctor.**
- **This section is separate from the factual summary.**

---

## 7.4 Export CTA

- **Export PDF**
- **Download PDF summary**
- **Print / Save as PDF** (if using browser print flow)

Avoid:

- "Export medical report" (can sound too authoritative)
- "Export diagnosis"

---

## 8. AI Failure / Timeout / Fallback Messages

> These messages should preserve user trust without sounding alarming.

## 8.1 AI Timeout / Temporary Failure

### Title

**AI assistance is temporarily unavailable**

### Body

You can continue in deterministic mode. Your intake data is still available on this device.

### Actions

- **Continue without AI**
- **Try again** (optional)
- **Disable AI assistance** (optional)

---

## 8.2 Invalid/Unreadable AI Output (Internal failure surfaced safely)

### Title

**AI output could not be used**

### Body

The app could not safely use the AI response. You can continue in deterministic mode.

---

## 8.3 AI Consent Missing (Attempted AI action)

### Title

**AI assistance is not enabled**

### Body

This action requires optional AI-assisted processing. You can enable AI assistance or continue without it.

### Actions

- **Enable AI assistance**
- **Continue without AI**

---

## 9. Safety Guardrail / Output Block Messages

## 9.1 Blocked AI-generated Fragment (Generic)

### Title

**Some generated text was not used**

### Body

The app blocked some generated content because it did not match this tool’s output rules. You can continue with a safe summary version.

---

## 9.2 Summary Output Blocked (Rare, final checkpoint)

### Title

**Summary needs a safe retry**

### Body

The app could not produce a summary that meets this tool’s output rules. Please review your answers and try again, or continue without AI assistance.

### Actions

- **Review answers**
- **Retry summary**
- **Continue without AI** (if applicable)

---

## 10. Reset / Delete Draft Copy

## 10.1 Delete Draft Confirmation

### Title

**Delete saved draft?**

### Body

This will remove the saved intake data from this device.

### Actions

- **Delete draft**
- **Cancel**

---

## 10.2 Corrupt/Incompatible Draft Message

### Title

**Saved draft could not be restored**

### Body

The saved draft on this device is incompatible or damaged and could not be safely loaded. You can start a new intake.

### Actions

- **Start new intake**
- **Close**

---

## 11. Footer / Persistent Disclaimer Fragments

Use short reminders in summary/PDF/footer areas.

### Safe options

- **This summary is patient-reported and is intended to support discussion with a clinician.**
- **This tool does not provide diagnosis, treatment, or urgency advice.**
- **Generated by Structured Intake Assistant (MVP).**

---

## 12. Copy QA Checklist (MVP)

Use this checklist before merging user-facing copy changes.

### Boundary checks

- [ ] No diagnosis wording
- [ ] No treatment recommendation wording
- [ ] No urgency/triage advice wording
- [ ] No disease ranking/probability wording

### Tone checks

- [ ] Neutral and factual
- [ ] No alarmist language
- [ ] No pseudo-clinical interpretation
- [ ] Understandable for general users

### Product positioning checks

- [ ] Clearly states support role (discussion with doctor)
- [ ] Does not imply replacement of clinician
- [ ] AI assistance is described as optional (where applicable)

---

## 13. Notes for Contributors

- Copy changes in health-related flows are product/safety changes, not "just text."
- If a copy change alters boundaries (diagnosis/treatment/triage implications), open a review discussion and consider an ADR update.
- Prefer conservative wording over "helpful sounding" wording in MVP.

---
