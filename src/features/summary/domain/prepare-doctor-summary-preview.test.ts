import { describe, expect, it } from 'vitest';

import { DoctorSummarySchema } from '@/features/summary/domain/doctor-summary-schema';
import { createSimpleIntakeSessionFixture } from '@/test/fixtures/intake-fixtures';

import { prepareDoctorSummaryPreview } from './prepare-doctor-summary-preview';

const FIXED_GENERATED_AT = '2026-03-06T14:15:00.000Z';

describe('prepareDoctorSummaryPreview', () => {
  it('builds and safety-checks a deterministic summary without AI', () => {
    const result = prepareDoctorSummaryPreview(
      createSimpleIntakeSessionFixture(),
      {
        generatedAt: FIXED_GENERATED_AT,
        language: 'en',
      }
    );

    expect(result.decision).toBe('safe');

    if (result.decision === 'blocked') {
      throw new Error(
        'Expected deterministic preview summary to be renderable.'
      );
    }

    expect(DoctorSummarySchema.parse(result.data)).toEqual(result.data);
    expect(result.data.mode).toBe('deterministic');
    expect(result.data.generatedAt).toBe(FIXED_GENERATED_AT);
    expect(result.data.header.disclaimer).toContain(
      'does not provide diagnosis, treatment recommendations, or urgency advice.'
    );
  });
});
