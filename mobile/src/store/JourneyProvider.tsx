import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { isoToday, toIso, type IsoDate } from '../lib/dates';
import { cancelReminder, rescheduleAll, syncReminder } from '../lib/reminders';
import { DEFAULT_CYCLE_LENGTH, type Settings } from '../lib/pregnancy';
import { recurringDates } from '../lib/recurrence';
import {
  removeAttachment,
  toAttachment,
  uploadAttachment,
  type Attachment,
  type AttachmentOwner,
  type PickedFile,
} from '../lib/storage';
import { ensureSession, supabase } from '../lib/supabase';
import type {
  Appointment,
  AppointmentType,
  ChecklistTick,
  Contraction,
  JournalEntry,
  KickSession,
  Letter,
  Measurement,
  MeasurementKind,
  MedicalRecord,
  RecordType,
  ReminderOffset,
  TestStatus,
  TestTracking,
  WeekVideo,
} from './types';

const CACHE_KEY = 'pj_cache_v1';

type Snapshot = {
  settings: Settings | null;
  appointments: Appointment[];
  journal: JournalEntry[];
  records: MedicalRecord[];
  videos: WeekVideo[];
  attachments: Attachment[];
  tests: TestTracking[];
  kicks: KickSession[];
  contractions: Contraction[];
  measurements: Measurement[];
  checklist: ChecklistTick[];
  letters: Letter[];
};

const EMPTY: Snapshot = {
  settings: null,
  appointments: [],
  journal: [],
  records: [],
  videos: [],
  attachments: [],
  tests: [],
  kicks: [],
  contractions: [],
  measurements: [],
  checklist: [],
  letters: [],
};

type JourneyValue = Snapshot & {
  /** `loading` only covers the very first hydrate; refreshes are silent. */
  loading: boolean;
  /** Set when the last sync failed — the UI keeps showing cached data. */
  syncError: string | null;
  /** Today's date, kept live so the app rolls over at midnight. */
  today: IsoDate;
  /** True right after an ultrasound rewrote the due date. */
  eddBanner: boolean;
  dismissEddBanner: () => void;

  saveSettings: (input: Settings) => Promise<void>;
  addAppointment: (
    input: Omit<Appointment, 'id' | 'done'>,
    files?: PickedFile[],
  ) => Promise<void>;
  toggleAppointment: (id: string) => Promise<void>;
  addJournalEntry: (input: Omit<JournalEntry, 'id'>, files?: PickedFile[]) => Promise<void>;
  addRecord: (input: Omit<MedicalRecord, 'id'>, files?: PickedFile[]) => Promise<void>;
  addVideo: (input: Omit<WeekVideo, 'id'>) => Promise<void>;
  remove: (table: 'appointments' | 'journal' | 'records' | 'videos', id: string) => Promise<void>;
  /** Files hanging off one row. */
  attachmentsFor: (ownerType: AttachmentOwner, ownerId: string) => Attachment[];
  deleteAttachment: (attachment: Attachment) => Promise<void>;
  setTestStatus: (testId: string, status: TestStatus, notes?: string) => Promise<void>;

  /** Opens a kick-counting session and returns it, so the screen can tick it up. */
  startKickSession: () => Promise<KickSession>;
  /** Writes the running count through, so a closed app does not lose it. */
  updateKickSession: (id: string, count: number) => Promise<void>;
  endKickSession: (id: string, count: number, note?: string) => Promise<void>;
  addContraction: (startedAt: Date, durationSeconds: number, note?: string) => Promise<void>;
  addMeasurement: (input: Omit<Measurement, 'id'>) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  /** Ticks a curated or custom checklist line; creates the row on first tap. */
  toggleChecklistItem: (listId: string, itemId: string, label?: string) => Promise<void>;
  addChecklistItem: (listId: string, label: string) => Promise<void>;
  removeChecklistItem: (listId: string, itemId: string) => Promise<void>;
  addLetter: (input: Omit<Letter, 'id'>) => Promise<void>;
  removeLetter: (id: string) => Promise<void>;

  refresh: () => Promise<void>;
};

const JourneyContext = createContext<JourneyValue | null>(null);

export function useJourney(): JourneyValue {
  const value = useContext(JourneyContext);
  if (!value) throw new Error('useJourney must be used inside <JourneyProvider>');
  return value;
}

// ---------------------------------------------------------------- mapping ---
// The database is snake_case; the app is camelCase. Nulls become empty strings
// so screens never have to null-check a text field.

const toSettings = (row: {
  lmp: string;
  cycle_length: number;
  status: string;
  edd_override: string | null;
  baby_name: string;
  mother_name: string;
  doctor: string;
  height_cm: number | null;
  pre_pregnancy_weight_kg: number | null;
  partner_name: string;
}): Settings => ({
  lmp: row.lmp,
  cycleLength: row.cycle_length,
  status: row.status === 'planning' ? 'planning' : 'pregnant',
  eddOverride: row.edd_override,
  babyName: row.baby_name,
  motherName: row.mother_name,
  doctor: row.doctor,
  heightCm: row.height_cm,
  prePregnancyWeightKg: row.pre_pregnancy_weight_kg,
  partnerName: row.partner_name,
});

const toAppointment = (row: {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string | null;
  location: string;
  doctor: string;
  notes: string;
  reminder: string;
  done: boolean;
  recurrence: string | null;
}): Appointment => ({
  id: row.id,
  title: row.title,
  type: row.type as AppointmentType,
  date: row.date,
  // Postgres returns `time` as HH:MM:SS; the UI only shows hours and minutes.
  time: row.time ? row.time.slice(0, 5) : '',
  location: row.location,
  doctor: row.doctor,
  notes: row.notes,
  reminder: row.reminder as ReminderOffset,
  done: row.done,
  recurrence: (row.recurrence ?? '') as Appointment['recurrence'],
});

const toJournalEntry = (row: {
  id: string;
  date: string;
  mood: string;
  body: string;
  symptoms: string;
  weight_kg: number | null;
}): JournalEntry => ({
  id: row.id,
  date: row.date,
  mood: row.mood,
  text: row.body,
  symptoms: row.symptoms,
  weight: row.weight_kg,
});

const toRecord = (row: {
  id: string;
  type: string;
  title: string;
  date: string;
  provider: string;
  notes: string;
  crl: string;
  fhr: string;
  new_edd: string | null;
  scan_ga_days: number | null;
}): MedicalRecord => ({
  id: row.id,
  type: row.type as RecordType,
  title: row.title,
  date: row.date,
  provider: row.provider,
  notes: row.notes,
  crl: row.crl,
  fhr: row.fhr,
  newEdd: row.new_edd,
  scanGaDays: row.scan_ga_days,
});

const toVideo = (row: {
  id: string;
  week: number;
  title: string;
  url: string;
  source: string;
  author: string;
  duration: string;
  pub_date: string;
  license: string;
  description: string;
  thumbnail_url: string;
}): WeekVideo => ({
  id: row.id,
  week: row.week,
  title: row.title,
  url: row.url,
  source: row.source,
  author: row.author,
  duration: row.duration,
  pubDate: row.pub_date,
  license: row.license,
  description: row.description,
  thumbnailUrl: row.thumbnail_url,
});

const toTest = (row: {
  id: string;
  test_id: string;
  status: string;
  notes: string;
  appointment_id: string | null;
}): TestTracking => ({
  id: row.id,
  testId: row.test_id,
  status: row.status as TestStatus,
  notes: row.notes,
  appointmentId: row.appointment_id,
});

const toKickSession = (row: {
  id: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  count: number;
  note: string;
}): KickSession => ({
  id: row.id,
  date: row.date,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  count: row.count,
  note: row.note,
});

const toContraction = (row: {
  id: string;
  started_at: string;
  duration_seconds: number;
  note: string;
}): Contraction => ({
  id: row.id,
  startedAt: row.started_at,
  durationSeconds: row.duration_seconds,
  note: row.note,
});

const toMeasurement = (row: {
  id: string;
  date: string;
  kind: string;
  value: number;
  value2: number | null;
  context: string;
  notes: string;
}): Measurement => ({
  id: row.id,
  date: row.date,
  kind: row.kind as MeasurementKind,
  value: Number(row.value),
  value2: row.value2 === null ? null : Number(row.value2),
  context: row.context,
  notes: row.notes,
});

const toChecklistTick = (row: {
  id: string;
  list_id: string;
  item_id: string;
  label: string;
  done: boolean;
}): ChecklistTick => ({
  id: row.id,
  listId: row.list_id,
  itemId: row.item_id,
  label: row.label,
  done: row.done,
});

const toLetter = (row: {
  id: string;
  date: string;
  title: string;
  body: string;
  author: string;
}): Letter => ({
  id: row.id,
  date: row.date,
  title: row.title,
  body: row.body,
  author: row.author,
});

// --------------------------------------------------------------- provider ---

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [today, setToday] = useState<IsoDate>(isoToday());
  const [eddBanner, setEddBanner] = useState(false);
  const userId = useRef<string | null>(null);

  const cache = useCallback((next: Snapshot) => {
    setSnapshot(next);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {
      // A failed cache write is not worth interrupting the mother for; the
      // server copy is still authoritative.
    });
  }, []);

  /** Pulls everything for the signed-in user in one round of parallel queries. */
  const refresh = useCallback(async () => {
    try {
      const user = await ensureSession();
      userId.current = user.id;

      const [
        profile,
        appointments,
        journal,
        records,
        videos,
        attachments,
        tests,
        kicks,
        contractions,
        measurements,
        checklist,
        letters,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('appointments').select('*').eq('user_id', user.id).order('date'),
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('records')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase.from('videos').select('*').eq('user_id', user.id).order('week'),
        supabase.from('attachments').select('*').eq('user_id', user.id),
        supabase.from('test_tracking').select('*').eq('user_id', user.id),
        supabase
          .from('kick_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false }),
        supabase
          .from('contractions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false }),
        supabase
          .from('measurements')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase.from('checklist_items').select('*').eq('user_id', user.id),
        supabase
          .from('letters')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
      ]);

      const failure =
        profile.error ??
        appointments.error ??
        journal.error ??
        records.error ??
        videos.error ??
        attachments.error ??
        tests.error ??
        kicks.error ??
        contractions.error ??
        measurements.error ??
        checklist.error ??
        letters.error;
      if (failure) throw failure;

      cache({
        settings: profile.data ? toSettings(profile.data) : null,
        appointments: (appointments.data ?? []).map(toAppointment),
        journal: (journal.data ?? []).map(toJournalEntry),
        records: (records.data ?? []).map(toRecord),
        videos: (videos.data ?? []).map(toVideo),
        attachments: (attachments.data ?? []).map(toAttachment),
        tests: (tests.data ?? []).map(toTest),
        kicks: (kicks.data ?? []).map(toKickSession),
        contractions: (contractions.data ?? []).map(toContraction),
        measurements: (measurements.data ?? []).map(toMeasurement),
        checklist: (checklist.data ?? []).map(toChecklistTick),
        letters: (letters.data ?? []).map(toLetter),
      });
      setSyncError(null);
    } catch (error) {
      // Cached data stays on screen; the banner tells her it may be stale.
      setSyncError(error instanceof Error ? error.message : 'تعذّر الاتصال بالخادم.');
    }
  }, [cache]);

  // Boot: show the cached journey immediately, then reconcile with the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && !cancelled) {
          // Merge over EMPTY so a cache written by an older build, before these
          // fields existed, still hydrates instead of yielding undefined lists.
          setSnapshot({ ...EMPTY, ...(JSON.parse(raw) as Partial<Snapshot>) });
        }
      } catch {
        // Corrupt cache: fall through to the server fetch.
      }
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // Local notifications do not survive a reinstall or a restore to a new phone,
  // so rebuild the schedule from the appointments once they have loaded.
  const appointmentsSignature = snapshot.appointments
    .map((a) => `${a.id}:${a.date}:${a.time}:${a.reminder}:${a.done}`)
    .join('|');

  useEffect(() => {
    if (loading) return;
    void rescheduleAll(snapshot.appointments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, appointmentsSignature]);

  // Roll the app over at midnight, and re-check whenever it returns to the
  // foreground — a phone left open overnight must not still say "yesterday".
  useEffect(() => {
    const tick = () => setToday(isoToday());
    const timer = setInterval(tick, 30_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        void refresh();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  const requireUser = useCallback(async () => {
    if (userId.current) return userId.current;
    const user = await ensureSession();
    userId.current = user.id;
    return user.id;
  }, []);

  /**
   * Uploads the files picked in a sheet, now that the row they belong to exists.
   * A failed upload does not discard the row she just saved — the note or the
   * appointment is the important part; the file can be re-attached.
   */
  const uploadFor = useCallback(
    async (
      ownerType: AttachmentOwner,
      ownerId: string,
      files: PickedFile[] | undefined,
      uid: string,
    ): Promise<Attachment[]> => {
      if (!files?.length) return [];
      const uploaded: Attachment[] = [];
      for (const file of files) {
        try {
          uploaded.push(await uploadAttachment(uid, ownerType, ownerId, file));
        } catch (error) {
          setSyncError(
            error instanceof Error ? error.message : 'تعذّر رفع أحد المرفقات.',
          );
        }
      }
      return uploaded;
    },
    [],
  );

  const saveSettings = useCallback(
    async (input: Settings) => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id,
          lmp: input.lmp,
          cycle_length: input.cycleLength || DEFAULT_CYCLE_LENGTH,
          status: input.status,
          edd_override: input.eddOverride,
          baby_name: input.babyName,
          mother_name: input.motherName,
          doctor: input.doctor,
          height_cm: input.heightCm,
          pre_pregnancy_weight_kg: input.prePregnancyWeightKg,
          partner_name: input.partnerName,
        })
        .select()
        .single();
      if (error) throw error;
      cache({ ...snapshot, settings: toSettings(data) });
    },
    [cache, requireUser, snapshot],
  );

  const addAppointment = useCallback(
    async (input: Omit<Appointment, 'id' | 'done'>, files?: PickedFile[]) => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: id,
          title: input.title,
          type: input.type,
          date: input.date,
          time: input.time || null,
          location: input.location,
          doctor: input.doctor,
          notes: input.notes,
          reminder: input.reminder,
          recurrence: input.recurrence || null,
        })
        .select()
        .single();
      if (error) throw error;

      const appointment = toAppointment(data);
      const uploaded = await uploadFor('appointment', appointment.id, files, id);
      await syncReminder(appointment);

      // A repeat rule has to produce real appointments, otherwise it is a label
      // that does nothing. Occurrences are concrete rows so each one can be
      // rescheduled, ticked off or deleted on its own.
      const followUps = recurringDates(
        appointment.date,
        appointment.recurrence,
        snapshot.settings,
      );

      let created: Appointment[] = [];
      if (followUps.length) {
        const repeat = await supabase
          .from('appointments')
          .insert(
            followUps.map((date) => ({
              user_id: id,
              title: appointment.title,
              type: appointment.type,
              date,
              time: appointment.time || null,
              location: appointment.location,
              doctor: appointment.doctor,
              notes: appointment.notes,
              reminder: appointment.reminder,
              // Occurrences are not themselves recurring, or they would expand
              // again the next time one is edited.
              recurrence: null,
            })),
          )
          .select();
        if (repeat.error) throw repeat.error;
        created = (repeat.data ?? []).map(toAppointment);
        for (const occurrence of created) await syncReminder(occurrence);
      }

      cache({
        ...snapshot,
        appointments: [...snapshot.appointments, appointment, ...created].sort((a, b) =>
          (a.date + a.time).localeCompare(b.date + b.time),
        ),
        attachments: [...snapshot.attachments, ...uploaded],
      });
    },
    [cache, requireUser, snapshot, uploadFor],
  );

  const toggleAppointment = useCallback(
    async (id: string) => {
      const current = snapshot.appointments.find((a) => a.id === id);
      if (!current) return;
      const next = !current.done;

      // Ticking a visit off should feel instant, so update first and roll back
      // if the write is rejected.
      cache({
        ...snapshot,
        appointments: snapshot.appointments.map((a) => (a.id === id ? { ...a, done: next } : a)),
      });
      const { error } = await supabase.from('appointments').update({ done: next }).eq('id', id);
      if (error) {
        cache(snapshot);
        throw error;
      }
      // A visit already attended does not need reminding about.
      await syncReminder({ ...current, done: next });
    },
    [cache, snapshot],
  );

  const addJournalEntry = useCallback(
    async (input: Omit<JournalEntry, 'id'>, files?: PickedFile[]) => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: id,
          date: input.date,
          mood: input.mood,
          body: input.text,
          symptoms: input.symptoms,
          weight_kg: input.weight,
        })
        .select()
        .single();
      if (error) throw error;

      const entry = toJournalEntry(data);
      const uploaded = await uploadFor('journal', entry.id, files, id);
      cache({
        ...snapshot,
        journal: [entry, ...snapshot.journal],
        attachments: [...snapshot.attachments, ...uploaded],
      });
    },
    [cache, requireUser, snapshot, uploadFor],
  );

  const addRecord = useCallback(
    async (input: Omit<MedicalRecord, 'id'>, files?: PickedFile[]) => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('records')
        .insert({
          user_id: id,
          type: input.type,
          title: input.title,
          date: input.date,
          provider: input.provider,
          notes: input.notes,
          crl: input.crl,
          fhr: input.fhr,
          new_edd: input.newEdd,
          scan_ga_days: input.scanGaDays,
        })
        .select()
        .single();
      if (error) throw error;

      const record = toRecord(data);
      const uploaded = await uploadFor('record', record.id, files, id);

      const next: Snapshot = {
        ...snapshot,
        records: [record, ...snapshot.records],
        attachments: [...snapshot.attachments, ...uploaded],
      };

      // An ultrasound that assigns a new due date rebuilds the whole calendar.
      if (input.type === 'ultrasound' && input.newEdd && snapshot.settings) {
        const profile = await supabase
          .from('profiles')
          .update({ edd_override: input.newEdd })
          .eq('id', id)
          .select()
          .single();
        if (profile.error) throw profile.error;
        next.settings = toSettings(profile.data);
        setEddBanner(true);
      }

      cache(next);
    },
    [cache, requireUser, snapshot, uploadFor],
  );

  const addVideo = useCallback(
    async (input: Omit<WeekVideo, 'id'>) => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('videos')
        .insert({
          user_id: id,
          week: input.week,
          title: input.title,
          url: input.url,
          source: input.source,
          author: input.author,
          duration: input.duration,
          pub_date: input.pubDate,
          license: input.license,
          description: input.description,
          thumbnail_url: input.thumbnailUrl,
        })
        .select()
        .single();
      if (error) throw error;
      cache({ ...snapshot, videos: [...snapshot.videos, toVideo(data)] });
    },
    [cache, requireUser, snapshot],
  );

  const remove = useCallback(
    async (table: 'appointments' | 'journal' | 'records' | 'videos', id: string) => {
      const dbTable = table === 'journal' ? 'journal_entries' : table;
      const previous = snapshot;
      const ownerType: AttachmentOwner | null =
        table === 'records'
          ? 'record'
          : table === 'journal'
            ? 'journal'
            : table === 'appointments'
              ? 'appointment'
              : null;

      const orphaned = ownerType
        ? snapshot.attachments.filter((a) => a.ownerType === ownerType && a.ownerId === id)
        : [];

      cache({
        ...snapshot,
        [table]: snapshot[table].filter((item) => item.id !== id),
        attachments: snapshot.attachments.filter((a) => !orphaned.includes(a)),
      });

      const { error } = await supabase.from(dbTable).delete().eq('id', id);
      if (error) {
        cache(previous);
        throw error;
      }

      if (table === 'appointments') await cancelReminder(id);
      // Attachment rows cascade with the user, not the owner row, so their files
      // have to be cleaned up explicitly.
      for (const attachment of orphaned) {
        try {
          await removeAttachment(attachment);
        } catch {
          // Leaves a file behind rather than blocking the delete she asked for.
        }
      }
    },
    [cache, snapshot],
  );

  const deleteAttachment = useCallback(
    async (attachment: Attachment) => {
      const previous = snapshot;
      cache({
        ...snapshot,
        attachments: snapshot.attachments.filter((a) => a.id !== attachment.id),
      });
      try {
        await removeAttachment(attachment);
      } catch (error) {
        cache(previous);
        throw error;
      }
    },
    [cache, snapshot],
  );

  const setTestStatus = useCallback(
    async (testId: string, status: TestStatus, notes = '') => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('test_tracking')
        .upsert(
          { user_id: id, test_id: testId, status, notes },
          { onConflict: 'user_id,test_id' },
        )
        .select()
        .single();
      if (error) throw error;

      const updated = toTest(data);
      cache({
        ...snapshot,
        tests: [...snapshot.tests.filter((t) => t.testId !== testId), updated],
      });
    },
    [cache, requireUser, snapshot],
  );

  // ------------------------------------------------------------ tracking ---

  const startKickSession = useCallback(async () => {
    const id = await requireUser();
    const now = new Date();
    const { data, error } = await supabase
      .from('kick_sessions')
      .insert({ user_id: id, date: toIso(now), started_at: now.toISOString(), count: 0 })
      .select()
      .single();
    if (error) throw error;

    const session = toKickSession(data);
    cache({ ...snapshot, kicks: [session, ...snapshot.kicks] });
    return session;
  }, [cache, requireUser, snapshot]);

  /**
   * Writes the count through on every tap. Chattier than saving at the end, and
   * deliberately so: a count of eight lost to a locked phone is a count she has
   * to start over, at the exact moment she is already anxious.
   */
  const updateKickSession = useCallback(
    async (id: string, count: number) => {
      cache({
        ...snapshot,
        kicks: snapshot.kicks.map((s) => (s.id === id ? { ...s, count } : s)),
      });
      const { error } = await supabase.from('kick_sessions').update({ count }).eq('id', id);
      if (error) throw error;
    },
    [cache, snapshot],
  );

  const endKickSession = useCallback(
    async (id: string, count: number, note = '') => {
      const endedAt = new Date().toISOString();
      cache({
        ...snapshot,
        kicks: snapshot.kicks.map((s) => (s.id === id ? { ...s, count, endedAt, note } : s)),
      });
      const { error } = await supabase
        .from('kick_sessions')
        .update({ count, ended_at: endedAt, note })
        .eq('id', id);
      if (error) throw error;
    },
    [cache, snapshot],
  );

  const addContraction = useCallback(
    async (startedAt: Date, durationSeconds: number, note = '') => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('contractions')
        .insert({
          user_id: id,
          started_at: startedAt.toISOString(),
          duration_seconds: Math.round(durationSeconds),
          note,
        })
        .select()
        .single();
      if (error) throw error;
      cache({ ...snapshot, contractions: [toContraction(data), ...snapshot.contractions] });
    },
    [cache, requireUser, snapshot],
  );

  const addMeasurement = useCallback(
    async (input: Omit<Measurement, 'id'>) => {
      const id = await requireUser();
      const { data, error } = await supabase
        .from('measurements')
        .insert({
          user_id: id,
          date: input.date,
          kind: input.kind,
          value: input.value,
          value2: input.value2,
          context: input.context,
          notes: input.notes,
        })
        .select()
        .single();
      if (error) throw error;
      cache({
        ...snapshot,
        measurements: [toMeasurement(data), ...snapshot.measurements].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      });
    },
    [cache, requireUser, snapshot],
  );

  const deleteMeasurement = useCallback(
    async (id: string) => {
      const previous = snapshot;
      cache({ ...snapshot, measurements: snapshot.measurements.filter((m) => m.id !== id) });
      const { error } = await supabase.from('measurements').delete().eq('id', id);
      if (error) {
        cache(previous);
        throw error;
      }
    },
    [cache, snapshot],
  );

  // ----------------------------------------------------------- checklists ---

  /**
   * Ticking a curated line for the first time creates its row; after that it
   * flips. `label` is only set for lines she wrote herself.
   */
  const toggleChecklistItem = useCallback(
    async (listId: string, itemId: string, label = '') => {
      const uid = await requireUser();
      const existing = snapshot.checklist.find(
        (tick) => tick.listId === listId && tick.itemId === itemId,
      );
      const done = !existing?.done;

      const { data, error } = await supabase
        .from('checklist_items')
        .upsert(
          { user_id: uid, list_id: listId, item_id: itemId, label: existing?.label ?? label, done },
          { onConflict: 'user_id,list_id,item_id' },
        )
        .select()
        .single();
      if (error) throw error;

      const tick = toChecklistTick(data);
      cache({
        ...snapshot,
        checklist: [
          ...snapshot.checklist.filter((t) => !(t.listId === listId && t.itemId === itemId)),
          tick,
        ],
      });
    },
    [cache, requireUser, snapshot],
  );

  const addChecklistItem = useCallback(
    async (listId: string, label: string) => {
      const uid = await requireUser();
      // Her own lines need an id that cannot collide with a curated one.
      const itemId = `custom-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from('checklist_items')
        .insert({ user_id: uid, list_id: listId, item_id: itemId, label, done: false })
        .select()
        .single();
      if (error) throw error;
      cache({ ...snapshot, checklist: [...snapshot.checklist, toChecklistTick(data)] });
    },
    [cache, requireUser, snapshot],
  );

  const removeChecklistItem = useCallback(
    async (listId: string, itemId: string) => {
      const previous = snapshot;
      cache({
        ...snapshot,
        checklist: snapshot.checklist.filter(
          (tick) => !(tick.listId === listId && tick.itemId === itemId),
        ),
      });
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('list_id', listId)
        .eq('item_id', itemId);
      if (error) {
        cache(previous);
        throw error;
      }
    },
    [cache, snapshot],
  );

  // -------------------------------------------------------------- letters ---

  const addLetter = useCallback(
    async (input: Omit<Letter, 'id'>) => {
      const uid = await requireUser();
      const { data, error } = await supabase
        .from('letters')
        .insert({
          user_id: uid,
          date: input.date,
          title: input.title,
          body: input.body,
          author: input.author,
        })
        .select()
        .single();
      if (error) throw error;
      cache({ ...snapshot, letters: [toLetter(data), ...snapshot.letters] });
    },
    [cache, requireUser, snapshot],
  );

  const removeLetter = useCallback(
    async (id: string) => {
      const previous = snapshot;
      cache({ ...snapshot, letters: snapshot.letters.filter((letter) => letter.id !== id) });
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (error) {
        cache(previous);
        throw error;
      }
    },
    [cache, snapshot],
  );

  const attachmentsFor = useCallback(
    (ownerType: AttachmentOwner, ownerId: string) =>
      snapshot.attachments.filter((a) => a.ownerType === ownerType && a.ownerId === ownerId),
    [snapshot.attachments],
  );

  const value = useMemo<JourneyValue>(
    () => ({
      ...snapshot,
      loading,
      syncError,
      today,
      eddBanner,
      dismissEddBanner: () => setEddBanner(false),
      saveSettings,
      addAppointment,
      toggleAppointment,
      addJournalEntry,
      addRecord,
      addVideo,
      remove,
      attachmentsFor,
      deleteAttachment,
      setTestStatus,
      startKickSession,
      updateKickSession,
      endKickSession,
      addContraction,
      addMeasurement,
      deleteMeasurement,
      toggleChecklistItem,
      addChecklistItem,
      removeChecklistItem,
      addLetter,
      removeLetter,
      refresh,
    }),
    [
      snapshot,
      loading,
      syncError,
      today,
      eddBanner,
      saveSettings,
      addAppointment,
      toggleAppointment,
      addJournalEntry,
      addRecord,
      addVideo,
      remove,
      attachmentsFor,
      deleteAttachment,
      setTestStatus,
      startKickSession,
      updateKickSession,
      endKickSession,
      addContraction,
      addMeasurement,
      deleteMeasurement,
      toggleChecklistItem,
      addChecklistItem,
      removeChecklistItem,
      addLetter,
      removeLetter,
      refresh,
    ],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}
