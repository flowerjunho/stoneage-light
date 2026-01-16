import { useEffect, useState, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const AUTO_UPDATE_SECONDS = 5;

const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_UPDATE_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // 1시간마다 업데이트 확인
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
      setCountdown(AUTO_UPDATE_SECONDS);

      // 카운트다운 시작
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 5초 후 자동 업데이트
      timerRef.current = setTimeout(() => {
        updateServiceWorker(true);
        setShowPrompt(false);
      }, AUTO_UPDATE_SECONDS * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [needRefresh, updateServiceWorker]);

  const handleUpdate = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    updateServiceWorker(true);
    setShowPrompt(false);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] animate-slide-up">
      <div className="bg-bg-secondary/80 backdrop-blur-2xl border border-accent/50 rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-accent/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-xl">🔄</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text-primary mb-1">
              새 버전이 있습니다!
            </h3>
            <p className="text-xs text-text-secondary mb-3">
              {countdown}초 후 자동 업데이트됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/30"
              >
                지금 업데이트
              </button>
              <button
                onClick={handleClose}
                className="px-3 py-1.5 bg-white/10 text-text-secondary text-xs rounded-lg hover:bg-white/20 transition-colors border border-white/10"
              >
                취소
              </button>
            </div>
          </div>
        </div>
        {/* 프로그레스 바 */}
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / AUTO_UPDATE_SECONDS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
