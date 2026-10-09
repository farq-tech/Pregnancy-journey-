/**
 * Builds the HTML for the one-tap pregnancy-file PDF she can hand to a clinic
 * that cannot open the app. Arabic, RTL, no diagnosis — just her appointments,
 * tests, and scans.
 */

import { TESTS } from '../content/pregnancyData';
import {
  APPOINTMENT_TYPE_LABELS,
  RECORD_TYPE_LABELS,
  TEST_STATUS_LABELS,
  type Appointment,
  type JournalEntry,
  type MedicalRecord,
  type TestTracking,
} from '../store/types';
import { formatDayMonth, formatLong } from './arabic';
import { fromIso } from './dates';
import { countdownLabel } from './labels';
import type { Journey } from './pregnancy';
import { clampWeek } from './pregnancy';

export type PregnancyFileInput = {
  motherName: string;
  babyName: string;
  doctor: string;
  journey: Journey;
  appointments: readonly Appointment[];
  records: readonly MedicalRecord[];
  journal: readonly JournalEntry[];
  tests: readonly TestTracking[];
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function latest(entries: readonly JournalEntry[], read: (e: JournalEntry) => number | null): string {
  const found = [...entries]
    .filter((e) => read(e) != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!found) return '—';
  const value = read(found);
  return value == null ? '—' : String(value);
}

export function pregnancyFileHtml(input: PregnancyFileInput): string {
  const week = clampWeek(input.journey.week);
  const name = input.motherName.trim() || '—';
  const baby = input.babyName.trim() || '—';
  const doctor = input.doctor.trim() || '—';

  const upcoming = [...input.appointments]
    .filter((a) => !a.done)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const scans = input.records
    .filter((r) => r.type === 'ultrasound' || r.type === 'photo')
    .sort((a, b) => b.date.localeCompare(a.date));

  const otherRecords = input.records
    .filter((r) => r.type !== 'ultrasound' && r.type !== 'photo')
    .sort((a, b) => b.date.localeCompare(a.date));

  const weight = latest(input.journal, (e) => e.weight);
  const sys = latest(input.journal, (e) => e.bpSystolic);
  const dia = latest(input.journal, (e) => e.bpDiastolic);
  const fundal = latest(input.journal, (e) => e.fundalHeightCm);
  const bp = sys === '—' && dia === '—' ? '—' : `${sys}/${dia}`;

  const appointmentRows = upcoming.length
    ? upcoming
        .map(
          (a) => `<tr>
            <td>${esc(formatDayMonth(fromIso(a.date)))}${a.time ? ` · ${esc(a.time)}` : ''}</td>
            <td>${esc(a.title)}</td>
            <td>${esc(APPOINTMENT_TYPE_LABELS[a.type])}</td>
            <td>${esc(countdownLabel(a.date, input.journey.today))}</td>
            <td>${esc([a.location, a.doctor].filter(Boolean).join(' · ') || '—')}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="5">لا مواعيد قادمة</td></tr>';

  const testRows = TESTS.map((test) => {
    const tracked = input.tests.find((t) => t.testId === test.id);
    const status = tracked ? TEST_STATUS_LABELS[tracked.status] : 'لم يُحدَّد بعد';
    return `<tr>
      <td>${esc(test.name)}</td>
      <td>الأسبوع ${test.from}–${test.to}</td>
      <td>${esc(status)}</td>
      <td>${esc(tracked?.notes || '—')}</td>
    </tr>`;
  }).join('');

  const scanRows = scans.length
    ? scans
        .map((r) => {
          const bits = [
            r.crl ? `CRL ${r.crl}` : '',
            r.fhr ? `نبض ${r.fhr}` : '',
            r.scanGaDays != null
              ? `عمر السونار ${Math.floor(r.scanGaDays / 7)}و${r.scanGaDays % 7}ي`
              : '',
            r.newEdd ? `EDD ${formatDayMonth(fromIso(r.newEdd))}` : '',
          ].filter(Boolean);
          return `<tr>
            <td>${esc(formatDayMonth(fromIso(r.date)))}</td>
            <td>${esc(RECORD_TYPE_LABELS[r.type])}</td>
            <td>${esc(r.title)}</td>
            <td>${esc(bits.join(' · ') || r.notes || '—')}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="4">لا صور سونار بعد</td></tr>';

  const recordRows = otherRecords.length
    ? otherRecords
        .map(
          (r) => `<tr>
            <td>${esc(formatDayMonth(fromIso(r.date)))}</td>
            <td>${esc(RECORD_TYPE_LABELS[r.type])}</td>
            <td>${esc(r.title)}</td>
            <td>${esc(r.provider || r.notes || '—')}</td>
          </tr>`,
        )
        .join('')
    : '';

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>ملف الحمل</title>
  <style>
    @page { margin: 18mm 14mm; }
    body {
      font-family: -apple-system, 'Geeza Pro', 'Almarai', sans-serif;
      color: #2C332B;
      font-size: 12px;
      line-height: 1.65;
      margin: 0;
    }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 22px 0 8px; color: #4E5D4C; }
    .muted { color: #85826F; }
    .card {
      background: #EEF1EA;
      border-radius: 12px;
      padding: 12px 14px;
      margin: 12px 0 4px;
    }
    .grid { display: flex; flex-wrap: wrap; gap: 10px 18px; }
    .grid div { min-width: 28%; }
    .k { color: #85826F; font-size: 11px; }
    .v { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #E3E1D5; padding: 7px 6px; text-align: right; vertical-align: top; }
    th { color: #85826F; font-weight: 600; font-size: 11px; }
    .note { color: #A5A292; font-size: 10.5px; margin-top: 22px; }
  </style>
</head>
<body>
  <h1>ملف الحمل</h1>
  <div class="muted">${esc(formatLong(input.journey.today))} · اليوم ${input.journey.dayNumber} من 280 · الأسبوع ${week}</div>

  <div class="card">
    <div class="grid">
      <div><div class="k">الأم</div><div class="v">${esc(name)}</div></div>
      <div><div class="k">الطفل</div><div class="v">${esc(baby)}</div></div>
      <div><div class="k">الطبيب</div><div class="v">${esc(doctor)}</div></div>
      <div><div class="k">موعد الولادة المتوقع</div><div class="v">${esc(formatLong(input.journey.edd))}</div></div>
      <div><div class="k">آخر وزن</div><div class="v">${esc(weight)}${weight === '—' ? '' : ' كغم'}</div></div>
      <div><div class="k">آخر ضغط</div><div class="v">${esc(bp)}${bp === '—' ? '' : ' مم زئبق'}</div></div>
      <div><div class="k">آخر ارتفاع رحمي</div><div class="v">${esc(fundal)}${fundal === '—' ? '' : ' سم'}</div></div>
    </div>
  </div>

  <h2>المواعيد القادمة</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>العنوان</th><th>النوع</th><th>العدّ</th><th>المكان</th></tr></thead>
    <tbody>${appointmentRows}</tbody>
  </table>

  <h2>الفحوصات</h2>
  <table>
    <thead><tr><th>الفحص</th><th>النافذة المعتادة</th><th>الحالة</th><th>ملاحظة</th></tr></thead>
    <tbody>${testRows}</tbody>
  </table>

  <h2>صور السونار والمسح</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>النوع</th><th>العنوان</th><th>التفاصيل</th></tr></thead>
    <tbody>${scanRows}</tbody>
  </table>

  ${
    recordRows
      ? `<h2>بقية الملف</h2>
  <table>
    <thead><tr><th>التاريخ</th><th>النوع</th><th>العنوان</th><th>التفاصيل</th></tr></thead>
    <tbody>${recordRows}</tbody>
  </table>`
      : ''
  }

  <p class="note">هذا ملخص من تطبيق رحلة الحمل لمساعدة الزيارة القادمة. الأرقام والقوائم للتوثيق الشخصي، وليست تشخيصًا أو بديلاً عن ملف العيادة.</p>
</body>
</html>`;
}
