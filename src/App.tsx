import React from 'react';
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

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideTabNavigation = location.pathname.includes('/quests/') && location.pathname !== '/quests';

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
