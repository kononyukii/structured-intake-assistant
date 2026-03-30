import { describe, expect, it } from 'vitest';

import {
  createEmptyIntakeSession,
  type IntakeSession,
  IntakeSessionSchema,
} from '@/features/intake/domain/intake-session-schema';
import {
  createChaoticFreeTextIntakeSessionFixture,
  createShortMissingAnswerIntakeSessionFixture,
  createSimpleIntakeSessionFixture,
} from '@/test/fixtures/intake-fixtures';

import { buildDoctorSummary } from './build-doctor-summary';
import { DoctorSummarySchema } from './doctor-summary-schema';

const FIXED_GENERATED_AT = '2026-03-05T09:30:00.000Z';
const FIXED_SESSION_TIMESTAMP = '2026-03-01T10:00:00.000Z';

function buildSummary(session: IntakeSession, options?: { language?: string }) {
  return buildDoctorSummary(session, {
    generatedAt: FIXED_GENERATED_AT,
    ...options,
  });
}

describe('buildDoctorSummary', () => {
  it('builds a valid summary from a minimally completed intake session', () => {
    const session = createSimpleIntakeSessionFixture();
    const summary = buildSummary(session, { language: 'en' });

    expect(DoctorSummarySchema.parse(summary)).toEqual(summary);
    expect(summary).toMatchObject({
      generatedAt: FIXED_GENERATED_AT,
      sourceSessionId: 'fixture-simple-intake',
      mode: 'deterministic',
      language: 'en',
      header: {
        title: 'Doctor Summary',
        disclaimer: 'Patient-reported summary prepared to support discussion with a clinician.',
      },
      complaint: {
        headline: 'Dry cough for 3 days',
        detail: 'Location: Throat and upper chest; Severity: Mild; Quality: Dry and irritating',
      },
      timeline: {
        onset: { state: 'present', detail: '2026-02-26' },
        duration: { state: 'present', detail: '3 days' },
        course: { state: 'present', detail: 'About the same overall, worse at night' },
      },
    });
  });

  it('builds a valid summary for sparse input with explicit unresolved states', () => {
    const session = createShortMissingAnswerIntakeSessionFixture();
    const summary = buildSummary(session);

    expect(DoctorSummarySchema.parse(summary)).toEqual(summary);
    expect(summary.complaint).toEqual({
      headline: 'Headache',
    });
    expect(summary.timeline).toEqual({
      onset: { state: 'unknown' },
      duration: { state: 'unknown' },
      course: { state: 'not_assessed' },
    });
    expect(summary.history).toEqual({
      relevantConditions: { state: 'unknown', items: [] },
      surgeries: { state: 'not_assessed', items: [] },
      familyHistory: { state: 'not_assessed', items: [] },
    });
    expect(summary.medications).toEqual({ state: 'unknown', items: [] });
    expect(summary.allergiesIntolerances).toEqual({ state: 'not_assessed', items: [] });
    expect(summary.questionsForDoctor).toEqual([
      {
        question: 'Clarify symptom details',
        detail: 'Location, Severity, Quality',
      },
      {
        question: 'Clarify symptom onset',
      },
      {
        question: 'Clarify duration of symptoms',
      },
      {
        question: 'Clarify symptom course',
      },
      {
        question: 'Clarify relevant medical conditions',
      },
      {
        question: 'Clarify past surgeries',
      },
      {
        question: 'Clarify family history',
      },
      {
        question: 'Clarify current medications',
      },
      {
        question: 'Clarify allergies or intolerances',
      },
      {
        question: 'Clarify associated symptoms',
        detail: 'Light sensitivity, Nausea',
      },
      {
        question: 'Clarify systemic symptoms',
        detail: 'Fatigue, Fever',
      },
      {
        question: 'Clarify red flags',
        detail: 'Fainting, Vision changes',
      },
    ]);
  });

  it('maps boolean fact states into present, denied, unknown, and not_assessed fact items', () => {
    const session = IntakeSessionSchema.parse({
      ...createEmptyIntakeSession(),
      id: 'fixture-boolean-facts',
      createdAt: FIXED_SESSION_TIMESTAMP,
      updatedAt: FIXED_SESSION_TIMESTAMP,
      associatedSymptoms: {
        nausea: 'yes',
        cough: 'no',
      },
      systemicSymptoms: {
        fever: 'unknown',
      },
      redFlags: {
        shortnessOfBreath: 'not_assessed',
      },
    });

    const summary = buildSummary(session);

    expect(summary.symptomFacts.associatedSymptoms).toEqual([
      {
        label: 'Cough',
        state: 'denied',
      },
      {
        label: 'Nausea',
        state: 'present',
      },
    ]);
    expect(summary.symptomFacts.systemicSymptoms).toEqual([
      {
        label: 'Fever',
        state: 'unknown',
      },
    ]);
    expect(summary.symptomFacts.redFlags).toEqual([
      {
        label: 'Shortness of breath',
        state: 'not_assessed',
      },
    ]);
  });

  it('maps medications and allergies into collection sections and unresolved detail questions', () => {
    const session = IntakeSessionSchema.parse({
      ...createSimpleIntakeSessionFixture(),
      medications: {
        kind: 'value',
        value: [
          {
            name: 'Ibuprofen',
            details: {
              kind: 'value',
              value: '200 mg as needed',
            },
          },
          {
            name: 'Vitamin D',
            details: {
              kind: 'unknown',
            },
          },
        ],
      },
      allergiesIntolerances: {
        kind: 'value',
        value: [
          {
            substance: 'Peanuts',
            reaction: {
              kind: 'value',
              value: 'Hives',
            },
          },
          {
            substance: 'Dust',
            reaction: {
              kind: 'not_assessed',
            },
          },
        ],
      },
    });

    const summary = buildSummary(session);

    expect(summary.medications).toEqual({
      state: 'present',
      items: [
        {
          label: 'Ibuprofen',
          detail: '200 mg as needed',
        },
        {
          label: 'Vitamin D',
        },
      ],
    });
    expect(summary.allergiesIntolerances).toEqual({
      state: 'present',
      items: [
        {
          label: 'Peanuts',
          detail: 'Hives',
        },
        {
          label: 'Dust',
        },
      ],
    });
    expect(summary.questionsForDoctor).toContainEqual({
      question: 'Clarify medication details',
      detail: 'Vitamin D',
    });
    expect(summary.questionsForDoctor).toContainEqual({
      question: 'Clarify allergy or intolerance reactions',
      detail: 'Dust',
    });
  });

  it('keeps questionsForDoctor separate from factual sections', () => {
    const session = createSimpleIntakeSessionFixture();
    const summary = buildSummary(session);

    expect(summary.history.relevantConditions).toEqual({
      state: 'present',
      items: [{ label: 'Seasonal allergies' }],
    });
    expect(summary.questionsForDoctor).toEqual([
      {
        question: 'Clarify family history',
      },
    ]);
  });

  it('does not introduce diagnosis, treatment, or urgency language into deterministic outputs', () => {
    const summaries = [
      buildSummary(createSimpleIntakeSessionFixture()),
      buildSummary(createShortMissingAnswerIntakeSessionFixture()),
      buildSummary(createChaoticFreeTextIntakeSessionFixture()),
    ];

    for (const summary of summaries) {
      const outputText = JSON.stringify(summary).toLowerCase();

      expect(outputText).not.toContain('diagnosis');
      expect(outputText).not.toContain('treatment');
      expect(outputText).not.toContain('recommend');
      expect(outputText).not.toContain('urgent');
      expect(outputText).not.toContain('urgency');
      expect(outputText).not.toContain('triage');
    }
  });

  it('returns stable output for the same input and fixed timestamp', () => {
    const session = createChaoticFreeTextIntakeSessionFixture();

    expect(buildSummary(session)).toEqual(buildSummary(session));
    expect(buildSummary(session).symptomFacts.associatedSymptoms.map((item) => item.label)).toEqual(
      ['Chest tightness', 'Nasal congestion', 'Sore throat', 'Wheezing'],
    );
  });
});
