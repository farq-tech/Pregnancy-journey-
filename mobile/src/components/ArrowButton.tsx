import { Pressable } from 'react-native';

import { colors } from '../theme';
import { ChevronIcon } from './icons';

/** The 36×36 stepper button used by the calendar, day and week headers. */
export function ArrowButton({
  direction,
  onPress,
  label,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.sageSoft : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <ChevronIcon size={16} direction={direction} />
    </Pressable>
  );
}
