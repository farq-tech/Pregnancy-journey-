/**
 * Local notifications for appointment reminders.
 *
 * These are scheduled on the device rather than pushed from a server: the
 * reminder is about her own calendar entry, it must fire with no network, and
 * routing appointment times through a push service would mean sending medical
 * appointment data somewhere it does not need to go.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { fromIso } from './dates';
import type { Appointment, ReminderOffset } from '../store/types';

/** How far ahead of the appointment each option fires. */
const OFFSET_MINUTES: Record<Exclude<ReminderOffset, ''>, number> = {
  '1h': 60,
  '24h': 24 * 60,
  '48h': 48 * 60,
  week: 7 * 24 * 60,
};

/** Appointments with no time set are assumed to be first thing in the morning. */
const DEFAULT_HOUR = 9;

/**
 * Scheduled local notifications are a native capability. In a web build every
 * call below is a no-op: the appointment and its reminder are still saved and
 * shown in the app, there is simply nothing to schedule on the device.
 */
const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

if (SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Asks for notification permission. Returns false if it was refused, which is a
 * normal outcome — the reminder is still stored and shown in the app.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!SUPPORTED) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Notifications are keyed by appointment id so they can be replaced or dropped. */
function identifierFor(appointmentId: string): string {
  return `appointment:${appointmentId}`;
}

/** When the reminder for this appointment should fire, or null if it should not. */
export function reminderDateFor(appointment: Appointment, now: Date = new Date()): Date | null {
  if (!appointment.reminder || appointment.done) return null;

  const when = fromIso(appointment.date);
  if (appointment.time) {
    const [hours, minutes] = appointment.time.split(':').map(Number);
    when.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    when.setHours(DEFAULT_HOUR, 0, 0, 0);
  }

  const fireAt = new Date(when.getTime() - OFFSET_MINUTES[appointment.reminder] * 60_000);
  // A reminder for a moment that has already passed would fire immediately,
  // which reads as a bug rather than a reminder.
  return fireAt.getTime() > now.getTime() ? fireAt : null;
}

export async function cancelReminder(appointmentId: string): Promise<void> {
  if (!SUPPORTED) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifierFor(appointmentId));
  } catch {
    // Nothing was scheduled — cancelling is meant to be idempotent.
  }
}

/**
 * Brings the scheduled notification in line with the appointment: schedules,
 * reschedules or cancels as needed. Safe to call after any change to it.
 */
export async function syncReminder(appointment: Appointment): Promise<void> {
  if (!SUPPORTED) return;
  await cancelReminder(appointment.id);

  const fireAt = reminderDateFor(appointment);
  if (!fireAt) return;

  if (!(await ensureNotificationPermission())) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'مواعيد الحمل',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: identifierFor(appointment.id),
    content: {
      title: appointment.title,
      body: appointment.time
        ? `موعدك القادم الساعة ${appointment.time}`
        : 'لديك موعد قادم',
      data: { appointmentId: appointment.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}

/**
 * Rebuilds every scheduled reminder from the current appointment list.
 *
 * iOS caps an app at 64 pending local notifications and silently drops the rest,
 * so only future reminders are scheduled and the soonest win.
 *
 * Called on launch, so it never *asks* for permission — being prompted before
 * you have entered anything is how people learn to tap "Don't Allow". The ask
 * happens when she actually sets a reminder.
 */
export async function rescheduleAll(appointments: Appointment[]): Promise<void> {
  if (!SUPPORTED) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const pending = appointments
    .map((appointment) => ({ appointment, fireAt: reminderDateFor(appointment) }))
    .filter((entry): entry is { appointment: Appointment; fireAt: Date } => entry.fireAt !== null)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, 60);

  for (const { appointment } of pending) {
    await syncReminder(appointment);
  }
}
