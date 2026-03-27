'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useIntakeWizardStore } from '@/features/intake/data/intake-wizard-store';
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

export function IntakeWizard() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    currentQuestion,
    currentQuestionId,
    currentPhaseIndex,
    totalPhaseCount,
    draftCurrentInput,
    canGoBack,
    canGoNext,
    hasInitialized,
    isHydrating,
    draftRecoveryMessage,
    initializeWizard,
    saveAnswer,
    goBack,
    goNext,
    saveAndExit,
    resetWizard,
  } = useIntakeWizardStore((state) => state);

  useEffect(() => {
    void initializeWizard();
  }, [initializeWizard]);

  const handleBack = () => {
    goBack();
  };

  const handleNext = () => {
    goNext();
  };

  const handleSaveExit = () => {
    saveAndExit();
    router.push('/drafts');
  };

  const handleStartFresh = () => {
    void resetWizard();
  };

  const isLoadingDraft = !hasInitialized || isHydrating;

  const renderQuestionInput = () => {
    if (!currentQuestion || !currentQuestionId) {
      return (
        <p className="text-sm text-slate-600">
          {t('wizard.completeDescription')}
        </p>
      );
    }

    switch (currentQuestion.type) {
      case 'free_text':
        if (currentQuestion.multiline) {
          return (
            <textarea
              id={currentQuestionId}
              value={
                typeof draftCurrentInput === 'string' ? draftCurrentInput : ''
              }
              onChange={(event) => saveAnswer(event.target.value)}
              maxLength={currentQuestion.maxLength}
              className="min-h-36 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-xs transition-[color,box-shadow] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          );
        }

        return (
          <Input
            id={currentQuestionId}
            value={
              typeof draftCurrentInput === 'string' ? draftCurrentInput : ''
            }
            onChange={(event) => saveAnswer(event.target.value)}
            maxLength={currentQuestion.maxLength}
            className="h-11 border-slate-300 bg-white text-base"
          />
        );
      case 'date':
        return (
          <Input
            id={currentQuestionId}
            type="date"
            value={
              typeof draftCurrentInput === 'string' ? draftCurrentInput : ''
            }
            onChange={(event) => saveAnswer(event.target.value)}
            className="h-11 border-slate-300 bg-white text-base"
          />
        );
      case 'boolean': {
        const currentValue =
          draftCurrentInput === 'yes' ||
          draftCurrentInput === 'no' ||
          draftCurrentInput === 'unknown'
            ? draftCurrentInput
            : null;

        return (
          <fieldset className="space-y-3">
            <legend className="sr-only">{currentQuestion.prompt}</legend>
            {[
              { value: 'yes', label: t('start.options.yes') },
              { value: 'no', label: t('start.options.no') },
              { value: 'unknown', label: t('wizard.unknown') },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name={currentQuestionId}
                  value={option.value}
                  checked={currentValue === option.value}
                  onChange={(event) => saveAnswer(event.target.value)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AppFrame width="narrow">
      <WindowCard className="flex min-h-[640px] flex-col">
        <WindowTopBar
          title={t('wizard.title')}
          rightSlot={
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {t('wizard.autosaved')}
            </span>
          }
        />

        <WindowContent className="flex-1">
          <div className="mx-auto w-full max-w-xl space-y-6">
            <WizardProgress
              currentStep={currentPhaseIndex}
              totalSteps={totalPhaseCount}
            />

            {draftRecoveryMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="space-y-3">
                  <p>{draftRecoveryMessage}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartFresh}
                  >
                    {t('wizard.startFresh')}
                  </Button>
                </div>
              </div>
            ) : null}

            <QuestionCard
              title={
                isLoadingDraft
                  ? t('wizard.loadingTitle')
                  : (currentQuestion?.prompt ?? t('wizard.completeTitle'))
              }
              description={
                isLoadingDraft
                  ? t('wizard.loadingDescription')
                  : currentQuestion?.description
              }
            >
              {!isLoadingDraft &&
              currentQuestionId &&
              currentQuestion?.type !== 'boolean' ? (
                <label htmlFor={currentQuestionId} className="sr-only">
                  {currentQuestion?.prompt}
                </label>
              ) : null}
              {isLoadingDraft ? (
                <p className="text-sm text-slate-600">
                  {t('wizard.loadingBody')}
                </p>
              ) : (
                renderQuestionInput()
              )}
            </QuestionCard>
          </div>
        </WindowContent>

        <WindowFooter className="bg-white text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-slate-300 md:w-auto"
                onClick={handleSaveExit}
                disabled={isLoadingDraft}
              >
                {t('wizard.saveExit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-slate-300 md:w-auto"
                onClick={handleStartFresh}
                disabled={isLoadingDraft}
              >
                {t('wizard.startFresh')}
              </Button>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-slate-300 md:w-auto"
                onClick={handleBack}
                disabled={isLoadingDraft || !canGoBack}
              >
                {t('wizard.back')}
              </Button>
              <Button
                type="button"
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
                onClick={handleNext}
                disabled={isLoadingDraft || !canGoNext}
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
