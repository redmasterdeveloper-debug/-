import { useEffect, useState } from 'react';
import {
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from './firebase';
import { ActivePage, NewsArticle, NewsCategory } from './types/news';
import { AmbientBackdrop } from './components/AmbientBackdrop';
import { ArticleModal } from './components/ArticleModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './components/HomePage';
import { LoginGateModal } from './components/LoginGateModal';
import { NewsPage } from './components/NewsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UrSkyLogo } from './components/UrSkyLogo';

function AppShell() {
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null
  );

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    const newsQuery = query(
      collection(db, 'news'),
      where('isPublished', '==', true)
    );

    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        const items: NewsArticle[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt as Timestamp | undefined;
          return {
            id: docSnap.id,
            title: String(data.title ?? ''),
            category: (data.category ?? 'محليات') as NewsCategory,
            authorName: String(data.authorName ?? ''),
            content: String(data.content ?? ''),
            imageUrl: String(data.imageUrl ?? ''),
            isPublished: Boolean(data.isPublished),
            createdAtMs: createdAt?.toMillis ? createdAt.toMillis() : 0,
          };
        });

        items.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setArticles(items);
        setArticlesLoading(false);
      },
      (error) => {
        setArticlesLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'news');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleNavigate = (page: ActivePage): void => {
    if (page === 'admin' && !isAdminVerified) {
      setCodeModalOpen(true);
      return;
    }
    setActivePage(page);
  };

  const handleLockButtonClick = (): void => {
    if (isAdminVerified) {
      setActivePage('admin');
    } else {
      setCodeModalOpen(true);
    }
  };

  const handleAdminVerified = (code: string): void => {
    setVerifiedCode(code);
    setIsAdminVerified(true);
    setCodeModalOpen(false);
    setActivePage('admin');
  };

  const handleLockAdmin = (): void => {
    setIsAdminVerified(false);
    setVerifiedCode('');
    if (activePage === 'admin') {
      setActivePage('home');
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen relative bg-[#24100a] text-[#f6f3db] flex flex-col"
    >
      <AmbientBackdrop />

      {/* Top 3-Zone Header */}
      <header className="sticky top-0 z-30 border-b border-[#f6f3db]/14 bg-[#24100a]/65 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Logo (Right in RTL) */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6f3db]/60 rounded-lg"
            aria-label="العودة إلى الرئيسية - سماء أور الإخبارية"
          >
            <UrSkyLogo size="sm" />
          </button>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-heading font-bold"
          >
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activePage === 'home'
                  ? 'text-[#f6f3db] border-[#f6f3db]'
                  : 'text-[#f6f3db]/70 border-transparent hover:text-[#f6f3db]'
              }`}
            >
              الرئيسية
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('news')}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activePage === 'news'
                  ? 'text-[#f6f3db] border-[#f6f3db]'
                  : 'text-[#f6f3db]/70 border-transparent hover:text-[#f6f3db]'
              }`}
            >
              الأخبار
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activePage === 'admin'
                  ? 'text-[#f6f3db] border-[#f6f3db]'
                  : 'text-[#f6f3db]/70 border-transparent hover:text-[#f6f3db]'
              }`}
            >
              لوحة الإدارة
            </button>
          </nav>

          {/* Zone 3: Top-Left 🔐 Admin Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleLockButtonClick}
              aria-label="دخول الإدارة - أدخل الكود السري"
              title="دخول الإدارة"
              className="w-11 h-11 rounded-xl bg-[#683424]/55 hover:bg-[#683424] border border-[#f6f3db]/22 text-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              🔐
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'home' && (
          <HomePage
            articles={articles}
            loading={articlesLoading}
            onSelectArticle={setSelectedArticle}
            onGoToAdmin={() => handleNavigate('admin')}
            onGoToNews={() => handleNavigate('news')}
          />
        )}

        {activePage === 'news' && (
          <NewsPage
            articles={articles}
            loading={articlesLoading}
            onSelectArticle={setSelectedArticle}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard
            isAdminVerified={isAdminVerified}
            adminCode={verifiedCode}
            articles={articles}
            onRequestUnlock={() => setCodeModalOpen(true)}
            onLockAdmin={handleLockAdmin}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="relative z-10 border-t border-[#f6f3db]/12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#f6f3db]/65">
          <span>© 2026 شبكة سماء أور الإخبارية (UR SKY) — جميع الحقوق محفوظة</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="hover:text-[#f6f3db] transition-colors cursor-pointer"
            >
              الرئيسية
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('news')}
              className="hover:text-[#f6f3db] transition-colors cursor-pointer"
            >
              الأخبار
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="hover:text-[#f6f3db] transition-colors cursor-pointer"
            >
              الإدارة
            </button>
          </div>
        </div>
      </footer>

      {/* Secret Code Prompt Modal */}
      <LoginGateModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        onAdminVerified={handleAdminVerified}
      />

      {/* Full Article Reading Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
