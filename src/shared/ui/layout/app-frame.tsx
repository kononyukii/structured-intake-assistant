import * as React from 'react';

import { cn } from '@/shared/lib/utils';

type FrameWidth = 'narrow' | 'medium' | 'wide';

const frameWidths: Record<FrameWidth, string> = {
  narrow: 'max-w-[640px]',
  medium: 'max-w-[960px]',
  wide: 'max-w-[1100px]',
};

interface AppFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  width?: FrameWidth;
}

export function AppFrame({
  children,
  width = 'wide',
  className,
  ...props
}: AppFrameProps) {
  return (
    <div
      className={cn('min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 md:py-16', className)}
      {...props}
    >
      <div className={cn('mx-auto w-full', frameWidths[width])}>{children}</div>
    </div>
  );
}

export function WindowCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn('overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/60', className)}
      {...props}
    >
      {children}
    </section>
  );
}

interface WindowTopBarProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
}

export function WindowTopBar({
  title,
  subtitle,
  rightSlot,
  onBack,
  className,
  ...props
}: WindowTopBarProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-slate-200 px-6 py-4 md:px-10 md:py-5',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <BackIcon />
          </button>
        ) : (
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
            <LogoIcon />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs leading-tight text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {rightSlot ? <div className="ml-3 flex shrink-0 items-center">{rightSlot}</div> : null}
    </header>
  );
}

export function WindowContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-6 md:px-10 md:py-8', className)} {...props}>
      {children}
    </div>
  );
}

export function WindowFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn(
        'border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500 md:px-10 md:py-5',
        className
      )}
      {...props}
    >
      {children}
    </footer>
  );
}

function LogoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
