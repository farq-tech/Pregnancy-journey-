import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

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
import { ChevronIcon } from '../../src/components/icons';
import { Card, Chip, Row } from '../../src/components/layout';
import { checklistById, itemsOf } from '../../src/content/checklists';
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { countdownLabel, joinMeta } from '../../src/lib/labels';
import { computeJourney } from '../../src/lib/pregnancy';
import type { PickedFile } from '../../src/lib/storage';
import { useJourney } from '../../src/store/JourneyProvider';
import {
  APPOINTMENT_TYPE_LABELS,
  RECURRENCE_LABELS,
  REMINDER_LABELS,
  type Appointment,
  type AppointmentType,
  type Recurrence,
  type ReminderOffset,
} from '../../src/store/types';
import { colors } from '../../src/theme';

const TYPE_OPTIONS = (Object.keys(APPOINTMENT_TYPE_LABELS) as AppointmentType[]).map((value) => ({
  value,
  label: APPOINTMENT_TYPE_LABELS[value],
}));

const REMINDER_OPTIONS = (Object.keys(REMINDER_LABELS) as ReminderOffset[]).map((value) => ({
  value,
  label: value === '' ? 'بدون تذكير' : `تذكير ${REMINDER_LABELS[value]}`,
}));

const RECURRENCE_OPTIONS = (Object.keys(RECURRENCE_LABELS) as Recurrence[]).map((value) => ({
  value,
  label: RECURRENCE_LABELS[value],
}));

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
    checklist,
  } = useJourney();
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const visitList = checklistById('visit');
  const visitTicks = checklist.filter((tick) => tick.listId === 'visit');
  const visitTotal =
    (visitList ? itemsOf(visitList).length : 0) + visitTicks.filter((tick) => tick.label).length;
  const visitDone = visitTicks.filter((tick) => tick.done).length;

  return (
    <Screen>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <Txt size={20} weight={600}>
            المواعيد
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            {sorted.length ? `${upcoming} مواعيد قادمة` : 'نظّمي زياراتك وفحوصاتك'}
          </Txt>
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.sageDark : colors.sage,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 18,
          })}
        >
          <Txt size={13.5} weight={600} color={colors.surface}>
            + إضافة موعد
          </Txt>
        </Pressable>
      </Row>

      {/* The questions and the paperwork are what a visit actually needs, and
          they are remembered on the way out, not on the way in. */}
      <Pressable
        onPress={() => router.push({ pathname: '/checklists/[list]', params: { list: 'visit' } })}
      >
        {({ pressed }) => (
          <Card
            radius={20}
            padding={0}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              backgroundColor: pressed ? '#FCFBF7' : colors.surface,
            }}
          >
            <Row gap={12}>
              <Txt size={18}>🩺</Txt>
              <View style={{ flex: 1 }}>
                <Txt size={14.5} weight={600}>
                  تحضير الزيارة
                </Txt>
                <Txt size={12} color={colors.muted} lineHeight={1.6} style={{ marginTop: 1 }}>
                  {`ما تأخذينه معك وما تسألين عنه · ${visitDone} من ${visitTotal}`}
                </Txt>
              </View>
              <ChevronIcon size={18} color={colors.muted} direction="left" />
            </Row>
          </Card>
        )}
      </Pressable>

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
            لا مواعيد بعد
          </Txt>
          <Txt size={13} color={colors.faint} align="center" lineHeight={1.7} style={{ marginTop: 6 }}>
            {'أضيفي موعد الطبيب أو السونار أو التحاليل\nمع تذكير قبل الموعد'}
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
                    accessibilityLabel="تم؟"
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: appointment.done }}
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
                        APPOINTMENT_TYPE_LABELS[appointment.type],
                        appointment.location,
                        appointment.doctor,
                      )}
                    </Txt>
                    {appointment.notes ? (
                      <Txt size={12.5} color={colors.faint} lineHeight={1.6} style={{ marginTop: 4 }}>
                        {appointment.notes}
                      </Txt>
                    ) : null}
                    <Row wrap gap={6} style={{ marginTop: 6 }}>
                      {appointment.reminder ? (
                        <Chip bg={colors.claySoft}>
                          <Txt size={11.5} color={colors.clayText}>
                            {`🔔 ${REMINDER_LABELS[appointment.reminder]}`}
                          </Txt>
                        </Chip>
                      ) : null}
                      {appointment.recurrence ? (
                        <Chip bg={colors.surfaceWarm}>
                          <Txt size={11.5} color={colors.muted}>
                            {`🔁 ${RECURRENCE_LABELS[appointment.recurrence]}`}
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
                        {past ? 'انتهى' : countdownLabel(appointment.date, journey.today)}
                      </Txt>
                    </Chip>
                    <Pressable
                      onPress={() => void remove('appointments', appointment.id)}
                      accessibilityLabel="حذف الموعد"
                      style={{ alignSelf: 'center' }}
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
      setError('العنوان والتاريخ مطلوبان.');
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
      setError('تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="إضافة موعد">
      <TextField
        value={title}
        onChange={setTitle}
        placeholder="العنوان — مثال: موعد السونار"
        size={14.5}
      />
      <SelectField value={type} onChange={(v) => setType(v as AppointmentType)} options={TYPE_OPTIONS} />
      <Row gap={10} align="flex-start">
        <DateField value={date} onChange={setDate} style={{ flex: 1 }} />
        <DateField
          value={time}
          onChange={setTime}
          mode="time"
          placeholder="الوقت"
          style={{ flex: 1 }}
        />
      </Row>
      <Row gap={10} align="flex-start">
        <TextField
          value={location}
          onChange={setLocation}
          placeholder="المكان"
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={doctor}
          onChange={setDoctor}
          placeholder="الطبيب"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      <Row gap={10} align="flex-start">
        <SelectField
          value={reminder}
          onChange={(v) => setReminder(v as ReminderOffset)}
          options={REMINDER_OPTIONS}
          style={{ flex: 1 }}
        />
        <SelectField
          value={recurrence}
          onChange={(v) => setRecurrence(v as Recurrence)}
          options={RECURRENCE_OPTIONS}
          style={{ flex: 1 }}
        />
      </Row>
      <TextField value={notes} onChange={setNotes} placeholder="ملاحظات" rows={2} size={14.5} />
      <AttachmentPicker files={files} onChange={setFiles} label="إرفاق" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton
          label={saving ? 'جارٍ الحفظ…' : 'حفظ الموعد'}
          onPress={submit}
          style={{ flex: 2 }}
        />
        <SecondaryButton label="إلغاء" onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
