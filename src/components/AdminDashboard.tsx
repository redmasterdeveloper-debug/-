import React, { useRef, useState } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  PlusCircle,
  Trash2,
  Upload,
} from 'lucide-react';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  ARTICLE_CONSTRAINTS,
  NEWS_CATEGORIES,
  NewsArticle,
  NewsCategory,
  formatArabicDateTime,
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
  const [category, setCategory] = useState<NewsCategory>(NEWS_CATEGORIES[0]);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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

    const validationError = validateNewsDraft({
      title,
      category,
      authorName,
      content,
      imageUrl,
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
        category,
        authorName: authorName.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim(),
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

        <form onSubmit={handlePublish} className="space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="news-category"
                className="block font-heading text-sm font-bold text-[#f6f3db] mb-2"
              >
                التصنيف
              </label>
              <select
                id="news-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="w-full py-3 px-4 rounded-xl bg-[#24100a]/80 border border-[#f6f3db]/18 text-[#f6f3db] text-sm sm:text-base focus:outline-none focus:border-[#f6f3db]/60"
              >
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#24100a]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
            {articles.map((article) => (
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
