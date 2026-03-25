import { INTAKE_QUESTION_CATALOG } from '@/features/intake/domain/intake-question-catalog';
import { type IntakeSession } from '@/features/intake/domain/intake-session-schema';
import {
  parseAnswerForQuestion,
  type Question,
} from '@/features/intake/domain/question-answer-contracts';

export type IntakeWizardDraftValue = string | number | boolean | string[] | null;
export type IntakeWizardBooleanValue = 'yes' | 'no' | 'unknown' | null;

type TextField = IntakeSession['chiefComplaint']['summary'];
type DateField = IntakeSession['timeline']['onset'];

const QUESTION_BY_ID = new Map(
  INTAKE_QUESTION_CATALOG.map((entry) => [entry.question.id, entry.question] as const),
);

function getQuestionById(questionId: string): Question | undefined {
  return QUESTION_BY_ID.get(questionId);
}

function parseStringAnswer(questionId: string, rawValue: unknown) {
  if (typeof rawValue !== 'string') {
    return { status: 'invalid' } as const;
  }

  if (rawValue.trim().length === 0) {
    return { status: 'empty' } as const;
  }

  const question = getQuestionById(questionId);

  if (!question) {
    return { status: 'invalid' } as const;
  }

  const parsedAnswer = parseAnswerForQuestion(question, rawValue);

  if (!parsedAnswer.success) {
    return { status: 'invalid' } as const;
  }

  if (typeof parsedAnswer.data.value !== 'string') {
    return { status: 'invalid' } as const;
  }

  return {
    status: 'value',
    value: parsedAnswer.data.value,
  } as const;
}

function createTextField(questionId: string, rawValue: unknown): TextField | null {
  const parsedValue = parseStringAnswer(questionId, rawValue);

  if (parsedValue.status === 'invalid') {
    return null;
  }

  if (parsedValue.status === 'empty') {
    return { kind: 'not_assessed' };
  }

  return {
    kind: 'value',
    value: parsedValue.value,
  };
}

function createDateField(questionId: string, rawValue: unknown): DateField | null {
  const parsedValue = parseStringAnswer(questionId, rawValue);

  if (parsedValue.status === 'invalid') {
    return null;
  }

  if (parsedValue.status === 'empty') {
    return { kind: 'not_assessed' };
  }

  return {
    kind: 'value',
    value: parsedValue.value,
  };
}

function createBooleanFactValue(rawValue: unknown): IntakeSession['redFlags'][string] {
  if (rawValue === 'yes' || rawValue === 'no' || rawValue === 'unknown') {
    return rawValue;
  }

  return 'not_assessed';
}

function getBooleanDraftValue(
  value: IntakeSession['redFlags'][string] | undefined,
): IntakeWizardBooleanValue {
  if (value === undefined || value === 'not_assessed') {
    return null;
  }

  return value;
}

function createMedicationsField(rawValue: unknown): IntakeSession['medications'] | null {
  const parsedValue = parseStringAnswer('current_medications', rawValue);

  if (parsedValue.status === 'invalid') {
    return null;
  }

  if (parsedValue.status === 'empty') {
    return { kind: 'not_assessed' };
  }

  return {
    kind: 'value',
    value: [
      {
        name: parsedValue.value,
        details: { kind: 'not_assessed' },
      },
    ],
  };
}

function createAllergiesField(rawValue: unknown): IntakeSession['allergiesIntolerances'] | null {
  const parsedValue = parseStringAnswer('allergies_intolerances', rawValue);

  if (parsedValue.status === 'invalid') {
    return null;
  }

  if (parsedValue.status === 'empty') {
    return { kind: 'not_assessed' };
  }

  return {
    kind: 'value',
    value: [
      {
        substance: parsedValue.value,
        reaction: { kind: 'not_assessed' },
      },
    ],
  };
}

function withUpdatedAt(): Pick<IntakeSession, 'updatedAt'> {
  return {
    updatedAt: new Date().toISOString(),
  };
}

export function applyAnswerToSession(
  session: IntakeSession,
  questionId: string,
  rawValue: unknown,
): IntakeSession {
  switch (questionId) {
    case 'chief_complaint_summary': {
      const nextValue = createTextField(questionId, rawValue);

      if (!nextValue) {
        return session;
      }

      return {
        ...session,
        ...withUpdatedAt(),
        chiefComplaint: {
          ...session.chiefComplaint,
          summary: nextValue,
        },
      };
    }
    case 'symptom_location':
    case 'symptom_severity':
    case 'symptom_quality': {
      const nextValue = createTextField(questionId, rawValue);

      if (!nextValue) {
        return session;
      }

      const fieldName =
        questionId === 'symptom_location'
          ? 'location'
          : questionId === 'symptom_severity'
            ? 'severity'
            : 'quality';

      return {
        ...session,
        ...withUpdatedAt(),
        symptomDimensions: {
          ...session.symptomDimensions,
          [fieldName]: nextValue,
        },
      };
    }
    case 'timeline_onset': {
      const nextValue = createDateField(questionId, rawValue);

      if (!nextValue) {
        return session;
      }

      return {
        ...session,
        ...withUpdatedAt(),
        timeline: {
          ...session.timeline,
          onset: nextValue,
        },
      };
    }
    case 'timeline_duration':
    case 'timeline_course': {
      const nextValue = createTextField(questionId, rawValue);

      if (!nextValue) {
        return session;
      }

      const fieldName = questionId === 'timeline_duration' ? 'duration' : 'course';

      return {
        ...session,
        ...withUpdatedAt(),
        timeline: {
          ...session.timeline,
          [fieldName]: nextValue,
        },
      };
    }
    case 'associated_symptom_fever':
    case 'associated_symptom_cough':
    case 'associated_symptom_nausea': {
      const factName =
        questionId === 'associated_symptom_fever'
          ? 'fever'
          : questionId === 'associated_symptom_cough'
            ? 'cough'
            : 'nausea';

      return {
        ...session,
        ...withUpdatedAt(),
        associatedSymptoms: {
          ...session.associatedSymptoms,
          [factName]: createBooleanFactValue(rawValue),
        },
      };
    }
    case 'systemic_symptom_fatigue':
    case 'systemic_symptom_weight_loss': {
      const factName = questionId === 'systemic_symptom_fatigue' ? 'fatigue' : 'weightLoss';

      return {
        ...session,
        ...withUpdatedAt(),
        systemicSymptoms: {
          ...session.systemicSymptoms,
          [factName]: createBooleanFactValue(rawValue),
        },
      };
    }
    case 'history_relevant_conditions':
    case 'history_surgeries':
    case 'history_family_history': {
      const nextValue = createTextField(questionId, rawValue);

      if (!nextValue) {
        return session;
      }

      const fieldName =
        questionId === 'history_relevant_conditions'
          ? 'relevantConditions'
          : questionId === 'history_surgeries'
            ? 'surgeries'
            : 'familyHistory';

      return {
        ...session,
        ...withUpdatedAt(),
        history: {
          ...session.history,
          [fieldName]: nextValue,
        },
      };
    }
    case 'current_medications': {
      const nextValue = createMedicationsField(rawValue);

      if (!nextValue) {
        return session;
      }

      return {
        ...session,
        ...withUpdatedAt(),
        medications: nextValue,
      };
    }
    case 'allergies_intolerances': {
      const nextValue = createAllergiesField(rawValue);

      if (!nextValue) {
        return session;
      }

      return {
        ...session,
        ...withUpdatedAt(),
        allergiesIntolerances: nextValue,
      };
    }
    case 'red_flag_chest_pain':
    case 'red_flag_shortness_of_breath':
    case 'red_flag_fainting': {
      const factName =
        questionId === 'red_flag_chest_pain'
          ? 'chestPain'
          : questionId === 'red_flag_shortness_of_breath'
            ? 'shortnessOfBreath'
            : 'fainting';

      return {
        ...session,
        ...withUpdatedAt(),
        redFlags: {
          ...session.redFlags,
          [factName]: createBooleanFactValue(rawValue),
        },
      };
    }
    default:
      return session;
  }
}

export function getDraftAnswerForQuestion(
  session: IntakeSession,
  questionId: string,
): IntakeWizardDraftValue {
  switch (questionId) {
    case 'chief_complaint_summary':
      return session.chiefComplaint.summary.kind === 'value'
        ? session.chiefComplaint.summary.value
        : '';
    case 'symptom_location':
      return session.symptomDimensions.location.kind === 'value'
        ? session.symptomDimensions.location.value
        : '';
    case 'symptom_severity':
      return session.symptomDimensions.severity.kind === 'value'
        ? session.symptomDimensions.severity.value
        : '';
    case 'symptom_quality':
      return session.symptomDimensions.quality.kind === 'value'
        ? session.symptomDimensions.quality.value
        : '';
    case 'timeline_onset':
      return session.timeline.onset.kind === 'value' ? session.timeline.onset.value : '';
    case 'timeline_duration':
      return session.timeline.duration.kind === 'value' ? session.timeline.duration.value : '';
    case 'timeline_course':
      return session.timeline.course.kind === 'value' ? session.timeline.course.value : '';
    case 'associated_symptom_fever':
      return getBooleanDraftValue(session.associatedSymptoms.fever);
    case 'associated_symptom_cough':
      return getBooleanDraftValue(session.associatedSymptoms.cough);
    case 'associated_symptom_nausea':
      return getBooleanDraftValue(session.associatedSymptoms.nausea);
    case 'systemic_symptom_fatigue':
      return getBooleanDraftValue(session.systemicSymptoms.fatigue);
    case 'systemic_symptom_weight_loss':
      return getBooleanDraftValue(session.systemicSymptoms.weightLoss);
    case 'history_relevant_conditions':
      return session.history.relevantConditions.kind === 'value'
        ? session.history.relevantConditions.value
        : '';
    case 'history_surgeries':
      return session.history.surgeries.kind === 'value' ? session.history.surgeries.value : '';
    case 'history_family_history':
      return session.history.familyHistory.kind === 'value'
        ? session.history.familyHistory.value
        : '';
    case 'current_medications':
      return session.medications.kind === 'value' ? session.medications.value[0]?.name ?? '' : '';
    case 'allergies_intolerances':
      return session.allergiesIntolerances.kind === 'value'
        ? session.allergiesIntolerances.value[0]?.substance ?? ''
        : '';
    case 'red_flag_chest_pain':
      return getBooleanDraftValue(session.redFlags.chestPain);
    case 'red_flag_shortness_of_breath':
      return getBooleanDraftValue(session.redFlags.shortnessOfBreath);
    case 'red_flag_fainting':
      return getBooleanDraftValue(session.redFlags.fainting);
    default:
      return null;
  }
}
