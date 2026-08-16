import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PageHeader } from '../../src/components/PageHeader';
import { Screen } from '../../src/components/Screen';
import { Txt } from '../../src/components/Txt';
import { TextField } from '../../src/components/fields';
import { Card, Chip, Row } from '../../src/components/layout';
import {
  GLOSSARY_CATEGORIES,
  searchGlossary,
  type GlossaryTerm,
} from '../../src/content/glossary';
import { colors } from '../../src/theme';

type Filter = 'all' | (typeof GLOSSARY_CATEGORIES)[number];

/**
 * The glossary is a reading aid for her own paperwork, so it is searchable by
 * the abbreviation as printed (CRL, AFI) as well as by the Arabic name.
 */
export default function GlossaryScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const results = useMemo(() => {
    const found = searchGlossary(query);
    return filter === 'all' ? found : found.filter((term) => term.category === filter);
  }, [query, filter]);

  return (
    <Screen>
      <PageHeader
        title="قاموس المصطلحات"
        subtitle="ما تعنيه الكلمات المكتوبة في تقاريرك"
        backLabel="المكتبة"
      />

      <TextField value={query} onChange={setQuery} placeholder="ابحثي — مثال: CRL أو السونار" />

      <Row wrap gap={7}>
        {(['all', ...GLOSSARY_CATEGORIES] as Filter[]).map((option) => {
          const active = filter === option;
          return (
            <Pressable
              key={option}
              onPress={() => setFilter(option)}
              style={{
                borderRadius: 999,
                paddingVertical: 7,
                paddingHorizontal: 14,
                backgroundColor: active ? colors.sage : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.sage : colors.border,
              }}
            >
              <Txt size={12.5} weight={active ? 600 : 400} color={active ? colors.surface : colors.muted}>
                {option === 'all' ? 'الكل' : option}
              </Txt>
            </Pressable>
          );
        })}
      </Row>

      {results.length === 0 ? (
        <Txt size={13} color={colors.faint} align="center" lineHeight={1.8} style={{ paddingVertical: 24 }}>
          لا نتائج لهذا البحث.
        </Txt>
      ) : (
        <View style={{ gap: 10 }}>
          {results.map((term) => (
            <TermCard key={term.id} term={term} />
          ))}
        </View>
      )}

      <Txt size={11.5} color={colors.faint} align="center" lineHeight={1.8} style={{ paddingHorizontal: 14 }}>
        الشرح هنا يوضّح ما يعنيه المصطلح، لا ما تعنيه نتيجتك أنتِ — تفسير القيم يعود لطبيبك.
      </Txt>
    </Screen>
  );
}

function TermCard({ term }: { term: GlossaryTerm }) {
  return (
    <Card radius={20} padding={0} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1 }}>
          <Txt size={14.5} weight={600}>
            {term.term}
          </Txt>
          <Txt size={12} color={colors.sage} align="right" style={{ marginTop: 2 }}>
            {term.en}
          </Txt>
        </View>
        <Chip>
          <Txt size={11} weight={500} color={colors.sageDark}>
            {term.category}
          </Txt>
        </Chip>
      </Row>
      <Txt size={13} color={colors.body} lineHeight={1.9} style={{ marginTop: 8 }}>
        {term.meaning}
      </Txt>
      <Txt size={11.5} color={colors.faint} style={{ marginTop: 6 }}>
        {`يظهر عادةً حول الأسبوع ${term.week}`}
      </Txt>
    </Card>
  );
}
