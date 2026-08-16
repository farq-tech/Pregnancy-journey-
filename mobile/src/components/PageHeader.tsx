import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { colors } from '../theme';
import { Row } from './layout';
import { Txt } from './Txt';

/**
 * Header for the screens that push over the tab bar — tracking, learning,
 * checklists, letters. The back affordance points right, because in an RTL
 * layout "back" is where the previous page came from.
 */
export function PageHeader({
  title,
  subtitle,
  backLabel = 'رجوع',
  action,
}: {
  title: string;
  subtitle?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={{ alignSelf: 'flex-start' }}
        hitSlop={8}
      >
        <Txt size={12.5} color={colors.muted}>
          {`← ${backLabel}`}
        </Txt>
      </Pressable>

      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1 }}>
          <Txt size={20} weight={600}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt size={12.5} color={colors.muted} lineHeight={1.6} style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {action}
      </Row>
    </View>
  );
}
