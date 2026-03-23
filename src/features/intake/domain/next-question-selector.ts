import { type IntakePhase } from './intake-flow-engine';
import {
  INTAKE_QUESTION_CATALOG,
  type QuestionCatalogEntry,
  type QuestionCatalogPhase,
} from './intake-question-catalog';
import { type IntakeSession } from './intake-session-schema';
import { type Question } from './question-answer-contracts';

type AddressableFieldState = {
  kind: 'value' | 'denied' | 'unknown' | 'not_assessed';
};

type BooleanFactState = IntakeSession['redFlags'][string];

const SELECTOR_PHASE_PRIORITY: readonly QuestionCatalogPhase[] = [
  'chief_complaint',
  'symptom_details',
  'red_flags',
  'timeline',
  'associated_symptoms',
  'history',
  'medications_allergies',
];

const QUESTION_CATALOG_ENTRY_BY_ID = new Map(
  INTAKE_QUESTION_CATALOG.map((entry) => [entry.question.id, entry] as const),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAddressableFieldState(value: unknown): value is AddressableFieldState {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    return false;
  }

  return ['value', 'denied', 'unknown', 'not_assessed'].includes(value.kind);
}

function isBooleanFactState(value: unknown): value is BooleanFactState {
  return value === 'yes' || value === 'no' || value === 'unknown' || value === 'not_assessed';
}

function getValueAtPath(session: IntakeSession, path: string): unknown {
  const pathSegments = path.split('.');
  let currentValue: unknown = session;

  for (const segment of pathSegments) {
    if (!isRecord(currentValue) || !(segment in currentValue)) {
      return undefined;
    }

    currentValue = currentValue[segment];
  }

  return currentValue;
}

function isCatalogEntryAnswered(session: IntakeSession, entry: QuestionCatalogEntry): boolean {
  const value = getValueAtPath(session, entry.mapsTo);

  if (isBooleanFactState(value)) {
    return value !== 'not_assessed';
  }

  if (isAddressableFieldState(value)) {
    // Collection fields count as addressed once the wrapper kind changes from not_assessed.
    return value.kind !== 'not_assessed';
  }

  return false;
}

function getCatalogEntriesForPhase(phase: IntakePhase): readonly QuestionCatalogEntry[] {
  if (phase === 'review') {
    return [];
  }

  return INTAKE_QUESTION_CATALOG.filter((entry) => entry.phase === phase);
}

function getCandidatePhases(currentPhase: IntakePhase): readonly QuestionCatalogPhase[] {
  if (currentPhase === 'review') {
    return SELECTOR_PHASE_PRIORITY;
  }

  return [currentPhase, ...SELECTOR_PHASE_PRIORITY.filter((phase) => phase !== currentPhase)];
}

export function getQuestionsForPhase(phase: IntakePhase): Question[] {
  return getCatalogEntriesForPhase(phase).map((entry) => entry.question);
}

export function isQuestionAnswered(session: IntakeSession, questionId: string): boolean {
  const entry = QUESTION_CATALOG_ENTRY_BY_ID.get(questionId);

  if (!entry) {
    return false;
  }

  return isCatalogEntryAnswered(session, entry);
}

export function getNextQuestionForPhase(
  session: IntakeSession,
  phase: IntakePhase,
  askedQuestionIds: string[] = [],
): Question | null {
  const askedQuestionIdSet = new Set(askedQuestionIds);

  for (const entry of getCatalogEntriesForPhase(phase)) {
    if (isCatalogEntryAnswered(session, entry)) {
      continue;
    }

    if (!entry.allowRepeat && askedQuestionIdSet.has(entry.question.id)) {
      continue;
    }

    return entry.question;
  }

  return null;
}

export function getNextBestQuestion(
  session: IntakeSession,
  currentPhase: IntakePhase,
  askedQuestionIds: string[] = [],
): { phase: QuestionCatalogPhase; question: Question } | null {
  for (const phase of getCandidatePhases(currentPhase)) {
    const question = getNextQuestionForPhase(session, phase, askedQuestionIds);

    if (question) {
      return { phase, question };
    }
  }

  return null;
}
