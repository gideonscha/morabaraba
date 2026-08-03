import { describe, it, expect } from 'vitest';
import { applyPointsEarn, currentMonthKey } from './profile';

describe('currentMonthKey', () => {
  it('formats YYYY-MM with zero padding', () => {
    expect(currentMonthKey(new Date(2026, 7, 3))).toBe('2026-08');
    expect(currentMonthKey(new Date(2026, 11, 31))).toBe('2026-12');
  });
});

describe('applyPointsEarn', () => {
  it('accumulates within the same month', () => {
    let p = applyPointsEarn({}, 3, '2026-08');
    expect(p).toEqual({ lifetime_points: 3, monthly_points: 3, month_key: '2026-08', best_monthly_score: 3 });
    p = applyPointsEarn(p, 1, '2026-08');
    expect(p.monthly_points).toBe(4);
    expect(p.lifetime_points).toBe(4);
    expect(p.best_monthly_score).toBe(4);
  });

  it('rolls monthly points over on a new month, keeping lifetime and best', () => {
    const july = applyPointsEarn({}, 120, '2026-07');
    const aug = applyPointsEarn(july, 3, '2026-08');
    expect(aug.monthly_points).toBe(3);       // reset + new earn
    expect(aug.lifetime_points).toBe(123);    // never resets
    expect(aug.best_monthly_score).toBe(120); // July's total preserved
  });

  it('updates best month when the current month overtakes it', () => {
    const july = applyPointsEarn({}, 10, '2026-07');
    let aug = applyPointsEarn(july, 8, '2026-08');
    expect(aug.best_monthly_score).toBe(10);
    aug = applyPointsEarn(aug, 5, '2026-08');
    expect(aug.best_monthly_score).toBe(13);
  });
});
