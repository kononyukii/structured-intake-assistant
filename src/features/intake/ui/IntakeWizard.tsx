'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

import { QuestionCard } from './QuestionCard';
import { WizardProgress } from './WizardProgress';

type DemoStep = {
  id: string;
  title: string;
  description?: string;
  fieldType: 'text' | 'textarea';
  placeholder: string;
};

const demoSteps: DemoStep[] = [
  {
    id: 'mainConcern',
    title: 'What is your main concern today?',
    description: 'Share the main reason for your visit in your own words.',
    fieldType: 'textarea',
    placeholder: 'Describe your concern...',
  },
  {
    id: 'onset',
    title: 'When did this start?',
    description: 'You can use a date or a general timeframe.',
    fieldType: 'text',
    placeholder: 'e.g., 3 days ago',
  },
  {
    id: 'symptoms',
    title: 'Which symptoms feel most noticeable right now?',
    description: 'List the key symptoms you want to mention first.',
    fieldType: 'textarea',
    placeholder: 'Describe your symptoms...',
  },
  {
    id: 'notes',
    title: 'Anything else you want your clinician to know?',
    description: 'Optional details you want to include in the intake summary.',
    fieldType: 'textarea',
    placeholder: 'Add any extra context...',
  },
];

export function IntakeWizard() {
  const router = useRouter();
  const { t } = useTranslation();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentStep = demoSteps[stepIndex];
  const totalSteps = demoSteps.length;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  const handleBack = () => {
    if (isFirstStep) {
      return;
    }

    setStepIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (isLastStep) {
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const handleSaveExit = () => {
    router.push('/drafts');
  };

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentStep.id]: value,
    }));
  };

  return (
    <AppFrame width="narrow">
      <WindowCard className="flex min-h-[640px] flex-col">
        <WindowTopBar title={t('wizard.title')} />

        <WindowContent className="flex-1">
          <div className="mx-auto w-full max-w-xl space-y-6">
            <WizardProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />

            <QuestionCard title={currentStep.title} description={currentStep.description}>
              <label htmlFor={currentStep.id} className="sr-only">
                {currentStep.title}
              </label>
              {currentStep.fieldType === 'text' ? (
                <Input
                  id={currentStep.id}
                  value={answers[currentStep.id] ?? ''}
                  onChange={(event) => handleAnswerChange(event.target.value)}
                  placeholder={currentStep.placeholder}
                  className="h-11 border-slate-300 bg-white text-base"
                />
              ) : (
                <textarea
                  id={currentStep.id}
                  value={answers[currentStep.id] ?? ''}
                  onChange={(event) => handleAnswerChange(event.target.value)}
                  placeholder={currentStep.placeholder}
                  className="min-h-36 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}
            </QuestionCard>
          </div>
        </WindowContent>

        <WindowFooter className="bg-white text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-slate-300 md:w-auto"
              onClick={handleSaveExit}
            >
              {t('wizard.saveExit')}
            </Button>

            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-slate-300 md:w-auto"
                onClick={handleBack}
                disabled={isFirstStep}
              >
                {t('wizard.back')}
              </Button>
              <Button
                type="button"
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
                onClick={handleNext}
                disabled={isLastStep}
              >
                {t('wizard.next')}
              </Button>
            </div>
          </div>
        </WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}
