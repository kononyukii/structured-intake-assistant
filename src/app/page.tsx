'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { draftsRepository } from '@/features/drafts/data/drafts-repository';
import { disclaimerRepository } from '@/features/safety/data/disclaimer-repository';
import { isAccepted } from '@/features/safety/domain/disclaimer';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Page,
  PageBody,
  PageFooter,
  PageHeader,
} from '@/shared/ui/layout/page-layout';

export default function Home() {
  const { t } = useTranslation();
  const [hasDrafts, setHasDrafts] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Defer update to avoid "cascading render" lint error
    Promise.resolve().then(() => {
      setHasDrafts(draftsRepository.hasAnyDrafts());
      setAccepted(isAccepted(disclaimerRepository.getDisclaimerStatus()));
    });
  }, []);

  const getStartedHref = accepted ? '/drafts' : '/disclaimer';

  return (
    <Page>
      <PageHeader>
        <span className="text-xl font-bold tracking-tight">
          {t('home.title')}
        </span>
      </PageHeader>

      <PageBody className="flex flex-col items-center justify-center space-y-12 py-12 lg:py-24">
        {/* Hero Section */}
        <div className="max-w-3xl space-y-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t('home.title')}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl sm:text-2xl">
            {t('home.description')}
          </p>
        </div>

        {/* Trust Chips Block */}
        <div className="flex flex-wrap justify-center gap-3">
          <Badge
            variant="secondary"
            className="bg-muted/50 hover:bg-muted/80 px-4 py-1.5 text-sm font-medium transition-colors"
          >
            {t('home.trust.noAccount')}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-muted/50 hover:bg-muted/80 px-4 py-1.5 text-sm font-medium transition-colors"
          >
            {t('home.trust.localOnly')}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-muted/50 hover:bg-muted/80 px-4 py-1.5 text-sm font-medium transition-colors"
          >
            {t('home.trust.noTracking')}
          </Badge>
        </div>

        {/* CTA Row */}
        <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
          <Link href={getStartedHref} className="flex-1">
            <Button className="h-14 w-full text-lg font-semibold" size="lg">
              {t('home.getStarted')}
            </Button>
          </Link>
          {hasDrafts && (
            <Link href="/drafts" className="flex-1">
              <Button
                variant="outline"
                className="h-14 w-full text-lg font-semibold"
                size="lg"
              >
                {t('home.continue')}
              </Button>
            </Link>
          )}
        </div>

        {/* Optional: Minimal "Does not do" note to ensure no medical claims */}
        <div className="text-muted-foreground max-w-md text-center text-sm italic">
          <p>{t('disclaimer.point2Content')}</p>
        </div>
      </PageBody>

      <PageFooter>
        <div className="flex w-full flex-col items-center justify-between gap-4 border-t py-6 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            {t('home.footerNote')}
          </p>
          <p className="text-muted-foreground text-xs opacity-70">
            Structured Intake Assistant v3
          </p>
        </div>
      </PageFooter>
    </Page>
  );
}
