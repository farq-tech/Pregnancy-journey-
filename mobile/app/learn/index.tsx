import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { ChevronIcon } from '../../src/components/icons';
import { Card, Chip, Row } from '../../src/components/layout';
import {
  COMFORT,
  activityFor,
  familyRoleFor,
  mythsForTrimester,
  nutritionFor,
} from '../../src/content/education';
import { glossaryForWeek } from '../../src/content/glossary';
import { DISCLAIMER, EMERGENCY_SIGNS, TRIMESTERS } from '../../src/content/pregnancyData';
import { fromIso } from '../../src/lib/dates';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import { useJourney } from '../../src/store/JourneyProvider';
import { colors } from '../../src/theme';

type Tab = 'nutrition' | 'activity' | 'comfort' | 'myths' | 'family';

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'nutrition', label: 'التغذية' },
  { id: 'activity', label: 'الحركة' },
  { id: 'comfort', label: 'الأعراض' },
  { id: 'myths', label: 'حقيقة أم شائعة' },
  { id: 'family', label: 'دور العائلة' },
];

/**
 * المكتبة — everything educational that is not tied to a single week, filtered
 * to the trimester she is actually in so it reads as "now" rather than "someday".
 */
export default function LearnScreen() {
  const { settings, today } = useJourney();
  const [tab, setTab] = useState<Tab>('nutrition');

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);
  const trimester = journey.trimester;
  const terms = glossaryForWeek(week);

  return (
    <Screen>
      <PageHeader
        title="المكتبة"
        subtitle={`محتوى تثقيفي مرتّب على ${TRIMESTERS[trimester - 1].name}`}
      />

      <Row wrap gap={7}>
        {TABS.map((option) => {
          const active = tab === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => setTab(option.id)}
              style={{
                borderRadius: 999,
                paddingVertical: 8,
                paddingHorizontal: 14,
                backgroundColor: active ? colors.sage : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.sage : colors.border,
              }}
            >
              <Txt size={12.5} weight={active ? 600 : 400} color={active ? colors.surface : colors.muted}>
                {option.label}
              </Txt>
            </Pressable>
          );
        })}
      </Row>

      {tab === 'nutrition' ? <NutritionTab week={week} /> : null}
      {tab === 'activity' ? <ActivityTab week={week} /> : null}
      {tab === 'comfort' ? <ComfortTab /> : null}
      {tab === 'myths' ? <MythsTab trimester={trimester} /> : null}
      {tab === 'family' ? <FamilyTab week={week} partnerName={settings.partnerName} /> : null}

      <Pressable onPress={() => router.push('/learn/glossary')}>
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
            <Row gap={12}>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight={600}>
                  قاموس المصطلحات 📖
                </Txt>
                <Txt size={12.5} color={colors.muted} lineHeight={1.6} style={{ marginTop: 2 }}>
                  {terms.length
                    ? `الكلمات التي ستسمعينها هذه المرحلة: ${terms
                        .slice(0, 3)
                        .map((t) => t.term)
                        .join('، ')}`
                    : 'اقرئي تقاريرك بلغتك — CRL، AFI، NT وغيرها'}
                </Txt>
              </View>
              <ChevronIcon size={18} color={colors.muted} direction="left" />
            </Row>
          </Card>
        )}
      </Pressable>

      <Card
        radius={20}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 18,
          backgroundColor: colors.errorBg,
          borderColor: colors.clayBorder,
        }}
      >
        <Txt size={14} weight={600} color={colors.error} style={{ marginBottom: 8 }}>
          علامات تستدعي التواصل الفوري
        </Txt>
        <View style={{ gap: 5 }}>
          {EMERGENCY_SIGNS.map((sign) => (
            <Txt key={sign} size={12.5} color={colors.clayBody} lineHeight={1.7}>
              {`• ${sign}`}
            </Txt>
          ))}
        </View>
      </Card>

      <Txt size={11.5} color={colors.faint} align="center" lineHeight={1.8} style={{ paddingHorizontal: 14 }}>
        {DISCLAIMER}
      </Txt>
    </Screen>
  );
}

function NutritionTab({ week }: { week: number }) {
  const guide = nutritionFor(week);
  return (
    <>
      <Card style={{ gap: 10 }}>
        <Txt size={15} weight={600}>
          {guide.headline}
        </Txt>
        {guide.priorities.map((item) => (
          <View key={item.label}>
            <Txt size={13.5} weight={600} color={colors.sage}>
              {item.label}
            </Txt>
            <Txt size={13} color={colors.body} lineHeight={1.8} style={{ marginTop: 2 }}>
              {item.why}
            </Txt>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt size={15} weight={600}>
          انتبهي لها
        </Txt>
        {guide.care.map((item) => (
          <View key={item.label}>
            <Txt size={13.5} weight={600} color={colors.clayText}>
              {item.label}
            </Txt>
            <Txt size={13} color={colors.body} lineHeight={1.8} style={{ marginTop: 2 }}>
              {item.why}
            </Txt>
          </View>
        ))}
        <Txt size={12} color={colors.faint} lineHeight={1.7}>
          {guide.note}
        </Txt>
      </Card>
    </>
  );
}

function ActivityTab({ week }: { week: number }) {
  const guide = activityFor(week);
  return (
    <>
      <Card style={{ gap: 8 }}>
        <Txt size={15} weight={600}>
          {guide.headline}
        </Txt>
        {guide.suggestions.map((line) => (
          <Row key={line} gap={8} align="flex-start">
            <Txt size={13} color={colors.sageRing}>
              ◆
            </Txt>
            <Txt size={13.5} color={colors.body} lineHeight={1.8} style={{ flex: 1 }}>
              {line}
            </Txt>
          </Row>
        ))}
      </Card>

      <Card
        style={{
          gap: 8,
          backgroundColor: colors.claySoft,
          borderColor: colors.clayBorder,
        }}
      >
        <Txt size={14.5} weight={600} color={colors.clayHeading}>
          توقّفي وتواصلي مع طبيبك عند
        </Txt>
        {guide.stop.map((line) => (
          <Txt key={line} size={13} color={colors.clayBody} lineHeight={1.8}>
            {`• ${line}`}
          </Txt>
        ))}
      </Card>
    </>
  );
}

function ComfortTab() {
  const [open, setOpen] = useState<string | null>(COMFORT[0].id);
  return (
    <View style={{ gap: 10 }}>
      {COMFORT.map((topic) => {
        const expanded = open === topic.id;
        return (
          <Card key={topic.id} radius={20} padding={0} style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
            <Pressable onPress={() => setOpen(expanded ? null : topic.id)}>
              <Row justify="space-between">
                <Txt size={14.5} weight={600}>
                  {topic.symptom}
                </Txt>
                <Txt size={13} color={colors.muted}>
                  {expanded ? '−' : '+'}
                </Txt>
              </Row>
            </Pressable>

            {expanded ? (
              <View style={{ marginTop: 10, gap: 6 }}>
                {topic.tips.map((tip) => (
                  <Txt key={tip} size={13} color={colors.body} lineHeight={1.8}>
                    {`• ${tip}`}
                  </Txt>
                ))}
                <View
                  style={{
                    marginTop: 6,
                    backgroundColor: colors.claySoft,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                  }}
                >
                  <Txt size={12.5} color={colors.clayBody} lineHeight={1.8}>
                    {`تواصلي مع طبيبك: ${topic.seeDoctor}`}
                  </Txt>
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function MythsTab({ trimester }: { trimester: 1 | 2 | 3 }) {
  return (
    <View style={{ gap: 10 }}>
      {mythsForTrimester(trimester).map((myth) => (
        <Card key={myth.id} radius={20} padding={0} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <Chip bg={colors.claySoft}>
            <Txt size={11} weight={600} color={colors.clayText}>
              شائعة
            </Txt>
          </Chip>
          <Txt size={14} weight={600} lineHeight={1.7} style={{ marginTop: 8 }}>
            {`«${myth.myth}»`}
          </Txt>
          <View style={{ height: 1, backgroundColor: colors.track, marginVertical: 10 }} />
          <Chip>
            <Txt size={11} weight={600} color={colors.sageDark}>
              ما تقوله الإرشادات
            </Txt>
          </Chip>
          <Txt size={13} color={colors.body} lineHeight={1.9} style={{ marginTop: 8 }}>
            {myth.fact}
          </Txt>
        </Card>
      ))}
    </View>
  );
}

function FamilyTab({ week, partnerName }: { week: number; partnerName: string }) {
  return (
    <Card style={{ gap: 10 }}>
      <Txt size={15} weight={600}>
        {partnerName ? `ما يمكن أن يفعله ${partnerName} الآن` : 'ما يمكن أن تفعله العائلة الآن'}
      </Txt>
      <Txt size={12.5} color={colors.muted} lineHeight={1.7}>
        الحمل تحمله امرأة واحدة ويعيشه بيت كامل — هذه أشياء ملموسة، لا مشاعر عامة.
      </Txt>
      {familyRoleFor(week).map((line) => (
        <Row key={line} gap={8} align="flex-start">
          <Txt size={13} color={colors.clay}>
            ❤
          </Txt>
          <Txt size={13.5} color={colors.body} lineHeight={1.9} style={{ flex: 1 }}>
            {line}
          </Txt>
        </Row>
      ))}
    </Card>
  );
}
