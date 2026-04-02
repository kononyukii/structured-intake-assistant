import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AiProvider } from '@/shared/ai/ai-provider';
import {
  createFreeTextNormalizationFallback,
  validateAiProviderOutput,
} from '@/shared/ai/ai-provider';
import { MockAiProvider } from '@/shared/ai/mock-ai-provider';

import { handleFreeTextNormalizationRoute } from './route';

function createJsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/ai/normalize-free-text', {
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

describe('handleFreeTextNormalizationRoute', () => {
  it('returns a structured success response for a valid request', async () => {
    const response = await handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: '  Dry   cough for   3 days  ',
        targetContext: 'chiefComplaint.summary',
      }),
      {
        createProvider: () => new MockAiProvider(),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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

  it('returns bad_request when the request body shape is invalid', async () => {
    const response = await handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: '',
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

    const responsePromise = handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: 'Dry cough',
        targetContext: 'chiefComplaint.summary',
      }),
      {
        createProvider: () =>
          createProviderStub({
            runFreeTextNormalization: () => new Promise(() => undefined),
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

  it('maps invalid provider JSON into a structured failure response', async () => {
    const response = await handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: 'Dry cough',
        targetContext: 'chiefComplaint.summary',
      }),
      {
        createProvider: () => new MockAiProvider({ mode: 'invalid_json' }),
      },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'invalid_json',
      error: 'AI response was not valid JSON.',
    });
  });

  it('maps provider_unavailable into a structured failure response', async () => {
    const response = await handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: 'Dry cough',
        targetContext: 'chiefComplaint.summary',
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

  it('maps unsafe normalization content into unsafe_response', async () => {
    const response = await handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: 'Dry cough',
        targetContext: 'chiefComplaint.summary',
      }),
      {
        createProvider: () =>
          createProviderStub({
            runFreeTextNormalization: async () =>
              validateAiProviderOutput(
                'free_text_normalization',
                {
                  operation: 'free_text_normalization',
                  normalizedFields: [
                    {
                      fieldPath: 'chiefComplaint.summary',
                      value: {
                        kind: 'value',
                        value: 'This is likely pneumonia.',
                      },
                    },
                  ],
                },
                createFreeTextNormalizationFallback(),
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
    const response = await handleFreeTextNormalizationRoute(
      createJsonRequest({
        rawText: 'Dry cough',
        targetContext: 'chiefComplaint.summary',
      }),
      {
        createProvider: () =>
          createProviderStub({
            runFreeTextNormalization: async () => {
              throw new Error('Sensitive payload: dry cough raw text.');
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
    expect(JSON.stringify(body)).not.toContain('dry cough');
  });
});
