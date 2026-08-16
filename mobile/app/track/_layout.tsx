import { Stack } from 'expo-router';

import { colors } from '../../src/theme';

/**
 * The tracking tools push over the tab bar rather than living in it: they are
 * full-attention screens — a running timer, a count in progress — and the nav
 * underneath them is a way to lose a count halfway.
 */
export default function TrackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
