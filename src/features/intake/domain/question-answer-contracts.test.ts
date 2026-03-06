import { describe, expect, it } from 'vitest';

import {
  type Answer,
  AnswerSchema,
  canApplyAnswerToSession,
  parseAnswerForQuestion,
  type Question,
  QuestionSchema,
  validateAnswerForQuestion,
} from './question-answer-contracts';

const singleChoiceQuestion: Question = {
  id: 'chief-complaint-priority',
  type: 'single_choice',
  prompt: 'Which concern feels most important today?',
  options: [
    { value: 'pain', label: 'Pain' },
    { value: 'fatigue', label: 'Fatigue' },
  ],
};

const multiChoiceQuestion: Question = {
  id: 'associated-symptoms',
  type: 'multi_choice',
  prompt: 'Which associated symptoms are present?',
  options: [
    { value: 'cough', label: 'Cough' },
    { value: 'fever', label: 'Fever' },
    { value: 'nausea', label: 'Nausea' },
  ],
  minSelections: 1,
  maxSelections: 2,
};

const scaleQuestion: Question = {
  id: 'symptom-severity',
  type: 'scale',
  prompt: 'How intense is the symptom?',
  min: 0,
  max: 10,
  step: 0.5,
  labels: {
    min: 'Not noticeable',
    max: 'Most intense',
  },
};

const booleanQuestion: Question = {
  id: 'has-fever',
  type: 'boolean',
  prompt: 'Do you currently have a fever?',
  required: true,
};

const freeTextQuestion: Question = {
  id: 'additional-context',
  type: 'free_text',
  prompt: 'Anything else you want to share?',
  multiline: true,
  maxLength: 120,
};

const dateQuestion: Question = {
  id: 'symptom-onset-date',
  type: 'date',
  prompt: 'When did this start?',
};

const monthQuestion: Question = {
  id: 'last-checkup-month',
  type: 'date',
  prompt: 'Which month was your last check-up?',
  granularity: 'month',
};

const yearQuestion: Question = {
  id: 'last-surgery-year',
  type: 'date',
  prompt: 'What year was the surgery?',
  granularity: 'year',
};

const approximateDateQuestion: Question = {
  id: 'symptom-timeframe',
  type: 'date',
  prompt: 'What timeframe best matches the onset?',
  granularity: 'approximate',
};

describe('QuestionSchema', () => {
  it('accepts each supported question type', () => {
    const questions = [
      singleChoiceQuestion,
      multiChoiceQuestion,
      scaleQuestion,
      booleanQuestion,
      freeTextQuestion,
      dateQuestion,
    ];

    for (const question of questions) {
      expect(QuestionSchema.safeParse(question).success).toBe(true);
    }
  });

  it('rejects multi choice questions with impossible selection bounds', () => {
    const result = QuestionSchema.safeParse({
      ...multiChoiceQuestion,
      minSelections: 4,
    });

    expect(result.success).toBe(false);
  });

  it('rejects choice questions with duplicate option values', () => {
    const result = QuestionSchema.safeParse({
      ...singleChoiceQuestion,
      options: [
        { value: 'pain', label: 'Pain' },
        { value: 'pain', label: 'Chest pain' },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe('AnswerSchema', () => {
  it('accepts each supported answer shape', () => {
    const answers = [
      { type: 'single_choice', value: 'pain' },
      { type: 'multi_choice', value: ['cough', 'fever'] },
      { type: 'scale', value: 4.5 },
      { type: 'boolean', value: true },
      { type: 'free_text', value: 'The symptom is worse at night.' },
      { type: 'date', value: '2026-03-06' },
    ];

    for (const answer of answers) {
      expect(AnswerSchema.safeParse(answer).success).toBe(true);
    }
  });
});

describe('parseAnswerForQuestion', () => {
  it('succeeds for valid payloads across supported types', () => {
    expect(parseAnswerForQuestion(singleChoiceQuestion, 'pain')).toEqual({
      success: true,
      data: { type: 'single_choice', value: 'pain' },
    });
    expect(parseAnswerForQuestion(multiChoiceQuestion, ['cough', 'fever'])).toEqual({
      success: true,
      data: { type: 'multi_choice', value: ['cough', 'fever'] },
    });
    expect(parseAnswerForQuestion(scaleQuestion, 4.5)).toEqual({
      success: true,
      data: { type: 'scale', value: 4.5 },
    });
    expect(
      parseAnswerForQuestion(booleanQuestion, { type: 'boolean', value: false }),
    ).toEqual({
      success: true,
      data: { type: 'boolean', value: false },
    });
    expect(parseAnswerForQuestion(freeTextQuestion, 'Symptoms started after travel.')).toEqual({
      success: true,
      data: { type: 'free_text', value: 'Symptoms started after travel.' },
    });
    expect(parseAnswerForQuestion(dateQuestion, '2026-03-06')).toEqual({
      success: true,
      data: { type: 'date', value: '2026-03-06' },
    });
  });

  it('accepts deterministic date formats for non-default granularities', () => {
    expect(parseAnswerForQuestion(monthQuestion, '2026-03').success).toBe(true);
    expect(parseAnswerForQuestion(yearQuestion, '2026').success).toBe(true);
    expect(parseAnswerForQuestion(approximateDateQuestion, '2026-03').success).toBe(true);
  });

  it('accepts scale answers aligned to step and rejects misaligned values', () => {
    expect(parseAnswerForQuestion(scaleQuestion, 2.5).success).toBe(true);
    expect(parseAnswerForQuestion(scaleQuestion, 2.4)).toEqual({
      success: false,
      error: 'Scale answer must align to step',
    });
  });

  it('rejects a single choice answer with an unknown option', () => {
    const result = parseAnswerForQuestion(singleChoiceQuestion, 'unknown');

    expect(result).toEqual({
      success: false,
      error: 'Selected option is not allowed',
    });
  });

  it('rejects a multi choice answer with a non-array payload', () => {
    const result = parseAnswerForQuestion(multiChoiceQuestion, 'cough');

    expect(result).toEqual({
      success: false,
      error: 'Invalid answer payload',
    });
  });

  it('rejects a multi choice answer with an invalid option', () => {
    const result = parseAnswerForQuestion(multiChoiceQuestion, ['cough', 'rash']);

    expect(result).toEqual({
      success: false,
      error: 'Selected option is not allowed',
    });
  });

  it('rejects duplicate multi choice values', () => {
    const result = parseAnswerForQuestion(multiChoiceQuestion, ['cough', 'cough']);

    expect(result).toEqual({
      success: false,
      error: 'Duplicate selections are not allowed',
    });
  });

  it('rejects a scale answer outside the configured range', () => {
    const result = parseAnswerForQuestion(scaleQuestion, 11);

    expect(result).toEqual({
      success: false,
      error: 'Scale answer is out of range',
    });
  });

  it('rejects string input for a boolean answer', () => {
    const result = parseAnswerForQuestion(booleanQuestion, 'yes');

    expect(result).toEqual({
      success: false,
      error: 'Invalid answer payload',
    });
  });

  it('rejects non-string input for a free text answer', () => {
    const result = parseAnswerForQuestion(freeTextQuestion, 42);

    expect(result).toEqual({
      success: false,
      error: 'Invalid answer payload',
    });
  });

  it('rejects date strings that do not match the expected shape', () => {
    const result = parseAnswerForQuestion(dateQuestion, 'yesterday');

    expect(result).toEqual({
      success: false,
      error: 'Date answer must match the expected format',
    });
  });
});

describe('validateAnswerForQuestion', () => {
  it('rejects mismatched question and answer type pairs', () => {
    expect(
      validateAnswerForQuestion(booleanQuestion, {
        type: 'free_text',
        value: 'yes',
      }),
    ).toBe(false);
    expect(
      validateAnswerForQuestion(singleChoiceQuestion, {
        type: 'boolean',
        value: true,
      }),
    ).toBe(false);
  });
});

describe('canApplyAnswerToSession', () => {
  it('matches validateAnswerForQuestion for valid and invalid answers', () => {
    const validAnswer: Answer = { type: 'single_choice', value: 'pain' };
    const invalidAnswer: Answer = { type: 'single_choice', value: 'unknown' };

    expect(canApplyAnswerToSession(singleChoiceQuestion, validAnswer)).toBe(
      validateAnswerForQuestion(singleChoiceQuestion, validAnswer),
    );
    expect(canApplyAnswerToSession(singleChoiceQuestion, invalidAnswer)).toBe(
      validateAnswerForQuestion(singleChoiceQuestion, invalidAnswer),
    );
  });
});
