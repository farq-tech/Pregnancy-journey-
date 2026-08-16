/**
 * قوائم التحضير — the practical half of the journey.
 *
 * These are preparation lists, not medical instructions: what to pack, what to
 * discuss, what to buy, what to ask. Ticking an item is progress she can see,
 * which is the point — a pregnancy is nine months of waiting with very few
 * things a person can actually *finish*.
 *
 * The curated items ship in the app (offline, identical for everyone); her own
 * additions and her tick state live in `checklist_items` in Supabase.
 *
 * `openFrom` is when the list becomes relevant, so the app can suggest the
 * right list at the right time rather than showing all five from week four.
 */

export type ChecklistItem = {
  id: string;
  label: string;
  note?: string;
};

export type ChecklistSection = {
  title: string;
  items: readonly ChecklistItem[];
};

export type Checklist = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  /** Gestational week from which this list is worth opening. */
  openFrom: number;
  sections: readonly ChecklistSection[];
};

export const CHECKLISTS: readonly Checklist[] = [
  {
    id: 'visit',
    title: 'تحضير زيارة الطبيب',
    subtitle: 'ما تأخذينه معك وما تسألين عنه',
    emoji: '🩺',
    openFrom: 4,
    sections: [
      {
        title: 'قبل الخروج',
        items: [
          { id: 'id', label: 'الهوية وبطاقة التأمين' },
          { id: 'file', label: 'ملف الحمل والتقارير السابقة', note: 'صور التقارير في التطبيق تكفي غالبًا' },
          { id: 'meds', label: 'قائمة الأدوية والمكمّلات التي تستخدمينها' },
          { id: 'questions', label: 'أسئلتك مكتوبة', note: 'الأسئلة تُنسى داخل العيادة' },
          { id: 'water', label: 'ماء ووجبة خفيفة للانتظار' },
        ],
      },
      {
        title: 'بعد الزيارة',
        items: [
          { id: 'record', label: 'أضيفي نتيجة الزيارة إلى ملف الحمل' },
          { id: 'next', label: 'احجزي الموعد القادم قبل المغادرة' },
          { id: 'share', label: 'شاركي الخلاصة مع شريكك' },
        ],
      },
    ],
  },
  {
    id: 'hospital-bag',
    title: 'حقيبة المستشفى',
    subtitle: 'جهّزيها قبل الأسبوع 36',
    emoji: '🧳',
    openFrom: 28,
    sections: [
      {
        title: 'للأم',
        items: [
          { id: 'docs', label: 'الهوية، التأمين، ملف الحمل' },
          { id: 'gown', label: 'قميص نوم أمامي الفتح ورداء' },
          { id: 'underwear', label: 'ملابس داخلية مريحة وفوط ما بعد الولادة' },
          { id: 'bra', label: 'حمالة صدر للرضاعة' },
          { id: 'slippers', label: 'شبشب ومناشف' },
          { id: 'toiletries', label: 'أدوات نظافة شخصية' },
          { id: 'charger', label: 'شاحن طويل', note: 'المقابس بعيدة عن السرير عادةً' },
          { id: 'snacks', label: 'وجبات خفيفة ومشروب' },
          { id: 'going-home', label: 'ملابس الخروج — مقاس الشهر السادس تقريبًا' },
        ],
      },
      {
        title: 'للمولود',
        items: [
          { id: 'clothes', label: 'ملابس مواليد (٢–٣ أطقم)' },
          { id: 'swaddle', label: 'قماط وبطانية خفيفة' },
          { id: 'diapers', label: 'حفاضات مواليد ومناديل' },
          { id: 'hat', label: 'قبعة وجوارب' },
          { id: 'carseat', label: 'مقعد السيارة مركّب ومجرّب', note: 'كثير من المستشفيات لا تسمح بالخروج بدونه' },
        ],
      },
      {
        title: 'للمرافق',
        items: [
          { id: 'change', label: 'ملابس تبديل ومستلزمات شخصية' },
          { id: 'cash', label: 'نقود صغيرة ووسيلة دفع' },
          { id: 'pillow', label: 'وسادة — الانتظار قد يطول' },
        ],
      },
    ],
  },
  {
    id: 'birth-plan',
    title: 'خطة الولادة',
    subtitle: 'نقاط للنقاش مع طبيبك — لا قرارات نهائية',
    emoji: '📝',
    openFrom: 30,
    sections: [
      {
        title: 'أثناء المخاض',
        items: [
          { id: 'companion', label: 'من ترغبين بحضوره معك' },
          { id: 'environment', label: 'تفضيلاتك في الإضاءة والصوت والحركة' },
          { id: 'pain', label: 'ناقشي خيارات تخفيف الألم المتاحة ومتى تُطلب' },
          { id: 'monitoring', label: 'اسألي عن نوع المتابعة المستخدمة في المستشفى' },
        ],
      },
      {
        title: 'عند الولادة',
        items: [
          { id: 'position', label: 'الوضعيات المتاحة في مستشفاك' },
          { id: 'skin', label: 'التلامس الجلدي المبكر إن كان ممكنًا' },
          { id: 'cord', label: 'اسألي عن توقيت قطع الحبل السري' },
          { id: 'cs', label: 'ماذا يحدث إذا احتاجت الحالة لقيصرية' },
        ],
      },
      {
        title: 'بعد الولادة',
        items: [
          { id: 'feeding', label: 'خطة الرضاعة والدعم المتاح' },
          { id: 'stay', label: 'مدة البقاء المتوقعة' },
          { id: 'newborn', label: 'فحوصات المولود المعتادة في بلدك' },
          { id: 'visitors', label: 'سياسة الزيارة وما تفضلينه' },
        ],
      },
    ],
  },
  {
    id: 'baby-essentials',
    title: 'مستلزمات المولود',
    subtitle: 'الأساسيات أولًا — الباقي يُشترى لاحقًا',
    emoji: '🧸',
    openFrom: 24,
    sections: [
      {
        title: 'النوم',
        items: [
          { id: 'crib', label: 'سرير أو مهد بمرتبة محكمة' },
          { id: 'sheets', label: 'ملاءات قطنية (٢–٣)' },
          { id: 'sleepwear', label: 'ملابس نوم بمقاسات متدرجة' },
        ],
      },
      {
        title: 'التغيير والاستحمام',
        items: [
          { id: 'diapers', label: 'حفاضات مقاس مواليد ومقاس أكبر' },
          { id: 'wipes', label: 'مناديل مبللة وكريم تسليخ' },
          { id: 'bath', label: 'بانيو صغير ومناشف بغطاء رأس' },
          { id: 'nail', label: 'مقص أظافر للأطفال' },
        ],
      },
      {
        title: 'التغذية',
        items: [
          { id: 'burp', label: 'فوط تجشؤ' },
          { id: 'pump', label: 'شفاط حليب إن كان في خطتك' },
          { id: 'bottles', label: 'رضّاعات وفرشاة تنظيف' },
        ],
      },
      {
        title: 'التنقل',
        items: [
          { id: 'carseat', label: 'مقعد سيارة مطابق للمواصفات' },
          { id: 'stroller', label: 'عربة مناسبة للمواليد' },
          { id: 'carrier', label: 'حمّالة أطفال داعمة للرقبة' },
        ],
      },
    ],
  },
  {
    id: 'fourth-trimester',
    title: 'ما بعد الولادة',
    subtitle: 'الأسابيع الأولى تُخطَّط قبلها لا بعدها',
    emoji: '🌙',
    openFrom: 32,
    sections: [
      {
        title: 'البيت',
        items: [
          { id: 'meals', label: 'وجبات مجمّدة تكفي أسبوعين' },
          { id: 'supplies', label: 'مخزون من مستلزمات البيت الأساسية' },
          { id: 'help', label: 'اتفقا على من سيساعد وفي أي أيام' },
          { id: 'visitors', label: 'خطة للزيارات — عدد ومدة وتوقيت' },
        ],
      },
      {
        title: 'الأم',
        items: [
          { id: 'postpartum-visit', label: 'موعد متابعة ما بعد الولادة' },
          { id: 'recovery', label: 'مستلزمات التعافي بحسب نوع الولادة' },
          { id: 'mood', label: 'اعرفا معًا علامات اكتئاب ما بعد الولادة', note: 'المعرفة المسبقة تجعل طلب المساعدة أسرع' },
          { id: 'rest', label: 'خطة نوم بالتناوب' },
        ],
      },
      {
        title: 'المولود',
        items: [
          { id: 'pediatrician', label: 'اختيار طبيب أطفال وحجز أول زيارة' },
          { id: 'vaccines', label: 'جدول التطعيمات في بلدك' },
          { id: 'papers', label: 'أوراق الميلاد والتسجيل الرسمي' },
        ],
      },
    ],
  },
];

export function checklistById(id: string): Checklist | undefined {
  return CHECKLISTS.find((list) => list.id === id);
}

/** Every curated item id in a list, in display order. */
export function itemsOf(list: Checklist): ChecklistItem[] {
  return list.sections.flatMap((section) => section.items);
}

/** The list the app should nudge her towards at a given week, if any. */
export function suggestedChecklist(week: number): Checklist | undefined {
  return [...CHECKLISTS]
    .filter((list) => week >= list.openFrom)
    .sort((a, b) => b.openFrom - a.openFrom)[0];
}
