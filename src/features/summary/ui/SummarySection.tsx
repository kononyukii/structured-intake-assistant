import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

interface SummarySectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  accent?: boolean;
  children: React.ReactNode;
}

export function SummarySection({
  title,
  description,
  accent = false,
  className,
  children,
  ...props
}: SummarySectionProps) {
  return (
    <section
      aria-label={title}
      className={cn('print:break-inside-avoid', className)}
      {...props}
    >
      <Card
        className={cn(
          'gap-0 border-slate-200 shadow-sm',
          accent && 'border-blue-200 bg-blue-50/60'
        )}
      >
        <CardHeader className="gap-1 border-b border-slate-200 pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-slate-600">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </section>
  );
}
