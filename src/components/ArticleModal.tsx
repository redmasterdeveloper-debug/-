import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Link2,
  MapPin,
  Newspaper,
  X,
} from 'lucide-react';
import {
  ALL_IRAQ_OPTION,
  NewsArticle,
  formatArabicDateTime,
} from '../types/news';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [article?.id]);

  useEffect(() => {
    if (!article) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [article, onClose]);

  if (!article) return null;

  const hasImage = Boolean(article.imageUrl?.trim()) && !imgFailed;
  const hasAllIraq = article.holidayGovernorates.includes(ALL_IRAQ_OPTION);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#24100a]/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-surface-strong w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar inside modal */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[#24100a]/85 backdrop-blur-xl border-b border-[#f6f3db]/12">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#f6f3db]/75">
            <span className="font-heading font-bold text-[#b87333]">
              {article.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>المحرر: {article.authorName}</span>
            <span aria-hidden="true">·</span>
            <time className="tabular-nums">
              {formatArabicDateTime(article.createdAtMs)}
            </time>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الخبر"
            className="w-10 h-10 rounded-xl bg-[#683424]/45 hover:bg-[#683424]/80 border border-[#f6f3db]/15 flex items-center justify-center text-[#f6f3db] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cover Media */}
        <div className="w-full max-h-[380px] overflow-hidden bg-[#522416]/50">
          {hasImage ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full max-h-[380px] object-cover"
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-br from-[#683424]/60 to-[#24100a]">
              <Newspaper className="w-10 h-10 text-[#f6f3db]/40 mb-2" />
              <span className="font-heading text-xs text-[#f6f3db]/55">
                شبكة سماء أور الإخبارية
              </span>
            </div>
          )}
        </div>

        {/* Full Article Prose */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            {(article.holidayType || article.holidayGovernorates.length > 0) && (
              <div className="mb-4 p-4 rounded-2xl bg-[#683424]/35 border border-[#f6f3db]/16 space-y-2 text-sm text-[#f6f3db]">
                {article.holidayType && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <CalendarDays className="w-5 h-5 text-[#b87333] shrink-0" />
                    <span className="font-heading font-bold">
                      عطلة رسمية · السبب: {article.holidayType}
                    </span>
                    {article.holidayOccasion && (
                      <>
                        <span aria-hidden="true" className="text-[#f6f3db]/40">
                          —
                        </span>
                        <span className="font-heading font-extrabold text-[#f6f3db]">
                          المناسبة: {article.holidayOccasion}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {article.holidayGovernorates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#f6f3db]/85">
                    <MapPin className="w-4 h-4 text-[#b87333] shrink-0" />
                    <span className="font-heading font-bold">
                      المحافظات المشمولة بالعطلة:
                    </span>
                    <span>
                      {hasAllIraq
                        ? 'جميع أنحاء العراق (كافة المحافظات)'
                        : article.holidayGovernorates.join('، ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <h2
              id="article-modal-title"
              className="font-heading font-extrabold text-2xl sm:text-3xl text-[#f6f3db] leading-snug"
            >
              {article.title}
            </h2>
          </div>

          <div className="border-t border-[#f6f3db]/12 pt-6 max-w-prose text-[#f6f3db]/90 text-base sm:text-lg leading-loose whitespace-pre-line">
            {article.content}
          </div>

          {/* Attached Links Section */}
          {article.links.length > 0 && (
            <div className="border-t border-[#f6f3db]/12 pt-6 space-y-3">
              <div className="flex items-center gap-2 font-heading font-bold text-base text-[#f6f3db]">
                <Link2 className="w-4 h-4 text-[#b87333]" />
                <span>الروابط المرفقة</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {article.links.map((link, idx) => (
                  <a
                    key={`${link.url}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#522416]/50 hover:bg-[#683424]/70 border border-[#f6f3db]/16 transition-colors group"
                  >
                    <div className="min-w-0">
                      <span className="block font-heading font-bold text-sm text-[#f6f3db] group-hover:text-white truncate">
                        {link.title}
                      </span>
                      <span
                        className="block text-xs text-[#f6f3db]/60 truncate mt-0.5"
                        dir="ltr"
                      >
                        {link.url}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#b87333] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
