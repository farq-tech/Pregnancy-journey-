import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { ChevronIcon } from '../../src/components/icons';
import { Card, Chip, Row } from '../../src/components/layout';
import { CHECKLISTS, itemsOf, type Checklist } from '../../src/content/checklists';
import { fromIso } from '../../src/lib/dates';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import { useJourney } from '../../src/store/JourneyProvider';
import type { ChecklistTick } from '../../src/store/types';
import { colors } from '../../src/theme';

export default function ChecklistsScreen() {
  const { settings, today, checklist } = useJourney();

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);

  return (
    <Screen>
      <PageHeader
        title="قوائم التحضير"
        subtitle="أشياء ملموسة يمكن إنهاؤها فعلًا — وهي نادرة في تسعة أشهر من الانتظار"
      />

      <View style={{ gap: 10 }}>
        {CHECKLISTS.map((list) => (
          <ListCard key={list.id} list={list} ticks={checklist} week={week} />
        ))}
      </View>
    </Screen>
  );
}

function ListCard({
  list,
  ticks,
  week,
}: {
  list: Checklist;
  ticks: readonly ChecklistTick[];
  week: number;
}) {
  const mine = ticks.filter((tick) => tick.listId === list.id);
  const custom = mine.filter((tick) => tick.label);
  const total = itemsOf(list).length + custom.length;
  const done = mine.filter((tick) => tick.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const open = week >= list.openFrom;

  return (
    <Pressable onPress={() => router.push({ pathname: '/checklists/[list]', params: { list: list.id } })}>
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
          <Row gap={14} align="flex-start">
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
                {list.emoji}
              </Txt>
            </View>

            <View style={{ flex: 1 }}>
              <Txt size={15} weight={600}>
                {list.title}
              </Txt>
              <Txt size={12.5} color={colors.muted} lineHeight={1.6} style={{ marginTop: 2 }}>
                {list.subtitle}
              </Txt>

              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.track,
                  marginTop: 10,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${percent}%`,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.sageRing,
                  }}
                />
              </View>
              <Txt size={11.5} color={colors.faint} style={{ marginTop: 5 }}>
                {`${done} من ${total}`}
                {open ? '' : ` · تصبح مهمة من الأسبوع ${list.openFrom}`}
              </Txt>
            </View>

            {percent === 100 ? (
              <Chip>
                <Txt size={11} weight={600} color={colors.sageDark}>
                  اكتملت
                </Txt>
              </Chip>
            ) : (
              <ChevronIcon size={18} color={colors.muted} direction="left" />
            )}
          </Row>
        </Card>
      )}
    </Pressable>
  );
}
