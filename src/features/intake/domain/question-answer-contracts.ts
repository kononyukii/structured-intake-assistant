import { z } from 'zod';

const ChoiceOptionSchema = z
  .object({
    value: z.string().min(1),
    label: z.string().min(1),
  })
  .strict();

const ChoiceOptionsSchema = z.array(ChoiceOptionSchema).min(1).superRefine((options, ctx) => {
  const seenValues = new Set<string>();

  options.forEach((option, index) => {
    if (seenValues.has(option.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Option values must be unique',
        path: [index, 'value'],
      });
      return;
    }

    seenValues.add(option.value);
  });
});

const QuestionBaseFields = {
  id: z.string().min(1),
  prompt: z.string().min(1),
  description: z.string().min(1).optional(),
  required: z.boolean().optional(),
};

const QuestionWithOptionsFields = {
  ...QuestionBaseFields,
  options: ChoiceOptionsSchema,
};

const SingleChoiceQuestionSchema = z
  .object({
    ...QuestionWithOptionsFields,
    type: z.literal('single_choice'),
  })
  .strict();

const MultiChoiceQuestionSchema = z
  .object({
    ...QuestionWithOptionsFields,
    type: z.literal('multi_choice'),
    minSelections: z.number().int().nonnegative().optional(),
    maxSelections: z.number().int().nonnegative().optional(),
  })
  .strict()
  .superRefine((question, ctx) => {
    if (
      question.minSelections !== undefined &&
      question.maxSelections !== undefined &&
      question.minSelections > question.maxSelections
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minSelections must be less than or equal to maxSelections',
        path: ['minSelections'],
      });
    }

    if (
      question.minSelections !== undefined &&
      question.minSelections > question.options.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minSelections must not exceed the number of options',
        path: ['minSelections'],
      });
    }

    if (
      question.maxSelections !== undefined &&
      question.maxSelections > question.options.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'maxSelections must not exceed the number of options',
        path: ['maxSelections'],
      });
    }
  });

const ScaleQuestionSchema = z
  .object({
    ...QuestionBaseFields,
    type: z.literal('scale'),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite().optional(),
    labels: z
      .object({
        min: z.string().min(1).optional(),
        max: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((question, ctx) => {
    if (question.max < question.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'max must be greater than or equal to min',
        path: ['max'],
      });
    }
  });

const BooleanQuestionSchema = z
  .object({
    ...QuestionBaseFields,
    type: z.literal('boolean'),
  })
  .strict();

const FreeTextQuestionSchema = z
  .object({
    ...QuestionBaseFields,
    type: z.literal('free_text'),
    multiline: z.boolean().optional(),
    maxLength: z.number().int().positive().optional(),
  })
  .strict();

const DateGranularitySchema = z.enum(['date', 'month', 'year', 'approximate']);

const DateQuestionSchema = z
  .object({
    ...QuestionBaseFields,
    type: z.literal('date'),
    granularity: DateGranularitySchema.optional(),
  })
  .strict();

export const QuestionSchema = z.discriminatedUnion('type', [
  SingleChoiceQuestionSchema,
  MultiChoiceQuestionSchema,
  ScaleQuestionSchema,
  BooleanQuestionSchema,
  FreeTextQuestionSchema,
  DateQuestionSchema,
]);

export const AnswerSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('single_choice'),
      value: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('multi_choice'),
      value: z.array(z.string().min(1)),
    })
    .strict(),
  z
    .object({
      type: z.literal('scale'),
      value: z.number().finite(),
    })
    .strict(),
  z
    .object({
      type: z.literal('boolean'),
      value: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal('free_text'),
      value: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('date'),
      value: z.string().min(1),
    })
    .strict(),
]);

export type Question = z.infer<typeof QuestionSchema>;
export type Answer = z.infer<typeof AnswerSchema>;

type ParseAnswerResult =
  | { success: true; data: Answer }
  | { success: false; error: string };

const ISO_YEAR_REGEX = /^\d{4}$/;
const ISO_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRawAnswerInput(questionType: Question['type'], rawInput: unknown): ParseAnswerResult {
  if (isRecord(rawInput) && 'type' in rawInput) {
    if (rawInput.type !== questionType) {
      return { success: false, error: 'Answer type does not match question type' };
    }

    const parsedAnswer = AnswerSchema.safeParse(rawInput);

    if (!parsedAnswer.success) {
      return { success: false, error: 'Invalid answer payload' };
    }

    return { success: true, data: parsedAnswer.data };
  }

  const parsedAnswer = AnswerSchema.safeParse({
    type: questionType,
    value: rawInput,
  });

  if (!parsedAnswer.success) {
    return { success: false, error: 'Invalid answer payload' };
  }

  return { success: true, data: parsedAnswer.data };
}

function isValidIsoDate(value: string): boolean {
  return z.string().date().safeParse(value).success;
}

function isValidDateValue(
  granularity: z.infer<typeof DateGranularitySchema> | undefined,
  value: string,
): boolean {
  if (granularity === 'year') {
    return ISO_YEAR_REGEX.test(value);
  }

  if (granularity === 'month') {
    return ISO_MONTH_REGEX.test(value);
  }

  if (granularity === 'approximate') {
    return ISO_YEAR_REGEX.test(value) || ISO_MONTH_REGEX.test(value) || isValidIsoDate(value);
  }

  return isValidIsoDate(value);
}

function getDecimalPlaces(value: number): number {
  const valueText = value.toString().toLowerCase();

  if (valueText.includes('e-')) {
    const [coefficient, exponentText] = valueText.split('e-');
    const exponent = Number(exponentText);
    const fractionalLength = coefficient.split('.')[1]?.length ?? 0;

    return fractionalLength + exponent;
  }

  return valueText.split('.')[1]?.length ?? 0;
}

function isStepAligned(value: number, min: number, step: number): boolean {
  const precision = Math.max(
    getDecimalPlaces(value),
    getDecimalPlaces(min),
    getDecimalPlaces(step),
  );
  const scale = 10 ** precision;
  const scaledDifference = Math.round((value - min) * scale);
  const scaledStep = Math.round(step * scale);

  return scaledStep !== 0 && scaledDifference % scaledStep === 0;
}

function isAllowedChoice(options: Array<{ value: string }>, candidate: string): boolean {
  return options.some((option) => option.value === candidate);
}

function getAnswerValidationError(question: Question, answer: Answer): string | null {
  switch (question.type) {
    case 'single_choice':
      if (answer.type !== 'single_choice') {
        return 'Answer type does not match question type';
      }

      return isAllowedChoice(question.options, answer.value)
        ? null
        : 'Selected option is not allowed';
    case 'multi_choice': {
      if (answer.type !== 'multi_choice') {
        return 'Answer type does not match question type';
      }

      if (new Set(answer.value).size !== answer.value.length) {
        return 'Duplicate selections are not allowed';
      }

      if (!answer.value.every((value) => isAllowedChoice(question.options, value))) {
        return 'Selected option is not allowed';
      }

      if (
        question.minSelections !== undefined &&
        answer.value.length < question.minSelections
      ) {
        return 'Too few selections';
      }

      if (
        question.maxSelections !== undefined &&
        answer.value.length > question.maxSelections
      ) {
        return 'Too many selections';
      }

      return null;
    }
    case 'scale':
      if (answer.type !== 'scale') {
        return 'Answer type does not match question type';
      }

      if (answer.value < question.min || answer.value > question.max) {
        return 'Scale answer is out of range';
      }

      if (question.step !== undefined && !isStepAligned(answer.value, question.min, question.step)) {
        return 'Scale answer must align to step';
      }

      return null;
    case 'boolean':
      if (answer.type !== 'boolean') {
        return 'Answer type does not match question type';
      }

      return null;
    case 'free_text':
      if (answer.type !== 'free_text') {
        return 'Answer type does not match question type';
      }

      if (question.maxLength !== undefined && answer.value.length > question.maxLength) {
        return 'Text answer is too long';
      }

      return null;
    case 'date':
      if (answer.type !== 'date') {
        return 'Answer type does not match question type';
      }

      return isValidDateValue(question.granularity, answer.value)
        ? null
        : 'Date answer must match the expected format';
  }
}

function parseAnswer(question: Question, rawInput: unknown): ParseAnswerResult {
  const normalizedAnswer = normalizeRawAnswerInput(question.type, rawInput);

  if (!normalizedAnswer.success) {
    return normalizedAnswer;
  }

  const validationError = getAnswerValidationError(question, normalizedAnswer.data);

  if (validationError) {
    return { success: false, error: validationError };
  }

  return normalizedAnswer;
}

export function validateAnswerForQuestion(question: Question, answer: Answer): boolean {
  return parseAnswer(question, answer).success;
}

export function parseAnswerForQuestion(question: Question, rawInput: unknown): ParseAnswerResult {
  return parseAnswer(question, rawInput);
}

export function canApplyAnswerToSession(question: Question, answer: Answer): boolean {
  return validateAnswerForQuestion(question, answer);
}
