import 'server-only';

import type { CreateAiProviderConfig } from './create-ai-provider';

function normalizeOptionalString(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function getAiProviderConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CreateAiProviderConfig {
  const providerKind = normalizeOptionalString(env.AI_PROVIDER);

  if (providerKind === 'gemini') {
    return {
      kind: 'gemini',
      model: normalizeOptionalString(env.AI_MODEL),
      apiKey: normalizeOptionalString(env.GEMINI_API_KEY),
    };
  }

  if (providerKind === 'mock') {
    return {
      kind: 'mock',
    };
  }

  return {
    kind: 'mock',
  };
}
