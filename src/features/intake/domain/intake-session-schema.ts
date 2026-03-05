import { z } from 'zod';

export const INTAKE_SESSION_SCHEMA_VERSION = 1 as const;

const BooleanFactStateSchema = z.enum(['yes', 'no', 'unknown', 'not_assessed']);

const TextFieldSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('value'),
      value: z.string().min(1),
    })
    .strict(),
  z.object({ kind: z.literal('denied') }).strict(),
  z.object({ kind: z.literal('unknown') }).strict(),
  z.object({ kind: z.literal('not_assessed') }).strict(),
]);

const DateFieldSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('value'),
      value: z.string().date(),
    })
    .strict(),
  z.object({ kind: z.literal('denied') }).strict(),
  z.object({ kind: z.literal('unknown') }).strict(),
  z.object({ kind: z.literal('not_assessed') }).strict(),
]);

function createCollectionFieldSchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z.discriminatedUnion('kind', [
    z
      .object({
        kind: z.literal('value'),
        value: z.array(itemSchema),
      })
      .strict(),
    z.object({ kind: z.literal('denied') }).strict(),
    z.object({ kind: z.literal('unknown') }).strict(),
    z.object({ kind: z.literal('not_assessed') }).strict(),
  ]);
}

const MedicationSchema = z
  .object({
    name: z.string().min(1),
    details: TextFieldSchema,
  })
  .strict();

const AllergyIntoleranceSchema = z
  .object({
    substance: z.string().min(1),
    reaction: TextFieldSchema,
  })
  .strict();

export const IntakeSessionSchema = z
  .object({
    schemaVersion: z.literal(INTAKE_SESSION_SCHEMA_VERSION),
    id: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    chiefComplaint: z
      .object({
        summary: TextFieldSchema,
      })
      .strict(),
    symptomDimensions: z
      .object({
        location: TextFieldSchema,
        severity: TextFieldSchema,
        quality: TextFieldSchema,
      })
      .strict(),
    timeline: z
      .object({
        onset: DateFieldSchema,
        duration: TextFieldSchema,
        course: TextFieldSchema,
      })
      .strict(),
    associatedSymptoms: z.record(z.string(), BooleanFactStateSchema),
    systemicSymptoms: z.record(z.string(), BooleanFactStateSchema),
    history: z
      .object({
        relevantConditions: TextFieldSchema,
        surgeries: TextFieldSchema,
        familyHistory: TextFieldSchema,
      })
      .strict(),
    medications: createCollectionFieldSchema(MedicationSchema),
    allergiesIntolerances: createCollectionFieldSchema(AllergyIntoleranceSchema),
    redFlags: z.record(z.string(), BooleanFactStateSchema),
  })
  .strict();

export type IntakeSession = z.infer<typeof IntakeSessionSchema>;

function createNotAssessedTextField() {
  return { kind: 'not_assessed' } as const;
}

function createNotAssessedDateField() {
  return { kind: 'not_assessed' } as const;
}

function createNotAssessedCollectionField() {
  return { kind: 'not_assessed' } as const;
}

function createSessionId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto);
  }

  return `intake_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyIntakeSession(): IntakeSession {
  const now = new Date().toISOString();

  return IntakeSessionSchema.parse({
    schemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
    id: createSessionId(),
    createdAt: now,
    updatedAt: now,
    chiefComplaint: {
      summary: createNotAssessedTextField(),
    },
    symptomDimensions: {
      location: createNotAssessedTextField(),
      severity: createNotAssessedTextField(),
      quality: createNotAssessedTextField(),
    },
    timeline: {
      onset: createNotAssessedDateField(),
      duration: createNotAssessedTextField(),
      course: createNotAssessedTextField(),
    },
    associatedSymptoms: {},
    systemicSymptoms: {},
    history: {
      relevantConditions: createNotAssessedTextField(),
      surgeries: createNotAssessedTextField(),
      familyHistory: createNotAssessedTextField(),
    },
    medications: createNotAssessedCollectionField(),
    allergiesIntolerances: createNotAssessedCollectionField(),
    redFlags: {},
  });
}
