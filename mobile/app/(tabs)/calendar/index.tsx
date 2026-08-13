import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ArrowButton } from '../../../src/components/ArrowButton';
import { Screen } from '../../../src/components/Screen';
import { Txt } from '../../../src/components/Txt';
import { Card, Row } from '../../../src/components/layout';
import { WEEKDAY_SHORT, formatMonthYear } from '../../../src/lib/arabic';
import { diffDays, fromIso, toIso } from '../../../src/lib/dates';
import { computeJourney, gestationalDayFor } from '../../../src/lib/pregnancy';
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
    };

export default function CalendarScreen() {
  const { settings, appointments, journal, records, today } = useJourney();
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
    return { appointmentDays, journalDays, recordDays };
  }, [appointments, journal, records]);

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
        weekStart: g !== null && g % 7 === 0 && g >= 21,
        hasAppointment: marked.appointmentDays.has(iso),
        hasJournal: marked.journalDays.has(iso),
        hasRecord: marked.recordDays.has(iso),
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

  return (
    <Screen>
      <Row justify="space-between">
        <ArrowButton direction="right" onPress={() => shiftMonth(-1)} label="الشهر السابق" />
        <Txt size={17} weight={600}>
          {formatMonthYear(new Date(view.year, view.month, 1))}
        </Txt>
        <ArrowButton direction="left" onPress={() => shiftMonth(1)} label="الشهر التالي" />
      </Row>

      <Card radius={20} padding={0} style={{ paddingVertical: 14, paddingHorizontal: 10 }}>
        <Row wrap style={{ marginBottom: 6 }}>
          {WEEKDAY_SHORT.map((name) => (
            <View key={name} style={{ width: `${100 / 7}%` }}>
              <Txt size={10} weight={500} color={colors.faint} align="center">
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
                  accessibilityLabel={`${cell.day}`}
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
                  </Row>
                </Pressable>
              </View>
            ),
          )}
        </Row>
      </Card>

      <Row wrap gap={12} justify="center">
        <LegendItem color={colors.dotWeek} label="بداية أسبوع" />
        <LegendItem color={colors.dotAppt} label="موعد" />
        <LegendItem color={colors.dotJournal} label="يوميات" />
        <LegendItem color={colors.dotRecord} label="ملف" />
      </Row>

      <Txt size={12} color={colors.faint} align="center" lineHeight={1.6}>
        اضغطي أي يوم ضمن فترة الحمل لفتح تفاصيله — من اليوم 1 حتى اليوم 280
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
