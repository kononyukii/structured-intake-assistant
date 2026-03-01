'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Page,
  PageBody,
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

      <PageBody className="max-w-3xl py-12">
        <Card className="border-t-primary border-t-4 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {t('disclaimer.title')}
            </CardTitle>
            <CardDescription>{t('disclaimer.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <div className="bg-muted/50 space-y-3 rounded-lg p-4">
              <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-base">
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
              </ul>
            </div>

            <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border p-4 text-base">
              <p className="font-bold">{t('disclaimer.important')}</p>
              <p>{t('disclaimer.emergency')}</p>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <input
                type="checkbox"
                id="disclaimer-check"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="text-primary focus:ring-primary h-5 w-5 cursor-pointer rounded border-gray-300"
              />
              <label
                htmlFor="disclaimer-check"
                className="cursor-pointer text-sm leading-none font-medium select-none"
              >
                {t('disclaimer.checkbox')}
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              className="h-12 w-full text-lg sm:flex-1"
              size="lg"
              disabled={!agreed}
              onClick={handleContinue}
            >
              {t('disclaimer.continueBtn')}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full px-8 text-lg sm:w-auto"
              size="lg"
              onClick={handleExit}
            >
              {t('common.exit')}
            </Button>
          </CardFooter>
        </Card>
      </PageBody>

      <PageFooter>
        <p className="text-muted-foreground text-sm">{t('home.footerNote')}</p>
      </PageFooter>
    </Page>
  );
}
