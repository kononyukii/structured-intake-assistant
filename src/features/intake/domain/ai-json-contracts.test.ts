import { describe, expect, expectTypeOf, it } from 'vitest';

import { createEmptyDoctorSummary } from '../../summary/domain/doctor-summary-schema';
import {
  type AiValidationResult,
  type ClarifyingQuestionGenerationOutput,
  createInvalidAiOutputResult,
  parseAiJsonString,
  validateAiOperationOutput,
  validateClarifyingQuestionOutput,
  validateFreeTextNormalizationOutput,
  validateSummaryRewriteOutput,
} from './ai-json-contracts';

const clarifyingQuestionOutput = {
  operation: 'clarifying_question_generation',
  question: {
    id: 'symptom-course-detail',
    type: 'free_text',
    prompt: 'Can you describe how the symptom has changed over time?',
    multiline: true,
  },
  rationale: 'Clarifies the symptom timeline.',
} as const;

const normalizationOutput = {
  operation: 'free_text_normalization',
  normalizedFields: [
    {
      fieldPath: 'chiefComplaint.summary',
      value: {
        kind: 'value',
        value: 'Persistent cough',
      },
      confidence: 'high',
    },
  ],
  unmappedText: 'Dry at night.',
} as const;

describe('parseAiJsonString', () => {
  it('returns invalid_json for malformed JSON input', () => {
    expect(parseAiJsonString('{"operation":')).toEqual({
      ok: false,
      reason: 'invalid_json',
      error: expect.any(String),
    });
  });
});

describe('AI JSON validation contracts', () => {
  it('accepts valid clarifying question output', () => {
    const result = validateClarifyingQuestionOutput(clarifyingQuestionOutput);

    expect(result).toEqual({
      ok: true,
      data: clarifyingQuestionOutput,
    });

    if (result.ok) {
      expectTypeOf(result.data).toEqualTypeOf<ClarifyingQuestionGenerationOutput>();
    }
  });

  it('accepts valid free-text normalization output', () => {
    const result = validateFreeTextNormalizationOutput(normalizationOutput);

    expect(result).toEqual({
      ok: true,
      data: normalizationOutput,
    });
  });

  it('accepts valid summary rewrite output', () => {
    const summary = createEmptyDoctorSummary({
      sourceSessionId: 'session-123',
      mode: 'ai_assisted',
    });

    const result = validateSummaryRewriteOutput({
      operation: 'summary_rewrite',
      summary,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        operation: 'summary_rewrite',
        summary,
      },
    });
  });

  it('fails when the output operation discriminator does not match the expected operation', () => {
    expect(validateAiOperationOutput('summary_rewrite', normalizationOutput)).toEqual({
      ok: false,
      reason: 'unsupported_operation',
      error:
        'Expected operation "summary_rewrite" but received "free_text_normalization"',
    });
  });

  it('fails clarifying question output without required question fields', () => {
    expect(
      validateClarifyingQuestionOutput({
        operation: 'clarifying_question_generation',
        question: {
          id: 'missing-prompt',
          type: 'free_text',
        },
      }),
    ).toEqual({
      ok: false,
      reason: 'invalid_shape',
      error: expect.stringContaining('question.prompt'),
    });
  });

  it('fails normalization output when normalizedFields is not an array', () => {
    expect(
      validateFreeTextNormalizationOutput({
        operation: 'free_text_normalization',
        normalizedFields: 'chiefComplaint.summary',
      }),
    ).toEqual({
      ok: false,
      reason: 'invalid_shape',
      error: expect.stringContaining('normalizedFields'),
    });
  });

  it('fails summary rewrite output when DoctorSummary is invalid', () => {
    const summary = createEmptyDoctorSummary({
      sourceSessionId: 'session-123',
      mode: 'ai_assisted',
    });

    expect(
      validateSummaryRewriteOutput({
        operation: 'summary_rewrite',
        summary: {
          ...summary,
          header: {
            title: '',
            disclaimer: summary.header.disclaimer,
          },
        },
      }),
    ).toEqual({
      ok: false,
      reason: 'invalid_shape',
      error: expect.stringContaining('summary.header.title'),
    });
  });

  it('returns deterministic invalid result wrappers', () => {
    const result = createInvalidAiOutputResult('invalid_shape', 'AI output did not match schema');

    expect(result).toEqual({
      ok: false,
      reason: 'invalid_shape',
      error: 'AI output did not match schema',
    });

    expectTypeOf(result).toMatchTypeOf<AiValidationResult<never>>();
  });
});
