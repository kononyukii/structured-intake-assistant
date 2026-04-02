import { describe, expect, it } from 'vitest';

import { DoctorSummarySchema } from '@/features/summary/domain/doctor-summary-schema';
import { createDoctorSummaryFixture } from '@/test/fixtures/summary-fixtures';

import {
  analyzeOutputText,
  SAFE_DOCTOR_SUMMARY_DISCLAIMER,
  sanitizeClarifyingQuestionOutput,
  sanitizeDoctorSummary,
  sanitizeOutputText,
  sanitizeSummaryRewriteOutput,
} from './output-safety';

describe('output-safety', () => {
  it('passes a safe clarifying question through unchanged', () => {
    const output = {
      operation: 'clarifying_question_generation' as const,
      question: {
        id: 'clarify-timeline',
        type: 'free_text' as const,
        prompt: 'When did the cough begin, and how has it changed since then?',
        multiline: true,
      },
      rationale: 'Collects missing timeline detail without interpretation.',
    };

    expect(sanitizeClarifyingQuestionOutput(output)).toEqual({
      decision: 'safe',
      data: output,
      findings: [],
    });
  });

  it('detects diagnosis phrasing', () => {
    expect(
      analyzeOutputText('This suggests pneumonia.', 'summary.notes')[0],
    ).toMatchObject({
      category: 'diagnosis',
      path: 'summary.notes',
      excerpt: 'This suggests',
    });
  });

  it('detects treatment recommendation phrasing', () => {
    expect(
      analyzeOutputText('You should take ibuprofen.', 'question.prompt')[0],
    ).toMatchObject({
      category: 'treatment',
      path: 'question.prompt',
      excerpt: 'You should take',
    });
  });

  it('detects triage phrasing', () => {
    expect(
      analyzeOutputText('Go to the ER now.', 'summary.notes')[0],
    ).toMatchObject({
      category: 'triage',
      path: 'summary.notes',
      excerpt: 'Go to the ER',
    });
  });

  it('detects disease ranking phrasing', () => {
    expect(
      analyzeOutputText('This is likely a viral infection.', 'summary.notes')[0],
    ).toMatchObject({
      category: 'disease_ranking',
      path: 'summary.notes',
      excerpt: 'This is likely',
    });
  });

  it('blocks text when deterministic safe rewriting is not guaranteed', () => {
    expect(
      sanitizeOutputText('This is likely pneumonia', 'complaint.detail'),
    ).toEqual({
      decision: 'blocked',
      findings: [
        {
          category: 'disease_ranking',
          action: 'block',
          path: 'complaint.detail',
          excerpt: 'This is likely',
        },
      ],
    });
  });

  it('preserves valid safe summaries unchanged', () => {
    const summary = createDoctorSummaryFixture();
    const result = sanitizeDoctorSummary(summary);

    expect(result).toEqual({
      decision: 'safe',
      data: summary,
      findings: [],
    });

    if (result.decision === 'blocked') {
      throw new Error('Expected safe summary result.');
    }

    expect(DoctorSummarySchema.parse(result.data)).toEqual(summary);
  });

  it('sanitizes removable unsafe summary text and keeps the schema valid', () => {
    const summary = createDoctorSummaryFixture();
    const result = sanitizeDoctorSummary({
      ...summary,
      header: {
        ...summary.header,
        disclaimer: 'Go to the ER now.',
      },
      notes: 'Patient reports a dry cough for 3 days. Go to the ER now.',
      questionsForDoctor: [
        ...summary.questionsForDoctor,
        {
          question: 'Go to the ER now.',
        },
      ],
    });

    expect(result.decision).toBe('sanitized');

    if (result.decision === 'blocked') {
      throw new Error('Expected summary sanitization to succeed.');
    }

    expect(result.data.notes).toBe('Patient reports a dry cough for 3 days.');
    expect(result.data.header.disclaimer).toBe(SAFE_DOCTOR_SUMMARY_DISCLAIMER);
    expect(result.data.questionsForDoctor).toEqual(summary.questionsForDoctor);
    expect(DoctorSummarySchema.parse(result.data)).toEqual(result.data);
    expect(summary.notes).toBeDefined();
    expect(summary.questionsForDoctor).toHaveLength(1);
  });

  it('blocks summaries when a required present field cannot be sanitized safely', () => {
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

    expect(result).toEqual({
      decision: 'blocked',
      findings: [
        {
          category: 'diagnosis',
          action: 'block',
          path: 'timeline.duration.detail',
          excerpt: 'This suggests',
        },
      ],
    });
  });

  it('sanitizes summary rewrite output for future preview and export use', () => {
    const summary = createDoctorSummaryFixture();
    const result = sanitizeSummaryRewriteOutput({
      operation: 'summary_rewrite',
      summary: {
        ...summary,
        notes: 'Dry cough for 3 days. Seek urgent care.',
      },
    });

    expect(result.decision).toBe('sanitized');

    if (result.decision === 'blocked') {
      throw new Error('Expected summary rewrite sanitization to succeed.');
    }

    expect(result.data.summary.notes).toBe('Dry cough for 3 days.');
    expect(DoctorSummarySchema.parse(result.data.summary)).toEqual(result.data.summary);
  });
});
