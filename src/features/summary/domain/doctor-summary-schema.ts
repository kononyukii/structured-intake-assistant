import { z } from 'zod';

export const SUMMARY_SCHEMA_VERSION = 1 as const;

const SummaryModeSchema = z.enum(['deterministic', 'ai_assisted']);
const FactStateSchema = z.enum(['present', 'denied', 'unknown', 'not_assessed']);

const SummaryTextFieldSchema = z
  .object({
    state: FactStateSchema,
    detail: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((field, ctx) => {
    if (field.state === 'present' && field.detail === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'detail is required when state is present',
        path: ['detail'],
      });
    }
  });

const FactItemSchema = z
  .object({
    label: z.string().min(1),
    state: FactStateSchema,
    detail: z.string().min(1).optional(),
  })
  .strict();

const SummaryListItemSchema = z
  .object({
    label: z.string().min(1),
    detail: z.string().min(1).optional(),
  })
  .strict();

const QuestionForDoctorSchema = z
  .object({
    question: z.string().min(1),
    detail: z.string().min(1).optional(),
  })
  .strict();

function createCollectionSectionSchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z
    .object({
      state: FactStateSchema,
      items: z.array(itemSchema),
    })
    .strict()
    .superRefine((section, ctx) => {
      if (section.state === 'present' && section.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'items are required when state is present',
          path: ['items'],
        });
      }
    });
}

export const DoctorSummarySchema = z
  .object({
    schemaVersion: z.literal(SUMMARY_SCHEMA_VERSION),
    generatedAt: z.string().datetime(),
    sourceSessionId: z.string().min(1),
    mode: SummaryModeSchema,
    language: z.string().min(1).optional(),
    header: z
      .object({
        title: z.string().min(1),
        disclaimer: z.string().min(1),
      })
      .strict(),
    complaint: z
      .object({
        headline: z.string().min(1).optional(),
        detail: z.string().min(1).optional(),
      })
      .strict(),
    timeline: z
      .object({
        onset: SummaryTextFieldSchema,
        duration: SummaryTextFieldSchema,
        course: SummaryTextFieldSchema,
      })
      .strict(),
    symptomFacts: z
      .object({
        associatedSymptoms: z.array(FactItemSchema),
        systemicSymptoms: z.array(FactItemSchema),
        redFlags: z.array(FactItemSchema),
      })
      .strict(),
    history: z
      .object({
        relevantConditions: createCollectionSectionSchema(SummaryListItemSchema),
        surgeries: createCollectionSectionSchema(SummaryListItemSchema),
        familyHistory: createCollectionSectionSchema(SummaryListItemSchema),
      })
      .strict(),
    medications: createCollectionSectionSchema(SummaryListItemSchema),
    allergiesIntolerances: createCollectionSectionSchema(SummaryListItemSchema),
    questionsForDoctor: z.array(QuestionForDoctorSchema),
    notes: z.string().min(1).optional(),
  })
  .strict();

export type DoctorSummary = z.infer<typeof DoctorSummarySchema>;

function createNotAssessedTextField() {
  return { state: 'not_assessed' } as const;
}

function createNotAssessedCollectionSection<TItem>() {
  return {
    state: 'not_assessed',
    items: [] as TItem[],
  } as const;
}

function createSourceSessionId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto);
  }

  return `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyDoctorSummary(params?: {
  sourceSessionId?: string;
  mode?: 'deterministic' | 'ai_assisted';
}): DoctorSummary {
  return DoctorSummarySchema.parse({
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSessionId: params?.sourceSessionId ?? createSourceSessionId(),
    mode: params?.mode ?? 'deterministic',
    header: {
      title: 'Doctor Summary',
      disclaimer:
        'Patient-reported summary to support discussion with a clinician. It does not provide diagnosis, treatment recommendations, or urgency advice.',
    },
    complaint: {},
    timeline: {
      onset: createNotAssessedTextField(),
      duration: createNotAssessedTextField(),
      course: createNotAssessedTextField(),
    },
    symptomFacts: {
      associatedSymptoms: [],
      systemicSymptoms: [],
      redFlags: [],
    },
    history: {
      relevantConditions: createNotAssessedCollectionSection(),
      surgeries: createNotAssessedCollectionSection(),
      familyHistory: createNotAssessedCollectionSection(),
    },
    medications: createNotAssessedCollectionSection(),
    allergiesIntolerances: createNotAssessedCollectionSection(),
    questionsForDoctor: [],
  });
}

type ParseDoctorSummaryResult =
  | { success: true; data: DoctorSummary }
  | { success: false; error: string };

export function parseDoctorSummary(input: unknown): ParseDoctorSummaryResult {
  const result = DoctorSummarySchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: result.error.issues.map((issue) => issue.message).join('; '),
  };
}
