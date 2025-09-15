import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTopButton from './components/ScrollToTopButton';
import TabNavigation from './components/TabNavigation';
import PetsPage from './pages/PetsPage';
import BoardingPage from './pages/BoardingPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <ThemeToggle />
        <Header />
        <main className="pb-8">
          <TabNavigation />
          <Routes>
            <Route path="/" element={<Navigate to="/pets" replace />} />
            <Route path="/pets" element={<PetsPage />} />
            <Route path="/boarding" element={<BoardingPage />} />
          </Routes>
        </main>
        <ScrollToTopButton />
      </div>
    </Router>
  )
}

export default App
