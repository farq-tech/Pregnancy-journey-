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

import { isoToday, type IsoDate } from '../lib/dates';
import { DEFAULT_CYCLE_LENGTH, type Settings } from '../lib/pregnancy';
import { ensureSession, supabase } from '../lib/supabase';
import type {
  Appointment,
  AppointmentType,
  JournalEntry,
  MedicalRecord,
  RecordType,
  ReminderOffset,
  WeekVideo,
} from './types';

const CACHE_KEY = 'pj_cache_v1';

type Snapshot = {
  settings: Settings | null;
  appointments: Appointment[];
  journal: JournalEntry[];
  records: MedicalRecord[];
  videos: WeekVideo[];
};

const EMPTY: Snapshot = {
  settings: null,
  appointments: [],
  journal: [],
  records: [],
  videos: [],
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
  addAppointment: (input: Omit<Appointment, 'id' | 'done'>) => Promise<void>;
  toggleAppointment: (id: string) => Promise<void>;
  addJournalEntry: (input: Omit<JournalEntry, 'id'>) => Promise<void>;
  addRecord: (input: Omit<MedicalRecord, 'id'>) => Promise<void>;
  addVideo: (input: Omit<WeekVideo, 'id'>) => Promise<void>;
  remove: (table: 'appointments' | 'journal' | 'records' | 'videos', id: string) => Promise<void>;
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
}): Settings => ({
  lmp: row.lmp,
  cycleLength: row.cycle_length,
  status: row.status === 'planning' ? 'planning' : 'pregnant',
  eddOverride: row.edd_override,
  babyName: row.baby_name,
  motherName: row.mother_name,
  doctor: row.doctor,
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

      const [profile, appointments, journal, records, videos] = await Promise.all([
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
      ]);

      const failure =
        profile.error ?? appointments.error ?? journal.error ?? records.error ?? videos.error;
      if (failure) throw failure;

      cache({
        settings: profile.data ? toSettings(profile.data) : null,
        appointments: (appointments.data ?? []).map(toAppointment),
        journal: (journal.data ?? []).map(toJournalEntry),
        records: (records.data ?? []).map(toRecord),
        videos: (videos.data ?? []).map(toVideo),
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
        if (raw && !cancelled) setSnapshot(JSON.parse(raw) as Snapshot);
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
        })
        .select()
        .single();
      if (error) throw error;
      cache({ ...snapshot, settings: toSettings(data) });
    },
    [cache, requireUser, snapshot],
  );

  const addAppointment = useCallback(
    async (input: Omit<Appointment, 'id' | 'done'>) => {
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
        })
        .select()
        .single();
      if (error) throw error;
      cache({
        ...snapshot,
        appointments: [...snapshot.appointments, toAppointment(data)].sort((a, b) =>
          (a.date + a.time).localeCompare(b.date + b.time),
        ),
      });
    },
    [cache, requireUser, snapshot],
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
    },
    [cache, snapshot],
  );

  const addJournalEntry = useCallback(
    async (input: Omit<JournalEntry, 'id'>) => {
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
      cache({ ...snapshot, journal: [toJournalEntry(data), ...snapshot.journal] });
    },
    [cache, requireUser, snapshot],
  );

  const addRecord = useCallback(
    async (input: Omit<MedicalRecord, 'id'>) => {
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
        })
        .select()
        .single();
      if (error) throw error;

      const next: Snapshot = { ...snapshot, records: [toRecord(data), ...snapshot.records] };

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
    [cache, requireUser, snapshot],
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
      cache({ ...snapshot, [table]: snapshot[table].filter((item) => item.id !== id) });
      const { error } = await supabase.from(dbTable).delete().eq('id', id);
      if (error) {
        cache(previous);
        throw error;
      }
    },
    [cache, snapshot],
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
      refresh,
    ],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}
