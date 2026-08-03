import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type EventType = 'PAGE_VIEW' | 'TAB_CLICK' | 'BUTTON_CLICK' | 'DEVICE_INFO' | 'IMPRESSION' | 'SEARCH';

export interface TrackingEvent {
  type: EventType;
  path: string;
  action: string;
  timestamp: number;
}

export class EventTracker {
  private static readonly COLLECTION_NAME = 'detailed_events';
  private static readonly LOCALSTORAGE_KEY = 'stoneage_event_queue';
  private static readonly BATCH_SIZE = 2;

  private static isAdmin(): boolean {
    const adminId = localStorage.getItem('ADMIN_ID_STONE');
    return adminId === 'flowerjunho';
  }

  private static getLocalEvents(): TrackingEvent[] {
    try {
      const data = localStorage.getItem(this.LOCALSTORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalEvents(events: TrackingEvent[]) {
    localStorage.setItem(this.LOCALSTORAGE_KEY, JSON.stringify(events));
  }

  public static async trackEvent(type: EventType, path: string, action: string) {
    if (this.isAdmin()) return; // 관리자는 추적하지 않음

    const events = this.getLocalEvents();
    events.push({
      type,
      path,
      action: action.substring(0, 50), // 액션 텍스트가 너무 길면 자름
      timestamp: Date.now()
    });

    // 임프레션만 있는 경우 5개, 다른 이벤트가 포함된 경우 2개를 기준으로 전송
    const hasNonImpression = events.some(e => e.type !== 'IMPRESSION');
    const flushLimit = hasNonImpression ? this.BATCH_SIZE : 5;

    if (events.length >= flushLimit) {
      await this.flushEvents(events);
    } else {
      this.saveLocalEvents(events);
    }
  }

  private static async flushEvents(events: TrackingEvent[]) {
    if (events.length === 0) return;

    try {
      const groupedByDate: Record<string, Record<string, Record<string, number>>> = {};

      events.forEach(ev => {
        const dateStr = new Date(ev.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
        
        if (!groupedByDate[dateStr]) groupedByDate[dateStr] = {};
        if (!groupedByDate[dateStr][ev.type]) groupedByDate[dateStr][ev.type] = {};
        
        // key formatting
        const rawKey = ev.type === 'PAGE_VIEW' ? ev.path : `${ev.path}::${ev.action}`;
        const safeKey = rawKey.replace(/\//g, '_slash_').replace(/\./g, '_dot_');

        if (!groupedByDate[dateStr][ev.type][safeKey]) {
          groupedByDate[dateStr][ev.type][safeKey] = 0;
        }
        groupedByDate[dateStr][ev.type][safeKey]++;
      });

      for (const [dateStr, types] of Object.entries(groupedByDate)) {
        const docRef = doc(db, this.COLLECTION_NAME, dateStr);
        const docSnap = await getDoc(docRef);

        const updates: Record<string, any> = {};

        for (const [type, keys] of Object.entries(types)) {
          for (const [key, count] of Object.entries(keys)) {
            updates[`${type}.${key}`] = increment(count);
          }
        }

        if (docSnap.exists()) {
          await updateDoc(docRef, updates);
        } else {
          const initData: any = { date: dateStr };
          for (const [type, keys] of Object.entries(types)) {
            initData[type] = {};
            for (const [key, count] of Object.entries(keys)) {
               initData[type][key] = count;
            }
          }
          await setDoc(docRef, initData);
        }
      }

      this.saveLocalEvents([]); // 전송 성공 시 큐 비우기
    } catch (e) {
      console.error('Failed to flush events to firebase', e);
      // 실패 시 다음 기회에 전송하기 위해 유지 (중복 가능성 있으나 데이터 유실보다는 나음)
    }
  }

  // 남은 이벤트 강제 전송 (페이지 이탈 시 등)
  public static async forceFlush() {
    const events = this.getLocalEvents();
    if (events.length > 0) {
      await this.flushEvents(events);
    }
  }

  // 관리자용 통계 조회 함수 (시작일, 종료일)
  public static async getEventStats(startDate: string, endDate: string) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      
      const snap = await getDocs(q);
      const results: any[] = [];
      snap.forEach(doc => {
        results.push(doc.data());
      });
      return results;
    } catch(e) {
      console.error('통계 조회 실패:', e);
      return [];
    }
  }

  // Helper string decoder
  public static decodeKey(safeKey: string) {
    return safeKey.replace(/_slash_/g, '/').replace(/_dot_/g, '.');
  }
}
