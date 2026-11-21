import React, { useState } from 'react';
import { ArrowUpLeft, Newspaper } from 'lucide-react';
import { NewsArticle, formatArabicDateTime } from '../types/news';

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
  onSelect: (article: NewsArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  featured = false,
  onSelect,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(article.imageUrl?.trim()) && !imgFailed;

  return (
    <article
      className={`glass-surface rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 flex flex-col ${
        featured ? 'lg:grid lg:grid-cols-12 lg:items-stretch' : ''
      }`}
    >
      {/* Media Area */}
      <div
        className={`relative overflow-hidden bg-[#522416]/60 ${
          featured
            ? 'lg:col-span-6 min-h-[240px] lg:min-h-[340px]'
            : 'aspect-[16/10] w-full'
        }`}
      >
        {hasImage ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#683424]/70 via-[#522416]/80 to-[#24100a]">
            <Newspaper className="w-10 h-10 text-[#f6f3db]/45 mb-2" />
            <span className="font-heading text-xs text-[#f6f3db]/60">
              سماء أور الإخبارية
            </span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#24100a]/75 via-transparent to-transparent pointer-events-none"
        />
      </div>

      {/* Content Area */}
      <div
        className={`p-5 sm:p-6 flex flex-col justify-between flex-1 ${
          featured ? 'lg:col-span-6 lg:p-8' : ''
        }`}
      >
        <div>
          {/* Clean Unboxed Metadata (Zero-Pill Rule) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#f6f3db]/70 mb-3">
            <span className="font-heading font-bold text-[#b87333]">
              {article.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{article.authorName}</span>
            <span aria-hidden="true">·</span>
            <time className="tabular-nums">
              {formatArabicDateTime(article.createdAtMs)}
            </time>
          </div>

          <h3
            className={`font-heading font-bold text-[#f6f3db] leading-snug mb-3 ${
              featured ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            }`}
          >
            {article.title}
          </h3>

          <p
            className={`text-[#f6f3db]/80 leading-relaxed ${
              featured ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'
            }`}
          >
            {article.content}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#f6f3db]/12 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelect(article)}
            className="inline-flex items-center gap-2 text-sm font-heading font-bold text-[#f6f3db] hover:text-[#b87333] transition-colors cursor-pointer"
          >
            <span>قراءة التفاصيل الكاملة</span>
            <ArrowUpLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
