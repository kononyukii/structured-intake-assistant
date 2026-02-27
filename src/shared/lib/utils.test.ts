import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });
});
