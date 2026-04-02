'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { intakeDraftRepository } from '@/features/intake/data/intake-draft-repository';
import { Button } from '@/shared/ui/button';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

import { prepareDoctorSummaryPreview } from '../domain/prepare-doctor-summary-preview';
import { DoctorSummaryScreen } from './DoctorSummaryScreen';

type PreviewState =
  | { status: 'loading' }
  | { status: 'unavailable'; description: string }
  | {
      status: 'ready';
      result: ReturnType<typeof prepareDoctorSummaryPreview>;
    };

export function DoctorSummaryPreview() {
  const router = useRouter();
  const [state, setState] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    let isCancelled = false;

    async function loadPreview() {
      const draftResult = await intakeDraftRepository.loadActiveDraft();

      if (isCancelled) {
        return;
      }

      if (draftResult.status !== 'ready') {
        setState({
          status: 'unavailable',
          description:
            'No saved intake draft is available on this device yet. Complete the intake first to preview or export a doctor summary.',
        });
        return;
      }

      setState({
        status: 'ready',
        result: prepareDoctorSummaryPreview(draftResult.session),
      });
    }

    void loadPreview();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleBack = () => {
    router.push('/intake');
  };

  if (state.status === 'loading') {
    return (
      <SummaryStatusCard
        title="Preparing summary preview"
        description="Loading the active draft from this device and running the final safety check."
        onBack={handleBack}
      />
    );
  }

  if (state.status === 'unavailable') {
    return (
      <SummaryStatusCard
        title="Summary preview unavailable"
        description={state.description}
        onBack={handleBack}
      />
    );
  }

  return (
    <DoctorSummaryScreen
      result={state.result}
      onBack={handleBack}
      onPrint={() => window.print()}
    />
  );
}

function SummaryStatusCard({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <AppFrame width="wide">
      <WindowCard>
        <WindowTopBar
          title="Doctor Summary"
          subtitle="Preview"
          onBack={onBack}
        />
        <WindowContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {description}
            </p>
          </div>
        </WindowContent>
        <WindowFooter className="bg-white text-left print:hidden">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to intake
          </Button>
        </WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}
