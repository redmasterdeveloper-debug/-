import React, { useRef, useState } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  Lock,
  MapPin,
  Plus,
  PlusCircle,
  Trash2,
  Upload,
} from 'lucide-react';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  ALL_IRAQ_OPTION,
  ARTICLE_CONSTRAINTS,
  ArticleLink,
  HOLIDAY_CATEGORY_NAME,
  HOLIDAY_TYPES,
  HolidayType,
  IRAQI_GOVERNORATES,
  NewsArticle,
  PRESET_CATEGORIES,
  formatArabicDateTime,
  formatGovernoratesSummary,
  requiresOccasionDetail,
  validateNewsDraft,
} from '../types/news';

interface AdminDashboardProps {
  isAdminVerified: boolean;
  adminCode: string;
  articles: NewsArticle[];
  onRequestUnlock: () => void;
  onLockAdmin: () => void;
}

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح.'));
      img.onload = () => {
        const maxWidth = 1000;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة في المتصفح.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        let quality = 0.8;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (
          dataUrl.length > ARTICLE_CONSTRAINTS.IMAGE_URL_MAX &&
          quality > 0.35
        ) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > ARTICLE_CONSTRAINTS.IMAGE_URL_MAX) {
          reject(
            new Error(
              'حجم الصورة كبير جداً حتى بعد الضغط. يرجى اختيار صورة أصغر أو وضع رابط صورة.'
            )
          );
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdminVerified,
  adminCode,
  articles,
  onRequestUnlock,
  onLockAdmin,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(PRESET_CATEGORIES[1]);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Official Holiday Fields
  const [holidayType, setHolidayType] = useState<HolidayType | ''>('');
  const [holidayOccasion, setHolidayOccasion] = useState('');
  const [holidayGovernorates, setHolidayGovernorates] = useState<string[]>([]);

  // External Links Repeater
  const [links, setLinks] = useState<ArticleLink[]>([]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdminVerified || !adminCode) {
    return (
      <section className="glass-surface rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#683424]/60 border border-[#f6f3db]/20 flex items-center justify-center mx-auto mb-5 text-[#f6f3db]">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="font-heading font-extrabold text-2xl text-[#f6f3db] mb-3">
          منطقة محمية للإدارة والتحرير
        </h1>
        <p className="text-sm text-[#f6f3db]/75 leading-relaxed mb-6">
          لا يمكن فتح لوحة الإدارة إلا بعد إدخال الكود السري المخصص للإدارة.
        </p>
        <button
          type="button"
          onClick={onRequestUnlock}
          className="px-6 py-3 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-extrabold text-sm hover:bg-[#f6f3db]/90 transition-colors cursor-pointer"
        >
          أدخل الكود السري
        </button>
      </section>
    );
  }

  const effectiveCategory =
    customCategoryText.trim() !== '' ? customCategoryText.trim() : category;
  const isHolidaySelected = effectiveCategory === HOLIDAY_CATEGORY_NAME;

  const handleSelectPresetCategory = (preset: string): void => {
    setCategory(preset);
    setCustomCategoryText('');
    if (preset !== HOLIDAY_CATEGORY_NAME) {
      setHolidayType('');
      setHolidayOccasion('');
      setHolidayGovernorates([]);
    }
  };

  const handleCustomCategoryChange = (value: string): void => {
    setCustomCategoryText(value);
    if (value.trim() !== HOLIDAY_CATEGORY_NAME) {
      setHolidayType('');
      setHolidayOccasion('');
      setHolidayGovernorates([]);
    }
  };

  const handleToggleGovernorate = (gov: string): void => {
    setHolidayGovernorates((prev) => {
      const withoutAllIraq = prev.filter((item) => item !== ALL_IRAQ_OPTION);
      if (withoutAllIraq.includes(gov)) {
        return withoutAllIraq.filter((item) => item !== gov);
      }
      return [...withoutAllIraq, gov];
    });
  };

  const handleSelectAllIraq = (): void => {
    setHolidayGovernorates((prev) =>
      prev.includes(ALL_IRAQ_OPTION) ? [] : [ALL_IRAQ_OPTION]
    );
  };

  const handleAddLink = (): void => {
    if (links.length >= ARTICLE_CONSTRAINTS.MAX_LINKS) return;
    setLinks((prev) => [...prev, { title: '', url: '' }]);
  };

  const handleUpdateLink = (
    index: number,
    field: keyof ArticleLink,
    value: string
  ): void => {
    setLinks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveLink = (index: number): void => {
    setLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    try {
      const compressed = await compressImageToDataUrl(file);
      setImageUrl(compressed);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'تعذر تحميل الصورة المختارة.'
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePublish = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    setPublishSuccess(null);

    const cleanedLinks = links
      .filter((l) => l.title.trim() !== '' || l.url.trim() !== '')
      .map((l) => ({ title: l.title.trim(), url: l.url.trim() }));

    const resolvedHolidayType = isHolidaySelected ? holidayType : '';
    const resolvedHolidayOccasion =
      isHolidaySelected && requiresOccasionDetail(resolvedHolidayType)
        ? holidayOccasion.trim()
        : '';
    const resolvedHolidayGovernorates = isHolidaySelected
      ? holidayGovernorates
      : [];

    const validationError = validateNewsDraft({
      title,
      category: effectiveCategory,
      authorName,
      content,
      imageUrl,
      links: cleanedLinks,
      isHoliday: isHolidaySelected,
      holidayType: resolvedHolidayType,
      holidayOccasion: resolvedHolidayOccasion,
      holidayGovernorates: resolvedHolidayGovernorates,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsPublishing(true);
    try {
      const newsRef = doc(collection(db, 'news'));
      const tokenRef = doc(db, 'admin_tokens', `create_${newsRef.id}`);
      const batch = writeBatch(db);

      batch.set(newsRef, {
        title: title.trim(),
        category: effectiveCategory,
        authorName: authorName.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim(),
        links: cleanedLinks,
        holidayType: resolvedHolidayType,
        holidayOccasion: resolvedHolidayOccasion,
        holidayGovernorates: resolvedHolidayGovernorates,
        isPublished: true,
        createdAt: serverTimestamp(),
      });

      batch.set(tokenRef, {
        code: adminCode,
        articleId: newsRef.id,
        action: 'create',
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      setTitle('');
      setContent('');
      setImageUrl('');
      setLinks([]);
      setHolidayType('');
      setHolidayOccasion('');
      setHolidayGovernorates([]);
      setPublishSuccess('تم نشر الخبر بنجاح وحفظه في قاعدة البيانات.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'news');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteArticle = async (articleId: string): Promise<void> => {
    setDeletingId(articleId);
    try {
      const newsRef = doc(db, 'news', articleId);
      const tokenRef = doc(db, 'admin_tokens', `delete_${articleId}`);
      const batch = writeBatch(db);

      batch.set(tokenRef, {
        code: adminCode,
        articleId,
        action: 'delete',
        createdAt: serverTimestamp(),
      });
      batch.delete(newsRef);

      await batch.commit();
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `news/${articleId}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Publish Form */}
      <section className="lg:col-span-7 glass-surface rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-[#f6f3db]/12">
          <div>
            <p className="text-xs font-heading font-bold text-[#b87333] mb-1">
              غرفة الأخبار والتحرير
            </p>
            <h1 className="font-heading font-extrabold text-2xl text-[#f6f3db]">
              إضافة ونشر خبر جديد
            </h1>
          </div>
          <button
            type="button"
            onClick={onLockAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#683424]/60 hover:bg-[#683424] border border-[#f6f3db]/18 text-xs font-heading font-bold text-[#f6f3db] transition-colors cursor-pointer shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>قفل الإدارة</span>
          </button>
        </div>

        <form onSubmit={handlePublish} className="space-y-6">
          <div>
            <label
              htmlFor="news-title"
              className="block font-heading text-sm font-bold text-[#f6f3db] mb-2"
            >
              عنوان الخبر
            </label>
            <input
              id="news-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={ARTICLE_CONSTRAINTS.TITLE_MAX}
              placeholder="اكتب عنوان الخبر بشكل واضح ومختصر..."
              className="w-full py-3 px-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm sm:text-base focus:outline-none focus:border-[#f6f3db]/60"
            />
          </div>

          {/* Expanded Preset Categories + Custom Category Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-heading text-sm font-bold text-[#f6f3db]">
                القسم / التصنيف
              </span>
              <span className="text-xs text-[#b87333] font-heading font-bold">
                المختار حالياً: {effectiveCategory}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map((preset) => {
                const isSelected =
                  customCategoryText.trim() === '' && category === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPresetCategory(preset)}
                    className={`px-3.5 py-2 rounded-xl font-heading font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#f6f3db] text-[#683424]'
                        : 'bg-[#522416]/55 text-[#f6f3db]/80 hover:bg-[#683424]/75 hover:text-[#f6f3db] border border-[#f6f3db]/14'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="custom-category-input"
                className="block text-xs text-[#f6f3db]/75 mb-1.5"
              >
                أو اكتب اسم قسم مخصص بحرية (لفتح خيارات أكثر خارج القائمة):
              </label>
              <input
                id="custom-category-input"
                type="text"
                value={customCategoryText}
                onChange={(e) => handleCustomCategoryChange(e.target.value)}
                maxLength={ARTICLE_CONSTRAINTS.CATEGORY_MAX}
                placeholder="اكتب أي قسم تريده هنا (مثلاً: شؤون جامعية، صحة وبيئة، برلمان)..."
                className="w-full py-2.5 px-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm focus:outline-none focus:border-[#f6f3db]/60"
              />
            </div>
          </div>

          {/* Official Holiday Options (shown when العطل الرسمية is selected) */}
          {isHolidaySelected && (
            <div className="p-5 rounded-2xl bg-[#522416]/45 border border-[#b87333]/40 space-y-5">
              <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#f6f3db]">
                <CalendarDays className="w-4 h-4 text-[#b87333]" />
                <span>تحديد تفاصيل العطلة الرسمية</span>
              </div>

              <div>
                <span className="block text-xs text-[#f6f3db]/80 mb-2">
                  اختر سبب العطلة:
                </span>
                <div className="flex flex-wrap gap-2">
                  {HOLIDAY_TYPES.map((typeOption) => {
                    const active = holidayType === typeOption;
                    return (
                      <button
                        key={typeOption}
                        type="button"
                        onClick={() => {
                          setHolidayType(typeOption);
                          if (!requiresOccasionDetail(typeOption)) {
                            setHolidayOccasion('');
                          }
                        }}
                        className={`px-4 py-2 rounded-xl font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#f6f3db] text-[#683424]'
                            : 'bg-[#24100a]/65 text-[#f6f3db]/85 hover:bg-[#683424]/70 border border-[#f6f3db]/14'
                        }`}
                      >
                        {typeOption}
                      </button>
                    );
                  })}
                </div>
              </div>

              {requiresOccasionDetail(holidayType) && (
                <div>
                  <label
                    htmlFor="holiday-occasion-input"
                    className="block font-heading text-xs sm:text-sm font-bold text-[#f6f3db] mb-2"
                  >
                    اكتب المناسبة ({holidayType}):
                  </label>
                  <input
                    id="holiday-occasion-input"
                    type="text"
                    value={holidayOccasion}
                    onChange={(e) => setHolidayOccasion(e.target.value)}
                    maxLength={ARTICLE_CONSTRAINTS.HOLIDAY_OCCASION_MAX}
                    placeholder={
                      holidayType === 'مناسبة دينية'
                        ? 'مثال: عيد الفطر المبارك أو الزيارة الأربعينية'
                        : holidayType === 'وفاة'
                          ? 'اكتب سبب أو اسم حالة الوفاة...'
                          : 'اكتب اسم المناسبة الرسمية...'
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-[#24100a]/75 border border-[#f6f3db]/22 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm focus:outline-none focus:border-[#f6f3db]/60"
                  />
                </div>
              )}

              {/* Iraqi Governorates Picker + All Iraq option at the end */}
              <div className="pt-3 border-t border-[#f6f3db]/12 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-heading text-xs sm:text-sm font-bold text-[#f6f3db]">
                    <MapPin className="w-4 h-4 text-[#b87333]" />
                    <span>المحافظات المشمولة بالعطلة فقط:</span>
                  </span>
                  {holidayGovernorates.length > 0 && (
                    <span className="text-xs text-[#b87333] font-heading font-bold">
                      {formatGovernoratesSummary(holidayGovernorates)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {IRAQI_GOVERNORATES.map((gov) => {
                    const isChecked = holidayGovernorates.includes(gov);
                    return (
                      <button
                        key={gov}
                        type="button"
                        onClick={() => handleToggleGovernorate(gov)}
                        className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                          isChecked
                            ? 'bg-[#f6f3db] text-[#683424]'
                            : 'bg-[#24100a]/65 text-[#f6f3db]/80 hover:bg-[#683424]/70 border border-[#f6f3db]/14'
                        }`}
                      >
                        {gov}
                      </button>
                    );
                  })}

                  {/* Final option: جميع أنحاء العراق */}
                  <button
                    type="button"
                    onClick={handleSelectAllIraq}
                    className={`px-4 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      holidayGovernorates.includes(ALL_IRAQ_OPTION)
                        ? 'bg-[#b87333] text-[#24100a]'
                        : 'bg-[#683424]/65 text-[#f6f3db] hover:bg-[#b87333]/80 hover:text-[#24100a] border border-[#b87333]/50'
                    }`}
                  >
                    جميع أنحاء العراق (كل المحافظات)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="news-author"
              className="block font-heading text-sm font-bold text-[#f6f3db] mb-2"
            >
              اسم المحرر
            </label>
            <input
              id="news-author"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={ARTICLE_CONSTRAINTS.AUTHOR_MAX}
              placeholder="مثال: أحمد الدليمي"
              className="w-full py-3 px-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm sm:text-base focus:outline-none focus:border-[#f6f3db]/60"
            />
          </div>

          {/* Image Upload or URL */}
          <div className="space-y-3">
            <label
              htmlFor="news-image-url"
              className="block font-heading text-sm font-bold text-[#f6f3db]"
            >
              صورة الخبر (رفع من الجهاز أو رابط مباشر)
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="news-image-url"
                type="text"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                dir="ltr"
                className="flex-1 py-3 px-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm focus:outline-none focus:border-[#f6f3db]/60"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#683424]/70 hover:bg-[#683424] border border-[#f6f3db]/20 text-[#f6f3db] font-heading font-bold text-sm transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>رفع صورة من الجهاز</span>
              </button>
            </div>

            {imageUrl && (
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#522416]/50 border border-[#f6f3db]/12">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={imageUrl}
                    alt="معاينة صورة الخبر"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover bg-[#24100a] shrink-0"
                  />
                  <span className="text-xs text-[#f6f3db]/80 truncate">
                    {imageUrl.startsWith('data:')
                      ? 'تم إرفاق صورة مضغوطة من الجهاز'
                      : imageUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs font-heading font-bold text-red-300 hover:text-red-200 cursor-pointer shrink-0"
                >
                  إزالة
                </button>
              </div>
            )}
          </div>

          {/* Links with Title Repeater */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-heading text-sm font-bold text-[#f6f3db]">
                <Link2 className="w-4 h-4 text-[#b87333]" />
                <span>إضافة روابط مرفقة مع عناوينها (اختياري)</span>
              </span>
              <button
                type="button"
                onClick={handleAddLink}
                disabled={links.length >= ARTICLE_CONSTRAINTS.MAX_LINKS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#683424]/70 hover:bg-[#683424] border border-[#f6f3db]/18 text-xs font-heading font-bold text-[#f6f3db] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة رابط</span>
              </button>
            </div>

            {links.length > 0 && (
              <div className="space-y-3">
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#24100a]/55 border border-[#f6f3db]/14 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) =>
                          handleUpdateLink(idx, 'title', e.target.value)
                        }
                        maxLength={ARTICLE_CONSTRAINTS.LINK_TITLE_MAX}
                        placeholder="عنوان الرابط (مثال: البيان الرسمي)"
                        aria-label={`عنوان الرابط ${idx + 1}`}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#24100a]/75 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-xs sm:text-sm focus:outline-none focus:border-[#f6f3db]/60"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) =>
                          handleUpdateLink(idx, 'url', e.target.value)
                        }
                        maxLength={ARTICLE_CONSTRAINTS.LINK_URL_MAX}
                        placeholder="https://example.com"
                        dir="ltr"
                        aria-label={`عنوان URL للرابط ${idx + 1}`}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#24100a]/75 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-xs sm:text-sm focus:outline-none focus:border-[#f6f3db]/60"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        aria-label={`حذف الرابط ${idx + 1}`}
                        className="w-9 h-9 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-400/25 flex items-center justify-center text-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="news-content"
              className="block font-heading text-sm font-bold text-[#f6f3db] mb-2"
            >
              نص الخبر الكامل
            </label>
            <textarea
              id="news-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={ARTICLE_CONSTRAINTS.CONTENT_MAX}
              placeholder="اكتب تفاصيل الخبر والتصريحات والمعلومات الكاملة..."
              className="w-full py-3 px-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm sm:text-base leading-relaxed focus:outline-none focus:border-[#f6f3db]/60"
            />
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-400/35 text-red-200 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
              <span>{formError}</span>
            </div>
          )}

          {publishSuccess && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-950/55 border border-emerald-400/35 text-emerald-200 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
              <span>{publishSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-3.5 px-6 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 hover:bg-[#f6f3db]/90 transition-colors cursor-pointer disabled:opacity-60"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{isPublishing ? 'جاري النشر...' : 'نشر الخبر الآن'}</span>
          </button>
        </form>
      </section>

      {/* Published News Management List */}
      <section className="lg:col-span-5 glass-surface rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#f6f3db]/12">
          <div>
            <p className="text-xs font-heading font-bold text-[#b87333] mb-1">
              إدارة المحتوى
            </p>
            <h2 className="font-heading font-extrabold text-xl text-[#f6f3db]">
              الأخبار المنشورة
            </h2>
          </div>
          <span className="text-sm font-heading font-bold text-[#f6f3db]/80 tabular-nums">
            {articles.length}
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="py-10 text-center">
            <ImageIcon className="w-9 h-9 text-[#f6f3db]/35 mx-auto mb-3" />
            <p className="text-sm text-[#f6f3db]/70">
              لا توجد أخبار منشورة حتى الآن.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => {
              const govSummary = formatGovernoratesSummary(
                article.holidayGovernorates
              );
              return (
                <div
                  key={article.id}
                  className="p-4 rounded-2xl bg-[#24100a]/50 border border-[#f6f3db]/12 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#522416]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#522416]/70 flex items-center justify-center shrink-0 text-[#f6f3db]/40">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#f6f3db]/65 mb-1">
                        <span className="text-[#b87333] font-heading font-bold">
                          {article.category}
                        </span>
                        {article.holidayType && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {article.holidayType}
                              {article.holidayOccasion
                                ? ` (${article.holidayOccasion})`
                                : ''}
                            </span>
                          </>
                        )}
                        {govSummary && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{govSummary}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{article.authorName}</span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-[#f6f3db] leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <time className="block text-[11px] text-[#f6f3db]/55 mt-1 tabular-nums">
                        {formatArabicDateTime(article.createdAtMs)}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f6f3db]/10">
                    {confirmDeleteId === article.id ? (
                      <>
                        <span className="text-xs text-red-300 ml-auto">
                          تأكيد الحذف النهائي؟
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg bg-[#683424]/45 text-xs text-[#f6f3db] hover:bg-[#683424] cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === article.id}
                          onClick={() => handleDeleteArticle(article.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600/85 hover:bg-red-600 text-xs font-heading font-bold text-white cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === article.id
                            ? 'جاري الحذف...'
                            : 'نعم، احذف'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(article.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 border border-red-400/25 text-xs font-heading font-bold text-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
