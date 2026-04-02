import type {
  ClarifyingQuestionGenerationOutput,
  FreeTextNormalizationOutput,
  SummaryRewriteOutput,
} from '@/features/intake/domain/ai-json-contracts';
import {
  type DoctorSummary,
  DoctorSummarySchema,
} from '@/features/summary/domain/doctor-summary-schema';

export const FORBIDDEN_OUTPUT_CATEGORIES = [
  'diagnosis',
  'disease_ranking',
  'treatment',
  'triage',
] as const;

export type ForbiddenOutputCategory = (typeof FORBIDDEN_OUTPUT_CATEGORIES)[number];
export type OutputSafetyAction = 'remove' | 'block';
export type OutputSafetyDecision = 'safe' | 'sanitized' | 'blocked';

export type OutputSafetyFinding = {
  category: ForbiddenOutputCategory;
  action: OutputSafetyAction;
  path: string;
  excerpt: string;
};

type SafeOutputSafetyResult<T> = {
  decision: 'safe' | 'sanitized';
  data: T;
  findings: OutputSafetyFinding[];
};

type BlockedOutputSafetyResult = {
  decision: 'blocked';
  findings: OutputSafetyFinding[];
};

export type OutputSafetyResult<T> =
  | SafeOutputSafetyResult<T>
  | BlockedOutputSafetyResult;

export const SAFE_DOCTOR_SUMMARY_TITLE = 'Doctor Summary';
export const SAFE_DOCTOR_SUMMARY_DISCLAIMER =
  'Patient-reported summary to support discussion with a clinician. It does not provide diagnosis, treatment recommendations, or urgency advice.';

type ForbiddenPattern = {
  category: ForbiddenOutputCategory;
  regex: RegExp;
};

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  {
    category: 'diagnosis',
    regex:
      /\b(?:most consistent with|consistent with|this suggests|suggestive of|diagnosis(?:\s+is|:))\b/gi,
  },
  {
    category: 'disease_ranking',
    regex:
      /\b(?:this is likely|most likely|likely caused by|likely due to|probable diagnosis|probable cause)\b/gi,
  },
  {
    category: 'treatment',
    regex:
      /\b(?:you should take|should start|should stop|start taking|stop taking|treatment plan|should be treated with|recommended(?: that you)?\s+(?:take|start|stop|use))\b/gi,
  },
  {
    category: 'triage',
    regex:
      /\b(?:go to (?:the )?(?:er|emergency room)|seek urgent care|seek emergency care|needs immediate evaluation|needs urgent evaluation|immediate medical attention|call 911|not urgent|low risk|high risk)\b/gi,
  },
];

type SummaryTextField = DoctorSummary['timeline']['onset'];
type SummaryFactItem = DoctorSummary['symptomFacts']['associatedSymptoms'][number];
type SummaryListItem = DoctorSummary['medications']['items'][number];
type SummaryQuestion = DoctorSummary['questionsForDoctor'][number];

function updateDecision(
  currentDecision: 'safe' | 'sanitized',
  nextDecision: OutputSafetyDecision,
): 'safe' | 'sanitized' {
  return currentDecision === 'sanitized' || nextDecision === 'sanitized'
    ? 'sanitized'
    : 'safe';
}

function setFindingAction(
  findings: OutputSafetyFinding[],
  action: OutputSafetyAction,
): OutputSafetyFinding[] {
  return findings.map((finding) => ({
    ...finding,
    action,
  }));
}

function splitTextIntoSegments(text: string): string[] {
  return text
    .trim()
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function collectTextFindings(text: string, path: string): OutputSafetyFinding[] {
  const findings: OutputSafetyFinding[] = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = text.matchAll(
      new RegExp(pattern.regex.source, pattern.regex.flags),
    );

    for (const match of matches) {
      const excerpt = match[0]?.trim();

      if (excerpt === undefined || excerpt.length === 0) {
        continue;
      }

      findings.push({
        category: pattern.category,
        action: 'block',
        path,
        excerpt,
      });
    }
  }

  return findings;
}

function collectUnknownTextFindings(value: unknown, path: string): OutputSafetyFinding[] {
  if (typeof value === 'string') {
    return collectTextFindings(value, path);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectUnknownTextFindings(item, `${path}[${index}]`),
    );
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      collectUnknownTextFindings(nestedValue, `${path}.${key}`),
    );
  }

  return [];
}

function createSafeResult<T>(data: T): SafeOutputSafetyResult<T> {
  return {
    decision: 'safe',
    data,
    findings: [],
  };
}

function createSanitizedResult<T>(
  data: T,
  findings: OutputSafetyFinding[],
): SafeOutputSafetyResult<T> {
  return {
    decision: 'sanitized',
    data,
    findings,
  };
}

function createBlockedResult(
  findings: OutputSafetyFinding[],
): BlockedOutputSafetyResult {
  return {
    decision: 'blocked',
    findings,
  };
}

function sanitizeOptionalText(
  value: string | undefined,
  path: string,
): {
  value?: string;
  decision: 'safe' | 'sanitized';
  findings: OutputSafetyFinding[];
} {
  if (value === undefined) {
    return {
      value: undefined,
      decision: 'safe',
      findings: [],
    };
  }

  const result = sanitizeOutputText(value, path);

  if (result.decision === 'blocked') {
    return {
      value: undefined,
      decision: 'sanitized',
      findings: setFindingAction(result.findings, 'remove'),
    };
  }

  return {
    value: result.data,
    decision: result.decision,
    findings: result.findings,
  };
}

function sanitizeSummaryTextField(
  field: SummaryTextField,
  path: string,
): OutputSafetyResult<SummaryTextField> {
  if (field.detail === undefined) {
    return createSafeResult(field);
  }

  const detailResult = sanitizeOutputText(field.detail, `${path}.detail`);

  if (detailResult.decision === 'blocked') {
    if (field.state === 'present') {
      return createBlockedResult(detailResult.findings);
    }

    return createSanitizedResult(
      { state: field.state },
      setFindingAction(detailResult.findings, 'remove'),
    );
  }

  if (detailResult.decision === 'safe') {
    return createSafeResult(field);
  }

  return createSanitizedResult(
    {
      ...field,
      detail: detailResult.data,
    },
    detailResult.findings,
  );
}

function sanitizeSummaryFactItem(
  item: SummaryFactItem,
  path: string,
): OutputSafetyResult<SummaryFactItem> {
  const labelResult = sanitizeOutputText(item.label, `${path}.label`);

  if (labelResult.decision === 'blocked') {
    return createBlockedResult(labelResult.findings);
  }

  const detailResult = sanitizeOptionalText(item.detail, `${path}.detail`);
  const findings = [...labelResult.findings, ...detailResult.findings];
  const decision = updateDecision(labelResult.decision, detailResult.decision);

  if (decision === 'safe') {
    return createSafeResult(item);
  }

  return createSanitizedResult(
    {
      label: labelResult.data,
      state: item.state,
      ...(detailResult.value === undefined ? {} : { detail: detailResult.value }),
    },
    findings,
  );
}

function sanitizeSummaryListItem(
  item: SummaryListItem,
  path: string,
): OutputSafetyResult<SummaryListItem> {
  const labelResult = sanitizeOutputText(item.label, `${path}.label`);

  if (labelResult.decision === 'blocked') {
    return createBlockedResult(labelResult.findings);
  }

  const detailResult = sanitizeOptionalText(item.detail, `${path}.detail`);
  const findings = [...labelResult.findings, ...detailResult.findings];
  const decision = updateDecision(labelResult.decision, detailResult.decision);

  if (decision === 'safe') {
    return createSafeResult(item);
  }

  return createSanitizedResult(
    {
      label: labelResult.data,
      ...(detailResult.value === undefined ? {} : { detail: detailResult.value }),
    },
    findings,
  );
}

function sanitizeSummaryQuestion(
  item: SummaryQuestion,
  path: string,
): OutputSafetyResult<SummaryQuestion> {
  const questionResult = sanitizeOutputText(item.question, `${path}.question`);

  if (questionResult.decision === 'blocked') {
    return createBlockedResult(questionResult.findings);
  }

  const detailResult = sanitizeOptionalText(item.detail, `${path}.detail`);
  const findings = [...questionResult.findings, ...detailResult.findings];
  const decision = updateDecision(questionResult.decision, detailResult.decision);

  if (decision === 'safe') {
    return createSafeResult(item);
  }

  return createSanitizedResult(
    {
      question: questionResult.data,
      ...(detailResult.value === undefined ? {} : { detail: detailResult.value }),
    },
    findings,
  );
}

function sanitizeSummaryCollectionSection(
  section: DoctorSummary['medications'],
  path: string,
): OutputSafetyResult<DoctorSummary['medications']> {
  const findings: OutputSafetyFinding[] = [];
  const safeItems: SummaryListItem[] = [];
  let decision: 'safe' | 'sanitized' = 'safe';

  for (const [index, item] of section.items.entries()) {
    const itemResult = sanitizeSummaryListItem(item, `${path}.items[${index}]`);

    if (itemResult.decision === 'blocked') {
      decision = 'sanitized';
      findings.push(...setFindingAction(itemResult.findings, 'remove'));
      continue;
    }

    decision = updateDecision(decision, itemResult.decision);
    findings.push(...itemResult.findings);
    safeItems.push(itemResult.data);
  }

  if (section.state === 'present' && safeItems.length === 0) {
    return createBlockedResult(findings);
  }

  if (decision === 'safe') {
    return createSafeResult(section);
  }

  return createSanitizedResult(
    {
      state: section.state,
      items: safeItems,
    },
    findings,
  );
}

export function analyzeOutputText(
  text: string,
  path = 'text',
): OutputSafetyFinding[] {
  return collectTextFindings(text, path);
}

export function sanitizeOutputText(
  text: string,
  path = 'text',
): OutputSafetyResult<string> {
  const findings = collectTextFindings(text, path);

  if (findings.length === 0) {
    return createSafeResult(text);
  }

  const segments = splitTextIntoSegments(text);

  if (segments.length < 2) {
    return createBlockedResult(findings);
  }

  const safeSegments = segments.filter(
    (segment) => collectTextFindings(segment, path).length === 0,
  );

  if (safeSegments.length === 0) {
    return createBlockedResult(findings);
  }

  return createSanitizedResult(safeSegments.join(' '), setFindingAction(findings, 'remove'));
}

export function sanitizeClarifyingQuestionOutput(
  output: ClarifyingQuestionGenerationOutput,
): OutputSafetyResult<ClarifyingQuestionGenerationOutput> {
  const promptResult = sanitizeOutputText(output.question.prompt, 'question.prompt');

  if (promptResult.decision === 'blocked') {
    return createBlockedResult(promptResult.findings);
  }

  const descriptionResult = sanitizeOptionalText(
    output.question.description,
    'question.description',
  );
  const rationaleResult = sanitizeOptionalText(output.rationale, 'rationale');
  const findings = [
    ...promptResult.findings,
    ...descriptionResult.findings,
    ...rationaleResult.findings,
  ];
  const decision = updateDecision(
    updateDecision(promptResult.decision, descriptionResult.decision),
    rationaleResult.decision,
  );

  if (decision === 'safe') {
    return createSafeResult(output);
  }

  return createSanitizedResult(
    {
      ...output,
      question: {
        ...output.question,
        prompt: promptResult.data,
        ...(descriptionResult.value === undefined
          ? {}
          : { description: descriptionResult.value }),
      },
      ...(rationaleResult.value === undefined
        ? {}
        : { rationale: rationaleResult.value }),
    },
    findings,
  );
}

export function sanitizeFreeTextNormalizationOutput(
  output: FreeTextNormalizationOutput,
): OutputSafetyResult<FreeTextNormalizationOutput> {
  const findings = [
    ...output.normalizedFields.flatMap((field, index) =>
      collectUnknownTextFindings(field.value, `normalizedFields[${index}].value`),
    ),
    ...collectUnknownTextFindings(output.unmappedText, 'unmappedText'),
  ];

  if (findings.length === 0) {
    return createSafeResult(output);
  }

  return createBlockedResult(findings);
}

export function sanitizeDoctorSummary(
  summary: DoctorSummary,
): OutputSafetyResult<DoctorSummary> {
  let decision: 'safe' | 'sanitized' = 'safe';
  const findings: OutputSafetyFinding[] = [];

  const titleResult = sanitizeOutputText(summary.header.title, 'header.title');
  const disclaimerResult = sanitizeOutputText(
    summary.header.disclaimer,
    'header.disclaimer',
  );

  let title = summary.header.title;
  if (titleResult.decision === 'blocked') {
    title = SAFE_DOCTOR_SUMMARY_TITLE;
    decision = 'sanitized';
    findings.push(...setFindingAction(titleResult.findings, 'remove'));
  } else {
    title = titleResult.data;
    decision = updateDecision(decision, titleResult.decision);
    findings.push(...titleResult.findings);
  }

  let disclaimer = summary.header.disclaimer;
  if (disclaimerResult.decision === 'blocked') {
    disclaimer = SAFE_DOCTOR_SUMMARY_DISCLAIMER;
    decision = 'sanitized';
    findings.push(...setFindingAction(disclaimerResult.findings, 'remove'));
  } else {
    disclaimer = disclaimerResult.data;
    decision = updateDecision(decision, disclaimerResult.decision);
    findings.push(...disclaimerResult.findings);
  }

  const complaintHeadlineResult = sanitizeOptionalText(
    summary.complaint.headline,
    'complaint.headline',
  );
  const complaintDetailResult = sanitizeOptionalText(
    summary.complaint.detail,
    'complaint.detail',
  );
  decision = updateDecision(decision, complaintHeadlineResult.decision);
  decision = updateDecision(decision, complaintDetailResult.decision);
  findings.push(...complaintHeadlineResult.findings, ...complaintDetailResult.findings);

  const onsetResult = sanitizeSummaryTextField(summary.timeline.onset, 'timeline.onset');
  if (onsetResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...onsetResult.findings]);
  }

  const durationResult = sanitizeSummaryTextField(
    summary.timeline.duration,
    'timeline.duration',
  );
  if (durationResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...durationResult.findings]);
  }

  const courseResult = sanitizeSummaryTextField(summary.timeline.course, 'timeline.course');
  if (courseResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...courseResult.findings]);
  }

  decision = updateDecision(decision, onsetResult.decision);
  decision = updateDecision(decision, durationResult.decision);
  decision = updateDecision(decision, courseResult.decision);
  findings.push(...onsetResult.findings, ...durationResult.findings, ...courseResult.findings);

  const associatedSymptoms: SummaryFactItem[] = [];
  const systemicSymptoms: SummaryFactItem[] = [];
  const redFlags: SummaryFactItem[] = [];

  for (const [index, item] of summary.symptomFacts.associatedSymptoms.entries()) {
    const itemResult = sanitizeSummaryFactItem(
      item,
      `symptomFacts.associatedSymptoms[${index}]`,
    );

    if (itemResult.decision === 'blocked') {
      decision = 'sanitized';
      findings.push(...setFindingAction(itemResult.findings, 'remove'));
      continue;
    }

    decision = updateDecision(decision, itemResult.decision);
    findings.push(...itemResult.findings);
    associatedSymptoms.push(itemResult.data);
  }

  for (const [index, item] of summary.symptomFacts.systemicSymptoms.entries()) {
    const itemResult = sanitizeSummaryFactItem(
      item,
      `symptomFacts.systemicSymptoms[${index}]`,
    );

    if (itemResult.decision === 'blocked') {
      decision = 'sanitized';
      findings.push(...setFindingAction(itemResult.findings, 'remove'));
      continue;
    }

    decision = updateDecision(decision, itemResult.decision);
    findings.push(...itemResult.findings);
    systemicSymptoms.push(itemResult.data);
  }

  for (const [index, item] of summary.symptomFacts.redFlags.entries()) {
    const itemResult = sanitizeSummaryFactItem(item, `symptomFacts.redFlags[${index}]`);

    if (itemResult.decision === 'blocked') {
      decision = 'sanitized';
      findings.push(...setFindingAction(itemResult.findings, 'remove'));
      continue;
    }

    decision = updateDecision(decision, itemResult.decision);
    findings.push(...itemResult.findings);
    redFlags.push(itemResult.data);
  }

  const relevantConditionsResult = sanitizeSummaryCollectionSection(
    summary.history.relevantConditions,
    'history.relevantConditions',
  );
  if (relevantConditionsResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...relevantConditionsResult.findings]);
  }

  const surgeriesResult = sanitizeSummaryCollectionSection(
    summary.history.surgeries,
    'history.surgeries',
  );
  if (surgeriesResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...surgeriesResult.findings]);
  }

  const familyHistoryResult = sanitizeSummaryCollectionSection(
    summary.history.familyHistory,
    'history.familyHistory',
  );
  if (familyHistoryResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...familyHistoryResult.findings]);
  }

  const medicationsResult = sanitizeSummaryCollectionSection(
    summary.medications,
    'medications',
  );
  if (medicationsResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...medicationsResult.findings]);
  }

  const allergiesResult = sanitizeSummaryCollectionSection(
    summary.allergiesIntolerances,
    'allergiesIntolerances',
  );
  if (allergiesResult.decision === 'blocked') {
    return createBlockedResult([...findings, ...allergiesResult.findings]);
  }

  decision = updateDecision(decision, relevantConditionsResult.decision);
  decision = updateDecision(decision, surgeriesResult.decision);
  decision = updateDecision(decision, familyHistoryResult.decision);
  decision = updateDecision(decision, medicationsResult.decision);
  decision = updateDecision(decision, allergiesResult.decision);
  findings.push(
    ...relevantConditionsResult.findings,
    ...surgeriesResult.findings,
    ...familyHistoryResult.findings,
    ...medicationsResult.findings,
    ...allergiesResult.findings,
  );

  const questionsForDoctor: SummaryQuestion[] = [];

  for (const [index, item] of summary.questionsForDoctor.entries()) {
    const itemResult = sanitizeSummaryQuestion(item, `questionsForDoctor[${index}]`);

    if (itemResult.decision === 'blocked') {
      decision = 'sanitized';
      findings.push(...setFindingAction(itemResult.findings, 'remove'));
      continue;
    }

    decision = updateDecision(decision, itemResult.decision);
    findings.push(...itemResult.findings);
    questionsForDoctor.push(itemResult.data);
  }

  const notesResult = sanitizeOptionalText(summary.notes, 'notes');
  decision = updateDecision(decision, notesResult.decision);
  findings.push(...notesResult.findings);

  const sanitizedSummaryCandidate = {
    ...summary,
    header: {
      title,
      disclaimer,
    },
    complaint: {
      ...(complaintHeadlineResult.value === undefined
        ? {}
        : { headline: complaintHeadlineResult.value }),
      ...(complaintDetailResult.value === undefined
        ? {}
        : { detail: complaintDetailResult.value }),
    },
    timeline: {
      onset: onsetResult.data,
      duration: durationResult.data,
      course: courseResult.data,
    },
    symptomFacts: {
      associatedSymptoms,
      systemicSymptoms,
      redFlags,
    },
    history: {
      relevantConditions: relevantConditionsResult.data,
      surgeries: surgeriesResult.data,
      familyHistory: familyHistoryResult.data,
    },
    medications: medicationsResult.data,
    allergiesIntolerances: allergiesResult.data,
    questionsForDoctor,
    ...(notesResult.value === undefined ? {} : { notes: notesResult.value }),
  };

  const parsedSummary = DoctorSummarySchema.safeParse(sanitizedSummaryCandidate);

  if (!parsedSummary.success) {
    return createBlockedResult(findings);
  }

  if (decision === 'safe') {
    return createSafeResult(summary);
  }

  return createSanitizedResult(parsedSummary.data, findings);
}

export function sanitizeSummaryRewriteOutput(
  output: SummaryRewriteOutput,
): OutputSafetyResult<SummaryRewriteOutput> {
  const summaryResult = sanitizeDoctorSummary(output.summary);

  if (summaryResult.decision === 'blocked') {
    return createBlockedResult(summaryResult.findings);
  }

  if (summaryResult.decision === 'safe') {
    return createSafeResult(output);
  }

  return createSanitizedResult(
    {
      ...output,
      summary: summaryResult.data,
    },
    summaryResult.findings,
  );
}
