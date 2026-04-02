import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface SummaryFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export function SummaryField({
  label,
  children,
  className,
  contentClassName,
  ...props
}: SummaryFieldProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 print:break-inside-avoid',
        className
      )}
      {...props}
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
        {label}
      </p>
      <div
        className={cn(
          'mt-2 text-sm leading-6 [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-slate-900',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
