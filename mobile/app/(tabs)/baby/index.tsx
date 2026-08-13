import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '../../../src/components/Screen';
import { Txt } from '../../../src/components/Txt';
import { Card, Row } from '../../../src/components/layout';
import {
  MAX_CONTENT_WEEK,
  MILESTONES,
  MIN_CONTENT_WEEK,
  weekContent,
} from '../../../src/content/pregnancyData';
import { days } from '../../../src/lib/arabic';
import { fromIso } from '../../../src/lib/dates';
import { joinMeta } from '../../../src/lib/labels';
import { clampWeek, computeJourney } from '../../../src/lib/pregnancy';
import { useJourney } from '../../../src/store/JourneyProvider';
import { colors } from '../../../src/theme';

export default function BabyTimelineScreen() {
  const { settings, today } = useJourney();
  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  const timeline = useMemo(() => {
    const out = [];
    for (let week = MIN_CONTENT_WEEK; week <= MAX_CONTENT_WEEK; week += 1) {
      out.push({ week, content: weekContent(week) });
    }
    return out;
  }, []);

  if (!journey || !settings) return null;

  const currentWeek = clampWeek(journey.week);
  const babyName = settings.babyName || 'طفلك';

  return (
    <Screen gap={0}>
      <Txt size={20} weight={600} style={{ marginBottom: 2 }}>
        {`رحلة ${babyName}`}
      </Txt>
      <Txt size={13} color={colors.muted} style={{ marginBottom: 18 }}>
        {`التطور أسبوعًا بأسبوع — من الأسبوع ${MIN_CONTENT_WEEK} حتى ${MAX_CONTENT_WEEK}`}
      </Txt>

      <View>
        {timeline.map(({ week, content }, index) => {
          const isCurrent = week === currentWeek;
          const isPast = week < currentWeek;
          return (
            <Pressable
              key={week}
              onPress={() => router.push({ pathname: '/baby/[week]', params: { week } })}
            >
              {({ pressed }) => (
                <Row gap={14} align="stretch" style={{ opacity: pressed ? 0.8 : 1 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCurrent
                          ? colors.sage
                          : isPast
                            ? colors.sageMid
                            : colors.border,
                      }}
                    >
                      <Txt size={12.5} weight={600} color={colors.surface} align="center">
                        {String(week)}
                      </Txt>
                    </View>
                    {/* Connector, omitted on the last row so the line stops cleanly. */}
                    {index < timeline.length - 1 ? (
                      <View
                        style={{ width: 2, flex: 1, minHeight: 26, backgroundColor: colors.track }}
                      />
                    ) : null}
                  </View>

                  <View style={{ flex: 1, paddingBottom: 18 }}>
                    <Txt
                      size={14.5}
                      weight={600}
                      color={week <= currentWeek ? colors.text : colors.muted}
                    >
                      {content.title}
                    </Txt>
                    <Txt size={12.5} color={colors.muted} lineHeight={1.6} style={{ marginTop: 2 }}>
                      {joinMeta(content.size, content.compare, content.weight)}
                    </Txt>
                    {isCurrent ? (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: colors.sageSoft,
                          borderRadius: 999,
                          paddingVertical: 3,
                          paddingHorizontal: 10,
                          marginTop: 6,
                        }}
                      >
                        <Txt size={11} weight={600} color={colors.sageDark}>
                          الأسبوع الحالي
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                </Row>
              )}
            </Pressable>
          );
        })}
      </View>

      <Txt size={15} weight={600} style={{ marginTop: 14, marginBottom: 12 }}>
        المحطات ✓
      </Txt>

      <Card style={{ paddingVertical: 18, paddingHorizontal: 20, gap: 12 }}>
        {MILESTONES.map((milestone) => {
          // A milestone's own gestational day is the first day of its week.
          const delta = (milestone.week - 1) * 7 - journey.gestationalDay;
          const reached = delta <= 0;
          return (
            <Row key={milestone.id} gap={10} align="flex-start">
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  marginTop: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: reached ? colors.sageRing : colors.border,
                }}
              >
                {reached ? (
                  <Txt size={10} color={colors.surface} align="center">
                    ✓
                  </Txt>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={13.5} weight={500} color={reached ? colors.text : colors.muted}>
                  {milestone.label}
                  <Txt size={12} color={colors.faint}>
                    {` · الأسبوع ${milestone.week}`}
                  </Txt>
                </Txt>
                {milestone.note ? (
                  <Txt size={12} color={colors.faint} lineHeight={1.6} style={{ marginTop: 1 }}>
                    {milestone.note}
                  </Txt>
                ) : null}
                <Txt size={12} color={colors.sageRing} style={{ marginTop: 1 }}>
                  {reached ? 'وصلتِ لهذه المرحلة' : `باقي ${days(delta)}`}
                </Txt>
              </View>
            </Row>
          );
        })}
        <Txt size={11.5} color={colors.faint} lineHeight={1.7}>
          المحطات الطبية (كالنبض) لا تُعتبر مؤكدة بوصول التاريخ — تتأكد بإضافة نتيجة السونار في ملف
          الحمل.
        </Txt>
      </Card>
    </Screen>
  );
}
