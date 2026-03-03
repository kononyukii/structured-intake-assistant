const STORAGE_KEY = 'scope-gate-passed';

/**
 * Session-local repository for scope gate pass status.
 */
export const scopeGateRepository = {
  getScopeGateStatus(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  },

  setScopeGateStatus(passed: boolean): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, String(passed));
  },

  clearScopeGateStatus(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
  },
};
