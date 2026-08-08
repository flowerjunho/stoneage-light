import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// skipWaiting: true 환경에서 새 SW는 waiting 없이 바로 activate되므로
// controllerchange → window.location.reload() (main.tsx)가 주된 갱신 경로.
// 이 컴포넌트는 SW가 waiting 상태로 머무는 예외적 상황의 fallback용.
const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // 1시간마다 SW 업데이트 확인
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // waiting 중인 SW가 감지되면 즉시 skipWaiting 후 reload
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default PWAUpdatePrompt;
