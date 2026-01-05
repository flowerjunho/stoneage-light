// 커스텀 Service Worker - 푸시 알림 핸들러

// 푸시 알림 수신 처리
self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('푸시 데이터 파싱 실패:', e);
    return;
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data,
    tag: data.data?.type || 'default', // 같은 태그의 알림은 대체됨
    renotify: true, // 같은 태그여도 다시 알림
    actions: [
      { action: 'open', title: '확인하기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 알림 클릭 처리
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') return;

  // 알림에 포함된 URL로 이동
  const urlToOpen = event.notification.data?.url || '/trade';

  // 기본 URL 구성 (HashRouter 사용)
  const baseUrl = self.location.origin + '/stoneage-light/#';
  const fullUrl = baseUrl + urlToOpen;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes('/stoneage-light/') && 'focus' in client) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', function (event) {
  console.log('알림 닫힘:', event.notification.tag);
});
