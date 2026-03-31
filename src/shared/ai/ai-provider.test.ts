import { describe, expect, it } from 'vitest';

import {
  createSimpleIntakeSessionFixture,
} from '@/test/fixtures/intake-fixtures';
import { createDoctorSummaryFixture } from '@/test/fixtures/summary-fixtures';

import {
  createFreeTextNormalizationFallback,
  createSummaryRewriteFallback,
} from './ai-provider';
import { createAiProvider } from './create-ai-provider';
import { MockAiProvider } from './mock-ai-provider';

describe('MockAiProvider', () => {
  it('returns a validated clarifying question in success mode', async () => {
    const provider = new MockAiProvider();

    const result = await provider.runClarifyingQuestion({
      sessionSnapshot: createSimpleIntakeSessionFixture(),
      currentPhase: 'timeline',
      askedQuestionIds: [],
    });

    expect(result).toEqual({
      ok: true,
      data: {
        operation: 'clarifying_question_generation',
        question: {
          id: 'mock-clarify-timeline',
          type: 'free_text',
          prompt: 'When did this begin, and has it changed since it started?',
          multiline: true,
        },
        rationale: 'Mock follow-up for the timeline phase.',
      },
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'clarifying_question_generation',
        durationMs: 0,
      },
    });
  });

  it('returns a validated free-text normalization result in success mode', async () => {
    const provider = new MockAiProvider();

    const result = await provider.runFreeTextNormalization({
      rawText: '  Dry   cough for   3 days  ',
      targetContext: 'chiefComplaint.summary',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        operation: 'free_text_normalization',
        normalizedFields: [
          {
            fieldPath: 'chiefComplaint.summary',
            value: {
              kind: 'value',
              value: 'Dry cough for 3 days',
            },
            confidence: 'high',
          },
        ],
      },
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'free_text_normalization',
        durationMs: 0,
      },
    });
  });

  it('returns a validated summary rewrite result in success mode', async () => {
    const provider = new MockAiProvider();
    const summary = createDoctorSummaryFixture();

    const result = await provider.runSummaryRewrite({
      deterministicSummary: summary,
      language: 'en',
      style: 'neutral',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        operation: 'summary_rewrite',
        summary: {
          ...summary,
          mode: 'ai_assisted',
          language: 'en',
        },
      },
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'summary_rewrite',
        durationMs: 0,
      },
    });
  });

  it('returns a typed timeout failure result', async () => {
    const provider = new MockAiProvider({ mode: 'timeout' });

    const result = await provider.runClarifyingQuestion({
      sessionSnapshot: createSimpleIntakeSessionFixture(),
      currentPhase: 'timeline',
      askedQuestionIds: [],
    });

    expect(result).toEqual({
      ok: false,
      reason: 'timeout',
      fallback: null,
      error: 'Mock AI provider timed out.',
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'clarifying_question_generation',
        durationMs: 0,
      },
    });
  });

  it('surfaces invalid JSON as an invalid_json failure with a safe fallback', async () => {
    const provider = new MockAiProvider({ mode: 'invalid_json' });

    const result = await provider.runFreeTextNormalization({
      rawText: 'Dry cough',
      targetContext: 'chiefComplaint.summary',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'invalid_json',
      fallback: createFreeTextNormalizationFallback(),
      error: expect.any(String),
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'free_text_normalization',
        durationMs: 0,
      },
    });
  });

  it('surfaces malformed provider output as a malformed_shape failure with a safe fallback', async () => {
    const provider = new MockAiProvider({ mode: 'malformed_shape' });
    const summary = createDoctorSummaryFixture();

    const result = await provider.runSummaryRewrite({
      deterministicSummary: summary,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'malformed_shape',
      fallback: createSummaryRewriteFallback(summary),
      error: expect.any(String),
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'summary_rewrite',
        durationMs: 0,
      },
    });
  });

  it('returns a safe refused failure result', async () => {
    const provider = new MockAiProvider({ mode: 'refused' });
    const summary = createDoctorSummaryFixture();

    const result = await provider.runSummaryRewrite({
      deterministicSummary: summary,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'refused',
      fallback: createSummaryRewriteFallback(summary),
      error: 'Mock AI provider refused the request.',
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'summary_rewrite',
        durationMs: 0,
      },
    });
  });

  it('returns a safe unsafe_response failure result', async () => {
    const provider = new MockAiProvider({ mode: 'unsafe_response' });
    const summary = createDoctorSummaryFixture();

    const result = await provider.runSummaryRewrite({
      deterministicSummary: summary,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'unsafe_response',
      fallback: createSummaryRewriteFallback(summary),
      error: 'Mock AI provider marked the response as unsafe.',
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'summary_rewrite',
        durationMs: 0,
      },
    });
  });

  it('returns a safe provider_unavailable failure result', async () => {
    const provider = new MockAiProvider({ mode: 'provider_unavailable' });

    const result = await provider.runFreeTextNormalization({
      rawText: 'Dry cough',
      targetContext: 'chiefComplaint.summary',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'provider_unavailable',
      fallback: createFreeTextNormalizationFallback(),
      error: 'Mock AI provider is unavailable.',
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'free_text_normalization',
        durationMs: 0,
      },
    });
  });

  it('factory returns a MockAiProvider for the mock config path', async () => {
    const provider = createAiProvider({
      kind: 'mock',
      mode: 'timeout',
    });

    expect(provider).toBeInstanceOf(MockAiProvider);
    expect(provider.name).toBe('mock');

    const result = await provider.runClarifyingQuestion({
      sessionSnapshot: createSimpleIntakeSessionFixture(),
      currentPhase: 'timeline',
      askedQuestionIds: [],
    });

    expect(result).toEqual({
      ok: false,
      reason: 'timeout',
      fallback: null,
      error: 'Mock AI provider timed out.',
      meta: {
        provider: 'mock',
        model: 'mock-model',
        operation: 'clarifying_question_generation',
        durationMs: 0,
      },
    });
  });
});
