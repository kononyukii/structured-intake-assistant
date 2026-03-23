import { describe, expect, it } from 'vitest';

import { createEmptyIntakeSession, type IntakeSession } from './intake-session-schema';
import {
  getNextBestQuestion,
  getNextQuestionForPhase,
  isQuestionAnswered,
} from './next-question-selector';

type TextField = IntakeSession['chiefComplaint']['summary'];
type DateField = IntakeSession['timeline']['onset'];
type MedicationValue = Extract<IntakeSession['medications'], { kind: 'value' }>['value'];
type AllergyValue = Extract<IntakeSession['allergiesIntolerances'], { kind: 'value' }>['value'];

function createSession(mutate?: (session: IntakeSession) => void): IntakeSession {
  const session = createEmptyIntakeSession();

  mutate?.(session);

  return session;
}

function valueText(value: string): TextField {
  return { kind: 'value', value };
}

function deniedText(): TextField {
  return { kind: 'denied' };
}

function unknownText(): TextField {
  return { kind: 'unknown' };
}

function notAssessedText(): TextField {
  return { kind: 'not_assessed' };
}

function valueDate(value: string): DateField {
  return { kind: 'value', value };
}

function medicationsValue(value: MedicationValue): IntakeSession['medications'] {
  return { kind: 'value', value };
}

function allergiesValue(value: AllergyValue): IntakeSession['allergiesIntolerances'] {
  return { kind: 'value', value };
}

function createFullyAddressedSession(): IntakeSession {
  return createSession((session) => {
    session.chiefComplaint.summary = valueText('Persistent cough');
    session.symptomDimensions.location = valueText('Chest');
    session.symptomDimensions.severity = unknownText();
    session.symptomDimensions.quality = deniedText();
    session.redFlags = {
      chestPain: 'no',
      shortnessOfBreath: 'unknown',
      fainting: 'no',
    };
    session.timeline.onset = valueDate('2026-03-01');
    session.timeline.duration = valueText('Three days');
    session.timeline.course = valueText('About the same');
    session.associatedSymptoms = {
      fever: 'unknown',
      cough: 'yes',
      nausea: 'no',
    };
    session.systemicSymptoms = {
      fatigue: 'yes',
      weightLoss: 'unknown',
    };
    session.history.relevantConditions = deniedText();
    session.history.surgeries = valueText('Appendectomy in 2019');
    session.history.familyHistory = unknownText();
    session.medications = medicationsValue([
      {
        name: 'Ibuprofen',
        details: valueText('200 mg as needed'),
      },
    ]);
    session.allergiesIntolerances = allergiesValue([
      {
        substance: 'Penicillin',
        reaction: valueText('Rash'),
      },
    ]);
  });
}

describe('next-question-selector', () => {
  it('returns the chief complaint question first for an empty session', () => {
    const session = createEmptyIntakeSession();

    expect(getNextBestQuestion(session, 'chief_complaint')).toEqual({
      phase: 'chief_complaint',
      question: expect.objectContaining({
        id: 'chief_complaint_summary',
      }),
    });
  });

  it('moves to symptom details once the chief complaint is already addressed', () => {
    const session = createSession((draft) => {
      draft.chiefComplaint.summary = valueText('Persistent cough');
    });

    expect(getNextBestQuestion(session, 'chief_complaint')).toEqual({
      phase: 'symptom_details',
      question: expect.objectContaining({
        id: 'symptom_location',
      }),
    });
  });

  it('treats value, unknown, denied, and boolean no states as addressed', () => {
    const session = createSession((draft) => {
      draft.chiefComplaint.summary = valueText('Persistent cough');
      draft.symptomDimensions.location = unknownText();
      draft.history.surgeries = deniedText();
      draft.redFlags = {
        chestPain: 'no',
      };
    });

    expect(isQuestionAnswered(session, 'chief_complaint_summary')).toBe(true);
    expect(isQuestionAnswered(session, 'symptom_location')).toBe(true);
    expect(isQuestionAnswered(session, 'history_surgeries')).toBe(true);
    expect(isQuestionAnswered(session, 'red_flag_chest_pain')).toBe(true);
  });

  it('keeps not_assessed fields eligible for selection', () => {
    const session = createSession((draft) => {
      draft.chiefComplaint.summary = valueText('Persistent cough');
      draft.symptomDimensions.location = notAssessedText();
    });

    expect(isQuestionAnswered(session, 'symptom_location')).toBe(false);
    expect(getNextQuestionForPhase(session, 'symptom_details')).toMatchObject({
      id: 'symptom_location',
    });
  });

  it('skips previously asked question ids when repeats are not allowed', () => {
    const session = createSession((draft) => {
      draft.chiefComplaint.summary = valueText('Persistent cough');
    });

    expect(getNextQuestionForPhase(session, 'symptom_details', ['symptom_location'])).toMatchObject(
      {
        id: 'symptom_severity',
      },
    );
  });

  it('does not return a duplicate question when it was already asked', () => {
    const session = createEmptyIntakeSession();

    expect(getNextBestQuestion(session, 'chief_complaint', ['chief_complaint_summary'])).toEqual({
      phase: 'symptom_details',
      question: expect.objectContaining({
        id: 'symptom_location',
      }),
    });
  });

  it('moves to the next relevant phase when the current phase is exhausted', () => {
    const session = createSession((draft) => {
      draft.chiefComplaint.summary = valueText('Persistent cough');
      draft.symptomDimensions.location = valueText('Chest');
      draft.symptomDimensions.severity = valueText('Moderate');
      draft.symptomDimensions.quality = valueText('Tight');
    });

    expect(getNextBestQuestion(session, 'symptom_details')).toEqual({
      phase: 'red_flags',
      question: expect.objectContaining({
        id: 'red_flag_chest_pain',
      }),
    });
  });

  it('returns null when all selector questions are already addressed', () => {
    const session = createFullyAddressedSession();

    expect(getNextBestQuestion(session, 'chief_complaint')).toBeNull();
    expect(getNextQuestionForPhase(session, 'medications_allergies')).toBeNull();
  });

  it('returns the same result for the same session input every time', () => {
    const session = createSession((draft) => {
      draft.chiefComplaint.summary = valueText('Headache');
      draft.symptomDimensions.location = valueText('Front of the head');
    });

    const firstSelection = getNextBestQuestion(session, 'symptom_details', ['symptom_severity']);
    const secondSelection = getNextBestQuestion(session, 'symptom_details', ['symptom_severity']);

    expect(firstSelection).toEqual(secondSelection);
    expect(firstSelection).toEqual({
      phase: 'symptom_details',
      question: expect.objectContaining({
        id: 'symptom_quality',
      }),
    });
  });
});
