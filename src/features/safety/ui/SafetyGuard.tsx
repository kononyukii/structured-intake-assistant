'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { disclaimerRepository } from '../data/disclaimer-repository';
import { isAccepted } from '../domain/disclaimer';

interface SafetyGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side guard that ensures the safety disclaimer is accepted
 * before allowing access to guarded routes.
 */
export function SafetyGuard({ children }: SafetyGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAcceptedState, setIsAcceptedState] = useState<boolean | null>(null);

  useEffect(() => {
    const status = disclaimerRepository.getDisclaimerStatus();
    const accepted = isAccepted(status);

    // Defer update to avoid "cascading render" lint error
    Promise.resolve().then(() => {
      setIsAcceptedState(accepted);
      if (!accepted && pathname !== '/disclaimer') {
        router.replace('/disclaimer');
      }
    });
  }, [router, pathname]);

  // Handle loading state
  if (isAcceptedState === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  // Prevents rendering children while redirecting
  if (isAcceptedState === false && pathname !== '/disclaimer') {
    return null;
  }

  return <>{children}</>;
}
