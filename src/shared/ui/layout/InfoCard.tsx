import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

interface InfoCardProps extends Omit<
  React.ComponentProps<typeof Card>,
  'title'
> {
  title?: React.ReactNode;
  footer?: React.ReactNode;
}

export function InfoCard({
  title,
  footer,
  children,
  className,
  ...props
}: InfoCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)} {...props}>
      {title && (
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title ? 'pt-0' : 'pt-6')}>
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
