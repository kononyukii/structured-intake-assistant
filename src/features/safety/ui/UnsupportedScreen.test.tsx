import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnsupportedScreen } from './UnsupportedScreen';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        {
          'unsupported.title': 'Unsupported Scenario',
          'unsupported.description':
            'This tool is not appropriate for the current scenario.',
          'unsupported.limits.adultPrimaryCare':
            'This tool is designed for adult (18+) primary care.',
          'unsupported.limits.pregnancy':
            'It does not handle pregnancy or obstetric contexts.',
          'unsupported.limits.emergency':
            'It is not suitable for urgent or emergency situations.',
          'unsupported.returnHome': 'Return to Home',
        } as Record<string, string>
      )[key] ?? key,
  }),
}));

describe('UnsupportedScreen', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('renders neutral unsupported copy', () => {
    render(<UnsupportedScreen />);

    expect(screen.getByText('Unsupported Scenario')).toBeInTheDocument();
    expect(
      screen.getByText('This tool is not appropriate for the current scenario.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('This tool is designed for adult (18+) primary care.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('It does not handle pregnancy or obstetric contexts.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'It is not suitable for urgent or emergency situations.'
      )
    ).toBeInTheDocument();
  });

  it('navigates to home when CTA is clicked', () => {
    render(<UnsupportedScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Return to Home' }));

    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
