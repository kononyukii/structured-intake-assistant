import { type IntakeSession } from '@/features/intake/domain/intake-session-schema';

import {
  createEmptyDoctorSummary,
  type DoctorSummary,
  DoctorSummarySchema,
} from './doctor-summary-schema';

type IntakeTextField = IntakeSession['chiefComplaint']['summary'];
type IntakeDateField = IntakeSession['timeline']['onset'];
type BooleanFactState = IntakeSession['redFlags'][string];
type FactRecord = Record<string, BooleanFactState>;
type SummaryTextField = DoctorSummary['timeline']['onset'];
type FactItem = DoctorSummary['symptomFacts']['associatedSymptoms'][number];
type SummaryListItem = DoctorSummary['medications']['items'][number];
type CollectionSection = DoctorSummary['medications'];
type QuestionForDoctor = DoctorSummary['questionsForDoctor'][number];
type CollectionField<TItem> =
  | { kind: 'value'; value: TItem[] }
  | { kind: 'denied' }
  | { kind: 'unknown' }
  | { kind: 'not_assessed' };

const SUMMARY_TITLE = 'Doctor Summary';
const SUMMARY_DISCLAIMER =
  'Patient-reported summary prepared to support discussion with a clinician.';

export function buildDoctorSummary(
  session: IntakeSession,
  options?: { language?: string; generatedAt?: string },
): DoctorSummary {
  const baseSummary = createEmptyDoctorSummary({
    sourceSessionId: session.id,
    mode: 'deterministic',
  });
  const complaint = buildComplaint(session);

  return DoctorSummarySchema.parse({
    ...baseSummary,
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    ...(options?.language ? { language: options.language } : {}),
    header: {
      title: SUMMARY_TITLE,
      disclaimer: SUMMARY_DISCLAIMER,
    },
    complaint,
    timeline: {
      onset: mapDateFieldToSummaryTextField(session.timeline.onset),
      duration: mapTextFieldToSummaryTextField(session.timeline.duration),
      course: mapTextFieldToSummaryTextField(session.timeline.course),
    },
    symptomFacts: {
      associatedSymptoms: mapBooleanFactRecordToFactItems(session.associatedSymptoms),
      systemicSymptoms: mapBooleanFactRecordToFactItems(session.systemicSymptoms),
      redFlags: mapBooleanFactRecordToFactItems(session.redFlags),
    },
    history: {
      relevantConditions: mapTextFieldToCollectionSection(session.history.relevantConditions),
      surgeries: mapTextFieldToCollectionSection(session.history.surgeries),
      familyHistory: mapTextFieldToCollectionSection(session.history.familyHistory),
    },
    medications: mapCollectionFieldToSummarySection(session.medications, (medication) => ({
      label: medication.name,
      ...toOptionalDetailProperty(medication.details),
    })),
    allergiesIntolerances: mapCollectionFieldToSummarySection(
      session.allergiesIntolerances,
      (allergy) => ({
        label: allergy.substance,
        ...toOptionalDetailProperty(allergy.reaction),
      }),
    ),
    questionsForDoctor: buildQuestionsForDoctor(session),
  });
}

function buildComplaint(session: IntakeSession): DoctorSummary['complaint'] {
  if (session.chiefComplaint.summary.kind !== 'value') {
    return {};
  }

  const detailParts = [
    createComplaintDetailPart('Location', session.symptomDimensions.location),
    createComplaintDetailPart('Severity', session.symptomDimensions.severity),
    createComplaintDetailPart('Quality', session.symptomDimensions.quality),
  ].filter((value): value is string => value !== undefined);

  return {
    headline: session.chiefComplaint.summary.value,
    ...(detailParts.length > 0 ? { detail: detailParts.join('; ') } : {}),
  };
}

function createComplaintDetailPart(label: string, field: IntakeTextField): string | undefined {
  if (field.kind !== 'value') {
    return undefined;
  }

  return `${label}: ${field.value}`;
}

function mapTextFieldToSummaryTextField(field: IntakeTextField): SummaryTextField {
  if (field.kind === 'value') {
    return {
      state: 'present',
      detail: field.value,
    };
  }

  return {
    state: mapFieldKindToState(field.kind),
  };
}

function mapDateFieldToSummaryTextField(field: IntakeDateField): SummaryTextField {
  if (field.kind === 'value') {
    return {
      state: 'present',
      detail: field.value,
    };
  }

  return {
    state: mapFieldKindToState(field.kind),
  };
}

function mapTextFieldToCollectionSection(field: IntakeTextField): CollectionSection {
  if (field.kind === 'value') {
    return {
      state: 'present',
      items: [{ label: field.value }],
    };
  }

  return {
    state: mapFieldKindToState(field.kind),
    items: [],
  };
}

function mapCollectionFieldToSummarySection<TItem>(
  field: CollectionField<TItem>,
  mapItem: (item: TItem) => SummaryListItem,
): CollectionSection {
  if (field.kind === 'value') {
    const items = field.value.map(mapItem);

    if (items.length === 0) {
      return {
        state: 'not_assessed',
        items: [],
      };
    }

    return {
      state: 'present',
      items,
    };
  }

  return {
    state: mapFieldKindToState(field.kind),
    items: [],
  };
}

function mapBooleanFactRecordToFactItems(record: FactRecord): FactItem[] {
  return Object.keys(record)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => ({
      label: formatFactLabel(key),
      state: mapBooleanFactState(record[key]),
    }));
}

function buildQuestionsForDoctor(session: IntakeSession): QuestionForDoctor[] {
  const questions: QuestionForDoctor[] = [];

  if (isUnresolvedField(session.chiefComplaint.summary.kind)) {
    questions.push({
      question: "Clarify main concern for today's visit",
    });
  }

  addQuestion(
    questions,
    'Clarify symptom details',
    collectUnresolvedLabels([
      ['Location', session.symptomDimensions.location.kind],
      ['Severity', session.symptomDimensions.severity.kind],
      ['Quality', session.symptomDimensions.quality.kind],
    ]),
  );

  if (isUnresolvedField(session.timeline.onset.kind)) {
    questions.push({ question: 'Clarify symptom onset' });
  }

  if (isUnresolvedField(session.timeline.duration.kind)) {
    questions.push({ question: 'Clarify duration of symptoms' });
  }

  if (isUnresolvedField(session.timeline.course.kind)) {
    questions.push({ question: 'Clarify symptom course' });
  }

  if (isUnresolvedField(session.history.relevantConditions.kind)) {
    questions.push({ question: 'Clarify relevant medical conditions' });
  }

  if (isUnresolvedField(session.history.surgeries.kind)) {
    questions.push({ question: 'Clarify past surgeries' });
  }

  if (isUnresolvedField(session.history.familyHistory.kind)) {
    questions.push({ question: 'Clarify family history' });
  }

  addCollectionQuestion(
    questions,
    session.medications,
    'Clarify current medications',
    'Clarify medication details',
    (medication) => medication.name,
    (medication) => medication.details.kind,
  );

  addCollectionQuestion(
    questions,
    session.allergiesIntolerances,
    'Clarify allergies or intolerances',
    'Clarify allergy or intolerance reactions',
    (allergy) => allergy.substance,
    (allergy) => allergy.reaction.kind,
  );

  addQuestion(
    questions,
    'Clarify associated symptoms',
    collectUnresolvedFactLabels(session.associatedSymptoms),
  );
  addQuestion(
    questions,
    'Clarify systemic symptoms',
    collectUnresolvedFactLabels(session.systemicSymptoms),
  );
  addQuestion(questions, 'Clarify red flags', collectUnresolvedFactLabels(session.redFlags));

  return questions;
}

function addCollectionQuestion<TItem>(
  questions: QuestionForDoctor[],
  field: CollectionField<TItem>,
  collectionQuestion: string,
  detailQuestion: string,
  getLabel: (item: TItem) => string,
  getDetailKind: (item: TItem) => IntakeTextField['kind'],
) {
  if (field.kind === 'unknown' || field.kind === 'not_assessed') {
    questions.push({ question: collectionQuestion });
    return;
  }

  if (field.kind !== 'value') {
    return;
  }

  if (field.value.length === 0) {
    questions.push({ question: collectionQuestion });
    return;
  }

  const unresolvedItems = field.value
    .filter((item) => isUnresolvedField(getDetailKind(item)))
    .map(getLabel);

  addQuestion(questions, detailQuestion, unresolvedItems);
}

function addQuestion(
  questions: QuestionForDoctor[],
  question: string,
  details: string[],
) {
  if (details.length === 0) {
    return;
  }

  questions.push({
    question,
    detail: details.join(', '),
  });
}

function collectUnresolvedLabels(
  entries: ReadonlyArray<[label: string, kind: IntakeTextField['kind'] | IntakeDateField['kind']]>,
): string[] {
  return entries
    .filter(([, kind]) => isUnresolvedField(kind))
    .map(([label]) => label);
}

function collectUnresolvedFactLabels(record: FactRecord): string[] {
  return Object.keys(record)
    .sort((left, right) => left.localeCompare(right))
    .filter((key) => isUnresolvedBooleanFact(record[key]))
    .map((key) => formatFactLabel(key));
}

function toOptionalDetailProperty(field: IntakeTextField): { detail?: string } {
  if (field.kind !== 'value') {
    return {};
  }

  return { detail: field.value };
}

function mapFieldKindToState(
  kind: Exclude<IntakeTextField['kind'], 'value'> | Exclude<IntakeDateField['kind'], 'value'>,
): SummaryTextField['state'] {
  switch (kind) {
    case 'denied':
      return 'denied';
    case 'unknown':
      return 'unknown';
    case 'not_assessed':
      return 'not_assessed';
  }
}

function mapBooleanFactState(state: BooleanFactState): FactItem['state'] {
  switch (state) {
    case 'yes':
      return 'present';
    case 'no':
      return 'denied';
    case 'unknown':
      return 'unknown';
    case 'not_assessed':
      return 'not_assessed';
  }
}

function isUnresolvedField(kind: IntakeTextField['kind'] | IntakeDateField['kind']): boolean {
  return kind === 'unknown' || kind === 'not_assessed';
}

function isUnresolvedBooleanFact(state: BooleanFactState): boolean {
  return state === 'unknown' || state === 'not_assessed';
}

function formatFactLabel(key: string): string {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();

  if (normalized.length === 0) {
    return key;
  }

  return normalized[0].toUpperCase() + normalized.slice(1);
}
