/**
 * Period-key helpers mirroring the SQL definitions (SA local time):
 * daily 'YYYY-MM-DD' · weekly ISO 'IYYY-Wxx' · grand 'YYYY-MM'.
 */

const ZA_TZ = 'Africa/Johannesburg';

/** Current date in SA as a Date whose Y/M/D fields are the SA calendar day. */
function zaToday(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZA_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const [y, m, d] = parts.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDaily(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO week key, matching Postgres to_char(date, 'IYYY"-W"IW'). */
function fmtWeekly(d: Date): string {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // ISO: Thursday of the current week determines the week-year.
  const day = (t.getDay() + 6) % 7; // Mon=0..Sun=6
  t.setDate(t.getDate() - day + 3);
  const isoYear = t.getFullYear();
  const jan4 = new Date(isoYear, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1Mon = new Date(isoYear, 0, 4 - jan4Day);
  const week = Math.round((t.getTime() - week1Mon.getTime()) / (7 * 86_400_000)) + 1;
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function fmtGrand(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface PeriodInfo {
  open: string;    // period currently accepting entries
  closed: string;  // most recently closed period (the one to draw)
}

export function periods(): { daily: PeriodInfo; weekly: PeriodInfo; grand: PeriodInfo } {
  const today = zaToday();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return {
    daily:  { open: fmtDaily(today),  closed: fmtDaily(yesterday) },
    weekly: { open: fmtWeekly(today), closed: fmtWeekly(lastWeek) },
    grand:  { open: fmtGrand(today),  closed: fmtGrand(lastMonth) },
  };
}
