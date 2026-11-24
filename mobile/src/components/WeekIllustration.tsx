import { Image } from 'expo-image';
import { View } from 'react-native';

import { BABY_WEEK_IMAGES } from '../../assets/babyWeeks';
import { illustrationWeek } from '../lib/pregnancy';
import { useI18n } from '../i18n/LocaleProvider';
import { colors } from '../theme';
import { Txt } from './Txt';

/**
 * Circular illustration for a gestational week, replacing the prototype's
 * `<image-slot>`.
 *
 * Falls back to a designed placeholder carrying the week number, so the layout
 * is complete — and honest — before licensed artwork exists.
 */
export function WeekIllustration({
  week,
  size,
  caption,
  variant = 'full',
  showCaption = false,
}: {
  week: number;
  size: number;
  /** Used for the accessibility label when the asset has no alt text of its own. */
  caption?: string;
  /** `thumbnail` picks the smaller asset when one is registered. */
  variant?: 'full' | 'thumbnail';
  /** Renders the asset's caption underneath, where there is room for it. */
  showCaption?: boolean;
}) {
  const { t } = useI18n();
  const resolved = illustrationWeek(week);
  const asset = BABY_WEEK_IMAGES[resolved];

  if (asset) {
    const source = variant === 'thumbnail' ? (asset.thumbnail ?? asset.full) : asset.full;
    return (
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Image
          source={source}
          accessibilityLabel={asset.alt}
          accessible
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={150}
        />
        {showCaption && asset.caption ? (
          <Txt size={11.5} color={colors.muted} align="center" lineHeight={1.5}>
            {asset.caption}
          </Txt>
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={t('cmp.weekImageLabel', { caption: caption ?? t('cmp.weekImage'), n: resolved })}
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
        alignSelf: 'center',
      }}
    >
      <Txt size={size * 0.26} weight={600} color={colors.sage} align="center">
        {resolved}
      </Txt>
      <Txt size={Math.max(11, size * 0.1)} color={colors.muted} align="center">
        {t('cmp.week')}
      </Txt>
    </View>
  );
}
