import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Sheet } from '../../src/components/Sheet';
import { TrendChart } from '../../src/components/TrendChart';
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
import { formatDayMonth } from '../../src/lib/arabic';
import { diffDays, fromIso } from '../../src/lib/dates';
import { clampWeek, computeJourney } from '../../src/lib/pregnancy';
import {
  GLUCOSE_CONTEXTS,
  GLUCOSE_NOTE,
  bloodPressureFlag,
  glucoseContextLabel,
  ofKind,
} from '../../src/lib/vitals';
import {
  BMI_CATEGORY_LABELS,
  GAIN_POSITION_LABELS,
  expectedRangeAtWeek,
  weightPicture,
} from '../../src/lib/weight';
import { useJourney } from '../../src/store/JourneyProvider';
import {
  MEASUREMENT_KIND_LABELS,
  MEASUREMENT_UNITS,
  type Measurement,
  type MeasurementKind,
} from '../../src/store/types';
import { colors } from '../../src/theme';

const KINDS = Object.keys(MEASUREMENT_KIND_LABELS) as MeasurementKind[];

const FLAG_COLORS = {
  info: { bg: colors.sageSoft, border: colors.sageBorder, text: colors.sageDark },
  attention: { bg: colors.claySoft, border: colors.clayBorder, text: colors.clayHeading },
  urgent: { bg: colors.errorBg, border: colors.clayBorder, text: colors.error },
} as const;

export default function MeasurementsScreen() {
  const { settings, today, measurements, journal, addMeasurement, deleteMeasurement } =
    useJourney();
  const [kind, setKind] = useState<MeasurementKind>('weight');
  const [sheetOpen, setSheetOpen] = useState(false);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  /**
   * Weights recorded in the journal count too — she was already logging them
   * there before this screen existed, and a curve that ignored them would look
   * like her history had been lost. A dedicated measurement wins on a day both
   * exist, because it is the more deliberate of the two.
   */
  const weights = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const entry of journal) {
      if (entry.weight != null) byDate.set(entry.date, entry.weight);
    }
    for (const measurement of ofKind(measurements, 'weight')) {
      byDate.set(measurement.date, measurement.value);
    }
    return [...byDate.entries()]
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [journal, measurements]);

  if (!settings || !journey) return null;

  const week = clampWeek(journey.week);
  const latestWeight = weights.length ? weights[weights.length - 1].value : null;
  const picture = weightPicture(
    latestWeight,
    settings.prePregnancyWeightKg,
    settings.heightCm,
    week,
  );

  const rows = kind === 'weight' ? [] : ofKind(measurements, kind);

  return (
    <Screen>
      <PageHeader
        title="الوزن والقياسات"
        subtitle="ما تقيسينه في البيت أو في العيادة، في مكان واحد"
        backLabel="المتابعة"
        action={
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
              + قياس
            </Txt>
          </Pressable>
        }
      />

      <Row wrap gap={7}>
        {KINDS.map((option) => {
          const active = kind === option;
          return (
            <Pressable
              key={option}
              onPress={() => setKind(option)}
              style={{
                borderRadius: 999,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: active ? colors.sage : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.sage : colors.border,
              }}
            >
              <Txt size={13} weight={active ? 600 : 400} color={active ? colors.surface : colors.muted}>
                {MEASUREMENT_KIND_LABELS[option]}
              </Txt>
            </Pressable>
          );
        })}
      </Row>

      {kind === 'weight' ? (
        <WeightSection
          weights={weights}
          picture={picture}
          week={week}
          effectiveLmp={journey.effectiveLmp}
          prePregnancyWeightKg={settings.prePregnancyWeightKg}
        />
      ) : (
        <>
          {kind === 'glucose' ? (
            <Card radius={20} style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
              <Txt size={12.5} color={colors.body} lineHeight={1.8}>
                {GLUCOSE_NOTE}
              </Txt>
            </Card>
          ) : null}

          {rows.length === 0 ? (
            <EmptyBox text={`لا قراءات ${MEASUREMENT_KIND_LABELS[kind]} بعد.`} />
          ) : (
            <View style={{ gap: 10 }}>
              {rows.map((measurement) => (
                <ReadingCard
                  key={measurement.id}
                  measurement={measurement}
                  onDelete={() => void deleteMeasurement(measurement.id)}
                />
              ))}
            </View>
          )}
        </>
      )}

      <MeasurementSheet
        visible={sheetOpen}
        today={today}
        initialKind={kind}
        onClose={() => setSheetOpen(false)}
        onSave={addMeasurement}
      />
    </Screen>
  );
}

function WeightSection({
  weights,
  picture,
  week,
  effectiveLmp,
  prePregnancyWeightKg,
}: {
  weights: readonly { date: string; value: number }[];
  picture: ReturnType<typeof weightPicture>;
  week: number;
  effectiveLmp: Date;
  prePregnancyWeightKg: number | null;
}) {
  // Plot against gestational week, so the curve lines up with the band.
  const points = weights.map((entry) => ({
    x: Math.floor(diffDays(fromIso(entry.date), effectiveLmp) / 7) + 1,
    y: entry.value,
  }));

  // The band is a gain range, so it is drawn on top of her starting weight to
  // sit in the same units as the curve.
  const band =
    picture && prePregnancyWeightKg !== null
      ? {
          label: 'النطاق المنشور',
          points: Array.from({ length: Math.max(1, week - 3) }, (_, i) => {
            const bandWeek = i + 4;
            const range = expectedRangeAtWeek(picture.category, bandWeek);
            return {
              x: bandWeek,
              min: prePregnancyWeightKg + range.min,
              max: prePregnancyWeightKg + range.max,
            };
          }),
        }
      : undefined;

  return (
    <>
      <Card style={{ gap: 12 }}>
        <Row justify="space-between">
          <Txt size={15} weight={600}>
            منحنى الوزن
          </Txt>
          {picture ? (
            <Chip>
              <Txt size={11.5} weight={600} color={colors.sageDark}>
                {`${picture.gainKg > 0 ? '+' : ''}${picture.gainKg} كغم`}
              </Txt>
            </Chip>
          ) : null}
        </Row>

        <TrendChart
          points={points}
          band={band}
          formatX={(x) => `أسبوع ${Math.round(x)}`}
          formatY={(y) => `${Math.round(y * 10) / 10} كغم`}
        />
      </Card>

      {picture ? (
        <Card radius={20} style={{ paddingVertical: 16, paddingHorizontal: 18, gap: 6 }}>
          <Txt size={13.5} weight={600}>
            {GAIN_POSITION_LABELS[picture.position]}
          </Txt>
          <Txt size={12.5} color={colors.muted} lineHeight={1.7}>
            {`مؤشر كتلة الجسم قبل الحمل ${picture.bmi} (${BMI_CATEGORY_LABELS[picture.category]}) — النطاق المتوقع لهذا الأسبوع ${picture.range.min}–${picture.range.max} كغم، ولكامل الحمل ${picture.total.min}–${picture.total.max} كغم.`}
          </Txt>
          <Txt size={11.5} color={colors.faint} lineHeight={1.7}>
            النطاقات من توصيات IOM/ACOG لحمل بجنين واحد. النطاق المناسب لكِ يحدده طبيبك، وخروج قراءة
            واحدة عن النطاق ليس مشكلة بحد ذاته.
          </Txt>
        </Card>
      ) : (
        <Card radius={20} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <Txt size={12.5} color={colors.body} lineHeight={1.8}>
            {prePregnancyWeightKg === null
              ? 'أضيفي طولك ووزنك قبل الحمل في الإعدادات ليُرسم النطاق المنشور لزيادة الوزن.'
              : 'أضيفي قراءة وزن ليظهر موقعك من النطاق.'}
          </Txt>
        </Card>
      )}
    </>
  );
}

function ReadingCard({
  measurement,
  onDelete,
}: {
  measurement: Measurement;
  onDelete: () => void;
}) {
  const flag =
    measurement.kind === 'bp' && measurement.value2 !== null
      ? bloodPressureFlag(measurement.value, measurement.value2)
      : null;
  const palette = flag ? FLAG_COLORS[flag.level] : null;

  return (
    <Card radius={20} padding={0} style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <Txt size={16} weight={600}>
            {measurement.kind === 'bp'
              ? `${measurement.value}/${measurement.value2}`
              : String(measurement.value)}
            <Txt size={12} color={colors.muted}>
              {` ${MEASUREMENT_UNITS[measurement.kind]}`}
            </Txt>
          </Txt>
          <Txt size={12} color={colors.faint} style={{ marginTop: 2 }}>
            {[
              formatDayMonth(fromIso(measurement.date)),
              measurement.context ? glucoseContextLabel(measurement.context) : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
        </View>
        <Pressable onPress={onDelete} accessibilityLabel="حذف القراءة" hitSlop={8}>
          <Txt size={15} color={colors.clayDelete}>
            ×
          </Txt>
        </Pressable>
      </Row>

      {measurement.notes ? (
        <Txt size={12.5} color={colors.muted} lineHeight={1.7} style={{ marginTop: 6 }}>
          {measurement.notes}
        </Txt>
      ) : null}

      {flag && palette ? (
        <View
          style={{
            marginTop: 10,
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
          }}
        >
          <Txt size={12.5} color={palette.text} lineHeight={1.8}>
            {flag.message}
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
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
      <Txt size={13} color={colors.faint} align="center" lineHeight={1.7}>
        {text}
      </Txt>
    </View>
  );
}

function MeasurementSheet({
  visible,
  today,
  initialKind,
  onClose,
  onSave,
}: {
  visible: boolean;
  today: string;
  initialKind: MeasurementKind;
  onClose: () => void;
  onSave: (input: Omit<Measurement, 'id'>) => Promise<void>;
}) {
  const [kind, setKind] = useState<MeasurementKind>(initialKind);
  const [date, setDate] = useState(today);
  const [value, setValue] = useState('');
  const [value2, setValue2] = useState('');
  const [context, setContext] = useState<string>(GLUCOSE_CONTEXTS[0].value);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const primary = Number(value);
    if (!value.trim() || !Number.isFinite(primary) || primary <= 0) {
      setError('أدخلي قيمة رقمية صحيحة.');
      return;
    }
    let secondary: number | null = null;
    if (kind === 'bp') {
      secondary = Number(value2);
      if (!value2.trim() || !Number.isFinite(secondary) || secondary <= 0) {
        setError('قياس الضغط يحتاج الرقمين: الانقباضي والانبساطي.');
        return;
      }
      if (secondary >= primary) {
        setError('الرقم الانبساطي يجب أن يكون أقل من الانقباضي.');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        date,
        kind,
        value: primary,
        value2: secondary,
        context: kind === 'glucose' ? context : '',
        notes: notes.trim(),
      });
      setValue('');
      setValue2('');
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
    <Sheet visible={visible} onClose={onClose} title="قياس جديد">
      <SelectField
        label="نوع القياس"
        value={kind}
        onChange={(v) => setKind(v as MeasurementKind)}
        options={KINDS.map((k) => ({ value: k, label: MEASUREMENT_KIND_LABELS[k] }))}
      />
      <DateField label="التاريخ" value={date} onChange={setDate} />

      {kind === 'bp' ? (
        <Row gap={10} align="flex-start">
          <TextField
            label="الانقباضي"
            value={value}
            onChange={setValue}
            keyboardType="number-pad"
            placeholder="120"
            style={{ flex: 1 }}
          />
          <TextField
            label="الانبساطي"
            value={value2}
            onChange={setValue2}
            keyboardType="number-pad"
            placeholder="80"
            style={{ flex: 1 }}
          />
        </Row>
      ) : (
        <TextField
          label={`القيمة (${MEASUREMENT_UNITS[kind]})`}
          value={value}
          onChange={setValue}
          keyboardType="decimal-pad"
        />
      )}

      {kind === 'glucose' ? (
        <SelectField
          label="وقت القياس"
          value={context}
          onChange={setContext}
          options={GLUCOSE_CONTEXTS.map((c) => ({ value: c.value, label: c.label }))}
        />
      ) : null}

      <TextField value={notes} onChange={setNotes} placeholder="ملاحظة (اختياري)" size={14.5} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton
          label={saving ? 'جارٍ الحفظ…' : 'حفظ'}
          onPress={submit}
          style={{ flex: 2 }}
        />
        <SecondaryButton label="إلغاء" onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
