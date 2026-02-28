'use client';

import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { disclaimerRepository } from '../data/disclaimer-repository';

export function SafetyDisclaimerGate() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (agreed) {
      disclaimerRepository.setDisclaimerStatus(true);
      router.push('/intake');
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="border-t-primary w-full max-w-2xl border-t-4 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Safety Disclaimer & Agreement
          </CardTitle>
          <CardDescription>
            Please review and acknowledge the following before starting the
            intake.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <div className="bg-muted/50 space-y-3 rounded-lg p-4">
            <p className="text-foreground font-semibold">
              This tool is a structured intake assistant designed to help you
              prepare for a primary care visit.
            </p>
            <ul className="text-muted-foreground list-disc space-y-2 pl-5">
              <li>
                <strong>Not a Doctor:</strong> This tool is not a clinician and
                does not provide medical advice.
              </li>
              <li>
                <strong>No Diagnosis:</strong> It does not diagnose medical
                conditions or estimate disease probability.
              </li>
              <li>
                <strong>No Treatment:</strong> It does not recommend treatments,
                medications, or procedures.
              </li>
              <li>
                <strong>No Triage:</strong> It does not provide emergency
                guidance or urgency/triage advice.
              </li>
              <li>
                <strong>Purpose:</strong> The output is a structured summary of
                information you provide, intended to support your discussion
                with a clinician.
              </li>
            </ul>
          </div>

          <div className="border-destructive/20 bg-destructive/5 text-destructive-foreground rounded-lg border p-4">
            <p className="font-bold">Important:</p>
            <p>
              If you believe you may be experiencing a medical emergency, please
              seek local emergency care immediately.
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <input
              type="checkbox"
              id="disclaimer-check"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="text-primary focus:ring-primary h-5 w-5 cursor-pointer rounded border-gray-300"
            />
            <label
              htmlFor="disclaimer-check"
              className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand and wish to continue
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            className="w-full sm:flex-1"
            size="lg"
            disabled={!agreed}
            onClick={handleContinue}
          >
            Continue to Intake
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            size="lg"
            onClick={handleExit}
          >
            Exit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
