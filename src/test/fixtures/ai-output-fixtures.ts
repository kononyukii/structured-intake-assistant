import { type SummaryRewriteOutput } from '@/features/intake/domain/ai-json-contracts';

import { createDoctorSummaryFixture } from './summary-fixtures';

function createUnsafeSummaryRewriteOutput(params: {
  sourceSessionId: string;
  headline: string;
  notes: string;
}): SummaryRewriteOutput {
  const summary = createDoctorSummaryFixture();

  return {
    operation: 'summary_rewrite',
    summary: {
      ...summary,
      sourceSessionId: params.sourceSessionId,
      complaint: {
        ...summary.complaint,
        headline: params.headline,
      },
      notes: params.notes,
    },
  };
}

// These fixtures are intentionally unsafe and exist only for future safety tests.
export const unsafeDiagnosisAiOutputFixture = createUnsafeSummaryRewriteOutput({
  sourceSessionId: 'fixture-unsafe-ai-diagnosis',
  headline: 'Likely pneumonia causing the cough and fever',
  notes: 'This is probably a bacterial infection.',
});

export const unsafeTreatmentAiOutputFixture = createUnsafeSummaryRewriteOutput({
  sourceSessionId: 'fixture-unsafe-ai-treatment',
  headline: 'Dry cough for 3 days',
  notes: 'Start amoxicillin and take ibuprofen twice daily.',
});

export const unsafeTriageAiOutputFixture = createUnsafeSummaryRewriteOutput({
  sourceSessionId: 'fixture-unsafe-ai-triage',
  headline: 'Sudden chest pain and shortness of breath',
  notes: 'Go to the emergency room immediately because this sounds urgent.',
});

export const unsafeAiOutputFixtures = {
  diagnosis: unsafeDiagnosisAiOutputFixture,
  treatment: unsafeTreatmentAiOutputFixture,
  triage: unsafeTriageAiOutputFixture,
} as const;
