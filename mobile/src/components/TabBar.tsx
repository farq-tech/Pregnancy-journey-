import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import {
  BabyIcon,
  CalendarIcon,
  ClockIcon,
  FileIcon,
  HeartIcon,
  JournalIcon,
} from './icons';
import { Txt } from './Txt';

type TabSpec = {
  name: string;
  label: string;
  Icon: (props: { size?: number; color?: string }) => React.ReactElement;
};

/**
 * The slice of the navigator's tab-bar props this component actually reads.
 * Declared structurally rather than imported: the real type lives behind
 * `expo-router/build/react-navigation/...`, a private path that moves between
 * releases.
 */
type TabBarProps = {
  state: {
    index: number;
    routes: readonly { key: string; name: string }[];
  };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

/** Right-to-left reading order, matching the prototype's nav. */
const TABS: readonly TabSpec[] = [
  { name: 'index', label: 'اليوم', Icon: HeartIcon },
  { name: 'calendar', label: 'التقويم', Icon: CalendarIcon },
  { name: 'baby', label: 'طفلك', Icon: BabyIcon },
  { name: 'appointments', label: 'المواعيد', Icon: ClockIcon },
  { name: 'journal', label: 'اليوميات', Icon: JournalIcon },
  { name: 'records', label: 'الملف', Icon: FileIcon },
];

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 2) }]}>
      {TABS.map(({ name, label, Icon }) => {
        // Nested stacks mean the calendar tab stays lit on a day page, and the
        // baby tab on a week page — the group route is what's active either way.
        const focused = activeName === name;
        const color = focused ? colors.navActive : colors.navInactive;

        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes.find((route) => route.name === name)?.key ?? name,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(name);
            }}
            style={styles.tab}
          >
            <Icon size={21} color={color} />
            <Txt size={10} weight={500} color={color} align="center">
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    // The prototype uses a backdrop blur; at 92% white over the app's warm
    // off-white canvas the blur is not perceptible, so this stays a flat fill.
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.track,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
  },
});
