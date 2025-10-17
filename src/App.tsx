import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTopButton from './components/ScrollToTopButton';
import PageShareButton from './components/PageShareButton';
import TabNavigation from './components/TabNavigation';
import PetsPage from './pages/PetsPage';
import BoardingPage from './pages/BoardingPage';
import ItemsPage from './pages/ItemsPage';
import QuestsPage from './pages/QuestsPage';
import QuestDetailPage from './pages/QuestDetailPage';
import CalculatorPage from './pages/CalculatorPage';
import BoardPage from './pages/BoardPage';
import RadontaPage from './pages/RadontaPage';
import { VisitTracker } from './utils/visitTracker';

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideTabNavigation = location.pathname.includes('/quests/') && location.pathname !== '/quests';
  const isRadontaPage = location.pathname === '/radonta';

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

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <ThemeToggle />
      <Header />
      <main className="pb-8">
        {!hideTabNavigation && <TabNavigation />}
        <Routes>
          <Route path="/" element={<Navigate to="/pets" replace />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/boarding" element={<BoardingPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/quests/:questId" element={<QuestDetailPage />} />
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
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
