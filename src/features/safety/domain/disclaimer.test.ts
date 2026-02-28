import { describe, expect, it } from 'vitest';

import { type DisclaimerAcceptance,isAccepted } from './disclaimer';

describe('isAccepted', () => {
  it('should return true if accepted is true', () => {
    const acceptance: DisclaimerAcceptance = {
      accepted: true,
      acceptedAt: '2023-01-01',
    };
    expect(isAccepted(acceptance)).toBe(true);
  });

  it('should return false if accepted is false', () => {
    const acceptance: DisclaimerAcceptance = { accepted: false };
    expect(isAccepted(acceptance)).toBe(false);
  });

  it('should return false if acceptance is null', () => {
    expect(isAccepted(null)).toBe(false);
  });
});
