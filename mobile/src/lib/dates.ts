/**
 * Calendar-day arithmetic. Everything here works on *local* civil dates, never
 * UTC instants: a pregnancy day boundary is midnight where the mother is, and
 * `toISOString()` would shift that by the timezone offset.
 */

/** `YYYY-MM-DD`, the shape Postgres `date` columns round-trip as. */
export type IsoDate = string;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local-date ISO string. Deliberately not `toISOString()` — see file header. */
export function toIso(d: Date): IsoDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses `YYYY-MM-DD` into local midnight. */
export function fromIso(s: IsoDate): Date {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Strips the time component, keeping the local calendar day. */
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Whole days from `b` to `a`. Rounded because a DST transition makes the raw
 * millisecond difference 23 or 25 hours rather than 24.
 */
export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 864e5);
}

export function isoToday(): IsoDate {
  return toIso(new Date());
}
