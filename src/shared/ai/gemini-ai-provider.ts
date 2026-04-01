import {
  type AiProvider,
  createAiProviderFailure,
  createClarifyingQuestionFallback,
  createFreeTextNormalizationFallback,
  createSummaryRewriteFallback,
  validateAiProviderOutput,
} from './ai-provider';
import type {
  AiOperationType,
  AiProviderFailureReason,
  AiProviderMeta,
  AiProviderResult,
  ClarifyingQuestionOutput,
  ClarifyingQuestionProviderInput,
  FreeTextNormalizationOutput,
  FreeTextNormalizationProviderInput,
  SummaryRewriteOutput,
  SummaryRewriteProviderInput,
} from './ai-provider-types';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_TIMEOUT_MS = 4_500;

export type GeminiAiProviderOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  apiBaseUrl?: string;
};

type GeminiGenerateContentRequest = {
  systemInstruction: {
    parts: Array<{
      text: string;
    }>;
  };
  contents: Array<{
    role: 'user';
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    responseMimeType: 'application/json';
    responseJsonSchema: GeminiJsonSchema;
    candidateCount: 1;
    temperature: 0;
    maxOutputTokens: number;
  };
  store: false;
};

type GeminiJsonSchema =
  | {
      type: 'string';
      enum?: string[];
    }
  | {
      type: 'number';
      enum?: number[];
    }
  | {
      type: 'boolean';
    }
  | {
      type: 'array';
      items: GeminiJsonSchema;
    }
  | {
      type: 'object';
      properties?: Record<string, GeminiJsonSchema>;
      required?: string[];
      additionalProperties?: boolean;
      propertyOrdering?: string[];
    }
  | {
      anyOf: GeminiJsonSchema[];
    };

type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
};

type GeminiPart = {
  text?: string;
};

type GeminiExtractionResult =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      reason: AiProviderFailureReason;
      error: string;
    };

type GeminiOperationPrompt = {
  prompt: string;
  maxOutputTokens: number;
};

type GeminiOperationSchema = {
  responseJsonSchema: GeminiJsonSchema;
};

function createStringSchema(): GeminiJsonSchema {
  return {
    type: 'string',
  };
}

function createBooleanSchema(): GeminiJsonSchema {
  return {
    type: 'boolean',
  };
}

function createNumberSchema(): GeminiJsonSchema {
  return {
    type: 'number',
  };
}

function createStringEnumSchema(values: string[]): GeminiJsonSchema {
  return {
    type: 'string',
    enum: values,
  };
}

function createObjectSchema(params: {
  properties: Record<string, GeminiJsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  propertyOrdering?: string[];
}): GeminiJsonSchema {
  return {
    type: 'object',
    properties: params.properties,
    required: params.required,
    additionalProperties: params.additionalProperties,
    propertyOrdering: params.propertyOrdering,
  };
}

function createArraySchema(items: GeminiJsonSchema): GeminiJsonSchema {
  return {
    type: 'array',
    items,
  };
}

const FACT_STATE_VALUES = ['present', 'denied', 'unknown', 'not_assessed'];

function createSummaryTextFieldSchema(): GeminiJsonSchema {
  return createObjectSchema({
    properties: {
      state: createStringEnumSchema(FACT_STATE_VALUES),
      detail: createStringSchema(),
    },
    required: ['state'],
    additionalProperties: false,
  });
}

function createSummaryFactItemSchema(): GeminiJsonSchema {
  return createObjectSchema({
    properties: {
      label: createStringSchema(),
      state: createStringEnumSchema(FACT_STATE_VALUES),
      detail: createStringSchema(),
    },
    required: ['label', 'state'],
    additionalProperties: false,
  });
}

function createSummaryListItemSchema(): GeminiJsonSchema {
  return createObjectSchema({
    properties: {
      label: createStringSchema(),
      detail: createStringSchema(),
    },
    required: ['label'],
    additionalProperties: false,
  });
}

function createSummaryCollectionSectionSchema(): GeminiJsonSchema {
  return createObjectSchema({
    properties: {
      state: createStringEnumSchema(FACT_STATE_VALUES),
      items: createArraySchema(createSummaryListItemSchema()),
    },
    required: ['state', 'items'],
    additionalProperties: false,
  });
}

function createQuestionForDoctorSchema(): GeminiJsonSchema {
  return createObjectSchema({
    properties: {
      question: createStringSchema(),
      detail: createStringSchema(),
    },
    required: ['question'],
    additionalProperties: false,
  });
}

const GEMINI_SYSTEM_INSTRUCTION = [
  'You support a structured intake assistant for primary care.',
  'Return only a single JSON object for the requested operation.',
  'Use neutral, factual, patient-reported wording only.',
  'Do not provide diagnosis, treatment recommendations, triage, urgency advice, or disease ranking.',
].join(' ');

function normalizeOptionalString(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : undefined;
}

function normalizeModelName(model: string | undefined): string | undefined {
  const normalizedModel = normalizeOptionalString(model);

  if (normalizedModel === undefined) {
    return undefined;
  }

  if (normalizedModel.startsWith('models/')) {
    return normalizedModel.slice('models/'.length);
  }

  return normalizedModel;
}

function serializePromptPayload(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildClarifyingQuestionPrompt(
  input: ClarifyingQuestionProviderInput,
): GeminiOperationPrompt {
  return {
    maxOutputTokens: 512,
    prompt: [
      'Operation: clarifying_question_generation.',
      'Generate one follow-up question that collects missing factual intake detail only.',
      'Avoid repeating any ID from askedQuestionIds.',
      'Keep the question neutral and safe for a primary care intake workflow.',
      'Return exactly one free_text question.',
      'Return JSON with keys: operation, question, rationale.',
      'Use question.type = "free_text" and include question.id and question.prompt.',
      'Use multiline: true for the question.',
      'Input JSON:',
      serializePromptPayload(input),
    ].join('\n\n'),
  };
}

function buildClarifyingQuestionSchema(): GeminiOperationSchema {
  return {
    responseJsonSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['clarifying_question_generation'],
        },
        question: {
          type: 'object',
          properties: {
            id: createStringSchema(),
            type: createStringEnumSchema(['free_text']),
            prompt: createStringSchema(),
            description: createStringSchema(),
            required: createBooleanSchema(),
            multiline: createBooleanSchema(),
            maxLength: createNumberSchema(),
          },
          required: ['id', 'type', 'prompt'],
          additionalProperties: false,
        },
        rationale: {
          type: 'string',
        },
      },
      required: ['operation', 'question'],
      additionalProperties: false,
    },
  };
}

function buildFreeTextNormalizationPrompt(
  input: FreeTextNormalizationProviderInput,
): GeminiOperationPrompt {
  const targetContextInstruction =
    input.targetContext === undefined
      ? 'Each normalizedFields item must include fieldPath, value, and optional confidence.'
      : `Use exactly "${input.targetContext}" as fieldPath when returning a normalized field.`;

  return {
    maxOutputTokens: 768,
    prompt: [
      'Operation: free_text_normalization.',
      'Normalize only the provided patient text into structured fields.',
      'Do not infer diagnosis, treatment, urgency, or other clinical interpretation.',
      targetContextInstruction,
      'Return only this JSON shape: { "operation": "free_text_normalization", "normalizedFields": [{ "fieldPath": "...", "value": ..., "confidence": "low|medium|high" }], "unmappedText"?: "..." }.',
      'Do not wrap normalizedFields items in extra keys.',
      'If no safe mapping is possible, return an empty normalizedFields array and use unmappedText when helpful.',
      'Return JSON with keys: operation, normalizedFields, unmappedText (optional).',
      'Input JSON:',
      serializePromptPayload(input),
    ].join('\n\n'),
  };
}

function buildFreeTextNormalizationSchema(
  input: FreeTextNormalizationProviderInput,
): GeminiOperationSchema {
  const fieldPathSchema: GeminiJsonSchema =
    input.targetContext === undefined
      ? {
          type: 'string',
        }
      : {
          type: 'string',
          enum: [input.targetContext],
        };

  return {
    responseJsonSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['free_text_normalization'],
        },
        normalizedFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fieldPath: fieldPathSchema,
              value: {
                anyOf: [
                  {
                    type: 'string',
                  },
                  {
                    type: 'number',
                  },
                  {
                    type: 'boolean',
                  },
                  {
                    type: 'array',
                    items: {
                      anyOf: [
                        {
                          type: 'string',
                        },
                        {
                          type: 'number',
                        },
                        {
                          type: 'boolean',
                        },
                        {
                          type: 'object',
                          additionalProperties: true,
                        },
                      ],
                    },
                  },
                  {
                    type: 'object',
                    additionalProperties: true,
                  },
                ],
              },
              confidence: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
            },
            required: ['fieldPath', 'value'],
            additionalProperties: false,
          },
        },
        unmappedText: {
          type: 'string',
        },
      },
      required: ['operation', 'normalizedFields'],
      additionalProperties: false,
      propertyOrdering: ['operation', 'normalizedFields', 'unmappedText'],
    },
  };
}

function buildSummaryRewritePrompt(
  input: SummaryRewriteProviderInput,
): GeminiOperationPrompt {
  return {
    maxOutputTokens: 4_096,
    prompt: [
      'Operation: summary_rewrite.',
      'Rewrite the deterministic summary into a neutral clinician-facing version while preserving structure and factual content.',
      'Return the full summary object with every required property preserved.',
      'Keep the same object structure, nested sections, arrays, and required keys as the input summary.',
      'Keep the disclaimer neutral and preserve the no diagnosis, no treatment, and no urgency boundaries.',
      'Set summary.mode to "ai_assisted" and preserve language when provided.',
      'Do not omit fields. Do not add extra fields. Rewrite wording only where helpful.',
      'Input JSON:',
      serializePromptPayload(input),
    ].join('\n\n'),
  };
}

function buildSummaryRewriteSchema(): GeminiOperationSchema {
  return {
    responseJsonSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['summary_rewrite'],
        },
        summary: {
          type: 'object',
          properties: {
            schemaVersion: {
              type: 'number',
              enum: [1],
            },
            generatedAt: createStringSchema(),
            sourceSessionId: createStringSchema(),
            mode: createStringEnumSchema(['ai_assisted']),
            language: createStringSchema(),
            header: createObjectSchema({
              properties: {
                title: createStringSchema(),
                disclaimer: createStringSchema(),
              },
              required: ['title', 'disclaimer'],
              additionalProperties: false,
            }),
            complaint: createObjectSchema({
              properties: {
                headline: createStringSchema(),
                detail: createStringSchema(),
              },
              required: [],
              additionalProperties: false,
            }),
            timeline: createObjectSchema({
              properties: {
                onset: createSummaryTextFieldSchema(),
                duration: createSummaryTextFieldSchema(),
                course: createSummaryTextFieldSchema(),
              },
              required: ['onset', 'duration', 'course'],
              additionalProperties: false,
            }),
            symptomFacts: createObjectSchema({
              properties: {
                associatedSymptoms: createArraySchema(createSummaryFactItemSchema()),
                systemicSymptoms: createArraySchema(createSummaryFactItemSchema()),
                redFlags: createArraySchema(createSummaryFactItemSchema()),
              },
              required: ['associatedSymptoms', 'systemicSymptoms', 'redFlags'],
              additionalProperties: false,
            }),
            history: createObjectSchema({
              properties: {
                relevantConditions: createSummaryCollectionSectionSchema(),
                surgeries: createSummaryCollectionSectionSchema(),
                familyHistory: createSummaryCollectionSectionSchema(),
              },
              required: ['relevantConditions', 'surgeries', 'familyHistory'],
              additionalProperties: false,
            }),
            medications: createSummaryCollectionSectionSchema(),
            allergiesIntolerances: createSummaryCollectionSectionSchema(),
            questionsForDoctor: createArraySchema(createQuestionForDoctorSchema()),
            notes: createStringSchema(),
          },
          required: [
            'schemaVersion',
            'generatedAt',
            'sourceSessionId',
            'mode',
            'header',
            'complaint',
            'timeline',
            'symptomFacts',
            'history',
            'medications',
            'allergiesIntolerances',
            'questionsForDoctor',
          ],
          additionalProperties: false,
        },
      },
      required: ['operation', 'summary'],
      additionalProperties: false,
    },
  };
}

function createGeminiFailure<T>(
  reason: AiProviderFailureReason,
  error: string,
  fallback: T | null,
  meta: AiProviderMeta,
): AiProviderResult<T> {
  return createAiProviderFailure({
    reason,
    fallback,
    error,
    meta,
  });
}

function mapGeminiHttpFailure(status: number): {
  reason: AiProviderFailureReason;
  error: string;
} {
  if (status === 408 || status === 504) {
    return {
      reason: 'timeout',
      error: 'Gemini AI provider timed out.',
    };
  }

  return {
    reason: 'provider_unavailable',
    error: 'Gemini AI provider is unavailable.',
  };
}

function extractGeminiCandidateText(
  response: GeminiGenerateContentResponse,
): GeminiExtractionResult {
  const promptBlockReason = response.promptFeedback?.blockReason;

  if (promptBlockReason === 'SAFETY') {
    return {
      ok: false,
      reason: 'unsafe_response',
      error: 'Gemini blocked the request for safety reasons.',
    };
  }

  if (promptBlockReason !== undefined) {
    return {
      ok: false,
      reason: 'refused',
      error: 'Gemini blocked the request.',
    };
  }

  const candidate = response.candidates?.[0];

  if (candidate === undefined) {
    return {
      ok: false,
      reason: 'refused',
      error: 'Gemini returned no candidates.',
    };
  }

  if (candidate.finishReason === 'SAFETY') {
    return {
      ok: false,
      reason: 'unsafe_response',
      error: 'Gemini blocked the response for safety reasons.',
    };
  }

  if (
    candidate.finishReason === 'RECITATION' ||
    candidate.finishReason === 'LANGUAGE' ||
    candidate.finishReason === 'OTHER'
  ) {
    return {
      ok: false,
      reason: 'refused',
      error: 'Gemini did not return a usable response.',
    };
  }

  const text = candidate.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (text === undefined || text.length === 0) {
    return {
      ok: false,
      reason: 'refused',
      error: 'Gemini returned no usable JSON content.',
    };
  }

  return {
    ok: true,
    text,
  };
}

function isAbortError(error: unknown): error is Error {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError')
  );
}

export class GeminiAiProvider implements AiProvider {
  readonly name = 'gemini';

  private readonly apiBaseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly model?: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiAiProviderOptions = {}) {
    this.apiBaseUrl = options.apiBaseUrl ?? GEMINI_API_BASE_URL;
    this.apiKey = normalizeOptionalString(options.apiKey);
    this.fetchImpl = options.fetch ?? fetch;
    this.model = normalizeModelName(options.model);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS;
  }

  async runClarifyingQuestion(
    input: ClarifyingQuestionProviderInput,
  ): Promise<AiProviderResult<ClarifyingQuestionOutput>> {
    return this.executeOperation(
      'clarifying_question_generation',
      buildClarifyingQuestionPrompt(input),
      buildClarifyingQuestionSchema(),
      createClarifyingQuestionFallback(),
    );
  }

  async runFreeTextNormalization(
    input: FreeTextNormalizationProviderInput,
  ): Promise<AiProviderResult<FreeTextNormalizationOutput>> {
    return this.executeOperation(
      'free_text_normalization',
      buildFreeTextNormalizationPrompt(input),
      buildFreeTextNormalizationSchema(input),
      createFreeTextNormalizationFallback(),
    );
  }

  async runSummaryRewrite(
    input: SummaryRewriteProviderInput,
  ): Promise<AiProviderResult<SummaryRewriteOutput>> {
    return this.executeOperation(
      'summary_rewrite',
      buildSummaryRewritePrompt(input),
      buildSummaryRewriteSchema(),
      createSummaryRewriteFallback(input.deterministicSummary),
    );
  }

  private async executeOperation(
    operation: 'clarifying_question_generation',
    prompt: GeminiOperationPrompt,
    schema: GeminiOperationSchema,
    fallback: ClarifyingQuestionOutput | null,
  ): Promise<AiProviderResult<ClarifyingQuestionOutput>>;
  private async executeOperation(
    operation: 'free_text_normalization',
    prompt: GeminiOperationPrompt,
    schema: GeminiOperationSchema,
    fallback: FreeTextNormalizationOutput,
  ): Promise<AiProviderResult<FreeTextNormalizationOutput>>;
  private async executeOperation(
    operation: 'summary_rewrite',
    prompt: GeminiOperationPrompt,
    schema: GeminiOperationSchema,
    fallback: SummaryRewriteOutput,
  ): Promise<AiProviderResult<SummaryRewriteOutput>>;
  private async executeOperation(
    operation: AiOperationType,
    prompt: GeminiOperationPrompt,
    schema: GeminiOperationSchema,
    fallback:
      | ClarifyingQuestionOutput
      | FreeTextNormalizationOutput
      | SummaryRewriteOutput
      | null,
  ): Promise<
    AiProviderResult<
      ClarifyingQuestionOutput | FreeTextNormalizationOutput | SummaryRewriteOutput
    >
  > {
    const startedAt = Date.now();

    if (this.apiKey === undefined || this.model === undefined) {
      return createGeminiFailure(
        'provider_unavailable',
        'Gemini AI provider is not configured.',
        fallback,
        this.createMeta(operation, startedAt),
      );
    }

    let response: Response;

    try {
      response = await this.fetchWithTimeout(this.buildRequest(prompt, schema));
    } catch (error) {
      const meta = this.createMeta(operation, startedAt);

      if (isAbortError(error)) {
        return createGeminiFailure(
          'timeout',
          'Gemini AI provider timed out.',
          fallback,
          meta,
        );
      }

      return createGeminiFailure(
        'provider_unavailable',
        'Gemini AI provider is unavailable.',
        fallback,
        meta,
      );
    }

    const meta = this.createMeta(operation, startedAt);

    if (!response.ok) {
      const failure = mapGeminiHttpFailure(response.status);

      return createGeminiFailure(
        failure.reason,
        failure.error,
        fallback,
        meta,
      );
    }

    let responseBody: GeminiGenerateContentResponse;

    try {
      responseBody = (await response.json()) as GeminiGenerateContentResponse;
    } catch {
      return createGeminiFailure(
        'invalid_json',
        'Gemini AI provider returned invalid JSON.',
        fallback,
        meta,
      );
    }

    const extractionResult = extractGeminiCandidateText(responseBody);

    if (!extractionResult.ok) {
      return createGeminiFailure(
        extractionResult.reason,
        extractionResult.error,
        fallback,
        meta,
      );
    }

    switch (operation) {
      case 'clarifying_question_generation':
        return validateAiProviderOutput(
          operation,
          extractionResult.text,
          fallback as ClarifyingQuestionOutput | null,
          meta,
        );
      case 'free_text_normalization':
        return validateAiProviderOutput(
          operation,
          extractionResult.text,
          fallback as FreeTextNormalizationOutput,
          meta,
        );
      case 'summary_rewrite':
        return validateAiProviderOutput(
          operation,
          extractionResult.text,
          fallback as SummaryRewriteOutput,
          meta,
        );
    }
  }

  private createMeta(operation: AiOperationType, startedAt: number): AiProviderMeta {
    return {
      provider: this.name,
      model: this.model,
      operation,
      durationMs: Date.now() - startedAt,
    };
  }

  private buildRequest(
    prompt: GeminiOperationPrompt,
    schema: GeminiOperationSchema,
  ): Request {
    const request = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': this.apiKey ?? '',
      },
      body: JSON.stringify(this.buildRequestBody(prompt, schema)),
    };

    return new Request(this.buildRequestUrl(), request);
  }

  private buildRequestBody(
    prompt: GeminiOperationPrompt,
    schema: GeminiOperationSchema,
  ): GeminiGenerateContentRequest {
    return {
      systemInstruction: {
        parts: [
          {
            text: GEMINI_SYSTEM_INSTRUCTION,
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: schema.responseJsonSchema,
        candidateCount: 1,
        temperature: 0,
        maxOutputTokens: prompt.maxOutputTokens,
      },
      store: false,
    };
  }

  private buildRequestUrl(): string {
    if (this.model === undefined) {
      throw new Error('Gemini AI provider is not configured.');
    }

    return `${this.apiBaseUrl}/${encodeURIComponent(this.model)}:generateContent`;
  }

  private async fetchWithTimeout(request: Request): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(request, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
