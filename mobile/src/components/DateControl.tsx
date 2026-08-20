import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * The platform date/time control.
 *
 * On iOS and Android this is the OS picker. The `.web.tsx` sibling swaps in the
 * browser's own date input, because `@react-native-community/datetimepicker` is
 * native-only — pulling it into the web bundle is what made the exported site
 * fail as soon as a screen with a date field rendered.
 */
export const DateControl = DateTimePicker;
