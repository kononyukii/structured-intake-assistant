import { ClarifyingQuestionRouteRequestSchema } from '../_shared/route-types';
import {
  type AiRouteDependencies,
  runAiRoute,
} from '../_shared/route-utils';

export async function handleClarifyingQuestionRoute(
  request: Request,
  deps?: AiRouteDependencies,
) {
  return runAiRoute({
    request,
    requestSchema: ClarifyingQuestionRouteRequestSchema,
    execute: (provider, input) => provider.runClarifyingQuestion(input),
    deps,
  });
}

export async function POST(request: Request) {
  return handleClarifyingQuestionRoute(request);
}
