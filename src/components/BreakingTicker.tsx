import React from 'react';
import { Radio } from 'lucide-react';
import { NewsArticle } from '../types/news';

interface BreakingTickerProps {
  articles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({
  articles,
  onSelectArticle,
}) => {
  const latestHeadlines = articles.slice(0, 8);

  return (
    <div className="glass-surface rounded-2xl overflow-hidden flex items-stretch shadow-lg">
      {/* Right label in RTL */}
      <div className="bg-[#f6f3db] text-[#683424] px-4 sm:px-5 py-2.5 flex items-center gap-2 shrink-0 font-heading font-extrabold text-xs sm:text-sm">
        <Radio className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">عاجل</span>
      </div>

      {/* Marquee track */}
      <div className="flex-1 overflow-hidden flex items-center py-2.5 px-4">
        {latestHeadlines.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#f6f3db]/80 truncate">
            شبكة سماء أور الإخبارية — نافذتكم الموثوقة للأخبار العاجلة · بانتظار نشر الأخبار من غرفة التحرير
          </p>
        ) : (
          <div className="flex items-center gap-8 whitespace-nowrap animate-ticker-rtl">
            {[...latestHeadlines, ...latestHeadlines].map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => onSelectArticle(item)}
                className="inline-flex items-center gap-3 text-xs sm:text-sm text-[#f6f3db] hover:text-[#b87333] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="text-[#b87333] font-heading font-bold">
                  {item.category}
                </span>
                <span aria-hidden="true" className="text-[#f6f3db]/35">
                  —
                </span>
                <span className="font-medium">{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
