import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

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
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import { useJourney } from '../../src/store/JourneyProvider';
import { RECORD_TYPE_LABELS, type RecordType } from '../../src/store/types';
import { colors } from '../../src/theme';

const TYPE_OPTIONS = (Object.keys(RECORD_TYPE_LABELS) as RecordType[]).map((value) => ({
  value,
  label: RECORD_TYPE_LABELS[value],
}));

export default function RecordsScreen() {
  const { settings, records, today, addRecord, remove } = useJourney();
  const [sheetOpen, setSheetOpen] = useState(false);

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
            ملف الحمل
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            التحاليل والسونار والتقارير
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
            + إضافة
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
            لا ملفات بعد
          </Txt>
          <Txt size={13} color={colors.faint} align="center" lineHeight={1.7} style={{ marginTop: 6 }}>
            أضيفي تحاليل الدم وتقارير السونار والوصفات — كل ملف يُربط بأسبوع الحمل تلقائيًا. إذا
            حدّد السونار موعد ولادة جديدًا، يُعاد بناء التقويم.
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {records.map((record) => {
            const gestationalDay = diffDays(fromIso(record.date), journey.effectiveLmp);
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
                        {RECORD_TYPE_LABELS[record.type]}
                      </Txt>
                    </Chip>
                    <Txt size={12} color={colors.faint}>
                      {`${formatDayMonth(fromIso(record.date))} · الأسبوع ${Math.floor(gestationalDay / 7) + 1}`}
                    </Txt>
                  </Row>
                  <Pressable
                    onPress={() => void remove('records', record.id)}
                    accessibilityLabel="حذف الملف"
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

                {record.type === 'ultrasound' && (record.crl || record.fhr || record.newEdd) ? (
                  <Row wrap gap={10} style={{ marginTop: 6 }}>
                    {record.crl ? (
                      <Txt size={12} color={colors.sage}>{`CRL: ${record.crl}`}</Txt>
                    ) : null}
                    {record.fhr ? (
                      <Txt size={12} color={colors.sage}>{`نبض: ${record.fhr}`}</Txt>
                    ) : null}
                    {record.newEdd ? (
                      <Txt size={12} color={colors.clayText}>
                        {`EDD جديد: ${formatDayMonth(fromIso(record.newEdd))}`}
                      </Txt>
                    ) : null}
                  </Row>
                ) : null}

                {record.notes ? (
                  <Txt size={12.5} color={colors.faint} lineHeight={1.7} style={{ marginTop: 6 }}>
                    {record.notes}
                  </Txt>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      <Txt size={15} weight={600} style={{ marginTop: 4 }}>
        فحوصات الحمل 🧪
      </Txt>
      <Txt size={12} color={colors.faint} lineHeight={1.7} style={{ marginTop: -8 }}>
        توقيتات معتادة للاسترشاد فقط — تختلف بحسب البلد والطبيب والحالة، وليست توصية شخصية.
      </Txt>

      <Card style={{ paddingVertical: 18, paddingHorizontal: 20, gap: 14 }}>
        {TESTS.map((test) => {
          const state =
            currentWeek > test.to
              ? 'مرّت الفترة المعتادة'
              : currentWeek >= test.from
                ? 'الفترة الحالية'
                : 'قادم';
          const isCurrent = state === 'الفترة الحالية';
          return (
            <Row key={test.id} gap={10} align="flex-start">
              <View style={{ flex: 1 }}>
                <Txt size={13.5} weight={600}>
                  {test.name}
                </Txt>
                <Txt size={12} color={colors.muted} lineHeight={1.7} style={{ marginTop: 2 }}>
                  {test.why}
                </Txt>
                <Txt size={11.5} color={colors.faint} style={{ marginTop: 2 }}>
                  {`الأسبوع ${test.from}–${test.to}`}
                </Txt>
              </View>
              <Chip bg={isCurrent ? colors.sageSoft : colors.surfaceWarm} style={{ marginTop: 2 }}>
                <Txt size={11} weight={500} color={isCurrent ? colors.sageDark : colors.muted}>
                  {state}
                </Txt>
              </Chip>
            </Row>
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
  onSave: (input: {
    type: RecordType;
    title: string;
    date: string;
    provider: string;
    notes: string;
    crl: string;
    fhr: string;
    newEdd: string | null;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<RecordType>('blood');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [provider, setProvider] = useState('');
  const [crl, setCrl] = useState('');
  const [fhr, setFhr] = useState('');
  const [newEdd, setNewEdd] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !date) {
      setError('العنوان والتاريخ مطلوبان.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
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
      });
      setTitle('');
      setProvider('');
      setCrl('');
      setFhr('');
      setNewEdd('');
      setNotes('');
      setError('');
      onClose();
    } catch {
      setError('تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="إضافة إلى ملف الحمل">
      <SelectField value={type} onChange={(v) => setType(v as RecordType)} options={TYPE_OPTIONS} />
      <TextField
        value={title}
        onChange={setTitle}
        placeholder="العنوان — مثال: سونار الأسبوع 8"
        size={14.5}
      />
      <Row gap={10} align="flex-start">
        <DateField value={date} onChange={setDate} style={{ flex: 1 }} />
        <TextField
          value={provider}
          onChange={setProvider}
          placeholder="الجهة / الطبيب"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>

      {type === 'ultrasound' ? (
        <View style={{ backgroundColor: colors.sageSoft, borderRadius: 14, padding: 12, gap: 10 }}>
          <Txt size={12.5} weight={600} color={colors.sageDark}>
            بيانات السونار (اختياري)
          </Txt>
          <Row gap={10} align="flex-start">
            <TextField value={crl} onChange={setCrl} placeholder="CRL" size={14} style={{ flex: 1 }} />
            <TextField
              value={fhr}
              onChange={setFhr}
              placeholder="نبض الجنين"
              size={14}
              style={{ flex: 1 }}
            />
          </Row>
          <View>
            <Txt size={12} color={colors.sage} style={{ marginBottom: 5 }}>
              موعد ولادة جديد من السونار (EDD) — يعيد بناء التقويم
            </Txt>
            <DateField value={newEdd} onChange={setNewEdd} placeholder="بدون تغيير" />
          </View>
        </View>
      ) : null}

      <TextField
        value={notes}
        onChange={setNotes}
        placeholder="النتائج / ملاحظات الطبيب"
        rows={2}
        size={14.5}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton label={saving ? 'جارٍ الحفظ…' : 'حفظ'} onPress={submit} style={{ flex: 2 }} />
        <SecondaryButton label="إلغاء" onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
