'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import {
  HeroSection,
  InfoCard,
  Page,
  PageBody,
  PageContainer,
  PageFooter,
  PageHeader,
} from '@/shared/ui/layout/page-layout';

import { disclaimerRepository } from '../data/disclaimer-repository';

export function SafetyDisclaimerGate() {
  const router = useRouter();
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (agreed) {
      disclaimerRepository.setDisclaimerStatus(true);
      router.push('/drafts');
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <Page>
      <PageHeader>
        <span className="text-xl font-bold tracking-tight">
          {t('home.title')}
        </span>
      </PageHeader>

      <PageBody>
        <PageContainer className="flex max-w-2xl flex-col items-center">
          <HeroSection
            className="py-8 lg:py-12"
            title={t('disclaimer.title')}
          />

          <InfoCard className="w-full shadow-lg">
            <div className="space-y-6">
              <ul className="text-muted-foreground list-disc space-y-3 pl-5 text-sm">
                <li>
                  <strong>{t('disclaimer.point2Title')}</strong>{' '}
                  {t('disclaimer.point2Content')}
                </li>
                <li>
                  <strong>{t('disclaimer.point3Title')}</strong>{' '}
                  {t('disclaimer.point3Content')}
                </li>
                <li>
                  <strong>{t('disclaimer.point4Title')}</strong>{' '}
                  {t('disclaimer.point4Content')}
                </li>
                <li>
                  <strong>{t('disclaimer.point5Title')}</strong>{' '}
                  {t('disclaimer.point5Content')}
                </li>
              </ul>

              <div className="text-destructive text-sm font-medium">
                {t('disclaimer.emergency')}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="disclaimer-check"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="disclaimer-check"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('disclaimer.checkbox')}
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="w-full"
                disabled={!agreed}
                onClick={handleContinue}
              >
                {t('disclaimer.continueBtn')}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleExit}>
                {t('common.exit')}
              </Button>
            </div>
          </InfoCard>
        </PageContainer>
      </PageBody>

      <PageFooter>
        <p className="text-muted-foreground text-sm">{t('home.footerNote')}</p>
      </PageFooter>
    </Page>
  );
}
