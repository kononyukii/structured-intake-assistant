'use client';

import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Link from 'next/link';

export default function IntakePage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t('wizard.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t('wizard.placeholder')}</p>
          <div className="pt-4">
            <Link href="/">
              <Button variant="outline">{t('wizard.backHome')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
