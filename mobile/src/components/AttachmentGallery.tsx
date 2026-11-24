import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';

import { t as tModule } from '../i18n';
import { useI18n } from '../i18n/LocaleProvider';
import { signedUrls, type Attachment } from '../lib/storage';
import { colors } from '../theme';
import { Row } from './layout';
import { Txt } from './Txt';

/**
 * Shows files attached to one record / journal entry / appointment.
 *
 * The bucket is private, so every thumbnail needs a signed URL. They are
 * requested in one batched call per gallery rather than one per file.
 */
export function AttachmentGallery({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove?: (attachment: Attachment) => void;
}) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  // Re-sign whenever the set of files changes. Keying on the joined paths rather
  // than the array keeps this from re-firing on every parent render.
  const pathKey = attachments.map((a) => a.path).join('|');

  useEffect(() => {
    let cancelled = false;
    if (!attachments.length) {
      setUrls({});
      return;
    }
    signedUrls(attachments.map((a) => a.path))
      .then((next) => {
        if (!cancelled) {
          setUrls(next);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKey]);

  if (!attachments.length) return null;

  if (failed) {
    return (
      <Txt size={12} color={colors.muted} style={{ marginTop: 8 }}>
        {t('cmp.attachLoadFailed')}
      </Txt>
    );
  }

  const photos = attachments.filter((a) => a.kind === 'photo');
  const documents = attachments.filter((a) => a.kind !== 'photo');

  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      {photos.length ? (
        <Row wrap gap={8}>
          {photos.map((attachment) => (
            <Pressable
              key={attachment.id}
              onLongPress={onRemove ? () => confirmRemove(attachment, onRemove) : undefined}
              onPress={() => {
                const url = urls[attachment.path];
                if (url) void Linking.openURL(url);
              }}
              accessibilityRole="button"
              accessibilityLabel={attachment.caption || t('cmp.photoAttached')}
            >
              <Image
                source={urls[attachment.path] ? { uri: urls[attachment.path] } : undefined}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceWarm,
                }}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          ))}
        </Row>
      ) : null}

      {documents.map((attachment) => (
        <Row
          key={attachment.id}
          gap={8}
          style={{
            backgroundColor: colors.bg,
            borderRadius: 10,
            paddingVertical: 9,
            paddingHorizontal: 12,
          }}
        >
          <Txt size={13}>📄</Txt>
          <Pressable
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel={attachment.caption || t('cmp.reportAttached')}
            onPress={() => {
              const url = urls[attachment.path];
              if (url) void Linking.openURL(url);
            }}
          >
            <Txt size={12.5} weight={500} color={colors.sage} numberOfLines={1}>
              {attachment.caption || t('cmp.reportAttached')}
            </Txt>
          </Pressable>
          {onRemove ? (
            <Pressable
              onPress={() => confirmRemove(attachment, onRemove)}
              accessibilityRole="button"
              accessibilityLabel={t('cmp.removeAttachment')}
              hitSlop={12}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Txt size={15} color={colors.clayDelete}>
                ×
              </Txt>
            </Pressable>
          ) : null}
        </Row>
      ))}
    </View>
  );
}

/** Medical files are not something to delete on a stray tap. */
function confirmRemove(attachment: Attachment, onRemove: (a: Attachment) => void) {
  Alert.alert(tModule('cmp.removeTitle'), tModule('cmp.irreversible'), [
    { text: tModule('common.cancel'), style: 'cancel' },
    { text: tModule('common.delete'), style: 'destructive', onPress: () => onRemove(attachment) },
  ]);
}
