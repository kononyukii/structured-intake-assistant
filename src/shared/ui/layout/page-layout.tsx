import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Page({ children, className, ...props }: PageProps) {
  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-screen flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function PageHeader({ children, className, ...props }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur',
        className
      )}
      {...props}
    >
      <div className="container mx-auto flex h-16 max-w-[1120px] items-center px-4 md:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
}

interface PageBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageBody({ children, className, ...props }: PageBodyProps) {
  return (
    <main
      className={cn(
        'container mx-auto max-w-[1120px] flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

interface PageFooterProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function PageFooter({ children, className, ...props }: PageFooterProps) {
  return (
    <footer className={cn('border-t py-6 md:py-0', className)} {...props}>
      <div className="container mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 px-4 md:h-24 md:flex-row md:px-6 lg:px-8">
        {children}
      </div>
    </footer>
  );
}
export * from './HeroSection';
export * from './InfoCard';
export * from './PageContainer';
export * from './Section';
export * from './TrustBadges';
