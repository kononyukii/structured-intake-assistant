import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
