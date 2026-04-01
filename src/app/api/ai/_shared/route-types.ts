import { z } from 'zod';

import { INTAKE_PHASES } from '@/features/intake/domain/intake-flow-engine';
import { IntakeSessionSchema } from '@/features/intake/domain/intake-session-schema';
import { DoctorSummarySchema } from '@/features/summary/domain/doctor-summary-schema';
import type {
  AiProviderMeta,
  ClarifyingQuestionOutput,
  FreeTextNormalizationOutput,
  SummaryRewriteOutput,
} from '@/shared/ai/ai-provider-types';

export const AI_ROUTE_FAILURE_REASONS = [
  'bad_request',
  'timeout',
  'invalid_json',
  'malformed_shape',
  'refused',
  'unsafe_response',
  'provider_unavailable',
  'internal_error',
] as const;

export type AiRouteFailureReason = (typeof AI_ROUTE_FAILURE_REASONS)[number];

export type AiRouteSuccessResponse<T> = {
  ok: true;
  data: T;
  meta?: AiProviderMeta;
};

export type AiRouteFailureResponse = {
  ok: false;
  reason: AiRouteFailureReason;
  error: string;
};

export const ClarifyingQuestionRouteRequestSchema = z
  .object({
    sessionSnapshot: IntakeSessionSchema,
    currentPhase: z.enum(INTAKE_PHASES),
    askedQuestionIds: z.array(z.string().min(1)),
  })
  .strict();

export type ClarifyingQuestionRouteRequest = z.infer<
  typeof ClarifyingQuestionRouteRequestSchema
>;

export type ClarifyingQuestionRouteResponse =
  | AiRouteFailureResponse
  | AiRouteSuccessResponse<ClarifyingQuestionOutput>;

export const FreeTextNormalizationRouteRequestSchema = z
  .object({
    rawText: z.string().trim().min(1),
    targetContext: z.string().trim().min(1).optional(),
  })
  .strict();

export type FreeTextNormalizationRouteRequest = z.infer<
  typeof FreeTextNormalizationRouteRequestSchema
>;

export type FreeTextNormalizationRouteResponse =
  | AiRouteFailureResponse
  | AiRouteSuccessResponse<FreeTextNormalizationOutput>;

export const SummaryRewriteRouteRequestSchema = z
  .object({
    deterministicSummary: DoctorSummarySchema,
    language: z.string().trim().min(1).optional(),
    style: z.literal('neutral').optional(),
  })
  .strict();

export type SummaryRewriteRouteRequest = z.infer<
  typeof SummaryRewriteRouteRequestSchema
>;

export type SummaryRewriteRouteResponse =
  | AiRouteFailureResponse
  | AiRouteSuccessResponse<SummaryRewriteOutput>;
