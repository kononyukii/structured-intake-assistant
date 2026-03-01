'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { draftsRepository } from '@/features/drafts/data/drafts-repository';
import { disclaimerRepository } from '@/features/safety/data/disclaimer-repository';
import { isAccepted } from '@/features/safety/domain/disclaimer';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
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

      <PageBody className="flex flex-col items-center justify-center space-y-12 py-12">
        {/* Hero Section */}
        <div className="max-w-2xl space-y-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t('home.title')}
          </h1>
          <p className="text-muted-foreground text-xl">
            {t('home.description')}
          </p>
        </div>

        {/* Trust Chips Block */}
        <Card className="bg-muted/30 w-full max-w-2xl border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-center gap-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium"
              >
                {t('home.trust.noAccount')}
              </Badge>
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium"
              >
                {t('home.trust.localOnly')}
              </Badge>
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium"
              >
                {t('home.trust.noTracking')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* CTA Row */}
        <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
          <Link href={getStartedHref} className="flex-1">
            <Button className="h-12 w-full text-lg" size="lg">
              {t('home.getStarted')}
            </Button>
          </Link>
          {hasDrafts && (
            <Link href="/drafts" className="flex-1">
              <Button
                variant="outline"
                className="h-12 w-full text-lg"
                size="lg"
              >
                {t('home.continue')}
              </Button>
            </Link>
          )}
        </div>
      </PageBody>

      <PageFooter>
        <p className="text-muted-foreground text-sm">{t('home.footerNote')}</p>
      </PageFooter>
    </Page>
  );
}
