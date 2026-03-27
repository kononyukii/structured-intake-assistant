import { describe, expect, it, vi } from 'vitest';

import {
  createEmptyIntakeSession,
  INTAKE_SESSION_SCHEMA_VERSION,
} from '@/features/intake/domain/intake-session-schema';

import { createIntakeDraftRepository } from './intake-draft-repository';

function createStorageHarness(initialRecord?: unknown) {
  let storedRecord = initialRecord;

  return {
    storage: {
      load: vi.fn(async () => storedRecord),
      save: vi.fn(async (record: unknown) => {
        storedRecord = record;
      }),
      delete: vi.fn(async () => {
        storedRecord = undefined;
      }),
    },
    readStoredRecord() {
      return storedRecord;
    },
  };
}

describe('intake-draft-repository', () => {
  it('saves a valid active draft with aligned metadata', async () => {
    const harness = createStorageHarness();
    const repository = createIntakeDraftRepository({
      storage: harness.storage,
    });
    const session = createEmptyIntakeSession();

    await repository.saveActiveDraft(session, {
      currentPhase: 'chief_complaint',
    });

    expect(harness.storage.save).toHaveBeenCalledOnce();
    expect(harness.readStoredRecord()).toMatchObject({
      session,
      meta: {
        currentPhase: 'chief_complaint',
        schemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
      },
    });
    expect(
      typeof (harness.readStoredRecord() as { meta: { savedAt: string } }).meta
        .savedAt
    ).toBe('string');
  });

  it('loads an existing valid draft', async () => {
    const session = createEmptyIntakeSession();
    const meta = {
      savedAt: new Date().toISOString(),
      currentPhase: 'symptom_details' as const,
      schemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
    };
    const harness = createStorageHarness({
      session,
      meta,
    });
    const repository = createIntakeDraftRepository({
      storage: harness.storage,
    });

    await expect(repository.loadActiveDraft()).resolves.toEqual({
      status: 'ready',
      session,
      meta,
    });
  });

  it('returns empty when no draft exists', async () => {
    const repository = createIntakeDraftRepository({
      storage: createStorageHarness().storage,
    });

    await expect(repository.loadActiveDraft()).resolves.toEqual({
      status: 'empty',
    });
  });

  it('handles an incompatible draft version safely', async () => {
    const session = {
      ...createEmptyIntakeSession(),
      schemaVersion: INTAKE_SESSION_SCHEMA_VERSION + 1,
    };
    const repository = createIntakeDraftRepository({
      storage: createStorageHarness({
        session,
        meta: {
          savedAt: new Date().toISOString(),
          schemaVersion: INTAKE_SESSION_SCHEMA_VERSION + 1,
        },
      }).storage,
    });

    await expect(repository.loadActiveDraft()).resolves.toEqual({
      status: 'incompatible',
      reason: 'The saved draft was created with an unsupported schema version.',
    });
  });

  it('handles a corrupt draft payload safely', async () => {
    const repository = createIntakeDraftRepository({
      storage: createStorageHarness({
        session: {
          schemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
        },
        meta: {
          savedAt: new Date().toISOString(),
          schemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
        },
      }).storage,
    });

    await expect(repository.loadActiveDraft()).resolves.toEqual({
      status: 'corrupt',
      reason: 'The saved draft on this device is not valid anymore.',
    });
  });

  it('deletes the active draft', async () => {
    const harness = createStorageHarness({
      session: createEmptyIntakeSession(),
      meta: {
        savedAt: new Date().toISOString(),
        schemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
      },
    });
    const repository = createIntakeDraftRepository({
      storage: harness.storage,
    });

    await repository.deleteActiveDraft();

    expect(harness.storage.delete).toHaveBeenCalledOnce();
    await expect(repository.loadActiveDraft()).resolves.toEqual({
      status: 'empty',
    });
  });
});
