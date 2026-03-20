import { describe, expect, it } from 'vitest';

import { validateSummaryRewriteOutput } from '@/features/intake/domain/ai-json-contracts';
import { IntakeSessionSchema } from '@/features/intake/domain/intake-session-schema';
import { DoctorSummarySchema } from '@/features/summary/domain/doctor-summary-schema';

import {
  unsafeAiOutputFixtures,
  unsafeDiagnosisAiOutputFixture,
  unsafeTreatmentAiOutputFixture,
  unsafeTriageAiOutputFixture,
} from './ai-output-fixtures';
import {
  createBooleanQuestionFixture,
  createChaoticFreeTextIntakeSessionFixture,
  createFreeTextQuestionFixture,
  createQuestionAnswerPairFixture,
  createShortMissingAnswerIntakeSessionFixture,
  createSimpleIntakeSessionFixture,
  createUnsupportedEmergencySessionFixture,
  createUnsupportedPregnancySessionFixture,
  createUnsupportedUnderageSessionFixture,
  SYNTHETIC_CASE_IDS,
} from './intake-fixtures';
import {
  createDoctorSummaryFixture,
  createMinimalDoctorSummaryFixture,
} from './summary-fixtures';

describe('shared domain fixtures', () => {
  it('parses reusable intake session fixtures against IntakeSessionSchema', () => {
    const sessions = [
      createSimpleIntakeSessionFixture(),
      createChaoticFreeTextIntakeSessionFixture(),
      createShortMissingAnswerIntakeSessionFixture(),
      createUnsupportedUnderageSessionFixture(),
      createUnsupportedPregnancySessionFixture(),
      createUnsupportedEmergencySessionFixture(),
    ];

    expect(sessions.map((session) => IntakeSessionSchema.parse(session).id)).toEqual([
      'fixture-simple-intake',
      'fixture-chaotic-free-text',
      'fixture-short-missing-answer',
      'fixture-unsupported-underage',
      'fixture-unsupported-pregnancy',
      'fixture-unsupported-emergency',
    ]);
  });

  it('keeps unsupported fixtures structurally valid while encoding unsupported contexts', () => {
    const underage = createUnsupportedUnderageSessionFixture();
    const pregnancy = createUnsupportedPregnancySessionFixture();
    const emergency = createUnsupportedEmergencySessionFixture();

    expect(IntakeSessionSchema.parse(underage).chiefComplaint.summary).toMatchObject({
      kind: 'value',
      value: expect.stringContaining('17-year-old'),
    });
    expect(IntakeSessionSchema.parse(pregnancy).chiefComplaint.summary).toMatchObject({
      kind: 'value',
      value: expect.stringContaining('pregnant'),
    });
    expect(IntakeSessionSchema.parse(emergency).chiefComplaint.summary).toMatchObject({
      kind: 'value',
      value: expect.stringContaining('chest pain'),
    });
    expect(emergency.redFlags).toMatchObject({
      chestPain: 'yes',
      shortnessOfBreath: 'yes',
    });
  });

  it('parses reusable summary fixtures against DoctorSummarySchema', () => {
    const completeSummary = createDoctorSummaryFixture();
    const minimalSummary = createMinimalDoctorSummaryFixture();

    expect(DoctorSummarySchema.parse(completeSummary).sourceSessionId).toBe('fixture-simple-intake');
    expect(DoctorSummarySchema.parse(minimalSummary).sourceSessionId).toBe(
      'fixture-short-missing-answer',
    );
  });

  it('provides reusable question and answer fixture helpers', () => {
    const booleanQuestion = createBooleanQuestionFixture();
    const freeTextQuestion = createFreeTextQuestionFixture();
    const questionAnswerPair = createQuestionAnswerPairFixture({ question: booleanQuestion });

    expect(booleanQuestion.type).toBe('boolean');
    expect(freeTextQuestion.type).toBe('free_text');
    expect(questionAnswerPair.question.type).toBe(questionAnswerPair.answer.type);
  });

  it('exports unsafe AI fixtures with summary rewrite shape for future safety tests', () => {
    const outputs = Object.values(unsafeAiOutputFixtures);

    for (const output of outputs) {
      expect(validateSummaryRewriteOutput(output)).toEqual({
        ok: true,
        data: output,
      });
    }

    expect(unsafeDiagnosisAiOutputFixture.summary.complaint.headline).toEqual(
      expect.stringContaining('Likely'),
    );
    expect(unsafeTreatmentAiOutputFixture.summary.notes).toEqual(
      expect.stringContaining('amoxicillin'),
    );
    expect(unsafeTriageAiOutputFixture.summary.notes).toEqual(
      expect.stringContaining('emergency room'),
    );
  });

  it('exports stable synthetic case ids for future fixture consumers', () => {
    expect(SYNTHETIC_CASE_IDS).toEqual([
      'simple_intake',
      'chaotic_free_text',
      'short_missing_answers',
      'unsupported_underage',
      'unsupported_pregnancy',
      'unsupported_emergency',
      'unsafe_ai_diagnosis',
      'unsafe_ai_treatment',
      'unsafe_ai_triage',
    ]);
  });
});
