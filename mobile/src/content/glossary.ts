/**
 * قاموس المصطلحات — the words that appear on her own reports.
 *
 * This exists for one reason: a mother is handed an ultrasound printout that
 * says `CRL 24mm · FHR 158 · AFI 12` and has no way to read her own record.
 * Explaining the vocabulary is education, not diagnosis — so each entry says
 * what the term *is*, never what a particular value *means* for her.
 *
 * `week` ties a term to the point in the journey where she is most likely to
 * first meet it, so the week screen can surface the two or three terms she is
 * about to hear rather than a wall of thirty.
 */

export type GlossaryTerm = {
  id: string;
  /** Arabic name. */
  term: string;
  /** The abbreviation or English name as it is printed on reports. */
  en: string;
  /** Plain-language explanation. Describes the measure, never interprets it. */
  meaning: string;
  /** Gestational week this term usually first comes up. */
  week: number;
  category: 'سونار' | 'تحاليل' | 'متابعة' | 'ولادة';
};

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    id: 'lmp',
    term: 'أول يوم في آخر دورة',
    en: 'LMP — Last Menstrual Period',
    meaning:
      'التاريخ الذي يُحسب منه عمر الحمل طبيًا. يسبق الإخصاب بأسبوعين تقريبًا، ولهذا يبدأ العدّ قبل حدوث الحمل فعليًا.',
    week: 4,
    category: 'متابعة',
  },
  {
    id: 'ga',
    term: 'عمر الحمل',
    en: 'GA — Gestational Age',
    meaning: 'عدد الأسابيع والأيام منذ أول يوم في آخر دورة، ويُكتب مثل "14w 3d".',
    week: 4,
    category: 'متابعة',
  },
  {
    id: 'edd',
    term: 'الموعد المتوقع للولادة',
    en: 'EDD — Estimated Due Date',
    meaning:
      'تقدير لتاريخ اكتمال 40 أسبوعًا. تقدير إحصائي وليس موعدًا نهائيًا؛ قد يُعدَّل بعد سونار الثلث الأول.',
    week: 4,
    category: 'متابعة',
  },
  {
    id: 'hcg',
    term: 'هرمون الحمل',
    en: 'hCG',
    meaning:
      'الهرمون الذي تكشفه اختبارات الحمل. قد يُطلب قياسه في الدم في المراحل المبكرة لمتابعة تطور الحمل.',
    week: 4,
    category: 'تحاليل',
  },
  {
    id: 'sac',
    term: 'كيس الحمل',
    en: 'GS — Gestational Sac',
    meaning: 'أول ما يظهر في السونار المبكر: التجويف الذي ينمو داخله الجنين.',
    week: 5,
    category: 'سونار',
  },
  {
    id: 'yolk',
    term: 'كيس المح',
    en: 'YS — Yolk Sac',
    meaning: 'كيس صغير يغذي الجنين قبل اكتمال المشيمة، ويظهر داخل كيس الحمل في السونار المبكر.',
    week: 6,
    category: 'سونار',
  },
  {
    id: 'fhr',
    term: 'نبض الجنين',
    en: 'FHR — Fetal Heart Rate',
    meaning: 'عدد نبضات قلب الجنين في الدقيقة كما قِيست في اللحظة نفسها. يتغير بحسب المرحلة ونشاط الجنين.',
    week: 6,
    category: 'سونار',
  },
  {
    id: 'crl',
    term: 'طول الرأس المقعدي',
    en: 'CRL — Crown-Rump Length',
    meaning:
      'المسافة من أعلى الرأس إلى المقعدة. أدق مقياس لتحديد عمر الحمل في الثلث الأول، ومنه قد يُعاد ضبط موعد الولادة.',
    week: 7,
    category: 'سونار',
  },
  {
    id: 'cbc',
    term: 'صورة الدم الكاملة',
    en: 'CBC — Complete Blood Count',
    meaning: 'تحليل روتيني يشمل الهيموغلوبين وكريات الدم، ويُطلب عادةً في الزيارة الأولى ثم يُعاد لاحقًا.',
    week: 8,
    category: 'تحاليل',
  },
  {
    id: 'rh',
    term: 'العامل الرايزيسي',
    en: 'Rh Factor',
    meaning:
      'صفة في فصيلة الدم (موجب أو سالب). إذا كانت الأم سالبة والأب موجبًا، يناقش الطبيب خطة متابعة خاصة.',
    week: 8,
    category: 'تحاليل',
  },
  {
    id: 'nt',
    term: 'الشفافية القفوية',
    en: 'NT — Nuchal Translucency',
    meaning:
      'قياس سمك سائل خلف رقبة الجنين بالسونار بين الأسبوع 11 و14، ويُستخدم ضمن فحص مبكر احتمالي — ليس تشخيصًا.',
    week: 11,
    category: 'سونار',
  },
  {
    id: 'nipt',
    term: 'الفحص الجيني غير الباضع',
    en: 'NIPT — Non-Invasive Prenatal Testing',
    meaning:
      'تحليل دم للأم يقيس شظايا من الحمض النووي للجنين. فحص احتمالي اختياري، ونتيجته المرتفعة تُتبع بفحص تشخيصي.',
    week: 10,
    category: 'تحاليل',
  },
  {
    id: 'doppler',
    term: 'الدوبلر',
    en: 'Doppler',
    meaning: 'جهاز يستخدم الموجات الصوتية لسماع نبض الجنين، ويُستخدم روتينيًا في العيادة.',
    week: 12,
    category: 'متابعة',
  },
  {
    id: 'anatomy',
    term: 'سونار التشوهات',
    en: 'Anatomy Scan',
    meaning:
      'فحص تفصيلي بين الأسبوع 18 و22 يراجع أعضاء الجنين ونموه والمشيمة وكمية السائل.',
    week: 18,
    category: 'سونار',
  },
  {
    id: 'bpd',
    term: 'القطر الجداري',
    en: 'BPD — Biparietal Diameter',
    meaning: 'عرض رأس الجنين بين العظمين الجداريين، أحد قياسات تقدير النمو.',
    week: 18,
    category: 'سونار',
  },
  {
    id: 'ac',
    term: 'محيط البطن',
    en: 'AC — Abdominal Circumference',
    meaning: 'محيط بطن الجنين، من أهم القياسات في تقدير الوزن ومتابعة النمو.',
    week: 18,
    category: 'سونار',
  },
  {
    id: 'fl',
    term: 'طول عظمة الفخذ',
    en: 'FL — Femur Length',
    meaning: 'طول أطول عظمة في الجسم، ويُستخدم مع بقية القياسات في تقدير عمر الحمل والنمو.',
    week: 18,
    category: 'سونار',
  },
  {
    id: 'efw',
    term: 'الوزن التقديري',
    en: 'EFW — Estimated Fetal Weight',
    meaning: 'وزن يُحسب من قياسات السونار بمعادلة. تقدير له هامش خطأ، وليس وزنًا مقيسًا.',
    week: 20,
    category: 'سونار',
  },
  {
    id: 'placenta',
    term: 'موضع المشيمة',
    en: 'Placental Position',
    meaning:
      'مكان التصاق المشيمة بجدار الرحم. يُذكر في تقرير السونار، وقد يتغير موضعه النسبي مع نمو الرحم.',
    week: 20,
    category: 'سونار',
  },
  {
    id: 'afi',
    term: 'مؤشر السائل الأمنيوسي',
    en: 'AFI — Amniotic Fluid Index',
    meaning: 'تقدير لكمية السائل المحيط بالجنين، يُقاس بالسونار ضمن متابعة النمو.',
    week: 24,
    category: 'سونار',
  },
  {
    id: 'ogtt',
    term: 'فحص سكر الحمل',
    en: 'OGTT / GCT — Glucose Tolerance Test',
    meaning:
      'فحص يُجرى عادةً بين الأسبوع 24 و28 بشرب محلول سكري وقياس السكر بعده. البروتوكول يختلف بين البلدان.',
    week: 24,
    category: 'تحاليل',
  },
  {
    id: 'fundal',
    term: 'ارتفاع قاع الرحم',
    en: 'Fundal Height',
    meaning: 'المسافة من عظمة العانة إلى أعلى الرحم بالسنتيمتر، تُقاس في الزيارات كمؤشر تقريبي للنمو.',
    week: 24,
    category: 'متابعة',
  },
  {
    id: 'braxton',
    term: 'انقباضات براكستون هيكس',
    en: 'Braxton Hicks',
    meaning:
      'انقباضات تدريبية غير منتظمة لا تزداد قوة ولا تقارُبًا مع الوقت، وتختلف عن انقباضات المخاض الحقيقي.',
    week: 26,
    category: 'ولادة',
  },
  {
    id: 'presentation',
    term: 'وضعية الجنين',
    en: 'Presentation',
    meaning:
      'اتجاه الجنين داخل الرحم: رأسي (Cephalic)، مقعدي (Breech)، أو عرضي. يُذكر في السونار وقد يتغير حتى أسابيع متأخرة.',
    week: 30,
    category: 'ولادة',
  },
  {
    id: 'nst',
    term: 'اختبار عدم الإجهاد',
    en: 'NST — Non-Stress Test',
    meaning: 'تسجيل لنبض الجنين مع حركته لمدة قصيرة، يُطلب أحيانًا في المتابعة المتقدمة.',
    week: 32,
    category: 'متابعة',
  },
  {
    id: 'gbs',
    term: 'مسحة GBS',
    en: 'GBS — Group B Streptococcus',
    meaning:
      'مسحة تُؤخذ عادةً بين الأسبوع 36 و38 للكشف عن بكتيريا قد توجد طبيعيًا، ونتيجتها تحدد خطة الولادة في بعض البروتوكولات.',
    week: 36,
    category: 'تحاليل',
  },
  {
    id: 'effacement',
    term: 'ترقّق عنق الرحم',
    en: 'Effacement',
    meaning: 'قِصَر عنق الرحم وترققه استعدادًا للولادة، ويُذكر كنسبة مئوية.',
    week: 37,
    category: 'ولادة',
  },
  {
    id: 'dilation',
    term: 'اتساع عنق الرحم',
    en: 'Dilation',
    meaning: 'اتساع فتحة عنق الرحم بالسنتيمتر، من صفر حتى عشرة عند اكتمال المرحلة الأولى من المخاض.',
    week: 37,
    category: 'ولادة',
  },
  {
    id: 'mucus-plug',
    term: 'السدادة المخاطية',
    en: 'Mucus Plug',
    meaning:
      'مخاط يسد عنق الرحم طوال الحمل وقد ينزل قبل المخاض بأيام أو ساعات. نزوله ليس بحد ذاته بداية مخاض.',
    week: 37,
    category: 'ولادة',
  },
  {
    id: 'rom',
    term: 'نزول ماء الرأس',
    en: 'ROM — Rupture of Membranes',
    meaning: 'انفجار الكيس الأمنيوسي وخروج السائل. سبب للتواصل مع الطبيب في حينه بغض النظر عن الانقباضات.',
    week: 37,
    category: 'ولادة',
  },
  {
    id: 'colostrum',
    term: 'اللبأ',
    en: 'Colostrum',
    meaning:
      'أول حليب يُفرَز، غالبًا مائل للصفرة وغني بالأجسام المضادة. قد يبدأ الثدي بإفرازه قبل الولادة.',
    week: 38,
    category: 'ولادة',
  },
  {
    id: 'apgar',
    term: 'مقياس أبغار',
    en: 'Apgar Score',
    meaning:
      'تقييم سريع لحالة المولود في الدقيقة الأولى والخامسة بعد الولادة، من صفر إلى عشرة.',
    week: 40,
    category: 'ولادة',
  },
];

export const GLOSSARY_CATEGORIES = ['سونار', 'تحاليل', 'متابعة', 'ولادة'] as const;

/**
 * The handful of terms she is most likely to meet around a given week: anything
 * introduced in the four weeks up to and including this one.
 */
export function glossaryForWeek(week: number, span = 4): GlossaryTerm[] {
  return GLOSSARY.filter((term) => term.week <= week && term.week > week - span);
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...GLOSSARY];
  return GLOSSARY.filter(
    (term) =>
      term.term.includes(q) ||
      term.en.toLowerCase().includes(q) ||
      term.meaning.includes(q),
  );
}
