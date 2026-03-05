import { describe, expect, it } from 'vitest';

import {
  createEmptyIntakeSession,
  INTAKE_SESSION_SCHEMA_VERSION,
  IntakeSessionSchema,
} from './intake-session-schema';

describe('IntakeSessionSchema', () => {
  it('accepts an empty session from createEmptyIntakeSession', () => {
    const session = createEmptyIntakeSession();

    expect(IntakeSessionSchema.parse(session)).toEqual(session);
  });

  it('rejects a session with invalid schemaVersion', () => {
    const session = createEmptyIntakeSession();

    const result = IntakeSessionSchema.safeParse({
      ...session,
      schemaVersion: INTAKE_SESSION_SCHEMA_VERSION + 1,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid boolean fact state values', () => {
    const session = createEmptyIntakeSession();

    const result = IntakeSessionSchema.safeParse({
      ...session,
      redFlags: {
        severeHeadache: 'maybe',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid text field objects', () => {
    const session = createEmptyIntakeSession();

    const result = IntakeSessionSchema.safeParse({
      ...session,
      chiefComplaint: {
        summary: {
          kind: 'value',
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts explicit denied states for scalar and collection fields', () => {
    const session = createEmptyIntakeSession();

    const result = IntakeSessionSchema.safeParse({
      ...session,
      history: {
        ...session.history,
        surgeries: { kind: 'denied' },
      },
      timeline: {
        ...session.timeline,
        onset: { kind: 'denied' },
      },
      medications: { kind: 'denied' },
      allergiesIntolerances: { kind: 'unknown' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects collection values without explicit state wrapper', () => {
    const session = createEmptyIntakeSession();

    const result = IntakeSessionSchema.safeParse({
      ...session,
      medications: [],
    });

    expect(result.success).toBe(false);
  });
});
