# رحلة الحمل — Pregnancy Journey

An Arabic, right-to-left iOS app that turns a last-menstrual-period date into a
day-by-day pregnancy journey: gestational age, week-by-week fetal development,
a browsable 280-day calendar, appointments with reminders, a journal, and a
medical records file with scan images and reports.

On top of that it is built to be three things at once, and every screen is
answerable to one of them:

- **متابعية** — a kick counter, a contraction timer, and weight / blood-pressure
  / blood-sugar tracking, so what she is asked to keep an eye on has somewhere
  to go.
- **تثقيفية** — a fact for every week, a glossary that makes her own scan report
  readable, nutrition and movement guidance per trimester, comfort measures per
  symptom, and myths answered with what the guidelines actually say.
- **عائلية** — one concrete thing the partner or the family can do each week,
  shared preparation lists, and letters that anyone in the household can sign.

Expo (SDK 57) + React Native + TypeScript, with Supabase for storage.
Built from the Claude Design prototype in `../project/Pregnancy Journey.dc.html`.

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
appearing empty. Every row and every uploaded file is scoped to `auth.uid()`, so
anonymous auth is what gives each install its own private data.

### Building a real iOS app

```bash
npx eas build --platform ios --profile preview
```

Bundle identifier `sa.farq.pregnancyjourney`. Photo-library and notification
permission strings are set in `app.json`. There is no `ios/` directory checked
in; Expo prebuilds it.

## Checks

```bash
npm test         # 90 unit tests
npm run typecheck
npx expo export --platform ios   # verifies the whole app bundles
```

All three pass. The date tests are also green under `TZ=Asia/Riyadh`,
`Europe/Berlin`, `America/Los_Angeles` and `Pacific/Kiritimati` (UTC+14).

---

## The calculation

Everything derives from `src/lib/pregnancy.ts`:

- **EDD** = LMP + 280 days, adjusted by `cycleLength − 28` (a longer cycle means
  later ovulation, so the due date moves out).
- **Gestational age** is measured from the LMP, medical-style — `3 أسابيع و4 أيام`,
  never "weeks since conception".
- **Day N of 280** counts *elapsed* days, so `dayNumber + daysLeft === 280` on
  every single day of the pregnancy. There is a test that walks all 281 days and
  asserts it.
- **An ultrasound that re-dates the pregnancy wins.** The new due date is stored
  and an *effective LMP* is back-derived as `EDD − 280`; day numbers, the current
  week, the calendar grid and every countdown are all measured from that, so
  recording a scan rebuilds the whole calendar consistently.

Worked example from the spec, covered by tests:

| LMP | Cycle | On 13 Aug 2026 | |
|---|---|---|---|
| 19 Jul 2026 | 28 days | EDD | **25 April 2027** |
| | | Day | **25 of 280** |
| | | Gestational age | **3 أسابيع و4 أيام**, الأسبوع الرابع |
| | | Remaining | **255 يومًا** |

## How it is put together

```
app/                     Screens (expo-router, file-based)
  onboarding.tsx         LMP / cycle / due-date entry — also the settings screen
  (tabs)/
    index.tsx            اليوم — glance widget, ring, countdowns, baby & mother
    calendar/            التقويم — month grid → day detail (nested stack)
    baby/                طفلك — week 4–40 timeline → week detail (nested stack)
    appointments.tsx     المواعيد — with reminders and repeat rules
    journal.tsx          اليوميات — mood, symptoms, weight, photos
    records.tsx          ملف الحمل — scans, reports, and antenatal test tracking
  track/                 المتابعة — hub, kick counter, contraction timer, readings
  learn/                 المكتبة — nutrition, movement, comfort, myths → glossary
  checklists/            قوائم التحضير — list index → one list with her own additions
  letters.tsx            رسائل — the family time capsule
src/
  lib/pregnancy.ts       Gestational-age maths (the heart of the app)
  lib/recurrence.ts      Expanding a repeat rule into real follow-up visits
  lib/kicks.ts           Kick sessions, and her own movement baseline
  lib/contractions.ts    Duration, frequency, and the 5-1-1 shape
  lib/weight.ts          IOM/ACOG gestational weight-gain bands
  lib/vitals.ts          Blood-pressure thresholds; glucose is stored, not scored
  lib/reminders.ts       Local notification scheduling
  lib/storage.ts         Uploads to the private media bucket
  lib/arabic.ts          Arabic pluralisation, ordinals, date formatting
  content/               Week 4–40 content, milestone rules, doctor questions,
                         weekly facts and family actions, glossary, checklists
  store/JourneyProvider  Loads and mutates all user data; offline read cache
  i18n/                  ar/en chrome strings
supabase/migrations/     The schema, as applied to the live project
```

The four tracking and learning sections push **over** the tab bar rather than
joining it. Two reasons: a seventh tab would not survive a 320pt screen in
Arabic, and a running kick count sitting above a live tab bar is a count waiting
to be lost to a stray tap. The Today screen carries a quick-action row so none of
them is more than one tap from the screen she opens every morning.

### Content architecture

Medical content is never inline in a component. `src/content/pregnancyData.ts`
holds the week 4–40 model — development, appearance, size, weight, mother
changes, symptoms, milestones, sources — and day views *derive* from the week
rather than duplicating it seven times. Daily screens present week-level facts as
week-level (`خلال هذا الأسبوع…`); no daily biological change is invented.

Every week carries `sources` referencing ACOG, NHS or Mayo Clinic, and the app
shows them with a `lastReviewed` date.

`src/content/education.ts`, `glossary.ts` and `checklists.ts` follow the same
rules: no invented numbers, anything case-dependent phrased as `قد` / `بحسب
الطبيب`, and myths listed only where ACOG, NHS and Mayo Clinic agree on the
correction. Anything genuinely debated — how much caffeine, when to induce — is
left to her clinician rather than settled by an app.

### Decisions worth knowing about

**Milestones are confirmation-driven, not date-driven.** A heartbeat is confirmed
by a sonographer, not by a calendar. `src/content/milestones.ts` classifies each
milestone: gestational-age facts ("37 weeks complete") land when the date does,
but anything scan-visible stays *expected* — "متوقع حول هذه المرحلة — يؤكده الطبيب
بالسونار" — until an ultrasound dated in that week or later is on file. A week-6
scan cannot tick off the week-20 anatomy scan; there is a test for exactly that.

**Right-to-left is authored, not toggled.** The layout engine is deliberately
left in its LTR base direction and every row is written as `row-reverse` with
`textAlign: 'right'`. Forcing `I18nManager.forceRTL` would mirror the layout a
second time on top of styles that are already mirrored, and it only takes effect
after an app reload.

**Dates are formatted from tables, not `Intl`.** Hermes' `Intl` support varies by
platform and engine build, and the failure mode is silent and severe — a Hijri
calendar or Arabic-Indic digits would change every date in the app.

**The tracking tools compare her to herself, with one deliberate exception.**
The kick counter reports "faster / similar / slower than *your* usual", never
against a population figure, because what a mother is actually asked to notice is
a change in her own baby's pattern. The contraction timer describes the pattern
("النمط يشبه 5-1-1") rather than instructing her. The exception is blood
pressure: 140/90 and 160/110 are published thresholds, and telling her a reading
crossed one is what gets pre-eclampsia seen in time — so `lib/vitals.ts` names the
threshold and points at her clinician. Blood sugar is stored and never scored;
its target ranges differ by country, protocol, and diagnosis, so any number the
app printed would be wrong for someone.

**Weight is one source of truth.** Weights logged in the journal have always been
there, so the weight curve merges journal entries with dedicated measurements
rather than starting her history over — a dedicated reading wins on a day that
has both. Height and pre-pregnancy weight are optional; without them the curve
still draws, it just has no band behind it.

**Editorial content ships in the bundle; only her own data is in Supabase.**
Week content is identical for every user and must read with no network. The
database holds only what she enters, and uploaded files live in a **private**
bucket reached through short-lived signed URLs — nothing about a scan image is
publicly addressable.

---

## Known gaps

Real and deliberate, not oversights:

- **Fetal illustrations are placeholders.** `assets/babyWeeks.ts` is the registry,
  typed to require alt text and a source for every image; `WeekIllustration`
  draws a designed placeholder until licensed artwork is dropped in. Ultrasound
  photographs are explicitly not used as illustrations.
- **Medical content is Arabic-only.** `src/i18n` covers the app chrome in Arabic
  and English and the switch works, but the week 4–40 copy is not translated:
  machine-translating reviewed clinical text would produce unsourced medical
  content in a second language, which is the one thing the content rules forbid.
  That is an editorial job with clinical review.
- **Writes require a connection.** Cached data reads offline and a banner says
  when it is stale, but a new entry saved with no network fails with an error
  rather than queueing. An offline write queue is the natural next piece of work.
- **Reminders are local notifications.** They fire on the device, which is the
  right privacy trade-off, but they do not survive a restore to a new phone until
  the app is opened once — `rescheduleAll` rebuilds them on launch. iOS also caps
  pending notifications at 64, so the soonest 60 are scheduled.
- **Letters and checklists are single-device, like everything else.** The family
  angle works by handing someone the phone, not by inviting them. Real
  multi-user sharing needs accounts first — see the anonymous-auth gap below.
- **The tracking tools have no reminders of their own.** Appointment reminders
  are scheduled; a nudge to count movements at her usual time is not. It is a
  natural follow-on from `lib/reminders.ts`, but it is a notification about a
  clinical habit, which deserves its own decision rather than being switched on
  by default.
- **Anonymous auth is per-device.** If she loses or replaces the phone, the
  journey does not follow her. Adding Sign in with Apple later would let an
  anonymous account be upgraded in place without losing any data.
- **`npm audit` reports advisories** in Expo's own build tooling. They are
  dev/build-time dependencies of the SDK; `npm audit fix --force` would downgrade
  Expo itself. They resolve on the next SDK release.
