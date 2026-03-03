import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScopeGateForm } from './ScopeGateForm';

const { pushMock, setScopeGateStatusMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  setScopeGateStatusMock: vi.fn(),
}));

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
          'start.title': 'Before You Start',
          'start.description':
            'Please answer a few quick scope questions before intake.',
          'start.fields.pregnancy':
            'Is this related to pregnancy or obstetric concerns?',
          'start.fields.emergency': 'Is this an urgent or emergency situation?',
          'start.fields.adultConfirmation':
            'I confirm that I am 18 years old or older.',
          'start.options.yes': 'Yes',
          'start.options.no': 'No',
          'start.continue': 'Continue to Intake',
        } as Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock('@/features/safety/data/scope-gate-repository', () => ({
  scopeGateRepository: {
    setScopeGateStatus: setScopeGateStatusMock,
  },
}));

describe('ScopeGateForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    setScopeGateStatusMock.mockReset();
  });

  it('routes to intake when context is supported', () => {
    render(<ScopeGateForm />);

    const pregnancyFieldset = screen
      .getByText('Is this related to pregnancy or obstetric concerns?')
      .closest('fieldset');
    const emergencyFieldset = screen
      .getByText('Is this an urgent or emergency situation?')
      .closest('fieldset');

    if (!pregnancyFieldset || !emergencyFieldset) {
      throw new Error('Form fieldsets are missing');
    }

    fireEvent.click(within(pregnancyFieldset).getByLabelText('No'));
    fireEvent.click(within(emergencyFieldset).getByLabelText('No'));
    fireEvent.click(
      screen.getByLabelText('I confirm that I am 18 years old or older.')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Intake' }));

    expect(setScopeGateStatusMock).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith('/intake');
  });

  it('routes to unsupported when context is underage', () => {
    render(<ScopeGateForm />);

    const pregnancyFieldset = screen
      .getByText('Is this related to pregnancy or obstetric concerns?')
      .closest('fieldset');
    const emergencyFieldset = screen
      .getByText('Is this an urgent or emergency situation?')
      .closest('fieldset');

    if (!pregnancyFieldset || !emergencyFieldset) {
      throw new Error('Form fieldsets are missing');
    }

    fireEvent.click(within(pregnancyFieldset).getByLabelText('No'));
    fireEvent.click(within(emergencyFieldset).getByLabelText('No'));

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Intake' }));

    expect(setScopeGateStatusMock).toHaveBeenCalledWith(false);
    expect(pushMock).toHaveBeenCalledWith('/unsupported');
  });
});
