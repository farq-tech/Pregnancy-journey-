import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AttachmentGallery } from '../../src/components/AttachmentGallery';
import { AttachmentPicker } from '../../src/components/AttachmentPicker';
import { Screen } from '../../src/components/Screen';
import { Sheet } from '../../src/components/Sheet';
import { Txt } from '../../src/components/Txt';
import {
  DateField,
  ErrorText,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  TextField,
} from '../../src/components/fields';
import { Card, Chip, Row } from '../../src/components/layout';
import { useI18n } from '../../src/i18n/LocaleProvider';
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { countdownLabel, joinMeta } from '../../src/lib/labels';
import { computeJourney } from '../../src/lib/pregnancy';
import type { PickedFile } from '../../src/lib/storage';
import { useJourney } from '../../src/store/JourneyProvider';
import {
  APPOINTMENT_TYPES,
  RECURRENCES,
  REMINDER_OFFSETS,
  appointmentTypeLabel,
  recurrenceLabel,
  reminderLabel,
  type Appointment,
  type AppointmentType,
  type Recurrence,
  type ReminderOffset,
} from '../../src/store/types';
import { colors } from '../../src/theme';

export default function AppointmentsScreen() {
  const {
    settings,
    appointments,
    today,
    addAppointment,
    toggleAppointment,
    remove,
    attachmentsFor,
    deleteAttachment,
  } = useJourney();
  const { t } = useI18n();
  const [sheetOpen, setSheetOpen] = useState(false);

  const confirmDelete = (id: string) =>
    Alert.alert(t('appt.deleteTitle'), t('appt.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void remove('appointments', id) },
    ]);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [appointments],
  );

  if (!journey) return null;

  const upcoming = sorted.filter(
    (a) => !a.done && diffDays(fromIso(a.date), journey.today) >= 0,
  ).length;

  return (
    <Screen>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <Txt size={20} weight={600}>
            {t('appointments.title')}
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            {sorted.length ? t('appt.upcoming', { n: upcoming }) : t('appt.subtitle')}
          </Txt>
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('appointments.add')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.sageDark : colors.sage,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 18,
          })}
        >
          <Txt size={13.5} weight={600} color={colors.surface}>
            {t('appointments.add')}
          </Txt>
        </Pressable>
      </Row>

      {sorted.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.borderDashed,
            borderRadius: 24,
            paddingVertical: 36,
            paddingHorizontal: 24,
          }}
        >
          <Txt size={15} weight={600} color={colors.muted} align="center">
            {t('appointments.empty')}
          </Txt>
          <Txt size={13} color={colors.muted} align="center" lineHeight={1.7} style={{ marginTop: 6 }}>
            {t('appt.emptyHint')}
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {sorted.map((appointment) => {
            const past = diffDays(fromIso(appointment.date), journey.today) < 0;
            return (
              <Card
                key={appointment.id}
                radius={20}
                padding={0}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  opacity: appointment.done ? 0.55 : 1,
                }}
              >
                <Row gap={10} align="flex-start">
                  <Pressable
                    onPress={() => void toggleAppointment(appointment.id)}
                    accessibilityLabel={t('appt.done')}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: appointment.done }}
                    hitSlop={11}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: colors.sageMid,
                      backgroundColor: appointment.done ? colors.sageRing : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    {appointment.done ? (
                      <Txt size={11} color={colors.surface} align="center">
                        ✓
                      </Txt>
                    ) : null}
                  </Pressable>

                  <View style={{ flex: 1 }}>
                    <Txt size={14.5} weight={600}>
                      {appointment.title}
                    </Txt>
                    <Txt size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                      {joinMeta(
                        joinMeta(formatDayMonth(fromIso(appointment.date)), appointment.time),
                        appointmentTypeLabel(appointment.type),
                        appointment.location,
                        appointment.doctor,
                      )}
                    </Txt>
                    {appointment.notes ? (
                      <Txt size={12.5} color={colors.muted} lineHeight={1.6} style={{ marginTop: 4 }}>
                        {appointment.notes}
                      </Txt>
                    ) : null}
                    <Row wrap gap={6} style={{ marginTop: 6 }}>
                      {appointment.reminder ? (
                        <Chip bg={colors.claySoft}>
                          <Txt size={11.5} color={colors.clayText}>
                            {`🔔 ${reminderLabel(appointment.reminder)}`}
                          </Txt>
                        </Chip>
                      ) : null}
                      {appointment.recurrence ? (
                        <Chip bg={colors.surfaceWarm}>
                          <Txt size={11.5} color={colors.muted}>
                            {`🔁 ${recurrenceLabel(appointment.recurrence)}`}
                          </Txt>
                        </Chip>
                      ) : null}
                    </Row>

                    <AttachmentGallery
                      attachments={attachmentsFor('appointment', appointment.id)}
                      onRemove={(a) => void deleteAttachment(a)}
                    />
                  </View>

                  <View style={{ alignItems: 'flex-start', gap: 6 }}>
                    <Chip>
                      <Txt size={11.5} weight={500} color={colors.sage}>
                        {past ? t('label.ended') : countdownLabel(appointment.date, journey.today)}
                      </Txt>
                    </Chip>
                    <Pressable
                      onPress={() => confirmDelete(appointment.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('appt.deleteLabel')}
                      hitSlop={12}
                      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}
                    >
                      <Txt size={15} color={colors.clayDelete}>
                        ×
                      </Txt>
                    </Pressable>
                  </View>
                </Row>
              </Card>
            );
          })}
        </View>
      )}

      <AppointmentSheet
        visible={sheetOpen}
        today={today}
        onClose={() => setSheetOpen(false)}
        onSave={addAppointment}
      />
    </Screen>
  );
}

function AppointmentSheet({
  visible,
  today,
  onClose,
  onSave,
}: {
  visible: boolean;
  today: string;
  onClose: () => void;
  onSave: (input: Omit<Appointment, 'id' | 'done'>, files?: PickedFile[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AppointmentType>('doctor');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [doctor, setDoctor] = useState('');
  const [reminder, setReminder] = useState<ReminderOffset>('24h');
  const [recurrence, setRecurrence] = useState<Recurrence>('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !date) {
      setError(t('appt.required'));
      return;
    }
    setSaving(true);
    try {
      await onSave(
        { title: title.trim(), type, date, time, location, doctor, notes, reminder, recurrence },
        files,
      );
      setTitle('');
      setTime('');
      setLocation('');
      setDoctor('');
      setNotes('');
      setRecurrence('');
      setFiles([]);
      setError('');
      onClose();
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = APPOINTMENT_TYPES.map((value) => ({ value, label: appointmentTypeLabel(value) }));
  const reminderOptions = REMINDER_OFFSETS.map((value) => ({
    value,
    label: value === '' ? reminderLabel(value) : t('appt.reminderOpt', { when: reminderLabel(value) }),
  }));
  const recurrenceOptions = RECURRENCES.map((value) => ({ value, label: recurrenceLabel(value) }));

  return (
    <Sheet visible={visible} onClose={onClose} title={t('appt.sheetTitle')}>
      <TextField
        value={title}
        onChange={setTitle}
        placeholder={t('appt.titlePh')}
        size={14.5}
      />
      <SelectField value={type} onChange={(v) => setType(v as AppointmentType)} options={typeOptions} />
      <Row gap={10} align="flex-start">
        <DateField value={date} onChange={setDate} style={{ flex: 1 }} />
        <DateField
          value={time}
          onChange={setTime}
          mode="time"
          placeholder={t('appt.timePh')}
          style={{ flex: 1 }}
        />
      </Row>
      <Row gap={10} align="flex-start">
        <TextField
          value={location}
          onChange={setLocation}
          placeholder={t('appt.locationPh')}
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={doctor}
          onChange={setDoctor}
          placeholder={t('appt.doctorPh')}
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      <Row gap={10} align="flex-start">
        <SelectField
          value={reminder}
          onChange={(v) => setReminder(v as ReminderOffset)}
          options={reminderOptions}
          style={{ flex: 1 }}
        />
        <SelectField
          value={recurrence}
          onChange={(v) => setRecurrence(v as Recurrence)}
          options={recurrenceOptions}
          style={{ flex: 1 }}
        />
      </Row>
      <TextField value={notes} onChange={setNotes} placeholder={t('appt.notesPh')} rows={2} size={14.5} />
      <AttachmentPicker files={files} onChange={setFiles} label={t('appt.attach')} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton
          label={saving ? t('common.saving') : t('appt.saveBtn')}
          onPress={submit}
          style={{ flex: 2 }}
        />
        <SecondaryButton label={t('common.cancel')} onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
