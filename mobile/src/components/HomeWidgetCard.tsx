import { View } from 'react-native';

import type { WidgetGlance } from '../lib/widgetGlance';
import { colors } from '../theme';
import { Txt } from './Txt';

/**
 * In-app preview of the lock / home-screen widget: day N of 280, week, next
 * appointment. The native WidgetKit target reads the same snapshot.
 */
export function HomeWidgetCard({ glance }: { glance: WidgetGlance }) {
  return (
    <View
      style={{
        backgroundColor: colors.sageDark,
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 10,
      }}
    >
      <Txt size={11} weight={500} color={colors.sageMid} style={{ letterSpacing: 1.4 }}>
        رحلة الحمل
      </Txt>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Txt size={34} weight={600} color={colors.surface}>
            {String(glance.dayNumber)}
          </Txt>
          <Txt size={12.5} color={colors.sageMid}>
            {`من ${glance.termDays} يومًا`}
          </Txt>
        </View>
        <View>
          <Txt size={16} weight={600} color={colors.surface} align="left">
            {`الأسبوع ${glance.week}`}
          </Txt>
          <Txt size={12.5} color={colors.sageMid} align="left">
            {glance.nextWhen}
          </Txt>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <Txt size={13.5} weight={500} color={colors.surface} numberOfLines={1}>
        {glance.nextTitle}
      </Txt>
      {glance.nextDate ? (
        <Txt size={12} color={colors.sageMid}>
          {glance.nextDate}
        </Txt>
      ) : null}
    </View>
  );
}
