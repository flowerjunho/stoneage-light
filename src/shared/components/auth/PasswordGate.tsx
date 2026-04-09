import React, { useState, useCallback } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'SA_LIGHT_AUTH';
const PASSCODE = '5882';

export function isAuthenticated(): boolean {
  return true;
}

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password === PASSCODE) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setAuthed(true);
      } else {
        setError(true);
        setPassword('');
        setTimeout(() => setError(false), 1500);
      }
    },
    [password]
  );

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg-primary">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-tertiary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                error
                  ? 'bg-red-500/20 border-2 border-red-500/50'
                  : 'bg-accent-primary/10 border-2 border-accent-primary/30'
              }`}
            >
              <Lock
                className={`w-7 h-7 transition-colors duration-300 ${
                  error ? 'text-red-400' : 'text-accent-primary'
                }`}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center text-text-primary mb-2">StoneAge Light</h1>
          <p className="text-sm text-center text-text-secondary mb-6">접근 비밀번호를 입력하세요</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호"
                autoFocus
                maxLength={10}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-bg-tertiary border text-text-primary placeholder-text-muted
                  focus:outline-none focus:ring-2 transition-all duration-200 text-center text-lg tracking-widest ${
                    error
                      ? 'border-red-500/50 focus:ring-red-500/30 animate-shake'
                      : 'border-border-primary focus:ring-accent-primary/30 focus:border-accent-primary/50'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">비밀번호가 올바르지 않습니다</p>
            )}

            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
                bg-accent-primary text-white hover:brightness-110 active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              입장하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordGate;
