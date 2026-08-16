import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { ErrorText } from '../../src/components/fields';
import { Card, Chip, Row } from '../../src/components/layout';
import { EMERGENCY_SIGNS } from '../../src/content/pregnancyData';
import {
  formatDuration,
  formatInterval,
  intervals,
  patternNote,
  statsFor,
} from '../../src/lib/contractions';
import { fromIso } from '../../src/lib/dates';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import { useJourney } from '../../src/store/JourneyProvider';
import { colors } from '../../src/theme';

export default function ContractionTimerScreen() {
  const { settings, today, contractions, addContraction } = useJourney();
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState('');
  // Kept in a ref as well so the interval callback does not need to be rebuilt.
  const runningRef = useRef(false);
  runningRef.current = startedAt !== null;

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (runningRef.current) setNow(new Date());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => statsFor(contractions, now), [contractions, now]);
  const recent = useMemo(
    () => [...contractions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 12),
    [contractions],
  );
  const recentIntervals = useMemo(() => intervals(recent), [recent]);

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);
  const elapsedSeconds = startedAt ? Math.max(0, (now.getTime() - startedAt.getTime()) / 1000) : 0;

  const toggle = () => {
    setError('');
    if (!startedAt) {
      setStartedAt(new Date());
      setNow(new Date());
      return;
    }
    const began = startedAt;
    const seconds = Math.max(1, Math.round((Date.now() - began.getTime()) / 1000));
    setStartedAt(null);
    addContraction(began, seconds).catch(() =>
      setError('تعذّر حفظ الانقباضة — تحقّقي من الاتصال.'),
    );
  };

  return (
    <Screen>
      <PageHeader
        title="مؤقّت الانقباضات"
        subtitle="اضغطي عند بداية الانقباضة ومرة أخرى عند انتهائها"
        backLabel="المتابعة"
      />

      <Card style={{ alignItems: 'center', gap: 16, paddingVertical: 24 }}>
        <Txt size={12.5} color={colors.muted}>
          {startedAt ? 'انقباضة جارية' : 'جاهز'}
        </Txt>
        <Txt size={46} weight={600} align="center">
          {formatDuration(elapsedSeconds)}
        </Txt>

        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={startedAt ? 'إنهاء الانقباضة' : 'بدء الانقباضة'}
          style={({ pressed }) => ({
            alignSelf: 'stretch',
            borderRadius: 16,
            paddingVertical: 18,
            backgroundColor: startedAt
              ? pressed
                ? colors.clayDeep
                : colors.clay
              : pressed
                ? colors.sageDark
                : colors.sage,
          })}
        >
          <Txt size={16} weight={600} color={colors.surface} align="center">
            {startedAt ? 'انتهت الانقباضة' : 'بدأت الانقباضة'}
          </Txt>
        </Pressable>

        {error ? <ErrorText>{error}</ErrorText> : null}
      </Card>

      <Row gap={10} align="stretch" justify="space-between">
        <Stat label="في الساعة الأخيرة" value={`${stats.countLastHour}`} />
        <Stat
          label="متوسط الطول"
          value={
            stats.averageDurationSeconds === null
              ? '—'
              : formatDuration(stats.averageDurationSeconds)
          }
        />
        <Stat label="التكرار" value={formatInterval(stats.averageIntervalSeconds)} small />
      </Row>

      <Card
        radius={20}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 18,
          backgroundColor: stats.matchesFiveOneOne ? colors.claySoft : colors.surface,
          borderColor: stats.matchesFiveOneOne ? colors.clayBorder : colors.border,
        }}
      >
        <Txt size={13.5} weight={600} color={stats.matchesFiveOneOne ? colors.clayHeading : colors.text}>
          النمط الحالي
        </Txt>
        <Txt
          size={13}
          color={stats.matchesFiveOneOne ? colors.clayBody : colors.body}
          lineHeight={1.9}
          style={{ marginTop: 4 }}
        >
          {patternNote(stats)}
        </Txt>
      </Card>

      {week < 37 ? (
        <Card radius={20} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <Txt size={13.5} weight={600} style={{ marginBottom: 6 }}>
            انقباضات قبل الأسبوع 37
          </Txt>
          <Txt size={13} color={colors.body} lineHeight={1.9}>
            الانقباضات التدريبية شائعة وتكون عادةً غير منتظمة ولا تزداد قوة. لكن الانقباضات المنتظمة
            قبل الأسبوع 37 تستحق التواصل مع طبيبك بغض النظر عمّا يقوله المؤقّت.
          </Txt>
        </Card>
      ) : null}

      <Card
        radius={20}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 18,
          backgroundColor: colors.errorBg,
          borderColor: colors.clayBorder,
        }}
      >
        <Txt size={13.5} weight={600} color={colors.error} style={{ marginBottom: 6 }}>
          تواصلي مع طبيبك فورًا عند
        </Txt>
        <View style={{ gap: 4 }}>
          {EMERGENCY_SIGNS.map((sign) => (
            <Txt key={sign} size={12.5} color={colors.clayBody} lineHeight={1.7}>
              {`• ${sign}`}
            </Txt>
          ))}
          <Txt size={12.5} color={colors.clayBody} lineHeight={1.7}>
            • نزول ماء الرأس
          </Txt>
        </View>
      </Card>

      {recent.length ? (
        <View style={{ gap: 8 }}>
          <Txt size={14} weight={600}>
            آخر الانقباضات
          </Txt>
          {recent.map((contraction, index) => {
            // `recent` is newest-first; `intervals` is oldest-first and one
            // shorter. Row `index` sits at `n-1-index` ascending, and the gap
            // that ends at it is the one before that — undefined on the oldest.
            const gap = recentIntervals[recent.length - 2 - index];
            const at = new Date(contraction.startedAt);
            const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
            return (
              <Card
                key={contraction.id}
                radius={16}
                padding={0}
                style={{ paddingVertical: 12, paddingHorizontal: 16 }}
              >
                <Row justify="space-between">
                  <Txt size={13}>
                    {`${pad(at.getHours())}:${pad(at.getMinutes())}`}
                    <Txt size={12} color={colors.faint}>
                      {` · ${formatDuration(contraction.durationSeconds)}`}
                    </Txt>
                  </Txt>
                  {gap !== undefined ? (
                    <Chip>
                      <Txt size={11.5} color={colors.sageDark}>
                        {formatInterval(gap)}
                      </Txt>
                    </Chip>
                  ) : null}
                </Row>
              </Card>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <Card
      radius={18}
      padding={0}
      style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12 }}
    >
      <Txt size={11} color={colors.muted} align="center">
        {label}
      </Txt>
      <Txt size={small ? 13 : 18} weight={600} align="center" style={{ marginTop: 4 }}>
        {value}
      </Txt>
    </Card>
  );
}
