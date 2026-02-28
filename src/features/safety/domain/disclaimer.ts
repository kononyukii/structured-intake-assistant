export type DisclaimerAcceptance = {
  accepted: boolean;
  acceptedAt?: string;
};

/**
 * Pure helper to check if the disclaimer has been accepted.
 */
export function isAccepted(acceptance: DisclaimerAcceptance | null): boolean {
  return !!acceptance?.accepted;
}
