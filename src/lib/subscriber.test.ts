import { describe, it, expect } from 'vitest';
import { parseDoiReturn } from './subscriber';

describe('parseDoiReturn (Worldplay DOI Return §3)', () => {
  it('treats ei=0 as a confirmed subscriber with MSISDN and details', () => {
    const r = parseDoiReturn({ cl: 'WP_Morabaraba', ei: '0', tn: '27821234567', nt: 'Telkom', sd: '2026-09-10' });
    expect(r.status).toBe('confirmed');
    expect(r.errorId).toBe(0);
    expect(r.msisdn).toBe('27821234567');
    expect(r.network).toBe('Telkom');
    expect(r.startDate).toBe('2026-09-10');
    expect(r.service).toBe('WP_Morabaraba');
  });

  it('treats ei=41 (already subscribed) as confirmed — returning subscriber', () => {
    expect(parseDoiReturn({ ei: '41', tn: '27821234567' }).status).toBe('confirmed');
  });

  it('accepts Vodacom faux MSISDNs (CTB:<subscription id>)', () => {
    const r = parseDoiReturn({ ei: '0', tn: 'CTB:5847596', nt: 'Vodacom' });
    expect(r.msisdn).toBe('CTB:5847596');
  });

  it('maps ei=986 to declined and keeps the message', () => {
    const r = parseDoiReturn({ ei: '986', em: 'User declined DOI request' });
    expect(r.status).toBe('declined');
    expect(r.errorMessage).toBe('User declined DOI request');
    expect(r.msisdn).toBeUndefined();
  });

  it('maps other non-zero ei to error', () => {
    expect(parseDoiReturn({ ei: '105', em: 'System error' }).status).toBe('error');
  });

  it('is unknown when ei is missing (e.g. someone typing /welcome)', () => {
    const r = parseDoiReturn({});
    expect(r.status).toBe('unknown');
    expect(r.errorId).toBeNull();
  });

  it('rejects malformed tn and sd values rather than storing junk', () => {
    const r = parseDoiReturn({ ei: '0', tn: '<script>', sd: 'yesterday' });
    expect(r.msisdn).toBeUndefined();
    expect(r.startDate).toBeUndefined();
  });
});
