import { describe, expect, it } from 'vitest';

import {
  advancePhase,
  canAdvanceFromPhase,
  getInitialIntakePhase,
  getNextIntakePhase,
  getPhaseIndex,
  getPreviousIntakePhase,
  getTotalPhaseCount,
  INTAKE_PHASES,
  isIntakeFlowComplete,
  isPhaseComplete,
} from './intake-flow-engine';
import { createEmptyIntakeSession, type IntakeSession } from './intake-session-schema';

function createSessionWithChiefComplaint(): IntakeSession {
  const session = createEmptyIntakeSession();

  return {
    ...session,
    chiefComplaint: {
      summary: {
        kind: 'value',
        value: 'Persistent cough',
      },
    },
  };
}

function createMinimallyCompletedSession(): IntakeSession {
  const session = createEmptyIntakeSession();

  return {
    ...session,
    chiefComplaint: {
      summary: {
        kind: 'value',
        value: 'Persistent cough',
      },
    },
    symptomDimensions: {
      location: {
        kind: 'value',
        value: 'Chest',
      },
      severity: {
        kind: 'not_assessed',
      },
      quality: {
        kind: 'not_assessed',
      },
    },
    timeline: {
      onset: {
        kind: 'value',
        value: '2026-03-01',
      },
      duration: {
        kind: 'not_assessed',
      },
      course: {
        kind: 'not_assessed',
      },
    },
    associatedSymptoms: {
      cough: 'yes',
    },
    systemicSymptoms: {},
    history: {
      relevantConditions: {
        kind: 'denied',
      },
      surgeries: {
        kind: 'not_assessed',
      },
      familyHistory: {
        kind: 'not_assessed',
      },
    },
    medications: {
      kind: 'denied',
    },
    allergiesIntolerances: {
      kind: 'not_assessed',
    },
    redFlags: {
      troubleBreathing: 'no',
    },
  };
}

describe('intake-flow-engine', () => {
  it('returns the expected initial phase', () => {
    expect(getInitialIntakePhase()).toBe('chief_complaint');
    expect(getTotalPhaseCount()).toBe(INTAKE_PHASES.length);
  });

  it('moves between phases and respects boundaries', () => {
    expect(getPhaseIndex('timeline')).toBe(2);
    expect(getPreviousIntakePhase('chief_complaint')).toBeNull();
    expect(getNextIntakePhase('chief_complaint')).toBe('symptom_details');
    expect(getPreviousIntakePhase('symptom_details')).toBe('chief_complaint');
    expect(getNextIntakePhase('review')).toBeNull();
  });

  it('does not advance an empty session from the first phase', () => {
    const session = createEmptyIntakeSession();

    expect(canAdvanceFromPhase(session, 'chief_complaint')).toBe(false);
    expect(advancePhase(session, 'chief_complaint')).toBe('chief_complaint');
  });

  it('advances after the chief complaint is filled', () => {
    const session = createSessionWithChiefComplaint();

    expect(canAdvanceFromPhase(session, 'chief_complaint')).toBe(true);
    expect(advancePhase(session, 'chief_complaint')).toBe('symptom_details');
  });

  it('keeps review incomplete while earlier phases are incomplete', () => {
    const session = createSessionWithChiefComplaint();

    expect(isPhaseComplete(session, 'review')).toBe(false);
    expect(isIntakeFlowComplete(session)).toBe(false);
  });

  it('recognizes a minimally completed session as flow complete', () => {
    const session = createMinimallyCompletedSession();

    expect(isIntakeFlowComplete(session)).toBe(true);
    expect(isPhaseComplete(session, 'review')).toBe(true);
  });

  it('does not break when advancing from the last phase', () => {
    const session = createMinimallyCompletedSession();

    expect(advancePhase(session, 'review')).toBe('review');
  });
});
