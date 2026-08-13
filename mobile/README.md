# رحلة الحمل — Pregnancy Journey

An Arabic, right-to-left iOS app that turns a last-menstrual-period date into a
day-by-day pregnancy calendar: gestational age, week-by-week fetal development,
appointments, a journal, and a medical records file.

Built from the Claude Design prototype in `../project/Pregnancy Journey.dc.html`.
Expo (SDK 57) + React Native + TypeScript, with Supabase for storage.

---

## Running it

```bash
npm install
npm start        # then press `i`, or scan the QR code with Expo Go on an iPhone
```

`.env` already points at the `pregnancy-journey` Supabase project
(`memewgpjbuurtrzcqgtu`, eu-central-1). Both values in it are publishable by
design — see the note in that file.

### One manual step before the app will work

**Anonymous sign-ins must be turned on** in the Supabase dashboard:

> Authentication → Sign In / Providers → **Anonymous sign-ins** → enable

This is off by default on a new project and cannot be set through the API. Until
it is on, the app shows an explicit error saying so rather than silently
appearing empty. Every row in the database is scoped to `auth.uid()`, so
anonymous auth is what gives each install its own private data.

### Building a real iOS app

```bash
npx eas build --platform ios --profile preview
```

Bundle identifier is `sa.farq.pregnancyjourney`. There is no `ios/` directory
checked in; Expo prebuilds it. Nothing here needs a Mac until you build.

## Checks

```bash
npm test         # 17 unit tests over the date/gestational-age maths
npm run typecheck
npx expo export --platform ios   # verifies the whole app bundles
```

All three pass.

---

## How it is put together

```
app/                     Screens (expo-router, file-based)
  _layout.tsx            Fonts, providers, root stack
  onboarding.tsx         LMP / cycle / due-date entry — also the settings screen
  (tabs)/
    _layout.tsx          Six tabs; redirects to onboarding when no LMP is saved
    index.tsx            اليوم — progress ring, countdowns, today's baby & mother
    calendar/            التقويم — month grid → day detail (nested stack)
    baby/                طفلك — week 4–40 timeline → week detail (nested stack)
    appointments.tsx     المواعيد
    journal.tsx          اليوميات
    records.tsx          ملف الحمل
src/
  lib/pregnancy.ts       Gestational-age maths (the heart of the app)
  lib/arabic.ts          Arabic pluralisation, ordinals, date formatting
  lib/dates.ts           Local-civil-date arithmetic
  lib/supabase.ts        Client + anonymous session bootstrap
  store/JourneyProvider  Loads and mutates all user data; offline read cache
  content/pregnancyData  Week 4–40 editorial content, ported from the prototype
  components/            Shared UI, all styled from `theme.ts`
supabase/migrations/     The schema, as applied to the live project
```

### Three decisions worth knowing about

**Right-to-left is authored, not toggled.** The layout engine is deliberately
left in its LTR base direction (`index.ts`) and every row is written as
`row-reverse` with `textAlign: 'right'`. Forcing `I18nManager.forceRTL` would
mirror the layout a second time on top of styles that are already mirrored, and
it only takes effect after an app reload — a classic source of "it looks right
on my phone and wrong on hers". Arabic text still shapes and orders correctly;
that is the Unicode bidi algorithm, not `I18nManager`.

**Dates are formatted from tables, not `Intl`.** The prototype asked for
`Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn')`. Hermes' `Intl` support
varies by platform and engine build, and the failure mode is silent and severe —
a Hijri calendar or Arabic-Indic digits would change every date in the app. The
month and weekday names are spelled out in `src/lib/arabic.ts` instead.

**Editorial content ships in the bundle; only her own data is in Supabase.**
Week 4–40 copy is identical for every user and must be readable with no network,
so it lives in `src/content/pregnancyData.ts`. The database holds only what she
enters: profile, appointments, journal, records, videos.

### The due-date rule

Everything derives from one calculation, in `src/lib/pregnancy.ts`:

- Due date = LMP + 280 days, adjusted by `cycleLength − 28` (a longer cycle means
  later ovulation, so the due date moves out).
- If a dating ultrasound sets a due date, that wins, and an **effective LMP** is
  back-derived as `dueDate − 280`. Everything else — day N of 280, which week she
  is in, the calendar dots — is measured from that, so recording a scan rebuilds
  the entire calendar consistently. This is covered by tests.

---

## Known gaps

These are real and deliberate, not oversights:

- **Fetal illustrations are placeholders.** `assets/babyWeeks.ts` is an empty
  registry with instructions; `WeekIllustration` draws a designed placeholder
  carrying the week number until licensed artwork is dropped in. The prototype's
  `<image-slot id="baby-week-NN">` elements were always intended to be replaced
  with licensed images later.
- **Appointment reminders are stored, not delivered.** The reminder offset is
  saved and displayed, but no local notification is scheduled — that needs
  `expo-notifications` and a permissions flow.
- **Writes require a connection.** Cached data is readable offline and a banner
  says when it is stale, but a new entry saved with no network fails with an
  error instead of queueing. A write queue is the natural next piece of work.
- **Anonymous auth is per-device.** If she loses or replaces the phone, the
  journey does not follow her. Adding Sign in with Apple later would let an
  anonymous account be upgraded in place without losing any data.
- **`npm audit` reports advisories** in Expo's own build tooling
  (`@expo/config-plugins` and friends). They are dev/build-time dependencies of
  the SDK; `npm audit fix --force` would downgrade Expo itself and break the
  project. They resolve on the next SDK release.
