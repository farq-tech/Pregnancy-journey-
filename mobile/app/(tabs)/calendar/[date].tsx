import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ArrowButton } from '../../../src/components/ArrowButton';
import { Screen } from '../../../src/components/Screen';
import { Txt } from '../../../src/components/Txt';
import { Card, Chip, Row } from '../../../src/components/layout';
import { WeekIllustration } from '../../../src/components/WeekIllustration';
import {
  DISCLAIMER,
  EMERGENCY_SIGNS,
  weekContent,
} from '../../../src/content/pregnancyData';
import {
  days,
  formatLong,
  formatWeekday,
  weekOrdinalLabel,
  weeks as weeksLabel,
} from '../../../src/lib/arabic';
import { addDays, fromIso, toIso } from '../../../src/lib/dates';
import { joinMeta } from '../../../src/lib/labels';
import { TERM_DAYS, computeJourney, gestationalDayFor } from '../../../src/lib/pregnancy';
import { useJourney } from '../../../src/store/JourneyProvider';
import { APPOINTMENT_TYPE_LABELS } from '../../../src/store/types';
import { colors } from '../../../src/theme';

export default function DayScreen() {
  const params = useLocalSearchParams<{ date: string }>();
  const { settings, appointments, journal, today } = useJourney();
  const [date, setDate] = useState(params.date ?? today);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  const detail = useMemo(() => {
    if (!journey) return null;
    const asDate = fromIso(date);
    const g = gestationalDayFor(journey, asDate);
    if (g === null) return null;
    const week = Math.floor(g / 7) + 1;
    return { asDate, gestationalDay: g, week, content: weekContent(week) };
  }, [date, journey]);

  if (!journey) return null;

  const shiftDay = (delta: number) => setDate(toIso(addDays(fromIso(date), delta)));

  const dayAppointments = appointments.filter((a) => a.date === date);
  const dayJournal = journal.filter((j) => j.date === date);

  return (
    <Screen>
      <Row justify="space-between">
        <ArrowButton direction="right" onPress={() => shiftDay(-1)} label="اليوم السابق" />
        <Pressable onPress={() => router.back()}>
          <Txt size={12.5} color={colors.muted}>
            ← عودة للتقويم
          </Txt>
        </Pressable>
        <ArrowButton direction="left" onPress={() => shiftDay(1)} label="اليوم التالي" />
      </Row>

      {!detail ? (
        <Card radius={20}>
          <Txt size={14} color={colors.muted} align="center" lineHeight={1.6}>
            هذا اليوم خارج فترة الحمل المحسوبة.
          </Txt>
        </Card>
      ) : (
        <>
          <Card>
            <Txt size={16} weight={600} align="center">
              {`${formatWeekday(detail.asDate)} ${formatLong(detail.asDate)}`}
            </Txt>
            <Row wrap gap={8} justify="center" style={{ marginTop: 10 }}>
              <Chip>
                <Txt size={12} weight={500} color={colors.sageDark}>
                  {`اليوم ${detail.gestationalDay} من ${TERM_DAYS}`}
                </Txt>
              </Chip>
              <Chip bg={colors.surfaceWarm}>
                <Txt size={12} weight={500} color={colors.sage}>
                  {weekOrdinalLabel(detail.week)}
                </Txt>
              </Chip>
              <Chip bg={colors.claySoft}>
                <Txt size={12} weight={500} color={colors.clayText}>
                  {weeksLabel(Math.floor(detail.gestationalDay / 7)) +
                    (detail.gestationalDay % 7 ? ` و${days(detail.gestationalDay % 7)}` : '')}
                </Txt>
              </Chip>
            </Row>
          </Card>

          <Card style={{ gap: 10 }}>
            <Row gap={14}>
              <WeekIllustration week={detail.week} size={72} />
              <View style={{ flex: 1 }}>
                <Txt size={15} weight={600}>
                  تطور الجنين 👶
                </Txt>
                {detail.content.size ? (
                  <Txt size={12.5} color={colors.muted} style={{ marginTop: 3 }}>
                    {joinMeta(detail.content.size, detail.content.compare)}
                  </Txt>
                ) : null}
              </View>
            </Row>
            <Txt size={14} color={colors.body} lineHeight={1.9}>
              {detail.content.baby}
            </Txt>
            {detail.content.appearance ? (
              <Txt size={13} color={colors.muted} lineHeight={1.8}>
                <Txt size={13} weight={600} color={colors.sage}>
                  شكل الجنين:{' '}
                </Txt>
                {detail.content.appearance}
              </Txt>
            ) : null}
            <Txt size={11.5} color={colors.faint} lineHeight={1.5}>
              المعلومة موثقة على مستوى الأسبوع — التفاصيل اليومية لا تُخترع.
            </Txt>
          </Card>

          <Card>
            <Txt size={15} weight={600} style={{ marginBottom: 8 }}>
              الأم 🤰
            </Txt>
            <Txt size={14} color={colors.body} lineHeight={1.9}>
              {detail.content.mom}
            </Txt>
            {detail.content.symptoms?.length ? (
              <Row wrap gap={6} style={{ marginTop: 10 }}>
                {detail.content.symptoms.map((symptom) => (
                  <Chip key={symptom} bg={colors.claySoft}>
                    <Txt size={12} color={colors.clayText}>
                      {symptom}
                    </Txt>
                  </Chip>
                ))}
              </Row>
            ) : null}
          </Card>

          {detail.content.milestones?.length ? (
            <Card>
              <Txt size={15} weight={600} style={{ marginBottom: 10 }}>
                محطات طبية هذا الأسبوع
              </Txt>
              <View style={{ gap: 8 }}>
                {detail.content.milestones.map((milestone) => (
                  <Row key={milestone} gap={8} align="flex-start">
                    <Txt size={13.5} color={colors.sageRing}>
                      ◆
                    </Txt>
                    <Txt size={13.5} color={colors.body} lineHeight={1.7} style={{ flex: 1 }}>
                      {milestone}
                    </Txt>
                  </Row>
                ))}
              </View>
            </Card>
          ) : null}

          {dayAppointments.length ? (
            <Card>
              <Txt size={15} weight={600} style={{ marginBottom: 10 }}>
                مواعيد هذا اليوم 📅
              </Txt>
              <View style={{ gap: 8 }}>
                {dayAppointments.map((appointment) => (
                  <Txt key={appointment.id} size={13.5} lineHeight={1.6}>
                    <Txt size={13.5} weight={600}>
                      {appointment.title}
                    </Txt>
                    <Txt size={13.5} color={colors.muted}>
                      {` — ${joinMeta(APPOINTMENT_TYPE_LABELS[appointment.type], appointment.time)}`}
                    </Txt>
                  </Txt>
                ))}
              </View>
            </Card>
          ) : null}

          {dayJournal.length ? (
            <Card>
              <Txt size={15} weight={600} style={{ marginBottom: 10 }}>
                يومياتك ❤️
              </Txt>
              <View style={{ gap: 10 }}>
                {dayJournal.map((entry) => (
                  <Txt key={entry.id} size={13.5} color={colors.body} lineHeight={1.8}>
                    {entry.mood ? (
                      <Txt size={13.5} weight={600} color={colors.clayText}>
                        {`${entry.mood} — `}
                      </Txt>
                    ) : null}
                    {entry.text}
                  </Txt>
                ))}
              </View>
            </Card>
          ) : null}

          <View
            style={{
              backgroundColor: colors.claySoft,
              borderWidth: 1,
              borderColor: colors.clayBorder,
              borderRadius: 24,
              padding: 20,
            }}
          >
            <Txt size={15} weight={600} color={colors.clayHeading} style={{ marginBottom: 8 }}>
              متى يجب التواصل مع الطبيب؟
            </Txt>
            <Txt size={13} color={colors.clayBody} lineHeight={1.8} style={{ marginBottom: 8 }}>
              إذا ظهرت أي من هذه العلامات، يُنصح بطلب تقييم طبي عاجل:
            </Txt>
            <View style={{ gap: 6 }}>
              {EMERGENCY_SIGNS.map((sign) => (
                <Row key={sign} gap={8} align="flex-start">
                  <Txt size={13} color={colors.clay}>
                    •
                  </Txt>
                  <Txt size={13} color={colors.clayBody} lineHeight={1.6} style={{ flex: 1 }}>
                    {sign}
                  </Txt>
                </Row>
              ))}
            </View>
            <Txt size={11.5} color={colors.clayFaint} lineHeight={1.6} style={{ marginTop: 10 }}>
              {`هذه ليست أداة تشخيص — ${DISCLAIMER}`}
            </Txt>
          </View>
        </>
      )}
    </Screen>
  );
}
