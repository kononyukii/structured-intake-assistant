'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  AppFrame,
  WindowCard,
  WindowContent,
  WindowFooter,
  WindowTopBar,
} from '@/shared/ui/layout/app-frame';

export default function Home() {
  const { t } = useTranslation();

  return (
    <AppFrame width="wide">
      <WindowCard>
        <WindowTopBar title="Structured Intake Assistant" subtitle="for Primary Care" />

        <div className="flex min-h-[600px] items-center">
          <WindowContent className="w-full">
            <div className="grid items-center gap-12 md:gap-16 lg:grid-cols-2">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  <ShieldIcon className="size-4" />
                  Structured Intake Assistant
                </div>

                <h1 className="mb-3 text-4xl font-semibold text-slate-900 md:text-5xl">
                  Structured Intake Assistant
                </h1>
                <p className="mb-6 text-xl text-slate-600 md:text-2xl">for Primary Care</p>

                <p className="mb-8 text-lg text-slate-600">Prepare a structured summary for your primary care visit.</p>

                <div className="mb-10 flex flex-wrap gap-3">
                  <TrustChip icon={<CheckIcon className="size-4" />} label={t('home.trust.noAccount')} />
                  <TrustChip icon={<LockIcon className="size-4" />} label={t('home.trust.localOnly')} />
                  <TrustChip icon={<ShieldIcon className="size-4" />} label={t('home.trust.noTracking')} />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 w-full bg-blue-600 px-6 text-base text-white hover:bg-blue-700 sm:w-auto"
                  >
                    <Link href="/disclaimer">{t('home.getStarted')}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 w-full border-slate-200 bg-white px-5 text-base text-slate-700 shadow-none sm:w-auto"
                  >
                    <Link href="/intake" className="inline-flex items-center gap-2">
                      {t('home.continue')}
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="hidden items-center justify-center md:flex">
                <div className="relative w-full max-w-md">
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-blue-200 pb-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600">
                          <FileCheckIcon className="size-6 text-white" />
                        </div>
                        <div>
                          <div className="h-3 w-32 rounded bg-blue-600/20" />
                          <div className="mt-2 h-2 w-24 rounded bg-blue-600/10" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="rounded-lg border border-blue-100 bg-white p-3">
                            <div className="mb-2 h-2 w-20 rounded bg-slate-300" />
                            <div className="h-3 w-full rounded bg-slate-100" />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="h-2 w-16 rounded bg-blue-600/20" />
                          <div className="h-2 w-12 rounded bg-blue-600/20" />
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-blue-200">
                          <div className="h-full w-3/5 rounded-full bg-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-4 -right-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    Privacy First
                  </div>
                </div>
              </div>
            </div>
          </WindowContent>
        </div>

        <WindowFooter>{t('home.footerNote')}</WindowFooter>
      </WindowCard>
    </AppFrame>
  );
}

interface TrustChipProps {
  icon: ReactNode;
  label: string;
}

function TrustChip({ icon, label }: TrustChipProps) {
  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
    >
      {icon}
      <span>{label}</span>
    </Badge>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3.5 8L6.5 11L12.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M8 1.5L3 3.5V7.5C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7.5V3.5L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6.5 3.5L10.5 8L6.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M9 11L12 14L22 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
