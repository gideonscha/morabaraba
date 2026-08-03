import { describe, it, expect } from 'vitest';
import {
  nextDailyDraw, nextWeeklyDraw, nextGrandDraw,
  countdownTo, countdownLabel, demoEntries, formatRand,
} from './prizes';

describe('draw scheduling', () => {
  it('daily draw is next local midnight', () => {
    const now = new Date(2026, 6, 26, 15, 30); // 26 Jul 2026, 15:30
    const d = nextDailyDraw(now);
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 6, 27, 0]);
  });

  it('weekly draw closes end of Sunday (Monday 00:00)', () => {
    const wed = new Date(2026, 6, 22, 10, 0); // Wed 22 Jul 2026
    const d = nextWeeklyDraw(wed);
    expect(d.getDay()).toBe(1); // Monday
    expect([d.getDate(), d.getHours()]).toEqual([27, 0]);
  });

  it('weekly draw on a Sunday closes that night; on a Monday, next week', () => {
    const sun = new Date(2026, 6, 26, 9, 0); // Sun 26 Jul
    expect(nextWeeklyDraw(sun).getDate()).toBe(27); // Mon 27 Jul 00:00
    const mon = new Date(2026, 6, 27, 8, 0); // Mon 27 Jul
    expect(nextWeeklyDraw(mon).getDate()).toBe(3); // Mon 3 Aug 00:00
  });

  it('grand draw closes end of month (first of next month, 00:00)', () => {
    const now = new Date(2026, 6, 26);
    const d = nextGrandDraw(now);
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([7, 1, 0]);
  });
});

describe('countdown', () => {
  it('splits remaining time into parts', () => {
    const now = new Date(2026, 6, 26, 12, 0, 0);
    const target = new Date(2026, 6, 28, 14, 30, 15);
    const c = countdownTo(target, now);
    expect([c.days, c.hours, c.minutes, c.seconds]).toEqual([2, 2, 30, 15]);
  });

  it('clamps past targets to zero', () => {
    const now = new Date(2026, 6, 26);
    const c = countdownTo(new Date(2026, 6, 20), now);
    expect(c.totalMs).toBe(0);
  });

  it('labels adapt to scale', () => {
    const now = new Date(2026, 6, 26, 12, 0);
    expect(countdownLabel(new Date(2026, 7, 13, 12, 0), now)).toBe('18 days');
    expect(countdownLabel(new Date(2026, 6, 26, 18, 12), now)).toBe('6h 12m');
    expect(countdownLabel(new Date(2026, 6, 26, 12, 42), now)).toBe('42m');
  });
});

describe('demo entries', () => {
  it('is 1 entry per 10 coins, identical across pools', () => {
    expect(demoEntries(null, 'grand')).toBe(0);
    const p = { wins: 10, coins: 126 };
    expect(demoEntries(p, 'grand')).toBe(12);
    expect(demoEntries(p, 'daily')).toBe(12);
    expect(demoEntries({ wins: 0, coins: 9 }, 'daily')).toBe(0);
  });
});

describe('formatRand', () => {
  it('formats with thousands separator', () => {
    expect(formatRand(3250)).toMatch(/^R3[\s,  ]250$/);
    expect(formatRand(250)).toBe('R250');
  });
});
