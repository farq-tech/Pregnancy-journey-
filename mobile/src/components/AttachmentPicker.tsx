import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, View } from 'react-native';

import { notify } from '../lib/alert';
import { MAX_UPLOAD_BYTES, type PickedFile } from '../lib/storage';
import { colors } from '../theme';
import { Row } from './layout';
import { Txt } from './Txt';

/**
 * Picks photos and PDFs to attach to a record, journal entry or appointment.
 *
 * Files are held in state until the owning row is saved — an attachment needs an
 * `owner_id`, which does not exist until then.
 */
export function AttachmentPicker({
  files,
  onChange,
  label = 'إرفاق ملف',
}: {
  files: PickedFile[];
  onChange: (next: PickedFile[]) => void;
  label?: string;
}) {
  const add = (file: PickedFile) => {
    if (file.size && file.size > MAX_UPLOAD_BYTES) {
      notify('الملف كبير', 'الحد الأقصى 20 ميغابايت للملف الواحد.');
      return;
    }
    onChange([...files, file]);
  };

  const pickImage = async () => {
    // iOS 14+ can return images without full library access; ask, but do not
    // block on a hard denial — the OS may still show a limited picker.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && !permission.canAskAgain) {
      notify('لا يوجد إذن', 'اسمحي للتطبيق بالوصول إلى الصور من إعدادات الجهاز.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    add({
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      kind: 'photo',
      size: asset.fileSize,
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      // Copy into the cache so the URI stays readable after the picker closes.
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'application/pdf';
    add({
      uri: asset.uri,
      name: asset.name,
      mimeType,
      kind: mimeType.startsWith('image/') ? 'photo' : 'document',
      size: asset.size ?? undefined,
    });
  };

  return (
    <View style={{ gap: 8 }}>
      <Row gap={8}>
        <PickButton label={`📷 ${label} — صورة`} onPress={pickImage} />
        <PickButton label="📄 تقرير PDF" onPress={pickDocument} />
      </Row>

      {files.length ? (
        <View style={{ gap: 6 }}>
          {files.map((file, index) => (
            <Row
              key={`${file.uri}-${index}`}
              gap={8}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <Txt size={13}>{file.kind === 'photo' ? '🖼️' : '📄'}</Txt>
              <Txt size={12.5} color={colors.body} style={{ flex: 1 }} numberOfLines={1}>
                {file.name}
              </Txt>
              <Pressable
                onPress={() => onChange(files.filter((_, i) => i !== index))}
                accessibilityLabel={`إزالة ${file.name}`}
              >
                <Txt size={15} color={colors.clayDelete}>
                  ×
                </Txt>
              </Pressable>
            </Row>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PickButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? '#E2E8DC' : colors.sageSoft,
        borderRadius: 11,
        paddingVertical: 11,
      })}
    >
      <Txt size={12.5} weight={600} color={colors.sageDark} align="center">
        {label}
      </Txt>
    </Pressable>
  );
}
