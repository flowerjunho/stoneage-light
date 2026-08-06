import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';

// 구버전 잘못된 root Service Worker 자동 감지 및 제거
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      if (!registration.scope.includes('/stoneage-light/')) {
        registration.unregister().then(() => {
          console.log('Outdated root ServiceWorker unregistered:', registration.scope);
        });
      }
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 데이터를 fresh로 유지
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
      retry: 1, // 실패 시 1회 재시도
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
