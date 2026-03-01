'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { draftsRepository } from '@/features/drafts/data/drafts-repository';
import { disclaimerRepository } from '@/features/safety/data/disclaimer-repository';
import { isAccepted } from '@/features/safety/domain/disclaimer';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import {
  HeroSection,
  Page,
  PageBody,
  PageContainer,
  PageFooter,
  PageHeader,
  Section,
  TrustBadges,
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

      <PageBody>
        <PageContainer>
          <HeroSection
            title={t('home.title')}
            subtitle={t('home.description')}
            badges={<TrustBadges />}
            actions={
              <>
                <Link href={getStartedHref} className="flex-1">
                  <Button
                    className="h-14 w-full text-lg font-semibold"
                    size="lg"
                  >
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
              </>
            }
          />

          <Section className="flex flex-col items-center">
            <div className="text-muted-foreground max-w-md text-center text-sm italic">
              <p>{t('disclaimer.point2Content')}</p>
            </div>
          </Section>
        </PageContainer>
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
