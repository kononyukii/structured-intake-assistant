import { type IntakeSession } from './intake-session-schema';

export const INTAKE_PHASES = [
  'chief_complaint',
  'symptom_details',
  'timeline',
  'associated_symptoms',
  'history',
  'medications_allergies',
  'red_flags',
  'review',
] as const;

export type IntakePhase = (typeof INTAKE_PHASES)[number];

export type IntakeFlowState = {
  currentPhase: IntakePhase;
};

type SessionFieldState = {
  kind: 'value' | 'denied' | 'unknown' | 'not_assessed';
};

type BooleanFactState = IntakeSession['redFlags'][string];

function isFieldAddressed(field: SessionFieldState): boolean {
  return field.kind !== 'not_assessed';
}

function hasAnyAddressedField(fields: readonly SessionFieldState[]): boolean {
  return fields.some(isFieldAddressed);
}

function hasAnyAddressedFact(facts: Record<string, BooleanFactState>): boolean {
  return Object.values(facts).some((state) => state !== 'not_assessed');
}

export function getInitialIntakePhase(): IntakePhase {
  return INTAKE_PHASES[0];
}

export function getPhaseIndex(phase: IntakePhase): number {
  return INTAKE_PHASES.indexOf(phase);
}

export function getTotalPhaseCount(): number {
  return INTAKE_PHASES.length;
}

export function getNextIntakePhase(current: IntakePhase): IntakePhase | null {
  const currentIndex = getPhaseIndex(current);

  return INTAKE_PHASES[currentIndex + 1] ?? null;
}

export function getPreviousIntakePhase(current: IntakePhase): IntakePhase | null {
  const currentIndex = getPhaseIndex(current);

  if (currentIndex <= 0) {
    return null;
  }

  return INTAKE_PHASES[currentIndex - 1];
}

export function isPhaseComplete(session: IntakeSession, phase: IntakePhase): boolean {
  switch (phase) {
    case 'chief_complaint':
      return isFieldAddressed(session.chiefComplaint.summary);
    case 'symptom_details':
      return hasAnyAddressedField([
        session.symptomDimensions.location,
        session.symptomDimensions.severity,
        session.symptomDimensions.quality,
      ]);
    case 'timeline':
      return hasAnyAddressedField([
        session.timeline.onset,
        session.timeline.duration,
        session.timeline.course,
      ]);
    case 'associated_symptoms':
      return (
        hasAnyAddressedFact(session.associatedSymptoms) ||
        hasAnyAddressedFact(session.systemicSymptoms)
      );
    case 'history':
      return hasAnyAddressedField([
        session.history.relevantConditions,
        session.history.surgeries,
        session.history.familyHistory,
      ]);
    case 'medications_allergies':
      return (
        isFieldAddressed(session.medications) ||
        isFieldAddressed(session.allergiesIntolerances)
      );
    case 'red_flags':
      return hasAnyAddressedFact(session.redFlags);
    case 'review':
      return isIntakeFlowComplete(session);
  }
}

export function canAdvanceFromPhase(session: IntakeSession, phase: IntakePhase): boolean {
  return isPhaseComplete(session, phase);
}

export function advancePhase(session: IntakeSession, current: IntakePhase): IntakePhase {
  if (!canAdvanceFromPhase(session, current)) {
    return current;
  }

  return getNextIntakePhase(current) ?? current;
}

export function isIntakeFlowComplete(session: IntakeSession): boolean {
  return INTAKE_PHASES.every((phase) => phase === 'review' || isPhaseComplete(session, phase));
}
