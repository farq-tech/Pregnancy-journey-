import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISCLAIMER } from '../src/content/pregnancyData';
import {
  DateField,
  ErrorText,
  PrimaryButton,
  SelectField,
  TextField,
} from '../src/components/fields';
import { HeartIcon } from '../src/components/icons';
import { Row } from '../src/components/layout';
import { Txt } from '../src/components/Txt';
import { DEFAULT_CYCLE_LENGTH, type PregnancyStatus } from '../src/lib/pregnancy';
import { useJourney } from '../src/store/JourneyProvider';
import { colors } from '../src/theme';

export default function OnboardingScreen() {
  const { settings, saveSettings } = useJourney();
  const insets = useSafeAreaInsets();
  const isEditing = !!settings?.lmp;

  const [lmp, setLmp] = useState(settings?.lmp ?? '');
  const [cycle, setCycle] = useState(String(settings?.cycleLength ?? DEFAULT_CYCLE_LENGTH));
  const [status, setStatus] = useState<PregnancyStatus>(settings?.status ?? 'pregnant');
  const [eddOverride, setEddOverride] = useState(settings?.eddOverride ?? '');
  const [babyName, setBabyName] = useState(settings?.babyName ?? '');
  const [motherName, setMotherName] = useState(settings?.motherName ?? '');
  const [doctor, setDoctor] = useState(settings?.doctor ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!lmp) {
      setError('أدخلي تاريخ أول يوم في آخر دورة (LMP) للمتابعة.');
      return;
    }
    const cycleLength = parseInt(cycle, 10);
    if (Number.isNaN(cycleLength) || cycleLength < 21 || cycleLength > 40) {
      setError('طول الدورة يجب أن يكون بين 21 و40 يومًا.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveSettings({
        lmp,
        cycleLength,
        status,
        eddOverride: eddOverride || null,
        babyName: babyName.trim(),
        motherName: motherName.trim(),
        doctor: doctor.trim(),
      });
      router.replace('/(tabs)');
    } catch {
      setError('تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 28,
          paddingHorizontal: 22,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {isEditing ? (
          <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
            <Txt size={12.5} color={colors.muted}>
              ← رجوع
            </Txt>
          </Pressable>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 26 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.sageSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartIcon size={30} color={colors.sage} strokeWidth={1.6} />
          </View>
          <Txt size={26} weight={600} align="center" style={{ marginTop: 14, marginBottom: 6 }}>
            رحلة الحمل
          </Txt>
          <Txt size={14} color={colors.muted} lineHeight={1.7} align="center">
            {'أدخلي بياناتك لنبني رحلتك يومًا بيوم\nمن أول يوم في آخر دورة حتى موعد الولادة'}
          </Txt>
        </View>

        <View style={{ gap: 14 }}>
          <DateField
            label="أول يوم في آخر دورة شهرية (LMP) *"
            value={lmp}
            onChange={setLmp}
          />
          <TextField
            label="متوسط طول الدورة (بالأيام)"
            value={cycle}
            onChange={setCycle}
            keyboardType="number-pad"
          />
          <SelectField
            label="حالة الحمل"
            value={status}
            onChange={(v) => setStatus(v as PregnancyStatus)}
            options={[
              { value: 'pregnant', label: 'حامل' },
              { value: 'planning', label: 'تخطيط للحمل' },
            ]}
          />
          <DateField
            label="تعديل موعد الولادة (EDD Override) — اختياري"
            value={eddOverride}
            onChange={setEddOverride}
            placeholder="بدون تعديل"
            hint="يُستخدم إذا حدّد الطبيب موعدًا مختلفًا بعد السونار — يُعاد بناء التقويم كاملًا منه."
          />

          <Row gap={10} align="flex-start">
            <TextField
              label="اسم / لقب الطفل — اختياري"
              value={babyName}
              onChange={setBabyName}
              placeholder="Baby Noor"
              style={{ flex: 1 }}
            />
            <TextField
              label="اسم الأم — اختياري"
              value={motherName}
              onChange={setMotherName}
              style={{ flex: 1 }}
            />
          </Row>

          <TextField label="الطبيب / العيادة — اختياري" value={doctor} onChange={setDoctor} />

          {error ? (
            <View
              style={{
                backgroundColor: colors.errorBg,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 14,
              }}
            >
              <ErrorText>{error}</ErrorText>
            </View>
          ) : null}

          <PrimaryButton
            label={saving ? 'جارٍ الحفظ…' : isEditing ? 'حفظ التعديلات' : 'ابدئي الرحلة'}
            onPress={submit}
            style={{ marginTop: 4, borderRadius: 14, paddingVertical: 15 }}
          />

          <Txt size={12} color={colors.faint} align="center" lineHeight={1.7}>
            {DISCLAIMER}
          </Txt>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
