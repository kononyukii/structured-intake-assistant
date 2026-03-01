import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface SectionProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
  title?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({
  title,
  children,
  className,
  ...props
}: SectionProps) {
  return (
    <section className={cn('space-y-6 py-8', className)} {...props}>
      {title && (
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
