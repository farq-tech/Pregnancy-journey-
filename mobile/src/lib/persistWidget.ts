import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

import { WIDGET_GLANCE_KEY, type WidgetGlance } from './widgetGlance';

/**
 * Writes the glance for the in-app card and, on a native iOS build that linked
 * the widget bridge, for WidgetKit via the App Group.
 */
export async function persistWidgetGlance(glance: WidgetGlance): Promise<void> {
  const json = JSON.stringify(glance);
  await AsyncStorage.setItem(WIDGET_GLANCE_KEY, json);
  if (Platform.OS !== 'ios') return;
  const bridge = NativeModules.WidgetBridge as { save?: (payload: string) => void } | undefined;
  try {
    bridge?.save?.(json);
  } catch {
    // The extension is optional until the next native prebuild.
  }
}
