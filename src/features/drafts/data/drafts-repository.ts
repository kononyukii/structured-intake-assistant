/**
 * Local-only repository for intake drafts.
 */
export const draftsRepository = {
  /**
   * Checks if there are any existing drafts in local storage.
   * Returns true if at least one draft exists, false otherwise.
   */
  hasAnyDrafts(): boolean {
    if (typeof window === 'undefined') return false;

    // Search for any existing drafts in localStorage.
    // For now, we check for a hypothetical 'intake-drafts' key.
    // In a future PR, this will be more robust.
    const drafts = localStorage.getItem('intake-drafts');
    if (!drafts) return false;

    try {
      const parsed = JSON.parse(drafts);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  },
};
