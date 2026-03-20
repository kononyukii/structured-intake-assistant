import {
  createEmptyIntakeSession,
  type IntakeSession,
  IntakeSessionSchema,
} from '@/features/intake/domain/intake-session-schema';
import {
  type Answer,
  AnswerSchema,
  type Question,
  QuestionSchema,
} from '@/features/intake/domain/question-answer-contracts';

const FIXTURE_SESSION_TIMESTAMP = '2026-03-01T10:00:00.000Z';

export const SYNTHETIC_CASE_IDS = [
  'simple_intake',
  'chaotic_free_text',
  'short_missing_answers',
  'unsupported_underage',
  'unsupported_pregnancy',
  'unsupported_emergency',
  'unsafe_ai_diagnosis',
  'unsafe_ai_treatment',
  'unsafe_ai_triage',
] as const;

export type SyntheticCaseId = (typeof SYNTHETIC_CASE_IDS)[number];

type BooleanQuestion = Extract<Question, { type: 'boolean' }>;
type FreeTextQuestion = Extract<Question, { type: 'free_text' }>;

type IntakeTextField = IntakeSession['chiefComplaint']['summary'];
type IntakeDateField = IntakeSession['timeline']['onset'];
type MedicationCollectionValue = Extract<IntakeSession['medications'], { kind: 'value' }>['value'];
type AllergyCollectionValue = Extract<
  IntakeSession['allergiesIntolerances'],
  { kind: 'value' }
>['value'];

export type QuestionAnswerPairFixture = {
  question: Question;
  answer: Answer;
};

function createFixtureBaseSession(id: string): IntakeSession {
  const session = createEmptyIntakeSession();

  return {
    ...session,
    id,
    createdAt: FIXTURE_SESSION_TIMESTAMP,
    updatedAt: FIXTURE_SESSION_TIMESTAMP,
  };
}

function valueText(value: string): IntakeTextField {
  return { kind: 'value', value };
}

function deniedText(): IntakeTextField {
  return { kind: 'denied' };
}

function unknownText(): IntakeTextField {
  return { kind: 'unknown' };
}

function notAssessedText(): IntakeTextField {
  return { kind: 'not_assessed' };
}

function valueDate(value: string): IntakeDateField {
  return { kind: 'value', value };
}

function unknownDate(): IntakeDateField {
  return { kind: 'unknown' };
}

function medicationsValue(value: MedicationCollectionValue): IntakeSession['medications'] {
  return { kind: 'value', value };
}

function allergiesValue(value: AllergyCollectionValue): IntakeSession['allergiesIntolerances'] {
  return { kind: 'value', value };
}

function createDefaultAnswerFixture(question: Question): Answer {
  switch (question.type) {
    case 'single_choice':
      return AnswerSchema.parse({
        type: 'single_choice',
        value: question.options[0].value,
      });
    case 'multi_choice':
      return AnswerSchema.parse({
        type: 'multi_choice',
        value: [question.options[0].value],
      });
    case 'scale':
      return AnswerSchema.parse({
        type: 'scale',
        value: question.min,
      });
    case 'boolean':
      return AnswerSchema.parse({
        type: 'boolean',
        value: true,
      });
    case 'free_text':
      return AnswerSchema.parse({
        type: 'free_text',
        value: 'Started a few days ago and has been steady since then.',
      });
    case 'date':
      return AnswerSchema.parse({
        type: 'date',
        value:
          question.granularity === 'year'
            ? '2026'
            : question.granularity === 'month'
              ? '2026-03'
              : '2026-03-01',
      });
  }
}

export function createSimpleIntakeSessionFixture(): IntakeSession {
  const session = createFixtureBaseSession('fixture-simple-intake');

  return IntakeSessionSchema.parse({
    ...session,
    chiefComplaint: {
      summary: valueText('Dry cough for 3 days'),
    },
    symptomDimensions: {
      location: valueText('Throat and upper chest'),
      severity: valueText('Mild'),
      quality: valueText('Dry and irritating'),
    },
    timeline: {
      onset: valueDate('2026-02-26'),
      duration: valueText('3 days'),
      course: valueText('About the same overall, worse at night'),
    },
    associatedSymptoms: {
      soreThroat: 'yes',
      nasalCongestion: 'yes',
      wheezing: 'no',
      shortnessOfBreath: 'no',
    },
    systemicSymptoms: {
      fever: 'no',
      chills: 'no',
      fatigue: 'yes',
    },
    history: {
      relevantConditions: valueText('Seasonal allergies'),
      surgeries: deniedText(),
      familyHistory: unknownText(),
    },
    medications: medicationsValue([
      {
        name: 'Cetirizine',
        details: valueText('10 mg as needed for allergies'),
      },
    ]),
    allergiesIntolerances: allergiesValue([
      {
        substance: 'Penicillin',
        reaction: valueText('Rash in childhood'),
      },
    ]),
    redFlags: {
      chestPain: 'no',
      fainting: 'no',
      coughingBlood: 'no',
    },
  });
}

export function createChaoticFreeTextIntakeSessionFixture(): IntakeSession {
  const session = createFixtureBaseSession('fixture-chaotic-free-text');

  return IntakeSessionSchema.parse({
    ...session,
    chiefComplaint: {
      summary: valueText(
        'Cough and chest stuff for about a week, maybe longer. It started after a cold, is worse at night, and I keep remembering new details while talking.',
      ),
    },
    symptomDimensions: {
      location: valueText('Mostly chest, sometimes throat'),
      severity: unknownText(),
      quality: valueText('Dry sometimes, occasionally feels tight'),
    },
    timeline: {
      onset: unknownDate(),
      duration: valueText('About a week, maybe a little longer'),
      course: valueText('Started with a cold, improved a bit, then lingered'),
    },
    associatedSymptoms: {
      nasalCongestion: 'yes',
      soreThroat: 'yes',
      chestTightness: 'yes',
      wheezing: 'unknown',
    },
    systemicSymptoms: {
      fever: 'unknown',
      fatigue: 'yes',
      appetiteChange: 'not_assessed',
    },
    history: {
      relevantConditions: valueText('Had asthma as a child, not sure if it still matters'),
      surgeries: deniedText(),
      familyHistory: notAssessedText(),
    },
    medications: medicationsValue([
      {
        name: 'Albuterol inhaler',
        details: unknownText(),
      },
    ]),
    allergiesIntolerances: { kind: 'unknown' },
    redFlags: {
      chestPain: 'no',
      shortnessOfBreath: 'unknown',
      fainting: 'no',
    },
  });
}

export function createShortMissingAnswerIntakeSessionFixture(): IntakeSession {
  const session = createFixtureBaseSession('fixture-short-missing-answer');

  return IntakeSessionSchema.parse({
    ...session,
    chiefComplaint: {
      summary: valueText('Headache'),
    },
    symptomDimensions: {
      location: unknownText(),
      severity: unknownText(),
      quality: notAssessedText(),
    },
    timeline: {
      onset: unknownDate(),
      duration: unknownText(),
      course: notAssessedText(),
    },
    associatedSymptoms: {
      nausea: 'unknown',
      lightSensitivity: 'not_assessed',
    },
    systemicSymptoms: {
      fever: 'not_assessed',
      fatigue: 'unknown',
    },
    history: {
      relevantConditions: unknownText(),
      surgeries: notAssessedText(),
      familyHistory: notAssessedText(),
    },
    medications: { kind: 'unknown' },
    allergiesIntolerances: { kind: 'not_assessed' },
    redFlags: {
      visionChanges: 'unknown',
      fainting: 'not_assessed',
    },
  });
}

export function createUnsupportedUnderageSessionFixture(): IntakeSession {
  const session = createFixtureBaseSession('fixture-unsupported-underage');

  return IntakeSessionSchema.parse({
    ...session,
    chiefComplaint: {
      summary: valueText('17-year-old with sore throat and cough for 2 days'),
    },
    symptomDimensions: {
      location: valueText('Throat'),
      severity: valueText('Mild'),
      quality: valueText('Scratchy'),
    },
    timeline: {
      onset: valueDate('2026-02-28'),
      duration: valueText('2 days'),
      course: valueText('About the same'),
    },
    associatedSymptoms: {
      cough: 'yes',
      nasalCongestion: 'yes',
    },
    systemicSymptoms: {
      fever: 'no',
    },
    history: {
      relevantConditions: deniedText(),
      surgeries: deniedText(),
      familyHistory: unknownText(),
    },
    medications: { kind: 'denied' },
    allergiesIntolerances: { kind: 'unknown' },
    redFlags: {
      shortnessOfBreath: 'no',
    },
  });
}

export function createUnsupportedPregnancySessionFixture(): IntakeSession {
  const session = createFixtureBaseSession('fixture-unsupported-pregnancy');

  return IntakeSessionSchema.parse({
    ...session,
    chiefComplaint: {
      summary: valueText('10 weeks pregnant with nausea and dizziness before a routine visit'),
    },
    symptomDimensions: {
      location: valueText('Stomach and head'),
      severity: valueText('Moderate'),
      quality: valueText('Queasy with occasional lightheadedness'),
    },
    timeline: {
      onset: valueDate('2026-02-20'),
      duration: valueText('About 10 days'),
      course: valueText('Comes and goes through the day'),
    },
    associatedSymptoms: {
      vomiting: 'no',
      reducedAppetite: 'yes',
    },
    systemicSymptoms: {
      fatigue: 'yes',
      fever: 'no',
    },
    history: {
      relevantConditions: deniedText(),
      surgeries: deniedText(),
      familyHistory: unknownText(),
    },
    medications: medicationsValue([
      {
        name: 'Prenatal vitamin',
        details: valueText('Daily'),
      },
    ]),
    allergiesIntolerances: { kind: 'unknown' },
    redFlags: {
      fainting: 'no',
      vaginalBleeding: 'no',
    },
  });
}

export function createUnsupportedEmergencySessionFixture(): IntakeSession {
  const session = createFixtureBaseSession('fixture-unsupported-emergency');

  return IntakeSessionSchema.parse({
    ...session,
    chiefComplaint: {
      summary: valueText('Sudden chest pain with shortness of breath starting 20 minutes ago'),
    },
    symptomDimensions: {
      location: valueText('Center of the chest'),
      severity: valueText('Severe'),
      quality: valueText('Pressure and tightness'),
    },
    timeline: {
      onset: valueDate('2026-03-01'),
      duration: valueText('20 minutes'),
      course: valueText('Started suddenly and is ongoing'),
    },
    associatedSymptoms: {
      shortnessOfBreath: 'yes',
      nausea: 'yes',
    },
    systemicSymptoms: {
      sweating: 'yes',
      fever: 'no',
    },
    history: {
      relevantConditions: unknownText(),
      surgeries: deniedText(),
      familyHistory: unknownText(),
    },
    medications: { kind: 'unknown' },
    allergiesIntolerances: { kind: 'unknown' },
    redFlags: {
      chestPain: 'yes',
      shortnessOfBreath: 'yes',
      fainting: 'unknown',
    },
  });
}

export function createBooleanQuestionFixture(
  overrides: Partial<BooleanQuestion> = {},
): BooleanQuestion {
  return QuestionSchema.parse({
    id: 'question-fever',
    type: 'boolean',
    prompt: 'Do you currently have a fever?',
    description: 'Select yes if fever is present and no if it is denied.',
    required: true,
    ...overrides,
  }) as BooleanQuestion;
}

export function createFreeTextQuestionFixture(
  overrides: Partial<FreeTextQuestion> = {},
): FreeTextQuestion {
  return QuestionSchema.parse({
    id: 'question-chief-complaint-detail',
    type: 'free_text',
    prompt: 'What would you like your doctor to know first?',
    description: 'Use the patient’s own words.',
    required: true,
    multiline: true,
    maxLength: 500,
    ...overrides,
  }) as FreeTextQuestion;
}

export function createQuestionAnswerPairFixture(
  params: {
    question?: Question;
    answer?: Answer;
  } = {},
): QuestionAnswerPairFixture {
  const question = QuestionSchema.parse(params.question ?? createFreeTextQuestionFixture());
  const answer = AnswerSchema.parse(params.answer ?? createDefaultAnswerFixture(question));

  if (question.type !== answer.type) {
    throw new Error(
      `Fixture answer type "${answer.type}" does not match question type "${question.type}"`,
    );
  }

  return {
    question,
    answer,
  };
}
