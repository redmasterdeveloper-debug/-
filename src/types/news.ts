export const PRESET_CATEGORIES = [
  'آثار وتراث',
  'محليات',
  'مشاريع وإعمار',
  'رياضة',
  'أمن وخدمات',
  'اقتصاد وأسواق',
  'تعليم وصحة',
  'طقس ومناخ',
  'ثقافة وفنون',
  'تكنولوجيا',
  'عاجل وتقارير خاصة',
  'العطل الرسمية',
] as const;

export const HOLIDAY_CATEGORY_NAME = 'العطل الرسمية';

export const HOLIDAY_TYPES = [
  'أمطار',
  'مناسبة دينية',
  'مناسبة أخرى',
  'وفاة',
] as const;

export type HolidayType = (typeof HOLIDAY_TYPES)[number];

export const OCCASION_REQUIRED_HOLIDAY_TYPES: readonly HolidayType[] = [
  'مناسبة دينية',
  'مناسبة أخرى',
  'وفاة',
];

export const IRAQI_GOVERNORATES = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف',
  'كربلاء',
  'كركوك',
  'الأنبار',
  'ذي قار',
  'بابل',
  'ديالى',
  'واسط',
  'ميسان',
  'القادسية',
  'المثنى',
  'صلاح الدين',
  'دهوك',
  'السليمانية',
] as const;

export const ALL_IRAQ_OPTION = 'جميع أنحاء العراق';

export interface ArticleLink {
  title: string;
  url: string;
}

export type ActivePage = 'home' | 'news' | 'holidays' | 'admin';

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  authorName: string;
  content: string;
  imageUrl: string;
  links: ArticleLink[];
  holidayType: HolidayType | '';
  holidayOccasion: string;
  holidayGovernorates: string[];
  isPublished: boolean;
  createdAtMs: number;
}

/**
 * Volumetric & structural constraints synchronized verbatim with firebase-blueprint.json
 */
export const ARTICLE_CONSTRAINTS = {
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  CATEGORY_MIN: 2,
  CATEGORY_MAX: 60,
  AUTHOR_MIN: 2,
  AUTHOR_MAX: 100,
  CONTENT_MIN: 10,
  CONTENT_MAX: 15000,
  IMAGE_URL_MAX: 350000,
  LINK_TITLE_MIN: 1,
  LINK_TITLE_MAX: 120,
  LINK_URL_MIN: 8,
  LINK_URL_MAX: 1000,
  MAX_LINKS: 10,
  HOLIDAY_OCCASION_MIN: 2,
  HOLIDAY_OCCASION_MAX: 120,
  GOVERNORATE_MIN: 2,
  GOVERNORATE_MAX: 40,
  MAX_GOVERNORATES: 19,
} as const;

export const ADMIN_SECRET_CODE = 'URSKY2027';

export function isValidImageInput(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === '') return true;
  if (trimmed.length > ARTICLE_CONSTRAINTS.IMAGE_URL_MAX) return false;
  return (
    /^https:\/\/.+/.test(trimmed) ||
    /^http:\/\/.+/.test(trimmed) ||
    /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
  );
}

export function isValidExternalHttpUrl(url: string): boolean {
  const trimmed = url.trim();
  if (
    trimmed.length < ARTICLE_CONSTRAINTS.LINK_URL_MIN ||
    trimmed.length > ARTICLE_CONSTRAINTS.LINK_URL_MAX
  ) {
    return false;
  }
  return /^https?:\/\/.+/.test(trimmed);
}

export function requiresOccasionDetail(
  holidayType: HolidayType | ''
): boolean {
  return (
    holidayType !== '' &&
    OCCASION_REQUIRED_HOLIDAY_TYPES.includes(holidayType)
  );
}

export function formatGovernoratesSummary(govs: string[]): string {
  if (!govs || govs.length === 0) return '';
  if (govs.includes(ALL_IRAQ_OPTION)) return ALL_IRAQ_OPTION;
  if (govs.length <= 3) return govs.join('، ');
  return `${govs.slice(0, 2).join('، ')} و${govs.length - 2} محافظات أخرى`;
}

export function validateNewsDraft(input: {
  title: string;
  category: string;
  authorName: string;
  content: string;
  imageUrl: string;
  links: ArticleLink[];
  isHoliday: boolean;
  holidayType: HolidayType | '';
  holidayOccasion: string;
  holidayGovernorates: string[];
}): string | null {
  const title = input.title.trim();
  const category = input.category.trim();
  const authorName = input.authorName.trim();
  const content = input.content.trim();
  const imageUrl = input.imageUrl.trim();
  const holidayOccasion = input.holidayOccasion.trim();

  if (
    title.length < ARTICLE_CONSTRAINTS.TITLE_MIN ||
    title.length > ARTICLE_CONSTRAINTS.TITLE_MAX
  ) {
    return `يجب أن يكون عنوان الخبر بين ${ARTICLE_CONSTRAINTS.TITLE_MIN} و ${ARTICLE_CONSTRAINTS.TITLE_MAX} حرفاً.`;
  }

  if (
    category.length < ARTICLE_CONSTRAINTS.CATEGORY_MIN ||
    category.length > ARTICLE_CONSTRAINTS.CATEGORY_MAX
  ) {
    return `يجب أن يكون اسم القسم بين ${ARTICLE_CONSTRAINTS.CATEGORY_MIN} و ${ARTICLE_CONSTRAINTS.CATEGORY_MAX} حرفاً.`;
  }

  if (
    authorName.length < ARTICLE_CONSTRAINTS.AUTHOR_MIN ||
    authorName.length > ARTICLE_CONSTRAINTS.AUTHOR_MAX
  ) {
    return `يجب أن يكون اسم المحرر بين ${ARTICLE_CONSTRAINTS.AUTHOR_MIN} و ${ARTICLE_CONSTRAINTS.AUTHOR_MAX} حرفاً.`;
  }

  if (
    content.length < ARTICLE_CONSTRAINTS.CONTENT_MIN ||
    content.length > ARTICLE_CONSTRAINTS.CONTENT_MAX
  ) {
    return `يجب أن يكون نص الخبر بين ${ARTICLE_CONSTRAINTS.CONTENT_MIN} و ${ARTICLE_CONSTRAINTS.CONTENT_MAX} حرفاً.`;
  }

  if (!isValidImageInput(imageUrl)) {
    return 'رابط الصورة غير صالح أو يتجاوز الحجم المسموح. يرجى استخدام رابط https/http أو رفع صورة من الجهاز.';
  }

  if (input.links.length > ARTICLE_CONSTRAINTS.MAX_LINKS) {
    return `الحد الأقصى للروابط المرفقة هو ${ARTICLE_CONSTRAINTS.MAX_LINKS} روابط.`;
  }

  for (let i = 0; i < input.links.length; i += 1) {
    const linkTitle = input.links[i].title.trim();
    const linkUrl = input.links[i].url.trim();
    if (
      linkTitle.length < ARTICLE_CONSTRAINTS.LINK_TITLE_MIN ||
      linkTitle.length > ARTICLE_CONSTRAINTS.LINK_TITLE_MAX
    ) {
      return `يرجى كتابة عنوان صالح للرابط رقم ${i + 1} (بحد أقصى ${ARTICLE_CONSTRAINTS.LINK_TITLE_MAX} حرفاً).`;
    }
    if (!isValidExternalHttpUrl(linkUrl)) {
      return `الرابط رقم ${i + 1} غير صالح. يجب أن يبدأ بـ https:// أو http://`;
    }
  }

  if (input.isHoliday) {
    if (!input.holidayType || !HOLIDAY_TYPES.includes(input.holidayType)) {
      return 'يرجى تحديد سبب العطلة (أمطار، مناسبة دينية، مناسبة أخرى، أو وفاة).';
    }
    if (
      requiresOccasionDetail(input.holidayType) &&
      (holidayOccasion.length < ARTICLE_CONSTRAINTS.HOLIDAY_OCCASION_MIN ||
        holidayOccasion.length > ARTICLE_CONSTRAINTS.HOLIDAY_OCCASION_MAX)
    ) {
      return `يرجى كتابة اسم المناسبة (مثال: عيد الفطر) بين ${ARTICLE_CONSTRAINTS.HOLIDAY_OCCASION_MIN} و ${ARTICLE_CONSTRAINTS.HOLIDAY_OCCASION_MAX} حرفاً.`;
    }
    if (
      input.holidayGovernorates.length === 0 ||
      input.holidayGovernorates.length > ARTICLE_CONSTRAINTS.MAX_GOVERNORATES
    ) {
      return 'يرجى اختيار المحافظات المشمولة بالعطلة أو اختيار (جميع أنحاء العراق).';
    }
  }

  return null;
}

export function formatArabicDateTime(timestampMs: number): string {
  if (!timestampMs) return 'الآن';
  try {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toLocaleDateString('ar');
  }
}
