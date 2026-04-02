import { type IntakeSession } from '@/features/intake/domain/intake-session-schema';
import { sanitizeDoctorSummary } from '@/features/safety/domain/output-safety';

import { buildDoctorSummary } from './build-doctor-summary';

export function prepareDoctorSummaryPreview(
  session: IntakeSession,
  options?: { language?: string; generatedAt?: string }
) {
  return sanitizeDoctorSummary(buildDoctorSummary(session, options));
}
