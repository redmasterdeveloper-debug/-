export const NEWS_CATEGORIES = [
  'آثار وتراث',
  'محليات',
  'مشاريع وإعمار',
  'رياضة',
  'أمن وخدمات',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type FilterCategory = 'الكل' | NewsCategory;

export const FILTER_CATEGORIES: readonly FilterCategory[] = [
  'الكل',
  ...NEWS_CATEGORIES,
];

export type ActivePage = 'home' | 'news' | 'admin';

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  authorName: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
  createdAtMs: number;
}

/**
 * Volumetric & structural constraints synchronized verbatim with firebase-blueprint.json
 */
export const ARTICLE_CONSTRAINTS = {
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  AUTHOR_MIN: 2,
  AUTHOR_MAX: 100,
  CONTENT_MIN: 10,
  CONTENT_MAX: 15000,
  IMAGE_URL_MAX: 350000,
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

export function validateNewsDraft(input: {
  title: string;
  category: string;
  authorName: string;
  content: string;
  imageUrl: string;
}): string | null {
  const title = input.title.trim();
  const authorName = input.authorName.trim();
  const content = input.content.trim();
  const imageUrl = input.imageUrl.trim();

  if (
    title.length < ARTICLE_CONSTRAINTS.TITLE_MIN ||
    title.length > ARTICLE_CONSTRAINTS.TITLE_MAX
  ) {
    return `يجب أن يكون عنوان الخبر بين ${ARTICLE_CONSTRAINTS.TITLE_MIN} و ${ARTICLE_CONSTRAINTS.TITLE_MAX} حرفاً.`;
  }

  if (!NEWS_CATEGORIES.includes(input.category as NewsCategory)) {
    return 'يرجى اختيار تصنيف صالح من القائمة.';
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
