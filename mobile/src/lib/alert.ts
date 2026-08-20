/**
 * Alerts that also exist on the web.
 *
 * React Native Web does not implement `Alert`, so calling `Alert.alert` in a web
 * build throws on an undefined module rather than showing anything — a delete
 * button that crashes the page instead of asking. These two helpers map to the
 * OS dialog on iOS/Android and to the browser's own dialogs on the web.
 */

import { Alert, Platform } from 'react-native';

export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Asks for confirmation before something destructive. `onConfirm` runs only if
 * she says yes; there is no "cancel" callback because nothing needs to happen.
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  cancelLabel = 'إلغاء',
  onConfirm,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}): void {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
