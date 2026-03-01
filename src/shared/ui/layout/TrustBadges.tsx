import * as React from 'react';

import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

interface TrustBadgesProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TrustBadges({ className, ...props }: TrustBadgesProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn('flex flex-wrap justify-center gap-3', className)}
      {...props}
    >
      <Badge
        variant="secondary"
        className="bg-muted/50 hover:bg-muted/80 px-4 py-1.5 text-sm font-medium transition-colors"
      >
        {t('home.trust.noAccount')}
      </Badge>
      <Badge
        variant="secondary"
        className="bg-muted/50 hover:bg-muted/80 px-4 py-1.5 text-sm font-medium transition-colors"
      >
        {t('home.trust.localOnly')}
      </Badge>
      <Badge
        variant="secondary"
        className="bg-muted/50 hover:bg-muted/80 px-4 py-1.5 text-sm font-medium transition-colors"
      >
        {t('home.trust.noTracking')}
      </Badge>
    </div>
  );
}
