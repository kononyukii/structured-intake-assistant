import { z } from 'zod';

import {
  INTAKE_PHASES,
  type IntakePhase,
} from '@/features/intake/domain/intake-flow-engine';
import {
  INTAKE_SESSION_SCHEMA_VERSION,
  type IntakeSession,
  IntakeSessionSchema,
} from '@/features/intake/domain/intake-session-schema';

const INTAKE_DRAFT_DATABASE_NAME = 'structured-intake-assistant-intake';
const INTAKE_DRAFT_DATABASE_VERSION = 1;
const INTAKE_DRAFT_OBJECT_STORE_NAME = 'drafts';
const ACTIVE_DRAFT_KEY = 'active';

const DraftMetaSchema = z
  .object({
    savedAt: z.string().datetime(),
    currentPhase: z.enum(INTAKE_PHASES).optional(),
    schemaVersion: z.number().int().positive().optional(),
  })
  .strict();

const StoredDraftRecordSchema = z
  .object({
    session: z.unknown(),
    meta: DraftMetaSchema.optional(),
  })
  .passthrough();

export type DraftMeta = z.infer<typeof DraftMetaSchema>;

export type LoadDraftResult =
  | { status: 'empty' }
  | { status: 'ready'; session: IntakeSession; meta?: DraftMeta }
  | { status: 'incompatible'; reason: string }
  | { status: 'corrupt'; reason: string };

export type IntakeDraftRepository = {
  loadActiveDraft(): Promise<LoadDraftResult>;
  saveActiveDraft(
    session: IntakeSession,
    meta?: Partial<DraftMeta>
  ): Promise<void>;
  deleteActiveDraft(): Promise<void>;
};

type IndexedDbDraftStorage = {
  load(): Promise<unknown>;
  save(record: { session: IntakeSession; meta: DraftMeta }): Promise<void>;
  delete(): Promise<void>;
};

type CreateIntakeDraftRepositoryOptions = {
  indexedDB?: IDBFactory | null;
  databaseName?: string;
  storage?: IndexedDbDraftStorage;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStoredSchemaVersion(
  session: unknown,
  meta?: DraftMeta
): number | undefined {
  if (typeof meta?.schemaVersion === 'number') {
    return meta.schemaVersion;
  }

  if (!isRecord(session) || typeof session.schemaVersion !== 'number') {
    return undefined;
  }

  return session.schemaVersion;
}

function createRequestPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function createTransactionPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

async function openDraftDatabase(
  indexedDBApi: IDBFactory,
  databaseName: string
): Promise<IDBDatabase> {
  const request = indexedDBApi.open(
    databaseName,
    INTAKE_DRAFT_DATABASE_VERSION
  );

  request.onupgradeneeded = () => {
    const database = request.result;

    if (!database.objectStoreNames.contains(INTAKE_DRAFT_OBJECT_STORE_NAME)) {
      database.createObjectStore(INTAKE_DRAFT_OBJECT_STORE_NAME);
    }
  };

  return createRequestPromise(request);
}

function createIndexedDbDraftStorage(options: {
  indexedDB?: IDBFactory | null;
  databaseName?: string;
}): IndexedDbDraftStorage {
  const indexedDBApi = options.indexedDB ?? globalThis.indexedDB;
  const databaseName = options.databaseName ?? INTAKE_DRAFT_DATABASE_NAME;

  async function withDatabase<T>(
    callback: (database: IDBDatabase) => Promise<T>
  ): Promise<T | undefined> {
    if (!indexedDBApi) {
      return undefined;
    }

    const database = await openDraftDatabase(indexedDBApi, databaseName);

    try {
      return await callback(database);
    } finally {
      database.close();
    }
  }

  return {
    async load() {
      const result = await withDatabase(async (database) => {
        const transaction = database.transaction(
          INTAKE_DRAFT_OBJECT_STORE_NAME,
          'readonly'
        );

        return createRequestPromise(
          transaction
            .objectStore(INTAKE_DRAFT_OBJECT_STORE_NAME)
            .get(ACTIVE_DRAFT_KEY)
        );
      });

      return result;
    },
    async save(record) {
      await withDatabase(async (database) => {
        const transaction = database.transaction(
          INTAKE_DRAFT_OBJECT_STORE_NAME,
          'readwrite'
        );

        transaction
          .objectStore(INTAKE_DRAFT_OBJECT_STORE_NAME)
          .put(record, ACTIVE_DRAFT_KEY);

        await createTransactionPromise(transaction);
      });
    },
    async delete() {
      await withDatabase(async (database) => {
        const transaction = database.transaction(
          INTAKE_DRAFT_OBJECT_STORE_NAME,
          'readwrite'
        );

        transaction
          .objectStore(INTAKE_DRAFT_OBJECT_STORE_NAME)
          .delete(ACTIVE_DRAFT_KEY);

        await createTransactionPromise(transaction);
      });
    },
  };
}

function normalizeDraftMeta(
  session: IntakeSession,
  meta?: Partial<DraftMeta>
): DraftMeta {
  return DraftMetaSchema.parse({
    savedAt: meta?.savedAt ?? new Date().toISOString(),
    currentPhase: meta?.currentPhase,
    schemaVersion: session.schemaVersion,
  });
}

export function createIntakeDraftRepository(
  options: CreateIntakeDraftRepositoryOptions = {}
): IntakeDraftRepository {
  const storage =
    options.storage ??
    createIndexedDbDraftStorage({
      indexedDB: options.indexedDB,
      databaseName: options.databaseName,
    });

  return {
    async loadActiveDraft() {
      let storedRecord: unknown;

      try {
        storedRecord = await storage.load();
      } catch {
        return {
          status: 'corrupt',
          reason: 'The saved draft on this device could not be read.',
        };
      }

      if (storedRecord === undefined) {
        return { status: 'empty' };
      }

      const parsedRecord = StoredDraftRecordSchema.safeParse(storedRecord);

      if (!parsedRecord.success) {
        return {
          status: 'corrupt',
          reason: 'The saved draft on this device is not in a usable format.',
        };
      }

      const { session: rawSession } = parsedRecord.data;
      const rawMeta = parsedRecord.data.meta;
      const storedSchemaVersion = getStoredSchemaVersion(rawSession, rawMeta);

      if (
        storedSchemaVersion !== undefined &&
        storedSchemaVersion !== INTAKE_SESSION_SCHEMA_VERSION
      ) {
        return {
          status: 'incompatible',
          reason:
            'The saved draft was created with an unsupported schema version.',
        };
      }

      const parsedSession = IntakeSessionSchema.safeParse(rawSession);

      if (!parsedSession.success) {
        return {
          status: 'corrupt',
          reason: 'The saved draft on this device is not valid anymore.',
        };
      }

      return {
        status: 'ready',
        session: parsedSession.data,
        meta: rawMeta,
      };
    },
    async saveActiveDraft(session, meta) {
      try {
        await storage.save({
          session,
          meta: normalizeDraftMeta(session, meta),
        });
      } catch {
        return;
      }
    },
    async deleteActiveDraft() {
      try {
        await storage.delete();
      } catch {
        return;
      }
    },
  };
}

export const intakeDraftRepository = createIntakeDraftRepository();
