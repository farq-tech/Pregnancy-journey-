import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ArrowButton } from '../../../src/components/ArrowButton';
import { Screen } from '../../../src/components/Screen';
import { Txt } from '../../../src/components/Txt';
import { Card, Row } from '../../../src/components/layout';
import { useI18n } from '../../../src/i18n/LocaleProvider';
import { formatLong, formatMonthYear, weekdayShort } from '../../../src/lib/arabic';
import { diffDays, fromIso, toIso } from '../../../src/lib/dates';
import { TERM_DAYS, computeJourney, gestationalDayFor } from '../../../src/lib/pregnancy';
import { useJourney } from '../../../src/store/JourneyProvider';
import { colors } from '../../../src/theme';

type Cell =
  | { blank: true; key: string }
  | {
      blank: false;
      key: string;
      day: number;
      iso: string;
      inPregnancy: boolean;
      isToday: boolean;
      isPast: boolean;
      weekStart: boolean;
      hasAppointment: boolean;
      hasJournal: boolean;
      hasRecord: boolean;
      hasPhoto: boolean;
    };

export default function CalendarScreen() {
  const { t } = useI18n();
  const { settings, appointments, journal, records, attachments, today } = useJourney();
  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  const [view, setView] = useState(() => {
    const now = fromIso(today);
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const marked = useMemo(() => {
    const appointmentDays = new Set(appointments.map((a) => a.date));
    const journalDays = new Set(journal.map((j) => j.date));
    const recordDays = new Set(records.map((r) => r.date));

    // Photos hang off a record, journal entry or appointment rather than off a
    // date, so resolve each one back to the day its owner falls on.
    const dateByOwner = new Map<string, string>();
    for (const record of records) dateByOwner.set(`record:${record.id}`, record.date);
    for (const entry of journal) dateByOwner.set(`journal:${entry.id}`, entry.date);
    for (const appointment of appointments) {
      dateByOwner.set(`appointment:${appointment.id}`, appointment.date);
    }

    const photoDays = new Set<string>();
    for (const attachment of attachments) {
      if (attachment.kind !== 'photo') continue;
      const date = dateByOwner.get(`${attachment.ownerType}:${attachment.ownerId}`);
      if (date) photoDays.add(date);
    }

    return { appointmentDays, journalDays, recordDays, photoDays };
  }, [appointments, journal, records, attachments]);

  const cells = useMemo<Cell[]>(() => {
    if (!journey) return [];
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out: Cell[] = [];

    // Pad so the 1st lands under its weekday column (Sunday-first).
    for (let i = 0; i < first.getDay(); i += 1) out.push({ blank: true, key: `blank-${i}` });

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(view.year, view.month, day);
      const iso = toIso(date);
      const g = gestationalDayFor(journey, date);
      out.push({
        blank: false,
        key: iso,
        day,
        iso,
        inPregnancy: g !== null,
        isToday: iso === toIso(journey.today),
        isPast: diffDays(date, journey.today) < 0,
        // A dot on each week boundary, from week 4 onward.
        weekStart: g !== null && g % 7 === 0 && g >= 28,
        hasAppointment: marked.appointmentDays.has(iso),
        hasJournal: marked.journalDays.has(iso),
        hasRecord: marked.recordDays.has(iso),
        hasPhoto: marked.photoDays.has(iso),
      });
    }
    return out;
  }, [journey, marked, view]);

  if (!journey) return null;

  const shiftMonth = (delta: number) =>
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const dayLabel = (cell: Extract<Cell, { blank: false }>) =>
    [
      formatLong(fromIso(cell.iso)),
      cell.weekStart && t('calendar.legend.week'),
      cell.hasAppointment && t('calendar.legend.appointment'),
      cell.hasJournal && t('calendar.legend.journal'),
      cell.hasRecord && t('calendar.legend.record'),
      cell.hasPhoto && t('calendar.legend.photo'),
    ]
      .filter(Boolean)
      .join(t('baby.sourceSep'));

  return (
    <Screen>
      <Row justify="space-between">
        <ArrowButton direction="right" onPress={() => shiftMonth(-1)} label={t('cal.prevMonth')} />
        <Txt size={17} weight={600}>
          {formatMonthYear(new Date(view.year, view.month, 1))}
        </Txt>
        <ArrowButton direction="left" onPress={() => shiftMonth(1)} label={t('cal.nextMonth')} />
      </Row>

      <Card radius={20} padding={0} style={{ paddingVertical: 14, paddingHorizontal: 10 }}>
        <Row wrap style={{ marginBottom: 6 }}>
          {weekdayShort().map((name) => (
            <View key={name} style={{ width: `${100 / 7}%` }}>
              <Txt size={11} weight={500} color={colors.muted} align="center">
                {name}
              </Txt>
            </View>
          ))}
        </Row>

        <Row wrap>
          {cells.map((cell) =>
            cell.blank ? (
              <View key={cell.key} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
            ) : (
              <View key={cell.key} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                <Pressable
                  disabled={!cell.inPregnancy}
                  onPress={() => router.push({ pathname: '/calendar/[date]', params: { date: cell.iso } })}
                  accessibilityRole="button"
                  accessibilityLabel={dayLabel(cell)}
                  accessibilityState={{ selected: cell.isToday, disabled: !cell.inPregnancy }}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    borderWidth: cell.isToday ? 1.5 : 1,
                    borderColor: cell.isToday ? colors.sage : 'transparent',
                    backgroundColor: cell.isToday ? colors.sageSoft : 'transparent',
                  }}
                >
                  <Txt
                    size={13}
                    weight={cell.isToday ? 700 : 400}
                    align="center"
                    color={
                      cell.inPregnancy
                        ? cell.isPast
                          ? colors.muted
                          : colors.text
                        : colors.borderDashed
                    }
                  >
                    {String(cell.day)}
                  </Txt>
                  <Row gap={2} style={{ height: 4 }}>
                    {cell.weekStart ? <Dot color={colors.dotWeek} /> : null}
                    {cell.hasAppointment ? <Dot color={colors.dotAppt} /> : null}
                    {cell.hasJournal ? <Dot color={colors.dotJournal} /> : null}
                    {cell.hasRecord ? <Dot color={colors.dotRecord} /> : null}
                    {cell.hasPhoto ? <Dot color={colors.dotPhoto} /> : null}
                  </Row>
                </Pressable>
              </View>
            ),
          )}
        </Row>
      </Card>

      <Row wrap gap={12} justify="center">
        <LegendItem color={colors.dotWeek} label={t('calendar.legend.week')} />
        <LegendItem color={colors.dotAppt} label={t('calendar.legend.appointment')} />
        <LegendItem color={colors.dotJournal} label={t('calendar.legend.journal')} />
        <LegendItem color={colors.dotRecord} label={t('calendar.legend.record')} />
        <LegendItem color={colors.dotPhoto} label={t('calendar.legend.photo')} />
      </Row>

      <Txt size={12} color={colors.muted} align="center" lineHeight={1.6}>
        {t('cal.hint', { n: TERM_DAYS })}
      </Txt>
    </Screen>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={5}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Txt size={11} color={colors.muted}>
        {label}
      </Txt>
    </Row>
  );
}
