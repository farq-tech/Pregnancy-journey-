import { Stack } from 'expo-router';

import { colors } from '../../../src/theme';

/** Week pages push over the timeline, keeping "طفلك" lit in the tab bar. */
export default function BabyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
