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
import { TESTS } from '../../src/content/pregnancyData';
import { useI18n } from '../../src/i18n/LocaleProvider';
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import type { PickedFile } from '../../src/lib/storage';
import { useJourney } from '../../src/store/JourneyProvider';
import {
  RECORD_TYPES,
  TEST_STATUSES,
  recordTypeLabel,
  testStatusLabel,
  type MedicalRecord,
  type RecordType,
  type TestStatus,
} from '../../src/store/types';
import { colors } from '../../src/theme';

export default function RecordsScreen() {
  const {
    settings,
    records,
    tests,
    today,
    addRecord,
    remove,
    attachmentsFor,
    deleteAttachment,
    setTestStatus,
  } = useJourney();
  const { t } = useI18n();
  const [sheetOpen, setSheetOpen] = useState(false);

  const confirmDelete = (id: string) =>
    Alert.alert(t('rec.deleteTitle'), t('rec.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void remove('records', id) },
    ]);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  if (!journey) return null;

  const currentWeek = clampWeek(journey.week);

  return (
    <Screen>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <Txt size={20} weight={600}>
            {t('records.title')}
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            {t('records.subtitle')}
          </Txt>
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('records.add')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.sageDark : colors.sage,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 18,
          })}
        >
          <Txt size={13.5} weight={600} color={colors.surface}>
            {t('records.add')}
          </Txt>
        </Pressable>
      </Row>

      {records.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.borderDashed,
            borderRadius: 24,
            paddingVertical: 30,
            paddingHorizontal: 24,
          }}
        >
          <Txt size={15} weight={600} color={colors.muted} align="center">
            {t('records.empty')}
          </Txt>
          <Txt size={13} color={colors.muted} align="center" lineHeight={1.7} style={{ marginTop: 6 }}>
            {t('rec.emptyHint')}
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {records.map((record) => {
            const gestationalDay = diffDays(fromIso(record.date), journey.effectiveLmp);
            const recordWeek = Math.floor(gestationalDay / 7) + 1;
            return (
              <Card
                key={record.id}
                radius={20}
                padding={0}
                style={{ paddingVertical: 16, paddingHorizontal: 18 }}
              >
                <Row justify="space-between">
                  <Row gap={8}>
                    <Chip>
                      <Txt size={11.5} weight={600} color={colors.sageDark}>
                        {recordTypeLabel(record.type)}
                      </Txt>
                    </Chip>
                    <Txt size={12} color={colors.muted}>
                      {recordWeek >= 1
                        ? `${formatDayMonth(fromIso(record.date))} · ${t('rec.weekN', { n: recordWeek })}`
                        : formatDayMonth(fromIso(record.date))}
                    </Txt>
                  </Row>
                  <Pressable
                    onPress={() => confirmDelete(record.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('rec.deleteLabel')}
                    hitSlop={12}
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Txt size={15} color={colors.clayDelete}>
                      ×
                    </Txt>
                  </Pressable>
                </Row>

                <Txt size={14.5} weight={600} style={{ marginTop: 8 }}>
                  {record.title}
                </Txt>
                {record.provider ? (
                  <Txt size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                    {record.provider}
                  </Txt>
                ) : null}

                {record.type === 'ultrasound' &&
                (record.crl || record.fhr || record.newEdd || record.scanGaDays != null) ? (
                  <Row wrap gap={10} style={{ marginTop: 6 }}>
                    {record.crl ? (
                      <Txt size={12} color={colors.sage}>{`CRL: ${record.crl}`}</Txt>
                    ) : null}
                    {record.fhr ? (
                      <Txt size={12} color={colors.sage}>{t('rec.fhr', { v: record.fhr })}</Txt>
                    ) : null}
                    {record.scanGaDays != null ? (
                      <Txt size={12} color={colors.sage}>
                        {t('rec.scanGa', { w: Math.floor(record.scanGaDays / 7), d: record.scanGaDays % 7 })}
                      </Txt>
                    ) : null}
                    {record.newEdd ? (
                      <Txt size={12} color={colors.clayText}>
                        {t('rec.newEdd', { v: formatDayMonth(fromIso(record.newEdd)) })}
                      </Txt>
                    ) : null}
                  </Row>
                ) : null}

                {record.notes ? (
                  <Txt size={12.5} color={colors.muted} lineHeight={1.7} style={{ marginTop: 6 }}>
                    {record.notes}
                  </Txt>
                ) : null}

                <AttachmentGallery
                  attachments={attachmentsFor('record', record.id)}
                  onRemove={(a) => void deleteAttachment(a)}
                />
              </Card>
            );
          })}
        </View>
      )}

      <Txt size={15} weight={600} style={{ marginTop: 4 }}>
        {t('records.tests')}
      </Txt>
      <Txt size={12} color={colors.muted} lineHeight={1.7} style={{ marginTop: -8 }}>
        {t('rec.testsNote')}
      </Txt>

      <Card style={{ paddingVertical: 18, paddingHorizontal: 20, gap: 16 }}>
        {TESTS.map((test) => {
          // The catalogue window is advisory. Her own status, when she has set
          // one, always takes precedence over where the calendar happens to be.
          const isCurrent = currentWeek >= test.from && currentWeek <= test.to;
          const timing = isCurrent
            ? t('rec.timingNow')
            : currentWeek > test.to
              ? t('rec.timingPast')
              : t('rec.timingSoon');
          const tracked = tests.find((x) => x.testId === test.id);

          return (
            <View key={test.id} style={{ gap: 8 }}>
              <Row gap={10} align="flex-start">
                <View style={{ flex: 1 }}>
                  <Txt size={13.5} weight={600}>
                    {test.name}
                  </Txt>
                  <Txt size={12} color={colors.muted} lineHeight={1.7} style={{ marginTop: 2 }}>
                    {test.why}
                  </Txt>
                  <Txt size={11.5} color={colors.muted} style={{ marginTop: 2 }}>
                    {t('rec.weekRange', { from: test.from, to: test.to })}
                  </Txt>
                </View>
                <Chip bg={isCurrent ? colors.sageSoft : colors.surfaceWarm} style={{ marginTop: 2 }}>
                  <Txt size={11} weight={500} color={isCurrent ? colors.sageDark : colors.muted}>
                    {timing}
                  </Txt>
                </Chip>
              </Row>

              <Row wrap gap={6}>
                {TEST_STATUSES.map((status) => {
                  const active = tracked?.status === status;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => void setTestStatus(test.id, status)}
                      accessibilityRole="radio"
                      accessibilityLabel={`${test.name}: ${testStatusLabel(status)}`}
                      accessibilityState={{ selected: active }}
                      style={{
                        minHeight: 44,
                        justifyContent: 'center',
                        borderRadius: 999,
                        paddingVertical: 5,
                        paddingHorizontal: 11,
                        borderWidth: 1,
                        borderColor: active ? colors.sage : colors.border,
                        backgroundColor: active ? colors.sage : colors.surface,
                      }}
                    >
                      <Txt size={11} weight={active ? 600 : 400} color={active ? colors.surface : colors.muted}>
                        {testStatusLabel(status)}
                      </Txt>
                    </Pressable>
                  );
                })}
              </Row>
            </View>
          );
        })}
      </Card>

      <RecordSheet
        visible={sheetOpen}
        today={today}
        onClose={() => setSheetOpen(false)}
        onSave={addRecord}
      />
    </Screen>
  );
}

function RecordSheet({
  visible,
  today,
  onClose,
  onSave,
}: {
  visible: boolean;
  today: string;
  onClose: () => void;
  onSave: (input: Omit<MedicalRecord, 'id'>, files?: PickedFile[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [type, setType] = useState<RecordType>('blood');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [provider, setProvider] = useState('');
  const [crl, setCrl] = useState('');
  const [fhr, setFhr] = useState('');
  const [newEdd, setNewEdd] = useState('');
  const [scanWeeks, setScanWeeks] = useState('');
  const [scanDays, setScanDays] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !date) {
      setError(t('rec.required'));
      return;
    }
    setSaving(true);
    try {
      const weeksPart = parseInt(scanWeeks, 10);
      const daysPart = parseInt(scanDays, 10) || 0;
      const scanGaDays =
        type === 'ultrasound' && Number.isFinite(weeksPart) ? weeksPart * 7 + daysPart : null;

      await onSave(
        {
          type,
          title: title.trim(),
          date,
          provider,
          notes,
          // These only mean anything on an ultrasound; drop them otherwise so a
          // type change cannot smuggle a stale due date into the profile.
          crl: type === 'ultrasound' ? crl : '',
          fhr: type === 'ultrasound' ? fhr : '',
          newEdd: type === 'ultrasound' && newEdd ? newEdd : null,
          scanGaDays,
        },
        files,
      );
      setTitle('');
      setProvider('');
      setCrl('');
      setFhr('');
      setNewEdd('');
      setScanWeeks('');
      setScanDays('');
      setNotes('');
      setFiles([]);
      setError('');
      onClose();
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = RECORD_TYPES.map((value) => ({ value, label: recordTypeLabel(value) }));

  return (
    <Sheet visible={visible} onClose={onClose} title={t('rec.sheetTitle')}>
      <SelectField value={type} onChange={(v) => setType(v as RecordType)} options={typeOptions} />
      <TextField
        value={title}
        onChange={setTitle}
        placeholder={t('rec.titlePh')}
        size={14.5}
      />
      <Row gap={10} align="flex-start">
        <DateField value={date} onChange={setDate} style={{ flex: 1 }} />
        <TextField
          value={provider}
          onChange={setProvider}
          placeholder={t('rec.providerPh')}
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>

      {type === 'ultrasound' ? (
        <View style={{ backgroundColor: colors.sageSoft, borderRadius: 14, padding: 12, gap: 10 }}>
          <Txt size={12.5} weight={600} color={colors.sageDark}>
            {t('rec.scanData')}
          </Txt>
          <Row gap={10} align="flex-start">
            <TextField value={crl} onChange={setCrl} placeholder="CRL" size={14} style={{ flex: 1 }} />
            <TextField
              value={fhr}
              onChange={setFhr}
              placeholder={t('rec.fhrPh')}
              size={14}
              style={{ flex: 1 }}
            />
          </Row>
          <View>
            <Txt size={12} color={colors.sage} style={{ marginBottom: 5 }}>
              {t('rec.scanGaTitle')}
            </Txt>
            <Row gap={10} align="flex-start">
              <TextField
                value={scanWeeks}
                onChange={setScanWeeks}
                placeholder={t('rec.weeksPh')}
                keyboardType="number-pad"
                size={14}
                style={{ flex: 1 }}
              />
              <TextField
                value={scanDays}
                onChange={setScanDays}
                placeholder={t('rec.daysPh')}
                keyboardType="number-pad"
                size={14}
                style={{ flex: 1 }}
              />
            </Row>
          </View>
          <View>
            <Txt size={12} color={colors.sage} style={{ marginBottom: 5 }}>
              {t('rec.eddTitle')}
            </Txt>
            <DateField value={newEdd} onChange={setNewEdd} placeholder={t('rec.eddPh')} />
          </View>
        </View>
      ) : null}

      <TextField
        value={notes}
        onChange={setNotes}
        placeholder={t('rec.notesPh')}
        rows={2}
        size={14.5}
      />
      <AttachmentPicker files={files} onChange={setFiles} label={t('rec.attach')} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton label={saving ? t('common.saving') : t('common.save')} onPress={submit} style={{ flex: 2 }} />
        <SecondaryButton label={t('common.cancel')} onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
