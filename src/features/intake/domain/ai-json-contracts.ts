import { z } from 'zod';

import {
  type DoctorSummary,
  DoctorSummarySchema,
} from '../../summary/domain/doctor-summary-schema';
import { type Question, QuestionSchema } from './question-answer-contracts';

export const AI_OPERATION_TYPES = [
  'clarifying_question_generation',
  'free_text_normalization',
  'summary_rewrite',
] as const;

export const AiOperationTypeSchema = z.enum(AI_OPERATION_TYPES);

export type AiOperationType = z.infer<typeof AiOperationTypeSchema>;

export type AiValidationFailureReason =
  | 'invalid_json'
  | 'invalid_shape'
  | 'unsupported_operation';

type AiValidationSuccess<T> = {
  ok: true;
  data: T;
};

type AiValidationFailure<TReason extends AiValidationFailureReason = AiValidationFailureReason> = {
  ok: false;
  reason: TReason;
  error: string;
};

export type AiValidationResult<T> = AiValidationSuccess<T> | AiValidationFailure;

export type AiJsonParseResult = AiValidationSuccess<unknown> | {
  ok: false;
  reason: 'invalid_json';
  error: string;
};

export const ClarifyingQuestionGenerationOutputSchema = z
  .object({
    operation: z.literal('clarifying_question_generation'),
    question: QuestionSchema,
    rationale: z.string().min(1).optional(),
  })
  .strict();

const NormalizationConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const NormalizedFieldSchema = z
  .object({
    fieldPath: z.string().min(1),
    value: z.unknown(),
    confidence: NormalizationConfidenceSchema.optional(),
  })
  .strict();

export const FreeTextNormalizationOutputSchema = z
  .object({
    operation: z.literal('free_text_normalization'),
    normalizedFields: z.array(NormalizedFieldSchema),
    unmappedText: z.string().min(1).optional(),
  })
  .strict();

export const SummaryRewriteOutputSchema = z
  .object({
    operation: z.literal('summary_rewrite'),
    summary: DoctorSummarySchema,
  })
  .strict();

export const AiOperationOutputSchema = z.discriminatedUnion('operation', [
  ClarifyingQuestionGenerationOutputSchema,
  FreeTextNormalizationOutputSchema,
  SummaryRewriteOutputSchema,
]);

export type ClarifyingQuestionGenerationOutput = {
  operation: 'clarifying_question_generation';
  question: Question;
  rationale?: string;
};

export type FreeTextNormalizationOutput = z.infer<typeof FreeTextNormalizationOutputSchema>;
export type SummaryRewriteOutput = {
  operation: 'summary_rewrite';
  summary: DoctorSummary;
};

type AiOperationOutputByType = {
  clarifying_question_generation: ClarifyingQuestionGenerationOutput;
  free_text_normalization: FreeTextNormalizationOutput;
  summary_rewrite: SummaryRewriteOutput;
};

export type AiOperationOutput = AiOperationOutputByType[AiOperationType];

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');

      if (path.length === 0) {
        return issue.message;
      }

      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

function isOperationMismatch(expectedOperation: AiOperationType, input: unknown): input is {
  operation: string;
} {
  return (
    typeof input === 'object' &&
    input !== null &&
    'operation' in input &&
    typeof input.operation === 'string' &&
    input.operation !== expectedOperation
  );
}

function validateAiOutputShape<TOutput extends AiOperationOutput>(
  expectedOperation: TOutput['operation'],
  input: unknown,
  schema: z.ZodType<TOutput>,
): AiValidationResult<TOutput> {
  if (isOperationMismatch(expectedOperation, input)) {
    return createInvalidAiOutputResult(
      'unsupported_operation',
      `Expected operation "${expectedOperation}" but received "${input.operation}"`,
    );
  }

  const result = schema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      data: result.data,
    };
  }

  return createInvalidAiOutputResult('invalid_shape', formatZodError(result.error));
}

export function createInvalidAiOutputResult(
  reason: 'invalid_json',
  error: string,
): AiValidationFailure<'invalid_json'>;
export function createInvalidAiOutputResult(
  reason: 'invalid_shape',
  error: string,
): AiValidationFailure<'invalid_shape'>;
export function createInvalidAiOutputResult(
  reason: 'unsupported_operation',
  error: string,
): AiValidationFailure<'unsupported_operation'>;
export function createInvalidAiOutputResult(
  reason: AiValidationFailureReason,
  error: string,
): AiValidationFailure {
  return {
    ok: false,
    reason,
    error,
  };
}

export function parseAiJsonString(input: string): AiJsonParseResult {
  try {
    return {
      ok: true,
      data: JSON.parse(input) as unknown,
    };
  } catch (error) {
    return createInvalidAiOutputResult('invalid_json', getErrorMessage(error));
  }
}

export function validateClarifyingQuestionOutput(
  input: unknown,
): AiValidationResult<ClarifyingQuestionGenerationOutput> {
  return validateAiOutputShape(
    'clarifying_question_generation',
    input,
    ClarifyingQuestionGenerationOutputSchema,
  );
}

export function validateFreeTextNormalizationOutput(
  input: unknown,
): AiValidationResult<FreeTextNormalizationOutput> {
  return validateAiOutputShape(
    'free_text_normalization',
    input,
    FreeTextNormalizationOutputSchema,
  );
}

export function validateSummaryRewriteOutput(
  input: unknown,
): AiValidationResult<SummaryRewriteOutput> {
  return validateAiOutputShape('summary_rewrite', input, SummaryRewriteOutputSchema);
}

export function validateAiOperationOutput(
  operation: 'clarifying_question_generation',
  input: unknown,
): AiValidationResult<ClarifyingQuestionGenerationOutput>;
export function validateAiOperationOutput(
  operation: 'free_text_normalization',
  input: unknown,
): AiValidationResult<FreeTextNormalizationOutput>;
export function validateAiOperationOutput(
  operation: 'summary_rewrite',
  input: unknown,
): AiValidationResult<SummaryRewriteOutput>;
export function validateAiOperationOutput(
  operation: string,
  input: unknown,
): AiValidationResult<AiOperationOutput> {
  if (!AiOperationTypeSchema.safeParse(operation).success) {
    return createInvalidAiOutputResult(
      'unsupported_operation',
      `Unsupported AI operation "${operation}"`,
    );
  }

  switch (operation) {
    case 'clarifying_question_generation':
      return validateClarifyingQuestionOutput(input);
    case 'free_text_normalization':
      return validateFreeTextNormalizationOutput(input);
    case 'summary_rewrite':
      return validateSummaryRewriteOutput(input);
  }

  return createInvalidAiOutputResult(
    'unsupported_operation',
    `Unsupported AI operation "${operation}"`,
  );
}
