import { Text, type TextProps, type TextStyle } from 'react-native';

import { useI18n } from '../i18n/LocaleProvider';
import { colors, fonts, type FontWeightKey } from '../theme';

type Props = TextProps & {
  /** CSS-style numeric weight; maps to the matching Rubik family. */
  weight?: FontWeightKey;
  size?: number;
  color?: string;
  /** CSS `line-height` multiplier from the prototype, e.g. 1.9. */
  lineHeight?: number;
  align?: TextStyle['textAlign'];
};

/**
 * Text with the app's defaults: Rubik, right-aligned, RTL writing direction.
 *
 * `writingDirection` is set per-Text rather than app-wide because the layout
 * engine is deliberately left in LTR (see index.ts) — this is what makes Arabic
 * punctuation sit on the correct side of a line.
 */
export function Txt({
  weight = 400,
  size = 14,
  color = colors.text,
  lineHeight,
  align,
  style,
  ...rest
}: Props) {
  const { rtl } = useI18n();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color,
          textAlign: align ?? (rtl ? 'right' : 'left'),
          writingDirection: rtl ? 'rtl' : 'ltr',
          // Cap Dynamic Type so fixed-size boxes survive the largest settings.
          
          ...(lineHeight ? { lineHeight: Math.round(size * lineHeight) } : null),
        },
        style,
      ]}
    />
  );
}

