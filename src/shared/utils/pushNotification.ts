/**
 * 웹 푸시 알림 관리 클래스
 * 판매자가 글을 등록하면 구독하고, 구매/나눔 신청 또는 좋아요 시 알림을 받습니다.
 */

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationManager {
  private baseUrl: string;
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * VAPID 공개키 조회
   */
  async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) return this.vapidPublicKey;

    const response = await fetch(`${this.baseUrl}/push/vapid-public-key`);
    const data = await response.json();

    if (data.success && data.data.publicKey) {
      this.vapidPublicKey = data.data.publicKey;
      return this.vapidPublicKey as string;
    }
    throw new Error('VAPID 공개키 조회 실패');
  }

  /**
   * Base64 URL을 Uint8Array로 변환 (VAPID 키 변환용)
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * 브라우저 푸시 지원 여부 확인
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * 알림 권한 요청
   */
  async requestPermission(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * 현재 알림 권한 상태
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission; // 'granted', 'denied', 'default'
  }

  /**
   * Service Worker 등록 및 푸시 구독 생성
   */
  async subscribe(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
    }

    // 알림 권한 확인
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('알림 권한이 거부되었습니다.');
    }

    // Service Worker 등록 확인
    const registration = await navigator.serviceWorker.ready;

    // VAPID 공개키 조회
    const vapidPublicKey = await this.getVapidPublicKey();
    const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

    // 기존 구독이 있는지 확인
    let subscription = await registration.pushManager.getSubscription();

    // 없으면 새로 생성
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }

    this.subscription = subscription;
    return subscription;
  }

  /**
   * 서버에 구독 등록 (특정 글에 대해)
   */
  async registerSubscription(shareId: number): Promise<{ success: boolean; message: string }> {
    if (!this.subscription) {
      this.subscription = await this.subscribe();
    }

    const response = await fetch(`${this.baseUrl}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId,
        subscription: this.subscription.toJSON() as PushSubscriptionJSON,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '구독 등록 실패');
    }

    return data;
  }

  /**
   * 서버에서 구독 해제
   */
  async unregisterSubscription(shareId: number): Promise<{ success: boolean; message: string }> {
    if (!this.subscription) {
      const existing = await this.getExistingSubscription();
      if (!existing) {
        throw new Error('구독 정보가 없습니다.');
      }
    }

    const response = await fetch(`${this.baseUrl}/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId,
        endpoint: this.subscription!.endpoint,
      }),
    });

    return response.json();
  }

  /**
   * 기존 구독 정보 가져오기
   */
  async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      return this.subscription;
    } catch {
      return null;
    }
  }

  /**
   * 특정 글에 대한 구독 상태 확인 (로컬 스토리지 기반)
   */
  isSubscribedTo(shareId: number): boolean {
    const subscriptions = this.getLocalSubscriptions();
    return subscriptions.includes(shareId);
  }

  /**
   * 로컬 구독 목록 저장
   */
  saveLocalSubscription(shareId: number): void {
    const subscriptions = this.getLocalSubscriptions();
    if (!subscriptions.includes(shareId)) {
      subscriptions.push(shareId);
      localStorage.setItem('PUSH_SUBSCRIPTIONS', JSON.stringify(subscriptions));
    }
  }

  /**
   * 로컬 구독 목록에서 제거
   */
  removeLocalSubscription(shareId: number): void {
    const subscriptions = this.getLocalSubscriptions();
    const filtered = subscriptions.filter((id) => id !== shareId);
    localStorage.setItem('PUSH_SUBSCRIPTIONS', JSON.stringify(filtered));
  }

  /**
   * 로컬 구독 목록 조회
   */
  private getLocalSubscriptions(): number[] {
    try {
      const stored = localStorage.getItem('PUSH_SUBSCRIPTIONS');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

// 싱글톤 인스턴스 생성
const serverUrl = import.meta.env.VITE_API_URL || 'https://stoneage.pooyas.com';
export const pushManager = new PushNotificationManager(serverUrl);

export default PushNotificationManager;
