'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { scopeGateRepository } from '@/features/safety/data/scope-gate-repository';
import {
  detectUnsupportedContext,
  type Session,
} from '@/features/safety/domain/scope-gate';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

export function ScopeGateForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const [pregnancyRelated, setPregnancyRelated] = useState<boolean | null>(null);
  const [emergency, setEmergency] = useState<boolean | null>(null);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);

  const canSubmit = pregnancyRelated !== null && emergency !== null;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    const session: Session = {
      age: isAdultConfirmed ? 18 : 17,
      answers: {
        pregnancyRelated,
        emergency,
        urgent: emergency,
      },
    };

    const reasons = detectUnsupportedContext(session);
    if (reasons.length > 0) {
      scopeGateRepository.setScopeGateStatus(false);
      router.push('/unsupported');
      return;
    }

    scopeGateRepository.setScopeGateStatus(true);
    router.push('/intake');
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <AppFrame width="narrow">
      <WindowCard>
        <WindowTopBar title={t('start.title')} onBack={handleExit} />

        <WindowContent>
          <div className="mx-auto w-full max-w-xl space-y-6">
            <p className="text-slate-700">{t('start.description')}</p>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <legend className="text-sm font-medium text-slate-700">
                {t('start.fields.pregnancy')}
              </legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <input
                    type="radio"
                    name="pregnancy"
                    checked={pregnancyRelated === true}
                    onChange={() => setPregnancyRelated(true)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{t('start.options.yes')}</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <input
                    type="radio"
                    name="pregnancy"
                    checked={pregnancyRelated === false}
                    onChange={() => setPregnancyRelated(false)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{t('start.options.no')}</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <legend className="text-sm font-medium text-slate-700">
                {t('start.fields.emergency')}
              </legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <input
                    type="radio"
                    name="emergency"
                    checked={emergency === true}
                    onChange={() => setEmergency(true)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{t('start.options.yes')}</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <input
                    type="radio"
                    name="emergency"
                    checked={emergency === false}
                    onChange={() => setEmergency(false)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{t('start.options.no')}</span>
                </label>
              </div>
            </fieldset>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <label
                className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                htmlFor="adult-confirmed"
              >
                <input
                  id="adult-confirmed"
                  type="checkbox"
                  checked={isAdultConfirmed}
                  onChange={(event) => setIsAdultConfirmed(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>{t('start.fields.adultConfirmation')}</span>
              </label>
            </div>

            <Button
              className="h-12 w-full bg-blue-600 text-base text-white hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {t('start.continue')}
            </Button>
          </div>
        </WindowContent>

        <WindowFooter>{t('home.footerNote')}</WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}
