import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

export default function Home() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="border-muted w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Structured Intake Assistant for Primary Care
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Organize intake information before a primary care visit.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="space-y-2">
            <label
              htmlFor="intake-overview"
              className="text-sm leading-none font-medium"
            >
              Overview
            </label>
            <Input
              id="intake-overview"
              placeholder="Describe symptoms, concerns, medications, and history."
              className="w-full"
            />
          </div>
          <Button className="w-full" size="lg">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
