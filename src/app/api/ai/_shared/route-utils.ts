import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { AiProvider } from '@/shared/ai/ai-provider';
import type {
  AiProviderFailureReason,
  AiProviderResult,
} from '@/shared/ai/ai-provider-types';
import { createAiProvider } from '@/shared/ai/create-ai-provider';

import type {
  AiRouteFailureResponse,
  AiRouteSuccessResponse,
} from './route-types';

const DEFAULT_AI_ROUTE_TIMEOUT_MS = 5_000;

const PROVIDER_FAILURE_STATUS: Record<AiProviderFailureReason, number> = {
  timeout: 504,
  invalid_json: 502,
  malformed_shape: 502,
  refused: 422,
  unsafe_response: 422,
  provider_unavailable: 503,
};

const PROVIDER_FAILURE_MESSAGES: Record<AiProviderFailureReason, string> = {
  timeout: 'AI request timed out.',
  invalid_json: 'AI response was not valid JSON.',
  malformed_shape: 'AI response did not match the expected shape.',
  refused: 'AI request was refused.',
  unsafe_response: 'AI response could not be used safely.',
  provider_unavailable: 'AI provider is currently unavailable.',
};

class AiRouteTimeoutError extends Error {
  constructor() {
    super('AI route timed out.');
    this.name = 'AiRouteTimeoutError';
  }
}

export type AiRouteDependencies = {
  createProvider?: () => AiProvider;
  timeoutMs?: number;
};

type ParseRouteBodyResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      response: NextResponse<AiRouteFailureResponse>;
    };

type RunAiRouteOptions<TInput, TOutput> = {
  request: Request;
  requestSchema: z.ZodType<TInput>;
  execute: (
    provider: AiProvider,
    input: TInput,
  ) => Promise<AiProviderResult<TOutput>>;
  deps?: AiRouteDependencies;
};

export async function runAiRoute<TInput, TOutput>(
  options: RunAiRouteOptions<TInput, TOutput>,
): Promise<
  NextResponse<AiRouteFailureResponse | AiRouteSuccessResponse<TOutput>>
> {
  const bodyResult = await parseRouteBody(
    options.request,
    options.requestSchema,
  );

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const createProvider = options.deps?.createProvider ?? createAiProvider;
  const timeoutMs = options.deps?.timeoutMs ?? DEFAULT_AI_ROUTE_TIMEOUT_MS;

  try {
    const providerResult = await withTimeout(
      options.execute(createProvider(), bodyResult.data),
      timeoutMs,
    );

    return mapAiProviderResult(providerResult);
  } catch (error) {
    if (error instanceof AiRouteTimeoutError) {
      return createFailureResponse(504, {
        ok: false,
        reason: 'timeout',
        error: 'AI request timed out.',
      });
    }

    return createFailureResponse(500, {
      ok: false,
      reason: 'internal_error',
      error: 'AI request could not be completed.',
    });
  }
}

async function parseRouteBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseRouteBodyResult<T>> {
  let parsedJson: unknown;

  try {
    parsedJson = await request.json();
  } catch {
    return {
      ok: false,
      response: createFailureResponse(400, {
        ok: false,
        reason: 'invalid_json',
        error: 'Request body must be valid JSON.',
      }),
    };
  }

  const parsedBody = schema.safeParse(parsedJson);

  if (!parsedBody.success) {
    return {
      ok: false,
      response: createFailureResponse(400, {
        ok: false,
        reason: 'bad_request',
        error: 'Request body did not match the expected shape.',
      }),
    };
  }

  return {
    ok: true,
    data: parsedBody.data,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new AiRouteTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function mapAiProviderResult<T>(
  result: AiProviderResult<T>,
): NextResponse<AiRouteFailureResponse | AiRouteSuccessResponse<T>> {
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      data: result.data,
      ...(result.meta === undefined ? {} : { meta: result.meta }),
    });
  }

  return createFailureResponse(PROVIDER_FAILURE_STATUS[result.reason], {
    ok: false,
    reason: result.reason,
    error: PROVIDER_FAILURE_MESSAGES[result.reason],
  });
}

function createFailureResponse(
  status: number,
  body: AiRouteFailureResponse,
): NextResponse<AiRouteFailureResponse> {
  return NextResponse.json(body, { status });
}
