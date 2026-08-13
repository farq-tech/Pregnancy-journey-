import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

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
  align = 'right',
  style,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color,
          textAlign: align,
          ...(lineHeight ? { lineHeight: Math.round(size * lineHeight) } : null),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
  },
});
