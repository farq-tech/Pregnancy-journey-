# Pregnancy Journey Repository

_Started 2026-08-13 17:35 UTC_

---

## User

https://github.com/farq-tech/Pregnancy-journey-.git

## Assistant



## Assistant

_[tool: list_files]_

_[tool: github_get_tree]_

_[tool: github_list_repos]_

_[tool: ask_user]_

Waiting on your answers — then I'll build the prototype end-to-end with dynamic date calculations from LMP.

## User

Answered — device: جوال (iPhone frame); scope: Today (الرئيسية), التقويم اليومي, صفحة الأسبوع, Timeline التطور, المواعيد, اليوميات Journal, ملف الحمل Records, إعداد البيانات (Onboarding); illustration: Placeholders منظمة (baby-week-01…40) تُستبدل لاحقًا بصور مرخصة; baby_name: أمل /أحمد; lang: عربي فقط الآن; data_entry: شاشة إدخال تعمل فعليًا

## Assistant

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: list_files]_

_[tool: write_file]_

## Assistant

_[tool: run_script]_

_[tool: write_file]_

Design direction locked (Rubik Arabic, sage + warm sand palette, calm/premium). Now building the app.

_[tool: copy_starter_component]_

_[tool: dc_write]_

Now the remaining screens — calendar, day, week, timeline, appointments, journal, records:

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the add-forms (sheets) and logic additions for the computed fields:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

The prototype is out for review. What's included:

- **Onboarding** — LMP، طول الدورة، حالة الحمل، EDD override، أسماء اختيارية؛ كل الحسابات ديناميكية (EDD = LMP + 280 + تعديل الدورة)
- **Today** — عمر الحمل بالطريقة الطبية (أسابيع + أيام)، progress ring يوم X من 280، countdowns (الولادة، الموعد القادم، الأسبوع القادم، الثلث)، بطاقة "طفلك اليوم" مع image-slot للأسبوع، "أنتِ اليوم"
- **التقويم** — شهري قابل للتصفح مع نقاط (بداية أسبوع/موعد/يوميات/ملف)، وأي يوم من 1–280 يُفتح بتفاصيله + قسم "متى يجب التواصل مع الطبيب؟"
- **صفحة الأسبوع** — طفل/أم/فحوصات/محطات/فيديوهات (CMS مع مصدر ومؤلف وترخيص) + المصادر
- **طفلك** — Timeline من الأسبوع 4–40 + قائمة المحطات (لا تُعتبر مؤكدة بمرور التاريخ)
- **المواعيد، اليوميات، الملف** — إضافة/حذف/إنجاز، وسونار بـ EDD جديد يعيد بناء التقويم كاملًا مع إشعار

ملاحظات: صور الأجنة placeholders بأسماء منظمة (baby-week-04…40) — اسحبي صورك المرخصة عليها وستُحفظ. المحتوى الطبي أسبوعي المستوى في `pregnancy-data.js` منفصلًا عن الواجهة، بلغة "قد تشعر بعض النساء". يوجد Tweak لمعاينة أي تاريخ (demoDate). مستودع GitHub فارغ حاليًا — أخبريني إذا أردت ربطه لاحقًا.

