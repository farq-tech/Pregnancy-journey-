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
  TextField,
} from '../../src/components/fields';
import { Card, Row } from '../../src/components/layout';
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { computeJourney } from '../../src/lib/pregnancy';
import type { PickedFile } from '../../src/lib/storage';
import { useJourney } from '../../src/store/JourneyProvider';
import { MOODS, type JournalEntry } from '../../src/store/types';
import { colors } from '../../src/theme';

export default function JournalScreen() {
  const { settings, journal, today, addJournalEntry, remove, attachmentsFor, deleteAttachment } =
    useJourney();
  const [sheetOpen, setSheetOpen] = useState(false);

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
            اليوميات
          </Txt>
          <Txt size={12.5} color={colors.muted}>
            لحظاتك في الرحلة، يومًا بيوم
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
            + تدوينة
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
            &quot;اليوم أشعر…&quot;
          </Txt>
          <Txt size={13} color={colors.faint} align="center" lineHeight={1.7} style={{ marginTop: 6 }}>
            {'دوّني مشاعرك ووزنك وضغطك وارتفاع الرحم\nلتصبح ذكريات الرحلة ورسمًا لمتابعة العيادة'}
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {journal.map((entry) => {
            const gestationalDay = diffDays(fromIso(entry.date), journey.effectiveLmp);
            return (
              <Card
                key={entry.id}
                radius={20}
                padding={0}
                style={{ paddingVertical: 16, paddingHorizontal: 18 }}
              >
                <Row justify="space-between">
                  <Txt size={12.5} weight={500} color={colors.muted}>
                    {`${formatDayMonth(fromIso(entry.date))} · الأسبوع ${Math.floor(gestationalDay / 7) + 1}`}
                  </Txt>
                  <Pressable
                    onPress={() => void remove('journal', entry.id)}
                    accessibilityLabel="حذف التدوينة"
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
                      {entry.mood}
                    </Txt>
                  </View>
                ) : null}

                {entry.text ? (
                  <Txt size={14} color={colors.body} lineHeight={1.9} style={{ marginTop: 8 }}>
                    {`"${entry.text}"`}
                  </Txt>
                ) : null}

                {entry.symptoms ||
                entry.weight != null ||
                entry.bpSystolic != null ||
                entry.fundalHeightCm != null ? (
                  <Row wrap gap={12} style={{ marginTop: 8 }}>
                    {entry.symptoms ? (
                      <Txt size={12} color={colors.faint}>
                        {`أعراض: ${entry.symptoms}`}
                      </Txt>
                    ) : null}
                    {entry.weight != null ? (
                      <Txt size={12} color={colors.faint}>
                        {`الوزن: ${entry.weight} كغم`}
                      </Txt>
                    ) : null}
                    {entry.bpSystolic != null && entry.bpDiastolic != null ? (
                      <Txt size={12} color={colors.faint}>
                        {`الضغط: ${entry.bpSystolic}/${entry.bpDiastolic}`}
                      </Txt>
                    ) : null}
                    {entry.fundalHeightCm != null ? (
                      <Txt size={12} color={colors.faint}>
                        {`ارتفاع الرحم: ${entry.fundalHeightCm} سم`}
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
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState('');
  const [text, setText] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [fundal, setFundal] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const parsedWeight = parsePositive(weight);
    const parsedSys = parseIntField(systolic);
    const parsedDia = parseIntField(diastolic);
    const parsedFundal = parsePositive(fundal);

    if (parsedWeight === 'invalid') {
      setError('الوزن يجب أن يكون رقمًا أكبر من صفر.');
      return;
    }
    if (parsedSys === 'invalid' || parsedDia === 'invalid') {
      setError('الضغط يُكتب رقمين: الانقباضي ثم الانبساطي.');
      return;
    }
    if ((parsedSys == null) !== (parsedDia == null)) {
      setError('أدخلي الرقمين معًا، مثل 110 و70.');
      return;
    }
    if (parsedSys != null && (parsedSys < 50 || parsedSys > 250 || parsedDia! < 30 || parsedDia! > 150 || parsedSys <= parsedDia!)) {
      setError('تحقّقي من رقمي الضغط — الانقباضي أكبر من الانبساطي.');
      return;
    }
    if (parsedFundal === 'invalid' || (parsedFundal != null && (parsedFundal < 10 || parsedFundal > 50))) {
      setError('ارتفاع الرحم يُسجَّل بالسنتيمتر، عادة بين 10 و50.');
      return;
    }
    if (!text.trim() && !mood && parsedWeight == null && parsedSys == null && parsedFundal == null) {
      setError('اكتبي شيئًا، أو اختاري مزاجًا، أو سجّلي وزنًا أو ضغطًا أو ارتفاع الرحم.');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          date,
          mood,
          text: text.trim(),
          symptoms,
          weight: parsedWeight,
          bpSystolic: parsedSys,
          bpDiastolic: parsedDia,
          fundalHeightCm: parsedFundal,
        },
        files,
      );
      setMood('');
      setText('');
      setSymptoms('');
      setWeight('');
      setSystolic('');
      setDiastolic('');
      setFundal('');
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
    <Sheet visible={visible} onClose={onClose} title="تدوينة جديدة">
      <DateField value={date} onChange={setDate} />

      <View>
        <Txt size={13} weight={500} style={{ marginBottom: 8 }}>
          مزاج اليوم
        </Txt>
        <Row wrap gap={7}>
          {MOODS.map((option) => {
            const active = mood === option;
            return (
              <Pressable
                key={option}
                // Tapping the selected mood clears it, so an entry can be text-only.
                onPress={() => setMood(active ? '' : option)}
                style={{
                  borderRadius: 999,
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  backgroundColor: active ? colors.sage : colors.surfaceWarm,
                }}
              >
                <Txt size={13} color={active ? colors.surface : colors.sage}>
                  {option}
                </Txt>
              </Pressable>
            );
          })}
        </Row>
      </View>

      <TextField value={text} onChange={setText} placeholder="اليوم أشعر…" rows={3} size={14.5} />
      <Row gap={10} align="flex-start">
        <TextField
          value={symptoms}
          onChange={setSymptoms}
          placeholder="أعراض اليوم"
          size={14.5}
          style={{ flex: 2 }}
        />
        <TextField
          value={weight}
          onChange={setWeight}
          placeholder="الوزن كغم"
          keyboardType="decimal-pad"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      <Row gap={10} align="flex-start">
        <TextField
          value={systolic}
          onChange={setSystolic}
          placeholder="الضغط الأعلى"
          keyboardType="number-pad"
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={diastolic}
          onChange={setDiastolic}
          placeholder="الضغط الأدنى"
          keyboardType="number-pad"
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={fundal}
          onChange={setFundal}
          placeholder="ارتفاع الرحم سم"
          keyboardType="decimal-pad"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      <AttachmentPicker files={files} onChange={setFiles} label="صورة اليوم" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton label={saving ? 'جارٍ الحفظ…' : 'حفظ'} onPress={submit} style={{ flex: 2 }} />
        <SecondaryButton label="إلغاء" onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}

function parsePositive(raw: string): number | null | 'invalid' {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 'invalid';
}

function parseIntField(raw: string): number | null | 'invalid' {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 'invalid';
}
