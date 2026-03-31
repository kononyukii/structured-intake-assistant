import type {
  AiOperationType as DomainAiOperationType,
  ClarifyingQuestionGenerationOutput as DomainClarifyingQuestionOutput,
  FreeTextNormalizationOutput as DomainFreeTextNormalizationOutput,
  SummaryRewriteOutput as DomainSummaryRewriteOutput,
} from '@/features/intake/domain/ai-json-contracts';
import type { IntakePhase } from '@/features/intake/domain/intake-flow-engine';
import type { IntakeSession } from '@/features/intake/domain/intake-session-schema';
import type { DoctorSummary } from '@/features/summary/domain/doctor-summary-schema';

export type AiOperationType = DomainAiOperationType;
export type ClarifyingQuestionOutput = DomainClarifyingQuestionOutput;
export type FreeTextNormalizationOutput = DomainFreeTextNormalizationOutput;
export type SummaryRewriteOutput = DomainSummaryRewriteOutput;

export type AiProviderFailureReason =
  | 'timeout'
  | 'invalid_json'
  | 'malformed_shape'
  | 'refused'
  | 'unsafe_response'
  | 'provider_unavailable';

export type AiProviderMeta = {
  provider: string;
  model?: string;
  operation: AiOperationType;
  durationMs?: number;
};

export type AiProviderResult<T> =
  | {
      ok: true;
      data: T;
      meta?: AiProviderMeta;
    }
  | {
      ok: false;
      reason: AiProviderFailureReason;
      fallback: T | null;
      error: string;
      meta?: AiProviderMeta;
    };

export type ClarifyingQuestionProviderInput = {
  sessionSnapshot: IntakeSession;
  currentPhase: IntakePhase;
  askedQuestionIds: readonly string[];
};

export type FreeTextNormalizationProviderInput = {
  rawText: string;
  targetContext?: string;
};

export type SummaryRewriteProviderInput = {
  deterministicSummary: DoctorSummary;
  language?: string;
  style?: 'neutral';
};
