import React, { useMemo, useState } from 'react';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import {
  ALL_IRAQ_OPTION,
  HOLIDAY_CATEGORY_NAME,
  HOLIDAY_TYPES,
  HolidayType,
  IRAQI_GOVERNORATES,
  NewsArticle,
} from '../types/news';
import { NewsCard } from './NewsCard';

interface HolidaysPageProps {
  articles: NewsArticle[];
  loading: boolean;
  onSelectArticle: (article: NewsArticle) => void;
  onGoToAdmin: () => void;
}

type HolidayFilter = 'الكل' | HolidayType;

const HOLIDAY_FILTERS: readonly HolidayFilter[] = ['الكل', ...HOLIDAY_TYPES];

export const HolidaysPage: React.FC<HolidaysPageProps> = ({
  articles,
  loading,
  onSelectArticle,
  onGoToAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHolidayType, setSelectedHolidayType] =
    useState<HolidayFilter>('الكل');
  const [selectedGovernorate, setSelectedGovernorate] =
    useState<string>('الكل');

  const holidayArticles = useMemo(() => {
    return articles.filter(
      (item) =>
        item.category === HOLIDAY_CATEGORY_NAME || item.holidayType !== ''
    );
  }, [articles]);

  const filteredHolidays = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();
    return holidayArticles.filter((item) => {
      const matchesType =
        selectedHolidayType === 'الكل' ||
        item.holidayType === selectedHolidayType;
      if (!matchesType) return false;

      if (selectedGovernorate !== 'الكل') {
        const govs = item.holidayGovernorates;
        const matchesGov =
          govs.includes(ALL_IRAQ_OPTION) || govs.includes(selectedGovernorate);
        if (!matchesGov) return false;
      }

      if (!queryLower) return true;
      return (
        item.title.toLowerCase().includes(queryLower) ||
        item.content.toLowerCase().includes(queryLower) ||
        item.holidayOccasion.toLowerCase().includes(queryLower) ||
        item.holidayType.toLowerCase().includes(queryLower) ||
        item.holidayGovernorates.some((g) =>
          g.toLowerCase().includes(queryLower)
        )
      );
    });
  }, [
    holidayArticles,
    searchQuery,
    selectedHolidayType,
    selectedGovernorate,
  ]);

  return (
    <div className="space-y-7">
      {/* Official Holidays Header & Filters */}
      <section className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-heading font-bold text-[#b87333] mb-1.5">
              البلاغات والإعلانات الرسمية
            </p>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#f6f3db]">
              قسم العطل الرسمية
            </h1>
            <p className="text-sm text-[#f6f3db]/75 mt-2 max-w-2xl leading-relaxed">
              متابعة فورية لقرارات تعطيل الدوام الرسمي حسب المحافظات أو عموم العراق، سواء بسبب الأمطار والأحوال الجوية أو المناسبات الدينية والوطنية وحالات الوفاة.
            </p>
          </div>
          <span className="text-xs sm:text-sm text-[#f6f3db]/70 tabular-nums shrink-0">
            عدد العطل المعلنة: {filteredHolidays.length}
          </span>
        </div>

        {/* Search + Governorate Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-8">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المناسبة (مثل: عيد الفطر) أو المحافظة أو نص الخبر..."
              aria-label="بحث في العطل الرسمية"
              className="w-full py-3.5 pr-11 pl-4 rounded-xl bg-[#24100a]/65 border border-[#f6f3db]/18 text-[#f6f3db] placeholder:text-[#f6f3db]/45 text-sm sm:text-base focus:outline-none focus:border-[#f6f3db]/55"
            />
            <Search className="w-5 h-5 text-[#f6f3db]/50 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative md:col-span-4">
            <MapPin className="w-4 h-4 text-[#b87333] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              aria-label="تصفية العطل حسب المحافظة"
              className="w-full py-3.5 pr-10 pl-4 rounded-xl bg-[#24100a]/80 border border-[#f6f3db]/18 text-[#f6f3db] text-sm sm:text-base focus:outline-none focus:border-[#f6f3db]/55"
            >
              <option value="الكل" className="bg-[#24100a]">
                عرض جميع المحافظات
              </option>
              {IRAQI_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov} className="bg-[#24100a]">
                  {gov}
                </option>
              ))}
              <option value={ALL_IRAQ_OPTION} className="bg-[#24100a]">
                {ALL_IRAQ_OPTION}
              </option>
            </select>
          </div>
        </div>

        {/* Holiday Reason Filter Buttons */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="تصفية العطل حسب السبب"
        >
          {HOLIDAY_FILTERS.map((filter) => {
            const isActive = selectedHolidayType === filter;
            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedHolidayType(filter)}
                className={`px-4 py-2 rounded-xl font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#f6f3db] text-[#683424]'
                    : 'bg-[#522416]/55 text-[#f6f3db]/80 hover:bg-[#683424]/70 hover:text-[#f6f3db] border border-[#f6f3db]/12'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </section>

      {/* Holiday Cards */}
      {loading ? (
        <div className="glass-surface rounded-3xl p-10 text-center">
          <p className="font-heading text-base text-[#f6f3db]/80">
            جاري تحميل أخبار العطل الرسمية...
          </p>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="glass-surface rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center">
          <CalendarDays className="w-10 h-10 text-[#f6f3db]/45 mb-3" />
          <h2 className="font-heading font-bold text-xl text-[#f6f3db] mb-2">
            {holidayArticles.length === 0
              ? 'لا توجد عطل رسمية منشورة حالياً'
              : 'لا توجد عطل مطابقة للتصفية الحالية'}
          </h2>
          <p className="text-sm text-[#f6f3db]/70 max-w-md mb-6">
            {holidayArticles.length === 0
              ? 'عند نشر خبر جديد ضمن قسم العطل الرسمية من لوحة الإدارة، سيظهر هنا مباشرة مع تفاصيل السبب والمحافظات المشمولة.'
              : 'جرب اختيار محافظة أخرى أو تعديل عبارة البحث.'}
          </p>
          {holidayArticles.length === 0 && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="px-5 py-2.5 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-extrabold text-sm hover:bg-[#f6f3db]/90 transition-colors cursor-pointer"
            >
              نشر عطلة رسمية من لوحة الإدارة
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHolidays.map((article) => (
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
