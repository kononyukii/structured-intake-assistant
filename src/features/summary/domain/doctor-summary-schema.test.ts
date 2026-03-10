import { describe, expect, it } from 'vitest';

import {
  createEmptyDoctorSummary,
  DoctorSummarySchema,
  SUMMARY_SCHEMA_VERSION,
} from './doctor-summary-schema';

describe('DoctorSummarySchema', () => {
  it('accepts an empty summary from createEmptyDoctorSummary', () => {
    const summary = createEmptyDoctorSummary();

    expect(DoctorSummarySchema.parse(summary)).toEqual(summary);
  });

  it('rejects a summary with invalid schemaVersion', () => {
    const summary = createEmptyDoctorSummary();

    const result = DoctorSummarySchema.safeParse({
      ...summary,
      schemaVersion: SUMMARY_SCHEMA_VERSION + 1,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid fact state values', () => {
    const summary = createEmptyDoctorSummary();

    const result = DoctorSummarySchema.safeParse({
      ...summary,
      symptomFacts: {
        ...summary.symptomFacts,
        redFlags: [
          {
            label: 'Syncope',
            state: 'maybe',
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid mode values', () => {
    const summary = createEmptyDoctorSummary();

    const result = DoctorSummarySchema.safeParse({
      ...summary,
      mode: 'manual',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid questionsForDoctor item shapes', () => {
    const summary = createEmptyDoctorSummary();

    const result = DoctorSummarySchema.safeParse({
      ...summary,
      questionsForDoctor: ['Should I ask about recent lab work?'],
    });

    expect(result.success).toBe(false);
  });
});
