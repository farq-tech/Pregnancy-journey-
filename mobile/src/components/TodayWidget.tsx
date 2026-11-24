import { View } from 'react-native';

import { TESTS, TRIMESTERS } from '../content/pregnancyData';
import { useI18n } from '../i18n/LocaleProvider';
import { monthName } from '../lib/arabic';
import type { Journey } from '../lib/pregnancy';
import { clampWeek } from '../lib/pregnancy';
import { colors } from '../theme';
import { Row } from './layout';
import { Txt } from './Txt';

/**
 * The five-second summary (spec §15): where she is today, and the five things
 * she is most likely to be wondering, in one strip at the top of the screen.
 *
 * Everything here is already on the Today screen in longer form — this is the
 * glanceable version, not new information.
 */
export function TodayWidget({
  journey,
  nextAppointmentLabel,
}: {
  journey: Journey;
  nextAppointmentLabel: string;
}) {
  const { t, rtl } = useI18n();
  const week = clampWeek(journey.week);
  const trimester = TRIMESTERS[journey.trimester - 1];

  // The next test whose usual window has not closed yet. Advisory, as always.
  const nextTest = TESTS.find((test) => week <= test.to);
  const testLabel = nextTest
    ? week >= nextTest.from
      ? t('today.w.now')
      : t('today.w.weekN', { n: nextTest.from })
    : '—';

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      <Row justify="space-between" align="flex-end">
        <View>
          <Txt size={11} weight={500} color={colors.muted} style={{ letterSpacing: 2 }}>
            {t('today.label')}
          </Txt>
          <Txt size={20} weight={600}>
            {`${journey.today.getDate()} ${monthName(journey.today.getMonth())}`}
          </Txt>
        </View>
        <View>
          <Txt size={15} weight={600} color={colors.sage} align={rtl ? 'left' : 'right'}>
            {t('today.weekN', { n: week })}
          </Txt>
          <Txt size={12.5} color={colors.muted} align={rtl ? 'left' : 'right'}>
            {t('today.w.ga', { w: journey.gaWeeks, d: journey.gaDays, m: journey.monthNumber })}
          </Txt>
        </View>
      </Row>

      <View style={{ height: 1, backgroundColor: colors.track }} />

      <Row justify="space-between" align="flex-start">
        <Cell icon="👶" label={t('today.w.baby')} value={t('today.w.weekN', { n: week })} />
        <Cell icon="🤰" label={t('today.w.stage')} value={t(`today.trimShort.${trimester.n}` as 'today.trimShort.1')} />
        <Cell icon="📅" label={t('today.w.appt')} value={nextAppointmentLabel} />
        <Cell icon="🧪" label={t('today.w.test')} value={testLabel} />
        <Cell icon="⏳" label={t('today.w.left')} value={t('today.w.daysLeft', { n: journey.daysLeft })} />
      </Row>
    </View>
  );
}

function Cell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Txt size={16} align="center">
        {icon}
      </Txt>
      <Txt size={11} color={colors.muted} align="center">
        {label}
      </Txt>
      <Txt size={11} weight={500} align="center" numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}
