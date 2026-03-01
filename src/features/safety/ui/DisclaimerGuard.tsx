'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { disclaimerRepository } from '../data/disclaimer-repository';
import { isAccepted } from '../domain/disclaimer';

interface DisclaimerGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side guard that prevents access to protected routes
 * if the safety disclaimer hasn't been accepted.
 */
export function DisclaimerGuard({ children }: DisclaimerGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const status = disclaimerRepository.getDisclaimerStatus();
    const hasAccepted = isAccepted(status);

    // Defer update to avoid "cascading render" lint error
    Promise.resolve().then(() => {
      setAccepted(hasAccepted);
      setIsChecking(false);

      if (!hasAccepted) {
        router.replace('/disclaimer');
      }
    });
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!accepted) {
    return null;
  }

  return <>{children}</>;
}
