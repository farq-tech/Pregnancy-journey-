import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { ErrorText, SecondaryButton } from '../../src/components/fields';
import { Card, Chip, Row } from '../../src/components/layout';
import { formatDayMonth, minutes as minutesLabel } from '../../src/lib/arabic';
import { fromIso } from '../../src/lib/dates';
import {
  KICK_TARGET,
  KICK_TRACKING_FROM_WEEK,
  averageMinutesToTen,
  compareToBaseline,
  formatElapsed,
  recentDays,
  sessionsOn,
  summarize,
  totalOn,
} from '../../src/lib/kicks';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import { useJourney } from '../../src/store/JourneyProvider';
import type { KickSession } from '../../src/store/types';
import { colors } from '../../src/theme';

/** Comparisons are to her own baseline only — never to a population figure. */
const COMPARISON_LABELS = {
  faster: 'أسرع من معدّلك المعتاد',
  similar: 'قريب من معدّلك المعتاد',
  slower: 'أبطأ من معدّلك المعتاد',
} as const;

export default function KickCounterScreen() {
  const { settings, today, kicks, startKickSession, updateKickSession, endKickSession } =
    useJourney();
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  // The running session is whichever one has not been closed — recovered from
  // the store, so locking the phone mid-count does not lose it.
  const active = useMemo(() => kicks.find((session) => !session.endedAt) ?? null, [kicks]);

  // A one-second tick, and only while something is actually running.
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const baseline = useMemo(() => averageMinutesToTen(kicks), [kicks]);

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);
  const elapsed = active ? summarize(active, now) : null;
  const count = active?.count ?? 0;

  const run = (task: Promise<unknown>) => {
    setError('');
    task.catch(() => setError('تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.'));
  };

  const onTap = () => {
    if (!active) {
      run(startKickSession());
      return;
    }
    const next = Math.min(KICK_TARGET, active.count + 1);
    run(
      // Reaching ten closes the session on its own: that is the whole point of
      // "count to ten", and asking her to tap a second button to finish is a
      // way to end up with sessions that never got closed.
      next >= KICK_TARGET
        ? endKickSession(active.id, next)
        : updateKickSession(active.id, next),
    );
  };

  const todaySessions = sessionsOn(kicks, today);
  const days = recentDays(kicks, 7).filter((day) => day !== today);

  return (
    <Screen>
      <PageHeader
        title="عدّاد الركلات"
        subtitle="اجلسي في وقت يكون فيه طفلك نشيطًا، وسجّلي كل حركة تشعرين بها"
        backLabel="المتابعة"
      />

      {week < KICK_TRACKING_FROM_WEEK ? (
        <Card radius={20} style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
          <Txt size={13} color={colors.body} lineHeight={1.8}>
            {`متابعة الحركة اليومية تصبح جزءًا معتادًا من المتابعة من الأسبوع ${KICK_TRACKING_FROM_WEEK} تقريبًا. يمكنك استخدام العدّاد قبل ذلك، لكن قلة الحركة في هذه المرحلة أمر متوقع ولا يُقاس بالعدّ.`}
          </Txt>
        </Card>
      ) : null}

      {/* The counter itself */}
      <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 26 }}>
        <Txt size={12.5} color={colors.muted}>
          {active ? 'جلسة جارية' : 'اضغطي لبدء جلسة'}
        </Txt>

        <Pressable
          onPress={onTap}
          accessibilityRole="button"
          accessibilityLabel={active ? 'تسجيل حركة' : 'بدء جلسة عدّ'}
          style={({ pressed }) => ({
            width: 190,
            height: 190,
            borderRadius: 95,
            backgroundColor: pressed ? colors.sageDark : colors.sage,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Txt size={56} weight={600} color={colors.surface} align="center">
            {String(count)}
          </Txt>
          <Txt size={13} color={colors.sageSoft} align="center">
            {`من ${KICK_TARGET} حركات`}
          </Txt>
        </Pressable>

        <Row gap={16}>
          <View>
            <Txt size={11.5} color={colors.faint} align="center">
              المدة
            </Txt>
            <Txt size={17} weight={600} align="center">
              {elapsed ? formatElapsed(elapsed.elapsedMs) : '00:00'}
            </Txt>
          </View>
          <View style={{ width: 1, height: 30, backgroundColor: colors.track }} />
          <View>
            <Txt size={11.5} color={colors.faint} align="center">
              اليوم
            </Txt>
            <Txt size={17} weight={600} align="center">
              {String(totalOn(kicks, today))}
            </Txt>
          </View>
        </Row>

        {active ? (
          <SecondaryButton
            label="إنهاء الجلسة الآن"
            onPress={() => run(endKickSession(active.id, active.count))}
            style={{ alignSelf: 'stretch' }}
          />
        ) : null}

        {error ? <ErrorText>{error}</ErrorText> : null}
      </Card>

      {baseline !== null ? (
        <Card radius={20} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <Txt size={13.5} weight={600}>
            معدّلك المعتاد
          </Txt>
          <Txt size={13} color={colors.body} lineHeight={1.8} style={{ marginTop: 4 }}>
            {`عادةً تصلين إلى ${KICK_TARGET} حركات خلال ${minutesLabel(baseline)} تقريبًا.`}
          </Txt>
          {elapsed ? (
            <Txt size={12.5} color={colors.sage} style={{ marginTop: 4 }}>
              {COMPARISON_LABELS[compareToBaseline(elapsed.minutes, baseline) ?? 'similar']}
            </Txt>
          ) : null}
        </Card>
      ) : null}

      <Card radius={20} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
        <Txt size={13.5} weight={600} style={{ marginBottom: 6 }}>
          ما الذي يهم فعلًا
        </Txt>
        <Txt size={13} color={colors.body} lineHeight={1.9}>
          لا يوجد رقم واحد صحيح لكل حمل. المهم هو نمط طفلك أنتِ: متى ينشط، وكم يستغرق عادةً للوصول
          إلى عشر حركات. إذا لاحظتِ تغيّرًا واضحًا عن المعتاد — أو توقفًا في الحركة — تواصلي مع
          طبيبك في حينه ولا تنتظري الجلسة القادمة.
        </Txt>
      </Card>

      {todaySessions.length ? (
        <View style={{ gap: 8 }}>
          <Txt size={14} weight={600}>
            جلسات اليوم
          </Txt>
          {todaySessions.map((session) => (
            <SessionRow key={session.id} session={session} now={now} />
          ))}
        </View>
      ) : null}

      {days.length ? (
        <View style={{ gap: 8 }}>
          <Txt size={14} weight={600}>
            الأيام السابقة
          </Txt>
          {days.map((day) => (
            <Card
              key={day}
              radius={16}
              padding={0}
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
            >
              <Row justify="space-between">
                <Txt size={13}>{formatDayMonth(fromIso(day))}</Txt>
                <Chip>
                  <Txt size={11.5} weight={600} color={colors.sageDark}>
                    {`${totalOn(kicks, day)} حركة`}
                  </Txt>
                </Chip>
              </Row>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function SessionRow({ session, now }: { session: KickSession; now: Date }) {
  const summary = summarize(session, now);
  return (
    <Card radius={16} padding={0} style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
      <Row justify="space-between">
        <Txt size={13}>
          {`${session.count} حركة`}
          <Txt size={12} color={colors.faint}>
            {` · ${formatElapsed(summary.elapsedMs)}`}
          </Txt>
        </Txt>
        <Chip bg={summary.running ? colors.claySoft : colors.sageSoft}>
          <Txt
            size={11.5}
            weight={600}
            color={summary.running ? colors.clayText : colors.sageDark}
          >
            {summary.running ? 'جارية' : summary.reachedTarget ? 'اكتملت' : 'انتهت'}
          </Txt>
        </Chip>
      </Row>
    </Card>
  );
}
