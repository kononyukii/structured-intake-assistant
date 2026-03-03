export type UnsupportedReason = 'underage' | 'pregnancy' | 'emergency';

export interface ScopeGateContext {
  answers?: {
    pregnancyRelated?: boolean | null;
    emergency?: boolean | null;
    urgent?: boolean | null;
    contextText?: string | null;
  } | null;
}

export interface Session extends ScopeGateContext {
  age?: number | null;
}

const EMERGENCY_KEYWORD_REGEX = /\b(emergency|urgent)\b/i;
const NEGATED_EMERGENCY_REGEX = /\b(no|not)\s+(an?\s+)?(emergency|urgent)\b/i;

export function isUnderage(age: number): boolean {
  return Number.isFinite(age) && age < 18;
}

export function isPregnancyRelated(context: ScopeGateContext): boolean {
  return context.answers?.pregnancyRelated === true;
}

export function isEmergency(context: ScopeGateContext): boolean {
  if (context.answers?.emergency === true || context.answers?.urgent === true) {
    return true;
  }

  const text = context.answers?.contextText?.trim();
  if (!text) {
    return false;
  }

  return (
    EMERGENCY_KEYWORD_REGEX.test(text) &&
    !NEGATED_EMERGENCY_REGEX.test(text)
  );
}

export function detectUnsupportedContext(session: Session): UnsupportedReason[] {
  const reasons: UnsupportedReason[] = [];

  if (typeof session.age === 'number' && isUnderage(session.age)) {
    reasons.push('underage');
  }

  if (isPregnancyRelated(session)) {
    reasons.push('pregnancy');
  }

  if (isEmergency(session)) {
    reasons.push('emergency');
  }

  return reasons;
}
