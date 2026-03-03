import { describe, expect, it } from 'vitest';

import {
  detectUnsupportedContext,
  isEmergency,
  isPregnancyRelated,
  isUnderage,
  type Session,
} from './scope-gate';

describe('isUnderage', () => {
  it('returns true for ages below 18', () => {
    expect(isUnderage(17)).toBe(true);
  });

  it('returns false for 18 and above', () => {
    expect(isUnderage(18)).toBe(false);
    expect(isUnderage(42)).toBe(false);
  });
});

describe('isPregnancyRelated', () => {
  it('returns true when pregnancy-related context is explicitly set', () => {
    expect(
      isPregnancyRelated({
        answers: { pregnancyRelated: true },
      })
    ).toBe(true);
  });

  it('returns false when pregnancy-related context is not set', () => {
    expect(
      isPregnancyRelated({
        answers: { pregnancyRelated: false },
      })
    ).toBe(false);
  });
});

describe('isEmergency', () => {
  it('returns true when emergency is self-reported', () => {
    expect(
      isEmergency({
        answers: { emergency: true },
      })
    ).toBe(true);
    expect(
      isEmergency({
        answers: { urgent: true },
      })
    ).toBe(true);
  });

  it('returns true when emergency-like keywords appear in context text', () => {
    expect(
      isEmergency({
        answers: { contextText: 'This feels urgent to me' },
      })
    ).toBe(true);
  });

  it('returns false when no emergency signal is present', () => {
    expect(
      isEmergency({
        answers: { emergency: false, urgent: false, contextText: 'I have had a cough for a week' },
      })
    ).toBe(false);
  });

  it('returns false for explicit negation keywords', () => {
    expect(
      isEmergency({
        answers: { contextText: 'This is not an urgent issue.' },
      })
    ).toBe(false);
  });
});

describe('detectUnsupportedContext', () => {
  it('returns all matched unsupported reasons in stable order', () => {
    const session: Session = {
      age: 16,
      answers: {
        pregnancyRelated: true,
        emergency: true,
      },
    };

    expect(detectUnsupportedContext(session)).toEqual(['underage', 'pregnancy', 'emergency']);
  });

  it('returns an empty list for supported context', () => {
    const session: Session = {
      age: 28,
      answers: {
        pregnancyRelated: false,
        emergency: false,
        urgent: false,
        contextText: 'Routine primary care visit preparation',
      },
    };

    expect(detectUnsupportedContext(session)).toEqual([]);
  });
});
