/**
 * Journal photos grouped by gestational week, for the private memories album
 * and the "this week" collage.
 */

import type { Attachment } from './storage';
import type { JournalEntry } from '../store/types';
import { weekOf } from './antenatal';

export type WeekMemory = {
  week: number;
  entries: JournalEntry[];
  photos: Attachment[];
};

export function memoriesByWeek(
  entries: readonly JournalEntry[],
  attachments: readonly Attachment[],
  effectiveLmp: Date,
): WeekMemory[] {
  const photos = attachments.filter((a) => a.ownerType === 'journal' && a.kind === 'photo');
  const byWeek = new Map<number, WeekMemory>();

  for (const entry of entries) {
    const week = weekOf(entry.date, effectiveLmp);
    if (week < 1 || week > 42) continue;
    const current = byWeek.get(week) ?? { week, entries: [], photos: [] };
    current.entries.push(entry);
    current.photos.push(...photos.filter((p) => p.ownerId === entry.id));
    byWeek.set(week, current);
  }

  return [...byWeek.values()]
    .filter((m) => m.photos.length > 0 || m.entries.some((e) => e.text || e.mood))
    .sort((a, b) => b.week - a.week);
}
