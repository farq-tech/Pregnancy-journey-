import { Image, View } from 'react-native';

import { BABY_WEEK_IMAGES } from '../../assets/babyWeeks';
import { illustrationWeek } from '../lib/pregnancy';
import { colors } from '../theme';
import { Txt } from './Txt';

/**
 * Circular illustration for a gestational week, replacing the prototype's
 * `<image-slot>`. Falls back to a placeholder carrying the week number so the
 * layout is complete before licensed artwork exists.
 */
export function WeekIllustration({
  week,
  size,
  caption = 'صورة الأسبوع',
}: {
  week: number;
  size: number;
  caption?: string;
}) {
  const resolved = illustrationWeek(week);
  const source = BABY_WEEK_IMAGES[resolved];

  if (source) {
    return (
      <Image
        source={source}
        accessibilityLabel={`${caption} ${resolved}`}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${caption} — الأسبوع ${resolved}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.sageSoft,
        borderWidth: 1,
        borderColor: colors.sageBorder,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <Txt size={size * 0.26} weight={600} color={colors.sage} align="center">
        {resolved}
      </Txt>
      <Txt size={Math.max(8, size * 0.1)} color={colors.muted} align="center">
        أسبوع
      </Txt>
    </View>
  );
}
