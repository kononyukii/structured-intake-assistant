import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSimpleIntakeSessionFixture } from '@/test/fixtures/intake-fixtures';
import { createDoctorSummaryFixture } from '@/test/fixtures/summary-fixtures';

import { getAiProviderConfigFromEnv } from './ai-config.server';
import {
  createFreeTextNormalizationFallback,
  createSummaryRewriteFallback,
} from './ai-provider';
import { createAiProvider } from './create-ai-provider';
import { GeminiAiProvider } from './gemini-ai-provider';

const GEMINI_TEST_MODEL = 'gemini-2.5-flash-lite';

function createGeminiResponse(
  text: string,
  overrides: Partial<{
    candidates: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
      finishReason?: string;
    }>;
    promptFeedback: {
      blockReason?: string;
    };
  }> = {},
): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
          finishReason: 'STOP',
        },
      ],
      ...overrides,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('GeminiAiProvider', () => {
  it('returns a validated clarifying question in the success path', async () => {
    const fetchMock = vi.fn(async () =>
      createGeminiResponse(
        JSON.stringify({
          operation: 'clarifying_question_generation',
          question: {
            id: 'gemini-clarify-timeline',
            type: 'free_text',
            prompt: 'When did the cough begin, and how has it changed since then?',
            multiline: true,
          },
          rationale: 'Clarifies the symptom timeline without adding interpretation.',
        }),
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new GeminiAiProvider({
      apiKey: 'test-key',
      model: 'gemini-test-model',
    });

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
          id: 'gemini-clarify-timeline',
          type: 'free_text',
          prompt: 'When did the cough begin, and how has it changed since then?',
          multiline: true,
        },
        rationale: 'Clarifies the symptom timeline without adding interpretation.',
      },
      meta: {
        provider: 'gemini',
        model: 'gemini-test-model',
        operation: 'clarifying_question_generation',
        durationMs: expect.any(Number),
      },
    });
  });

  it('returns a validated normalization result and sends a server-side JSON request', async () => {
    let capturedRequest: Request | undefined;
    const fetchMock = vi.fn(async (request: RequestInfo | URL) => {
      if (request instanceof Request) {
        capturedRequest = request;
      }

      return createGeminiResponse(
        JSON.stringify({
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
        }),
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const provider = new GeminiAiProvider({
      apiKey: 'test-key',
      model: GEMINI_TEST_MODEL,
    });

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
        provider: 'gemini',
        model: GEMINI_TEST_MODEL,
        operation: 'free_text_normalization',
        durationMs: expect.any(Number),
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    if (capturedRequest === undefined) {
      throw new Error('Expected fetch to receive a Request instance.');
    }

    expect(capturedRequest.url).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEST_MODEL}:generateContent`,
    );
    expect(capturedRequest.headers.get('x-goog-api-key')).toBe('test-key');

    const requestBody = JSON.parse(await capturedRequest.text()) as {
      generationConfig: {
        responseMimeType: string;
        responseJsonSchema: {
          type: string;
          properties: {
            operation: {
              enum: string[];
            };
            normalizedFields: {
              items: {
                properties: {
                  fieldPath: {
                    enum: string[];
                  };
                  confidence: {
                    enum: string[];
                  };
                };
                required: string[];
              };
            };
          };
          required: string[];
        };
      };
      store: boolean;
    };

    expect(requestBody.store).toBe(false);
    expect(requestBody.generationConfig.responseMimeType).toBe('application/json');
    expect(requestBody.generationConfig.responseJsonSchema.type).toBe('object');
    expect(requestBody.generationConfig.responseJsonSchema.properties.operation.enum).toEqual([
      'free_text_normalization',
    ]);
    expect(
      requestBody.generationConfig.responseJsonSchema.properties.normalizedFields.items
        .properties.fieldPath.enum,
    ).toEqual(['chiefComplaint.summary']);
    expect(
      requestBody.generationConfig.responseJsonSchema.properties.normalizedFields.items
        .properties.confidence.enum,
    ).toEqual(['low', 'medium', 'high']);
    expect(
      requestBody.generationConfig.responseJsonSchema.properties.normalizedFields.items.required,
    ).toEqual(['fieldPath', 'value']);
    expect(requestBody.generationConfig.responseJsonSchema.required).toEqual([
      'operation',
      'normalizedFields',
    ]);
  });

  it('returns a validated summary rewrite result in the success path', async () => {
    const summary = createDoctorSummaryFixture();
    const fetchMock = vi.fn(async () =>
      createGeminiResponse(
        JSON.stringify({
          operation: 'summary_rewrite',
          summary: {
            ...summary,
            mode: 'ai_assisted',
            language: 'en',
            complaint: {
              ...summary.complaint,
              detail:
                'Patient reports a dry cough for 3 days that is worse at night with mild fatigue and nasal congestion.',
            },
          },
        }),
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new GeminiAiProvider({
      apiKey: 'test-key',
      model: GEMINI_TEST_MODEL,
    });

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
          complaint: {
            ...summary.complaint,
            detail:
              'Patient reports a dry cough for 3 days that is worse at night with mild fatigue and nasal congestion.',
          },
        },
      },
      meta: {
        provider: 'gemini',
        model: GEMINI_TEST_MODEL,
        operation: 'summary_rewrite',
        durationMs: expect.any(Number),
      },
    });
  });

  it('maps malformed provider output into a typed malformed_shape failure', async () => {
    const summary = createDoctorSummaryFixture();
    const fetchMock = vi.fn(async () =>
      createGeminiResponse(
        JSON.stringify({
          operation: 'summary_rewrite',
          summary: {
            ...summary,
            header: {
              ...summary.header,
              title: '',
            },
          },
        }),
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new GeminiAiProvider({
      apiKey: 'test-key',
      model: GEMINI_TEST_MODEL,
    });

    const result = await provider.runSummaryRewrite({
      deterministicSummary: summary,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'malformed_shape',
      fallback: createSummaryRewriteFallback(summary),
      error: expect.any(String),
      meta: {
        provider: 'gemini',
        model: GEMINI_TEST_MODEL,
        operation: 'summary_rewrite',
        durationMs: expect.any(Number),
      },
    });
  });

  it('maps provider timeouts into a typed timeout failure', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(
      (_request: Request, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new GeminiAiProvider({
      apiKey: 'test-key',
      model: GEMINI_TEST_MODEL,
      timeoutMs: 25,
    });

    const resultPromise = provider.runFreeTextNormalization({
      rawText: 'Dry cough',
      targetContext: 'chiefComplaint.summary',
    });

    await vi.advanceTimersByTimeAsync(25);

    const result = await resultPromise;

    expect(result).toEqual({
      ok: false,
      reason: 'timeout',
      fallback: createFreeTextNormalizationFallback(),
      error: 'Gemini AI provider timed out.',
      meta: {
        provider: 'gemini',
        model: GEMINI_TEST_MODEL,
        operation: 'free_text_normalization',
        durationMs: expect.any(Number),
      },
    });
  });

  it('maps network failures into a typed provider_unavailable failure', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('Network down');
    });

    vi.stubGlobal('fetch', fetchMock);

    const provider = new GeminiAiProvider({
      apiKey: 'test-key',
      model: GEMINI_TEST_MODEL,
    });

    const result = await provider.runFreeTextNormalization({
      rawText: 'Dry cough',
      targetContext: 'chiefComplaint.summary',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'provider_unavailable',
      fallback: createFreeTextNormalizationFallback(),
      error: 'Gemini AI provider is unavailable.',
      meta: {
        provider: 'gemini',
        model: GEMINI_TEST_MODEL,
        operation: 'free_text_normalization',
        durationMs: expect.any(Number),
      },
    });
  });

  it('fails safely when gemini is selected without a configured API key', async () => {
    const provider = createAiProvider({
      kind: 'gemini',
    });

    expect(provider).toBeInstanceOf(GeminiAiProvider);
    expect(provider.name).toBe('gemini');

    const result = await provider.runClarifyingQuestion({
      sessionSnapshot: createSimpleIntakeSessionFixture(),
      currentPhase: 'timeline',
      askedQuestionIds: [],
    });

    expect(result).toEqual({
      ok: false,
      reason: 'provider_unavailable',
      fallback: null,
      error: 'Gemini AI provider is not configured.',
      meta: {
        provider: 'gemini',
        operation: 'clarifying_question_generation',
        durationMs: expect.any(Number),
      },
    });
  });

  it('fails safely when gemini is selected without a configured model', async () => {
    const provider = createAiProvider({
      kind: 'gemini',
      apiKey: 'test-key',
    });

    const result = await provider.runClarifyingQuestion({
      sessionSnapshot: createSimpleIntakeSessionFixture(),
      currentPhase: 'timeline',
      askedQuestionIds: [],
    });

    expect(result).toEqual({
      ok: false,
      reason: 'provider_unavailable',
      fallback: null,
      error: 'Gemini AI provider is not configured.',
      meta: {
        provider: 'gemini',
        operation: 'clarifying_question_generation',
        durationMs: expect.any(Number),
      },
    });
  });

  it('factory returns a GeminiAiProvider when configured', () => {
    const provider = createAiProvider({
      kind: 'gemini',
      apiKey: 'test-key',
      model: 'gemini-test-model',
    });

    expect(provider).toBeInstanceOf(GeminiAiProvider);
    expect(provider.name).toBe('gemini');
  });
});

describe('getAiProviderConfigFromEnv', () => {
  it('selects gemini with the configured env model when AI_PROVIDER=gemini', () => {
    expect(
      getAiProviderConfigFromEnv({
        AI_PROVIDER: 'gemini',
        AI_MODEL: GEMINI_TEST_MODEL,
        GEMINI_API_KEY: 'test-key',
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      kind: 'gemini',
      model: GEMINI_TEST_MODEL,
      apiKey: 'test-key',
    });
  });

  it('does not inject a default gemini model from env parsing', () => {
    expect(
      getAiProviderConfigFromEnv({
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'test-key',
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      kind: 'gemini',
      model: undefined,
      apiKey: 'test-key',
    });
  });

  it('keeps the mock provider as the default path', () => {
    expect(
      getAiProviderConfigFromEnv({
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      kind: 'mock',
    });
  });

  it('ignores AI_MODEL when AI_PROVIDER=mock', () => {
    expect(
      getAiProviderConfigFromEnv({
        AI_PROVIDER: 'mock',
        AI_MODEL: GEMINI_TEST_MODEL,
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      kind: 'mock',
    });
  });
});
