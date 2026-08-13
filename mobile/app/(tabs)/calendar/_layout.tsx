import { Stack } from 'expo-router';

import { colors } from '../../../src/theme';

/**
 * A stack inside the calendar tab so a day page pushes over the month while the
 * tab bar stays put — the prototype keeps its nav visible on the day view and
 * highlights "التقويم" there.
 */
export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
