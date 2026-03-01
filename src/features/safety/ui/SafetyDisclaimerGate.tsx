'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { disclaimerRepository } from '@/features/safety/data/disclaimer-repository';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

export function SafetyDisclaimerGate() {
  const router = useRouter();
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (agreed) {
      disclaimerRepository.setDisclaimerStatus(true);
      router.push('/intake');
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <AppFrame width="narrow">
      <WindowCard>
        <WindowTopBar title="Safety Disclaimer" onBack={handleExit} />

        <WindowContent>
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex gap-3">
                <AlertCircleIcon className="mt-0.5 size-6 shrink-0 text-amber-600" />
                <div className="space-y-4 text-slate-700">
                  <p className="font-medium text-amber-900">Please read and understand the following before proceeding:</p>

                  <ul className="space-y-3 text-sm leading-relaxed">
                    <li className="flex gap-2">
                      <span className="font-bold text-amber-600">•</span>
                      <span>
                        <strong>{t('disclaimer.point1Title')}</strong> {t('disclaimer.point1Content')}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-amber-600">•</span>
                      <span>
                        <strong>{t('disclaimer.point2Title')}</strong> {t('disclaimer.point2Content')}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-amber-600">•</span>
                      <span>
                        <strong>{t('disclaimer.point3Title')}</strong> {t('disclaimer.point3Content')}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-amber-600">•</span>
                      <span>
                        <strong>{t('disclaimer.point4Title')}</strong> {t('disclaimer.point4Content')}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-amber-600">•</span>
                      <span>
                        <strong>{t('disclaimer.point5Title')}</strong> {t('disclaimer.point5Content')}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <label className="group flex cursor-pointer items-start gap-3" htmlFor="disclaimer-check">
                <input
                  type="checkbox"
                  id="disclaimer-check"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <span className="select-none text-slate-700 transition-colors group-hover:text-slate-900">
                  {t('disclaimer.checkbox')}
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 w-full bg-blue-600 text-base text-white hover:bg-blue-700 sm:flex-1"
                size="lg"
                disabled={!agreed}
                onClick={handleContinue}
              >
                {t('disclaimer.continueBtn')}
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full border-slate-200 bg-slate-100 px-8 text-base text-slate-700 hover:bg-slate-200 sm:flex-1"
                size="lg"
                onClick={handleExit}
              >
                {t('common.exit')}
              </Button>
            </div>
          </div>
        </WindowContent>

        <WindowFooter>{t('home.footerNote')}</WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}
