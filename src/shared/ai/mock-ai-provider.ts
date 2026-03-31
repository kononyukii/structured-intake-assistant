import type { IntakePhase } from '@/features/intake/domain/intake-flow-engine';

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
  AiProviderMeta,
  AiProviderResult,
  ClarifyingQuestionOutput,
  ClarifyingQuestionProviderInput,
  FreeTextNormalizationOutput,
  FreeTextNormalizationProviderInput,
  SummaryRewriteOutput,
  SummaryRewriteProviderInput,
} from './ai-provider-types';

export const MOCK_AI_PROVIDER_MODES = [
  'success',
  'timeout',
  'invalid_json',
  'malformed_shape',
  'refused',
  'unsafe_response',
  'provider_unavailable',
] as const;

export type MockAiProviderMode = (typeof MOCK_AI_PROVIDER_MODES)[number];

export type MockAiProviderOptions = {
  mode?: MockAiProviderMode;
  model?: string;
};

const MOCK_AI_PROVIDER_MODEL = 'mock-model';

const DIRECT_FAILURE_ERRORS = {
  timeout: 'Mock AI provider timed out.',
  refused: 'Mock AI provider refused the request.',
  unsafe_response: 'Mock AI provider marked the response as unsafe.',
  provider_unavailable: 'Mock AI provider is unavailable.',
} as const;

const CLARIFYING_QUESTION_TEMPLATES: Record<
  IntakePhase,
  {
    questionId: string;
    prompt: string;
    followUpPrompt: string;
    rationale: string;
  }
> = {
  chief_complaint: {
    questionId: 'mock-clarify-chief-complaint',
    prompt: 'What is the main concern you want your clinician to hear first?',
    followUpPrompt: 'What other detail about your main concern would be helpful to capture?',
    rationale: 'Mock follow-up for the chief complaint phase.',
  },
  symptom_details: {
    questionId: 'mock-clarify-symptom-details',
    prompt: 'What detail best describes the symptom right now?',
    followUpPrompt: 'What other symptom detail would be useful to add?',
    rationale: 'Mock follow-up for the symptom details phase.',
  },
  timeline: {
    questionId: 'mock-clarify-timeline',
    prompt: 'When did this begin, and has it changed since it started?',
    followUpPrompt: 'What other timeline detail would help describe the course so far?',
    rationale: 'Mock follow-up for the timeline phase.',
  },
  associated_symptoms: {
    questionId: 'mock-clarify-associated-symptoms',
    prompt: 'What other symptoms have you noticed along with the main concern?',
    followUpPrompt: 'Is there one more associated symptom detail you want to include?',
    rationale: 'Mock follow-up for the associated symptoms phase.',
  },
  history: {
    questionId: 'mock-clarify-history',
    prompt: 'Is there any past history that feels relevant to this visit?',
    followUpPrompt: 'What other history detail would be helpful to add?',
    rationale: 'Mock follow-up for the history phase.',
  },
  medications_allergies: {
    questionId: 'mock-clarify-medications-allergies',
    prompt: 'Are there medication or allergy details that should be written more clearly?',
    followUpPrompt: 'What other medication or allergy detail should be captured?',
    rationale: 'Mock follow-up for the medications and allergies phase.',
  },
  red_flags: {
    questionId: 'mock-clarify-red-flags',
    prompt: 'Is there any additional safety-related fact you want to note without interpretation?',
    followUpPrompt: 'What other factual safety-related detail should be added?',
    rationale: 'Mock follow-up for the red flags phase.',
  },
  review: {
    questionId: 'mock-clarify-review',
    prompt: 'What else would you like your clinician to know before the visit?',
    followUpPrompt: 'Is there one more neutral detail you want included before review?',
    rationale: 'Mock follow-up for the review phase.',
  },
};

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  private readonly mode: MockAiProviderMode;
  private readonly model: string;

  constructor(options: MockAiProviderOptions = {}) {
    this.mode = options.mode ?? 'success';
    this.model = options.model ?? MOCK_AI_PROVIDER_MODEL;
  }

  async runClarifyingQuestion(
    input: ClarifyingQuestionProviderInput,
  ): Promise<AiProviderResult<ClarifyingQuestionOutput>> {
    const operation = 'clarifying_question_generation';
    const fallback = createClarifyingQuestionFallback();
    const meta = this.createMeta(operation);

    switch (this.mode) {
      case 'success':
        return validateAiProviderOutput(
          operation,
          this.buildClarifyingQuestionCandidate(input),
          fallback,
          meta,
        );
      case 'invalid_json':
        return validateAiProviderOutput(operation, '{"operation":', fallback, meta);
      case 'malformed_shape':
        return validateAiProviderOutput(
          operation,
          {
            operation,
            question: {
              id: 'mock-clarify-invalid',
              type: 'free_text',
            },
          },
          fallback,
          meta,
        );
      case 'timeout':
      case 'refused':
      case 'unsafe_response':
      case 'provider_unavailable':
        return this.createDirectFailure<ClarifyingQuestionOutput>(
          operation,
          this.mode,
          fallback,
        );
    }
  }

  async runFreeTextNormalization(
    input: FreeTextNormalizationProviderInput,
  ): Promise<AiProviderResult<FreeTextNormalizationOutput>> {
    const operation = 'free_text_normalization';
    const fallback = createFreeTextNormalizationFallback();
    const meta = this.createMeta(operation);

    switch (this.mode) {
      case 'success':
        return validateAiProviderOutput(
          operation,
          this.buildFreeTextNormalizationCandidate(input),
          fallback,
          meta,
        );
      case 'invalid_json':
        return validateAiProviderOutput(operation, '{"operation":', fallback, meta);
      case 'malformed_shape':
        return validateAiProviderOutput(
          operation,
          {
            operation,
            normalizedFields: 'chiefComplaint.summary',
          },
          fallback,
          meta,
        );
      case 'timeout':
      case 'refused':
      case 'unsafe_response':
      case 'provider_unavailable':
        return this.createDirectFailure(operation, this.mode, fallback);
    }
  }

  async runSummaryRewrite(
    input: SummaryRewriteProviderInput,
  ): Promise<AiProviderResult<SummaryRewriteOutput>> {
    const operation = 'summary_rewrite';
    const fallback = createSummaryRewriteFallback(input.deterministicSummary);
    const meta = this.createMeta(operation);

    switch (this.mode) {
      case 'success':
        return validateAiProviderOutput(
          operation,
          this.buildSummaryRewriteCandidate(input),
          fallback,
          meta,
        );
      case 'invalid_json':
        return validateAiProviderOutput(operation, '{"operation":', fallback, meta);
      case 'malformed_shape':
        return validateAiProviderOutput(
          operation,
          {
            operation,
            summary: {
              ...input.deterministicSummary,
              header: {
                ...input.deterministicSummary.header,
                title: '',
              },
            },
          },
          fallback,
          meta,
        );
      case 'timeout':
      case 'refused':
      case 'unsafe_response':
      case 'provider_unavailable':
        return this.createDirectFailure(operation, this.mode, fallback);
    }
  }

  private createMeta(operation: AiOperationType): AiProviderMeta {
    return {
      provider: this.name,
      model: this.model,
      operation,
      durationMs: 0,
    };
  }

  private createDirectFailure<T>(
    operation: AiOperationType,
    reason: keyof typeof DIRECT_FAILURE_ERRORS,
    fallback: T | null,
  ): AiProviderResult<T> {
    return createAiProviderFailure({
      reason,
      fallback,
      error: DIRECT_FAILURE_ERRORS[reason],
      meta: this.createMeta(operation),
    });
  }

  private buildClarifyingQuestionCandidate(
    input: ClarifyingQuestionProviderInput,
  ): ClarifyingQuestionOutput {
    const template = CLARIFYING_QUESTION_TEMPLATES[input.currentPhase];
    const hasAskedPrimaryQuestion = input.askedQuestionIds.includes(template.questionId);
    const chiefComplaint = input.sessionSnapshot.chiefComplaint.summary;
    const prompt =
      input.currentPhase === 'chief_complaint' &&
      !hasAskedPrimaryQuestion &&
      chiefComplaint.kind === 'value'
        ? `What detail about "${chiefComplaint.value}" would you like your clinician to know?`
        : hasAskedPrimaryQuestion
          ? template.followUpPrompt
          : template.prompt;

    return {
      operation: 'clarifying_question_generation',
      question: {
        id: hasAskedPrimaryQuestion
          ? `${template.questionId}-follow-up`
          : template.questionId,
        type: 'free_text',
        prompt,
        multiline: true,
      },
      rationale: template.rationale,
    };
  }

  private buildFreeTextNormalizationCandidate(
    input: FreeTextNormalizationProviderInput,
  ): FreeTextNormalizationOutput {
    const normalizedText = input.rawText.trim().replace(/\s+/g, ' ');

    return {
      operation: 'free_text_normalization',
      normalizedFields:
        normalizedText.length === 0
          ? []
          : [
              {
                fieldPath: input.targetContext ?? 'chiefComplaint.summary',
                value: {
                  kind: 'value',
                  value: normalizedText,
                },
                confidence: 'high',
              },
            ],
    };
  }

  private buildSummaryRewriteCandidate(
    input: SummaryRewriteProviderInput,
  ): SummaryRewriteOutput {
    const language = input.language ?? input.deterministicSummary.language;

    return {
      operation: 'summary_rewrite',
      summary: {
        ...input.deterministicSummary,
        mode: 'ai_assisted',
        ...(language === undefined ? {} : { language }),
      },
    };
  }
}
