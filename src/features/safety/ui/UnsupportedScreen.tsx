'use client';

import { useRouter } from 'next/navigation';

import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

export function UnsupportedScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppFrame width="narrow">
      <WindowCard>
        <WindowTopBar title={t('unsupported.title')} />

        <WindowContent>
          <div className="mx-auto w-full max-w-xl space-y-6">
            <p className="text-slate-700">{t('unsupported.description')}</p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="font-bold text-slate-500">•</span>
                  <span>{t('unsupported.limits.adultPrimaryCare')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-slate-500">•</span>
                  <span>{t('unsupported.limits.pregnancy')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-slate-500">•</span>
                  <span>{t('unsupported.limits.emergency')}</span>
                </li>
              </ul>
            </div>

            <Button className="h-12 w-full bg-blue-600 text-base text-white hover:bg-blue-700" onClick={() => router.push('/')}>
              {t('unsupported.returnHome')}
            </Button>
          </div>
        </WindowContent>

        <WindowFooter>{t('home.footerNote')}</WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}
