import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScopeGateGuard } from './ScopeGateGuard';

const { replaceMock, getScopeGateStatusMock, usePathnameMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getScopeGateStatusMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: usePathnameMock,
}));

vi.mock('@/features/safety/data/scope-gate-repository', () => ({
  scopeGateRepository: {
    getScopeGateStatus: getScopeGateStatusMock,
  },
}));

describe('ScopeGateGuard', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    getScopeGateStatusMock.mockReset();
    usePathnameMock.mockReset();
    usePathnameMock.mockReturnValue('/intake');
  });

  it('renders children when scope gate is passed', async () => {
    getScopeGateStatusMock.mockReturnValue(true);

    render(
      <ScopeGateGuard>
        <div>Protected Content</div>
      </ScopeGateGuard>
    );

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects to start when scope gate is not passed', async () => {
    getScopeGateStatusMock.mockReturnValue(false);

    render(
      <ScopeGateGuard>
        <div>Protected Content</div>
      </ScopeGateGuard>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/start');
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not enforce scope gate on public routes', async () => {
    usePathnameMock.mockReturnValue('/start');
    getScopeGateStatusMock.mockReturnValue(false);

    render(
      <ScopeGateGuard>
        <div>Public Content</div>
      </ScopeGateGuard>
    );

    expect(await screen.findByText('Public Content')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(getScopeGateStatusMock).not.toHaveBeenCalled();
  });
});
