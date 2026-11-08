import { describe, it, expect } from 'vitest';
import { decideAccess } from './access';

const cachedGrant = { msisdn: '27830000001', status: 'granted' as const, reason: null, checkedAt: 't' };
const cachedDeny = { ...cachedGrant, status: 'denied' as const };

describe('decideAccess (subscriber gate)', () => {
  it('grants when the server says the number is an active subscriber', () => {
    expect(decideAccess({ granted: true }, null)).toBe('granted');
  });
  it('denies when the server says no — even if a previous grant is cached (unsubscribe revokes)', () => {
    expect(decideAccess({ granted: false }, cachedGrant)).toBe('denied');
  });
  it('keeps a previously granted player playing when the server is unreachable', () => {
    expect(decideAccess(null, cachedGrant)).toBe('granted');
  });
  it('does not grant offline without a prior grant', () => {
    expect(decideAccess(null, null)).toBe('unknown');
    expect(decideAccess(null, cachedDeny)).toBe('unknown');
  });
});
