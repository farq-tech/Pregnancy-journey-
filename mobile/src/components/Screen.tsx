import type { ReactNode } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

/**
 * Standard scrolling screen body: the prototype's `padding:14px 18px 24px` with
 * a 14px stack gap, plus the status-bar inset.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  gap = 14,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  gap?: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 14,
        paddingHorizontal: 18,
        paddingBottom: 24,
        gap,
      }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
