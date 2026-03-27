import { describe, expect, it, vi } from 'vitest';

import { createEmptyIntakeSession } from '@/features/intake/domain/intake-session-schema';

import {
  type IntakeDraftRepository,
  type LoadDraftResult,
} from './intake-draft-repository';
import { createIntakeWizardStore } from './intake-wizard-store';

function createDraftRepositoryMock() {
  return {
    loadActiveDraft: vi.fn<IntakeDraftRepository['loadActiveDraft']>(
      async (): Promise<LoadDraftResult> => ({ status: 'empty' })
    ),
    saveActiveDraft: vi.fn<IntakeDraftRepository['saveActiveDraft']>(
      async () => undefined
    ),
    deleteActiveDraft: vi.fn<IntakeDraftRepository['deleteActiveDraft']>(
      async () => undefined
    ),
  };
}

describe('intake-wizard-store', () => {
  it('initializes with an empty session and the first deterministic question', () => {
    const store = createIntakeWizardStore();
    const state = store.getState();

    expect(state.session.chiefComplaint.summary).toEqual({
      kind: 'not_assessed',
    });
    expect(state.currentPhase).toBe('chief_complaint');
    expect(state.currentQuestion?.id).toBe('chief_complaint_summary');
    expect(state.currentPhaseIndex).toBe(1);
    expect(state.totalPhaseCount).toBe(8);
  });

  it('saves the current answer into the matching session field', () => {
    const store = createIntakeWizardStore();

    store.getState().saveAnswer('Persistent cough');

    expect(store.getState().session.chiefComplaint.summary).toEqual({
      kind: 'value',
      value: 'Persistent cough',
    });
    expect(store.getState().canGoNext).toBe(true);
  });

  it('advances to the next deterministic question after saving an answer', () => {
    const store = createIntakeWizardStore();

    store.getState().saveAnswer('Persistent cough');
    store.getState().goNext();

    expect(store.getState().currentPhase).toBe('symptom_details');
    expect(store.getState().currentQuestion?.id).toBe('symptom_location');
    expect(store.getState().currentPhaseIndex).toBe(2);
  });

  it('returns to the prior asked question and restores its draft value', () => {
    const store = createIntakeWizardStore();

    store.getState().saveAnswer('Persistent cough');
    store.getState().goNext();
    store.getState().saveAnswer('Chest');
    store.getState().goNext();
    store.getState().goBack();

    expect(store.getState().currentQuestion?.id).toBe('symptom_location');
    expect(store.getState().draftCurrentInput).toBe('Chest');
    expect(store.getState().askedQuestionIds).toEqual([
      'chief_complaint_summary',
      'symptom_location',
    ]);
  });

  it('keeps the current draft state available on save and exit', () => {
    const draftRepository = createDraftRepositoryMock();
    const store = createIntakeWizardStore({ draftRepository });

    store.getState().saveAnswer('Persistent cough');
    store.getState().saveAndExit();

    expect(store.getState().session.chiefComplaint.summary).toEqual({
      kind: 'value',
      value: 'Persistent cough',
    });
    expect(draftRepository.saveActiveDraft).toHaveBeenLastCalledWith(
      store.getState().session,
      { currentPhase: 'chief_complaint' }
    );
  });

  it('keeps progress tied to the active phase rather than the number of questions answered', () => {
    const store = createIntakeWizardStore();

    store.getState().saveAnswer('Persistent cough');
    store.getState().goNext();
    store.getState().saveAnswer('Chest');
    store.getState().goNext();

    expect(store.getState().currentQuestion?.id).toBe('symptom_severity');
    expect(store.getState().currentPhase).toBe('symptom_details');
    expect(store.getState().currentPhaseIndex).toBe(2);
    expect(store.getState().totalPhaseCount).toBe(8);
  });

  it('restores a persisted session and resumes the saved phase on initialize', async () => {
    const restoredSession = createEmptyIntakeSession();
    restoredSession.chiefComplaint.summary = {
      kind: 'value',
      value: 'Persistent cough',
    };
    restoredSession.updatedAt = new Date().toISOString();
    const draftRepository = createDraftRepositoryMock();
    draftRepository.loadActiveDraft.mockResolvedValue({
      status: 'ready',
      session: restoredSession,
      meta: {
        savedAt: restoredSession.updatedAt,
        currentPhase: 'symptom_details',
        schemaVersion: restoredSession.schemaVersion,
      },
    });
    const store = createIntakeWizardStore({ draftRepository });

    await store.getState().initializeWizard();

    expect(store.getState().session.chiefComplaint.summary).toEqual({
      kind: 'value',
      value: 'Persistent cough',
    });
    expect(store.getState().currentPhase).toBe('symptom_details');
    expect(store.getState().currentQuestion?.id).toBe('symptom_location');
    expect(store.getState().hasInitialized).toBe(true);
  });

  it('deletes the persisted draft and resets the wizard state', async () => {
    const draftRepository = createDraftRepositoryMock();
    const store = createIntakeWizardStore({ draftRepository });

    store.getState().saveAnswer('Persistent cough');
    await store.getState().resetWizard();

    expect(draftRepository.deleteActiveDraft).toHaveBeenCalledOnce();
    expect(store.getState().session.chiefComplaint.summary).toEqual({
      kind: 'not_assessed',
    });
    expect(store.getState().currentQuestion?.id).toBe(
      'chief_complaint_summary'
    );
    expect(store.getState().draftRecoveryMessage).toBeNull();
  });

  it('exposes a recoverable message when the saved draft is incompatible', async () => {
    const draftRepository = createDraftRepositoryMock();
    draftRepository.loadActiveDraft.mockResolvedValue({
      status: 'incompatible',
      reason: 'The saved draft was created with an unsupported schema version.',
    });
    const store = createIntakeWizardStore({ draftRepository });

    await store.getState().initializeWizard();

    expect(store.getState().draftStatus).toBe('incompatible');
    expect(store.getState().draftRecoveryMessage).toBe(
      'A saved draft from an older version could not be resumed. Start fresh to continue.'
    );
    expect(store.getState().currentQuestion?.id).toBe(
      'chief_complaint_summary'
    );
  });
});
