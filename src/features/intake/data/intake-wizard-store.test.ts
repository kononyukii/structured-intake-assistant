import { describe, expect, it } from 'vitest';

import { createIntakeWizardStore } from './intake-wizard-store';

describe('intake-wizard-store', () => {
  it('initializes with an empty session and the first deterministic question', () => {
    const store = createIntakeWizardStore();
    const state = store.getState();

    expect(state.session.chiefComplaint.summary).toEqual({ kind: 'not_assessed' });
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

  it('resets the in-memory wizard state on save and exit', () => {
    const store = createIntakeWizardStore();

    store.getState().saveAnswer('Persistent cough');
    store.getState().saveAndExit();

    expect(store.getState().session.chiefComplaint.summary).toEqual({
      kind: 'not_assessed',
    });
    expect(store.getState().currentQuestion?.id).toBe('chief_complaint_summary');
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
});
