import { type IntakePhase } from './intake-flow-engine';
import { type Question, QuestionSchema } from './question-answer-contracts';

export type QuestionCatalogPhase = Exclude<IntakePhase, 'review'>;

export type QuestionCatalogEntry = {
  phase: QuestionCatalogPhase;
  priority: number;
  mapsTo: string;
  allowRepeat?: boolean;
  question: Question;
};

function createCatalogEntry(
  entry: Omit<QuestionCatalogEntry, 'question'> & { question: unknown },
): QuestionCatalogEntry {
  return {
    ...entry,
    question: QuestionSchema.parse(entry.question),
  };
}

export const INTAKE_QUESTION_CATALOG: readonly QuestionCatalogEntry[] = [
  createCatalogEntry({
    phase: 'chief_complaint',
    priority: 10,
    mapsTo: 'chiefComplaint.summary',
    question: {
      id: 'chief_complaint_summary',
      type: 'free_text',
      prompt: 'What is the main concern you want to discuss today?',
      description: 'Use your own words.',
      required: true,
      multiline: true,
      maxLength: 500,
    },
  }),
  createCatalogEntry({
    phase: 'symptom_details',
    priority: 20,
    mapsTo: 'symptomDimensions.location',
    question: {
      id: 'symptom_location',
      type: 'free_text',
      prompt: 'Where do you feel it?',
      required: true,
      maxLength: 200,
    },
  }),
  createCatalogEntry({
    phase: 'symptom_details',
    priority: 30,
    mapsTo: 'symptomDimensions.severity',
    question: {
      id: 'symptom_severity',
      type: 'free_text',
      prompt: 'How severe is it?',
      maxLength: 120,
    },
  }),
  createCatalogEntry({
    phase: 'symptom_details',
    priority: 40,
    mapsTo: 'symptomDimensions.quality',
    question: {
      id: 'symptom_quality',
      type: 'free_text',
      prompt: 'How would you describe it?',
      maxLength: 200,
    },
  }),
  createCatalogEntry({
    phase: 'timeline',
    priority: 50,
    mapsTo: 'timeline.onset',
    question: {
      id: 'timeline_onset',
      type: 'date',
      prompt: 'When did it start?',
    },
  }),
  createCatalogEntry({
    phase: 'timeline',
    priority: 60,
    mapsTo: 'timeline.duration',
    question: {
      id: 'timeline_duration',
      type: 'free_text',
      prompt: 'How long has this been going on?',
      maxLength: 120,
    },
  }),
  createCatalogEntry({
    phase: 'timeline',
    priority: 70,
    mapsTo: 'timeline.course',
    question: {
      id: 'timeline_course',
      type: 'free_text',
      prompt: 'Has it stayed the same, improved, or worsened?',
      maxLength: 200,
    },
  }),
  createCatalogEntry({
    phase: 'associated_symptoms',
    priority: 80,
    mapsTo: 'associatedSymptoms.fever',
    question: {
      id: 'associated_symptom_fever',
      type: 'boolean',
      prompt: 'Do you have fever?',
    },
  }),
  createCatalogEntry({
    phase: 'associated_symptoms',
    priority: 90,
    mapsTo: 'associatedSymptoms.cough',
    question: {
      id: 'associated_symptom_cough',
      type: 'boolean',
      prompt: 'Do you have cough?',
    },
  }),
  createCatalogEntry({
    phase: 'associated_symptoms',
    priority: 100,
    mapsTo: 'associatedSymptoms.nausea',
    question: {
      id: 'associated_symptom_nausea',
      type: 'boolean',
      prompt: 'Do you have nausea?',
    },
  }),
  createCatalogEntry({
    phase: 'associated_symptoms',
    priority: 110,
    mapsTo: 'systemicSymptoms.fatigue',
    question: {
      id: 'systemic_symptom_fatigue',
      type: 'boolean',
      prompt: 'Have you been feeling unusually tired?',
    },
  }),
  createCatalogEntry({
    phase: 'associated_symptoms',
    priority: 120,
    mapsTo: 'systemicSymptoms.weightLoss',
    question: {
      id: 'systemic_symptom_weight_loss',
      type: 'boolean',
      prompt: 'Have you had unintentional weight loss?',
    },
  }),
  createCatalogEntry({
    phase: 'history',
    priority: 130,
    mapsTo: 'history.relevantConditions',
    question: {
      id: 'history_relevant_conditions',
      type: 'free_text',
      prompt: 'Any relevant health conditions to note?',
      multiline: true,
      maxLength: 300,
    },
  }),
  createCatalogEntry({
    phase: 'history',
    priority: 140,
    mapsTo: 'history.surgeries',
    question: {
      id: 'history_surgeries',
      type: 'free_text',
      prompt: 'Any past surgeries to note?',
      multiline: true,
      maxLength: 300,
    },
  }),
  createCatalogEntry({
    phase: 'history',
    priority: 150,
    mapsTo: 'history.familyHistory',
    question: {
      id: 'history_family_history',
      type: 'free_text',
      prompt: 'Any family history that feels relevant?',
      multiline: true,
      maxLength: 300,
    },
  }),
  createCatalogEntry({
    phase: 'medications_allergies',
    priority: 160,
    mapsTo: 'medications',
    question: {
      id: 'current_medications',
      type: 'free_text',
      prompt: 'What medications, supplements, or over-the-counter products are you taking now?',
      multiline: true,
      maxLength: 400,
    },
  }),
  createCatalogEntry({
    phase: 'medications_allergies',
    priority: 170,
    mapsTo: 'allergiesIntolerances',
    question: {
      id: 'allergies_intolerances',
      type: 'free_text',
      prompt: 'Any allergies or intolerances?',
      multiline: true,
      maxLength: 300,
    },
  }),
  createCatalogEntry({
    phase: 'red_flags',
    priority: 180,
    mapsTo: 'redFlags.chestPain',
    question: {
      id: 'red_flag_chest_pain',
      type: 'boolean',
      prompt: 'Do you have chest pain?',
    },
  }),
  createCatalogEntry({
    phase: 'red_flags',
    priority: 190,
    mapsTo: 'redFlags.shortnessOfBreath',
    question: {
      id: 'red_flag_shortness_of_breath',
      type: 'boolean',
      prompt: 'Do you have shortness of breath?',
    },
  }),
  createCatalogEntry({
    phase: 'red_flags',
    priority: 200,
    mapsTo: 'redFlags.fainting',
    question: {
      id: 'red_flag_fainting',
      type: 'boolean',
      prompt: 'Have you fainted or nearly fainted?',
    },
  }),
];
