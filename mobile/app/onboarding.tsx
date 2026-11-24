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
import { useI18n } from '../src/i18n/LocaleProvider';
import { addDays, isoToday, toIso, fromIso, diffDays, type IsoDate } from '../src/lib/dates';
import { Txt } from '../src/components/Txt';
import { DEFAULT_CYCLE_LENGTH, TERM_DAYS, type PregnancyStatus } from '../src/lib/pregnancy';
import { useJourney } from '../src/store/JourneyProvider';
import { colors } from '../src/theme';

export default function OnboardingScreen() {
  const { settings, saveSettings } = useJourney();
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<'lmp' | 'edd'>('lmp');
  const [edd, setEdd] = useState('');
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
    const today = fromIso(isoToday());
    let lmpIso: IsoDate = lmp;
    let cycleLength = parseInt(cycle, 10);
    let override: IsoDate | null = eddOverride || null;
    if (mode === 'edd') {
      if (!edd) return setError(t('onb.errEdd'));
      const d = diffDays(fromIso(edd), today);
      if (d < -14 || d > 300) return setError(t('onb.errEddRange'));
      lmpIso = toIso(addDays(fromIso(edd), -TERM_DAYS));
      cycleLength = DEFAULT_CYCLE_LENGTH;
      override = edd;
    } else {
      if (!lmp) return setError(t('onb.errLmp'));
      const ago = diffDays(today, fromIso(lmp));
      if (!(isEditing && lmp === settings?.lmp) && (ago < 0 || ago > 300)) return setError(t('onb.errLmpRange'));
      if (Number.isNaN(cycleLength) || cycleLength < 21 || cycleLength > 40) {
        return setError(t('onb.errCycle'));
      }
    }

    setSaving(true);
    setError('');
    try {
      await saveSettings({
        lmp: lmpIso,
        cycleLength,
        status,
        eddOverride: override,
        babyName: babyName.trim(),
        motherName: motherName.trim(),
        doctor: doctor.trim(),
      });
      router.replace('/(tabs)');
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const chip = (active: boolean) => ({
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: active ? colors.sage : colors.border,
    backgroundColor: active ? colors.sageSoft : colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 8,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 22,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Row gap={8} justify="space-between">
          {isEditing ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('onb.back')}
              hitSlop={12}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Txt size={14} color={colors.muted}>
                {t('onb.back')}
              </Txt>
            </Pressable>
          ) : (
            <View />
          )}
          <Row gap={6}>
            {(['ar', 'en'] as const).map((l) => (
              <Pressable
                key={l}
                accessibilityRole="button"
                accessibilityState={{ selected: locale === l }}
                accessibilityLabel={l === 'ar' ? 'العربية' : 'English'}
                onPress={() => setLocale(l)}
                style={{ ...chip(locale === l), flex: 0, minWidth: 76 }}
              >
                <Txt size={13} weight={locale === l ? 600 : 400} align="center">
                  {l === 'ar' ? 'العربية' : 'English'}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </Row>

        <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 22 }}>
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
            {t('onb.title')}
          </Txt>
          <Txt size={14} color={colors.muted} lineHeight={1.7} align="center">
            {t('onb.subtitle')}
          </Txt>
        </View>

        <View style={{ gap: 14 }}>
          <Row gap={8}>
            {(['lmp', 'edd'] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === m }}
                onPress={() => setMode(m)}
                style={chip(mode === m)}
              >
                <Txt size={13} weight={mode === m ? 600 : 400} align="center">
                  {t(m === 'lmp' ? 'onb.knowLmp' : 'onb.knowEdd')}
                </Txt>
              </Pressable>
            ))}
          </Row>

          {mode === 'lmp' ? (
            <>
              <DateField label={t('onb.lmp')} value={lmp} onChange={setLmp} />
              <TextField
                label={t('onb.cycle')}
                value={cycle}
                onChange={setCycle}
                keyboardType="number-pad"
              />
              <DateField
                label={t('onb.eddOverride')}
                value={eddOverride}
                onChange={setEddOverride}
                placeholder={t('onb.noOverride')}
                hint={t('onb.eddOverrideHint')}
              />
            </>
          ) : (
            <DateField
              label={t('onb.edd')}
              value={edd}
              onChange={setEdd}
              hint={t('onb.knowEddHint')}
            />
          )}

          <SelectField
            label={t('onb.status')}
            value={status}
            onChange={(v) => setStatus(v as PregnancyStatus)}
            options={[
              { value: 'pregnant', label: t('onb.pregnant') },
              { value: 'planning', label: t('onb.planning') },
            ]}
          />

          <Row gap={10} align="flex-start">
            <TextField
              label={t('onb.baby')}
              value={babyName}
              onChange={setBabyName}
              placeholder="Baby Noor"
              style={{ flex: 1 }}
            />
            <TextField
              label={t('onb.mother')}
              value={motherName}
              onChange={setMotherName}
              style={{ flex: 1 }}
            />
          </Row>

          <TextField label={t('onb.doctor')} value={doctor} onChange={setDoctor} />

          {error ? (
            <View
              accessibilityRole="alert"
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
            label={saving ? t('common.saving') : isEditing ? t('onb.saveEdits') : t('onb.start')}
            onPress={submit}
            style={{ marginTop: 4, borderRadius: 14, paddingVertical: 15 }}
          />

          <Txt size={12} color={colors.muted} align="center" lineHeight={1.7}>
            {DISCLAIMER}
          </Txt>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
