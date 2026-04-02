import { type OutputSafetyResult } from '@/features/safety/domain/output-safety';
import { type DoctorSummary } from '@/features/summary/domain/doctor-summary-schema';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

import { SummaryField } from './SummaryField';
import { SummarySection } from './SummarySection';

type DoctorSummaryScreenProps = {
  result: OutputSafetyResult<DoctorSummary>;
  onBack: () => void;
  onPrint: () => void;
};

export function DoctorSummaryScreen({
  result,
  onBack,
  onPrint,
}: DoctorSummaryScreenProps) {
  if (result.decision === 'blocked') {
    return (
      <AppFrame
        width="wide"
        className="print:min-h-0 print:bg-white print:px-0 print:py-0"
      >
        <WindowCard className="print:overflow-visible print:rounded-none print:shadow-none">
          <WindowTopBar
            title="Doctor Summary"
            subtitle="Preview"
            onBack={onBack}
          />
          <WindowContent className="space-y-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h1 className="text-xl font-semibold text-slate-900">
                Summary preview unavailable
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                This summary could not be displayed or exported safely. You can
                return to the intake on this device and continue with the
                deterministic flow.
              </p>
            </div>
          </WindowContent>
          <WindowFooter className="justify-start bg-white text-left print:hidden">
            <Button type="button" variant="outline" onClick={onBack}>
              Back to intake
            </Button>
          </WindowFooter>
        </WindowCard>
      </AppFrame>
    );
  }

  const summary = result.data;
  const generatedAtLabel = formatSummaryTimestamp(summary.generatedAt);

  return (
    <AppFrame
      width="wide"
      className="print:min-h-0 print:bg-white print:px-0 print:py-0"
    >
      <WindowCard className="print:overflow-visible print:rounded-none print:shadow-none">
        <WindowTopBar
          title={summary.header.title}
          subtitle="Doctor-friendly preview"
          onBack={onBack}
          rightSlot={
            <Badge
              variant="secondary"
              className="border-slate-200 bg-slate-100 text-slate-700 print:hidden"
            >
              {result.decision === 'sanitized' ? 'Sanitized' : 'Safety checked'}
            </Badge>
          }
        />

        <WindowContent className="space-y-6 print:px-0 print:py-0">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between print:hidden">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                Ready to print or save as PDF
              </p>
              <p className="text-sm text-slate-600">
                Use your browser&apos;s print dialog to print this summary or
                choose Save as PDF.
              </p>
            </div>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={onPrint}
            >
              Print / Export PDF
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {summary.header.title}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Generated {generatedAtLabel}
                </p>
              </div>
              <Badge
                variant="outline"
                className="w-fit border-slate-300 text-slate-700"
              >
                {summary.mode === 'ai_assisted'
                  ? 'AI-assisted summary'
                  : 'Deterministic summary'}
              </Badge>
            </div>
            {result.decision === 'sanitized' ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Some unsafe phrasing was removed before this summary was shown.
              </p>
            ) : null}
            <p className="mt-4 text-sm leading-6 [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-slate-700">
              {summary.header.disclaimer}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SummarySection title="Chief Complaint">
              <div className="grid gap-4">
                <SummaryField label="Summary">
                  {summary.complaint.headline ?? 'Not provided'}
                </SummaryField>
                <SummaryField label="Detail">
                  {summary.complaint.detail ?? 'No additional detail provided.'}
                </SummaryField>
              </div>
            </SummarySection>

            <SummarySection title="Timeline">
              <div className="grid gap-4">
                <SummaryField label="Onset">
                  {formatTextField(summary.timeline.onset)}
                </SummaryField>
                <SummaryField label="Duration">
                  {formatTextField(summary.timeline.duration)}
                </SummaryField>
                <SummaryField label="Course">
                  {formatTextField(summary.timeline.course)}
                </SummaryField>
              </div>
            </SummarySection>
          </div>

          <SummarySection title="Symptom Facts">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryField label="Associated Symptoms">
                <FactList
                  items={summary.symptomFacts.associatedSymptoms}
                  emptyLabel="No associated symptoms recorded."
                />
              </SummaryField>
              <SummaryField label="Systemic Symptoms">
                <FactList
                  items={summary.symptomFacts.systemicSymptoms}
                  emptyLabel="No systemic symptoms recorded."
                />
              </SummaryField>
              <SummaryField label="Red Flags">
                <FactList
                  items={summary.symptomFacts.redFlags}
                  emptyLabel="No red-flag facts recorded."
                />
              </SummaryField>
            </div>
          </SummarySection>

          <SummarySection title="History">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryField label="Relevant Conditions">
                <CollectionSectionContent
                  section={summary.history.relevantConditions}
                />
              </SummaryField>
              <SummaryField label="Surgeries">
                <CollectionSectionContent section={summary.history.surgeries} />
              </SummaryField>
              <SummaryField label="Family History">
                <CollectionSectionContent
                  section={summary.history.familyHistory}
                />
              </SummaryField>
            </div>
          </SummarySection>

          <div className="grid gap-4 md:grid-cols-2">
            <SummarySection title="Medications">
              <SummaryField
                label="Current Medications"
                className="border-0 p-0"
              >
                <CollectionSectionContent section={summary.medications} />
              </SummaryField>
            </SummarySection>

            <SummarySection title="Allergies / Intolerances">
              <SummaryField
                label="Allergies and Intolerances"
                className="border-0 p-0"
              >
                <CollectionSectionContent
                  section={summary.allergiesIntolerances}
                />
              </SummaryField>
            </SummarySection>
          </div>

          <SummarySection
            title="Questions for Doctor"
            description="This block stays separate from the factual intake sections."
            accent
          >
            {summary.questionsForDoctor.length > 0 ? (
              <ol className="space-y-3">
                {summary.questionsForDoctor.map((item) => (
                  <li
                    key={`${item.question}-${item.detail ?? 'none'}`}
                    className="rounded-lg border border-blue-200 bg-white p-4"
                  >
                    <p className="text-sm font-medium [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-slate-900">
                      {item.question}
                    </p>
                    {item.detail ? (
                      <p className="mt-2 text-sm [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-slate-600">
                        {item.detail}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm leading-6 text-slate-700">
                No follow-up questions were captured for the doctor.
              </p>
            )}
          </SummarySection>

          {summary.notes ? (
            <SummarySection title="Notes">
              <SummaryField label="Additional Notes">
                {summary.notes}
              </SummaryField>
            </SummarySection>
          ) : null}
        </WindowContent>

        <WindowFooter className="bg-slate-50 text-left text-xs leading-5 text-slate-600 print:mt-6 print:border-t print:bg-white print:px-0">
          <div className="w-full space-y-1">
            <p>Generated {generatedAtLabel}</p>
            <p className="[overflow-wrap:anywhere] break-words whitespace-pre-wrap">
              {summary.header.disclaimer}
            </p>
          </div>
        </WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}

function formatSummaryTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

function formatTextField(field: DoctorSummary['timeline']['onset']): string {
  if (field.detail) {
    return field.detail;
  }

  return formatFactState(field.state);
}

function formatFactState(
  state: DoctorSummary['timeline']['onset']['state']
): string {
  switch (state) {
    case 'present':
      return 'Present';
    case 'denied':
      return 'Denied';
    case 'unknown':
      return 'Unknown';
    case 'not_assessed':
      return 'Not assessed';
    default:
      return state;
  }
}

function FactList({
  items,
  emptyLabel,
}: {
  items: DoctorSummary['symptomFacts']['associatedSymptoms'];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-slate-600">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={`${item.label}-${item.state}`}
          className="flex flex-wrap items-start justify-between gap-2"
        >
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
            {item.label}
          </span>
          <Badge
            variant="outline"
            className="border-slate-300 bg-slate-50 text-slate-700"
          >
            {formatFactState(item.state)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function CollectionSectionContent({
  section,
}: {
  section: DoctorSummary['medications'];
}) {
  if (section.state !== 'present' || section.items.length === 0) {
    return <p className="text-slate-600">{formatFactState(section.state)}</p>;
  }

  return (
    <ul className="space-y-3">
      {section.items.map((item) => (
        <li
          key={`${item.label}-${item.detail ?? 'none'}`}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <p className="font-medium [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-slate-900">
            {item.label}
          </p>
          {item.detail ? (
            <p className="mt-1 text-sm [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-slate-600">
              {item.detail}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
