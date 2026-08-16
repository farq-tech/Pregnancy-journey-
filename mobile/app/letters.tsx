import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../src/components/PageHeader';
import { Screen } from '../src/components/Screen';
import { Sheet } from '../src/components/Sheet';
import { Txt } from '../src/components/Txt';
import {
  DateField,
  ErrorText,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../src/components/fields';
import { Card, Chip, Row } from '../src/components/layout';
import { formatLong, weekOrdinalLabel } from '../src/lib/arabic';
import { diffDays, fromIso } from '../src/lib/dates';
import { computeJourney } from '../src/lib/pregnancy';
import { useJourney } from '../src/store/JourneyProvider';
import type { Letter } from '../src/store/types';
import { colors } from '../src/theme';

/**
 * رسائل لطفلي — a time capsule the whole household can write into.
 *
 * `author` is free text rather than a fixed "mother / father" pair on purpose:
 * a grandmother, a sibling, an aunt all get to sign their own name, and the
 * child eventually reads a set of letters rather than a diary.
 */
export default function LettersScreen() {
  const { settings, today, letters, addLetter, removeLetter } = useJourney();
  const [sheetOpen, setSheetOpen] = useState(false);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  if (!settings || !journey) return null;

  const babyName = settings.babyName || 'طفلك';

  return (
    <Screen>
      <PageHeader
        title="رسائل"
        subtitle={`كلمات تُقرأ بعد سنوات — من العائلة إلى ${babyName}`}
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
              + رسالة
            </Txt>
          </Pressable>
        }
      />

      {letters.length === 0 ? (
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
            &quot;أكتب لك اليوم…&quot;
          </Txt>
          <Txt size={13} color={colors.faint} align="center" lineHeight={1.8} style={{ marginTop: 8 }}>
            {
              'رسالة من الأم، من الأب، من جدّة، من أخ — كل واحد باسمه.\nستُقرأ بعد سنوات، وهذا وحده يجعلها تُكتب بشكل مختلف.'
            }
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {letters.map((letter) => {
            const gestationalDay = diffDays(fromIso(letter.date), journey.effectiveLmp);
            const week = Math.floor(gestationalDay / 7) + 1;
            return (
              <Card key={letter.id} radius={20} padding={0} style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
                <Row justify="space-between" align="flex-start">
                  <View style={{ flex: 1 }}>
                    {letter.title ? (
                      <Txt size={15.5} weight={600}>
                        {letter.title}
                      </Txt>
                    ) : null}
                    <Txt size={12} color={colors.faint} style={{ marginTop: letter.title ? 2 : 0 }}>
                      {`${formatLong(fromIso(letter.date))} · ${weekOrdinalLabel(Math.max(1, week))}`}
                    </Txt>
                  </View>
                  <Pressable
                    onPress={() => void removeLetter(letter.id)}
                    accessibilityLabel="حذف الرسالة"
                    hitSlop={8}
                  >
                    <Txt size={15} color={colors.clayDelete}>
                      ×
                    </Txt>
                  </Pressable>
                </Row>

                <Txt size={14} color={colors.body} lineHeight={2} style={{ marginTop: 10 }}>
                  {letter.body}
                </Txt>

                <Row style={{ marginTop: 12 }}>
                  <Chip bg={colors.claySoft}>
                    <Txt size={11.5} color={colors.clayText}>
                      {letter.author || settings.motherName || 'أمك'}
                    </Txt>
                  </Chip>
                </Row>
              </Card>
            );
          })}
        </View>
      )}

      <LetterSheet
        visible={sheetOpen}
        today={today}
        defaultAuthor={settings.motherName}
        onClose={() => setSheetOpen(false)}
        onSave={addLetter}
      />
    </Screen>
  );
}

function LetterSheet({
  visible,
  today,
  defaultAuthor,
  onClose,
  onSave,
}: {
  visible: boolean;
  today: string;
  defaultAuthor: string;
  onClose: () => void;
  onSave: (input: Omit<Letter, 'id'>) => Promise<void>;
}) {
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState(defaultAuthor);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!body.trim()) {
      setError('اكتبي نص الرسالة.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        date,
        title: title.trim(),
        body: body.trim(),
        author: author.trim(),
      });
      setTitle('');
      setBody('');
      setError('');
      onClose();
    } catch {
      setError('تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="رسالة جديدة"
      subtitle="مرّريها لمن يريد أن يكتب — الاسم في الأسفل هو من سيُنسب إليه."
    >
      <DateField label="التاريخ" value={date} onChange={setDate} />
      <TextField value={title} onChange={setTitle} placeholder="عنوان (اختياري)" size={14.5} />
      <TextField
        value={body}
        onChange={setBody}
        placeholder="أكتب لك اليوم…"
        rows={6}
        size={14.5}
      />
      <TextField value={author} onChange={setAuthor} placeholder="التوقيع — من أنت؟" size={14.5} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton label={saving ? 'جارٍ الحفظ…' : 'حفظ'} onPress={submit} style={{ flex: 2 }} />
        <SecondaryButton label="إلغاء" onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
