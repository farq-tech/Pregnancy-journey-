import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { formatLong } from '../lib/arabic';
import { fromIso, toIso, type IsoDate } from '../lib/dates';
import { colors, fonts } from '../theme';
import { DateControl } from './DateControl';
import { Row } from './layout';
import { Txt } from './Txt';

/** Shared input chrome, matching the prototype's 12/14px inset and 12px radius. */
const inputStyle = {
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  backgroundColor: colors.surface,
  color: colors.text,
  fontFamily: fonts[400],
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
};

export function FieldLabel({ children }: { children: string }) {
  return (
    <Txt size={13} weight={500} style={{ marginBottom: 6 }}>
      {children}
    </Txt>
  );
}

export function Hint({ children }: { children: string }) {
  return (
    <Txt size={12} color={colors.muted} lineHeight={1.5} style={{ marginTop: 5 }}>
      {children}
    </Txt>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  rows,
  hint,
  ltr,
  size = 15,
  style,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Renders a multiline box this many lines tall. */
  rows?: number;
  hint?: string;
  /** For URLs and other content that must stay left-to-right. */
  ltr?: boolean;
  size?: number;
  style?: object;
}) {
  return (
    <View style={style}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={keyboardType}
        multiline={!!rows}
        numberOfLines={rows}
        style={[
          inputStyle,
          { fontSize: size },
          rows ? { height: 24 * rows + 24, textAlignVertical: 'top' as const } : null,
          ltr ? { textAlign: 'left' as const, writingDirection: 'ltr' as const } : null,
        ]}
      />
      {hint ? <Hint>{hint}</Hint> : null}
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  hint,
  placeholder = 'اختاري التاريخ',
  mode = 'date',
  style,
}: {
  label?: string;
  /** `YYYY-MM-DD`, or `HH:mm` when `mode` is `time`. Empty means unset. */
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  mode?: 'date' | 'time';
  style?: object;
}) {
  const [open, setOpen] = useState(false);

  const asDate = () => {
    if (!value) return new Date();
    if (mode === 'time') {
      const [h, m] = value.split(':').map(Number);
      const d = new Date();
      d.setHours(h || 0, m || 0, 0, 0);
      return d;
    }
    return fromIso(value as IsoDate);
  };

  const emit = (d: Date) => {
    if (mode === 'time') {
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
      onChange(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      onChange(toIso(d));
    }
  };

  const display = value
    ? mode === 'time'
      ? value
      : formatLong(fromIso(value as IsoDate))
    : placeholder;

  const picker = (
    <DateControl
      value={asDate()}
      mode={mode}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event, selected) => {
        // Android fires once and dismisses itself; iOS streams updates while the
        // spinner moves and is dismissed by the "تم" button below.
        if (Platform.OS !== 'ios') setOpen(false);
        if (event.type === 'dismissed' || !selected) return;
        emit(selected);
      }}
    />
  );

  return (
    <View style={style}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable onPress={() => setOpen(true)} style={inputStyle}>
        <Txt size={15} color={value ? colors.text : colors.faint}>
          {display}
        </Txt>
      </Pressable>
      {hint ? <Hint>{hint}</Hint> : null}

      {open && Platform.OS !== 'ios' ? picker : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.scrim} onPress={() => setOpen(false)} />
          <View style={styles.pickerSheet}>
            {picker}
            <Pressable onPress={() => setOpen(false)} style={styles.pickerDone}>
              <Txt size={15} weight={600} color={colors.surface} align="center">
                تم
              </Txt>
            </Pressable>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

export type SelectOption = { value: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  style,
}: {
  label?: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (v: string) => void;
  style?: object;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={style}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable onPress={() => setOpen(true)} style={inputStyle}>
        <Row justify="space-between">
          <Txt size={15} color={current ? colors.text : colors.faint}>
            {current?.label ?? 'اختاري'}
          </Txt>
          <Txt size={11} color={colors.muted}>
            ▼
          </Txt>
        </Row>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} />
        <View style={styles.optionSheet}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={[styles.option, active && { backgroundColor: colors.sageSoft }]}
              >
                <Txt size={15} weight={active ? 600 : 400} color={active ? colors.sageDark : colors.text}>
                  {option.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        pressed && { backgroundColor: colors.sageDark },
        style,
      ]}
    >
      <Txt size={15} weight={600} color={colors.surface} align="center">
        {label}
      </Txt>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        pressed && { backgroundColor: colors.sageSoft },
        style,
      ]}
    >
      <Txt size={15} color={colors.muted} align="center">
        {label}
      </Txt>
    </Pressable>
  );
}

export function ErrorText({ children }: { children: string }) {
  return (
    <Txt size={13} color={colors.error}>
      {children}
    </Txt>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(44,51,43,.35)',
  },
  pickerSheet: {
    marginTop: 'auto',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
  },
  pickerDone: {
    marginTop: 8,
    backgroundColor: colors.sage,
    borderRadius: 13,
    paddingVertical: 14,
  },
  optionSheet: {
    marginTop: 'auto',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 12,
    paddingBottom: 32,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primary: {
    backgroundColor: colors.sage,
    borderRadius: 13,
    paddingVertical: 14,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingVertical: 14,
  },
});
