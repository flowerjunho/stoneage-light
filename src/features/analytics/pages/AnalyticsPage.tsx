import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    const authKey = localStorage.getItem('DASHBOARD_AUTH');
    if (authKey === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = () => {
    if (password === '9999') {
      localStorage.setItem('DASHBOARD_AUTH', 'authenticated');
      setIsAuthenticated(true);
      setShowError(false);
    } else {
      setShowError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="glass rounded-2xl p-8 border border-border/50 shadow-lg">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-xl font-bold text-text-primary">통계</h1>
              <p className="text-sm text-text-muted text-center">접근 권한이 필요합니다</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setShowError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="비밀번호 입력"
                  className="input-base pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {showError && (
                <p className="text-sm text-accent-secondary text-center animate-slide-up">
                  비밀번호가 올바르지 않습니다
                </p>
              )}

              <button onClick={handleSubmit} className="btn-base btn-primary w-full text-sm">
                확인
              </button>

              <button
                onClick={() => navigate('/')}
                className="btn-base btn-ghost w-full text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AnalyticsDashboard />;
};

export default AnalyticsPage;
