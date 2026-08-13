import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '../theme';
import { Txt } from './Txt';

/**
 * The bottom sheet used for every add-form. Mirrors the prototype's overlay:
 * a 35%-opacity scrim, a sheet capped at 82% of the screen with 24px top
 * corners, and a grabber.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="إغلاق" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { maxHeight: height * 0.82 }]}>
            <View style={styles.grabber} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Txt size={17} weight={600} style={{ marginBottom: subtitle ? 4 : 14 }}>
                {title}
              </Txt>
              {subtitle ? (
                <Txt size={12} color={colors.faint} lineHeight={1.7} style={{ marginBottom: 14 }}>
                  {subtitle}
                </Txt>
              ) : null}
              <View style={{ gap: 11, paddingBottom: 30 }}>{children}</View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(44,51,43,.35)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDashed,
    alignSelf: 'center',
    marginBottom: 14,
  },
});
