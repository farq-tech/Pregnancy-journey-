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
  TextField,
} from '../../src/components/fields';
import { Card, Row } from '../../src/components/layout';
import { useI18n } from '../../src/i18n/LocaleProvider';
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { computeJourney } from '../../src/lib/pregnancy';
import type { PickedFile } from '../../src/lib/storage';
import { useJourney } from '../../src/store/JourneyProvider';
import { MOODS, moodLabel, type JournalEntry } from '../../src/store/types';
import { colors } from '../../src/theme';

export default function JournalScreen() {
  const { settings, journal, today, addJournalEntry, remove, attachmentsFor, deleteAttachment } =
    useJourney();
  const { t } = useI18n();
  const [sheetOpen, setSheetOpen] = useState(false);

  const confirmDelete = (id: string) =>
    Alert.alert(t('journal.deleteTitle'), t('journal.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void remove('journal', id) },
    ]);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  if (!journey) return null;

  return (
    <Screen>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <Txt size={20} weight={600}>
            {t('journal.title')}
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            {t('journal.subtitle')}
          </Txt>
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('journal.add')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.sageDark : colors.sage,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 18,
          })}
        >
          <Txt size={13.5} weight={600} color={colors.surface}>
            {t('journal.add')}
          </Txt>
        </Pressable>
      </Row>

      {journal.length === 0 ? (
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
            {t('journal.empty')}
          </Txt>
          <Txt size={13} color={colors.muted} align="center" lineHeight={1.7} style={{ marginTop: 6 }}>
            {t('journal.emptyHint')}
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {journal.map((entry) => {
            const gestationalDay = diffDays(fromIso(entry.date), journey.effectiveLmp);
            const entryWeek = Math.floor(gestationalDay / 7) + 1;
            return (
              <Card
                key={entry.id}
                radius={20}
                padding={0}
                style={{ paddingVertical: 16, paddingHorizontal: 18 }}
              >
                <Row justify="space-between">
                  <Txt size={12.5} weight={500} color={colors.muted}>
                    {entryWeek >= 1
                      ? `${formatDayMonth(fromIso(entry.date))} · ${t('journal.weekN', { n: entryWeek })}`
                      : formatDayMonth(fromIso(entry.date))}
                  </Txt>
                  <Pressable
                    onPress={() => confirmDelete(entry.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('journal.deleteLabel')}
                    hitSlop={12}
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Txt size={15} color={colors.clayDelete}>
                      ×
                    </Txt>
                  </Pressable>
                </Row>

                {entry.mood ? (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: colors.claySoft,
                      borderRadius: 999,
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      marginTop: 8,
                    }}
                  >
                    <Txt size={12} color={colors.clayText}>
                      {moodLabel(entry.mood)}
                    </Txt>
                  </View>
                ) : null}

                {entry.text ? (
                  <Txt size={14} color={colors.body} lineHeight={1.9} style={{ marginTop: 8 }}>
                    {`"${entry.text}"`}
                  </Txt>
                ) : null}

                {entry.symptoms || entry.weight != null ? (
                  <Row gap={12} style={{ marginTop: 8 }}>
                    {entry.symptoms ? (
                      <Txt size={12} color={colors.muted}>
                        {t('journal.symptoms', { v: entry.symptoms })}
                      </Txt>
                    ) : null}
                    {entry.weight != null ? (
                      <Txt size={12} color={colors.muted}>
                        {t('journal.weight', { v: entry.weight })}
                      </Txt>
                    ) : null}
                  </Row>
                ) : null}

                <AttachmentGallery
                  attachments={attachmentsFor('journal', entry.id)}
                  onRemove={(a) => void deleteAttachment(a)}
                />
              </Card>
            );
          })}
        </View>
      )}

      <JournalSheet
        visible={sheetOpen}
        today={today}
        onClose={() => setSheetOpen(false)}
        onSave={addJournalEntry}
      />
    </Screen>
  );
}

function JournalSheet({
  visible,
  today,
  onClose,
  onSave,
}: {
  visible: boolean;
  today: string;
  onClose: () => void;
  onSave: (input: Omit<JournalEntry, 'id'>, files?: PickedFile[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState('');
  const [text, setText] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [weight, setWeight] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim() && !mood) {
      setError(t('journal.needContent'));
      return;
    }
    const parsedWeight = weight.trim() ? Number(weight) : null;
    if (parsedWeight !== null && (Number.isNaN(parsedWeight) || parsedWeight <= 0)) {
      setError(t('journal.badWeight'));
      return;
    }
    setSaving(true);
    try {
      await onSave({ date, mood, text: text.trim(), symptoms, weight: parsedWeight }, files);
      setMood('');
      setText('');
      setSymptoms('');
      setWeight('');
      setFiles([]);
      setError('');
      onClose();
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('journal.sheetTitle')}>
      <DateField value={date} onChange={setDate} />

      <View>
        <Txt size={13} weight={500} style={{ marginBottom: 8 }}>
          {t('journal.moodTitle')}
        </Txt>
        <Row wrap gap={7}>
          {MOODS.map((option) => {
            const active = mood === option;
            return (
              <Pressable
                key={option}
                // Tapping the selected mood clears it, so an entry can be text-only.
                onPress={() => setMood(active ? '' : option)}
                accessibilityRole="radio"
                accessibilityLabel={moodLabel(option)}
                accessibilityState={{ selected: active }}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: 999,
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  backgroundColor: active ? colors.sage : colors.surfaceWarm,
                }}
              >
                <Txt size={13} color={active ? colors.surface : colors.sage}>
                  {moodLabel(option)}
                </Txt>
              </Pressable>
            );
          })}
        </Row>
      </View>

      <TextField value={text} onChange={setText} placeholder={t('journal.placeholder')} rows={3} size={14.5} />
      <Row gap={10} align="flex-start">
        <TextField
          value={symptoms}
          onChange={setSymptoms}
          placeholder={t('journal.symptomsPh')}
          size={14.5}
          style={{ flex: 2 }}
        />
        <TextField
          value={weight}
          onChange={setWeight}
          placeholder={t('journal.weightPh')}
          keyboardType="decimal-pad"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      <AttachmentPicker files={files} onChange={setFiles} label={t('journal.photo')} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton label={saving ? t('common.saving') : t('common.save')} onPress={submit} style={{ flex: 2 }} />
        <SecondaryButton label={t('common.cancel')} onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
