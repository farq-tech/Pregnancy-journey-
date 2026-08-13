import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';

import { ArrowButton } from '../../../src/components/ArrowButton';
import { Screen } from '../../../src/components/Screen';
import { Sheet } from '../../../src/components/Sheet';
import { Txt } from '../../../src/components/Txt';
import {
  ErrorText,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../../src/components/fields';
import { Card, Chip, Row } from '../../../src/components/layout';
import { WeekIllustration } from '../../../src/components/WeekIllustration';
import {
  LAST_REVIEWED,
  MILESTONES,
  SOURCES,
  TESTS,
  weekContent,
} from '../../../src/content/pregnancyData';
import { formatDayMonth, weekOrdinalLabel } from '../../../src/lib/arabic';
import { addDays, diffDays, fromIso } from '../../../src/lib/dates';
import { joinMeta } from '../../../src/lib/labels';
import {
  MAX_WEEK,
  MIN_WEEK,
  clampWeek,
  computeJourney,
  weekStart,
} from '../../../src/lib/pregnancy';
import { useJourney } from '../../../src/store/JourneyProvider';
import { colors } from '../../../src/theme';

export default function WeekScreen() {
  const params = useLocalSearchParams<{ week: string }>();
  const { settings, appointments, videos, today, addVideo, remove } = useJourney();

  const [week, setWeek] = useState(() => clampWeek(parseInt(params.week ?? '4', 10) || 4));
  const [sheetOpen, setSheetOpen] = useState(false);

  const journey = useMemo(
    () => (settings ? computeJourney(settings, fromIso(today)) : null),
    [settings, today],
  );

  if (!journey) return null;

  const content = weekContent(week);
  const currentWeek = clampWeek(journey.week);
  const start = weekStart(journey, week);
  const end = addDays(start, 6);

  const weekTests = TESTS.filter((t) => week >= t.from && week <= t.to);
  const weekMilestones = MILESTONES.filter((m) => m.week === week);
  const weekAppointments = appointments.filter((a) => {
    const delta = diffDays(fromIso(a.date), start);
    return delta >= 0 && delta <= 6;
  });
  const weekVideos = videos.filter((v) => v.week === week);
  const sources = (content.sources ?? []).map((key) => SOURCES[key]).filter(Boolean);

  return (
    <Screen>
      <Row justify="space-between">
        <ArrowButton
          direction="right"
          onPress={() => setWeek((w) => Math.max(MIN_WEEK, w - 1))}
          label="الأسبوع السابق"
        />
        <View>
          <Txt size={17} weight={600} align="center">
            {weekOrdinalLabel(week)}
          </Txt>
          <Txt size={12} color={colors.muted} align="center">
            {`${formatDayMonth(start)} – ${formatDayMonth(end)} ${end.getFullYear()}`}
          </Txt>
        </View>
        <ArrowButton
          direction="left"
          onPress={() => setWeek((w) => Math.min(MAX_WEEK, w + 1))}
          label="الأسبوع التالي"
        />
      </Row>

      <Card>
        <WeekIllustration week={week} size={130} caption={`صورة الجنين — ${weekOrdinalLabel(week)}`} />
        <Txt size={16} weight={600} color={colors.sage} align="center" style={{ marginTop: 12 }}>
          {content.title}
        </Txt>
        {content.size ? (
          <Txt size={13} color={colors.muted} align="center" style={{ marginTop: 4 }}>
            {joinMeta(content.size, content.compare, content.weight)}
          </Txt>
        ) : null}
        <Txt size={11.5} color={colors.faint} align="center" style={{ marginTop: 6 }}>
          {week === currentWeek ? 'الأسبوع الحالي' : week < currentWeek ? 'أسبوع سابق' : 'قادم'}
        </Txt>
      </Card>

      <Card>
        <Txt size={15} weight={600} style={{ marginBottom: 8 }}>
          الطفل 👶
        </Txt>
        <Txt size={14} color={colors.body} lineHeight={1.9}>
          {content.baby}
        </Txt>
        {content.appearance ? (
          <Txt size={13} color={colors.muted} lineHeight={1.8} style={{ marginTop: 8 }}>
            <Txt size={13} weight={600} color={colors.sage}>
              الشكل:{' '}
            </Txt>
            {content.appearance}
          </Txt>
        ) : null}
      </Card>

      <Card>
        <Txt size={15} weight={600} style={{ marginBottom: 8 }}>
          الأم 🤰
        </Txt>
        <Txt size={14} color={colors.body} lineHeight={1.9}>
          {content.mom}
        </Txt>
        {content.symptoms?.length ? (
          <Row wrap gap={6} style={{ marginTop: 10 }}>
            {content.symptoms.map((symptom) => (
              <Chip key={symptom} bg={colors.claySoft}>
                <Txt size={12} color={colors.clayText}>
                  {symptom}
                </Txt>
              </Chip>
            ))}
          </Row>
        ) : null}
      </Card>

      {weekTests.length ? (
        <Card>
          <Txt size={15} weight={600} style={{ marginBottom: 4 }}>
            فحوصات محتملة 🧪
          </Txt>
          <Txt size={12} color={colors.faint} lineHeight={1.5} style={{ marginBottom: 10 }}>
            التوقيت يختلف بحسب البلد والطبيب والحالة — ليست توصية شخصية.
          </Txt>
          <View style={{ gap: 12 }}>
            {weekTests.map((test) => (
              <View key={test.id}>
                <Txt size={14} weight={600}>
                  {test.name}
                </Txt>
                <Txt size={12.5} color={colors.muted} lineHeight={1.7} style={{ marginTop: 2 }}>
                  {`${test.why} · عادةً بين الأسبوع ${test.from}–${test.to}`}
                </Txt>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {weekMilestones.length ? (
        <Card>
          <Txt size={15} weight={600} style={{ marginBottom: 10 }}>
            محطات هذا الأسبوع
          </Txt>
          <View style={{ gap: 10 }}>
            {weekMilestones.map((milestone) => (
              <Row key={milestone.id} gap={8} align="flex-start">
                <Txt size={13.5} color={colors.sageRing}>
                  ◆
                </Txt>
                <Txt size={13.5} color={colors.body} lineHeight={1.7} style={{ flex: 1 }}>
                  {milestone.label}
                  {milestone.note ? (
                    <Txt size={13.5} color={colors.faint}>{` — ${milestone.note}`}</Txt>
                  ) : null}
                </Txt>
              </Row>
            ))}
          </View>
        </Card>
      ) : null}

      {weekAppointments.length ? (
        <Card>
          <Txt size={15} weight={600} style={{ marginBottom: 10 }}>
            مواعيدك هذا الأسبوع 📅
          </Txt>
          <View style={{ gap: 8 }}>
            {weekAppointments.map((appointment) => (
              <Txt key={appointment.id} size={13.5} lineHeight={1.6}>
                <Txt size={13.5} weight={600}>
                  {appointment.title}
                </Txt>
                <Txt size={13.5} color={colors.muted}>
                  {` — ${joinMeta(formatDayMonth(fromIso(appointment.date)), appointment.time)}`}
                </Txt>
              </Txt>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Row justify="space-between" style={{ marginBottom: 10 }}>
          <Txt size={15} weight={600}>
            ▶ شاهدي تطور طفلك
          </Txt>
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={{
              backgroundColor: colors.sageSoft,
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 14,
            }}
          >
            <Txt size={12} weight={600} color={colors.sageDark}>
              + إضافة فيديو
            </Txt>
          </Pressable>
        </Row>

        {weekVideos.length ? (
          <View style={{ gap: 10 }}>
            {weekVideos.map((video) => (
              <Row
                key={video.id}
                gap={12}
                style={{ backgroundColor: colors.bg, borderRadius: 14, padding: 12 }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: colors.sage,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt size={13} color={colors.surface} align="center">
                    ▶
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => {
                      // The link is user-supplied, so let the OS decide whether it
                      // is openable rather than assuming a browser will take it.
                      Linking.openURL(video.url).catch(() =>
                        Alert.alert('تعذّر فتح الرابط', video.url),
                      );
                    }}
                  >
                    <Txt size={13.5} weight={600} color={colors.sage}>
                      {video.title}
                    </Txt>
                  </Pressable>
                  <Txt size={11.5} color={colors.muted} style={{ marginTop: 2 }}>
                    {joinMeta(video.source, video.author, video.duration) || 'فيديو خارجي'}
                    {joinMeta(video.pubDate, video.license)
                      ? ` · ${joinMeta(video.pubDate, video.license)}`
                      : ''}
                  </Txt>
                </View>
                <Pressable
                  onPress={() => void remove('videos', video.id)}
                  accessibilityLabel="حذف الفيديو"
                >
                  <Txt size={15} color={colors.clay}>
                    ×
                  </Txt>
                </Pressable>
              </Row>
            ))}
          </View>
        ) : (
          <Txt size={12.5} color={colors.faint} lineHeight={1.7}>
            لا فيديوهات بعد — أضيفي فيديو من مصدر موثوق (يوتيوب، Vimeo، أو رابط خارجي) مع ذكر
            المصدر والمؤلف.
          </Txt>
        )}
      </Card>

      {sources.length ? (
        <Txt size={11.5} color={colors.faint} align="center" lineHeight={1.8}>
          {'المصادر: '}
          {sources.map((source, index) => (
            <Txt
              key={source.name}
              size={11.5}
              color={colors.muted}
              onPress={() => void Linking.openURL(source.url)}
            >
              {source.name}
              {index < sources.length - 1 ? '، ' : ' '}
            </Txt>
          ))}
          {`· آخر مراجعة ${LAST_REVIEWED}`}
        </Txt>
      ) : null}

      <VideoSheet
        visible={sheetOpen}
        week={week}
        onClose={() => setSheetOpen(false)}
        onSave={addVideo}
      />
    </Screen>
  );
}

function VideoSheet({
  visible,
  week,
  onClose,
  onSave,
}: {
  visible: boolean;
  week: number;
  onClose: () => void;
  onSave: (input: {
    week: number;
    title: string;
    url: string;
    source: string;
    author: string;
    duration: string;
    pubDate: string;
    license: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [author, setAuthor] = useState('');
  const [duration, setDuration] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [license, setLicense] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setUrl('');
    setSource('');
    setAuthor('');
    setDuration('');
    setPubDate('');
    setLicense('');
    setError('');
  };

  const submit = async () => {
    if (!title.trim() || !url.trim()) {
      setError('العنوان والرابط مطلوبان.');
      return;
    }
    // The database rejects anything that is not http(s); check here so she gets
    // an Arabic message instead of a Postgres constraint error.
    if (!/^https?:\/\//i.test(url.trim())) {
      setError('الرابط يجب أن يبدأ بـ http:// أو https://');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        week,
        title: title.trim(),
        url: url.trim(),
        source,
        author,
        duration,
        pubDate,
        license,
      });
      reset();
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
      title="إضافة فيديو"
      subtitle="أضيفي فيديو من مصدر موثوق فقط — مع ذكر المصدر والمؤلف وحقوق الاستخدام."
    >
      <TextField value={title} onChange={setTitle} placeholder="عنوان الفيديو" size={14.5} />
      <TextField
        value={url}
        onChange={setUrl}
        placeholder="الرابط (YouTube / Vimeo / خارجي)"
        size={14.5}
        ltr
      />
      <Row gap={10} align="flex-start">
        <TextField
          value={source}
          onChange={setSource}
          placeholder="المصدر"
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={author}
          onChange={setAuthor}
          placeholder="المؤلف"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      <Row gap={10} align="flex-start">
        <TextField
          value={duration}
          onChange={setDuration}
          placeholder="المدة"
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={pubDate}
          onChange={setPubDate}
          placeholder="تاريخ النشر"
          size={14.5}
          style={{ flex: 1 }}
        />
        <TextField
          value={license}
          onChange={setLicense}
          placeholder="الترخيص"
          size={14.5}
          style={{ flex: 1 }}
        />
      </Row>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Row gap={10}>
        <PrimaryButton
          label={saving ? 'جارٍ الحفظ…' : 'حفظ الفيديو'}
          onPress={submit}
          style={{ flex: 2 }}
        />
        <SecondaryButton label="إلغاء" onPress={onClose} style={{ flex: 1 }} />
      </Row>
    </Sheet>
  );
}
