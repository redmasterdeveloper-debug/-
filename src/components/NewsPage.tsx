import React, { useMemo, useState } from 'react';
import { Newspaper, Search } from 'lucide-react';
import {
  FILTER_CATEGORIES,
  FilterCategory,
  NewsArticle,
} from '../types/news';
import { NewsCard } from './NewsCard';

interface NewsPageProps {
  articles: NewsArticle[];
  loading: boolean;
  onSelectArticle: (article: NewsArticle) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({
  articles,
  loading,
  onSelectArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('الكل');

  const filteredArticles = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();
    return articles.filter((item) => {
      const matchesCategory =
        selectedCategory === 'الكل' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!queryLower) return true;
      return (
        item.title.toLowerCase().includes(queryLower) ||
        item.content.toLowerCase().includes(queryLower) ||
        item.authorName.toLowerCase().includes(queryLower) ||
        item.category.toLowerCase().includes(queryLower)
      );
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="space-y-7">
      {/* Page Title & Filter Controls */}
      <section className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-heading font-bold text-[#b87333] mb-1.5">
              الأرشيف الإخباري الشامل
            </p>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#f6f3db]">
              صفحة الأخبار والتقارير
            </h1>
          </div>
          <span className="text-xs sm:text-sm text-[#f6f3db]/70 tabular-nums">
            عدد النتائج: {filteredArticles.length}
          </span>
        </div>

        {/* Instant Search Input */}
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في العناوين، نصوص الأخبار، أو اسم المحرر..."
            aria-label="بحث فوري في الأخبار"
            className="w-full py-3.5 pr-11 pl-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/45 text-sm sm:text-base focus:outline-none focus:border-[#f6f3db]/55"
          />
          <Search className="w-5 h-5 text-[#f6f3db]/50 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Category Filter Buttons */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="تصفية الأخبار حسب التصنيف"
        >
          {FILTER_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#f6f3db] text-[#683424]'
                    : 'bg-[#522416]/55 text-[#f6f3db]/80 hover:bg-[#683424]/70 hover:text-[#f6f3db] border border-[#f6f3db]/12'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Results Grid */}
      {loading ? (
        <div className="glass-surface rounded-3xl p-10 text-center">
          <p className="font-heading text-base text-[#f6f3db]/80">
            جاري تحميل الأخبار...
          </p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="glass-surface rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center">
          <Newspaper className="w-10 h-10 text-[#f6f3db]/45 mb-3" />
          <h2 className="font-heading font-bold text-xl text-[#f6f3db] mb-2">
            {articles.length === 0
              ? 'لا توجد أخبار منشورة حالياً'
              : 'لم يتم العثور على أخبار مطابقة لبحثك'}
          </h2>
          <p className="text-sm text-[#f6f3db]/70 max-w-md">
            {articles.length === 0
              ? 'يمكن للمحررين نشر الأخبار من خلال لوحة الإدارة.'
              : 'جرب تغيير كلمات البحث أو اختيار تصنيف آخر من الأعلى.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onSelect={onSelectArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
