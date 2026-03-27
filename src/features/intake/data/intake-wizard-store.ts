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
import { type Question } from '@/features/intake/domain/question-answer-contracts';

import {
  applyAnswerToSession,
  getDraftAnswerForQuestion,
  type IntakeWizardDraftValue,
} from './apply-answer-to-session';
import {
  type IntakeDraftRepository,
  intakeDraftRepository,
  type LoadDraftResult,
} from './intake-draft-repository';

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
  hasInitialized: boolean;
  isHydrating: boolean;
  draftStatus: LoadDraftResult['status'] | 'idle';
  draftRecoveryMessage: string | null;
};

type IntakeWizardSnapshot = Omit<
  IntakeWizardState,
  'hasInitialized' | 'isHydrating' | 'draftStatus' | 'draftRecoveryMessage'
>;

type IntakeWizardActions = {
  initializeWizard: () => Promise<void>;
  saveAnswer: (rawValue: IntakeWizardDraftValue) => void;
  goBack: () => void;
  goNext: () => void;
  saveAndExit: () => void;
  resetWizard: () => Promise<void>;
};

export type IntakeWizardStore = IntakeWizardState & IntakeWizardActions;

const QUESTION_BY_ID = new Map(
  INTAKE_QUESTION_CATALOG.map(
    (entry) => [entry.question.id, entry.question] as const
  )
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
}): IntakeWizardSnapshot {
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
    canGoBack: currentQuestion
      ? params.history.length > 1
      : params.history.length > 0,
    canGoNext: currentQuestion
      ? isQuestionAnswered(params.session, currentQuestion.id)
      : false,
  };
}

function createStateWithPersistence(
  snapshot: IntakeWizardSnapshot,
  persistence: Pick<
    IntakeWizardState,
    'hasInitialized' | 'isHydrating' | 'draftStatus' | 'draftRecoveryMessage'
  >
): IntakeWizardState {
  return {
    ...snapshot,
    ...persistence,
  };
}

function createActiveDraftState(
  snapshot: IntakeWizardSnapshot
): IntakeWizardState {
  return createStateWithPersistence(snapshot, {
    hasInitialized: true,
    isHydrating: false,
    draftStatus: 'ready',
    draftRecoveryMessage: null,
  });
}

function createInitialWizardSnapshot(): IntakeWizardSnapshot {
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
  history: IntakeWizardHistoryItem[]
): IntakeWizardSnapshot {
  return createWizardSnapshot({
    session,
    currentPhase: 'review',
    currentQuestionId: null,
    history,
  });
}

function createInitialWizardState(): IntakeWizardState {
  return createStateWithPersistence(createInitialWizardSnapshot(), {
    hasInitialized: false,
    isHydrating: false,
    draftStatus: 'idle',
    draftRecoveryMessage: null,
  });
}

function getDraftRecoveryMessage(
  result: Extract<LoadDraftResult, { status: 'incompatible' | 'corrupt' }>
): string {
  return result.status === 'incompatible'
    ? 'A saved draft from an older version could not be resumed. Start fresh to continue.'
    : 'The saved draft on this device could not be resumed. Start fresh to continue.';
}

function createRestoredWizardState(
  session: IntakeSession,
  currentPhase?: IntakePhase
): IntakeWizardSnapshot {
  const targetSelection = getNextBestQuestion(
    session,
    currentPhase ?? getInitialIntakePhase()
  );
  let workingSession = createEmptyIntakeSession();
  let workingPhase = getInitialIntakePhase();
  const history: IntakeWizardHistoryItem[] = [];

  while (true) {
    const selection = getNextBestQuestion(
      workingSession,
      workingPhase,
      history.map((item) => item.questionId)
    );

    if (!selection) {
      return createReviewWizardState(session, history);
    }

    history.push({
      phase: selection.phase,
      questionId: selection.question.id,
    });

    if (
      !isQuestionAnswered(session, selection.question.id) ||
      selection.question.id === targetSelection?.question.id
    ) {
      return createWizardSnapshot({
        session,
        currentPhase: selection.phase,
        currentQuestionId: selection.question.id,
        history,
      });
    }

    workingSession = applyAnswerToSession(
      workingSession,
      selection.question.id,
      getDraftAnswerForQuestion(session, selection.question.id)
    );

    workingPhase = selection.phase;
  }
}

type CreateIntakeWizardStoreOptions = {
  draftRepository?: IntakeDraftRepository;
};

export function createIntakeWizardStore(
  options: CreateIntakeWizardStoreOptions = {}
) {
  const draftRepository = options.draftRepository ?? intakeDraftRepository;

  function persistDraft(session: IntakeSession, currentPhase: IntakePhase) {
    void draftRepository.saveActiveDraft(session, { currentPhase });
  }

  return createStore<IntakeWizardStore>()((set, get) => ({
    ...createInitialWizardState(),
    initializeWizard: async () => {
      const state = get();

      if (state.hasInitialized || state.isHydrating) {
        return;
      }

      set({ isHydrating: true });

      const result = await draftRepository.loadActiveDraft();

      if (result.status === 'ready') {
        set(
          createStateWithPersistence(
            createRestoredWizardState(
              result.session,
              result.meta?.currentPhase
            ),
            {
              hasInitialized: true,
              isHydrating: false,
              draftStatus: 'ready',
              draftRecoveryMessage: null,
            }
          )
        );
        return;
      }

      if (result.status === 'incompatible' || result.status === 'corrupt') {
        set(
          createStateWithPersistence(createInitialWizardSnapshot(), {
            hasInitialized: true,
            isHydrating: false,
            draftStatus: result.status,
            draftRecoveryMessage: getDraftRecoveryMessage(result),
          })
        );
        return;
      }

      set(
        createStateWithPersistence(createInitialWizardSnapshot(), {
          hasInitialized: true,
          isHydrating: false,
          draftStatus: result.status,
          draftRecoveryMessage: null,
        })
      );
    },
    saveAnswer: (rawValue) => {
      const state = get();

      if (!state.currentQuestionId) {
        return;
      }

      const nextSession = applyAnswerToSession(
        state.session,
        state.currentQuestionId,
        rawValue
      );

      set(
        createActiveDraftState(
          createWizardSnapshot({
            session: nextSession,
            currentPhase: state.currentPhase,
            currentQuestionId: state.currentQuestionId,
            history: state.history,
          })
        )
      );

      persistDraft(nextSession, state.currentPhase);
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
          createActiveDraftState(
            createWizardSnapshot({
              session: state.session,
              currentPhase: previousQuestion.phase,
              currentQuestionId: previousQuestion.questionId,
              history: state.history,
            })
          )
        );

        persistDraft(state.session, previousQuestion.phase);

        return;
      }

      const nextHistory = state.history.slice(0, -1);
      const previousQuestion = nextHistory[nextHistory.length - 1];

      if (!previousQuestion) {
        return;
      }

      set(
        createActiveDraftState(
          createWizardSnapshot({
            session: state.session,
            currentPhase: previousQuestion.phase,
            currentQuestionId: previousQuestion.questionId,
            history: nextHistory,
          })
        )
      );

      persistDraft(state.session, previousQuestion.phase);
    },
    goNext: () => {
      const state = get();

      if (!state.currentQuestion || !state.canGoNext) {
        return;
      }

      const nextSelection = getNextBestQuestion(
        state.session,
        state.currentPhase,
        state.askedQuestionIds
      );

      if (!nextSelection) {
        set(
          createActiveDraftState(
            createReviewWizardState(state.session, state.history)
          )
        );
        persistDraft(state.session, 'review');
        return;
      }

      set(
        createActiveDraftState(
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
          })
        )
      );

      persistDraft(state.session, nextSelection.phase);
    },
    saveAndExit: () => {
      const state = get();

      persistDraft(state.session, state.currentPhase);
    },
    resetWizard: async () => {
      await draftRepository.deleteActiveDraft();

      set(
        createStateWithPersistence(createInitialWizardSnapshot(), {
          hasInitialized: true,
          isHydrating: false,
          draftStatus: 'empty',
          draftRecoveryMessage: null,
        })
      );
    },
  }));
}

export const intakeWizardStore = createIntakeWizardStore();

export function useIntakeWizardStore<T>(
  selector: (state: IntakeWizardStore) => T
): T {
  return useStore(intakeWizardStore, selector);
}
