import { colors, fonts } from '../theme';

/**
 * Web stand-in for the native date/time picker.
 *
 * `@react-native-community/datetimepicker` has no web implementation, so the
 * browser's own `<input type="date">` / `<input type="time">` takes its place —
 * same props in, same `(event, date)` out, so `DateField` does not care which
 * one it rendered. React Native Web renders real DOM, so a plain `input` is a
 * legal child here.
 */
export function DateControl({
  value,
  mode = 'date',
  onChange,
}: {
  value: Date;
  mode?: 'date' | 'time';
  /** Accepted and ignored — it only selects between the native iOS/Android widgets. */
  display?: string;
  onChange: (event: { type: 'set' | 'dismissed' }, date?: Date) => void;
}) {
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  const asValue =
    mode === 'time'
      ? `${pad(value.getHours())}:${pad(value.getMinutes())}`
      : `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

  return (
    <input
      type={mode === 'time' ? 'time' : 'date'}
      value={asValue}
      autoFocus
      onChange={(event) => {
        const next = event.target.value;
        // Clearing the field is the browser's version of dismissing the picker.
        if (!next) {
          onChange({ type: 'dismissed' });
          return;
        }

        const picked = new Date(value.getTime());
        if (mode === 'time') {
          const [hours, minutes] = next.split(':').map(Number);
          picked.setHours(hours || 0, minutes || 0, 0, 0);
        } else {
          const [year, month, day] = next.split('-').map(Number);
          // Set the parts rather than parsing the string: `new Date('2026-08-20')`
          // is parsed as UTC and lands on the previous day west of Greenwich.
          picked.setFullYear(year, (month || 1) - 1, day || 1);
          picked.setHours(0, 0, 0, 0);
        }
        onChange({ type: 'set' }, picked);
      }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 14px',
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        backgroundColor: colors.surface,
        color: colors.text,
        fontFamily: fonts[400],
        fontSize: 15,
        textAlign: 'right',
      }}
    />
  );
}
