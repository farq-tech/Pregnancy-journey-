/**
 * UI chrome strings, Arabic and English.
 *
 * Scope note (spec §22): this covers the app's *chrome* — navigation, screen
 * titles, buttons, empty states. It deliberately does **not** cover the week 4–40
 * medical content in `src/content/pregnancyData.ts`. That copy is reviewed
 * editorial material with named sources; machine-translating it would produce
 * unsourced medical text in a second language, which is exactly what §21 rules
 * out. Translating it is an editorial task with clinical review, not a code one.
 *
 * Arabic is the source of truth. English exists so the switch is ready.
 */

export const STRINGS = {
  ar: {
    'nav.today': 'اليوم',
    'nav.calendar': 'التقويم',
    'nav.baby': 'طفلك',
    'nav.appointments': 'المواعيد',
    'nav.journal': 'اليوميات',
    'nav.records': 'الملف',

    'today.label': 'اليوم',
    'today.gestationalAge': 'العمر الحملي',
    'today.journeyBegan': 'رحلتكم بدأت ❤️',
    'today.ofDays': 'من 280 يومًا',
    'today.untilBirth': 'باقي على الولادة',
    'today.nextAppointment': 'الموعد القادم',
    'today.nextStage': 'المرحلة القادمة',
    'today.noAppointments': 'لا مواعيد قادمة',
    'today.whatToday': 'ماذا يحدث اليوم؟',
    'today.youToday': 'أنتِ اليوم',
    'today.thisWeek': 'هذا الأسبوع',

    'calendar.legend.week': 'بداية أسبوع',
    'calendar.legend.appointment': 'موعد',
    'calendar.legend.journal': 'يوميات',
    'calendar.legend.record': 'ملف',
    'calendar.legend.photo': 'صورة',
    'calendar.backToCalendar': '← عودة للتقويم',
    'calendar.outsidePregnancy': 'هذا اليوم خارج فترة الحمل المحسوبة.',

    'baby.milestones': 'المحطات ✓',
    'baby.questions': 'أسئلة للطبيب 💬',

    'appointments.title': 'المواعيد',
    'appointments.add': '+ إضافة موعد',
    'appointments.empty': 'لا مواعيد بعد',

    'journal.title': 'اليوميات',
    'journal.add': '+ تدوينة',
    'journal.empty': '"اليوم أشعر…"',

    'records.title': 'ملف الحمل',
    'records.subtitle': 'التحاليل والسونار والتقارير',
    'records.add': '+ إضافة',
    'records.empty': 'لا ملفات بعد',
    'records.tests': 'فحوصات الحمل 🧪',

    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.saving': 'جارٍ الحفظ…',
    'common.delete': 'حذف',
    'common.back': '← رجوع',
    'common.saveFailed': 'تعذّر الحفظ — تحقّقي من الاتصال وحاولي مرة أخرى.',
    'common.offline': 'تعذّر التحديث من الخادم — تعرضين نسخة محفوظة على الجهاز.',
  },

  en: {
    'nav.today': 'Today',
    'nav.calendar': 'Calendar',
    'nav.baby': 'Baby',
    'nav.appointments': 'Appointments',
    'nav.journal': 'Journal',
    'nav.records': 'Records',

    'today.label': 'Today',
    'today.gestationalAge': 'Gestational age',
    'today.journeyBegan': 'Your journey has begun ❤️',
    'today.ofDays': 'of 280 days',
    'today.untilBirth': 'Until birth',
    'today.nextAppointment': 'Next appointment',
    'today.nextStage': 'Next stage',
    'today.noAppointments': 'No upcoming appointments',
    'today.whatToday': 'What happens today?',
    'today.youToday': 'You today',
    'today.thisWeek': 'This week',

    'calendar.legend.week': 'Week start',
    'calendar.legend.appointment': 'Appointment',
    'calendar.legend.journal': 'Journal',
    'calendar.legend.record': 'Record',
    'calendar.legend.photo': 'Photo',
    'calendar.backToCalendar': '← Back to calendar',
    'calendar.outsidePregnancy': 'This day falls outside the calculated pregnancy.',

    'baby.milestones': 'Milestones ✓',
    'baby.questions': 'Questions for your doctor 💬',

    'appointments.title': 'Appointments',
    'appointments.add': '+ Add appointment',
    'appointments.empty': 'No appointments yet',

    'journal.title': 'Journal',
    'journal.add': '+ New entry',
    'journal.empty': '"Today I feel…"',

    'records.title': 'Pregnancy records',
    'records.subtitle': 'Tests, scans and reports',
    'records.add': '+ Add',
    'records.empty': 'No records yet',
    'records.tests': 'Antenatal tests 🧪',

    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.saving': 'Saving…',
    'common.delete': 'Delete',
    'common.back': '← Back',
    'common.saveFailed': 'Could not save — check your connection and try again.',
    'common.offline': 'Could not refresh — showing a copy saved on this device.',
  },
} as const;

export type Locale = keyof typeof STRINGS;
export type StringKey = keyof (typeof STRINGS)['ar'];
