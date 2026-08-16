import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { QuickActions } from '../../src/components/QuickActions';
import { Screen } from '../../src/components/Screen';
import { TodayWidget } from '../../src/components/TodayWidget';
import { Txt } from '../../src/components/Txt';
import { CheckIcon, ChevronIcon, SettingsIcon } from '../../src/components/icons';
import { Card, Chip, Row } from '../../src/components/layout';
import { ProgressRing } from '../../src/components/ProgressRing';
import { WeekIllustration } from '../../src/components/WeekIllustration';
import { suggestedChecklist, itemsOf } from '../../src/content/checklists';
import { insightForWeek } from '../../src/content/education';
import { DISCLAIMER, TRIMESTERS, weekContent } from '../../src/content/pregnancyData';
import { KICK_TRACKING_FROM_WEEK, totalOn } from '../../src/lib/kicks';
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
    kicks,
    checklist,
    letters,
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
  const insight = insightForWeek(week);
  const babyName = settings.babyName || 'طفلك';
  const kicksToday = totalOn(kicks, today);
  const nextList = suggestedChecklist(week);
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

      <TodayWidget
        journey={journey}
        nextAppointmentLabel={
          nextAppointment ? countdownLabel(nextAppointment.date, journey.today) : 'لا يوجد'
        }
      />

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

      {/* The tracking tools live off the tab bar, so they get a row here. */}
      <QuickActions
        actions={[
          {
            emoji: '👣',
            label: 'الركلات',
            href: '/track/kicks',
            badge:
              kicksToday > 0
                ? `${kicksToday} اليوم`
                : week >= KICK_TRACKING_FROM_WEEK
                  ? 'ابدئي'
                  : undefined,
          },
          { emoji: '⚖️', label: 'القياسات', href: '/track/measurements' },
          { emoji: '📚', label: 'المكتبة', href: '/learn' },
          {
            emoji: '✅',
            label: 'القوائم',
            href: '/checklists',
            badge: nextList
              ? `${checklist.filter((t) => t.listId === nextList.id && t.done).length}/${
                  itemsOf(nextList).length +
                  checklist.filter((t) => t.listId === nextList.id && t.label).length
                }`
              : undefined,
          },
          {
            emoji: '💌',
            label: 'رسائل',
            href: '/letters',
            badge: letters.length ? `${letters.length}` : undefined,
          },
        ]}
      />

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

      {/* One fact a week — the small reward for opening the app. */}
      <Card
        style={{
          backgroundColor: colors.sageSoft,
          borderColor: colors.sageBorder,
          gap: 6,
        }}
      >
        <Txt size={12} weight={600} color={colors.sageDark} style={{ letterSpacing: 1 }}>
          هل تعلمين؟
        </Txt>
        <Txt size={14.5} color={colors.body} lineHeight={1.9}>
          {insight.fact}
        </Txt>
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

      {/* The family half of the journey — one concrete thing, not a sentiment. */}
      <Card
        style={{
          backgroundColor: colors.claySoft,
          borderColor: colors.clayBorder,
          gap: 6,
        }}
      >
        <Row justify="space-between">
          <Txt size={12} weight={600} color={colors.clayHeading} style={{ letterSpacing: 1 }}>
            {settings.partnerName ? `لـ${settings.partnerName} والعائلة` : 'للشريك والعائلة'}
          </Txt>
          <Pressable onPress={() => router.push('/letters')} hitSlop={8}>
            <Txt size={11.5} weight={600} color={colors.clayText}>
              اكتبوا رسالة ←
            </Txt>
          </Pressable>
        </Row>
        <Txt size={14} color={colors.clayBody} lineHeight={1.9}>
          {insight.family}
        </Txt>
      </Card>

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
