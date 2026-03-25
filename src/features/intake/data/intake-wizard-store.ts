import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import {
  getInitialIntakePhase,
  getPhaseIndex,
  getTotalPhaseCount,
  type IntakePhase,
} from '@/features/intake/domain/intake-flow-engine';
import { INTAKE_QUESTION_CATALOG } from '@/features/intake/domain/intake-question-catalog';
import {
  createEmptyIntakeSession,
  type IntakeSession,
} from '@/features/intake/domain/intake-session-schema';
import {
  getNextBestQuestion,
  isQuestionAnswered,
} from '@/features/intake/domain/next-question-selector';
import {
  type Question,
} from '@/features/intake/domain/question-answer-contracts';

import {
  applyAnswerToSession,
  getDraftAnswerForQuestion,
  type IntakeWizardDraftValue,
} from './apply-answer-to-session';

type IntakeWizardHistoryItem = {
  phase: IntakePhase;
  questionId: string;
};

type IntakeWizardState = {
  session: IntakeSession;
  currentPhase: IntakePhase;
  currentQuestion: Question | null;
  currentQuestionId: string | null;
  askedQuestionIds: string[];
  history: IntakeWizardHistoryItem[];
  draftCurrentInput: IntakeWizardDraftValue;
  currentPhaseIndex: number;
  totalPhaseCount: number;
  canGoBack: boolean;
  canGoNext: boolean;
};

type IntakeWizardActions = {
  initializeWizard: () => void;
  saveAnswer: (rawValue: IntakeWizardDraftValue) => void;
  goBack: () => void;
  goNext: () => void;
  saveAndExit: () => void;
  resetWizard: () => void;
};

export type IntakeWizardStore = IntakeWizardState & IntakeWizardActions;

const QUESTION_BY_ID = new Map(
  INTAKE_QUESTION_CATALOG.map((entry) => [entry.question.id, entry.question] as const),
);

function getQuestionById(questionId: string | null): Question | null {
  if (!questionId) {
    return null;
  }

  return QUESTION_BY_ID.get(questionId) ?? null;
}

function createWizardSnapshot(params: {
  session: IntakeSession;
  currentPhase: IntakePhase;
  currentQuestionId: string | null;
  history: IntakeWizardHistoryItem[];
}): IntakeWizardState {
  const currentQuestion = getQuestionById(params.currentQuestionId);
  const askedQuestionIds = params.history.map((item) => item.questionId);

  return {
    session: params.session,
    currentPhase: params.currentPhase,
    currentQuestion,
    currentQuestionId: params.currentQuestionId,
    askedQuestionIds,
    history: params.history,
    draftCurrentInput: currentQuestion
      ? getDraftAnswerForQuestion(params.session, currentQuestion.id)
      : null,
    currentPhaseIndex: getPhaseIndex(params.currentPhase) + 1,
    totalPhaseCount: getTotalPhaseCount(),
    canGoBack: currentQuestion ? params.history.length > 1 : params.history.length > 0,
    canGoNext: currentQuestion
      ? isQuestionAnswered(params.session, currentQuestion.id)
      : false,
  };
}

function createInitialWizardState(): IntakeWizardState {
  const session = createEmptyIntakeSession();
  const initialPhase = getInitialIntakePhase();
  const initialSelection = getNextBestQuestion(session, initialPhase);

  if (!initialSelection) {
    return createWizardSnapshot({
      session,
      currentPhase: 'review',
      currentQuestionId: null,
      history: [],
    });
  }

  return createWizardSnapshot({
    session,
    currentPhase: initialSelection.phase,
    currentQuestionId: initialSelection.question.id,
    history: [
      {
        phase: initialSelection.phase,
        questionId: initialSelection.question.id,
      },
    ],
  });
}

function createReviewWizardState(
  session: IntakeSession,
  history: IntakeWizardHistoryItem[],
): IntakeWizardState {
  return createWizardSnapshot({
    session,
    currentPhase: 'review',
    currentQuestionId: null,
    history,
  });
}

export function createIntakeWizardStore() {
  return createStore<IntakeWizardStore>()((set, get) => ({
    ...createInitialWizardState(),
    initializeWizard: () => {
      const state = get();

      if (state.currentQuestion || state.history.length > 0 || state.currentPhase === 'review') {
        return;
      }

      set(createInitialWizardState());
    },
    saveAnswer: (rawValue) => {
      const state = get();

      if (!state.currentQuestionId) {
        return;
      }

      const nextSession = applyAnswerToSession(state.session, state.currentQuestionId, rawValue);

      set(
        createWizardSnapshot({
          session: nextSession,
          currentPhase: state.currentPhase,
          currentQuestionId: state.currentQuestionId,
          history: state.history,
        }),
      );
    },
    goBack: () => {
      const state = get();

      if (!state.canGoBack) {
        return;
      }

      if (!state.currentQuestion) {
        const previousQuestion = state.history[state.history.length - 1];

        if (!previousQuestion) {
          return;
        }

        set(
          createWizardSnapshot({
            session: state.session,
            currentPhase: previousQuestion.phase,
            currentQuestionId: previousQuestion.questionId,
            history: state.history,
          }),
        );

        return;
      }

      const nextHistory = state.history.slice(0, -1);
      const previousQuestion = nextHistory[nextHistory.length - 1];

      if (!previousQuestion) {
        return;
      }

      set(
        createWizardSnapshot({
          session: state.session,
          currentPhase: previousQuestion.phase,
          currentQuestionId: previousQuestion.questionId,
          history: nextHistory,
        }),
      );
    },
    goNext: () => {
      const state = get();

      if (!state.currentQuestion || !state.canGoNext) {
        return;
      }

      const nextSelection = getNextBestQuestion(
        state.session,
        state.currentPhase,
        state.askedQuestionIds,
      );

      if (!nextSelection) {
        set(createReviewWizardState(state.session, state.history));
        return;
      }

      set(
        createWizardSnapshot({
          session: state.session,
          currentPhase: nextSelection.phase,
          currentQuestionId: nextSelection.question.id,
          history: [
            ...state.history,
            {
              phase: nextSelection.phase,
              questionId: nextSelection.question.id,
            },
          ],
        }),
      );
    },
    saveAndExit: () => {
      set(createInitialWizardState());
    },
    resetWizard: () => {
      set(createInitialWizardState());
    },
  }));
}

export const intakeWizardStore = createIntakeWizardStore();

export function useIntakeWizardStore<T>(selector: (state: IntakeWizardStore) => T): T {
  return useStore(intakeWizardStore, selector);
}
