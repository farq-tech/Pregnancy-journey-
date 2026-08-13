import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors } from '../theme';

/**
 * A horizontal row that reads right-to-left.
 *
 * Every `display:flex` row in the prototype sits inside `dir="rtl"`, so its
 * first child renders at the right edge. `row-reverse` reproduces that while
 * the layout engine stays in its LTR base direction, which keeps the result
 * identical no matter what the device language is.
 */
export function Row({
  gap,
  align = 'center',
  justify,
  wrap,
  style,
  ...rest
}: ViewProps & {
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
}) {
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: 'row-reverse',
          alignItems: align,
          ...(gap ? { gap } : null),
          ...(justify ? { justifyContent: justify } : null),
          ...(wrap ? { flexWrap: 'wrap' as const } : null),
        },
        style,
      ]}
    />
  );
}

/** The white rounded card used across every screen. */
export function Card({
  padding = 20,
  radius = 24,
  style,
  ...rest
}: ViewProps & { padding?: number; radius?: number }) {
  return (
    <View
      {...rest}
      style={[styles.card, { padding, borderRadius: radius }, style]}
    />
  );
}

/** Rounded tag, e.g. `اليوم 101 من 280`. */
export function Chip({
  bg = colors.sageSoft,
  children,
  style,
}: {
  bg?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.chip, { backgroundColor: bg }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
});
