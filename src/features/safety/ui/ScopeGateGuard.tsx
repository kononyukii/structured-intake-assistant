'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { scopeGateRepository } from '../data/scope-gate-repository';

interface ScopeGateGuardProps {
  children: React.ReactNode;
}

const PUBLIC_SCOPE_GATE_PATHS = ['/disclaimer', '/start', '/unsupported'] as const;

function isPublicScopeGatePath(pathname: string): boolean {
  if (pathname === '/') {
    return true;
  }

  return PUBLIC_SCOPE_GATE_PATHS.some((publicPath) => {
    return pathname === publicPath || pathname.startsWith(`${publicPath}/`);
  });
}

/**
 * Client-side guard that blocks protected routes until scope gate is passed.
 */
export function ScopeGateGuard({ children }: ScopeGateGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPath = isPublicScopeGatePath(pathname);
  const [isChecking, setIsChecking] = useState(!isPublicPath);
  const [passed, setPassed] = useState(isPublicPath);
  const effectiveIsChecking = isPublicPath ? false : isChecking;
  const effectivePassed = isPublicPath ? true : passed;

  useEffect(() => {
    if (isPublicPath) {
      return;
    }

    const hasPassed = scopeGateRepository.getScopeGateStatus();

    Promise.resolve().then(() => {
      setPassed(hasPassed);
      setIsChecking(false);

      if (!hasPassed) {
        router.replace('/start');
      }
    });
  }, [isPublicPath, router, pathname]);

  if (effectiveIsChecking) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!effectivePassed) {
    return null;
  }

  return <>{children}</>;
}
