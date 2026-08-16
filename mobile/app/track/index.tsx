import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { ChevronIcon } from '../../src/components/icons';
import { Card, Chip, Row } from '../../src/components/layout';
import { DISCLAIMER } from '../../src/content/pregnancyData';
import { formatDayMonth } from '../../src/lib/arabic';
import { fromIso } from '../../src/lib/dates';
import { KICK_TRACKING_FROM_WEEK, totalOn } from '../../src/lib/kicks';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import { statsFor } from '../../src/lib/contractions';
import { latestOfKind } from '../../src/lib/vitals';
import { weightPicture } from '../../src/lib/weight';
import { useJourney } from '../../src/store/JourneyProvider';
import { colors } from '../../src/theme';

/**
 * مركز المتابعة — one place for the four things she is asked to keep an eye on.
 *
 * Each tile carries its own live state, so the hub answers "did I do this
 * today?" without opening anything.
 */
export default function TrackHubScreen() {
  const { settings, today, kicks, contractions, measurements } = useJourney();

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  const contractionStats = useMemo(() => statsFor(contractions), [contractions]);

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);
  const kicksToday = totalOn(kicks, today);
  const latestWeight = latestOfKind(measurements, 'weight');
  const latestBp = latestOfKind(measurements, 'bp');
  const picture = weightPicture(
    latestWeight?.value ?? null,
    settings.prePregnancyWeightKg,
    settings.heightCm,
    week,
  );

  return (
    <Screen>
      <PageHeader
        title="المتابعة"
        subtitle="ما تسجّلينه بنفسك — الحركة، الانقباضات، الوزن والقياسات"
      />

      <Tool
        emoji="👣"
        title="عدّاد الركلات"
        detail={
          kicksToday
            ? `سجّلتِ ${kicksToday} حركة اليوم`
            : week >= KICK_TRACKING_FROM_WEEK
              ? 'لم تسجّلي حركات اليوم بعد'
              : `تصبح المتابعة اليومية معتادة من الأسبوع ${KICK_TRACKING_FROM_WEEK}`
        }
        badge={kicksToday ? `${kicksToday}` : undefined}
        onPress={() => router.push('/track/kicks')}
      />

      <Tool
        emoji="⏱"
        title="مؤقّت الانقباضات"
        detail={
          contractionStats.countLastHour
            ? `${contractionStats.countLastHour} انقباضة في الساعة الأخيرة`
            : 'لتوقيت الانقباضات وحساب الفترة بينها'
        }
        badge={contractionStats.matchesFiveOneOne ? '5-1-1' : undefined}
        onPress={() => router.push('/track/contractions')}
      />

      <Tool
        emoji="⚖️"
        title="الوزن والقياسات"
        detail={
          latestWeight
            ? `آخر وزن ${latestWeight.value} كغم · ${formatDayMonth(fromIso(latestWeight.date))}`
            : 'الوزن وضغط الدم وسكر الدم في مكان واحد'
        }
        badge={picture ? `${picture.gainKg > 0 ? '+' : ''}${picture.gainKg} كغم` : undefined}
        onPress={() => router.push('/track/measurements')}
      />

      {latestBp ? (
        <Card radius={20} style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
          <Txt size={12.5} color={colors.muted}>
            آخر قياس ضغط
          </Txt>
          <Txt size={16} weight={600} style={{ marginTop: 2 }}>
            {`${latestBp.value}/${latestBp.value2} ملم زئبق`}
          </Txt>
          <Txt size={11.5} color={colors.faint} style={{ marginTop: 2 }}>
            {formatDayMonth(fromIso(latestBp.date))}
          </Txt>
        </Card>
      ) : null}

      <Txt size={11.5} color={colors.faint} align="center" lineHeight={1.8} style={{ paddingHorizontal: 14 }}>
        {DISCLAIMER}
      </Txt>
    </Screen>
  );
}

function Tool({
  emoji,
  title,
  detail,
  badge,
  onPress,
}: {
  emoji: string;
  title: string;
  detail: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card
          radius={20}
          padding={0}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 18,
            backgroundColor: pressed ? '#FCFBF7' : colors.surface,
          }}
        >
          <Row gap={14}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.sageSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={20} align="center">
                {emoji}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight={600}>
                {title}
              </Txt>
              <Txt size={12.5} color={colors.muted} lineHeight={1.6} style={{ marginTop: 2 }}>
                {detail}
              </Txt>
            </View>
            {badge ? (
              <Chip>
                <Txt size={11.5} weight={600} color={colors.sageDark}>
                  {badge}
                </Txt>
              </Chip>
            ) : null}
            <ChevronIcon size={18} color={colors.muted} direction="left" />
          </Row>
        </Card>
      )}
    </Pressable>
  );
}
