import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AiProvider } from '@/shared/ai/ai-provider';
import { validateAiProviderOutput } from '@/shared/ai/ai-provider';
import { MockAiProvider } from '@/shared/ai/mock-ai-provider';
import { createSimpleIntakeSessionFixture } from '@/test/fixtures/intake-fixtures';

import { handleClarifyingQuestionRoute } from './route';

function createJsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/ai/clarifying-question', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function createProviderStub(overrides: Partial<AiProvider>): AiProvider {
  return {
    name: 'test',
    runClarifyingQuestion: async () => {
      throw new Error('Unexpected clarifying-question provider call.');
    },
    runFreeTextNormalization: async () => {
      throw new Error('Unexpected normalize-free-text provider call.');
    },
    runSummaryRewrite: async () => {
      throw new Error('Unexpected rewrite-summary provider call.');
    },
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('handleClarifyingQuestionRoute', () => {
  it('returns a structured success response for a valid request', async () => {
    const response = await handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
        askedQuestionIds: [],
      }),
      {
        createProvider: () => new MockAiProvider(),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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

  it('returns bad_request when the request body shape is invalid', async () => {
    const response = await handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'bad_request',
      error: 'Request body did not match the expected shape.',
    });
  });

  it('returns timeout when the provider call exceeds the route timeout', async () => {
    vi.useFakeTimers();

    const responsePromise = handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
        askedQuestionIds: [],
      }),
      {
        createProvider: () =>
          createProviderStub({
            runClarifyingQuestion: () => new Promise(() => undefined),
          }),
        timeoutMs: 50,
      },
    );

    await vi.advanceTimersByTimeAsync(50);

    const response = await responsePromise;

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'timeout',
      error: 'AI request timed out.',
    });
  });

  it('maps malformed provider output into a structured failure response', async () => {
    const response = await handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
        askedQuestionIds: [],
      }),
      {
        createProvider: () => new MockAiProvider({ mode: 'malformed_shape' }),
      },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'malformed_shape',
      error: 'AI response did not match the expected shape.',
    });
  });

  it('maps provider_unavailable into a structured failure response', async () => {
    const response = await handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
        askedQuestionIds: [],
      }),
      {
        createProvider: () => new MockAiProvider({ mode: 'provider_unavailable' }),
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'provider_unavailable',
      error: 'AI provider is currently unavailable.',
    });
  });

  it('maps unsafe clarifying-question content into unsafe_response', async () => {
    const response = await handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
        askedQuestionIds: [],
      }),
      {
        createProvider: () =>
          createProviderStub({
            runClarifyingQuestion: async () =>
              validateAiProviderOutput(
                'clarifying_question_generation',
                {
                  operation: 'clarifying_question_generation',
                  question: {
                    id: 'unsafe-question',
                    type: 'free_text',
                    prompt: 'You should take ibuprofen.',
                    multiline: true,
                  },
                },
                null,
              ),
          }),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'unsafe_response',
      error: 'AI response could not be used safely.',
    });
  });

  it('does not expose thrown provider errors or raw payloads', async () => {
    const response = await handleClarifyingQuestionRoute(
      createJsonRequest({
        sessionSnapshot: createSimpleIntakeSessionFixture(),
        currentPhase: 'timeline',
        askedQuestionIds: [],
      }),
      {
        createProvider: () =>
          createProviderStub({
            runClarifyingQuestion: async () => {
              throw new Error('Sensitive payload: coughing blood raw text.');
            },
          }),
      },
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      reason: 'internal_error',
      error: 'AI request could not be completed.',
    });
    expect(JSON.stringify(body)).not.toContain('Sensitive payload');
    expect(JSON.stringify(body)).not.toContain('coughing blood');
  });
});
