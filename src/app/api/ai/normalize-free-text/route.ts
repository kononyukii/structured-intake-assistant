import { FreeTextNormalizationRouteRequestSchema } from '../_shared/route-types';
import {
  type AiRouteDependencies,
  runAiRoute,
} from '../_shared/route-utils';

export async function handleFreeTextNormalizationRoute(
  request: Request,
  deps?: AiRouteDependencies,
) {
  return runAiRoute({
    request,
    requestSchema: FreeTextNormalizationRouteRequestSchema,
    execute: (provider, input) => provider.runFreeTextNormalization(input),
    deps,
  });
}

export async function POST(request: Request) {
  return handleFreeTextNormalizationRoute(request);
}
