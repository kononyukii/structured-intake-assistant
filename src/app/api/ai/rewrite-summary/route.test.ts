import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AiProvider } from '@/shared/ai/ai-provider';
import { MockAiProvider } from '@/shared/ai/mock-ai-provider';
import { createDoctorSummaryFixture } from '@/test/fixtures/summary-fixtures';

import { handleSummaryRewriteRoute } from './route';

function createJsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/ai/rewrite-summary', {
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

describe('handleSummaryRewriteRoute', () => {
  it('returns a structured success response for a valid request', async () => {
    const summary = createDoctorSummaryFixture();

    const response = await handleSummaryRewriteRoute(
      createJsonRequest({
        deterministicSummary: summary,
        language: 'en',
        style: 'neutral',
      }),
      {
        createProvider: () => new MockAiProvider(),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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

  it('returns bad_request when the request body shape is invalid', async () => {
    const response = await handleSummaryRewriteRoute(
      createJsonRequest({
        deterministicSummary: {},
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

    const responsePromise = handleSummaryRewriteRoute(
      createJsonRequest({
        deterministicSummary: createDoctorSummaryFixture(),
        language: 'en',
        style: 'neutral',
      }),
      {
        createProvider: () =>
          createProviderStub({
            runSummaryRewrite: () => new Promise(() => undefined),
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

  it('maps unsafe provider output into a structured failure response', async () => {
    const response = await handleSummaryRewriteRoute(
      createJsonRequest({
        deterministicSummary: createDoctorSummaryFixture(),
        language: 'en',
        style: 'neutral',
      }),
      {
        createProvider: () => new MockAiProvider({ mode: 'unsafe_response' }),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'unsafe_response',
      error: 'AI response could not be used safely.',
    });
  });

  it('maps provider_unavailable into a structured failure response', async () => {
    const response = await handleSummaryRewriteRoute(
      createJsonRequest({
        deterministicSummary: createDoctorSummaryFixture(),
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

  it('does not expose thrown provider errors or raw payloads', async () => {
    const response = await handleSummaryRewriteRoute(
      createJsonRequest({
        deterministicSummary: createDoctorSummaryFixture(),
        language: 'en',
        style: 'neutral',
      }),
      {
        createProvider: () =>
          createProviderStub({
            runSummaryRewrite: async () => {
              throw new Error('Sensitive payload: clinician summary raw text.');
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
    expect(JSON.stringify(body)).not.toContain('clinician summary');
  });
});
