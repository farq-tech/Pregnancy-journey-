import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { ErrorText, TextField } from '../../src/components/fields';
import { Card, Row } from '../../src/components/layout';
import { checklistById, itemsOf } from '../../src/content/checklists';
import { useJourney } from '../../src/store/JourneyProvider';
import type { ChecklistTick } from '../../src/store/types';
import { colors } from '../../src/theme';

export default function ChecklistDetailScreen() {
  const params = useLocalSearchParams<{ list: string }>();
  const { checklist, toggleChecklistItem, addChecklistItem, removeChecklistItem } = useJourney();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const list = checklistById(params.list ?? '');
  if (!list) {
    return (
      <Screen>
        <PageHeader title="القائمة غير موجودة" backLabel="القوائم" />
      </Screen>
    );
  }

  const ticks = checklist.filter((tick) => tick.listId === list.id);
  const tickFor = (itemId: string) => ticks.find((tick) => tick.itemId === itemId);
  const custom = ticks.filter((tick) => tick.label);
  const total = itemsOf(list).length + custom.length;
  const done = ticks.filter((tick) => tick.done).length;

  const run = (task: Promise<unknown>) => {
    setError('');
    task.catch(() => setError('تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.'));
  };

  const submitDraft = () => {
    const label = draft.trim();
    if (!label) return;
    setDraft('');
    run(addChecklistItem(list.id, label));
  };

  return (
    <Screen>
      <PageHeader
        title={`${list.emoji} ${list.title}`}
        subtitle={`${list.subtitle} · ${done} من ${total}`}
        backLabel="القوائم"
      />

      {list.sections.map((section) => (
        <Card key={section.title} style={{ gap: 4 }}>
          <Txt size={14.5} weight={600} style={{ marginBottom: 4 }}>
            {section.title}
          </Txt>
          {section.items.map((item) => (
            <ItemRow
              key={item.id}
              label={item.label}
              note={item.note}
              tick={tickFor(item.id)}
              onToggle={() => run(toggleChecklistItem(list.id, item.id))}
            />
          ))}
        </Card>
      ))}

      <Card style={{ gap: 4 }}>
        <Txt size={14.5} weight={600} style={{ marginBottom: 4 }}>
          إضافاتك
        </Txt>
        {custom.length === 0 ? (
          <Txt size={12.5} color={colors.faint} lineHeight={1.7}>
            لا شيء بعد — أضيفي ما تحتاجينه أنتِ، فكل بيت مختلف.
          </Txt>
        ) : (
          custom.map((tick) => (
            <ItemRow
              key={tick.itemId}
              label={tick.label}
              tick={tick}
              onToggle={() => run(toggleChecklistItem(list.id, tick.itemId))}
              onRemove={() => run(removeChecklistItem(list.id, tick.itemId))}
            />
          ))
        )}

        <Row gap={10} align="flex-start" style={{ marginTop: 10 }}>
          <TextField
            value={draft}
            onChange={setDraft}
            placeholder="أضيفي عنصرًا…"
            size={14.5}
            style={{ flex: 1 }}
          />
          <Pressable
            onPress={submitDraft}
            accessibilityLabel="إضافة عنصر"
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.sageDark : colors.sage,
              borderRadius: 12,
              paddingVertical: 13,
              paddingHorizontal: 20,
            })}
          >
            <Txt size={14} weight={600} color={colors.surface}>
              إضافة
            </Txt>
          </Pressable>
        </Row>

        {error ? <ErrorText>{error}</ErrorText> : null}
      </Card>
    </Screen>
  );
}

function ItemRow({
  label,
  note,
  tick,
  onToggle,
  onRemove,
}: {
  label: string;
  note?: string;
  tick?: ChecklistTick;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const done = tick?.done ?? false;

  return (
    <Row gap={12} align="flex-start" style={{ paddingVertical: 8 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={label}
        hitSlop={8}
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          marginTop: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.sage : colors.surface,
          borderWidth: 1,
          borderColor: done ? colors.sage : colors.borderDashed,
        }}
      >
        {done ? (
          <Txt size={12} color={colors.surface} align="center">
            ✓
          </Txt>
        ) : null}
      </Pressable>

      <Pressable onPress={onToggle} style={{ flex: 1 }}>
        <Txt
          size={13.5}
          lineHeight={1.7}
          color={done ? colors.faint : colors.body}
          style={done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {label}
        </Txt>
        {note ? (
          <Txt size={11.5} color={colors.faint} lineHeight={1.6} style={{ marginTop: 1 }}>
            {note}
          </Txt>
        ) : null}
      </Pressable>

      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityLabel={`حذف ${label}`} hitSlop={8}>
          <Txt size={15} color={colors.clayDelete}>
            ×
          </Txt>
        </Pressable>
      ) : null}
    </Row>
  );
}
