import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { colors } from '../theme';
import { Row } from './layout';
import { Txt } from './Txt';

export type QuickAction = {
  emoji: string;
  label: string;
  href: string;
  /** Live state, e.g. the number of movements counted today. */
  badge?: string;
};

/**
 * The row under the Today hero. Its job is reach: the tracking tools live off
 * the tab bar, so without this they would be three taps deep on the screen she
 * opens every morning.
 */
export function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <Row gap={8} align="stretch" justify="space-between">
      {actions.map((action) => (
        <Pressable
          key={action.href}
          onPress={() => router.push(action.href as never)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? '#FCFBF7' : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 6,
            alignItems: 'center',
            gap: 4,
          })}
        >
          <View style={{ height: 22, justifyContent: 'center' }}>
            <Txt size={19} align="center">
              {action.emoji}
            </Txt>
          </View>
          <Txt size={10.5} weight={500} color={colors.body} align="center" numberOfLines={1}>
            {action.label}
          </Txt>
          <Txt size={10} color={action.badge ? colors.sage : 'transparent'} align="center" numberOfLines={1}>
            {action.badge ?? '·'}
          </Txt>
        </Pressable>
      ))}
    </Row>
  );
}
