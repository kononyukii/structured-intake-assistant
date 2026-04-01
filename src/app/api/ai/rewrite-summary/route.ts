import { SummaryRewriteRouteRequestSchema } from '../_shared/route-types';
import {
  type AiRouteDependencies,
  runAiRoute,
} from '../_shared/route-utils';

export async function handleSummaryRewriteRoute(
  request: Request,
  deps?: AiRouteDependencies,
) {
  return runAiRoute({
    request,
    requestSchema: SummaryRewriteRouteRequestSchema,
    execute: (provider, input) => provider.runSummaryRewrite(input),
    deps,
  });
}

export async function POST(request: Request) {
  return handleSummaryRewriteRoute(request);
}
