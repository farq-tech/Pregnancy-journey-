import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { CheckIcon, ChevronIcon, SettingsIcon } from '../../src/components/icons';
import { Card, Chip, Row } from '../../src/components/layout';
import { ProgressRing } from '../../src/components/ProgressRing';
import { WeekIllustration } from '../../src/components/WeekIllustration';
import { DISCLAIMER, TRIMESTERS, weekContent } from '../../src/content/pregnancyData';
import {
  days,
  formatDayMonth,
  formatLong,
  formatWeekday,
  monthName,
  ordinal,
  weekOrdinalLabel,
  weeks as weeksLabel,
} from '../../src/lib/arabic';
import { addDays, fromIso, toIso } from '../../src/lib/dates';
import { countdownLabel, gestationalAgeLabel, joinMeta } from '../../src/lib/labels';
import {
  TERM_DAYS,
  clampWeek,
  computeJourney,
  progressPercent,
  weekStart,
  weeksToNextTrimester,
} from '../../src/lib/pregnancy';
import { useJourney } from '../../src/store/JourneyProvider';
import { APPOINTMENT_TYPE_LABELS } from '../../src/store/types';
import { colors } from '../../src/theme';

export default function TodayScreen() {
  const {
    settings,
    appointments,
    today,
    eddBanner,
    dismissEddBanner,
    refresh,
    syncError,
  } = useJourney();
  const [refreshing, setRefreshing] = useState(false);

  // `today` ticks over at midnight, so the whole screen recomputes with it.
  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  const nextAppointment = useMemo(() => {
    if (!journey) return null;
    return (
      appointments
        .filter((a) => !a.done && fromIso(a.date) >= journey.today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] ?? null
    );
  }, [appointments, journey]);

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);
  const content = weekContent(journey.week);
  const babyName = settings.babyName || 'طفلك';
  const thisWeekStart = weekStart(journey, week);
  const weeksToNext = weeksToNextTrimester(journey.gestationalDay);
  const trimesterName = TRIMESTERS[journey.trimester - 1].name;
  const trimesterLabel =
    weeksToNext === null
      ? 'أنتِ في الثلث الأخير'
      : `باقي ${weeksLabel(weeksToNext)} على الثلث ${journey.trimester === 1 ? 'الثاني' : 'الثالث'}`;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Row justify="space-between">
        <View>
          <Txt size={11} weight={500} color={colors.muted} style={{ letterSpacing: 2 }}>
            اليوم
          </Txt>
          <Txt size={17} weight={600}>
            {`${formatWeekday(journey.today)} ${formatLong(journey.today)}`}
          </Txt>
        </View>
        <Pressable
          onPress={() => router.push('/onboarding')}
          accessibilityLabel="الإعدادات"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SettingsIcon />
        </Pressable>
      </Row>

      {syncError ? (
        <View
          style={{
            backgroundColor: colors.errorBg,
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <Txt size={12.5} color={colors.error} lineHeight={1.6}>
            تعذّر التحديث من الخادم — تعرضين نسخة محفوظة على الجهاز.
          </Txt>
        </View>
      ) : null}

      {eddBanner ? (
        <Row
          gap={10}
          style={{
            backgroundColor: colors.sageSoft,
            borderWidth: 1,
            borderColor: colors.sageBorder,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <CheckIcon size={18} strokeWidth={2} />
          <Txt size={13} color={colors.sageDark} style={{ flex: 1 }} lineHeight={1.5}>
            تم تحديث موعد الولادة بناءً على السونار — أُعيد حساب التقويم كاملًا.
          </Txt>
          <Pressable onPress={dismissEddBanner} accessibilityLabel="إخفاء">
            <Txt size={16} color={colors.muted}>
              ×
            </Txt>
          </Pressable>
        </Row>
      ) : null}

      {/* Hero */}
      <Card padding={0} radius={24} style={{ paddingVertical: 24, paddingHorizontal: 20 }}>
        <Txt size={14} weight={500} color={colors.clayDeep} align="center">
          رحلتكم بدأت ❤️
        </Txt>
        <Txt size={26} weight={600} align="center" style={{ marginTop: 6, marginBottom: 2 }}>
          {weekOrdinalLabel(week)}
        </Txt>
        <Txt size={15} weight={500} color={colors.sage} align="center">
          {gestationalAgeLabel(journey.gaWeeks, journey.gaDays)}
        </Txt>
        <Txt size={11.5} color={colors.faint} align="center" style={{ marginTop: 2 }}>
          العمر الحملي · Gestational Age
        </Txt>

        <View style={{ marginTop: 18, marginBottom: 14 }}>
          <ProgressRing percent={progressPercent(journey)}>
            <Txt size={38} weight={600} align="center">
              {journey.dayNumber}
            </Txt>
            <Txt size={12.5} color={colors.muted} align="center">
              {`من ${TERM_DAYS} يومًا`}
            </Txt>
          </ProgressRing>
        </View>

        <Txt size={14} align="center">
          {`باقي ${days(journey.daysLeft)} تقريبًا على الموعد المتوقع`}
        </Txt>
        <Txt size={13} color={colors.muted} align="center" style={{ marginTop: 3 }}>
          {formatLong(journey.edd)}
        </Txt>
      </Card>

      {/* Four stat tiles */}
      <Row wrap gap={10} align="stretch" justify="space-between">
        <StatTile label="باقي على الولادة">
          <Row gap={4} style={{ marginTop: 2 }}>
            <Txt size={22} weight={600} color={colors.sage}>
              {String(journey.daysLeft)}
            </Txt>
            <Txt size={12} color={colors.muted}>
              يومًا
            </Txt>
          </Row>
        </StatTile>

        <StatTile label="الموعد القادم">
          <Txt size={15} weight={600} style={{ marginTop: 4 }}>
            {nextAppointment
              ? countdownLabel(nextAppointment.date, journey.today)
              : 'لا مواعيد قادمة'}
          </Txt>
        </StatTile>

        <StatTile label="المرحلة القادمة">
          <Txt size={13.5} weight={500} lineHeight={1.5} style={{ marginTop: 4 }}>
            {`باقي ${days(7 - journey.gaDays)} على الأسبوع ${ordinal(week + 1)}`}
          </Txt>
        </StatTile>

        <StatTile label={trimesterName}>
          <Txt size={13.5} weight={500} lineHeight={1.5} style={{ marginTop: 4 }}>
            {trimesterLabel}
          </Txt>
        </StatTile>
      </Row>

      {/* Baby today */}
      <Card style={{ gap: 12 }}>
        <Row justify="space-between">
          <Txt size={16} weight={600}>
            {`${babyName} اليوم 👶`}
          </Txt>
          <Chip>
            <Txt size={12} weight={500} color={colors.sage}>
              {`الأسبوع ${week}`}
            </Txt>
          </Chip>
        </Row>

        <Row gap={14}>
          <WeekIllustration week={journey.week} size={96} />
          <View style={{ flex: 1 }}>
            <Txt size={14.5} weight={600} color={colors.sage}>
              {content.title}
            </Txt>
            {content.size ? (
              <Txt size={13} color={colors.muted} style={{ marginTop: 3 }}>
                {joinMeta(content.size, content.compare)}
              </Txt>
            ) : null}
            {content.weight ? (
              <Txt size={13} color={colors.muted} style={{ marginTop: 2 }}>
                {`الوزن: ${content.weight}`}
              </Txt>
            ) : null}
          </View>
        </Row>

        <Txt size={14} color={colors.body} lineHeight={1.9}>
          {content.baby}
        </Txt>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/calendar/[date]',
              params: { date: toIso(journey.today) },
            })
          }
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#E2E8DC' : colors.sageSoft,
            borderRadius: 12,
            paddingVertical: 12,
          })}
        >
          <Txt size={14} weight={600} color={colors.sageDark} align="center">
            ماذا يحدث اليوم؟
          </Txt>
        </Pressable>
      </Card>

      {/* Mother today */}
      <Card>
        <Txt size={16} weight={600} style={{ marginBottom: 8 }}>
          أنتِ اليوم
        </Txt>
        <Txt size={14} color={colors.body} lineHeight={1.9}>
          {content.mom}
        </Txt>
        {content.symptoms?.length ? (
          <Row wrap gap={6} style={{ marginTop: 12 }}>
            {content.symptoms.map((symptom) => (
              <Chip key={symptom} bg={colors.claySoft}>
                <Txt size={12} color={colors.clayText}>
                  {symptom}
                </Txt>
              </Chip>
            ))}
          </Row>
        ) : null}
        <Txt size={12} color={colors.faint} style={{ marginTop: 10 }} lineHeight={1.5}>
          قد تختلف الأعراض من امرأة لأخرى — بعض النساء لا يشعرن بأعراض تُذكر.
        </Txt>
      </Card>

      {/* Next appointment */}
      {nextAppointment ? (
        <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
          <Row gap={14}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: colors.sageSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={16} weight={600} color={colors.sageDark} align="center">
                {String(fromIso(nextAppointment.date).getDate())}
              </Txt>
              <Txt size={9.5} color={colors.muted} align="center">
                {monthName(fromIso(nextAppointment.date).getMonth())}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14.5} weight={600}>
                {nextAppointment.title}
              </Txt>
              <Txt size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                {joinMeta(
                  APPOINTMENT_TYPE_LABELS[nextAppointment.type],
                  nextAppointment.time,
                  nextAppointment.location,
                )}
              </Txt>
            </View>
            <Chip>
              <Txt size={12} weight={500} color={colors.sage}>
                {countdownLabel(nextAppointment.date, journey.today)}
              </Txt>
            </Chip>
          </Row>
        </Card>
      ) : null}

      {/* This week */}
      <Pressable onPress={() => router.push({ pathname: '/baby/[week]', params: { week } })}>
        {({ pressed }) => (
          <Card
            style={{
              paddingVertical: 18,
              paddingHorizontal: 20,
              backgroundColor: pressed ? '#FCFBF7' : colors.surface,
            }}
          >
            <Row gap={12}>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight={600}>
                  هذا الأسبوع
                </Txt>
                <Txt size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                  {`${formatDayMonth(thisWeekStart)} – ${formatDayMonth(addDays(thisWeekStart, 6))} · التطور، الفحوصات، والأسئلة للطبيب`}
                </Txt>
              </View>
              <ChevronIcon size={18} color={colors.muted} direction="left" />
            </Row>
          </Card>
        )}
      </Pressable>

      <Txt
        size={11.5}
        color={colors.faint}
        align="center"
        lineHeight={1.8}
        style={{ paddingHorizontal: 14, paddingTop: 2 }}
      >
        {DISCLAIMER}
      </Txt>
    </Screen>
  );
}

/** One of the four 2×2 tiles under the hero. */
function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card
      radius={18}
      padding={0}
      style={{
        // Two per row, accounting for the 10px gap between them.
        width: '48.5%',
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Txt size={11.5} color={colors.muted}>
        {label}
      </Txt>
      {children}
    </Card>
  );
}
