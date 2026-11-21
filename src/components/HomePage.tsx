import React from 'react';
import { ArrowLeft, Newspaper, ShieldCheck } from 'lucide-react';
import { NewsArticle } from '../types/news';
import { BreakingTicker } from './BreakingTicker';
import { NewsCard } from './NewsCard';

interface HomePageProps {
  articles: NewsArticle[];
  loading: boolean;
  onSelectArticle: (article: NewsArticle) => void;
  onGoToAdmin: () => void;
  onGoToNews: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  articles,
  loading,
  onSelectArticle,
  onGoToAdmin,
  onGoToNews,
}) => {
  const leadArticle = articles[0] ?? null;
  const secondaryArticles = articles.slice(1);

  return (
    <div className="space-y-8">
      {/* Top Breaking News Ticker */}
      <BreakingTicker articles={articles} onSelectArticle={onSelectArticle} />

      {/* Editorial Masthead */}
      <section className="glass-surface rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-heading font-bold text-[#b87333] mb-2">
            شبكة سماء أور الإخبارية · UR SKY
          </p>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#f6f3db] leading-snug mb-3">
            تغطية إخبارية موثوقة من قلب الحدث
          </h1>
          <p className="text-sm sm:text-base text-[#f6f3db]/80 leading-relaxed">
            منصة صحفية رقمية متكاملة تنقل أخبار الآثار والتراث، المحليات، المشاريع والإعمار، الرياضة، والأمن والخدمات بموضوعية ووضوح.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onGoToNews}
            className="px-5 py-2.5 rounded-xl bg-[#683424]/70 hover:bg-[#683424] border border-[#f6f3db]/20 text-[#f6f3db] font-heading font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            تصفح أرشيف الأخبار
          </button>
          <button
            type="button"
            onClick={onGoToAdmin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-extrabold text-sm hover:bg-[#f6f3db]/90 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>لوحة الإدارة</span>
          </button>
        </div>
      </section>

      {/* Content Area */}
      {loading ? (
        <div className="glass-surface rounded-3xl p-10 text-center">
          <p className="font-heading text-base text-[#f6f3db]/80">
            جاري تحميل النشرة الإخبارية...
          </p>
        </div>
      ) : articles.length === 0 ? (
        /* Empty State */
        <section className="glass-surface rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#683424]/50 border border-[#f6f3db]/18 flex items-center justify-center text-[#f6f3db]/80 mb-5">
            <Newspaper className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#f6f3db] mb-3">
            لا توجد أخبار منشورة حالياً
          </h2>
          <p className="text-sm sm:text-base text-[#f6f3db]/75 max-w-md leading-relaxed mb-7">
            لم يتم نشر أي مواد إخبارية بعد. يمكنك الانتقال إلى لوحة الإدارة لنشر أول خبر عاجل أو تقرير صحفي على الشبكة.
          </p>
          <button
            type="button"
            onClick={onGoToAdmin}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-extrabold text-sm sm:text-base hover:bg-[#f6f3db]/90 transition-colors cursor-pointer"
          >
            <span>الانتقال إلى لوحة الإدارة</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </section>
      ) : (
        <div className="space-y-8">
          {/* Lead Featured Story */}
          {leadArticle && (
            <section aria-label="الخبر الرئيسي">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-xl text-[#f6f3db]">
                  الخبر الرئيسي
                </h2>
                <span className="text-xs text-[#f6f3db]/65 tabular-nums">
                  إجمالي المنشور: {articles.length}
                </span>
              </div>
              <NewsCard
                article={leadArticle}
                featured
                onSelect={onSelectArticle}
              />
            </section>
          )}

          {/* Secondary Grid */}
          {secondaryArticles.length > 0 && (
            <section aria-label="أحدث الأخبار">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-xl text-[#f6f3db]">
                  أحدث التقارير والأخبار
                </h2>
                <button
                  type="button"
                  onClick={onGoToNews}
                  className="text-sm font-heading font-bold text-[#b87333] hover:text-[#f6f3db] transition-colors cursor-pointer"
                >
                  عرض الكل
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secondaryArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    onSelect={onSelectArticle}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
