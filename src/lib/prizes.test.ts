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

  it('weekly draw is next Sunday 19:00', () => {
    const wed = new Date(2026, 6, 22, 10, 0); // Wed 22 Jul 2026
    const d = nextWeeklyDraw(wed);
    expect(d.getDay()).toBe(0);
    expect([d.getDate(), d.getHours()]).toEqual([26, 19]);
  });

  it('weekly draw on a Sunday before 19:00 is the same day; after, next week', () => {
    const sunMorning = new Date(2026, 6, 26, 9, 0); // Sun 26 Jul
    expect(nextWeeklyDraw(sunMorning).getDate()).toBe(26);
    const sunEvening = new Date(2026, 6, 26, 20, 0);
    expect(nextWeeklyDraw(sunEvening).getDate()).toBe(2); // Sun 2 Aug
  });

  it('grand draw is first of next month at noon', () => {
    const now = new Date(2026, 6, 26);
    const d = nextGrandDraw(now);
    expect([d.getMonth(), d.getDate(), d.getHours()]).toEqual([7, 1, 12]);
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
  it('grows with wins and coins, never negative, grand > daily', () => {
    expect(demoEntries(null, 'grand')).toBe(0);
    const p = { wins: 10, coins: 760 };
    const grand = demoEntries(p, 'grand');
    const daily = demoEntries(p, 'daily');
    expect(grand).toBe(126); // 10*5 + 76
    expect(daily).toBeLessThan(grand);
    expect(demoEntries({ wins: 0, coins: 0 }, 'daily')).toBe(1); // always at least 1 hope
  });
});

describe('formatRand', () => {
  it('formats with thousands separator', () => {
    expect(formatRand(3250)).toMatch(/^R3[\s,  ]250$/);
    expect(formatRand(250)).toBe('R250');
  });
});
