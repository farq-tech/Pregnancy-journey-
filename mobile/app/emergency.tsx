import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { Card } from '../src/components/layout';
import { Screen } from '../src/components/Screen';
import { Txt } from '../src/components/Txt';
import { EMERGENCY_SIGNS } from '../src/content/pregnancyData';
import { useI18n } from '../src/i18n/LocaleProvider';
import { colors } from '../src/theme';

export default function EmergencyScreen() {
  const { t, locale } = useI18n();
  return (
    <Screen>
      <Txt size={22} weight={600} color={colors.error}>
        {t('emg.title')}
      </Txt>
      <Txt size={14} color={colors.body} lineHeight={1.7}>
        {t('emg.intro')}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('emg.call')}
        onPress={() => void Linking.openURL('tel:997')}
        style={{
          backgroundColor: colors.error,
          borderRadius: 14,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt size={16} weight={600} color="#fff" align="center">
          {t('emg.call')}
        </Txt>
      </Pressable>
      <Txt size={12} color={colors.muted} align="center">
        {t('emg.elsewhere')}
      </Txt>
      {locale === 'en' ? (
        <Txt size={12} color={colors.muted}>
          {t('lang.contentNote')}
        </Txt>
      ) : null}
      <Card padding={16} radius={18} style={{ gap: 10, backgroundColor: colors.errorBg }}>
        {EMERGENCY_SIGNS.map((sign) => (
          <View key={sign}>
            <Txt size={14} lineHeight={1.6}>
              • {sign}
            </Txt>
          </View>
        ))}
      </Card>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Txt size={14} color={colors.muted} align="center">
          {t('emg.close')}
        </Txt>
      </Pressable>
    </Screen>
  );
}
