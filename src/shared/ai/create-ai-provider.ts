import type { AiProvider } from './ai-provider';
import {
  MockAiProvider,
  type MockAiProviderMode,
} from './mock-ai-provider';

export type CreateAiProviderConfig = {
  kind?: 'mock';
  mode?: MockAiProviderMode;
  model?: string;
};

export function createAiProvider(
  config: CreateAiProviderConfig = {},
): AiProvider {
  return new MockAiProvider({
    mode: config.mode,
    model: config.model,
  });
}
