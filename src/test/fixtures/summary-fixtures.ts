import {
  createEmptyDoctorSummary,
  type DoctorSummary,
  DoctorSummarySchema,
} from '@/features/summary/domain/doctor-summary-schema';

const FIXTURE_SUMMARY_TIMESTAMP = '2026-03-01T10:05:00.000Z';

type SummaryTextField = DoctorSummary['timeline']['onset'];

function createFixtureBaseSummary(sourceSessionId: string): DoctorSummary {
  const summary = createEmptyDoctorSummary({
    sourceSessionId,
    mode: 'deterministic',
  });

  return {
    ...summary,
    generatedAt: FIXTURE_SUMMARY_TIMESTAMP,
  };
}

function presentText(detail: string): SummaryTextField {
  return { state: 'present', detail };
}

function unknownText(): SummaryTextField {
  return { state: 'unknown' };
}

function notAssessedText(): SummaryTextField {
  return { state: 'not_assessed' };
}

export function createDoctorSummaryFixture(): DoctorSummary {
  const summary = createFixtureBaseSummary('fixture-simple-intake');

  return DoctorSummarySchema.parse({
    ...summary,
    language: 'en',
    complaint: {
      headline: 'Dry cough for 3 days',
      detail:
        'Patient reports a dry cough that is worse at night with mild fatigue and nasal congestion.',
    },
    timeline: {
      onset: presentText('2026-02-26'),
      duration: presentText('3 days'),
      course: presentText('About the same overall, worse at night'),
    },
    symptomFacts: {
      associatedSymptoms: [
        {
          label: 'Sore throat',
          state: 'present',
        },
        {
          label: 'Nasal congestion',
          state: 'present',
        },
        {
          label: 'Shortness of breath',
          state: 'denied',
        },
      ],
      systemicSymptoms: [
        {
          label: 'Fatigue',
          state: 'present',
        },
        {
          label: 'Fever',
          state: 'denied',
        },
      ],
      redFlags: [
        {
          label: 'Chest pain',
          state: 'denied',
        },
        {
          label: 'Fainting',
          state: 'unknown',
        },
      ],
    },
    history: {
      relevantConditions: {
        state: 'present',
        items: [{ label: 'Seasonal allergies' }],
      },
      surgeries: {
        state: 'denied',
        items: [],
      },
      familyHistory: {
        state: 'unknown',
        items: [],
      },
    },
    medications: {
      state: 'present',
      items: [{ label: 'Cetirizine', detail: '10 mg as needed for allergies' }],
    },
    allergiesIntolerances: {
      state: 'present',
      items: [{ label: 'Penicillin', detail: 'Rash in childhood' }],
    },
    questionsForDoctor: [
      {
        question: 'Should I mention that the cough is worse at night?',
      },
    ],
    notes: 'Patient-reported summary for discussion with a clinician.',
  });
}

export function createMinimalDoctorSummaryFixture(): DoctorSummary {
  const summary = createFixtureBaseSummary('fixture-short-missing-answer');

  return DoctorSummarySchema.parse({
    ...summary,
    complaint: {
      headline: 'Headache before visit',
    },
    timeline: {
      onset: unknownText(),
      duration: unknownText(),
      course: notAssessedText(),
    },
    symptomFacts: {
      associatedSymptoms: [
        {
          label: 'Nausea',
          state: 'unknown',
        },
      ],
      systemicSymptoms: [],
      redFlags: [
        {
          label: 'Fainting',
          state: 'not_assessed',
        },
      ],
    },
  });
}
