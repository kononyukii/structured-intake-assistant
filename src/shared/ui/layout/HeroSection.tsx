import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface HeroSectionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}

export function HeroSection({
  title,
  subtitle,
  badges,
  actions,
  className,
  ...props
}: HeroSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-8 py-12 text-center lg:py-24',
        className
      )}
      {...props}
    >
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl sm:text-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {badges && (
        <div className="flex flex-wrap justify-center gap-3">{badges}</div>
      )}

      {actions && (
        <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
          {actions}
        </div>
      )}
    </div>
  );
}
