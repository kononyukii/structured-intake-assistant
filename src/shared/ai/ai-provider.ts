import {
  type AiValidationFailureReason,
  parseAiJsonString,
  validateClarifyingQuestionOutput,
  validateFreeTextNormalizationOutput,
  validateSummaryRewriteOutput,
} from '@/features/intake/domain/ai-json-contracts';
import {
  sanitizeClarifyingQuestionOutput,
  sanitizeFreeTextNormalizationOutput,
  sanitizeSummaryRewriteOutput,
} from '@/features/safety/domain/output-safety';

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

export interface AiProvider {
  readonly name: string;

  runClarifyingQuestion(
    input: ClarifyingQuestionProviderInput,
  ): Promise<AiProviderResult<ClarifyingQuestionOutput>>;
  runFreeTextNormalization(
    input: FreeTextNormalizationProviderInput,
  ): Promise<AiProviderResult<FreeTextNormalizationOutput>>;
  runSummaryRewrite(
    input: SummaryRewriteProviderInput,
  ): Promise<AiProviderResult<SummaryRewriteOutput>>;
}

type AiProviderFailureParams<T> = {
  reason: AiProviderFailureReason;
  fallback: T | null;
  error: string;
  meta?: AiProviderMeta;
};

export function createAiProviderSuccess<T>(
  data: T,
  meta?: AiProviderMeta,
): AiProviderResult<T> {
  if (meta === undefined) {
    return {
      ok: true,
      data,
    };
  }

  return {
    ok: true,
    data,
    meta,
  };
}

export function createAiProviderFailure<T>(
  params: AiProviderFailureParams<T>,
): AiProviderResult<T> {
  if (params.meta === undefined) {
    return {
      ok: false,
      reason: params.reason,
      fallback: params.fallback,
      error: params.error,
    };
  }

  return {
    ok: false,
    reason: params.reason,
    fallback: params.fallback,
    error: params.error,
    meta: params.meta,
  };
}

export function createClarifyingQuestionFallback(): null {
  return null;
}

export function createFreeTextNormalizationFallback(): FreeTextNormalizationOutput {
  return {
    operation: 'free_text_normalization',
    normalizedFields: [],
  };
}

export function createSummaryRewriteFallback(
  summary: SummaryRewriteProviderInput['deterministicSummary'],
): SummaryRewriteOutput {
  return {
    operation: 'summary_rewrite',
    summary,
  };
}

function mapValidationFailureReason(
  reason: AiValidationFailureReason,
): AiProviderFailureReason {
  switch (reason) {
    case 'invalid_json':
      return 'invalid_json';
    case 'invalid_shape':
    case 'unsupported_operation':
      return 'malformed_shape';
  }
}

function createUnsafeAiProviderFailure<T>(
  fallback: T | null,
  meta?: AiProviderMeta,
): AiProviderResult<T> {
  return createAiProviderFailure({
    reason: 'unsafe_response',
    fallback,
    error: 'AI response violated output safety boundaries.',
    meta,
  });
}

export function validateAiProviderOutput(
  operation: 'clarifying_question_generation',
  candidate: unknown,
  fallback: ClarifyingQuestionOutput | null,
  meta?: AiProviderMeta,
): AiProviderResult<ClarifyingQuestionOutput>;
export function validateAiProviderOutput(
  operation: 'free_text_normalization',
  candidate: unknown,
  fallback: FreeTextNormalizationOutput,
  meta?: AiProviderMeta,
): AiProviderResult<FreeTextNormalizationOutput>;
export function validateAiProviderOutput(
  operation: 'summary_rewrite',
  candidate: unknown,
  fallback: SummaryRewriteOutput,
  meta?: AiProviderMeta,
): AiProviderResult<SummaryRewriteOutput>;
export function validateAiProviderOutput(
  operation: AiOperationType,
  candidate: unknown,
  fallback:
    | ClarifyingQuestionOutput
    | FreeTextNormalizationOutput
    | SummaryRewriteOutput
    | null,
  meta?: AiProviderMeta,
): AiProviderResult<
  ClarifyingQuestionOutput | FreeTextNormalizationOutput | SummaryRewriteOutput
> {
  let parsedCandidate = candidate;

  if (typeof candidate === 'string') {
    const parseResult = parseAiJsonString(candidate);

    if (!parseResult.ok) {
      return createAiProviderFailure({
        reason: mapValidationFailureReason(parseResult.reason),
        fallback,
        error: parseResult.error,
        meta,
      });
    }

    parsedCandidate = parseResult.data;
  }

  switch (operation) {
    case 'clarifying_question_generation': {
      const validationResult = validateClarifyingQuestionOutput(parsedCandidate);

      if (validationResult.ok) {
        const safetyResult = sanitizeClarifyingQuestionOutput(validationResult.data);

        if (safetyResult.decision === 'blocked') {
          return createUnsafeAiProviderFailure(fallback, meta);
        }

        return createAiProviderSuccess(safetyResult.data, meta);
      }

      return createAiProviderFailure({
        reason: mapValidationFailureReason(validationResult.reason),
        fallback,
        error: validationResult.error,
        meta,
      });
    }
    case 'free_text_normalization': {
      const validationResult = validateFreeTextNormalizationOutput(parsedCandidate);

      if (validationResult.ok) {
        const safetyResult = sanitizeFreeTextNormalizationOutput(
          validationResult.data,
        );

        if (safetyResult.decision === 'blocked') {
          return createUnsafeAiProviderFailure(fallback, meta);
        }

        return createAiProviderSuccess(safetyResult.data, meta);
      }

      return createAiProviderFailure({
        reason: mapValidationFailureReason(validationResult.reason),
        fallback,
        error: validationResult.error,
        meta,
      });
    }
    case 'summary_rewrite': {
      const validationResult = validateSummaryRewriteOutput(parsedCandidate);

      if (validationResult.ok) {
        const safetyResult = sanitizeSummaryRewriteOutput(validationResult.data);

        if (safetyResult.decision === 'blocked') {
          return createUnsafeAiProviderFailure(fallback, meta);
        }

        return createAiProviderSuccess(safetyResult.data, meta);
      }

      return createAiProviderFailure({
        reason: mapValidationFailureReason(validationResult.reason),
        fallback,
        error: validationResult.error,
        meta,
      });
    }
  }
}
