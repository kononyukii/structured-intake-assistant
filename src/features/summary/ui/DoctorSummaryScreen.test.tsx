import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sanitizeDoctorSummary } from '@/features/safety/domain/output-safety';
import { createDoctorSummaryFixture } from '@/test/fixtures/summary-fixtures';

import { DoctorSummaryScreen } from './DoctorSummaryScreen';

const { onBackMock, onPrintMock } = vi.hoisted(() => ({
  onBackMock: vi.fn(),
  onPrintMock: vi.fn(),
}));

function renderSafeSummary() {
  const summary = createDoctorSummaryFixture();

  render(
    <DoctorSummaryScreen
      result={{
        decision: 'safe',
        data: summary,
        findings: [],
      }}
      onBack={onBackMock}
      onPrint={onPrintMock}
    />
  );

  return summary;
}

describe('DoctorSummaryScreen', () => {
  beforeEach(() => {
    onBackMock.mockReset();
    onPrintMock.mockReset();
  });

  it('renders a safe doctor summary with disclaimer, timestamp, and separate questions block', () => {
    const summary = renderSafeSummary();

    expect(screen.getAllByText('Doctor Summary')[0]).toBeInTheDocument();
    expect(screen.getAllByText(summary.header.disclaimer)).toHaveLength(2);
    expect(screen.getAllByText('Generated 2026-03-01 10:05 UTC')).toHaveLength(
      2
    );

    const questionsSection = screen.getByLabelText('Questions for Doctor');

    expect(
      within(questionsSection).getByText(
        'Should I mention that the cough is worse at night?'
      )
    ).toBeInTheDocument();
    expect(
      within(questionsSection).queryByText('Seasonal allergies')
    ).not.toBeInTheDocument();
  });

  it('renders sanitized content only when the summary is sanitized', () => {
    const summary = createDoctorSummaryFixture();
    const result = sanitizeDoctorSummary({
      ...summary,
      notes: 'Patient reports a dry cough for 3 days. Go to the ER now.',
      questionsForDoctor: [
        ...summary.questionsForDoctor,
        {
          question: 'Go to the ER now.',
        },
      ],
    });

    if (result.decision === 'blocked') {
      throw new Error('Expected summary sanitization to succeed.');
    }

    render(
      <DoctorSummaryScreen
        result={result}
        onBack={onBackMock}
        onPrint={onPrintMock}
      />
    );

    expect(
      screen.getByText(
        'Some unsafe phrasing was removed before this summary was shown.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Patient reports a dry cough for 3 days.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Go to the ER now.')).not.toBeInTheDocument();
  });

  it('renders a neutral blocked state when output safety blocks the summary', () => {
    const summary = createDoctorSummaryFixture();
    const result = sanitizeDoctorSummary({
      ...summary,
      timeline: {
        ...summary.timeline,
        duration: {
          state: 'present',
          detail: 'This suggests pneumonia',
        },
      },
    });

    expect(result.decision).toBe('blocked');

    render(
      <DoctorSummaryScreen
        result={result}
        onBack={onBackMock}
        onPrint={onPrintMock}
      />
    );

    expect(screen.getByText('Summary preview unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This summary could not be displayed or exported safely. You can return to the intake on this device and continue with the deterministic flow.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Print / Export PDF' })
    ).not.toBeInTheDocument();
  });

  it('keeps long text wrapped safely and wires the print action', () => {
    const longNotes =
      'verylongsummarytextwithoutbreaks'.repeat(12) +
      ' patient-reported details remain factual and neutral.';
    const summary = createDoctorSummaryFixture();

    render(
      <DoctorSummaryScreen
        result={{
          decision: 'safe',
          data: {
            ...summary,
            notes: longNotes,
          },
          findings: [],
        }}
        onBack={onBackMock}
        onPrint={onPrintMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Print / Export PDF' }));

    expect(onPrintMock).toHaveBeenCalledOnce();
    expect(screen.getByText(longNotes)).toHaveClass(
      'whitespace-pre-wrap',
      'break-words'
    );
  });
});
