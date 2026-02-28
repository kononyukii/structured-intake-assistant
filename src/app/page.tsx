import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="border-muted w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {t('home.title')}
          </CardTitle>
          <p className="text-muted-foreground mt-2">{t('home.description')}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="space-y-2">
            <label
              htmlFor="intake-overview"
              className="text-sm leading-none font-medium"
            >
              {t('home.overview')}
            </label>
            <Input
              id="intake-overview"
              placeholder={t('home.placeholder')}
              className="w-full"
            />
          </div>
          <Link href="/intake" className="w-full">
            <Button className="w-full" size="lg">
              {t('home.getStarted')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
