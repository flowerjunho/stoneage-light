import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from '@/shared/components/layout/Header';
import ScrollToTopButton from '@/shared/components/ui/ScrollToTopButton';
import PageShareButton from '@/shared/components/ui/PageShareButton';
import PWAUpdatePrompt from '@/shared/components/ui/PWAUpdatePrompt';
import TabNavigation from '@/shared/components/layout/TabNavigation';
import MusicPlayer from '@/features/music/components/MusicPlayer';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import PetsPage from '@/features/pets/pages/PetsPage';
import BoardingPage from '@/features/boarding/pages/BoardingPage';
import ItemsPage from '@/features/items/pages/ItemsPage';
import QuestsPage from '@/features/quests/pages/QuestsPage';
import QuestDetailPage from '@/features/quests/pages/QuestDetailPage';
import NoticePage from '@/features/notice/pages/NoticePage';
import PatchNoteDetailPage from '@/features/notice/pages/PatchNoteDetailPage';
import MapsPage from '@/features/maps/pages/MapsPage';
import MapDetailPage from '@/features/maps/pages/MapDetailPage';
import CalculatorPage from '@/features/calculator/pages/CalculatorPage';
import BoardPage from '@/features/board/pages/BoardPage';
import TipPage from '@/features/tip/pages/TipPage';
import RadontaPage from '@/features/radonta/pages/RadontaPage';
import BattlePage from '@/features/battle/pages/BattlePage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import Dashboard2Page from '@/features/dashboard/pages/Dashboard2Page';
import SharePage from '@/features/share/pages/SharePage';
import GamePage from '@/features/game/pages/GamePage';
import { VisitTracker } from '@/shared/utils/visitTracker';

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideTabNavigation =
    (location.pathname.includes('/quests/') && location.pathname !== '/quests') ||
    (location.pathname.includes('/maps/') && location.pathname !== '/maps') ||
    (location.pathname.includes('/notice/') && location.pathname !== '/notice');
  const isRadontaPage = location.pathname === '/radonta';
  const isBattlePage = location.pathname === '/battle';
  const isDashboardPage = location.pathname === '/dashboard';
  const isDashboard2Page = location.pathname === '/dashboard2';
  const isTradePage = location.pathname === '/trade';

  // 앱 시작 시 방문자 추적
  useEffect(() => {
    // 관리자가 아닌 경우에만 방문자 카운트
    const adminId = localStorage.getItem('ADMIN_ID_STONE');
    const isAdmin = adminId === 'flowerjunho';
    
    if (!isAdmin) {
      VisitTracker.trackVisit().catch(error => {
        console.error('방문자 추적 실패:', error);
      });
    }
  }, []); // 빈 dependency array로 한 번만 실행

  // 라돈타 페이지는 레이아웃 없이 렌더링
  if (isRadontaPage) {
    return (
      <Routes>
        <Route path="/radonta" element={<RadontaPage />} />
      </Routes>
    );
  }

  // 배틀 페이지는 레이아웃 없이 렌더링
  if (isBattlePage) {
    return (
      <Routes>
        <Route path="/battle" element={<BattlePage />} />
      </Routes>
    );
  }

  // 대시보드 페이지는 레이아웃 없이 렌더링
  if (isDashboardPage) {
    return (
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    );
  }

  // 대시보드2 페이지는 레이아웃 없이 렌더링
  if (isDashboard2Page) {
    return (
      <Routes>
        <Route path="/dashboard2" element={<Dashboard2Page />} />
      </Routes>
    );
  }

  // 거래소 페이지는 레이아웃 없이 렌더링
  if (isTradePage) {
    return (
      <Routes>
        <Route path="/trade" element={<SharePage tribe="family" requireAuth={true} title="🏪 형명가 거래소" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Header />
      <main className="pb-8">
        {!hideTabNavigation && <TabNavigation />}
        <Routes>
          <Route path="/" element={<Navigate to="/pets" replace />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/:type/:noteId" element={<PatchNoteDetailPage />} />
          <Route path="/market" element={<SharePage tribe="all" requireAuth={false} title="🏪 거래소" />} />
          <Route path="/auction" element={<SharePage tribe="all" requireAuth={false} title="🏪 거래소" defaultTab="auction" />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/boarding" element={<BoardingPage />} />
          <Route path="/tip" element={<TipPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/quests/:questId" element={<QuestDetailPage />} />
          <Route path="/maps" element={<MapsPage />} />
          <Route path="/maps/:mapId" element={<MapDetailPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/board" element={<BoardPage />} />
        </Routes>
      </main>
      <PageShareButton />
      <ScrollToTopButton />
    </div>
  );
};

function App() {
  // 앱 초기화 시 테마 적용
  useEffect(() => {
    const savedTheme = localStorage.getItem('THEME_TOGGLE_STATE');
    const root = document.documentElement;

    if (savedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, []);

  return (
    <MusicPlayerProvider>
      <Router>
        <AppContent />
        <MusicPlayer />
        <PWAUpdatePrompt />
      </Router>
    </MusicPlayerProvider>
  );
}

export default App;
