import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 방문자 추적을 위한 유틸리티 함수들
export class VisitTracker {
  private static readonly COLLECTION_NAME = 'daily_stats';
  private static readonly LOCALSTORAGE_PREFIX = 'stoneage_visit_';

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  private static getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 로컬스토리지에서 오늘 방문 여부 확인
  private static hasVisitedToday(): boolean {
    const todayKey = `${this.LOCALSTORAGE_PREFIX}${this.getTodayString()}`;
    return localStorage.getItem(todayKey) === 'visited';
  }

  // 로컬스토리지에 오늘 방문 기록 저장
  private static markAsVisited(): void {
    const todayKey = `${this.LOCALSTORAGE_PREFIX}${this.getTodayString()}`;
    localStorage.setItem(todayKey, 'visited');
  }

  // 방문자 수 증가 (신규 방문자인 경우에만)
  public static async trackVisit(): Promise<void> {
    // 이미 오늘 방문한 경우 스킵
    if (this.hasVisitedToday()) {
      return;
    }

    try {
      const today = this.getTodayString();
      const docRef = doc(db, this.COLLECTION_NAME, today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 문서가 존재하면 count 증가
        await updateDoc(docRef, {
          count: increment(1)
        });
      } else {
        // 문서가 없으면 새로 생성 (첫 방문자)
        await setDoc(docRef, {
          date: today,
          count: 1,
          createdAt: new Date()
        });
      }

      // 로컬스토리지에 방문 기록 저장
      this.markAsVisited();
    } catch (error) {
      console.error('방문자 추적 중 오류:', error);
    }
  }

  // 일별 방문자 수 조회 (관리자용)
  public static async getDailyStats(dateString?: string): Promise<number> {
    try {
      const targetDate = dateString || this.getTodayString();
      const docRef = doc(db, this.COLLECTION_NAME, targetDate);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().count || 0;
      }
      return 0;
    } catch (error) {
      console.error('방문자 수 조회 중 오류:', error);
      return 0;
    }
  }

  // 최근 7일간 방문자 수 조회 (관리자용)
  public static async getWeeklyStats(): Promise<Array<{ date: string; count: number }>> {
    try {
      const results: Array<{ date: string; count: number }> = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = this.formatDate(date);
        const count = await this.getDailyStats(dateString);
        
        results.push({ date: dateString, count });
      }
      
      return results;
    } catch (error) {
      console.error('주간 통계 조회 중 오류:', error);
      return [];
    }
  }

  // 날짜 포맷팅 헬퍼
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}