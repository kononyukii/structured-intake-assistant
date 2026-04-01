import type { AiProvider } from './ai-provider';
import { GeminiAiProvider } from './gemini-ai-provider';
import {
  MockAiProvider,
  type MockAiProviderMode,
} from './mock-ai-provider';

export type CreateAiProviderConfig = {
  kind?: 'mock' | 'gemini';
  mode?: MockAiProviderMode;
  model?: string;
  apiKey?: string;
};

export function createAiProvider(
  config: CreateAiProviderConfig = {},
): AiProvider {
  if (config.kind === 'gemini') {
    return new GeminiAiProvider({
      apiKey: config.apiKey,
      model: config.model,
    });
  }

  return new MockAiProvider({
    mode: config.mode,
    model: config.model,
  });
}
