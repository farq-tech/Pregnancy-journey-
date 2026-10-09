/**
 * Maps journal vitals onto gestational weeks so the pregnancy file can draw
 * charts. A week with several readings keeps the latest one — clinics chart
 * the most recent measurement in that week, not an average.
 */

import { diffDays, fromIso } from './dates';
import type { JournalEntry } from '../store/types';

export type WeekPoint = {
  week: number;
  value: number;
};

export function weekOf(entryDate: string, effectiveLmp: Date): number {
  return Math.floor(diffDays(fromIso(entryDate), effectiveLmp) / 7) + 1;
}

function latestByWeek(
  entries: readonly JournalEntry[],
  effectiveLmp: Date,
  read: (entry: JournalEntry) => number | null,
): WeekPoint[] {
  const byWeek = new Map<number, { date: string; value: number }>();
  for (const entry of entries) {
    const value = read(entry);
    if (value == null) continue;
    const week = weekOf(entry.date, effectiveLmp);
    if (week < 1 || week > 42) continue;
    const current = byWeek.get(week);
    if (!current || entry.date >= current.date) {
      byWeek.set(week, { date: entry.date, value });
    }
  }
  return [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, { value }]) => ({ week, value }));
}

export function weightSeries(entries: readonly JournalEntry[], effectiveLmp: Date): WeekPoint[] {
  return latestByWeek(entries, effectiveLmp, (e) => e.weight);
}

export function systolicSeries(entries: readonly JournalEntry[], effectiveLmp: Date): WeekPoint[] {
  return latestByWeek(entries, effectiveLmp, (e) => e.bpSystolic);
}

export function diastolicSeries(entries: readonly JournalEntry[], effectiveLmp: Date): WeekPoint[] {
  return latestByWeek(entries, effectiveLmp, (e) => e.bpDiastolic);
}

export function fundalSeries(entries: readonly JournalEntry[], effectiveLmp: Date): WeekPoint[] {
  return latestByWeek(entries, effectiveLmp, (e) => e.fundalHeightCm);
}
