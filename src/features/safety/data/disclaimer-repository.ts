import { DisclaimerAcceptance } from '../domain/disclaimer';

const STORAGE_KEY = 'safety-disclaimer-status';

/**
 * Local-only repository for disclaimer status.
 */
export const disclaimerRepository = {
  getDisclaimerStatus(): DisclaimerAcceptance | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as DisclaimerAcceptance;
    } catch {
      return null;
    }
  },

  setDisclaimerStatus(accepted: boolean): void {
    if (typeof window === 'undefined') return;
    const acceptance: DisclaimerAcceptance = {
      accepted,
      acceptedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(acceptance));
  },
};
